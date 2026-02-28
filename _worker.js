const _ucSIfeylPmmwPywd = 'd14bd0e0-9ade-4824-aa96-03bbe680b4db';
let _AnUEokBygnUUnhXA = '',
  _XgNAWphIrQRRJREX = null,
  _msciumxHPWkAzsip = false,
  _NceZJpWIPkoyytKu = '',
  _gRkxdjwXYCJqIfwd = {};
export default {
  async fetch(_IqvuOzvuUgHiTsVs) {
    try {
      const _FOmTLgyyyjqRMjWN = new URL(_IqvuOzvuUgHiTsVs.url);
      const _OQKgTPElgHmPbZjg = _IqvuOzvuUgHiTsVs.headers.get('Upgrade');
      if (_OQKgTPElgHmPbZjg !== 'websocket') {
        return new Response('Hello World!', {
          status: 200
        });
      } else {
        _AnUEokBygnUUnhXA = _AnUEokBygnUUnhXA ? _AnUEokBygnUUnhXA : _IqvuOzvuUgHiTsVs.cf.colo + '.proxyIP.cmliuSSSS.NET';
        await _enTHzlMEBvbKFmuw(_IqvuOzvuUgHiTsVs);
        const [_DHeVqFlwKHeULWzS, _RliumlmjnVgKQOGY] = await _tsrQCKvaViJGOWSC(_AnUEokBygnUUnhXA);
        return await _GyAsfvLnVXPdVEvv(_IqvuOzvuUgHiTsVs, {
          parsedSocks5Address: _gRkxdjwXYCJqIfwd,
          enableSocks: _XgNAWphIrQRRJREX,
          enableGlobalSocks: _msciumxHPWkAzsip,
          ProxyIP: _DHeVqFlwKHeULWzS,
          ProxyPort: _RliumlmjnVgKQOGY
        });
      }
    } catch (_ODtYqPDlCBsDyRuc) {
      return new Response(_ODtYqPDlCBsDyRuc && _ODtYqPDlCBsDyRuc.stack ? _ODtYqPDlCBsDyRuc.stack : String(_ODtYqPDlCBsDyRuc), {
        status: 500
      });
    }
  }
};
async function _GyAsfvLnVXPdVEvv(_IqvuOzvuUgHiTsVs, _wplpyjnDPkjJPIlo) {
  const {
    parsedSocks5Address: _gRkxdjwXYCJqIfwd,
    enableSocks: _dMirdpofTYworNGs,
    enableGlobalSocks: _ZhcBARVFLJBsOkNQ,
    ProxyIP: _zHbHXuPWHEwxhDrM,
    ProxyPort: _hTfTaqzMIsDwandz
  } = _wplpyjnDPkjJPIlo;
  const _tZXSbtIvHbkESoiq = new WebSocketPair();
  const [_IroBQBZdxvONdlBa, _JkRGSvklsUaSNqqJ] = Object.values(_tZXSbtIvHbkESoiq);
  _JkRGSvklsUaSNqqJ.accept();
  let _kdyevsyPmvipboUH = setInterval(() => {
    if (_JkRGSvklsUaSNqqJ.readyState === _sIWkGyzFinGhzPWm) {
      try {
        _JkRGSvklsUaSNqqJ.send(new Uint8Array(0));
      } catch (_jbuLltaKZPJhYCrM) {}
    }
  }, 30000);
  function _vxnzveuRYOzfeMWK() {
    if (_kdyevsyPmvipboUH) {
      clearInterval(_kdyevsyPmvipboUH);
      _kdyevsyPmvipboUH = null;
    }
  }
  _JkRGSvklsUaSNqqJ.addEventListener('close', _vxnzveuRYOzfeMWK);
  _JkRGSvklsUaSNqqJ.addEventListener('error', _vxnzveuRYOzfeMWK);
  const _brKTRKwgtuFZlLId = _IqvuOzvuUgHiTsVs.headers.get('sec-websocket-protocol') || '';
  const _GGqZtjvyWfFGVfYp = _MUvpDnNsNiLeQgph(_JkRGSvklsUaSNqqJ, _brKTRKwgtuFZlLId);
  let _cgecpcFizqKFnxkQ = null;
  let _FRnmtjwJuZCjvPCe = null;
  let _gdaLrXrlJYassswX = false;
  _GGqZtjvyWfFGVfYp.pipeTo(new WritableStream({
    async write(_IYXnGvKlTOpRXNsM) {
      if (_gdaLrXrlJYassswX && _FRnmtjwJuZCjvPCe) {
        return _FRnmtjwJuZCjvPCe(_IYXnGvKlTOpRXNsM);
      }
      if (_cgecpcFizqKFnxkQ) {
        try {
          const _dwKuczqwQYjuFWCg = _cgecpcFizqKFnxkQ.writable.getWriter();
          await _dwKuczqwQYjuFWCg.write(_IYXnGvKlTOpRXNsM);
          _dwKuczqwQYjuFWCg.releaseLock();
        } catch (_ODtYqPDlCBsDyRuc) {
          _lIJzFrylwVBsTRrC(_cgecpcFizqKFnxkQ);
          throw _ODtYqPDlCBsDyRuc;
        }
        return;
      }
      const _dbgPWdGomKSsLTAj = _vXnxDIZCbxlsKpCb(_IYXnGvKlTOpRXNsM);
      if (_dbgPWdGomKSsLTAj.hasError) throw new Error(_dbgPWdGomKSsLTAj.message);
      if (_dbgPWdGomKSsLTAj.addressRemote.includes(atob('c3BlZWQuY2xvdWRmbGFyZS5jb20='))) throw new Error('Access');
      const _uTGcrclYYmoEnBMQ = new Uint8Array([_dbgPWdGomKSsLTAj.vlessVersion[0], 0]);
      const _VsoxcDDnrUVrYTUT = _IYXnGvKlTOpRXNsM.slice(_dbgPWdGomKSsLTAj.rawDataIndex);
      if (_dbgPWdGomKSsLTAj.isUDP) {
        if (_dbgPWdGomKSsLTAj.portRemote === 53) {
          _gdaLrXrlJYassswX = true;
          const {
            write: _dzYZsvoBUfnQdxAH
          } = await _RYFBOEySwtFcfbeS(_JkRGSvklsUaSNqqJ, _uTGcrclYYmoEnBMQ);
          _FRnmtjwJuZCjvPCe = _dzYZsvoBUfnQdxAH;
          _FRnmtjwJuZCjvPCe(_VsoxcDDnrUVrYTUT);
          return;
        } else {
          throw new Error('UDP代理仅支持DNS(端口53)');
        }
      }
      async function _iPROMNLGPITnjJEP(_DrSPCwRiwhAOJdJX, _PINFlmrzJsBxjQgL) {
        const _phSmcSdQFcmGbMsL = await connect({
          hostname: _DrSPCwRiwhAOJdJX,
          port: _PINFlmrzJsBxjQgL
        }, {
          allowHalfOpen: true
        });
        _cgecpcFizqKFnxkQ = _phSmcSdQFcmGbMsL;
        const _dwKuczqwQYjuFWCg = _phSmcSdQFcmGbMsL.writable.getWriter();
        await _dwKuczqwQYjuFWCg.write(_VsoxcDDnrUVrYTUT);
        _dwKuczqwQYjuFWCg.releaseLock();
        return _phSmcSdQFcmGbMsL;
      }
      async function _HmwmQBRENseCBTPg(_DrSPCwRiwhAOJdJX, _PINFlmrzJsBxjQgL) {
        const _phSmcSdQFcmGbMsL = _dMirdpofTYworNGs === 'socks5' ? await _VfuinkQdJcVqydma(_dbgPWdGomKSsLTAj.addressType, _DrSPCwRiwhAOJdJX, _PINFlmrzJsBxjQgL, _gRkxdjwXYCJqIfwd) : await _QCRzMBEQMbRTMUKN(_dbgPWdGomKSsLTAj.addressType, _DrSPCwRiwhAOJdJX, _PINFlmrzJsBxjQgL, _gRkxdjwXYCJqIfwd);
        _cgecpcFizqKFnxkQ = _phSmcSdQFcmGbMsL;
        const _dwKuczqwQYjuFWCg = _phSmcSdQFcmGbMsL.writable.getWriter();
        await _dwKuczqwQYjuFWCg.write(_VsoxcDDnrUVrYTUT);
        _dwKuczqwQYjuFWCg.releaseLock();
        return _phSmcSdQFcmGbMsL;
      }
      async function _ISHhspnibgfaSIoS() {
        try {
          let _phSmcSdQFcmGbMsL;
          if (_dMirdpofTYworNGs === 'socks5') {
            _phSmcSdQFcmGbMsL = await _VfuinkQdJcVqydma(_dbgPWdGomKSsLTAj.addressType, _dbgPWdGomKSsLTAj.addressRemote, _dbgPWdGomKSsLTAj.portRemote, _gRkxdjwXYCJqIfwd);
          } else if (_dMirdpofTYworNGs === 'http') {
            _phSmcSdQFcmGbMsL = await _QCRzMBEQMbRTMUKN(_dbgPWdGomKSsLTAj.addressType, _dbgPWdGomKSsLTAj.addressRemote, _dbgPWdGomKSsLTAj.portRemote, _gRkxdjwXYCJqIfwd);
          } else {
            _phSmcSdQFcmGbMsL = await connect({
              hostname: _zHbHXuPWHEwxhDrM,
              port: _hTfTaqzMIsDwandz
            }, {
              allowHalfOpen: true
            });
          }
          _cgecpcFizqKFnxkQ = _phSmcSdQFcmGbMsL;
          const _dwKuczqwQYjuFWCg = _phSmcSdQFcmGbMsL.writable.getWriter();
          await _dwKuczqwQYjuFWCg.write(_VsoxcDDnrUVrYTUT);
          _dwKuczqwQYjuFWCg.releaseLock();
          _phSmcSdQFcmGbMsL.closed.catch(() => {}).finally(() => {
            if (_JkRGSvklsUaSNqqJ.readyState === _sIWkGyzFinGhzPWm) {
              _JkRGSvklsUaSNqqJ.close(1000, '连接已关闭');
            }
          });
          _gyKLiNBfYqCGhYdg(_phSmcSdQFcmGbMsL, _JkRGSvklsUaSNqqJ, _uTGcrclYYmoEnBMQ, null);
        } catch (_ODtYqPDlCBsDyRuc) {
          _lIJzFrylwVBsTRrC(_cgecpcFizqKFnxkQ);
          _JkRGSvklsUaSNqqJ.close(1011, '代理连接失败: ' + (_ODtYqPDlCBsDyRuc && _ODtYqPDlCBsDyRuc.message ? _ODtYqPDlCBsDyRuc.message : _ODtYqPDlCBsDyRuc));
        }
      }
      try {
        if (_ZhcBARVFLJBsOkNQ) {
          const _phSmcSdQFcmGbMsL = await _HmwmQBRENseCBTPg(_dbgPWdGomKSsLTAj.addressRemote, _dbgPWdGomKSsLTAj.portRemote);
          _gyKLiNBfYqCGhYdg(_phSmcSdQFcmGbMsL, _JkRGSvklsUaSNqqJ, _uTGcrclYYmoEnBMQ, _ISHhspnibgfaSIoS);
        } else {
          const _phSmcSdQFcmGbMsL = await _iPROMNLGPITnjJEP(_dbgPWdGomKSsLTAj.addressRemote, _dbgPWdGomKSsLTAj.portRemote);
          _gyKLiNBfYqCGhYdg(_phSmcSdQFcmGbMsL, _JkRGSvklsUaSNqqJ, _uTGcrclYYmoEnBMQ, _ISHhspnibgfaSIoS);
        }
      } catch (_ODtYqPDlCBsDyRuc) {
        _lIJzFrylwVBsTRrC(_cgecpcFizqKFnxkQ);
        _JkRGSvklsUaSNqqJ.close(1011, '连接失败: ' + (_ODtYqPDlCBsDyRuc && _ODtYqPDlCBsDyRuc.message ? _ODtYqPDlCBsDyRuc.message : _ODtYqPDlCBsDyRuc));
      }
    },
    close() {
      if (_cgecpcFizqKFnxkQ) {
        _lIJzFrylwVBsTRrC(_cgecpcFizqKFnxkQ);
      }
    }
  })).catch(_ODtYqPDlCBsDyRuc => {
    _lIJzFrylwVBsTRrC(_cgecpcFizqKFnxkQ);
    _JkRGSvklsUaSNqqJ.close(1011, '内部错误: ' + (_ODtYqPDlCBsDyRuc && _ODtYqPDlCBsDyRuc.message ? _ODtYqPDlCBsDyRuc.message : _ODtYqPDlCBsDyRuc));
  });
  return new Response(null, {
    status: 101,
    webSocket: _IroBQBZdxvONdlBa
  });
}
function _MUvpDnNsNiLeQgph(_xoRSmwKWiBLnWAcj, _brKTRKwgtuFZlLId) {
  return new ReadableStream({
    start(_GCxkodEFMTiHYIcv) {
      _xoRSmwKWiBLnWAcj.addEventListener('message', _EskEVrknscPAVbih => {
        _GCxkodEFMTiHYIcv.enqueue(_EskEVrknscPAVbih.data);
      });
      _xoRSmwKWiBLnWAcj.addEventListener('close', () => {
        _GCxkodEFMTiHYIcv.close();
      });
      _xoRSmwKWiBLnWAcj.addEventListener('error', _ODtYqPDlCBsDyRuc => {
        _GCxkodEFMTiHYIcv.error(_ODtYqPDlCBsDyRuc);
      });
      if (_brKTRKwgtuFZlLId) {
        try {
          const _iALamEhTszkHXLwb = atob(_brKTRKwgtuFZlLId.replace(/-/g, '+').replace(/_/g, '/'));
          const _NFryCmlNFdRbBzaM = Uint8Array.from(_iALamEhTszkHXLwb, _urplZyKnXZUQsNly => _urplZyKnXZUQsNly.charCodeAt(0));
          _GCxkodEFMTiHYIcv.enqueue(_NFryCmlNFdRbBzaM.buffer);
        } catch (_jbuLltaKZPJhYCrM) {}
      }
    }
  });
}
function _vXnxDIZCbxlsKpCb(_oscykPXtsejwZrHu) {
  if (_oscykPXtsejwZrHu.byteLength < 24) {
    return {
      hasError: true,
      message: '无效的头部长度'
    };
  }
  const _zJjJdIKghHQBaHVZ = new DataView(_oscykPXtsejwZrHu);
  const _ThjPOGnIswmuXnEa = new Uint8Array(_oscykPXtsejwZrHu.slice(0, 1));
  const _uaSXOwpMZYppDSZq = _kvvREiZleJMqiJrx(new Uint8Array(_oscykPXtsejwZrHu.slice(1, 17)));
  if (_ucSIfeylPmmwPywd && _uaSXOwpMZYppDSZq !== _ucSIfeylPmmwPywd) {
    return {
      hasError: true,
      message: '无效的用户'
    };
  }
  const _qFbAliuhBCaSgqAr = _zJjJdIKghHQBaHVZ.getUint8(17);
  const _guwndPiMihMOHjUq = _zJjJdIKghHQBaHVZ.getUint8(18 + _qFbAliuhBCaSgqAr);
  let _zKIHaRotjAlOQjIz = false;
  if (_guwndPiMihMOHjUq === 1) {} else if (_guwndPiMihMOHjUq === 2) {
    _zKIHaRotjAlOQjIz = true;
  } else {
    return {
      hasError: true,
      message: '不支持的命令，仅支持TCP(01)和UDP(02)'
    };
  }
  let _SsDrfZaSFWPyteBD = 19 + _qFbAliuhBCaSgqAr;
  const _PINFlmrzJsBxjQgL = _zJjJdIKghHQBaHVZ.getUint16(_SsDrfZaSFWPyteBD);
  _SsDrfZaSFWPyteBD += 2;
  const _XPSusBMgILNviFZT = _zJjJdIKghHQBaHVZ.getUint8(_SsDrfZaSFWPyteBD++);
  let _DrSPCwRiwhAOJdJX = '';
  switch (_XPSusBMgILNviFZT) {
    case 1:
      _DrSPCwRiwhAOJdJX = Array.from(new Uint8Array(_oscykPXtsejwZrHu.slice(_SsDrfZaSFWPyteBD, _SsDrfZaSFWPyteBD + 4))).join('.');
      _SsDrfZaSFWPyteBD += 4;
      break;
    case 2:
      const _ZyeZDBjJGWugdCHl = _zJjJdIKghHQBaHVZ.getUint8(_SsDrfZaSFWPyteBD++);
      _DrSPCwRiwhAOJdJX = new TextDecoder().decode(_oscykPXtsejwZrHu.slice(_SsDrfZaSFWPyteBD, _SsDrfZaSFWPyteBD + _ZyeZDBjJGWugdCHl));
      _SsDrfZaSFWPyteBD += _ZyeZDBjJGWugdCHl;
      break;
    case 3:
      const _pTURJgTfPEsZdAMj = [];
      for (let _unqhariKMojDcNkG = 0; _unqhariKMojDcNkG < 8; _unqhariKMojDcNkG++) {
        _pTURJgTfPEsZdAMj.push(_zJjJdIKghHQBaHVZ.getUint16(_SsDrfZaSFWPyteBD).toString(16).padStart(4, '0'));
        _SsDrfZaSFWPyteBD += 2;
      }
      _DrSPCwRiwhAOJdJX = _pTURJgTfPEsZdAMj.join(':').replace(/(^|:)0+(\w)/g, '$1$2');
      break;
    default:
      return {
        hasError: true,
        message: '不支持的地址类型'
      };
  }
  return {
    hasError: false,
    addressRemote: _DrSPCwRiwhAOJdJX,
    portRemote: _PINFlmrzJsBxjQgL,
    rawDataIndex: _SsDrfZaSFWPyteBD,
    vlessVersion: _ThjPOGnIswmuXnEa,
    isUDP: _zKIHaRotjAlOQjIz,
    addressType: _XPSusBMgILNviFZT
  };
}
async function _gyKLiNBfYqCGhYdg(_cgecpcFizqKFnxkQ, _xoRSmwKWiBLnWAcj, _XVAdUgPnqVobtKuv, _ISHhspnibgfaSIoS = null, _IbbSulfseTKNaJMS = 0) {
  const _cMZnzhRgyagqLdWC = 8;
  const _cpiqWQcFydbpobkh = 128 * 1024;
  const _LymBfnmqkTjhpLft = 2 * 1024 * 1024;
  const _BUzMGmrSXAIhzLQH = 10;
  const _pCTjuuAgNPypZUkk = 200;
  let _TlJtnsSzTrRBBWIV = false;
  let _GiGzltigVRhXKJeP = false;
  let _JLGLGVrDgQZofBQi = [];
  let _dnJNFStzvOAqvYEp = 0;
  const _JZrOMsRodtwDExqN = _OmrtlVgLqGQoVEIv => {
    if (_OmrtlVgLqGQoVEIv.length === 1) return _OmrtlVgLqGQoVEIv[0];
    const _aDbqdWdMUNkWLMDR = _OmrtlVgLqGQoVEIv.reduce((_UGiSciqHjXHnCGRg, _urplZyKnXZUQsNly) => _UGiSciqHjXHnCGRg + _urplZyKnXZUQsNly.byteLength, 0);
    const _wOqDOckuLxKNPtEl = new Uint8Array(_aDbqdWdMUNkWLMDR);
    let _SsDrfZaSFWPyteBD = 0;
    for (const _urplZyKnXZUQsNly of _OmrtlVgLqGQoVEIv) {
      _wOqDOckuLxKNPtEl.set(_urplZyKnXZUQsNly, _SsDrfZaSFWPyteBD);
      _SsDrfZaSFWPyteBD += _urplZyKnXZUQsNly.byteLength;
    }
    return _wOqDOckuLxKNPtEl;
  };
  const _ViHxcdqhjiixhrWc = _NFryCmlNFdRbBzaM => {
    let _SsDrfZaSFWPyteBD = 0;
    while (_SsDrfZaSFWPyteBD < _NFryCmlNFdRbBzaM.byteLength) {
      const _tYalNHIECwbAbfiQ = Math.min(_SsDrfZaSFWPyteBD + _cpiqWQcFydbpobkh, _NFryCmlNFdRbBzaM.byteLength);
      _xoRSmwKWiBLnWAcj.send(_NFryCmlNFdRbBzaM.slice(_SsDrfZaSFWPyteBD, _tYalNHIECwbAbfiQ));
      _SsDrfZaSFWPyteBD = _tYalNHIECwbAbfiQ;
    }
  };
  const _lqwdfrDNsJTYKtkb = () => {
    if (_xoRSmwKWiBLnWAcj.readyState !== _sIWkGyzFinGhzPWm || _JLGLGVrDgQZofBQi.length === 0) return;
    const _wOqDOckuLxKNPtEl = _JZrOMsRodtwDExqN(_JLGLGVrDgQZofBQi);
    _JLGLGVrDgQZofBQi = [];
    _dnJNFStzvOAqvYEp = 0;
    _ViHxcdqhjiixhrWc(_wOqDOckuLxKNPtEl);
  };
  const _YkxxVTFNybgarpNx = setInterval(_lqwdfrDNsJTYKtkb, _BUzMGmrSXAIhzLQH);
  const _JmnptvMKOgRwCqjH = _cgecpcFizqKFnxkQ.readable.getReader();
  try {
    while (true) {
      const {
        done: _gxCEQIEjcoGIivTj,
        value: _BIBgEenrEyGONlxV
      } = await _JmnptvMKOgRwCqjH.read();
      if (_gxCEQIEjcoGIivTj) break;
      _GiGzltigVRhXKJeP = true;
      if (_xoRSmwKWiBLnWAcj.readyState !== _sIWkGyzFinGhzPWm) break;
      if (!_TlJtnsSzTrRBBWIV) {
        const _xyKUsyuHuSdQNACk = new Uint8Array(_XVAdUgPnqVobtKuv.byteLength + _BIBgEenrEyGONlxV.byteLength);
        _xyKUsyuHuSdQNACk.set(new Uint8Array(_XVAdUgPnqVobtKuv), 0);
        _xyKUsyuHuSdQNACk.set(_BIBgEenrEyGONlxV, _XVAdUgPnqVobtKuv.byteLength);
        _JLGLGVrDgQZofBQi.push(_xyKUsyuHuSdQNACk);
        _dnJNFStzvOAqvYEp += _xyKUsyuHuSdQNACk.byteLength;
        _TlJtnsSzTrRBBWIV = true;
      } else {
        _JLGLGVrDgQZofBQi.push(_BIBgEenrEyGONlxV);
        _dnJNFStzvOAqvYEp += _BIBgEenrEyGONlxV.byteLength;
      }
      if (_dnJNFStzvOAqvYEp >= _LymBfnmqkTjhpLft) {
        _lqwdfrDNsJTYKtkb();
      }
    }
    _JmnptvMKOgRwCqjH.releaseLock();
    _lqwdfrDNsJTYKtkb();
    clearInterval(_YkxxVTFNybgarpNx);
    if (!_GiGzltigVRhXKJeP && _ISHhspnibgfaSIoS && _IbbSulfseTKNaJMS < _cMZnzhRgyagqLdWC) {
      const _NYeqTLxdOPUakvCs = _pCTjuuAgNPypZUkk * Math.pow(2, _IbbSulfseTKNaJMS);
      console.warn(`未收到数据，${_NYeqTLxdOPUakvCs} ms 后重试 (${_IbbSulfseTKNaJMS + 1}/${_cMZnzhRgyagqLdWC})`);
      await new Promise(_ZviOdTsWJtnPXpfw => setTimeout(_ZviOdTsWJtnPXpfw, _NYeqTLxdOPUakvCs));
      await _ISHhspnibgfaSIoS();
      return;
    }
    if (_xoRSmwKWiBLnWAcj.readyState === _sIWkGyzFinGhzPWm) _xoRSmwKWiBLnWAcj.close(1000, '正常关闭');
  } catch (_ODtYqPDlCBsDyRuc) {
    _JmnptvMKOgRwCqjH.releaseLock();
    clearInterval(_YkxxVTFNybgarpNx);
    console.error('数据传输错误:', _ODtYqPDlCBsDyRuc);
    _lIJzFrylwVBsTRrC(_cgecpcFizqKFnxkQ);
    if (_ISHhspnibgfaSIoS && _IbbSulfseTKNaJMS < _cMZnzhRgyagqLdWC) {
      const _NYeqTLxdOPUakvCs = _pCTjuuAgNPypZUkk * Math.pow(2, _IbbSulfseTKNaJMS);
      console.warn(`错误重试 (${_IbbSulfseTKNaJMS + 1}/${_cMZnzhRgyagqLdWC})，将在 ${_NYeqTLxdOPUakvCs} ms 后重试`);
      await new Promise(_ZviOdTsWJtnPXpfw => setTimeout(_ZviOdTsWJtnPXpfw, _NYeqTLxdOPUakvCs));
      await _ISHhspnibgfaSIoS();
      return;
    }
    if (_xoRSmwKWiBLnWAcj.readyState === _sIWkGyzFinGhzPWm) {
      _xoRSmwKWiBLnWAcj.close(1011, '数据传输错误');
    }
  }
}
function _lIJzFrylwVBsTRrC(_GOAChfrzbyFRCTOO) {
  if (_GOAChfrzbyFRCTOO) {
    try {
      _GOAChfrzbyFRCTOO.close();
    } catch (_jbuLltaKZPJhYCrM) {}
  }
}
function _kvvREiZleJMqiJrx(_OhWGfUWEBvksjIPf) {
  const _EYVGJdRwXeRzZxMm = Array.from(_OhWGfUWEBvksjIPf, _zOwhCtONrNxAyaGU => _zOwhCtONrNxAyaGU.toString(16).padStart(2, '0')).join('');
  return `${_EYVGJdRwXeRzZxMm.slice(0, 8)}-${_EYVGJdRwXeRzZxMm.slice(8, 12)}-${_EYVGJdRwXeRzZxMm.slice(12, 16)}-${_EYVGJdRwXeRzZxMm.slice(16, 20)}-${_EYVGJdRwXeRzZxMm.slice(20)}`;
}
async function _VfuinkQdJcVqydma(_XPSusBMgILNviFZT, _rrPINtMzUGUEXtLJ, _woGcXuJjLNSAUnMF, _gRkxdjwXYCJqIfwd) {
  const {
    username: _LDJZrpjWzMpRenkr,
    password: _PbNLysaAxkrZJjAg,
    hostname: _XNvSqPuiAKlmThKD,
    port: _PINFlmrzJsBxjQgL
  } = _gRkxdjwXYCJqIfwd;
  const _GOAChfrzbyFRCTOO = connect({
    hostname: _XNvSqPuiAKlmThKD,
    port: _PINFlmrzJsBxjQgL
  });
  const _xYDArhDcBVdqdCRr = new Uint8Array([5, 2, 0, 2]);
  const _dwKuczqwQYjuFWCg = _GOAChfrzbyFRCTOO.writable.getWriter();
  await _dwKuczqwQYjuFWCg.write(_xYDArhDcBVdqdCRr);
  const _JmnptvMKOgRwCqjH = _GOAChfrzbyFRCTOO.readable.getReader();
  const _bERNYEhArbvMcmPS = new TextEncoder();
  let _zHNOyQShQhnYsYla = (await _JmnptvMKOgRwCqjH.read()).value;
  if (_zHNOyQShQhnYsYla[0] !== 0x05) {
    throw new Error(`socks server version error: ${_zHNOyQShQhnYsYla[0]} expected: 5`);
  }
  if (_zHNOyQShQhnYsYla[1] === 0xff) {
    throw new Error("no acceptable methods");
  }
  if (_zHNOyQShQhnYsYla[1] === 0x02) {
    if (!_LDJZrpjWzMpRenkr || !_PbNLysaAxkrZJjAg) {
      throw new Error("please provide username/password");
    }
    const _tIkEhenJQwloXwMy = new Uint8Array([1, _LDJZrpjWzMpRenkr.length, ..._bERNYEhArbvMcmPS.encode(_LDJZrpjWzMpRenkr), _PbNLysaAxkrZJjAg.length, ..._bERNYEhArbvMcmPS.encode(_PbNLysaAxkrZJjAg)]);
    await _dwKuczqwQYjuFWCg.write(_tIkEhenJQwloXwMy);
    _zHNOyQShQhnYsYla = (await _JmnptvMKOgRwCqjH.read()).value;
    if (_zHNOyQShQhnYsYla[0] !== 0x01 || _zHNOyQShQhnYsYla[1] !== 0x00) {
      throw new Error("fail to auth socks server");
    }
  }
  let _XcyrgsBvAzUyDpwq;
  switch (_XPSusBMgILNviFZT) {
    case 1:
      _XcyrgsBvAzUyDpwq = new Uint8Array([1, ..._rrPINtMzUGUEXtLJ.split('.').map(Number)]);
      break;
    case 2:
      _XcyrgsBvAzUyDpwq = new Uint8Array([3, _rrPINtMzUGUEXtLJ.length, ..._bERNYEhArbvMcmPS.encode(_rrPINtMzUGUEXtLJ)]);
      break;
    case 3:
      _XcyrgsBvAzUyDpwq = new Uint8Array([4, ..._rrPINtMzUGUEXtLJ.split(':').flatMap(_WjLaYHQUSmTUOJQu => [parseInt(_WjLaYHQUSmTUOJQu.slice(0, 2), 16), parseInt(_WjLaYHQUSmTUOJQu.slice(2), 16)])]);
      break;
    default:
      throw new Error(`invalid addressType is ${_XPSusBMgILNviFZT}`);
  }
  const _hFlYetTOWtNUTJNf = new Uint8Array([5, 1, 0, ..._XcyrgsBvAzUyDpwq, _woGcXuJjLNSAUnMF >> 8, _woGcXuJjLNSAUnMF & 0xff]);
  await _dwKuczqwQYjuFWCg.write(_hFlYetTOWtNUTJNf);
  _zHNOyQShQhnYsYla = (await _JmnptvMKOgRwCqjH.read()).value;
  if (_zHNOyQShQhnYsYla[1] === 0x00) {} else {
    throw new Error("fail to open socks connection");
  }
  _dwKuczqwQYjuFWCg.releaseLock();
  _JmnptvMKOgRwCqjH.releaseLock();
  return _GOAChfrzbyFRCTOO;
}
async function _QCRzMBEQMbRTMUKN(_XPSusBMgILNviFZT, _rrPINtMzUGUEXtLJ, _woGcXuJjLNSAUnMF, _gRkxdjwXYCJqIfwd) {
  const {
    username: _LDJZrpjWzMpRenkr,
    password: _PbNLysaAxkrZJjAg,
    hostname: _XNvSqPuiAKlmThKD,
    port: _PINFlmrzJsBxjQgL
  } = _gRkxdjwXYCJqIfwd;
  const _BRmQGmndgnwgeFiW = await connect({
    hostname: _XNvSqPuiAKlmThKD,
    port: _PINFlmrzJsBxjQgL
  });
  let _WbBfrOkBwbyCQMwG = `CONNECT ${_rrPINtMzUGUEXtLJ}:${_woGcXuJjLNSAUnMF} HTTP/1.1\r\n`;
  _WbBfrOkBwbyCQMwG += `Host: ${_rrPINtMzUGUEXtLJ}:${_woGcXuJjLNSAUnMF}\r\n`;
  if (_LDJZrpjWzMpRenkr && _PbNLysaAxkrZJjAg) {
    const _xxsnNjCVdmwiKoJv = `${_LDJZrpjWzMpRenkr}:${_PbNLysaAxkrZJjAg}`;
    const _aDhuMawLXjsFYlvC = btoa(_xxsnNjCVdmwiKoJv);
    _WbBfrOkBwbyCQMwG += `Proxy-Authorization: Basic ${_aDhuMawLXjsFYlvC}\r\n`;
  }
  _WbBfrOkBwbyCQMwG += `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n`;
  _WbBfrOkBwbyCQMwG += `Proxy-Connection: Keep-Alive\r\n`;
  _WbBfrOkBwbyCQMwG += `Connection: Keep-Alive\r\n`;
  _WbBfrOkBwbyCQMwG += `\r\n`;
  try {
    const _dwKuczqwQYjuFWCg = _BRmQGmndgnwgeFiW.writable.getWriter();
    await _dwKuczqwQYjuFWCg.write(new TextEncoder().encode(_WbBfrOkBwbyCQMwG));
    _dwKuczqwQYjuFWCg.releaseLock();
  } catch (_ODtYqPDlCBsDyRuc) {
    console.error('发送HTTP CONNECT请求失败:', _ODtYqPDlCBsDyRuc);
    throw new Error(`发送HTTP CONNECT请求失败: ${_ODtYqPDlCBsDyRuc.message}`);
  }
  const _JmnptvMKOgRwCqjH = _BRmQGmndgnwgeFiW.readable.getReader();
  let _vuVpEWEFEcxLsIhJ = '';
  let _EvbdaBXKEesJOvsb = false;
  let _mCQHPVQcTYzdSvAN = new Uint8Array(0);
  try {
    while (true) {
      const {
        value: _BIBgEenrEyGONlxV,
        done: _gxCEQIEjcoGIivTj
      } = await _JmnptvMKOgRwCqjH.read();
      if (_gxCEQIEjcoGIivTj) {
        console.error('HTTP代理连接中断');
        throw new Error('HTTP代理连接中断');
      }
      const _tFeTtqdwTPHmKqbl = new Uint8Array(_mCQHPVQcTYzdSvAN.length + _BIBgEenrEyGONlxV.length);
      _tFeTtqdwTPHmKqbl.set(_mCQHPVQcTYzdSvAN);
      _tFeTtqdwTPHmKqbl.set(_BIBgEenrEyGONlxV, _mCQHPVQcTYzdSvAN.length);
      _mCQHPVQcTYzdSvAN = _tFeTtqdwTPHmKqbl;
      _vuVpEWEFEcxLsIhJ = new TextDecoder().decode(_mCQHPVQcTYzdSvAN);
      if (_vuVpEWEFEcxLsIhJ.includes('\r\n\r\n')) {
        const _VKCuhSakBPPMXugh = _vuVpEWEFEcxLsIhJ.indexOf('\r\n\r\n') + 4;
        const _VObJiuLtZhpjMMyx = _vuVpEWEFEcxLsIhJ.substring(0, _VKCuhSakBPPMXugh);
        if (_VObJiuLtZhpjMMyx.startsWith('HTTP/1.1 200') || _VObJiuLtZhpjMMyx.startsWith('HTTP/1.0 200')) {
          _EvbdaBXKEesJOvsb = true;
          if (_VKCuhSakBPPMXugh < _mCQHPVQcTYzdSvAN.length) {
            const _MVjGhBzSBOMvSLTh = _mCQHPVQcTYzdSvAN.slice(_VKCuhSakBPPMXugh);
            const _zGyVEowQaIXCxZLA = new ReadableStream({
              start(_GCxkodEFMTiHYIcv) {
                _GCxkodEFMTiHYIcv.enqueue(_MVjGhBzSBOMvSLTh);
              }
            });
            const {
              readable: _lQTOGQDrIbucuFSZ,
              writable: _kwlRFEnFWKqDFIfc
            } = new TransformStream();
            _zGyVEowQaIXCxZLA.pipeTo(_kwlRFEnFWKqDFIfc).catch(_ODtYqPDlCBsDyRuc => console.error('处理剩余数据错误:', _ODtYqPDlCBsDyRuc));
            _BRmQGmndgnwgeFiW.readable = _lQTOGQDrIbucuFSZ;
          }
        } else {
          const _vXLNowEQjaFyaWVQ = `HTTP代理连接失败: ${_VObJiuLtZhpjMMyx.split('\r\n')[0]}`;
          console.error(_vXLNowEQjaFyaWVQ);
          throw new Error(_vXLNowEQjaFyaWVQ);
        }
        break;
      }
    }
  } catch (_ODtYqPDlCBsDyRuc) {
    _JmnptvMKOgRwCqjH.releaseLock();
    throw new Error(`处理HTTP代理响应失败: ${_ODtYqPDlCBsDyRuc.message}`);
  }
  _JmnptvMKOgRwCqjH.releaseLock();
  if (!_EvbdaBXKEesJOvsb) {
    throw new Error('HTTP代理连接失败: 未收到成功响应');
  }
  return _BRmQGmndgnwgeFiW;
}
async function _RYFBOEySwtFcfbeS(_hKqvdyNGyJpMAiKy, _saxSSgrExKZzLwQM) {
  let _GNNPQMVASMyEatml = false;
  const _bhvVotkcRFHjymRg = new TransformStream({
    start(_GCxkodEFMTiHYIcv) {},
    transform(_IYXnGvKlTOpRXNsM, _GCxkodEFMTiHYIcv) {
      for (let _fFdyUjxJcARUPimd = 0; _fFdyUjxJcARUPimd < _IYXnGvKlTOpRXNsM.byteLength;) {
        const _DVErlVENxTiQaxxV = _IYXnGvKlTOpRXNsM.slice(_fFdyUjxJcARUPimd, _fFdyUjxJcARUPimd + 2);
        const _TwmNbsvBxCGshXdH = new DataView(_DVErlVENxTiQaxxV).getUint16(0);
        const _njWxpKAbkKbuoEeh = new Uint8Array(_IYXnGvKlTOpRXNsM.slice(_fFdyUjxJcARUPimd + 2, _fFdyUjxJcARUPimd + 2 + _TwmNbsvBxCGshXdH));
        _fFdyUjxJcARUPimd = _fFdyUjxJcARUPimd + 2 + _TwmNbsvBxCGshXdH;
        _GCxkodEFMTiHYIcv.enqueue(_njWxpKAbkKbuoEeh);
      }
    },
    flush(_GCxkodEFMTiHYIcv) {}
  });
  _bhvVotkcRFHjymRg.readable.pipeTo(new WritableStream({
    async write(_IYXnGvKlTOpRXNsM) {
      const _aspuinYFxCNrcktg = await fetch('https://dns.google/dns-query', {
        method: 'POST',
        headers: {
          'content-type': 'application/dns-message'
        },
        body: _IYXnGvKlTOpRXNsM
      });
      const _NktqphkKIAAkYhwV = await _aspuinYFxCNrcktg.arrayBuffer();
      const _nRVfyyeaBOOSwdWZ = _NktqphkKIAAkYhwV.byteLength;
      const _nswiLOdQyyCWAIvS = new Uint8Array([_nRVfyyeaBOOSwdWZ >> 8 & 0xff, _nRVfyyeaBOOSwdWZ & 0xff]);
      if (_hKqvdyNGyJpMAiKy.readyState === _sIWkGyzFinGhzPWm) {
        if (_GNNPQMVASMyEatml) {
          _hKqvdyNGyJpMAiKy.send(await new Blob([_nswiLOdQyyCWAIvS, _NktqphkKIAAkYhwV]).arrayBuffer());
        } else {
          _hKqvdyNGyJpMAiKy.send(await new Blob([_saxSSgrExKZzLwQM, _nswiLOdQyyCWAIvS, _NktqphkKIAAkYhwV]).arrayBuffer());
          _GNNPQMVASMyEatml = true;
        }
      }
    }
  })).catch(_FpDvWAzpBkcyYNQn => {});
  const _dwKuczqwQYjuFWCg = _bhvVotkcRFHjymRg.writable.getWriter();
  return {
    write(_IYXnGvKlTOpRXNsM) {
      _dwKuczqwQYjuFWCg.write(_IYXnGvKlTOpRXNsM);
    }
  };
}
const _sIWkGyzFinGhzPWm = 1;
import { connect } from 'cloudflare:sockets';
async function _tsrQCKvaViJGOWSC(_EpznJMPnnThObtYr) {
  _EpznJMPnnThObtYr = _EpznJMPnnThObtYr.toLowerCase();
  let _SMsznsrGbLZLvmmi = _EpznJMPnnThObtYr,
    _GLReMyasiUAGdlqJ = 443;
  if (_EpznJMPnnThObtYr.includes('.tp')) {
    const _PCEYFjgPqwEhMUyD = _EpznJMPnnThObtYr.match(/\.tp(\d+)/);
    if (_PCEYFjgPqwEhMUyD) _GLReMyasiUAGdlqJ = parseInt(_PCEYFjgPqwEhMUyD[1], 10);
    return [_SMsznsrGbLZLvmmi, _GLReMyasiUAGdlqJ];
  }
  if (_EpznJMPnnThObtYr.includes(']:')) {
    const _QuuRvhnIDqYtGDmW = _EpznJMPnnThObtYr.split(']:');
    _SMsznsrGbLZLvmmi = _QuuRvhnIDqYtGDmW[0] + ']';
    _GLReMyasiUAGdlqJ = parseInt(_QuuRvhnIDqYtGDmW[1], 10) || _GLReMyasiUAGdlqJ;
  } else if (_EpznJMPnnThObtYr.includes(':') && !_EpznJMPnnThObtYr.startsWith('[')) {
    const _enkKvBQAdlKgmDFT = _EpznJMPnnThObtYr.lastIndexOf(':');
    _SMsznsrGbLZLvmmi = _EpznJMPnnThObtYr.slice(0, _enkKvBQAdlKgmDFT);
    _GLReMyasiUAGdlqJ = parseInt(_EpznJMPnnThObtYr.slice(_enkKvBQAdlKgmDFT + 1), 10) || _GLReMyasiUAGdlqJ;
  }
  return [_SMsznsrGbLZLvmmi, _GLReMyasiUAGdlqJ];
}
async function _enTHzlMEBvbKFmuw(_IqvuOzvuUgHiTsVs) {
  const _FOmTLgyyyjqRMjWN = new URL(_IqvuOzvuUgHiTsVs.url);
  const {
    pathname: _ZbuCxpiNMOTCVShZ,
    searchParams: _TySmbysFsOwXTQQI
  } = _FOmTLgyyyjqRMjWN;
  const _gfNXeJFMVhKGcqav = _ZbuCxpiNMOTCVShZ.toLowerCase();
  _NceZJpWIPkoyytKu = _TySmbysFsOwXTQQI.get('socks5') || _TySmbysFsOwXTQQI.get('http') || null;
  _msciumxHPWkAzsip = _TySmbysFsOwXTQQI.has('globalproxy') || false;
  const _NLdKLoCrqqAZCyZR = _gfNXeJFMVhKGcqav.match(/\/(proxyip[.=]|pyip=|ip=)(.+)/);
  if (_TySmbysFsOwXTQQI.has('proxyip')) {
    const _epZVyYuRvrDrHUPk = _TySmbysFsOwXTQQI.get('proxyip');
    _AnUEokBygnUUnhXA = _epZVyYuRvrDrHUPk.includes(',') ? _epZVyYuRvrDrHUPk.split(',')[Math.floor(Math.random() * _epZVyYuRvrDrHUPk.split(',').length)] : _epZVyYuRvrDrHUPk;
    return;
  } else if (_NLdKLoCrqqAZCyZR) {
    const _epZVyYuRvrDrHUPk = _NLdKLoCrqqAZCyZR[1] === 'proxyip.' ? `proxyip.${_NLdKLoCrqqAZCyZR[2]}` : _NLdKLoCrqqAZCyZR[2];
    _AnUEokBygnUUnhXA = _epZVyYuRvrDrHUPk.includes(',') ? _epZVyYuRvrDrHUPk.split(',')[Math.floor(Math.random() * _epZVyYuRvrDrHUPk.split(',').length)] : _epZVyYuRvrDrHUPk;
    return;
  }
  let _lvpVOWHJXfSXbIfd;
  if (_lvpVOWHJXfSXbIfd = _ZbuCxpiNMOTCVShZ.match(/\/(socks5?|http):\/?\/?(.+)/i)) {
    _XgNAWphIrQRRJREX = _lvpVOWHJXfSXbIfd[1].toLowerCase() === 'http' ? 'http' : 'socks5';
    _NceZJpWIPkoyytKu = _lvpVOWHJXfSXbIfd[2].split('#')[0];
    _msciumxHPWkAzsip = true;
    if (_NceZJpWIPkoyytKu.includes('@')) {
      const _DLSeFuwhvmRJCUbQ = _NceZJpWIPkoyytKu.lastIndexOf('@');
      let _hfjyNswfyGovrYft = _NceZJpWIPkoyytKu.substring(0, _DLSeFuwhvmRJCUbQ).replaceAll('%3D', '=');
      if (/^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i.test(_hfjyNswfyGovrYft) && !_hfjyNswfyGovrYft.includes(':')) {
        _hfjyNswfyGovrYft = atob(_hfjyNswfyGovrYft);
      }
      _NceZJpWIPkoyytKu = `${_hfjyNswfyGovrYft}@${_NceZJpWIPkoyytKu.substring(_DLSeFuwhvmRJCUbQ + 1)}`;
    }
  } else if (_lvpVOWHJXfSXbIfd = _ZbuCxpiNMOTCVShZ.match(/\/(g?s5|socks5|g?http)=(.+)/i)) {
    const _NTXqKZfvPjqZyjvO = _lvpVOWHJXfSXbIfd[1].toLowerCase();
    _NceZJpWIPkoyytKu = _lvpVOWHJXfSXbIfd[2];
    _XgNAWphIrQRRJREX = _NTXqKZfvPjqZyjvO.includes('http') ? 'http' : 'socks5';
    _msciumxHPWkAzsip = _NTXqKZfvPjqZyjvO.startsWith('g') || _msciumxHPWkAzsip;
  }
  if (_NceZJpWIPkoyytKu) {
    try {
      _gRkxdjwXYCJqIfwd = await _ydZjRpxuNwItYYmU(_NceZJpWIPkoyytKu);
      _XgNAWphIrQRRJREX = _TySmbysFsOwXTQQI.get('http') ? 'http' : _XgNAWphIrQRRJREX;
    } catch (_ODtYqPDlCBsDyRuc) {
      console.error('解析SOCKS5地址失败:', _ODtYqPDlCBsDyRuc.message);
      _XgNAWphIrQRRJREX = null;
    }
  } else _XgNAWphIrQRRJREX = null;
}
async function _ydZjRpxuNwItYYmU(_DrSPCwRiwhAOJdJX) {
  const _tVQNkvrxaFFpVdSs = _DrSPCwRiwhAOJdJX.lastIndexOf("@");
  let [_nzrmyKNKImNXaNrK, _iqDtOuexpgmjQxkd] = _tVQNkvrxaFFpVdSs === -1 ? [_DrSPCwRiwhAOJdJX, undefined] : [_DrSPCwRiwhAOJdJX.substring(_tVQNkvrxaFFpVdSs + 1), _DrSPCwRiwhAOJdJX.substring(0, _tVQNkvrxaFFpVdSs)];
  let _LDJZrpjWzMpRenkr, _PbNLysaAxkrZJjAg, _XNvSqPuiAKlmThKD, _PINFlmrzJsBxjQgL;
  if (_iqDtOuexpgmjQxkd) {
    const _ZbFjlUKcnfrJOgIK = _iqDtOuexpgmjQxkd.split(":");
    if (_ZbFjlUKcnfrJOgIK.length !== 2) {
      throw new Error('无效的 SOCKS 地址格式：认证部分必须是 "username:password" 的形式');
    }
    [_LDJZrpjWzMpRenkr, _PbNLysaAxkrZJjAg] = _ZbFjlUKcnfrJOgIK;
  }
  const _nIetDybfLPpMbikT = _nzrmyKNKImNXaNrK.split(":");
  if (_nIetDybfLPpMbikT.length > 2 && _nzrmyKNKImNXaNrK.includes("]:")) {
    _PINFlmrzJsBxjQgL = Number(_nzrmyKNKImNXaNrK.split("]:")[1].replace(/[^\d]/g, ''));
    _XNvSqPuiAKlmThKD = _nzrmyKNKImNXaNrK.split("]:")[0] + "]";
  } else if (_nIetDybfLPpMbikT.length === 2) {
    _PINFlmrzJsBxjQgL = Number(_nIetDybfLPpMbikT.pop().replace(/[^\d]/g, ''));
    _XNvSqPuiAKlmThKD = _nIetDybfLPpMbikT.join(":");
  } else {
    _PINFlmrzJsBxjQgL = 80;
    _XNvSqPuiAKlmThKD = _nzrmyKNKImNXaNrK;
  }
  if (isNaN(_PINFlmrzJsBxjQgL)) {
    throw new Error('无效的 SOCKS 地址格式：端口号必须是数字');
  }
  const _CuHjHwbSpzULhDSx = /^\[.*\]$/;
  if (_XNvSqPuiAKlmThKD.includes(":") && !_CuHjHwbSpzULhDSx.test(_XNvSqPuiAKlmThKD)) {
    throw new Error('无效的 SOCKS 地址格式：IPv6 地址必须用方括号括起来，如 [2001:db8::1]');
  }
  return {
    username: _LDJZrpjWzMpRenkr,
    password: _PbNLysaAxkrZJjAg,
    hostname: _XNvSqPuiAKlmThKD,
    port: _PINFlmrzJsBxjQgL
  };
}
