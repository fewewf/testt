import { connect } from 'cloudflare:sockets';

const _cQndIdPFBwdwdfPS = '/t-vip-9026/auth-888999';
const _rcHzgeggsXmfUWrW = '56892533-7dad-324a-b0e8-51040d0d04ad';
const _JeHxQnQHudDPWbyN = 'yx1.9898981.xyz';
const _JsGTkSTJgBtAOVZl = 8443;

// 统一错误处理响应
const _KtFJDaQcgkFDwTLY = (_url, status = 404) => {
    return new Response(JSON.stringify({ timestamp: new Date().toISOString(), status, path: _url.pathname }), { status, headers: { 'Content-Type': 'application/json' } });
};

export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname !== _cQndIdPFBwdwdfPS) return _KtFJDaQcgkFDwTLY(url, 404);
        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response(JSON.stringify({ status: "UP", version: "2.4.5-STABLE" }), { status: 200 });
        }

        const wsPair = new WebSocketPair();
        const [client, server] = Object.values(wsPair);
        server.accept();

        // 核心处理函数调用
        handleVLESS(server).catch(e => console.error(e));

        return new Response(null, { status: 101, webSocket: client });
    }
};

async function handleVLESS(serverWS) {
    const wsReader = _GWHvqQvdiYQMUGEh(serverWS).getReader();
    let remoteSocket = null;
    let vlessRespHeader = null;

    try {
        const { done, value } = await wsReader.read();
        if (done) return;

        const header = _MkxTgzbSwfhpsfJi(value);
        if (header.hasError) throw new Error(header.message);

        vlessRespHeader = new Uint8Array([header.vlessVersion[0], 0]);
        const payload = value.slice(header.rawDataIndex);

        // --- 修复后的连接逻辑 ---
        try {
            // 1. 优先直连 (YouTube/Google等)
            remoteSocket = await connect({ hostname: header.addressRemote, port: header.portRemote }, { allowHalfOpen: true });
        } catch (e) {
            // 2. 如果直连失败 (例如访问 ip.sb 触发 CF 环路)，走 Fallback
            console.log("Entering Fallback for:", header.addressRemote);
            remoteSocket = await connect({ hostname: _JeHxQnQHudDPWbyN, port: _JsGTkSTJgBtAOVZl }, { allowHalfOpen: true });
        }

        // 写入第一包数据
        const writer = remoteSocket.writable.getWriter();
        await writer.write(payload);
        writer.releaseLock();

        // --- 建立双向转发 (保持原始代码的高效循环) ---
        
        // 远程 -> WS
        const remoteToWs = (async () => {
            const reader = remoteSocket.readable.getReader();
            let isFirst = true;
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (isFirst) {
                        // 关键：无论直连还是 Fallback，第一次返回都必须带上 VLESS 响应头
                        const combined = new Uint8Array(vlessRespHeader.length + value.length);
                        combined.set(vlessRespHeader);
                        combined.set(value, vlessRespHeader.length);
                        serverWS.send(combined);
                        isFirst = false;
                    } else {
                        serverWS.send(value);
                    }
                }
            } finally {
                reader.releaseLock();
            }
        })();

        // WS -> 远程
        const wsToRemote = (async () => {
            try {
                while (true) {
                    const { done, value } = await wsReader.read();
                    if (done) break;
                    const writer = remoteSocket.writable.getWriter();
                    await writer.write(value);
                    writer.releaseLock();
                }
            } finally {
                if (remoteSocket) remoteSocket.close();
            }
        })();

        await Promise.race([remoteToWs, wsToRemote]);

    } catch (err) {
        console.error("VLESS Error:", err.message);
    } finally {
        wsReader.releaseLock();
        if (remoteSocket) remoteSocket.close();
        if (serverWS.readyState === 1) serverWS.close();
    }
}

// 以下为你原始代码中的辅助函数，保持不变以确保兼容性
function _GWHvqQvdiYQMUGEh(ws) {
    return new ReadableStream({
        start(controller) {
            ws.addEventListener('message', e => controller.enqueue(new Uint8Array(e.data)));
            ws.addEventListener('close', () => controller.close());
            ws.addEventListener('error', e => controller.error(e));
        }
    });
}

function _MkxTgzbSwfhpsfJi(data) {
    if (data.byteLength < 24) return { hasError: true, message: 'Invalid header' };
    const view = new DataView(data.buffer);
    const uuid = Array.from(new Uint8Array(data.slice(1, 17))).map(b => b.toString(16).padStart(2, '0')).join('');
    if (uuid !== _rcHzgeggsXmfUWrW.replace(/-/g, '')) return { hasError: true, message: 'Unauthorized' };
    let offset = 17;
    const addonsLen = view.getUint8(offset);
    offset += 1 + addonsLen + 1;
    const port = view.getUint16(offset);
    offset += 2;
    const type = view.getUint8(offset);
    offset += 1;
    let address = '';
    if (type === 1) { address = Array.from(new Uint8Array(data.slice(offset, offset + 4))).join('.'); offset += 4; }
    else if (type === 2) { const len = view.getUint8(offset); offset += 1; address = new TextDecoder().decode(data.slice(offset, offset + len)); offset += len; }
    return { hasError: false, addressRemote: address, portRemote: port, rawDataIndex: offset, vlessVersion: new Uint8Array(data.slice(0, 1)) };
}
