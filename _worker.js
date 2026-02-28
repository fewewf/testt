const FIXED_KEY = 'd14bd0e0-9ade-4824-aa96-03bbe680b4db';
let mainServer = 'yx1.9898981.xyz:8443';

// 备用服务器列表
const BACKUP_SERVERS = [
    'service1.ca.example.net:443',
    'service2.hk.example.net:443',
    'service3.sg.example.net:443',
    'service4.jp.example.net:443',
    'service5.us.example.net:443'
];

// 超时设置
const LINK_TIMEOUT = 3000;
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

    serverWS.addEventListener('close', () => {
        stopHeartbeat();
        serverWS.close(1000, 'Normal closure');
    });

    serverWS.addEventListener('error', () => {
        stopHeartbeat();
        serverWS.close(1011, 'Internal error');
    });

    const earlyData = request.headers.get('sec-websocket-protocol') || '';
    const readableStream = createReadableStream(serverWS, earlyData);
    
    let remoteConn = null;
    let udpWriter = null;
    let isDnsMode = false;

    readableStream.pipeTo(new WritableStream({
        async write(dataChunk) {
            // DNS mode
            if (isDnsMode && udpWriter) {
                return udpWriter(dataChunk);
            }

            // Forward data if connected
            if (remoteConn) {
                try {
                    const writer = remoteConn.writable.getWriter();
                    await writer.write(dataChunk);
                    writer.releaseLock();
                } catch (err) {
                    closeConnection(remoteConn);
                    throw err;
                }
                return;
            }

            // Parse header
            const parseResult = parseHeader(dataChunk);
            if (parseResult.hasError) throw new Error(parseResult.message);
            
            // Block specific domain
            if (parseResult.targetAddress.includes(atob('c3BlZWQuY2xvdWRmbGFyZS5jb20='))) {
                throw new Error('Access Denied');
            }

            const responseHeader = new Uint8Array([parseResult.version[0], 0]);
            const clientData = dataChunk.slice(parseResult.dataOffset);

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
                serverWS.close(1011, 'Connection error: ' + (err && err.message ? err.message : err));
            }
        },
        close() {
            if (remoteConn) {
                closeConnection(remoteConn);
            }
        }
    })).catch(err => {
        closeConnection(remoteConn);
        if (serverWS.readyState === WS_STATE_OPEN) {
            serverWS.close(1011, 'Internal error: ' + (err && err.message ? err.message : err));
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
                if (typeof data === 'string') {
                    data = new TextEncoder().encode(data);
                } else if (data instanceof ArrayBuffer) {
                    data = new Uint8Array(data);
                }
                controller.enqueue(data);
            });

            ws.addEventListener('close', () => {
                controller.close();
            });

            ws.addEventListener('error', err => {
                controller.error(err);
            });

            if (earlyData) {
                try {
                    const decoded = atob(earlyData.replace(/-/g, '+').replace(/_/g, '/'));
                    const data = Uint8Array.from(decoded, c => c.charCodeAt(0));
                    controller.enqueue(data);
                } catch (e) {}
            }
        }
    });
}

function parseHeader(buffer) {
    if (buffer.byteLength < 24) {
        return { hasError: true, message: 'Invalid header length' };
    }

    const view = new DataView(buffer);
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
        case 1:
            address = Array.from(new Uint8Array(buffer.slice(offset, offset + 4))).join('.');
            offset += 4;
            break;
        case 2:
            const domainLen = view.getUint8(offset++);
            address = new TextDecoder().decode(buffer.slice(offset, offset + domainLen));
            offset += domainLen;
            break;
        case 3:
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(view.getUint16(offset).toString(16).padStart(4, '0'));
                offset += 2;
            }
            address = ipv6.join(':').replace(/(^|:)0+(\w)/g, '$1$2');
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
    const MAX_BUFFER = 2 * 1024 * 1024;
    const FLUSH_INTERVAL = 10;

    let headerSent = false;
    let bufferQueue = [];
    let bufferedSize = 0;
    let linkLost = false;

    const mergeBuffers = (buffers) => {
        if (buffers.length === 1) return buffers[0];
        let total = 0;
        for (const buf of buffers) total += buf.byteLength;
        const merged = new Uint8Array(total);
        let pos = 0;
        for (const buf of buffers) {
            merged.set(buf, pos);
            pos += buf.byteLength;
        }
        return merged;
    };

    const sendFragmented = (data) => {
        let pos = 0;
        while (pos < data.byteLength) {
            const end = Math.min(pos + MAX_FRAGMENT, data.byteLength);
            webSocket.send(data.slice(pos, end));
            pos = end;
        }
    };

    const flushQueue = () => {
        if (webSocket.readyState !== WS_STATE_OPEN || bufferQueue.length === 0) return;
        const merged = mergeBuffers(bufferQueue);
        bufferQueue = [];
        bufferedSize = 0;
        sendFragmented(merged);
    };

    const flushTimer = setInterval(flushQueue, FLUSH_INTERVAL);

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
                combined.set(value, header.byteLength);
                bufferQueue.push(combined);
                bufferedSize += combined.byteLength;
                headerSent = true;
            } else {
                bufferQueue.push(value);
                bufferedSize += value.byteLength;
            }

            if (bufferedSize >= MAX_BUFFER) {
                flushQueue();
            }
        }

        reader.releaseLock();
        flushQueue();
        clearInterval(flushTimer);

        // Retry if no data and we have backup servers
        if (!hasData && retryCount < MAX_RETRY && serverList.length > 1) {
            linkLost = true;
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
            } catch (err) {
                console.log('Retry failed:', err.message);
                closeConnection(remoteSocket);
                if (webSocket.readyState === WS_STATE_OPEN) {
                    webSocket.close(1011, 'Retry failed');
                }
            }
            return;
        }

        if (webSocket.readyState === WS_STATE_OPEN && !linkLost) {
            webSocket.close(1000, 'Done');
        }
    } catch (err) {
        clearInterval(flushTimer);
        closeConnection(remoteSocket);
        if (webSocket.readyState === WS_STATE_OPEN) {
            webSocket.close(1011, 'Transfer error');
        }
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
                const pktLen = new DataView(lenBuf).getUint16(0);
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
