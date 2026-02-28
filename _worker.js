const FIXED_KEY = 'd14bd0e0-9ade-4824-aa96-03bbe680b4db';
let mainServer = 'yx1.9898981.xyz:8443';

// 备用服务器列表 - 使用可用的服务器
const BACKUP_SERVERS = [
    'proxyip.cf.342688.xyz:443',
    'proxyip.hk.342688.xyz:443',
    'proxyip.jp.342688.xyz:443'
];

// 超时设置
const LINK_TIMEOUT = 5000;
const MAX_RETRY = 2;

export default {
    async fetch(request) {
        try {
            const url = new URL(request.url);
            const upgradeHeader = request.headers.get('Upgrade');
            
            if (upgradeHeader !== 'websocket') {
                return new Response('Hello World!', { status: 200 });
            } else {
                await updateMainServer(request);
                const serverList = await getServerList(request);
                return await handleWebSocket(request, { serverList });
            }
        } catch (error) {
            return new Response(error && error.stack ? error.stack : String(error), { status: 500 });
        }
    },
};

async function getServerList(request) {
    const servers = [];
    
    // 解析主服务器
    const [mainHost, mainPort] = await parseAddress(mainServer);
    servers.push({ host: mainHost, port: mainPort });
    
    // 添加备用服务器
    for (const backup of BACKUP_SERVERS) {
        const [host, port] = await parseAddress(backup);
        servers.push({ host, port });
    }
    
    return servers;
}

async function handleWebSocket(request, config) {
    const { serverList } = config;
    const wsPair = new WebSocketPair();
    const [clientWS, serverWS] = Object.values(wsPair);

    serverWS.accept();

    // Heartbeat
    let heartbeatTimer = setInterval(() => {
        if (serverWS.readyState === WS_STATE_OPEN) {
            try {
                serverWS.send(new Uint8Array(0));
            } catch (e) {}
        }
    }, 30000);

    function stopHeartbeat() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    }

    serverWS.addEventListener('close', stopHeartbeat);
    serverWS.addEventListener('error', stopHeartbeat);

    const earlyData = request.headers.get('sec-websocket-protocol') || '';
    const readableStream = createReadableStream(serverWS, earlyData);
    
    let remoteConn = null;
    let udpWriter = null;
    let isDnsMode = false;
    let currentTarget = null;
    let currentData = null;

    readableStream.pipeTo(new WritableStream({
        async write(dataChunk) {
            // 确保数据格式正确
            let buffer;
            if (dataChunk instanceof ArrayBuffer) {
                buffer = new Uint8Array(dataChunk);
            } else if (dataChunk instanceof Uint8Array) {
                buffer = dataChunk;
            } else if (dataChunk instanceof Blob) {
                buffer = new Uint8Array(await dataChunk.arrayBuffer());
            } else {
                buffer = new Uint8Array(dataChunk);
            }

            // DNS模式
            if (isDnsMode && udpWriter) {
                return udpWriter(buffer);
            }

            // 如果已连接，直接转发数据
            if (remoteConn) {
                try {
                    const writer = remoteConn.writable.getWriter();
                    await writer.write(buffer);
                    writer.releaseLock();
                } catch (err) {
                    closeConnection(remoteConn);
                    throw err;
                }
                return;
            }

            // 解析VLESS头部
            const parseResult = parseVLESSHeader(buffer);
            if (parseResult.hasError) {
                console.log('Header parse error:', parseResult.message);
                throw new Error(parseResult.message);
            }
            
            // 屏蔽特定域名
            if (parseResult.targetAddress.includes(atob('c3BlZWQuY2xvdWRmbGFyZS5jb20='))) {
                throw new Error('Access Denied');
            }

            const responseHeader = new Uint8Array([parseResult.version[0], 0]);
            const clientData = buffer.slice(parseResult.dataOffset);
            
            // 保存目标信息用于重试
            currentTarget = {
                host: parseResult.targetAddress,
                port: parseResult.targetPort
            };
            currentData = clientData;

            // UDP DNS处理
            if (parseResult.isUdp) {
                if (parseResult.targetPort === 53) {
                    isDnsMode = true;
                    const { write } = await handleUDP(serverWS, responseHeader);
                    udpWriter = write;
                    udpWriter(clientData);
                    return;
                } else {
                    throw new Error('UDP only supports port 53');
                }
            }

            // 带超时的TCP连接函数
            async function connectWithTimeout(host, port, timeout = LINK_TIMEOUT) {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeout);

                try {
                    const socket = await connect(
                        { hostname: host, port: port },
                        { signal: controller.signal }
                    );
                    clearTimeout(timer);
                    return socket;
                } catch (err) {
                    clearTimeout(timer);
                    throw err;
                }
            }

            // 尝试连接并发送数据
            async function tryConnect() {
                try {
                    console.log(`Connecting to ${currentTarget.host}:${currentTarget.port}`);
                    remoteConn = await connectWithTimeout(
                        currentTarget.host,
                        currentTarget.port
                    );

                    const writer = remoteConn.writable.getWriter();
                    await writer.write(currentData);
                    writer.releaseLock();

                    // 开始数据传输
                    await transferData(
                        remoteConn,
                        serverWS,
                        responseHeader,
                        serverList
                    );
                } catch (err) {
                    console.log(`Connection failed:`, err.message);
                    closeConnection(remoteConn);
                    remoteConn = null;
                    
                    // 尝试重试
                    await retryConnection(serverWS, responseHeader, 0);
                }
            }

            // 重试函数
            async function retryConnection(ws, header, attempt) {
                if (attempt >= MAX_RETRY || !serverList || serverList.length === 0) {
                    console.log('All retries failed');
                    if (ws.readyState === WS_STATE_OPEN) {
                        ws.close(1011, 'All connections failed');
                    }
                    return;
                }

                // 使用备用服务器
                const proxyServer = serverList[attempt % serverList.length];
                console.log(`Retry attempt ${attempt + 1} with proxy ${proxyServer.host}:${proxyServer.port}`);

                try {
                    // 先连接到代理服务器
                    const proxyConn = await connectWithTimeout(
                        proxyServer.host,
                        proxyServer.port
                    );

                    // 通过代理连接到目标服务器
                    const writer = proxyConn.writable.getWriter();
                    
                    // 构建CONNECT请求
                    const connectReq = `CONNECT ${currentTarget.host}:${currentTarget.port} HTTP/1.1\r\nHost: ${currentTarget.host}:${currentTarget.port}\r\n\r\n`;
                    await writer.write(new TextEncoder().encode(connectReq));
                    
                    // 读取响应
                    const reader = proxyConn.readable.getReader();
                    let response = '';
                    
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        response += new TextDecoder().decode(value);
                        if (response.includes('\r\n\r\n')) {
                            break;
                        }
                    }
                    
                    reader.releaseLock();

                    // 检查连接是否成功
                    if (response.includes('200 Connection established')) {
                        console.log('Proxy connection established');
                        
                        // 发送实际数据
                        await writer.write(currentData);
                        writer.releaseLock();

                        remoteConn = proxyConn;

                        // 开始数据传输
                        await transferData(
                            proxyConn,
                            ws,
                            header,
                            serverList
                        );
                    } else {
                        throw new Error('Proxy connection failed');
                    }
                } catch (err) {
                    console.log(`Retry ${attempt + 1} failed:`, err.message);
                    closeConnection(proxyConn);
                    
                    // 继续下一次重试
                    await retryConnection(ws, header, attempt + 1);
                }
            }

            // 开始初始连接
            await tryConnect();
        },
        close() {
            if (remoteConn) {
                closeConnection(remoteConn);
            }
        }
    })).catch(err => {
        console.log('Stream error:', err.message);
        closeConnection(remoteConn);
    });

    return new Response(null, {
        status: 101,
        webSocket: clientWS,
    });
}

function createReadableStream(ws, earlyData) {
    return new ReadableStream({
        start(controller) {
            let earlyDataSent = false;
            
            ws.addEventListener('message', event => {
                let data = event.data;
                
                if (typeof data === 'string') {
                    controller.enqueue(new TextEncoder().encode(data));
                } else if (data instanceof Blob) {
                    data.arrayBuffer().then(buf => {
                        controller.enqueue(new Uint8Array(buf));
                    });
                } else if (data instanceof ArrayBuffer) {
                    controller.enqueue(new Uint8Array(data));
                } else {
                    controller.enqueue(data);
                }
            });

            ws.addEventListener('close', () => {
                controller.close();
            });

            ws.addEventListener('error', err => {
                controller.error(err);
            });

            // 处理early data
            if (earlyData && earlyData.length > 0 && !earlyDataSent) {
                try {
                    // 解码base64
                    let base64Str = earlyData.replace(/\s/g, '');
                    while (base64Str.length % 4) {
                        base64Str += '=';
                    }
                    base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
                    
                    const decodedStr = atob(base64Str);
                    const bytes = new Uint8Array(decodedStr.length);
                    for (let i = 0; i < decodedStr.length; i++) {
                        bytes[i] = decodedStr.charCodeAt(i);
                    }
                    
                    console.log('Early data decoded length:', bytes.length);
                    controller.enqueue(bytes);
                    earlyDataSent = true;
                } catch (e) {
                    console.log('Early data decode error:', e.message);
                    // 如果解码失败，直接使用
                    const bytes = new Uint8Array(earlyData.length);
                    for (let i = 0; i < earlyData.length; i++) {
                        bytes[i] = earlyData.charCodeAt(i) & 0xFF;
                    }
                    controller.enqueue(bytes);
                }
            }
        }
    });
}

function parseVLESSHeader(buffer) {
    if (buffer.byteLength < 18) {
        return { hasError: true, message: 'Header too short' };
    }

    try {
        // 检查协议版本
        if (buffer[0] !== 0) {
            return { hasError: true, message: 'Invalid protocol version' };
        }

        // 提取UUID
        const keyBytes = new Uint8Array(buffer.slice(1, 17));
        const key = formatKey(keyBytes);

        // 验证UUID
        if (FIXED_KEY && key !== FIXED_KEY) {
            return { hasError: true, message: 'Invalid key' };
        }

        const optionsLen = buffer[17];
        
        if (buffer.byteLength < 18 + optionsLen + 3) {
            return { hasError: true, message: 'Incomplete header' };
        }

        const cmd = buffer[18 + optionsLen];
        let isUdp = false;

        if (cmd === 2) {
            isUdp = true;
        } else if (cmd !== 1) {
            return { hasError: true, message: 'Unsupported command' };
        }

        let offset = 19 + optionsLen;
        
        // 端口
        const port = (buffer[offset] << 8) | buffer[offset + 1];
        offset += 2;

        // 地址类型
        const addrType = buffer[offset++];
        let address = '';
        let addrLen = 0;

        switch (addrType) {
            case 1: // IPv4
                if (buffer.byteLength < offset + 4) {
                    return { hasError: true, message: 'Incomplete IPv4' };
                }
                address = Array.from(buffer.slice(offset, offset + 4)).join('.');
                addrLen = 4;
                break;
                
            case 2: // Domain
                if (buffer.byteLength < offset + 1) {
                    return { hasError: true, message: 'Incomplete domain len' };
                }
                const domainLen = buffer[offset++];
                if (buffer.byteLength < offset + domainLen) {
                    return { hasError: true, message: 'Incomplete domain' };
                }
                const domainBytes = buffer.slice(offset, offset + domainLen);
                address = new TextDecoder().decode(domainBytes);
                addrLen = domainLen;
                break;
                
            case 3: // IPv6
                if (buffer.byteLength < offset + 16) {
                    return { hasError: true, message: 'Incomplete IPv6' };
                }
                const ipv6 = [];
                for (let i = 0; i < 16; i += 2) {
                    const word = (buffer[offset + i] << 8) | buffer[offset + i + 1];
                    ipv6.push(word.toString(16));
                }
                address = ipv6.join(':');
                addrLen = 16;
                break;
                
            default:
                return { hasError: true, message: 'Unsupported address type' };
        }
        
        offset += addrLen;

        return {
            hasError: false,
            targetAddress: address,
            targetPort: port,
            dataOffset: offset,
            version: new Uint8Array([buffer[0]]),
            isUdp: isUdp,
            addrType: addrType
        };
        
    } catch (err) {
        return { hasError: true, message: 'Parse error: ' + err.message };
    }
}

async function transferData(
    remoteSocket,
    webSocket,
    header,
    serverList
) {
    const MAX_FRAGMENT = 128 * 1024;
    let headerSent = false;

    try {
        const reader = remoteSocket.readable.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (webSocket.readyState !== WS_STATE_OPEN) break;

            if (!headerSent) {
                const combined = new Uint8Array(header.byteLength + value.byteLength);
                combined.set(new Uint8Array(header), 0);
                combined.set(new Uint8Array(value), header.byteLength);
                
                let pos = 0;
                while (pos < combined.byteLength) {
                    const end = Math.min(pos + MAX_FRAGMENT, combined.byteLength);
                    webSocket.send(combined.slice(pos, end));
                    pos = end;
                }
                headerSent = true;
            } else {
                let pos = 0;
                while (pos < value.byteLength) {
                    const end = Math.min(pos + MAX_FRAGMENT, value.byteLength);
                    webSocket.send(value.slice(pos, end));
                    pos = end;
                }
            }
        }

        reader.releaseLock();

        if (webSocket.readyState === WS_STATE_OPEN) {
            webSocket.close(1000, 'Done');
        }
    } catch (err) {
        console.log('Transfer error:', err.message);
        closeConnection(remoteSocket);
    }
}

function closeConnection(socket) {
    if (socket) {
        try {
            socket.close();
        } catch (e) {}
    }
}

function formatKey(bytes) {
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function handleUDP(webSocket, responseHeader) {
    let headerSent = false;

    const transform = new TransformStream({
        transform(chunk, controller) {
            for (let idx = 0; idx < chunk.byteLength;) {
                if (idx + 2 > chunk.byteLength) break;
                const pktLen = (chunk[idx] << 8) | chunk[idx + 1];
                if (idx + 2 + pktLen > chunk.byteLength) break;
                
                const udpData = chunk.slice(idx + 2, idx + 2 + pktLen);
                controller.enqueue(udpData);
                idx = idx + 2 + pktLen;
            }
        }
    });

    transform.readable.pipeTo(new WritableStream({
        async write(chunk) {
            try {
                const response = await fetch('https://1.1.1.1/dns-query', {
                    method: 'POST',
                    headers: { 'content-type': 'application/dns-message' },
                    body: chunk,
                });

                const result = await response.arrayBuffer();
                const size = result.byteLength;
                const sizeBuf = new Uint8Array([(size >> 8) & 0xff, size & 0xff]);

                if (webSocket.readyState === WS_STATE_OPEN) {
                    if (headerSent) {
                        webSocket.send(await new Blob([sizeBuf, result]).arrayBuffer());
                    } else {
                        webSocket.send(await new Blob([responseHeader, sizeBuf, result]).arrayBuffer());
                        headerSent = true;
                    }
                }
            } catch (err) {}
        }
    })).catch(() => {});

    const writer = transform.writable.getWriter();

    return {
        write(chunk) {
            writer.write(chunk).catch(() => {});
        }
    };
}

const WS_STATE_OPEN = 1;
import { connect } from 'cloudflare:sockets';

async function parseAddress(serverAddr) {
    serverAddr = serverAddr.toLowerCase();
    let host = serverAddr;
    let port = 443;

    if (serverAddr.includes(']:')) {
        const parts = serverAddr.split(']:');
        host = parts[0] + ']';
        port = parseInt(parts[1], 10) || port;
    } else if (serverAddr.includes(':') && !serverAddr.startsWith('[')) {
        const colonIdx = serverAddr.lastIndexOf(':');
        host = serverAddr.slice(0, colonIdx);
        port = parseInt(serverAddr.slice(colonIdx + 1), 10) || port;
    }

    return [host, port];
}

async function updateMainServer(request) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const pathLower = pathname.toLowerCase();

    const match = pathLower.match(/\/(proxyip[.=]|pyip=|ip=)(.+)/);

    if (searchParams.has('proxyip')) {
        const param = searchParams.get('proxyip');
        mainServer = param.includes(',') 
            ? param.split(',')[Math.floor(Math.random() * param.split(',').length)] 
            : param;
        return;
    } else if (match) {
        const param = match[1] === 'proxyip.' 
            ? `proxyip.${match[2]}` 
            : match[2];
        mainServer = param.includes(',') 
            ? param.split(',')[Math.floor(Math.random() * param.split(',').length)] 
            : param;
        return;
    }
}
