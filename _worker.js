import { connect } from 'cloudflare:sockets';

// ================= 配置区 =================
const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';

// 你的 HTTP 代理服务器地址和端口
const PROXY_HOST = 'yx1.9898981.xyz';
const PROXY_PORT = 8443;
// ==========================================

export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname !== SECRET_PATH) {
            return new Response('404 Not Found', { status: 404 });
        }

        const upgradeHeader = request.headers.get('Upgrade');
        if (upgradeHeader !== 'websocket') {
            return new Response('Not Authorized', { status: 401 });
        }

        const [client, server] = Object.values(new WebSocketPair());
        server.accept();
        handleVLESS(server);

        return new Response(null, { status: 101, webSocket: client });
    }
};

async function handleVLESS(ws) {
    let remoteSocket = null;

    ws.addEventListener('message', async (event) => {
        const message = event.data;
        if (remoteSocket) {
            const writer = remoteSocket.writable.getWriter();
            await writer.write(new Uint8Array(message));
            writer.releaseLock();
            return;
        }

        const vlessBuffer = new Uint8Array(message);
        if (vlessBuffer.length < 24) return;

        // UUID 验证
        const clientUUID = Array.from(vlessBuffer.slice(1, 17)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (clientUUID !== UUID.replace(/-/g, '')) {
            ws.close();
            return;
        }

        // 解析目标地址
        const optLen = vlessBuffer[17];
        const port = (vlessBuffer[18 + optLen] << 8) | vlessBuffer[19 + optLen];
        const addrType = vlessBuffer[20 + optLen];
        let address = '';
        let offset = 21 + optLen;

        if (addrType === 1) address = vlessBuffer.slice(offset, offset + 4).join('.');
        else if (addrType === 2) {
            const len = vlessBuffer[offset];
            address = new TextDecoder().decode(vlessBuffer.slice(offset + 1, offset + 1 + len));
            offset += 1 + len;
        }
        const rawData = vlessBuffer.slice(offset);

        // --- 核心：Fallback 逻辑 ---
        try {
            // 1. 尝试直连
            console.log(`尝试直连目标: ${address}:${port}`);
            remoteSocket = await connect({ hostname: address, port: port });
            await remoteSocket.opened;
            console.log("直连成功");
        // ... 前面直连失败后的 catch 逻辑 ...
} catch (err) {
    console.log(`直连失败: ${err.message}，尝试通过代理回退...`);
    try {
        remoteSocket = await connect({ hostname: PROXY_HOST, port: PROXY_PORT });
        await remoteSocket.opened;

        const writer = remoteSocket.writable.getWriter();
        const reader = remoteSocket.readable.getReader();

        // 1. 发送 CONNECT 请求
        const connectHeader = `CONNECT ${address}:${port} HTTP/1.1\r\nHost: ${address}:${port}\r\n\r\n`;
        await writer.write(new TextEncoder().encode(connectHeader));
        writer.releaseLock();

        // 2. 【关键修复】读取并过滤掉代理服务器的 HTTP 200 响应
        // 代理服务器通常会返回 "HTTP/1.1 200 Connection Established\r\n\r\n"
        // 我们需要把这段数据从流中读出来，不发给客户端
        const { value } = await reader.read();
        const responseText = new TextDecoder().decode(value);
        console.log(`代理服务器响应: ${responseText.split('\r\n')[0]}`);
        
        reader.releaseLock(); // 释放 reader，准备进入 pipeTo

    } catch (proxyErr) {
        console.log("直连与代理均失败");
        ws.close();
        return;
    }
}
// ... 后面发送 rawData 和 pipeTo 的逻辑 ...


        // 建立双向流
        ws.send(new Uint8Array([0, 0]));
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
