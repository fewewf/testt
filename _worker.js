const FIXED_KEY = 'd14bd0e0-9ade-4824-aa96-03bbe680b4db';
let mainServer = 'yx1.98981.xyz:8443';

// 备用服务器列表
const BACKUP_SERVERS = [
    'service1.ca.example.net:443',
    'service2.hk.example.net:443',
    'service3.sg.example.net:443',
    'service4.jp.example.net:443',
    'service5.us.example.net:443'
];

// 超时设置
const LINK_TIMEOUT = 5000;
const MAX_RETRY = 3;

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
    
    const [mainHost, mainPort] = await parseAddress(mainServer);
    servers.push({ host: mainHost, port: mainPort });
    
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

    // 获取early data，但不尝试解码
    const earlyData = request.headers.get('sec-websocket-protocol') || '';
    const readableStream = createReadableStream(serverWS, earlyData);
    
    let remoteConn = null;
    let udpWriter = null;
    let isDnsMode = false;

    readableStream.pipeTo(new WritableStream({
        async write(dataChunk) {
            // 确保数据是Uint8Array
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

            // DNS mode
            if (isDnsMode && udpWriter) {
                return udpWriter(buffer);
            }

            // Forward data if connected
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

            // Parse header
            const parseResult = parseHeader(buffer);
            if (parseResult.hasError) {
                console.log('Header parse error:', parseResult.message);
                throw new Error(parseResult.message);
            }
            
            // Block specific domain
            if (parseResult.targetAddress.includes(atob('c3BlZWQuY2xvdWRmbGFyZS5jb20='))) {
                throw new Error('Access Denied');
            }

            const responseHeader = new Uint8Array([parseResult.version[0], 0]);
            
            // 获取客户端数据
            const clientData = buffer.slice(parseResult.dataOffset);
            
            // UDP DNS handling
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

            // TCP connection with timeout
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

            // Connect to target
            try {
                console.log(`Connecting to ${parseResult.targetAddress}:${parseResult.targetPort}`);
                remoteConn = await connectWithTimeout(
                    parseResult.targetAddress,
                    parseResult.targetPort
                );

                const writer = remoteConn.writable.getWriter();
                await writer.write(clientData);
                writer.releaseLock();

                // Start data transfer
                transferData(
                    remoteConn,
                    serverWS,
                    responseHeader,
                    serverList,
                    parseResult.targetAddress,
                    parseResult.targetPort,
                    clientData
                );
            } catch (err) {
                console.log(`Connection failed to ${parseResult.targetAddress}:${parseResult.targetPort}:`, err.message);
                closeConnection(remoteConn);
                serverWS.close(1011, 'Connection error');
            }
        },
        close() {
            if (remoteConn) {
                closeConnection(remoteConn);
            }
        }
    })).catch(err => {
        console.log('Stream error:', err.message);
        closeConnection(remoteConn);
        if (serverWS.readyState === WS_STATE_OPEN) {
            serverWS.close(1011, 'Internal error');
        }
    });

    return new Response(null, {
        status: 101,
        webSocket: clientWS,
    });
}

function createReadableStream(ws, earlyData) {
    return new ReadableStream({
        start(controller) {
            ws.addEventListener('message', event => {
                let data = event.data;
                
                // 处理各种格式
                if (typeof data === 'string') {
                    // 如果是字符串，按文本处理
                    controller.enqueue(new TextEncoder().encode(data));
                } else if (data instanceof Blob) {
                    // 如果是Blob，异步读取
                    data.arrayBuffer().then(buf => {
                        controller.enqueue(new Uint8Array(buf));
                    }).catch(err => {
                        console.log('Blob error:', err);
                    });
                } else if (data instanceof ArrayBuffer) {
                    // 如果是ArrayBuffer，直接使用
                    controller.enqueue(new Uint8Array(data));
                } else {
                    // 其他情况，尝试直接使用
                    controller.enqueue(data);
                }
            });

            ws.addEventListener('close', () => {
                controller.close();
            });

            ws.addEventListener('error', err => {
                controller.error(err);
            });

            // 处理early data - 作为原始二进制数据处理，不尝试解码
            if (earlyData && earlyData.length > 0) {
                try {
                    // 注意：early data 可能包含非ASCII字符
                    // 我们将其作为原始字节处理
                    const bytes = new Uint8Array(earlyData.length);
                    for (let i = 0; i < earlyData.length; i++) {
                        bytes[i] = earlyData.charCodeAt(i) & 0xFF;
                    }
                    console.log('Early data length:', bytes.length);
                    controller.enqueue(bytes);
                } catch (e) {
                    console.log('Early data error:', e.message);
                }
            }
        }
    });
}

function parseHeader(buffer) {
    if (buffer.byteLength < 24) {
        return { hasError: true, message: 'Header too short' };
    }

    try {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const version = new Uint8Array(buffer.slice(0, 1));
        const keyBytes = new Uint8Array(buffer.slice(1, 17));
        const key = formatKey(keyBytes);

        if (FIXED_KEY && key !== FIXED_KEY) {
            return { hasError: true, message: 'Invalid key' };
        }

        const optionsLen = view.getUint8(17);
        const cmd = view.getUint8(18 + optionsLen);
        let isUdp = false;

        if (cmd === 2) {
            isUdp = true;
        } else if (cmd !== 1) {
            return { hasError: true, message: 'Unsupported command' };
        }

        let offset = 19 + optionsLen;
        const port = view.getUint16(offset);
        offset += 2;

        const addrType = view.getUint8(offset++);
        let address = '';

        switch (addrType) {
            case 1: // IPv4
                const ipBytes = new Uint8Array(buffer.slice(offset, offset + 4));
                address = Array.from(ipBytes).join('.');
                offset += 4;
                break;
            case 2: // Domain
                const domainLen = view.getUint8(offset++);
                const domainBytes = new Uint8Array(buffer.slice(offset, offset + domainLen));
                address = new TextDecoder().decode(domainBytes);
                offset += domainLen;
                break;
            case 3: // IPv6
                const ipv6 = [];
                for (let i = 0; i < 8; i++) {
                    ipv6.push(view.getUint16(offset).toString(16));
                    offset += 2;
                }
                address = ipv6.join(':');
                break;
            default:
                return { hasError: true, message: 'Unsupported address type' };
        }

        return {
            hasError: false,
            targetAddress: address,
            targetPort: port,
            dataOffset: offset,
            version: version,
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
    serverList,
    targetHost,
    targetPort,
    initialData,
    retryCount = 0
) {
    const MAX_FRAGMENT = 128 * 1024;
    let headerSent = false;

    try {
        const reader = remoteSocket.readable.getReader();
        let hasData = false;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            hasData = true;

            if (webSocket.readyState !== WS_STATE_OPEN) break;

            if (!headerSent) {
                const combined = new Uint8Array(header.byteLength + value.byteLength);
                combined.set(new Uint8Array(header), 0);
                combined.set(new Uint8Array(value), header.byteLength);
                
                // 分片发送
                let pos = 0;
                while (pos < combined.byteLength) {
                    const end = Math.min(pos + MAX_FRAGMENT, combined.byteLength);
                    webSocket.send(combined.slice(pos, end));
                    pos = end;
                }
                headerSent = true;
            } else {
                // 直接发送数据
                let pos = 0;
                while (pos < value.byteLength) {
                    const end = Math.min(pos + MAX_FRAGMENT, value.byteLength);
                    webSocket.send(value.slice(pos, end));
                    pos = end;
                }
            }
        }

        reader.releaseLock();

        // Retry if no data
        if (!hasData && retryCount < MAX_RETRY && serverList.length > 1) {
            const nextIndex = (retryCount + 1) % serverList.length;
            const nextServer = serverList[nextIndex];

            console.log(`Retry ${nextIndex + 1}: ${nextServer.host}:${nextServer.port}`);

            try {
                const newSocket = await connect({
                    hostname: targetHost,
                    port: targetPort
                });

                const writer = newSocket.writable.getWriter();
                await writer.write(initialData);
                writer.releaseLock();

                await transferData(
                    newSocket,
                    webSocket,
                    header,
                    serverList,
                    targetHost,
                    targetPort,
                    initialData,
                    retryCount + 1
                );
                return;
            } catch (err) {
                console.log('Retry failed:', err.message);
            }
        }

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
                const lenBuf = chunk.slice(idx, idx + 2);
                const pktLen = new DataView(lenBuf.buffer, lenBuf.byteOffset, lenBuf.byteLength).getUint16(0);
                const udpData = new Uint8Array(
                    chunk.slice(idx + 2, idx + 2 + pktLen)
                );
                idx = idx + 2 + pktLen;
                controller.enqueue(udpData);
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

    if (serverAddr.includes('.tp')) {
        const match = serverAddr.match(/\.tp(\d+)/);
        if (match) port = parseInt(match[1], 10);
        return [host, port];
    }

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
