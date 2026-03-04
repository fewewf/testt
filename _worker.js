import { connect } from 'cloudflare:sockets';

const _cQndIdPFBwdwdfPS = '/t-vip-9026/auth-888999';
const _rcHzgeggsXmfUWrW = '56892533-7dad-324a-b0e8-51040d0d04ad';
const _JeHxQnQHudDPWbyN = 'yx1.98981.xyz'; 
const _JsGTkSTJgBtAOVZl = 8443;

export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname !== _cQndIdPFBwdwdfPS) return new Response('Not Found', { status: 404 });
        if (request.headers.get('Upgrade') !== 'websocket') return new Response('VLESS Service Running', { status: 200 });

        const [client, server] = Object.values(new WebSocketPair());
        server.accept();

        handleVLESS(server).catch(err => console.error("Critical Handle Error:", err.stack || err));

        return new Response(null, { status: 101, webSocket: client });
    }
};

async function handleVLESS(serverWS) {
    // 构造一个更安全的 ReadableStream
    let wsClosed = false;
    const wsReadable = new ReadableStream({
        start(controller) {
            serverWS.addEventListener('message', e => controller.enqueue(new Uint8Array(e.data)));
            serverWS.addEventListener('close', () => { wsClosed = true; controller.close(); });
            serverWS.addEventListener('error', e => { wsClosed = true; controller.error(e); });
        },
        cancel() { wsClosed = true; }
    });

    const reader = wsReadable.getReader();
    let remoteSocket = null;
    let vlessHeader = null;

    try {
        const { done, value } = await reader.read();
        if (done || wsClosed) return;

        const header = parseVLESSHeader(value);
        if (header.hasError) throw new Error(header.message);

        vlessHeader = new Uint8Array([header.vlessVersion[0], 0]);
        const firstPayload = value.slice(header.rawDataIndex);

        // 建立连接函数
        async function connectRemote(host, port) {
            const socket = await connect({ hostname: host, port: port }, { allowHalfOpen: true });
            const writer = socket.writable.getWriter();
            await writer.write(firstPayload);
            writer.releaseLock();
            return socket;
        }

        try {
            remoteSocket = await connectRemote(header.addressRemote, header.portRemote);
        } catch (e) {
            console.log(`直连失败，转向反代节点: ${_JeHxQnQHudDPWbyN}`);
            remoteSocket = await connectRemote(_JeHxQnQHudDPWbyN, _JsGTkSTJgBtAOVZl);
        }

        // 1. 远程 -> WebSocket
        const remoteToWs = remoteSocket.readable.pipeTo(new WritableStream({
            write(chunk) {
                if (serverWS.readyState !== 1) return;
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
            close() { if (!wsClosed) serverWS.close(); }
        }));

        // 2. WebSocket -> 远程 (修复 "Stream is closed" 的关键)
        const wsToRemote = (async () => {
            try {
                while (!wsClosed) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const writer = remoteSocket.writable.getWriter();
                    await writer.write(value);
                    writer.releaseLock();
                }
            } catch (e) {
                console.error("WS to Remote relay error:", e.message);
            } finally {
                if (remoteSocket) remoteSocket.close();
            }
        })();

        await Promise.race([remoteToWs, wsToRemote]);

    } catch (err) {
        console.error("VLESS logic error:", err.toString());
    } finally {
        reader.releaseLock();
        if (remoteSocket) remoteSocket.close();
        if (serverWS.readyState === 1) serverWS.close();
    }
}

function parseVLESSHeader(buffer) {
    if (buffer.byteLength < 24) return { hasError: true, message: 'Invalid VLESS Header' };
    const view = new DataView(buffer.buffer);
    const uuid = Array.from(new Uint8Array(buffer.slice(1, 17))).map(b => b.toString(16).padStart(2, '0')).join('');
    if (uuid !== _rcHzgeggsXmfUWrW.replace(/-/g, '')) return { hasError: true, message: 'Auth Failed' };
    
    let offset = 17;
    const addonsLen = view.getUint8(offset);
    offset += 1 + addonsLen + 1; // cmd
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
