import { connect } from 'cloudflare:sockets';

// ===== 配置区 =====
const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';
const PROXY_HOST = 'ProxyIP.FR.CMLiussss.net';
const PROXY_PORT = 443;

const CONNECT_TIMEOUT = 10000;
const FIRST_PACKET_TIMEOUT = 3000;
const MAX_RETRY = 4;
const BASE_DELAY = 300;
const MAX_CHUNK = 64 * 1024; // 64KB

// ===== 伪装 =====
const ROBOT_HTML = `<!DOCTYPE html><html><head><title>Edge Node</title></head><body><h1>Edge Service</h1></body></html>`;
const MOCK_API = { status: "ok", node: "cf-edge" };

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = request.headers.get('User-Agent') || '';

    if (url.pathname !== SECRET_PATH) {
      if (ua.toLowerCase().includes('bot')) {
        return new Response(ROBOT_HTML, { headers: { "Content-Type": "text/html" } });
      }
      return new Response(JSON.stringify(MOCK_API), { headers: { "Content-Type": "application/json" } });
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Unauthorized', { status: 401 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    handleVLESS(server);

    return new Response(null, { status: 101, webSocket: client });
  }
};

// ================= 主逻辑 =================

async function handleVLESS(ws) {
  const cleanUUID = UUID.replace(/-/g, '');
  let remoteSocket = null;
  let writer = null;

  const closeAll = () => {
    try { if (remoteSocket) remoteSocket.close(); } catch {}
    if (ws.readyState === 1) ws.close();
  };

  ws.addEventListener('message', async (event) => {
    try {
      const buf = new Uint8Array(event.data);

      if (!remoteSocket) {
        if (buf.length < 24) return closeAll();

        const clientUUID = Array.from(buf.slice(1, 17))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        if (clientUUID !== cleanUUID) return closeAll();

        let cursor = 18 + buf[17];
        const command = buf[cursor++];
        if (command !== 1) return closeAll();

        const port = (buf[cursor] << 8) | buf[cursor + 1];
        cursor += 2;

        const addrType = buf[cursor++];
        let address = '';

        if (addrType === 1) {
          address = buf.slice(cursor, cursor + 4).join('.');
        } else if (addrType === 2) {
          const len = buf[cursor];
          address = new TextDecoder().decode(buf.slice(cursor + 1, cursor + 1 + len));
        } else if (addrType === 3) {
          address = Array.from({ length: 8 }, (_, i) =>
            ((buf[cursor + i * 2] << 8) | buf[cursor + i * 2 + 1]).toString(16)
          ).join(':');
        }

        const dataToForward = buf.slice(buf.length - (buf.length - cursor));

        const retryConnect = async (retryCount = 0) => {
          if (retryCount > MAX_RETRY) return closeAll();

          try {
            remoteSocket = await connectWithFallback(address, port, retryCount);
            writer = remoteSocket.writable.getWriter();

            pipeTCP2WS(ws, remoteSocket, retryConnect, retryCount);

            if (dataToForward.length > 0)
              await writer.write(dataToForward);

          } catch {
            const delay = BASE_DELAY * Math.pow(2, retryCount);
            await new Promise(r => setTimeout(r, delay));
            await retryConnect(retryCount + 1);
          }
        };

        await retryConnect();
        return;
      }

      if (writer) {
        try {
          await writer.write(buf);
        } catch {
          closeAll();
        }
      }

    } catch {
      closeAll();
    }
  });

  ws.addEventListener('close', closeAll);
  ws.addEventListener('error', closeAll);
}

// ================= 连接逻辑 =================

async function connectWithFallback(address, port, retryCount) {
  try {
    const socket = connect(
      { hostname: address, port },
      { allowHalfOpen: true }
    );

    await Promise.race([
      socket.opened,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connect Timeout')), CONNECT_TIMEOUT)
      )
    ]);

    return socket;

  } catch {
    if (retryCount >= MAX_RETRY) throw new Error('Connect failed');

    const socket = connect(
      { hostname: PROXY_HOST, port: PROXY_PORT },
      { allowHalfOpen: true }
    );

    await socket.opened;
    return socket;
  }
}

// ================= 数据管道 =================

async function pipeTCP2WS(ws, socket, retryFn, retryCount) {
  const reader = socket.readable.getReader();

  let firstPacketReceived = false;

  const firstPacketTimer = setTimeout(async () => {
    if (!firstPacketReceived) {
      try { socket.close(); } catch {}
      await retryFn(retryCount + 1);
    }
  }, FIRST_PACKET_TIMEOUT);

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done || ws.readyState !== 1) break;

      firstPacketReceived = true;
      clearTimeout(firstPacketTimer);

      let offset = 0;
      while (offset < value.length) {
        ws.send(value.slice(offset, offset + MAX_CHUNK));
        offset += MAX_CHUNK;
      }
    }
  } catch {
    await retryFn(retryCount + 1);
  } finally {
    reader.releaseLock();
    if (ws.readyState === 1) ws.close();
  }
}
