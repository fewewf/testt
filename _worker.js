import { connect } from 'cloudflare:sockets';

const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad'; // 建议定期更换

const PROXY_HOST = 'yx1.9898981.xyz';
const PROXY_PORT = 8443;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 路径校验
    if (url.pathname !== SECRET_PATH)
      return new Response('Not Found', { status: 404 });

    // 协议升级校验
    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Unauthorized', { status: 401 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    handleVLESS(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
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

      // --- 情况 A: 握手阶段 (解析 VLESS Header) ---
      if (!remoteSocket) {
        if (buf.length < 24) return ws.close();

        // 1. UUID 校验
        const clientUUID = Array.from(buf.slice(1, 17))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        if (clientUUID !== cleanUUID) return ws.close();

        // 2. 解析地址信息
        const addonLen = buf[17];
        let cursor = 18 + addonLen;
        const command = buf[cursor++]; // 1: TCP, 2: UDP
        if (command !== 1) return ws.close(); 

        const port = (buf[cursor] << 8) | buf[cursor + 1];
        cursor += 2;

        const addrType = buf[cursor++];
        let address = '';

        if (addrType === 1) { // IPv4
          address = buf.slice(cursor, cursor + 4).join('.');
          cursor += 4;
        } else if (addrType === 2) { // Domain
          const len = buf[cursor];
          address = new TextDecoder().decode(buf.slice(cursor + 1, cursor + 1 + len));
          cursor += 1 + len;
        } else if (addrType === 3) { // IPv6
          address = Array.from({ length: 8 }, (_, i) =>
            ((buf[cursor + i * 2] << 8) | buf[cursor + i * 2 + 1]).toString(16)
          ).join(':');
          cursor += 16;
        }

        if (!address || port === 0) return ws.close();

        // 3. 建立远程连接
        const result = await connectRemote(address, port);
        remoteSocket = result.socket;
        writer = remoteSocket.writable.getWriter();

        // 4. 返回 VLESS 响应 (OK)
        ws.send(new Uint8Array([0, 0]));

        // 5. 启动反向传输 (TCP -> WS)
        pipeTCP2WS(ws, remoteSocket);

        // 6. 处理 Proxy 模式下的剩余数据
        if (result.leftover?.length) {
          ws.send(result.leftover);
        }

        // 7. 发送首包中剩余的应用层数据 (0-RTT)
        const rawData = buf.slice(cursor);
        if (rawData.length > 0) {
          await writer.write(rawData);
        }
        return;
      }

      // --- 情况 B: 转发阶段 (数据透传) ---
      await writer.write(buf);

    } catch (err) {
      console.error("VLESS Handle Error:", err);
      ws.close();
    }
  });

  ws.addEventListener('close', () => {
    if (writer) writer.releaseLock();
    remoteSocket?.close();
  });

  ws.addEventListener('error', () => {
    if (writer) writer.releaseLock();
    remoteSocket?.close();
  });
}

/**
 * 核心连接函数：支持直连和 HTTP CONNECT 代理
 */
async function connectRemote(address, port) {
  try {
    // 尝试直连
    const socket = connect({ hostname: address, port });
    await socket.opened;
    return { socket, leftover: null };
  } catch (e) {
    // 直连失败，走代理
    const socket = connect({ hostname: PROXY_HOST, port: PROXY_PORT });
    await socket.opened;

    const pWriter = socket.writable.getWriter();
    const pReader = socket.readable.getReader();

    // 发送 HTTP CONNECT 握手
    const hello = `CONNECT ${address}:${port} HTTP/1.1\r\nHost: ${address}:${port}\r\n\r\n`;
    await pWriter.write(new TextEncoder().encode(hello));
    pWriter.releaseLock();

    let buf = new Uint8Array(0);
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await pReader.read();
      if (done) throw new Error("Proxy connection closed");

      buf = concat(buf, value);
      const text = decoder.decode(buf);
      const headerEnd = text.indexOf("\r\n\r\n");

      if (headerEnd !== -1) {
        if (!text.includes("200")) throw new Error("Proxy auth failed");
        
        const remain = buf.slice(headerEnd + 4);
        pReader.releaseLock();
        return { socket, leftover: remain };
      }
    }
  }
}

/**
 * TCP 数据流 -> WebSocket 客户端
 */
function pipeTCP2WS(ws, socket) {
  socket.readable.pipeTo(
    new WritableStream({
      write(chunk) {
        if (ws.readyState === 1) ws.send(chunk);
      },
      close() { ws.close(); },
      abort(reason) { ws.close(); },
    })
  ).catch(() => ws.close());
}

function concat(a, b) {
  const c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}
