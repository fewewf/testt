import { connect } from 'cloudflare:sockets';

const _cQndIdPFBwdwdfPS = '/t-vip-9026/auth-888999';
const _rcHzgeggsXmfUWrW = '56892533-7dad-324a-b0e8-51040d0d04ad';
const _JeHxQnQHudDPWbyN = 'ProxyIP.FR.CMLiussss.net';
const _JsGTkSTJgBtAOVZl = 443;

const WS_READY_STATE_OPEN = 1;
const CONNECTION_TIMEOUT = 5000; // 5秒超时
const DATA_TIMEOUT = 3000; // 3秒数据超时

const _KtFJDaQcgkFDwTLY = (_yRsSyhpBCxFbqNPU, _HpkuToMJSAvwPNva = 404) => {
  const _XwbeLFBOTVlfgfaV = {
    timestamp: new Date().toISOString(),
    status: _HpkuToMJSAvwPNva,
    error: _HpkuToMJSAvwPNva === 404 ? "Not Found" : "Unauthorized",
    message: `No static resource or API endpoint found for: ${_yRsSyhpBCxFbqNPU.pathname}`,
    path: _yRsSyhpBCxFbqNPU.pathname,
    requestId: Math.random().toString(36).substring(2, 15).toUpperCase(),
    service: "api-gateway-v2"
  };
  return new Response(JSON.stringify(_XwbeLFBOTVlfgfaV), {
    status: _HpkuToMJSAvwPNva,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'X-Frame-Options': 'DENY',
      'Server': 'nginx'
    }
  });
};

export default {
  async fetch(_gAaPbetxNIakJQKw) {
    const _yRsSyhpBCxFbqNPU = new URL(_gAaPbetxNIakJQKw.url);
    if (_yRsSyhpBCxFbqNPU.pathname !== _cQndIdPFBwdwdfPS) {
      return _KtFJDaQcgkFDwTLY(_yRsSyhpBCxFbqNPU, 404);
    }
    if (_gAaPbetxNIakJQKw.headers.get('Upgrade') !== 'websocket') {
      return new Response(JSON.stringify({
        status: "UP",
        version: "2.4.1-RELEASE",
        uptime: Math.floor(Math.random() * 100000) + "s"
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const _sdTNvSnQHgfISqwc = new WebSocketPair();
    const [_cIMstliQdZbHDVpr, _zNeFASTClFTonTIr] = Object.values(_sdTNvSnQHgfISqwc);
    _zNeFASTClFTonTIr.accept();
    
    // 启动处理，但不等待
    handleWebSocket(_zNeFASTClFTonTIr).catch(err => {
      console.error("WebSocket Error:", err.message);
      try { _zNeFASTClFTonTIr.close(); } catch(e) {}
    });
    
    return new Response(null, {
      status: 101,
      webSocket: _cIMstliQdZbHDVpr,
      headers: {
        'Sec-WebSocket-Protocol': _gAaPbetxNIakJQKw.headers.get('Sec-WebSocket-Protocol') || '',
        'Connection': 'Upgrade',
        'Upgrade': 'websocket'
      }
    });
  }
};

async function handleWebSocket(ws) {
  let wsClosed = false;
  
  ws.addEventListener('close', () => { wsClosed = true; });
  ws.addEventListener('error', () => { wsClosed = true; });
  
  try {
    const wsReader = createWebSocketReader(ws).getReader();
    
    // 读取第一个消息（VLESS头）
    const { value: firstMessage } = await wsReader.read();
    if (!firstMessage || wsClosed) return;
    
    const parsed = parseVLESSHeader(firstMessage);
    if (parsed.hasError) throw new Error(parsed.message);
    
    const vlessHeader = new Uint8Array([parsed.vlessVersion[0], 0]);
    const initialData = firstMessage.slice(parsed.rawDataIndex);
    
    // 顺序尝试两种连接方式
    let success = false;
    let lastError = null;
    
    // 尝试1: 直接连接
    try {
      console.log(`Attempt 1: Direct connection to ${parsed.addressRemote}:${parsed.portRemote}`);
      await tryConnection(ws, wsReader, {
        hostname: parsed.addressRemote,
        port: parsed.portRemote
      }, vlessHeader, initialData, wsClosed);
      success = true;
    } catch (err) {
      lastError = err;
      console.log(`Attempt 1 failed: ${err.message}`);
    }
    
    // 如果直接连接失败或超时，尝试代理IP
    if (!success && !wsClosed) {
      try {
        console.log(`Attempt 2: Proxy connection to ${_JeHxQnQHudDPWbyN}:${_JsGTkSTJgBtAOVZl}`);
        await tryConnection(ws, wsReader, {
          hostname: _JeHxQnQHudDPWbyN,
          port: _JsGTkSTJgBtAOVZl
        }, vlessHeader, initialData, wsClosed);
        success = true;
      } catch (err) {
        lastError = err;
        console.log(`Attempt 2 failed: ${err.message}`);
      }
    }
    
    if (!success) {
      throw new Error(`All connection attempts failed: ${lastError?.message}`);
    }
    
  } catch (err) {
    if (!wsClosed) {
      console.error("Handle Error:", err.message);
    }
  } finally {
    if (!wsClosed && ws.readyState === WS_READY_STATE_OPEN) {
      try { ws.close(); } catch(e) {}
    }
  }
}

// 尝试一次完整的连接和数据传输
async function tryConnection(ws, wsReader, target, vlessHeader, initialData, wsClosed) {
  let socket = null;
  
  try {
    // 1. 建立连接（带超时）
    socket = await connectWithTimeout(target, CONNECTION_TIMEOUT);
    
    // 2. 写入初始数据
    const writer = socket.writable.getWriter();
    await writer.write(initialData);
    writer.releaseLock();
    
    // 3. 等待第一份数据返回（带超时）
    const reader = socket.readable.getReader();
    let headerSent = false;
    
    // 设置数据接收超时
    const dataTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Data timeout')), DATA_TIMEOUT);
    });
    
    try {
      // 等待第一个数据包
      const firstDataPromise = reader.read();
      const { done, value } = await Promise.race([firstDataPromise, dataTimeout]);
      
      if (done || wsClosed) return;
      
      // 发送第一个数据包（带VLESS头）
      if (ws.readyState === WS_READY_STATE_OPEN) {
        const combined = new Uint8Array(vlessHeader.byteLength + value.byteLength);
        combined.set(vlessHeader, 0);
        combined.set(value, vlessHeader.byteLength);
        ws.send(combined);
        headerSent = true;
      }
      
      // 4. 建立双向数据流
      await Promise.race([
        // 客户端 -> 远程
        (async () => {
          const w = socket.writable.getWriter();
          try {
            while (!wsClosed) {
              const { done, value } = await wsReader.read();
              if (done || wsClosed) break;
              await w.write(value);
            }
          } finally {
            w.releaseLock();
          }
        })(),
        
        // 远程 -> 客户端
        (async () => {
          const r = reader; // 复用已有的reader
          try {
            while (!wsClosed) {
              const { done, value } = await r.read();
              if (done || wsClosed) break;
              
              if (ws.readyState === WS_READY_STATE_OPEN) {
                if (!headerSent) {
                  const combined = new Uint8Array(vlessHeader.byteLength + value.byteLength);
                  combined.set(vlessHeader, 0);
                  combined.set(value, vlessHeader.byteLength);
                  ws.send(combined);
                  headerSent = true;
                } else {
                  ws.send(value);
                }
              }
            }
          } finally {
            r.releaseLock();
          }
        })()
      ]);
      
    } finally {
      reader.releaseLock();
    }
    
  } finally {
    if (socket) {
      try { socket.close(); } catch(e) {}
    }
  }
}

async function connectWithTimeout(options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const socket = await connect(options, { signal: controller.signal });
    clearTimeout(timeoutId);
    return socket;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function createWebSocketReader(ws) {
  return new ReadableStream({
    start(controller) {
      ws.addEventListener('message', event => {
        controller.enqueue(new Uint8Array(event.data));
      });
      ws.addEventListener('close', () => controller.close());
      ws.addEventListener('error', () => controller.error(new Error('WebSocket error')));
    }
  });
}

function parseVLESSHeader(buffer) {
  if (buffer.byteLength < 24) {
    return { hasError: true, message: 'Invalid header length' };
  }
  
  const view = new DataView(buffer.buffer);
  const version = new Uint8Array(buffer.slice(0, 1));
  
  // 验证UUID
  const uuidBytes = new Uint8Array(buffer.slice(1, 17));
  const uuidHex = Array.from(uuidBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const expectedUuid = _rcHzgeggsXmfUWrW.replace(/-/g, '');
  
  if (uuidHex !== expectedUuid) {
    return { hasError: true, message: 'Unauthorized' };
  }
  
  const optionsLength = view.getUint8(17);
  const command = view.getUint8(18 + optionsLength);
  
  if (command !== 1 && command !== 2) {
    return { hasError: true, message: 'Unsupported command' };
  }
  
  let offset = 19 + optionsLength;
  const port = view.getUint16(offset);
  offset += 2;
  
  const addressType = view.getUint8(offset++);
  let address = '';
  
  switch (addressType) {
    case 1: // IPv4
      address = Array.from(new Uint8Array(buffer.slice(offset, offset + 4))).join('.');
      offset += 4;
      break;
      
    case 2: // Domain
      const domainLength = view.getUint8(offset++);
      address = new TextDecoder().decode(buffer.slice(offset, offset + domainLength));
      offset += domainLength;
      break;
      
    case 3: // IPv6
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(view.getUint16(offset).toString(16));
        offset += 2;
      }
      address = ipv6.join(':');
      break;
      
    default:
      return { hasError: true, message: 'Unsupported address type' };
  }
  
  return {
    hasError: false,
    addressRemote: address,
    portRemote: port,
    rawDataIndex: offset,
    vlessVersion: version,
    isUDP: command === 2,
    addressType: addressType
  };
}
