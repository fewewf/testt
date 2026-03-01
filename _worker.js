import { connect } from 'cloudflare:sockets';

const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';

// 如果你确定不需要代理，可以将 PROXY_HOST 设为 null
const PROXY_HOST = 'ProxyIP.FR.CMLiussss.net';
const PROXY_PORT = 443;

export default {
  async fetch(request) {
    const url = new URL(request.url);
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
        // --- 握手解析 ---
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
        }

        // --- 核心：尝试建立连接 ---
        const result = await connectRemote(address, port);
        remoteSocket = result.socket;
        writer = remoteSocket.writable.getWriter();

        ws.send(new Uint8Array([0, 0])); // VLESS 成功响应
        pipeTCP2WS(ws, remoteSocket);

        if (result.leftover?.length) ws.send(result.leftover);
        
        // 发送首包剩余数据
        const headerLen = (addrType === 1) ? cursor + 4 : (addrType === 2) ? cursor + 1 + buf[cursor] : cursor + 16;
        const rawData = buf.slice(headerLen);
        if (rawData.length > 0) await writer.write(rawData);
        return;
      }

      await writer.write(buf);
    } catch (err) {
      console.error(`[VLESS Error] ${err.message}`);
      ws.close();
    }
  });
}

async function connectRemote(address, port) {
  // 1. 优先尝试直连 (Direct Connect)
  try {
    const socket = connect({ hostname: address, port });
    await socket.opened;
    return { socket, leftover: null };
  } catch (e) {
    console.log(`Direct connect to ${address}:${port} failed, trying proxy...`);
    
    // 2. 直连失败，尝试代理
    if (!PROXY_HOST) throw new Error("Direct connect failed and no proxy configured");

    const socket = connect({ hostname: PROXY_HOST, port: PROXY_PORT });
    await socket.opened;

    const pWriter = socket.writable.getWriter();
    const pReader = socket.readable.getReader();

    // 修改后的握手构造
    const hello = [
  `CONNECT ${address}:${port} HTTP/1.1`,
  `Host: ${address}:${port}`,
  `Proxy-Connection: Keep-Alive`,
  `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0`,
  `Connection: Keep-Alive`,
  '\r\n' // 结尾必须有额外的换行
   ].join('\r\n');

 await pWriter.write(new TextEncoder().encode(hello));
 await pWriter.write(new TextEncoder().encode(hello));
    pWriter.releaseLock();

    let buf = new Uint8Array(0);
    while (true) {
      const { value, done } = await pReader.read();
      if (done) throw new Error("Proxy connection closed during handshake");
      buf = concat(buf, value);
      const text = new TextDecoder().decode(buf);
      if (text.includes("\r\n\r\n")) {
        const firstLine = text.split('\r\n')[0];
        if (!text.includes("200")) {
            // 这里会抛出具体的响应行，例如 "HTTP/1.1 407 Proxy Authentication Required"
            throw new Error(`Proxy rejected: ${firstLine}`);
        }
        pReader.releaseLock();
        return { socket, leftover: buf.slice(text.indexOf("\r\n\r\n") + 4) };
      }
    }
  }
}

function pipeTCP2WS(ws, socket) {
  socket.readable.pipeTo(new WritableStream({
    write(chunk) { if (ws.readyState === 1) ws.send(chunk); },
    close() { ws.close(); },
    abort() { ws.close(); }
  })).catch(() => ws.close());
}

function concat(a, b) {
  const c = new Uint8Array(a.length + b.length);
  c.set(a); c.set(b, a.length);
  return c;
}
