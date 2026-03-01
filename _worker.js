import { connect } from 'cloudflare:sockets';

const AUTH_TOKEN = 'your-secret-token';
const DEFAULT_PROXY_IP = 'yx1.9898981.xyz'; // 建议填入你的后端IP或域名
const DEFAULT_PROXY_PORT = 8443;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const upgradeHeader = request.headers.get('Upgrade');

    // 1. 路径校验：如果路径不对，直接 404，不给扫描器机会
    if (url.pathname !== `/${env.AUTH_TOKEN || AUTH_TOKEN}`) {
      return new Response('Not Found', { status: 404 });
    }

    // 2. 区分 WebSocket 流量与普通网页流量
    if (upgradeHeader !== 'websocket') {
      // 普通浏览器访问，只返回网页，不触发任何 Socket 逻辑
      return new Response(generateFakePage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // 3. 只有是 WebSocket 请求时，才处理隧道
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    try {
      const tcpSocket = connect({
        hostname: env.PROXY_IP || DEFAULT_PROXY_IP,
        port: parseInt(env.PROXY_PORT || DEFAULT_PROXY_PORT),
      });

      // 核心修正：确保逻辑异步执行且不阻塞 fetch 返回
      handleTunnel(server, tcpSocket);

      return new Response(null, { status: 101, webSocket: client });
    } catch (err) {
      return new Response('Proxy Connection Failed', { status: 503 });
    }
  }
};

async function handleTunnel(ws, socket) {
  // 从 TCP 读取 -> 发送给 WS
  const tcpToWs = socket.readable.pipeTo(new WritableStream({
    write(chunk) {
      if (ws.readyState === 1) ws.send(chunk);
    },
    close() { ws.close(); },
    abort() { ws.close(); }
  })).catch(() => {});

  // 从 WS 读取 -> 发送给 TCP
  const wsToTcp = new ReadableStream({
    start(controller) {
      ws.addEventListener('message', e => {
        try { controller.enqueue(e.data); } catch (err) {}
      });
      ws.addEventListener('close', () => {
        try { controller.close(); } catch (e) {}
      });
      ws.addEventListener('error', (err) => {
        try { controller.error(err); } catch (e) {}
      });
    }
  }).pipeTo(socket.writable).catch(() => {});

  // 防止 Stream 报错导致进程崩溃
  await Promise.allSettled([tcpToWs, wsToTcp]);
}

function generateFakePage() {
  return `<html><body style="background:#f0f2f5;font-family:sans-serif;text-align:center;padding-top:50px;">
    <div style="background:white;display:inline-block;padding:40px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
      <h1 style="color:#1a73e8;">Private Gateway</h1>
      <p style="color:#5f6368;">Service Status: <span style="color:#34a853;">Active</span></p>
      <div style="margin-top:20px;font-size:12px;color:#999;">Node: Cloudflare Workers Edge</div>
    </div>
  </body></html>`;
}
