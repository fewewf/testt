import { connect } from 'cloudflare:sockets';

// ===== 核心配置 =====
const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const FIXED_UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';
const PROXY_IP = 'ProxyIP.FR.CMLiussss.net';
const PROXY_PORT = 443;
const IDLE_TIMEOUT = 15000; // 15秒无数据自动断开，防止 loadShed

const API_ERROR_RESPONSE = (url, status = 404) => {
    return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        status: status,
        error: "Resource Error",
        requestId: Math.random().toString(36).substring(2, 10).toUpperCase()
    }), {
        status: status,
        headers: { 'Content-Type': 'application/json', 'Server': 'nginx' }
    });
};

export default {
    async fetch(request) {
        const url = new URL(request.url);
        
        // 1. 严格路径验证
        if (url.pathname !== SECRET_PATH) return API_ERROR_RESPONSE(url, 404);

        // 2. 爬虫基础过滤 (只过滤 python, 放行 Go)
        const ua = (request.headers.get('User-Agent') || '').toLowerCase();
        if (ua.includes('python-requests')) return API_ERROR_RESPONSE(url, 403);

        // 3. 握手协议验证
        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response(JSON.stringify({ status: "UP", heartbeat: Date.now() }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
            });
        }

        const wsPair = new WebSocketPair();
        const [clientWS, serverWS] = Object.values(wsPair);
        serverWS.accept();

        // 核心：处理 WebSocket 逻辑并确保不阻塞主线程
        handleWebSocket(serverWS).catch(e => console.log(`WS_SAFE_EXIT: ${e.message}`));

        return new Response(null, { 
            status: 101, 
            webSocket: clientWS,
            headers: { 'Upgrade': 'websocket' }
        });
    }
};

async function handleWebSocket(serverWS) {
    const wsReadable = createWebSocketReadableStream(serverWS);
    let remoteSocket = null;
    let reader = wsReadable.getReader();

    try {
        const { done, value } = await reader.read();
        if (done) return;

        const result = parseVLESSHeader(value);
        if (result.hasError) throw new Error('VLESS_AUTH_FAIL');

        const vlessHeader = new Uint8Array([result.vlessVersion[0], 0]);
        const firstPayload = value.slice(result.rawDataIndex);

        // 尝试建立远程连接
        try {
            remoteSocket = await connect({ hostname: result.addressRemote, port: result.portRemote }, { allowHalfOpen: true });
        } catch {
            remoteSocket = await connect({ hostname: PROXY_IP, port: PROXY_PORT }, { allowHalfOpen: true });
        }

        const writer = remoteSocket.writable.getWriter();
        await writer.write(firstPayload);
        writer.releaseLock();

        // 双向转发
        const remoteToWs = pipeRemoteToWebSocket(remoteSocket, serverWS, vlessHeader);
        const wsToRemote = pipeWsToRemote(reader, remoteSocket);

        // 任意一端结束即回收
        await Promise.race([remoteToWs, wsToRemote]);

    } catch (err) {
        // 静默处理错误
    } finally {
        // 【关键】强制资源回收，消除 loadShed
        try { reader.releaseLock(); } catch {}
        if (remoteSocket) try { remoteSocket.close(); } catch {}
        if (serverWS.readyState === 1) try { serverWS.close(); } catch {}
    }
}

async function pipeRemoteToWebSocket(remoteSocket, ws, vlessHeader) {
    const reader = remoteSocket.readable.getReader();
    let headerSent = false;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done || ws.readyState !== 1) break;
            if (!headerSent) {
                const combined = new Uint8Array(vlessHeader.byteLength + value.byteLength);
                combined.set(vlessHeader, 0);
                combined.set(value, vlessHeader.byteLength);
                ws.send(combined);
                headerSent = true;
            } else {
                ws.send(value);
            }
        }
    } finally {
        reader.releaseLock();
    }
}

async function pipeWsToRemote(reader, remoteSocket) {
    const writer = remoteSocket.writable.getWriter();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await writer.write(value);
        }
    } finally {
        try { writer.releaseLock(); } catch {}
    }
}

// 辅助解析函数（保持不变但增加稳定性）
function createWebSocketReadableStream(ws) {
    return new ReadableStream({
        start(controller) {
            ws.addEventListener('message', e => controller.enqueue(new Uint8Array(e.data)));
            ws.addEventListener('close', () => controller.close());
            ws.addEventListener('error', () => controller.close());
        }
    });
}

function parseVLESSHeader(buffer) {
    if (buffer.byteLength < 24) return { hasError: true };
    const view = new DataView(buffer.buffer);
    const uuid = Array.from(new Uint8Array(buffer.slice(1, 17))).map(b => b.toString(16).padStart(2, '0')).join('');
    if (uuid !== FIXED_UUID.replace(/-/g, '')) return { hasError: true };
    let offset = 18 + view.getUint8(17);
    const port = view.getUint16(offset + 1);
    const addrType = view.getUint8(offset + 3);
    let address = '';
    offset += 4;
    if (addrType === 1) address = Array.from(new Uint8Array(buffer.slice(offset, offset + 4))).join('.');
    else if (addrType === 2) {
        const len = view.getUint8(offset);
        address = new TextDecoder().decode(buffer.slice(offset + 1, offset + 1 + len));
    }
    return { hasError: false, addressRemote: address, portRemote: port, rawDataIndex: buffer.byteLength, vlessVersion: new Uint8Array(buffer.slice(0, 1)) };
}
