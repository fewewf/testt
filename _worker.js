import { connect } from 'cloudflare:sockets';

// --- 配置区 ---
const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';
const PROXY_HOST = 'ProxyIP.FR.CMLiussss.net'; // 你的优选IP/代理
const PROXY_PORT = 443;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    // 1. 验证路径与 WebSocket 升级
    if (url.pathname !== SECRET_PATH) return new Response('Not Found', { status: 404 });
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Unauthorized', { status: 401 });

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

  ws.binaryType = "arraybuffer";

  ws.addEventListener('message', async (event) => {
    try {
      const buf = new Uint8Array(event.data);

      if (!remoteSocket) {
        // --- 1. VLESS 协议解析 ---
        if (buf.length < 24) return ws.close();
        const clientUUID = Array.from(buf.slice(1, 17)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (clientUUID !== cleanUUID) return ws.close();

        const addonLen = buf[17];
        let cursor = 18 + addonLen;
        const command = buf[cursor++]; 
        if (command !== 1) return ws.close(); // 只支持 TCP

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
          // IPv6 简易处理
          address = Array.from({ length: 8 }, (_, i) => 
            ((buf[cursor + i * 2] << 8) | buf[cursor + i * 2 + 1]).toString(16)
          ).join(':');
          cursor += 16;
        }

        // --- 2. 核心：建立连接 (含 Fallback 逻辑) ---
        // 这里的 dataToForward 是 VLESS 的首包剩余数据（Payload）
        const dataToForward = buf.slice(cursor);
        remoteSocket = await connectWithFallback(address, port, PROXY_HOST, PROXY_PORT);
        
        writer = remoteSocket.writable.getWriter();
        ws.send(new Uint8Array([0, 0])); // 回复 VLESS 握手成功

        // --- 3. 管道转发 ---
        pipeTCP2WS(ws, remoteSocket);

        // 发送首包中携带的剩余数据
        if (dataToForward.length > 0) {
          await writer.write(dataToForward);
        }
        return;
      }

      // 后续数据直接写入
      await writer.write(buf);
    } catch (err) {
      console.error(`[VLESS Error] ${err.message}`);
      ws.close();
    }
  });
}

/**
 * 核心递归 Fallback 函数
 */
async function connectWithFallback(address, port, proxyHost, proxyPort) {
  try {
    // 尝试直连
    console.log(`Connecting directly to ${address}:${port}`);
    const socket = connect({ hostname: address, port });
    await socket.opened;
    return socket;
  } catch (e) {
    console.error(`Direct connect failed: ${e.message}. Trying Fallback...`);
    
    if (!proxyHost) throw new Error("Direct connect failed and no proxy configured");

    // 【关键修改】：Fallback 时直接连接代理 IP，不发送 HTTP CONNECT
    // 代理 IP (CMLiussss) 会接收到原始 VLESS 数据流并根据其中的目标地址进行转发
    try {
      const socket = connect({ hostname: proxyHost, port: proxyPort });
      await socket.opened;
      console.log(`Fallback connected via ${proxyHost}`);
      return socket;
    } catch (proxyErr) {
      throw new Error(`Fallback failed: ${proxyErr.message}`);
    }
  }
}

function pipeTCP2WS(ws, socket) {
  socket.readable.pipeTo(new WritableStream({
    write(chunk) { 
      if (ws.readyState === 1) ws.send(chunk); 
    },
    close() { ws.close(); },
    abort() { ws.close(); }
  })).catch(() => ws.close());
}
