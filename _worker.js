import { connect } from 'cloudflare:sockets';

// --- 配置区 ---
const SECRET_PATH = '/tunnel-vip-2026/auth-888999';
const UUID = '56892533-7dad-475a-b0e8-51040d0d04ad';
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
  let keepAliveTimer = null;

  ws.binaryType = "arraybuffer";

  // 清理函数：确保连接关闭时释放所有资源
  const closeAll = () => {
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    if (remoteSocket) remoteSocket.close();
    if (ws.readyState === 1) ws.close();
  };

  ws.addEventListener('message', async (event) => {
    try {
      const buf = new Uint8Array(event.data);

      if (!remoteSocket) {
        // --- VLESS 协议解析 ---
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

        // --- 启动保活心跳 (每 30 秒发送一次微小数据) ---
        keepAliveTimer = setInterval(() => {
          if (ws.readyState === 1) {
            // 发送空的逻辑心跳或极小数据包
            ws.send(new Uint8Array(0)); 
          }
        }, 30000);

        // --- 管道转发 (带大文件优化) ---
        pipeTCP2WS(ws, remoteSocket);

        if (dataToForward.length > 0) {
          await writer.write(dataToForward);
        }
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

/**
 * 针对大文件下载极致优化的管道函数
 */
async function pipeTCP2WS(ws, socket) {
  const reader = socket.readable.getReader();
  
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (ws.readyState !== 1) break;

      // --- 背压机制：防止大文件下载撑爆 Worker 内存 ---
      // 如果客户端接收太慢，积压超过 512KB 时暂停读取 TCP
      if (ws.bufferedAmount > 512 * 1024) {
        let waitCount = 0;
        while (ws.bufferedAmount > 256 * 1024 && waitCount < 100) {
          await new Promise(r => setTimeout(r, 100));
          waitCount++;
          if (ws.readyState !== 1) break;
        }
      }

      ws.send(value);
    }
  } catch (err) {
    // 错误处理逻辑
  } finally {
    reader.releaseLock();
    if (ws.readyState === 1) ws.close();
  }
}
