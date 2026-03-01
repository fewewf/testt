import { connect } from 'cloudflare:sockets';

const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';
const PROXY_HOST = 'yx1.9898981.xyz';
const PROXY_PORT = 8443;

export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname !== SECRET_PATH) return new Response('Not Found', { status: 404 });
        const upgradeHeader = request.headers.get('Upgrade');
        if (upgradeHeader !== 'websocket') return new Response('Unauthorized', { status: 401 });

        const [client, server] = Object.values(new WebSocketPair());
        server.accept();
        handleVLESS(server);
        return new Response(null, { status: 101, webSocket: client });
    }
};

async function handleVLESS(ws) {
    let remoteSocket = null;
    const cleanUUID = UUID.replace(/-/g, '');

    ws.addEventListener('message', async (event) => {
        const message = event.data;
        if (remoteSocket) {
            const writer = remoteSocket.writable.getWriter();
            await writer.write(new Uint8Array(message));
            writer.releaseLock();
            return;
        }

        const buf = new Uint8Array(message);
        // VLESS 握手包解析
        // 0:版本, 1-16:UUID, 17:addonLen
        const clientUUID = Array.from(buf.slice(1, 17)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (clientUUID !== cleanUUID) { ws.close(); return; }

        const addonLen = buf[17];
        const port = (buf[18 + addonLen] << 8) | buf[19 + addonLen];
        const addrType = buf[20 + addonLen];
        let address = '';
        let offset = 21 + addonLen;

        if (addrType === 1) { // IPv4
            address = buf.slice(offset, offset + 4).join('.');
            offset += 4;
        } else if (addrType === 2) { // Domain
            const domainLen = buf[offset];
            address = new TextDecoder().decode(buf.slice(offset + 1, offset + 1 + domainLen));
            offset += 1 + domainLen;
        } else if (addrType === 3) { // IPv6
            address = Array.from({ length: 8 }, (_, i) => (buf[offset + i * 2] << 8 | buf[offset + i * 2 + 1]).toString(16)).join(':');
            offset += 16;
        }

        const rawData = buf.slice(offset);

        try {
            // 1. 尝试直连 (针对非 CF 保护的 IP)
            console.log(`尝试直连: ${address}:${port}`);
            remoteSocket = await connect({ hostname: address, port: port });
            await remoteSocket.opened;
            ws.send(new Uint8Array([0, 0])); // 发送 VLESS 成功响应
        } catch (err) {
            // 2. 直连失败，回退到 HTTP 代理
            console.log(`直连失败 (${err.message})，回退到代理: ${PROXY_HOST}`);
            try {
                remoteSocket = await connect({ hostname: PROXY_HOST, port: PROXY_PORT });
                await remoteSocket.opened;

                const writer = remoteSocket.writable.getWriter();
                const reader = remoteSocket.readable.getReader();

                // 发送 CONNECT 指令
                const connectHeader = `CONNECT ${address}:${port} HTTP/1.1\r\nHost: ${address}:${port}\r\n\r\n`;
                await writer.write(new TextEncoder().encode(connectHeader));
                writer.releaseLock();

                // 核心修复：吃掉代理服务器的 HTTP 200 响应，防止 SSL 错误
                await reader.read(); 
                reader.releaseLock();

                ws.send(new Uint8Array([0, 0])); // 告诉客户端连接已就绪
            } catch (proxyErr) {
                ws.close();
                return;
            }
        }

        // 发送首包剩余数据
        const writer = remoteSocket.writable.getWriter();
        await writer.write(rawData);
        writer.releaseLock();

        // 双向转发
        remoteSocket.readable.pipeTo(new WritableStream({
            write(chunk) { ws.send(chunk); },
            close() { ws.close(); },
            abort() { ws.close(); }
        })).catch(() => ws.close());
    });

    ws.addEventListener('close', () => { if (remoteSocket) remoteSocket.close(); });
}
