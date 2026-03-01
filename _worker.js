import { connect } from 'cloudflare:sockets';

// --- 配置区 ---
const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';
const PROXY_HOST = 'ProxyIP.FR.CMLiussss.net';
const PROXY_PORT = 443;

// --- 伪装 HTML 页面 (针对爬虫) ---
const ROBOT_HTML = `
<!DOCTYPE html>
<html>
<head><title>API Documentation Center</title></head>
<body style="font-family: sans-serif; line-height: 1.6; padding: 20px;">
    <h1>Enterprise API Gateway - Developer Hub</h1>
    <p>Welcome to our global edge computing interface. This node provides microservices routing and distributed data synchronization.</p>
    <h2>Documentation</h2>
    <ul>
        <li>Core Authentication Protocol v3.2</li>
        <li>Edge Function Deployment Guidelines</li>
        <li>Global Latency Monitoring API</li>
    </ul>
    <footer style="margin-top: 50px; color: #888;">&copy; 2026 EdgeConnect Global Network</footer>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = request.headers.get('User-Agent') || '';

    // 1. 路径不匹配时的伪装逻辑
    if (url.pathname !== SECRET_PATH) {
      // 如果是爬虫访问，返回 HTML 页面进行 SEO 伪装
      if (ua.toLowerCase().includes('bot') || ua.toLowerCase().includes('spider')) {
        return new Response(ROBOT_HTML, {
          headers: { "Content-Type": "text/html; charset=UTF-8" }
        });
      }
      // 否则返回 API 模拟数据
      return new Response(JSON.stringify({
        status: "active",
        node: "edge-service-2026",
        message: "API endpoint is online"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 匹配路径但非 WebSocket (伪装成 405 Method Not Allowed)
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response(JSON.stringify({ error: "Forbidden", message: "Invalid session" }), { 
        status: 403, 
        headers: { "Content-Type": "application/json" }
      });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    handleVLESS(server);

    return new Response(null, { status: 101, webSocket: client });
  },
};

async function handleVLESS(ws) {
  const cleanUUID = UUID.replace(/-/g, '');
  let remoteSocket = null;
  let writer = null;
  let keepAliveTimer = null;

  ws.binaryType = "arraybuffer";

  const closeAll = () => {
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    if (remoteSocket) remoteSocket.close();
    if (ws.readyState === 1) ws.close();
  };

  ws.addEventListener('message', async (event) => {
    try {
      const buf = new Uint8Array(event.data);
      if (!remoteSocket) {
        // --- VLESS 握手与地址解析 ---
        if (buf.length < 24) return ws.close();
        const clientUUID = Array.from(buf.slice(1, 17)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (clientUUID !== cleanUUID) return ws.close();

        const addonLen = buf[17];
        let cursor = 18 + addonLen;
        const command = buf[cursor++]; 
        if (command !== 1) return ws.close(); 

        const port = (buf[cursor] << 8) | buf[cursor + 1];
        cursor += 2;
        const addrType = buf[cursor++];
        let address = '';

        if (addrType === 1) address = buf.slice(cursor, cursor + 4).join('.');
        else if (addrType === 2) {
          const len = buf[cursor];
          address = new TextDecoder().decode(buf.slice(cursor + 1, cursor + 1 + len));
          cursor += 1 + len;
        } else if (addrType === 3) {
          address = Array.from({ length: 8 }, (_, i) => 
            ((buf[cursor + i * 2] << 8) | buf[cursor + i * 2 + 1]).toString(16)
          ).join(':');
          cursor += 16;
        }

        const dataToForward = buf.slice(cursor);
        remoteSocket = await connectWithFallback(address, port, PROXY_HOST, PROXY_PORT);
        writer = remoteSocket.writable.getWriter();
        ws.send(new Uint8Array([0, 0])); 

        // --- 保活与背压优化 ---
        // 使用抖动的心跳时间 (25s-35s) 增加行为随机性
        const jitter = 25000 + Math.random() * 10000;
        keepAliveTimer = setInterval(() => {
          if (ws.readyState === 1) ws.send(new Uint8Array(0)); 
        }, jitter);

        pipeTCP2WS(ws, remoteSocket);
        if (dataToForward.length > 0) await writer.write(dataToForward);
        return;
      }
      await writer.write(buf);
    } catch (err) {
      closeAll();
    }
  });

  ws.addEventListener('close', closeAll);
  ws.addEventListener('error', closeAll);
}

async function connectWithFallback(address, port, proxyHost, proxyPort) {
  try {
    const socket = connect({ hostname: address, port });
    await socket.opened;
    return socket;
  } catch (e) {
    const socket = connect({ hostname: proxyHost, port: proxyPort });
    await socket.opened;
    return socket;
  }
}

async function pipeTCP2WS(ws, socket) {
  const reader = socket.readable.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done || ws.readyState !== 1) break;

      // 大文件背压优化：512KB 水位线
      if (ws.bufferedAmount > 512 * 1024) {
        while (ws.bufferedAmount > 256 * 1024 && ws.readyState === 1) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
      ws.send(value);
    }
  } catch (err) {
  } finally {
    reader.releaseLock();
    if (ws.readyState === 1) ws.close();
  }
}
