import { connect } from 'cloudflare:sockets';
const _cQndIdPFBwdwdfPS = '/t-vip-9026/auth-888999';
const _rcHzgeggsXmfUWrW = '56892533-7dad-324a-b0e8-51040d0d04ad';
const _JeHxQnQHudDPWbyN = 'yx1.9898981.xyz';
const _JsGTkSTJgBtAOVZl = 8443;
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
    try {
      _jJUejlszoJxKpVyr = await connect({
        hostname: _TyFwoqvKDFIbgSAh.addressRemote,
        port: _TyFwoqvKDFIbgSAh.portRemote
      }, {
        allowHalfOpen: true
      });
      const _UNaMwSaJkLsWDhiI = _jJUejlszoJxKpVyr.writable.getWriter();
      await _UNaMwSaJkLsWDhiI.write(_IxamNRThaYlJuRBk);
      _UNaMwSaJkLsWDhiI.releaseLock();
    } catch (_mjalBDTlbqPeVDbq) {
      _jJUejlszoJxKpVyr = await connect({
        hostname: PROXY_IP,
        port: _JsGTkSTJgBtAOVZl
      }, {
        allowHalfOpen: true
      });
      const _UNaMwSaJkLsWDhiI = _jJUejlszoJxKpVyr.writable.getWriter();
      await _UNaMwSaJkLsWDhiI.write(_IxamNRThaYlJuRBk);
      _UNaMwSaJkLsWDhiI.releaseLock();
    }
    const _sidrNzxcXsWcFyfs = _YXLwwGKkeKknZtyk(_jJUejlszoJxKpVyr, _zNeFASTClFTonTIr, _VMwvXLIMJYZDGMLS);
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
    if (_jJUejlszoJxKpVyr) try {
      _jJUejlszoJxKpVyr.close();
    } catch {}
    if (_zNeFASTClFTonTIr.readyState === 1) _zNeFASTClFTonTIr.close();
  }
}
async function _YXLwwGKkeKknZtyk(_jJUejlszoJxKpVyr, _YHRMXlCNQXcLTQTX, _fjzIINYImWgZaPDP) {
  const _mbaxDGhgHkhYiXMf = _jJUejlszoJxKpVyr.readable.getReader();
  let _jVqfgMYADQeWjGUf = false;
  try {
    while (true) {
      const {
        done: _ViOGcMXtboZDHxcp,
        value: _xfAKCMFjFRznTnje
      } = await _mbaxDGhgHkhYiXMf.read();
      if (_ViOGcMXtboZDHxcp) break;
      if (_YHRMXlCNQXcLTQTX.readyState !== 1) break;
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
  }
}
function _GWHvqQvdiYQMUGEh(_YHRMXlCNQXcLTQTX) {
  return new ReadableStream({
    start(_umAYPzwPqpEFUFDI) {
      _YHRMXlCNQXcLTQTX.addEventListener('message', _fVheVUSIAbHdlEXQ => _umAYPzwPqpEFUFDI.enqueue(new Uint8Array(_fVheVUSIAbHdlEXQ.data)));
      _YHRMXlCNQXcLTQTX.addEventListener('close', () => _umAYPzwPqpEFUFDI.close());
      _YHRMXlCNQXcLTQTX.addEventListener('error', _fVheVUSIAbHdlEXQ => _umAYPzwPqpEFUFDI.error(_fVheVUSIAbHdlEXQ));
    }
  });
}
function _MkxTgzbSwfhpsfJi(_QjfgPTDmcvdvEOSN) {
  if (_QjfgPTDmcvdvEOSN.byteLength < 24) return {
    hasError: true,
    message: 'Invalid header'
  };
  const _igZwspOTXOUDIgpJ = new DataView(_QjfgPTDmcvdvEOSN.buffer);
  const _mQuBmCqLfAfNDGqA = Array.from(new Uint8Array(_QjfgPTDmcvdvEOSN.slice(1, 17))).map(_UgvgeNOVlJZSBxZG => _UgvgeNOVlJZSBxZG.toString(16).padStart(2, '0')).join('');
  if (_mQuBmCqLfAfNDGqA !== _rcHzgeggsXmfUWrW.replace(/-/g, '')) return {
    hasError: true,
    message: 'Unauthorized'
  };
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
    }, (_iuHKolsMIqvRXzVH, _HRhJESqDjdwZmuMt) => _igZwspOTXOUDIgpJ.getUint16(_pWtFmyUVDkElICtU + _HRhJESqDjdwZmuMt * 2).toString(16)).join(':');
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
