import { connect } from 'cloudflare:sockets';

const _cQndIdPFBwdwdfPS = '/t-vip-9026/auth-888999';
const _rcHzgeggsXmfUWrW = '56892533-7dad-324a-b0e8-51040d0d04ad';
const _JeHxQnQHudDPWbyN = 'yx1.9898981.xyz'; 
const _JsGTkSTJgBtAOVZl = 8443;

export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname !== _cQndIdPFBwdwdfPS) return new Response('Not Found', { status: 404 });
        if (request.headers.get('Upgrade') !== 'websocket') return new Response('UP', { status: 200 });

        const wsPair = new WebSocketPair();
        const [client, server] = Object.values(wsPair);
        server.accept();

        handleVLESS(server, request).catch(err => console.error(err));
        return new Response(null, { status: 101, webSocket: client });
    }
};

async function handleVLESS(serverWS, request) {
    const wsReader = new ReadableStream({
        start(controller) {
            serverWS.addEventListener('message', e => controller.enqueue(new Uint8Array(e.data)));
            serverWS.addEventListener('close', () => controller.close());
            serverWS.addEventListener('error', e => controller.error(e));
        }
    }).getReader();

    let remoteSocket = null;
    let vlessHeader = null;

    try {
        const { done, value } = await wsReader.read();
        if (done) return;

        const header = parseVLESSHeader(value);
        if (header.hasError) throw new Error(header.message);

        vlessHeader = new Uint8Array([header.vlessVersion[0], 0]);
        const firstPayload = value.slice(header.rawDataIndex);

        // --- 修复锁定错误的关键函数 ---
        async function tryConnect(host, port) {
            const socket = await connect({ hostname: host, port: port }, { allowHalfOpen: true });
            const writer = socket.writable.getWriter();
            await writer.write(firstPayload);
            writer.releaseLock(); // 必须立即释放锁，供后续 pipeTo 或 writer 使用
            return socket;
        }

        try {
            remoteSocket = await tryConnect(header.addressRemote, header.portRemote);
        } catch (e) {
            console.log("YouTube直连通常不会报错，若报错则走反代");
            remoteSocket = await tryConnect(_JeHxQnQHudDPWbyN, _JsGTkSTJgBtAOVZl);
        }

        // 远程 -> WebSocket (使用 pipeTo 提高性能和稳定性)
        const remoteToWs = remoteSocket.readable.pipeTo(new WritableStream({
            write(chunk) {
                if (vlessHeader) {
                    const combined = new Uint8Array(vlessHeader.length + chunk.length);
                    combined.set(vlessHeader);
                    combined.set(chunk, vlessHeader.length);
                    serverWS.send(combined);
                    vlessHeader = null;
                } else {
                    serverWS.send(chunk);
                }
            },
            close() { serverWS.close(); }
        }));

        // WebSocket -> 远程 (手动循环读取，避免再次出现锁定冲突)
        const wsToRemote = (async () => {
            try {
                while (true) {
                    const { done, value } = await wsReader.read();
                    if (done) break;
                    const writer = remoteSocket.writable.getWriter();
                    await writer.write(value);
                    writer.releaseLock(); // 每次写完立即释放，防止长时间锁定
                }
            } finally {
                remoteSocket.close();
            }
        })();

        await Promise.race([remoteToWs, wsToRemote]);

    } catch (err) {
        console.error("Handler Error:", err.toString());
    } finally {
        if (remoteSocket) remoteSocket.close();
        if (serverWS.readyState === 1) serverWS.close();
    }
}

// 解析逻辑 (保持不变)
function parseVLESSHeader(buffer) {
    if (buffer.byteLength < 24) return { hasError: true, message: 'Short Header' };
    const view = new DataView(buffer.buffer);
    const uuid = Array.from(new Uint8Array(buffer.slice(1, 17))).map(b => b.toString(16).padStart(2, '0')).join('');
    if (uuid !== _rcHzgeggsXmfUWrW.replace(/-/g, '')) return { hasError: true, message: 'Unauthorized' };
    let offset = 17;
    const addonsLen = view.getUint8(offset);
    offset += 1 + addonsLen + 1;
    const port = view.getUint16(offset);
    offset += 2;
    const addrType = view.getUint8(offset);
    offset += 1;
    let address = '';
    if (addrType === 1) {
        address = Array.from(new Uint8Array(buffer.slice(offset, offset + 4))).join('.');
        offset += 4;
    } else if (addrType === 2) {
        const len = view.getUint8(offset);
        offset += 1;
        address = new TextDecoder().decode(buffer.slice(offset, offset + len));
        offset += len;
    }
    return { hasError: false, addressRemote: address, portRemote: port, rawDataIndex: offset, vlessVersion: new Uint8Array(buffer.slice(0, 1)) };
}
