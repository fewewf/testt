import { connect } from 'cloudflare:sockets';

const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';
const PROXY_HOST = 'yx1.9898981.xyz';
const PROXY_PORT = 8443;

export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname !== SECRET_PATH) return new Response('Not Found', { status: 404 });
        if (request.headers.get('Upgrade') !== 'websocket') return new Response('Unauthorized', { status: 401 });

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
        if (buf.length < 24) return;

        // 1. UUID 校验
        const clientUUID = Array.from(buf.slice(1, 17)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (clientUUID !== cleanUUID) { ws.close(); return; }

        // 2. 这里的解析是关键：跳过 Addon 寻找指令位置
        const addonLen = buf[17];
        let cursor = 18 + addonLen;
        
        // 获取端口和地址类型
        const port = (buf[cursor] << 8) | buf[cursor + 1];
        const addrType = buf[cursor + 2];
        cursor += 3;

        let address = '';
        if (addrType === 1) { // IPv4
            address = buf.slice(cursor, cursor + 4).join('.');
            cursor += 4;
        } else if (addrType === 2) { // Domain
            const domainLen = buf[cursor];
            address = new TextDecoder().decode(buf.slice(cursor + 1, cursor + 1 + domainLen));
            cursor += 1 + domainLen;
        } else if (addrType === 3) { // IPv6
            address = Array.from({ length: 8 }, (_, i) => (buf[cursor + i * 2] << 8 | buf[cursor + i * 2 + 1]).toString(16)).join(':');
            cursor += 16;
        }

        if (!address || port === 0) {
            console.log("解析地址失败，跳过本次连接");
            ws.close();
            return;
        }

        const rawData = buf.slice(cursor);

        try {
            console.log(`发起连接: ${address}:${port}`);
            // 尝试直连
            remoteSocket = await connect({ hostname: address, port: port });
            await remoteSocket.opened;
            ws.send(new Uint8Array([0, 0]));
        } catch (err) {
            console.log(`直连失败，尝试代理回退: ${address}:${port}`);
            try {
                remoteSocket = await connect({ hostname: PROXY_HOST, port: PROXY_PORT });
                await remoteSocket.opened;

                const writer = remoteSocket.writable.getWriter();
                const reader = remoteSocket.readable.getReader();

                await writer.write(new TextEncoder().encode(`CONNECT ${address}:${port} HTTP/1.1\r\nHost: ${address}\r\n\r\n`));
                writer.releaseLock();

                // 消耗掉代理响应 (防止 SSL 错误)
                await reader.read(); 
                reader.releaseLock();
                
                ws.send(new Uint8Array([0, 0]));
            } catch (pErr) {
                ws.close();
                return;
            }
        }

        const writer = remoteSocket.writable.getWriter();
        await writer.write(rawData);
        writer.releaseLock();

        remoteSocket.readable.pipeTo(new WritableStream({
            write(chunk) { ws.send(chunk); },
            close() { ws.close(); },
            abort() { ws.close(); }
        })).catch(() => ws.close());
    });

    ws.addEventListener('close', () => { if (remoteSocket) remoteSocket.close(); });
}
