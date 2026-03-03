import { connect } from 'cloudflare:sockets';

// --- [核心配置] ---
const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const FIXED_UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';
const PROXY_IP = 'ProxyIP.FR.CMLiussss.net'; 
const PROXY_PORT = 443;

// --- [伪装配置] ---
const ROBOT_HTML = `<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="padding:50px;"><h1>404 Not Found</h1><p>The resource could not be found.</p></body></html>`;

const WS_READY_STATE_OPEN = 1;

export default {
    async fetch(request) {
        const url = new URL(request.url);
        // 1. 路径验证与伪装
        if (url.pathname !== SECRET_PATH) {
            return new Response(ROBOT_HTML, { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response('System Online', { status: 200 });
        }

        return await handleVLESS(request);
    }
};

async function handleVLESS(request) {
    const wsPair = new WebSocketPair();
    const [clientWS, serverWS] = Object.values(wsPair);
    serverWS.accept();

    const wsReadable = createWebSocketReadableStream(serverWS);
    let remoteSocket = null;

    wsReadable.pipeTo(new WritableStream({
        async write(chunk) {
            if (remoteSocket) {
                const writer = remoteSocket.writable.getWriter();
                await writer.write(chunk);
                writer.releaseLock();
                return;
            }

            const result = parseVLESSHeader(chunk);
            if (result.hasError) throw new Error(result.message);

            const vlessHeader = new Uint8Array([result.vlessVersion[0], 0]);
            const clientData = chunk.slice(result.rawDataIndex);

            // --- [Fallback 核心逻辑] ---
            remoteSocket = await connectWithFallback(result.addressRemote, result.portRemote);
            
            const writer = remoteSocket.writable.getWriter();
            await writer.write(clientData);
            writer.releaseLock();

            // 启动高性能双向管道
            pipeRemoteToWebSocket(remoteSocket, serverWS, vlessHeader);
        }
    })).catch(err => {
        if (serverWS.readyState === WS_READY_STATE_OPEN) serverWS.close();
    });

    return new Response(null, { status: 101, webSocket: clientWS });
}

/**
 * 传统的 Fallback 机制：直连失败后回退到 ProxyIP
 */
async function connectWithFallback(address, port) {
    try {
        // 1. 尝试直连 (承载大流量，如 YouTube 直连成功则速度极快)
        const socket = connect({ hostname: address, port: port }, { allowHalfOpen: true });
        await socket.opened;
        console.log(`Direct connect to ${address} success`);
        return socket;
    } catch (e) {
        // 2. 如果直连失败 (ERR_SSL_PROTOCOL_ERROR 等情况触发的连接中断)
        console.warn(`Direct connect to ${address} failed, falling back to ProxyIP`);
        
        const proxySocket = connect({ hostname: PROXY_IP, port: PROXY_PORT }, { allowHalfOpen: true });
        await proxySocket.opened;
        return proxySocket;
    }
}

/**
 * 高性能管道：移植“正常代码”的分片与快速刷新逻辑
 */
async function pipeRemoteToWebSocket(remoteSocket, ws, vlessHeader) {
    const reader = remoteSocket.readable.getReader();
    let headerSent = false;
    let bufferQueue = [];

    const flush = () => {
        if (ws.readyState !== WS_READY_STATE_OPEN || bufferQueue.length === 0) return;
        const total = bufferQueue.reduce((s, c) => s + c.byteLength, 0);
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const c of bufferQueue) {
            merged.set(c, offset);
            offset += c.byteLength;
        }
        bufferQueue = [];
        
        // 分片发送，确保浏览器 SSL 握手不卡顿
        let i = 0;
        const CHUNK_SIZE = 128 * 1024;
        while (i < merged.byteLength) {
            ws.send(merged.slice(i, i + CHUNK_SIZE));
            i += CHUNK_SIZE;
        }
    };

    const flushTimer = setInterval(flush, 15); // 15ms 快速刷新

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (ws.readyState !== WS_READY_STATE_OPEN) break;

            if (!headerSent) {
                const combined = new Uint8Array(vlessHeader.byteLength + value.byteLength);
                combined.set(vlessHeader, 0);
                combined.set(value, vlessHeader.byteLength);
                bufferQueue.push(combined);
                headerSent = true;
            } else {
                bufferQueue.push(value);
            }
            if (bufferQueue.length > 30) flush(); 
        }
    } finally {
        clearInterval(flushTimer);
        flush();
        reader.releaseLock();
        if (ws.readyState === WS_READY_STATE_OPEN) ws.close();
    }
}

// --- [辅助函数] ---
function createWebSocketReadableStream(ws) {
    return new ReadableStream({
        start(controller) {
            ws.addEventListener('message', e => controller.enqueue(new Uint8Array(e.data)));
            ws.addEventListener('close', () => controller.close());
            ws.addEventListener('error', e => controller.error(e));
        }
    });
}

function parseVLESSHeader(buffer) {
    const view = new DataView(buffer.buffer);
    const uuid = Array.from(new Uint8Array(buffer.slice(1, 17))).map(b => b.toString(16).padStart(2, '0')).join('');
    const cleanUUID = FIXED_UUID.replace(/-/g, '');
    if (uuid !== cleanUUID) return { hasError: true, message: 'Unauthorized' };

    let offset = 18 + view.getUint8(17);
    const cmd = view.getUint8(offset++); 
    const port = view.getUint16(offset); offset += 2;
    const addrType = view.getUint8(offset++);
    let address = '';

    if (addrType === 1) address = Array.from(new Uint8Array(buffer.slice(offset, offset + 4))).join('.');
    else if (addrType === 2) {
        const len = view.getUint8(offset++);
        address = new TextDecoder().decode(buffer.slice(offset, offset + len));
    } else if (addrType === 3) {
        address = Array.from({length:8}, (_,i)=>view.getUint16(offset+i*2).toString(16)).join(':');
    }

    return { hasError: false, addressRemote: address, portRemote: port, rawDataIndex: offset + (addrType === 1 ? 4 : addrType === 2 ? 0 : 16), vlessVersion: new Uint8Array(buffer.slice(0, 1)) };
}
