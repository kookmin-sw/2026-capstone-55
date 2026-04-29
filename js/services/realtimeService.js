/**
 * RealtimeService - Socket.IO 기반 실시간 통신 서비스
 */

const RealtimeService = (() => {
  let _socket = null;
  let _gpsInterval = null;
  let _sessionRouteInterval = null;
  const _handlers = {};

  function connect(userId) {
    if (_socket && _socket.connected) {
      _socket.emit('register', userId);
      return;
    }
    if (typeof io === 'undefined') {
      console.warn('[RealtimeService] socket.io 클라이언트가 로드되지 않았습니다.');
      return;
    }
    _socket = io({ transports: ['websocket', 'polling'] });
    _socket.on('connect', () => {
      if (userId) _socket.emit('register', userId);
    });

    const EVENTS = [
      'walk-request', 'walk-request-accepted', 'walk-request-rejected',
      'walk-request-cancelled', 'walk-started', 'walk-ended',
      'walker-position', 'walker-status-changed', 'walker-location-updated'
    ];
    EVENTS.forEach(evt => {
      _socket.on(evt, data => {
        (_handlers[evt] || []).forEach(fn => fn(data));
      });
    });
  }

  function disconnect() {
    stopGpsUpdates();
    stopRouteTracking();
    if (_socket) { _socket.disconnect(); _socket = null; }
  }

  function on(event, fn) {
    if (!_handlers[event]) _handlers[event] = [];
    _handlers[event].push(fn);
  }

  function off(event, fn) {
    if (!_handlers[event]) return;
    _handlers[event] = _handlers[event].filter(f => f !== fn);
  }

  function clearHandlers() {
    Object.keys(_handlers).forEach(k => { _handlers[k] = []; });
  }

  // ── GPS 위치 주기 전송 (공유 내부 함수) ──────────────────────

  /**
   * Geolocation을 주기적으로 폴링해 endpoint에 POST/PATCH한다.
   * in-flight 가드: 이전 요청이 완료되지 않으면 다음 틱을 건너뜀.
   *
   * @param {string}   endpoint   - fetch URL
   * @param {string}   method     - 'PATCH' | 'POST'
   * @param {function} bodyFn     - (coords) => JSON body object
   * @param {GeoOptions} geoOpts  - getCurrentPosition 옵션
   * @returns {{ interval: number, stop: function }}
   */
  function _startGeoPolling(endpoint, method, bodyFn, geoOpts, intervalMs) {
    if (!navigator.geolocation) return null;
    let inFlight = false;

    function send() {
      if (inFlight) return;
      inFlight = true;
      navigator.geolocation.getCurrentPosition(
        pos => {
          fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyFn(pos.coords))
          })
          .catch(() => {})
          .finally(() => { inFlight = false; });
        },
        () => { inFlight = false; },
        geoOpts
      );
    }

    send();
    return setInterval(send, intervalMs);
  }

  function startGpsUpdates(userId, intervalMs = 8000) {
    stopGpsUpdates();
    _gpsInterval = _startGeoPolling(
      `/api/walkers/${userId}/location`,
      'PATCH',
      coords => ({ lat: coords.latitude, lng: coords.longitude }),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 3000 },
      intervalMs
    );
  }

  function stopGpsUpdates() {
    if (_gpsInterval) { clearInterval(_gpsInterval); _gpsInterval = null; }
  }

  function startRouteTracking(sessionId, intervalMs = 7000) {
    stopRouteTracking();
    _sessionRouteInterval = _startGeoPolling(
      `/api/walk-sessions/${sessionId}/route`,
      'POST',
      coords => ({ latitude: coords.latitude, longitude: coords.longitude }),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 2000 },
      intervalMs
    );
  }

  function stopRouteTracking() {
    if (_sessionRouteInterval) { clearInterval(_sessionRouteInterval); _sessionRouteInterval = null; }
  }

  return {
    connect, disconnect,
    on, off, clearHandlers,
    startGpsUpdates, stopGpsUpdates,
    startRouteTracking, stopRouteTracking
  };
})();
