import { connect } from 'cloudflare:sockets';

const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';

const PROXY_HOST = 'yx1.9898981.xyz';
const PROXY_PORT = 8443;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== SECRET_PATH)
      return new Response('Not Found', { status: 404 });

    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Unauthorized', { status: 401 });

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

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

  ws.binaryType = "arraybuffer";

  ws.addEventListener('message', async (event) => {
    try {
      const buf = new Uint8Array(event.data);

      // ===== 首包：解析 VLESS =====
      if (!remoteSocket) {

        if (buf.length < 24) return ws.close();

        // UUID 校验
        const clientUUID = [...buf.slice(1, 17)]
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        if (clientUUID !== cleanUUID)
          return ws.close();

        // addon
        const addonLen = buf[17];
        let cursor = 18 + addonLen;

        // command
        const command = buf[cursor++];
        if (command !== 1) return ws.close(); // TCP only

        // port
        const port = (buf[cursor] << 8) | buf[cursor + 1];
        cursor += 2;

        // addr type
        const addrType = buf[cursor++];

        let address = '';

        if (addrType === 1) {
          address = buf.slice(cursor, cursor + 4).join('.');
          cursor += 4;
        } else if (addrType === 2) {
          const len = buf[cursor];
          address = new TextDecoder().decode(
            buf.slice(cursor + 1, cursor + 1 + len)
          );
          cursor += 1 + len;
        } else if (addrType === 3) {
          address = Array.from({ length: 8 }, (_, i) =>
            ((buf[cursor + i * 2] << 8) |
              buf[cursor + i * 2 + 1]).toString(16)
          ).join(':');
          cursor += 16;
        }

        if (!address || port === 0)
          return ws.close();

        const rawData = buf.slice(cursor);

        // ===== 建立远程连接 =====
        const result = await connectRemote(address, port);
remoteSocket = result.socket;
        // VLESS OK 响应
        ws.send(new Uint8Array([0, 0]));

        // WS → TCP
        pipeWS2TCP(ws, remoteSocket);
        if (result.leftover && result.leftover.length) {
    ws.send(result.leftover);
}

        // TCP → WS
        pipeTCP2WS(ws, remoteSocket);

        // 发送首包（0-RTT）
        if (rawData.length) {
          const writer = remoteSocket.writable.getWriter();
          await writer.write(rawData);
          writer.releaseLock();
         
        }

        return;
      }

      // ===== 后续数据 =====
      const writer = remoteSocket.writable.getWriter();
      await writer.write(new Uint8Array(event.data));
      writer.releaseLock();

    } catch {
      ws.close();
    }
  });

  ws.addEventListener('close', () => {
    try { remoteSocket?.close(); } catch {}
  });
}

/* -------------------------- */
/*      稳定连接函数           */
/* -------------------------- */

async function connectRemote(address, port) {

  // ---------- 直连 ----------
  try {
    const socket = connect({ hostname: address, port });
    await socket.opened;
    return { socket, leftover: null };
  } catch {}

  // ---------- fallback ----------
  const socket = connect({
    hostname: PROXY_HOST,
    port: PROXY_PORT,
  });

  await socket.opened;

  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();

  await writer.write(
    new TextEncoder().encode(
      `CONNECT ${address}:${port} HTTP/1.1\r\n` +
      `Host: ${address}:${port}\r\n\r\n`
    )
  );

  writer.releaseLock();

  const decoder = new TextDecoder();

  let buf = new Uint8Array(0);

  while (true) {
    const { value, done } = await reader.read();
    if (done) throw new Error("proxy closed");

    buf = concat(buf, value);

    const text = decoder.decode(buf);
    const idx = text.indexOf("\r\n\r\n");

    if (idx !== -1) {

      if (!text.startsWith("HTTP/1.1 200"))
        throw new Error("CONNECT failed");

      const remain = buf.slice(idx + 4);

      reader.releaseLock();

      // ⭐ 返回 leftover，不修改 stream
      return { socket, leftover: remain };
    }
  }
}

function concat(a, b) {
  const c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}

function concatChunks(chunks, total) {
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.length;
  }
  return buf;
}
/* -------------------------- */
/*       Stream Pipes         */
/* -------------------------- */

function pipeTCP2WS(ws, socket) {
  socket.readable.pipeTo(
    new WritableStream({
      write(chunk) {
        if (ws.readyState === 1) ws.send(chunk);
      },
      close() { ws.close(); },
      abort() { ws.close(); },
    })
  ).catch(() => ws.close());
}

function pipeWS2TCP(ws, socket) {

  ws.addEventListener("message", async (event) => {
    try {
      if (ws.readyState !== 1) return;

      const writer = socket.writable.getWriter();
      await writer.write(new Uint8Array(event.data));
      writer.releaseLock();

    } catch {
      ws.close();
    }
  });
}
