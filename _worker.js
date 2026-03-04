import { connect } from 'cloudflare:sockets';

const _cQndIdPFBwdwdfPS = '/t-vip-9026/auth-888999';
const _rcHzgeggsXmfUWrW = '56892533-7dad-324a-b0e8-51040d0d04ad';
const _JeHxQnQHudDPWbyN = 'ProxyIP.FR.CMLiussss.net';
const _JsGTkSTJgBtAOVZl = 443;

// 添加常量定义
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
      _zNeFASTClFTonTIr.close();
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
  let _jJUejlszoJxKpVyr = null;
  let _VMwvXLIMJYZDGMLS = null;
  let _IxamNRThaYlJuRBk = null;
  let _useProxyIP = false; // 标记是否使用代理IP
  let _retryCount = 0; // 重试计数
  const MAX_RETRIES = 2; // 最大重试次数
  
  const _mbaxDGhgHkhYiXMf = _rQBZEdhdojOaQypG.getReader();
  
  try {
    const {
      done: _ViOGcMXtboZDHxcp,
      value: _xfAKCMFjFRznTnje
    } = await _mbaxDGhgHkhYiXMf.read();
    
    if (_ViOGcMXtboZDHxcp) return;
    
    const _TyFwoqvKDFIbgSAh = _MkxTgzbSwfhpsfJi(_xfAKCMFjFRznTnje);
    if (_TyFwoqvKDFIbgSAh.hasError) throw new Error(_TyFwoqvKDFIbgSAh.message);
    
    _VMwvXLIMJYZDGMLS = new Uint8Array([_TyFwoqvKDFIbgSAh.vlessVersion[0], 0]);
    _IxamNRThaYlJuRBk = _xfAKCMFjFRznTnje.slice(_TyFwoqvKDFIbgSAh.rawDataIndex);
    
    // 定义连接函数
    async function createConnection(useProxy = false) {
      if (useProxy) {
        return await connect({
          hostname: _JeHxQnQHudDPWbyN,
          port: _JsGTkSTJgBtAOVZl
        }, {
          allowHalfOpen: true
        });
      } else {
        return await connect({
          hostname: _TyFwoqvKDFIbgSAh.addressRemote,
          port: _TyFwoqvKDFIbgSAh.portRemote
        }, {
          allowHalfOpen: true
        });
      }
    }
    
    // 定义重试函数
    async function attemptConnectionWithRetry(useProxy = false) {
      try {
        const socket = await createConnection(useProxy);
        const writer = socket.writable.getWriter();
        await writer.write(_IxamNRThaYlJuRBk);
        writer.releaseLock();
        return socket;
      } catch (err) {
        if (_retryCount < MAX_RETRIES) {
          _retryCount++;
          console.log(`Connection attempt ${_retryCount} failed, retrying...`);
          return attemptConnectionWithRetry(!useProxy); // 切换连接方式重试
        }
        throw err;
      }
    }
    
    // 尝试首次连接（先尝试直接连接）
    try {
      _jJUejlszoJxKpVyr = await attemptConnectionWithRetry(false);
    } catch (err) {
      console.log("Direct connection failed, trying proxy IP...");
      _jJUejlszoJxKpVyr = await createConnection(true);
      _useProxyIP = true;
    }
    
    // 设置数据流转发，带智能回退
    const _sidrNzxcXsWcFyfs = _YXLwwGKkeKknZtyk(
      _jJUejlszoJxKpVyr, 
      _zNeFASTClFTonTIr, 
      _VMwvXLIMJYZDGMLS,
      async () => {
        // 回退函数：当没有数据返回时尝试使用代理IP重连
        if (!_useProxyIP) {
          console.log("No data received, falling back to proxy IP...");
          try {
            // 关闭旧连接
            if (_jJUejlszoJxKpVyr) {
              try { _jJUejlszoJxKpVyr.close(); } catch(e) {}
            }
            // 使用代理IP创建新连接
            const newSocket = await connect({
              hostname: _JeHxQnQHudDPWbyN,
              port: _JsGTkSTJgBtAOVZl
            }, {
              allowHalfOpen: true
            });
            
            // 重新写入初始数据
            const writer = newSocket.writable.getWriter();
            await writer.write(_IxamNRThaYlJuRBk);
            writer.releaseLock();
            
            // 重新建立管道
            _jJUejlszoJxKpVyr = newSocket;
            _useProxyIP = true;
            
            // 重新启动数据转发
            _YXLwwGKkeKknZtyk(
              newSocket, 
              _zNeFASTClFTonTIr, 
              _VMwvXLIMJYZDGMLS,
              null // 不再重试，避免循环
            ).catch(console.error);
            
          } catch (fallbackErr) {
            console.error("Fallback connection failed:", fallbackErr);
            if (_zNeFASTClFTonTIr.readyState === WS_READY_STATE_OPEN) {
              _zNeFASTClFTonTIr.close(1011, "Fallback failed");
            }
          }
        }
      }
    );
    
    const _msNNYJilORBFjlRr = (async () => {
      const _UNaMwSaJkLsWDhiI = _jJUejlszoJxKpVyr.writable.getWriter();
      try {
        while (true) {
          const {
            done: _ViOGcMXtboZDHxcp,
            value: _xfAKCMFjFRznTnje
          } = await _mbaxDGhgHkhYiXMf.read();
          if (_ViOGcMXtboZDHxcp) break;
          await _UNaMwSaJkLsWDhiI.write(_xfAKCMFjFRznTnje);
        }
      } finally {
        _UNaMwSaJkLsWDhiI.releaseLock();
      }
    })();
    
    await Promise.race([_sidrNzxcXsWcFyfs, _msNNYJilORBFjlRr]);
    
  } catch (_wozDXumapohYMyrU) {
    console.error("HandleWS Error:", _wozDXumapohYMyrU.message);
  } finally {
    _mbaxDGhgHkhYiXMf.releaseLock();
    if (_jJUejlszoJxKpVyr) {
      try { _jJUejlszoJxKpVyr.close(); } catch {}
    }
    if (_zNeFASTClFTonTIr.readyState === WS_READY_STATE_OPEN) {
      _zNeFASTClFTonTIr.close();
    }
  }
}

// 修改后的数据转发函数，增加回退回调
async function _YXLwwGKkeKknZtyk(_jJUejlszoJxKpVyr, _YHRMXlCNQXcLTQTX, _fjzIINYImWgZaPDP, _fallbackCallback = null) {
  const _mbaxDGhgHkhYiXMf = _jJUejlszoJKpVyr.readable.getReader();
  let _jVqfgMYADQeWjGUf = false;
  let _hasIncomingData = false;
  
  try {
    while (true) {
      const {
        done: _ViOGcMXtboZDHxcp,
        value: _xfAKCMFjFRznTnje
      } = await _mbaxDGhgHkhYiXMf.read();
      
      if (_ViOGcMXtboZDHxcp) break;
      
      _hasIncomingData = true;
      
      if (_YHRMXlCNQXcLTQTX.readyState !== WS_READY_STATE_OPEN) break;
      
      if (!_jVqfgMYADQeWjGUf) {
        const _gBTJNTavaUowSECF = new Uint8Array(_fjzIINYImWgZaPDP.byteLength + _xfAKCMFjFRznTnje.byteLength);
        _gBTJNTavaUowSECF.set(_fjzIINYImWgZaPDP, 0);
        _gBTJNTavaUowSECF.set(_xfAKCMFjFRznTnje, _fjzIINYImWgZaPDP.byteLength);
        _YHRMXlCNQXcLTQTX.send(_gBTJNTavaUowSECF);
        _jVqfgMYADQeWjGUf = true;
      } else {
        _YHRMXlCNQXcLTQTX.send(_xfAKCMFjFRznTnje);
      }
    }
  } finally {
    _mbaxDGhgHkhYiXMf.releaseLock();
    
    // 关键：如果没有收到任何数据且提供了回退回调，则触发回退
    if (!_hasIncomingData && _fallbackCallback) {
      console.log("No incoming data detected, triggering fallback...");
      await _fallbackCallback();
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
      _YHRMXlCNQXcLTQTX.addEventListener('error', _fVheVUSIAbHdlEXQ => 
        _umAYPzwPqpEFUFDI.error(_fVheVUSIAbHdlEXQ)
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
