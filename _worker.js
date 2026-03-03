import { connect } from 'cloudflare:sockets';

// ===== 核心配置 =====
const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const FIXED_UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';
const PROXY_IP = 'ProxyIP.FR.CMLiussss.net';
const PROXY_PORT = 443;

// ===== 伪装页面 =====
const ROBOT_HTML = `<!DOCTYPE html>
<html>
<head><title>404 Not Found</title></head>
<body style="padding:50px;">
<h1>404 Not Found</h1>
<p>The resource could not be found.</p>
</body>
</html>`;

const WS_READY_STATE_OPEN = 1;

// =========================
// 入口
// =========================
export default {
    async fetch(request) {
        const url = new URL(request.url);

        // 伪装逻辑
        if (url.pathname !== SECRET_PATH) {
            return new Response(ROBOT_HTML, {
                status: 404,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response('System Online', { status: 200 });
        }

        return handleWebSocket(request);
    }
};

// =========================
// WebSocket 主处理
// =========================
async function handleWebSocket(request) {

    const wsPair = new WebSocketPair();
    const [clientWS, serverWS] = Object.values(wsPair);
    serverWS.accept();

    const wsReadable = createWebSocketReadableStream(serverWS);

    let remoteSocket = null;
    let retryTriggered = false;

    wsReadable.pipeTo(new WritableStream({

        async write(chunk) {

            // 已连接后直接透传
            if (remoteSocket) {
                const writer = remoteSocket.writable.getWriter();
                await writer.write(chunk);
                writer.releaseLock();
                return;
            }

            // 解析 VLESS
            const result = parseVLESSHeader(chunk);
            if (result.hasError) throw new Error(result.message);

            const vlessRespHeader = new Uint8Array([result.vlessVersion[0], 0]);
            const rawClientData = chunk.slice(result.rawDataIndex);

            // ===== 关键点1：立即直连 =====
            remoteSocket = await connect({
                hostname: result.addressRemote,
                port: result.portRemote
            }, { allowHalfOpen: true });

            // ===== 关键点2：立即写入 TLS 首包 =====
            const writer = remoteSocket.writable.getWriter();
            await writer.write(rawClientData);
            writer.releaseLock();

            // ===== 启动管道 + fallback 机制 =====
            pipeRemoteToWebSocket(
                remoteSocket,
                serverWS,
                vlessRespHeader,
                async () => {

                    if (retryTriggered) return;
                    retryTriggered = true;

                    try {
                        const fallbackSocket = await connect({
                            hostname: PROXY_IP,
                            port: PROXY_PORT
                        }, { allowHalfOpen: true });

                        remoteSocket = fallbackSocket;

                        const w = fallbackSocket.writable.getWriter();
                        await w.write(rawClientData);
                        w.releaseLock();

                        pipeRemoteToWebSocket(
                            fallbackSocket,
                            serverWS,
                            vlessRespHeader,
                            null
                        );

                    } catch (e) {
                        serverWS.close();
                    }
                }
            );
        },

        close() {
            if (remoteSocket) {
                try { remoteSocket.close(); } catch { }
            }
        }

    })).catch(() => {
        if (serverWS.readyState === WS_READY_STATE_OPEN)
            serverWS.close();
    });

    return new Response(null, {
        status: 101,
        webSocket: clientWS
    });
}

// =========================
// 高性能管道 + 智能 fallback
// =========================
async function pipeRemoteToWebSocket(remoteSocket, ws, vlessHeader, retry) {

    const reader = remoteSocket.readable.getReader();

    let headerSent = false;
    let hasIncomingData = false;
    let bufferQueue = [];
    let bufferedBytes = 0;

    const MAX_CHUNK = 128 * 1024;
    const MAX_BUFFER = 2 * 1024 * 1024;
    const FLUSH_INTERVAL = 10;

    const flush = () => {
        if (ws.readyState !== WS_READY_STATE_OPEN || bufferQueue.length === 0)
            return;

        const total = bufferQueue.reduce((s, c) => s + c.byteLength, 0);
        const merged = new Uint8Array(total);

        let offset = 0;
        for (const c of bufferQueue) {
            merged.set(c, offset);
            offset += c.byteLength;
        }

        bufferQueue = [];
        bufferedBytes = 0;

        let i = 0;
        while (i < merged.byteLength) {
            ws.send(merged.slice(i, i + MAX_CHUNK));
            i += MAX_CHUNK;
        }
    };

    const timer = setInterval(flush, FLUSH_INTERVAL);

    try {
        while (true) {

            const { done, value } = await reader.read();
            if (done) break;

            hasIncomingData = true;

            if (ws.readyState !== WS_READY_STATE_OPEN)
                break;

            if (!headerSent) {
                const combined = new Uint8Array(
                    vlessHeader.byteLength + value.byteLength
                );
                combined.set(vlessHeader, 0);
                combined.set(value, vlessHeader.byteLength);

                bufferQueue.push(combined);
                bufferedBytes += combined.byteLength;
                headerSent = true;
            } else {
                bufferQueue.push(value);
                bufferedBytes += value.byteLength;
            }

            if (bufferedBytes >= MAX_BUFFER)
                flush();
        }

        flush();
        clearInterval(timer);
        reader.releaseLock();

        // ===== 核心 fallback 判断 =====
        if (!hasIncomingData && retry) {
            await retry();
            return;
        }

        if (ws.readyState === WS_READY_STATE_OPEN)
            ws.close();

    } catch {

        clearInterval(timer);
        reader.releaseLock();

        if (retry) {
            await retry();
            return;
        }

        if (ws.readyState === WS_READY_STATE_OPEN)
            ws.close();
    }
}

// =========================
// WebSocket 转 ReadableStream
// =========================
function createWebSocketReadableStream(ws) {
    return new ReadableStream({
        start(controller) {
            ws.addEventListener('message', e => {
                controller.enqueue(new Uint8Array(e.data));
            });
            ws.addEventListener('close', () => controller.close());
            ws.addEventListener('error', e => controller.error(e));
        }
    });
}

// =========================
// VLESS 解析
// =========================
function parseVLESSHeader(buffer) {

    if (buffer.byteLength < 24)
        return { hasError: true, message: 'Invalid header' };

    const view = new DataView(buffer.buffer);

    const uuid = Array.from(
        new Uint8Array(buffer.slice(1, 17))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    if (uuid !== FIXED_UUID.replace(/-/g, ''))
        return { hasError: true, message: 'Unauthorized' };

    const optLen = view.getUint8(17);
    let offset = 18 + optLen;

    const cmd = view.getUint8(offset++);
    const port = view.getUint16(offset); offset += 2;
    const addrType = view.getUint8(offset++);

    let address = '';

    if (addrType === 1) {
        address = Array.from(
            new Uint8Array(buffer.slice(offset, offset + 4))
        ).join('.');
        offset += 4;
    } else if (addrType === 2) {
        const len = view.getUint8(offset++);
        address = new TextDecoder().decode(
            buffer.slice(offset, offset + len)
        );
        offset += len;
    } else if (addrType === 3) {
        address = Array.from({ length: 8 }, (_, i) =>
            view.getUint16(offset + i * 2).toString(16)
        ).join(':');
        offset += 16;
    }

    return {
        hasError: false,
        addressRemote: address,
        portRemote: port,
        rawDataIndex: offset,
        vlessVersion: new Uint8Array(buffer.slice(0, 1))
    };
}
