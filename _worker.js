import { connect } from 'cloudflare:sockets';

const _cQndIdPFBwdwdfPS = '/t-vip-9026/auth-888999';
const _rcHzgeggsXmfUWrW = '56892533-7dad-324a-b0e8-51040d0d04ad';
const _JeHxQnQHudDPWbyN = 'ProxyIP.FR.CMLiussss.net';
const _JsGTkSTJgBtAOVZl = 443;

const WS_READY_STATE_OPEN = 1;

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
    
    _QlxgSaLbCagSZvDa(_zNeFASTClFTonTIr).catch(_wozDXumapohYMyrU => {
      console.error("Critical WS Error:", _wozDXumapohYMyrU.message);
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

async function _QlxgSaLbCagSZvDa(_zNeFASTClFTonTIr) {
  const _rQBZEdhdojOaQypG = _GWHvqQvdiYQMUGEh(_zNeFASTClFTonTIr);
  let _activeSocket = null;
  let _vlessHeader = null;
  let _initialData = null;
  let _useProxyIP = false;
  let _isFallbackInProgress = false;
  let _webSocketClosed = false;
  
  const _clientReader = _rQBZEdhdojOaQypG.getReader();
  let _clientWriterLock = null;
  
  _zNeFASTClFTonTIr.addEventListener('close', () => {
    _webSocketClosed = true;
  });
  
  try {
    // 读取第一个消息（VLESS头）
    const { done: firstDone, value: firstMessage } = await _clientReader.read();
    if (firstDone || _webSocketClosed) return;
    
    const parsedHeader = _MkxTgzbSwfhpsfJi(firstMessage);
    if (parsedHeader.hasError) throw new Error(parsedHeader.message);
    
    _vlessHeader = new Uint8Array([parsedHeader.vlessVersion[0], 0]);
    _initialData = firstMessage.slice(parsedHeader.rawDataIndex);
    
    // 尝试直接连接
    try {
      _activeSocket = await connect({
        hostname: parsedHeader.addressRemote,
        port: parsedHeader.portRemote
      });
      const writer = _activeSocket.writable.getWriter();
      await writer.write(_initialData);
      writer.releaseLock();
    } catch (err) {
      console.log("Direct connection failed, using proxy IP:", err.message);
      _activeSocket = await connect({
        hostname: _JeHxQnQHudDPWbyN,
        port: _JsGTkSTJgBtAOVZl
      });
      const writer = _activeSocket.writable.getWriter();
      await writer.write(_initialData);
      writer.releaseLock();
      _useProxyIP = true;
    }
    
    // 创建取消控制器
    const controller = new AbortController();
    
    // 客户端 -> 远程流
    const clientToRemote = (async () => {
      const writer = _activeSocket.writable.getWriter();
      _clientWriterLock = writer;
      try {
        while (!_webSocketClosed && !controller.signal.aborted) {
          const { done, value } = await _clientReader.read();
          if (done || _webSocketClosed || controller.signal.aborted) break;
          await writer.write(value);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Client to remote error:", err.message);
        }
      } finally {
        writer.releaseLock();
        _clientWriterLock = null;
      }
    })();
    
    // 远程 -> 客户端流（带回退逻辑）
    const remoteToClient = (async () => {
      const reader = _activeSocket.readable.getReader();
      let headerSent = false;
      let hasData = false;
      
      try {
        while (!_webSocketClosed && !controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done || _webSocketClosed || controller.signal.aborted) break;
          
          hasData = true;
          
          if (_zNeFASTClFTonTIr.readyState === WS_READY_STATE_OPEN) {
            if (!headerSent) {
              const combined = new Uint8Array(_vlessHeader.byteLength + value.byteLength);
              combined.set(_vlessHeader, 0);
              combined.set(value, _vlessHeader.byteLength);
              _zNeFASTClFTonTIr.send(combined);
              headerSent = true;
            } else {
              _zNeFASTClFTonTIr.send(value);
            }
          }
        }
      } finally {
        reader.releaseLock();
        
        // 如果没有数据且需要回退
        if (!hasData && !_useProxyIP && !_webSocketClosed && !_isFallbackInProgress) {
          _isFallbackInProgress = true;
          console.log("No data received, attempting fallback to proxy IP...");
          
          // 1. 先取消当前所有操作
          controller.abort();
          
          // 2. 关闭旧socket
          if (_activeSocket) {
            try { _activeSocket.close(); } catch(e) {}
          }
          
          // 3. 取消客户端读取
          if (_clientWriterLock) {
            try { _clientWriterLock.releaseLock(); } catch(e) {}
          }
          
          try {
            // 4. 创建新连接
            const newSocket = await connect({
              hostname: _JeHxQnQHudDPWbyN,
              port: _JsGTkSTJgBtAOVZl
            });
            
            // 5. 写入初始数据
            const newWriter = newSocket.writable.getWriter();
            await newWriter.write(_initialData);
            newWriter.releaseLock();
            
            _activeSocket = newSocket;
            _useProxyIP = true;
            _isFallbackInProgress = false;
            
            // 6. 重新建立远程到客户端流
            const newReader = newSocket.readable.getReader();
            let newHeaderSent = false;
            
            while (!_webSocketClosed) {
              const { done, value } = await newReader.read();
              if (done || _webSocketClosed) break;
              
              if (_zNeFASTClFTonTIr.readyState === WS_READY_STATE_OPEN) {
                if (!newHeaderSent) {
                  const combined = new Uint8Array(_vlessHeader.byteLength + value.byteLength);
                  combined.set(_vlessHeader, 0);
                  combined.set(value, _vlessHeader.byteLength);
                  _zNeFASTClFTonTIr.send(combined);
                  newHeaderSent = true;
                } else {
                  _zNeFASTClFTonTIr.send(value);
                }
              }
            }
            
            newReader.releaseLock();
            
          } catch (fallbackErr) {
            console.error("Fallback failed:", fallbackErr);
            if (_zNeFASTClFTonTIr.readyState === WS_READY_STATE_OPEN) {
              _zNeFASTClFTonTIr.close(1011, "Fallback failed");
            }
          }
        }
      }
    })();
    
    await Promise.race([clientToRemote, remoteToClient]);
    
  } catch (_wozDXumapohYMyrU) {
    if (!_webSocketClosed && !_isFallbackInProgress) {
      console.error("HandleWS Error:", _wozDXumapohYMyrU.message);
    }
  } finally {
    _clientReader.releaseLock();
    if (_activeSocket) {
      try { _activeSocket.close(); } catch {}
    }
    if (!_webSocketClosed && _zNeFASTClFTonTIr.readyState === WS_READY_STATE_OPEN) {
      try { _zNeFASTClFTonTIr.close(); } catch {}
    }
  }
}

function _GWHvqQvdiYQMUGEh(_YHRMXlCNQXcLTQTX) {
  return new ReadableStream({
    start(_umAYPzwPqpEFUFDI) {
      _YHRMXlCNQXcLTQTX.addEventListener('message', _fVheVUSIAbHdlEXQ => 
        _umAYPzwPqpEFUFDI.enqueue(new Uint8Array(_fVheVUSIAbHdlEXQ.data))
      );
      _YHRMXlCNQXcLTQTX.addEventListener('close', () => 
        _umAYPzwPqpEFUFDI.close()
      );
      _YHRMXlCNQXcLTQTX.addEventListener('error', () => 
        _umAYPzwPqpEFUFDI.error(new Error('WebSocket error'))
      );
    }
  });
}

function _MkxTgzbSwfhpsfJi(_QjfgPTDmcvdvEOSN) {
  if (_QjfgPTDmcvdvEOSN.byteLength < 24) return {
    hasError: true,
    message: 'Invalid header'
  };
  
  const _igZwspOTXOUDIgpJ = new DataView(_QjfgPTDmcvdvEOSN.buffer);
  const _mQuBmCqLfAfNDGqA = Array.from(new Uint8Array(_QjfgPTDmcvdvEOSN.slice(1, 17)))
    .map(_UgvgeNOVlJZSBxZG => _UgvgeNOVlJZSBxZG.toString(16).padStart(2, '0'))
    .join('');
    
  if (_mQuBmCqLfAfNDGqA !== _rcHzgeggsXmfUWrW.replace(/-/g, '')) {
    return { hasError: true, message: 'Unauthorized' };
  }
  
  const _jAStFyandqGWXqZR = _igZwspOTXOUDIgpJ.getUint8(17);
  let _pWtFmyUVDkElICtU = 18 + _jAStFyandqGWXqZR;
  const _fIfiLUgHAsoXFbhV = _igZwspOTXOUDIgpJ.getUint8(_pWtFmyUVDkElICtU++);
  const _ytQFGPvxNQUjZTAs = _igZwspOTXOUDIgpJ.getUint16(_pWtFmyUVDkElICtU);
  _pWtFmyUVDkElICtU += 2;
  const _PnLELLVjNfMwYHCb = _igZwspOTXOUDIgpJ.getUint8(_pWtFmyUVDkElICtU++);
  
  let _SnVNbvZshYkvCWQB = '';
  
  if (_PnLELLVjNfMwYHCb === 1) {
    _SnVNbvZshYkvCWQB = Array.from(new Uint8Array(_QjfgPTDmcvdvEOSN.slice(_pWtFmyUVDkElICtU, _pWtFmyUVDkElICtU + 4))).join('.');
    _pWtFmyUVDkElICtU += 4;
  } else if (_PnLELLVjNfMwYHCb === 2) {
    const _UGfWcImCHyxtNgQc = _igZwspOTXOUDIgpJ.getUint8(_pWtFmyUVDkElICtU++);
    _SnVNbvZshYkvCWQB = new TextDecoder().decode(_QjfgPTDmcvdvEOSN.slice(_pWtFmyUVDkElICtU, _pWtFmyUVDkElICtU + _UGfWcImCHyxtNgQc));
    _pWtFmyUVDkElICtU += _UGfWcImCHyxtNgQc;
  } else if (_PnLELLVjNfMwYHCb === 3) {
    _SnVNbvZshYkvCWQB = Array.from({
      length: 8
    }, (_iuHKolsMIqvRXzVH, _HRhJESqDjdwZmuMt) => 
      _igZwspOTXOUDIgpJ.getUint16(_pWtFmyUVDkElICtU + _HRhJESqDjdwZmuMt * 2).toString(16)
    ).join(':');
    _pWtFmyUVDkElICtU += 16;
  }
  
  return {
    hasError: false,
    addressRemote: _SnVNbvZshYkvCWQB,
    portRemote: _ytQFGPvxNQUjZTAs,
    rawDataIndex: _pWtFmyUVDkElICtU,
    vlessVersion: new Uint8Array(_QjfgPTDmcvdvEOSN.slice(0, 1))
  };
}
