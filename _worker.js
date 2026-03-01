import { connect } from 'cloudflare:sockets';

const AUTH_TOKEN = 'your-secret-token';
const DEFAULT_PROXY_IP = 'yx1.98981.xyz'; 
const DEFAULT_PROXY_PORT = 8443;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const upgradeHeader = request.headers.get('Upgrade');

    // 1. 严格路径校验
    if (url.pathname !== `/${env.AUTH_TOKEN || AUTH_TOKEN}`) {
      return new Response('Not Found', { status: 404 });
    }

    // 2. 网页访问逻辑 (非 WebSocket)
    if (upgradeHeader !== 'websocket') {
      return new Response(generateFakePage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // 3. WebSocket 逻辑
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    // 延迟连接 TCP，确保 WS 已就绪
    this.handleWebSocket(server, env).catch(err => {
      console.error('Tunnel Error:', err);
      server.close();
    });

    return new Response(null, { status: 101, webSocket: client });
  },

  async handleWebSocket(ws, env) {
    const socket = connect({
      hostname: env.PROXY_IP || DEFAULT_PROXY_IP,
      port: parseInt(env.PROXY_PORT || DEFAULT_PROXY_PORT),
    });

    const writer = socket.writable.getWriter();

    // 从 WebSocket 读取并手动写入 TCP Socket
    ws.addEventListener('message', async (e) => {
      try {
        await writer.write(e.data);
      } catch (err) {
        ws.close();
      }
    });

    ws.addEventListener('close', () => writer.releaseLock());
    ws.addEventListener('error', () => writer.releaseLock());

    // 从 TCP Socket 读取并发送给 WebSocket
    try {
      const reader = socket.readable.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (ws.readyState === 1) {
          ws.send(value);
        } else {
          break;
        }
      }
    } catch (err) {
      // 捕获读取错误
    } finally {
      ws.close();
    }
  }
};

function generateFakePage() {
  return `<html><body style="background:#f7f7f7;font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
    <div style="background:white;padding:30px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);text-align:center;">
      <h2 style="color:#333;margin-top:0;">Node Cluster Status</h2>
      <div style="color:#4CAF50;font-weight:bold;margin:15px 0;">● All Systems Operational</div>
      <p style="color:#666;font-size:14px;">Private API endpoint is active and secure.</p>
    </div>
  </body></html>`;
}
