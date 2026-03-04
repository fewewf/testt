import { connect } from 'cloudflare:sockets';

const _cQndIdPFBwdwdfPS = '/t-vip-9026/auth-888999';
const _rcHzgeggsXmfUWrW = '56892533-7dad-324a-b0e8-51040d0d04ad';
const _JeHxQnQHudDPWbyN = 'ProxyIP.FR.CMLiussss.net';
const _JsGTkSTJgBtAOVZl = 443;

const WS_READY_STATE_OPEN = 1;
const CONNECTION_TIMEOUT = 5000;
const DATA_TIMEOUT = 3000;

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
    // 读取第一个消息（VLESS头）- 这个流需要被两次尝试共享
    const messageBuffer = [];
    const messageStream = new ReadableStream({
      start(controller) {
        ws.addEventListener('message', event => {
          const data = new Uint8Array(event.data);
          messageBuffer.push(data);
          controller.enqueue(data);
        });
        ws.addEventListener('close', () => controller.close());
        ws.addEventListener('error', () => controller.error(new Error('WebSocket error')));
      }
    });
    
    const reader = messageStream.getReader();
    const { value: firstMessage } = await reader.read();
    if (!firstMessage || wsClosed) return;
    
    const parsed = parseVLESSHeader(firstMessage);
    if (parsed.hasError) throw new Error(parsed.message);
    
    const vlessHeader = new Uint8Array([parsed.vlessVersion[0], 0]);
    const initialData = firstMessage.slice(parsed.rawDataIndex);
    
    // 顺序尝试两种连接方式，每次尝试都使用全新的资源
    let success = false;
    let lastError = null;
    
    // 尝试1: 直接连接
    if (!wsClosed) {
      try {
        console.log(`Attempt 1: Direct connection to ${parsed.addressRemote}:${parsed.portRemote}`);
        await attemptConnection(
          ws, 
          parsed.addressRemote, 
          parsed.portRemote, 
          vlessHeader, 
          initialData,
          wsClosed
        );
        success = true;
        console.log("Attempt 1 succeeded");
      } catch (err) {
        lastError = err;
        console.log(`Attempt 1 failed: ${err.message}`);
      }
    }
    
    // 尝试2: 代理IP（如果尝试1失败且WebSocket仍打开）
    if (!success && !wsClosed) {
      try {
        console.log(`Attempt 2: Proxy connection to ${_JeHxQnQHudDPWbyN}:${_JsGTkSTJgBtAOVZl}`);
        await attemptConnection(
          ws, 
          _JeHxQnQHudDPWbyN, 
          _JsGTkSTJgBtAOVZl, 
          vlessHeader, 
          initialData,
          wsClosed
        );
        success = true;
        console.log("Attempt 2 succeeded");
      } catch (err) {
        lastError = err;
        console.log(`Attempt 2 failed: ${err.message}`);
      }
    }
    
    if (!success && !wsClosed) {
      throw new Error(`All connection attempts failed: ${lastError?.message}`);
    }
    
  } catch (err) {
    if (!wsClosed) {
      console.error("Handle Error:", err.message);
    }
  }
}

// 独立的连接尝试函数 - 所有资源都在这个函数内部管理
async function attemptConnection(ws, hostname, port, vlessHeader, initialData, wsClosed) {
  let socket = null;
  let reader = null;
  let writer = null;
  
  try {
    // 1. 建立连接（带超时）
    socket = await connectWithTimeout({ hostname, port }, CONNECTION_TIMEOUT);
    
    // 2. 写入初始数据
    writer = socket.writable.getWriter();
    await writer.write(initialData);
    await writer.close(); // 关闭writer，但保持socket打开
    writer = null;
    
    // 3. 读取远程响应
    reader = socket.readable.getReader();
    
    // 4. 设置数据接收超时
    const dataTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Data timeout')), DATA_TIMEOUT);
    });
    
    // 5. 等待第一个数据包
    const firstDataPromise = reader.read();
    const { done, value } = await Promise.race([firstDataPromise, dataTimeout]);
    
    if (done || wsClosed) {
      throw new Error('Connection closed before data received');
    }
    
    // 6. 发送第一个数据包（带VLESS头）
    if (ws.readyState === WS_READY_STATE_OPEN) {
      const combined = new Uint8Array(vlessHeader.byteLength + value.byteLength);
      combined.set(vlessHeader, 0);
      combined.set(value, vlessHeader.byteLength);
      ws.send(combined);
    }
    
    // 7. 继续转发剩余数据
    while (!wsClosed) {
      const { done, value } = await reader.read();
      if (done || wsClosed) break;
      
      if (ws.readyState === WS_READY_STATE_OPEN) {
        ws.send(value);
      }
    }
    
  } finally {
    // 清理所有资源
    if (writer) {
      try { writer.close(); } catch(e) {}
    }
    if (reader) {
      try { reader.releaseLock(); } catch(e) {}
    }
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

function parseVLESSHeader(buffer) {
  if (buffer.byteLength < 24) {
    return { hasError: true, message: 'Invalid header length' };
  }
  
  const view = new DataView(buffer.buffer);
  const version = new Uint8Array(buffer.slice(0, 1));
  
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
    case 1:
      address = Array.from(new Uint8Array(buffer.slice(offset, offset + 4))).join('.');
      offset += 4;
      break;
    case 2:
      const domainLength = view.getUint8(offset++);
      address = new TextDecoder().decode(buffer.slice(offset, offset + domainLength));
      offset += domainLength;
      break;
    case 3:
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
