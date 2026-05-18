/**
 * GPSTrackingService - GPS 기반 산책 트래킹 서비스
 * 위치 추적, 거리/속도/칼로리 계산, 서버 저장
 * + Wake Lock (화면 꺼짐 방지)
 * + 주기적 서버 동기화 (데이터 유실 방지)
 * + 백그라운드 유지 (Notification + visibilitychange)
 */
const GPSTrackingService = (() => {
  let watchId = null;
  let isTracking = false;
  let startTime = null;
  let coordinates = [];
  let totalDistance = 0;
  let onUpdateCallback = null;

  // 백그라운드 유지 관련
  let _wakeLock = null;
  let _syncInterval = null;
  let _keepAliveInterval = null;
  let _userId = null;
  let _dogId = null;
  let _dogName = null;
  let _lastSyncIdx = 0; // 마지막 서버 동기화된 좌표 인덱스

  // ===== Wake Lock API — 화면 꺼짐 방지 =====
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        _wakeLock = await navigator.wakeLock.request('screen');
        _wakeLock.addEventListener('release', () => {
          console.log('[GPS] Wake Lock 해제됨');
          // 페이지가 다시 보이면 재요청
          if (isTracking) reacquireWakeLock();
        });
        console.log('[GPS] Wake Lock 활성화 — 화면 꺼짐 방지');
        return true;
      }
    } catch (e) {
      console.warn('[GPS] Wake Lock 실패:', e.message);
    }
    return false;
  }

  function releaseWakeLock() {
    if (_wakeLock) {
      _wakeLock.release().catch(() => {});
      _wakeLock = null;
    }
  }

  // 페이지가 다시 보일 때 Wake Lock 재획득
  function reacquireWakeLock() {
    if (isTracking && document.visibilityState === 'visible') {
      requestWakeLock();
    }
  }

  // visibilitychange 이벤트 — 백그라운드 복귀 시 처리
  function handleVisibilityChange() {
    if (!isTracking) return;
    if (document.visibilityState === 'visible') {
      console.log('[GPS] 포그라운드 복귀 — Wake Lock 재요청');
      requestWakeLock();
      // 복귀 시 즉시 UI 업데이트
      if (onUpdateCallback) onUpdateCallback(getCurrentData());
    }
  }

  // ===== 주기적 서버 동기화 (30초마다) =====
  function startPeriodicSync(userId, dogId, dogName) {
    _userId = userId;
    _dogId = dogId;
    _dogName = dogName;
    _lastSyncIdx = 0;

    _syncInterval = setInterval(async () => {
      if (!isTracking || coordinates.length <= _lastSyncIdx) return;
      try {
        const newCoords = coordinates.slice(_lastSyncIdx);
        await fetch('/api/walks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: _userId,
            dogId: _dogId,
            dogName: _dogName,
            partialData: {
              coordinates: newCoords,
              distance: Math.round(totalDistance * 1000) / 1000,
              duration: getElapsedMinutes(),
              startTime: new Date(startTime).toISOString()
            }
          })
        });
        _lastSyncIdx = coordinates.length;
        console.log(`[GPS] 서버 동기화 완료 (${newCoords.length}개 좌표)`);
      } catch (e) {
        // 실패해도 로컬에 계속 기록 중이니 괜찮음
        console.warn('[GPS] 서버 동기화 실패:', e.message);
      }
    }, 30000); // 30초마다
  }

  function stopPeriodicSync() {
    if (_syncInterval) { clearInterval(_syncInterval); _syncInterval = null; }
  }

  // ===== 백그라운드 Keep-Alive (조용한 오디오) =====
  let _silentAudio = null;

  function startKeepAlive() {
    try {
      // 무음 오디오로 브라우저가 탭을 절전하지 않게
      if (!_silentAudio) {
        _silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
        _silentAudio.loop = true;
        _silentAudio.volume = 0.01;
      }
      _silentAudio.play().catch(() => {});
    } catch (e) {}

    // 1분마다 GPS 강제 요청 (백그라운드에서 watchPosition이 멈출 수 있어서)
    _keepAliveInterval = setInterval(() => {
      if (!isTracking) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const point = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: Date.now()
          };
          if (point.accuracy > 50) return;
          if (coordinates.length > 0) {
            const last = coordinates[coordinates.length - 1];
            const dist = calcDistance(last.lat, last.lng, point.lat, point.lng);
            if (dist > 0.002) {
              totalDistance += dist;
              coordinates.push(point);
              if (onUpdateCallback) onUpdateCallback(getCurrentData());
            }
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, 60000); // 1분마다
  }

  function stopKeepAlive() {
    if (_silentAudio) { _silentAudio.pause(); _silentAudio = null; }
    if (_keepAliveInterval) { clearInterval(_keepAliveInterval); _keepAliveInterval = null; }
  }

  // ===== 핵심 계산 함수 =====

  // 두 좌표 간 거리 계산 (Haversine, km)
  function calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 칼로리 계산 (체중 기반 간이 계산)
  function calcCalories(distanceKm, durationMin, dogWeightKg) {
    const weight = dogWeightKg || 10;
    const met = distanceKm / (durationMin / 60) > 5 ? 4.0 : 3.0;
    return Math.round(met * weight * (durationMin / 60));
  }

  function getElapsedMinutes() {
    if (!startTime) return 0;
    return Math.round((Date.now() - startTime) / 60000);
  }

  function getCurrentData() {
    const duration = getElapsedMinutes();
    const avgPace = duration > 0 ? Math.round(totalDistance / (duration / 60) * 10) / 10 : 0;
    return {
      isTracking,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      duration,
      distance: Math.round(totalDistance * 1000) / 1000,
      avgPace,
      calories: calcCalories(totalDistance, duration),
      coordinates: coordinates.slice(),
      lastPosition: coordinates.length > 0 ? coordinates[coordinates.length - 1] : null
    };
  }

  // ===== 트래킹 시작 (백그라운드 지원 포함) =====
  function startTracking(onUpdate, options) {
    if (isTracking) return { success: false, error: '이미 트래킹 중입니다.' };
    if (!navigator.geolocation) return { success: false, error: 'GPS를 지원하지 않는 브라우저입니다.' };

    isTracking = true;
    startTime = Date.now();
    coordinates = [];
    totalDistance = 0;
    onUpdateCallback = onUpdate || null;

    // Wake Lock 요청
    requestWakeLock();

    // visibilitychange 리스너
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 백그라운드 Keep-Alive
    startKeepAlive();

    // 주기적 서버 동기화
    if (options && options.userId) {
      startPeriodicSync(options.userId, options.dogId, options.dogName);
    }

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now()
        };

        // 정확도 50m 이내만 사용
        if (point.accuracy > 50) return;

        if (coordinates.length > 0) {
          const last = coordinates[coordinates.length - 1];
          const dist = calcDistance(last.lat, last.lng, point.lat, point.lng);
          // 노이즈 필터: 2m 이상 이동만 반영
          if (dist > 0.002) {
            totalDistance += dist;
            coordinates.push(point);
          }
        } else {
          coordinates.push(point);
        }

        if (onUpdateCallback) onUpdateCallback(getCurrentData());
      },
      (err) => {
        console.warn('[GPS] 위치 오류:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return { success: true };
  }

  // ===== 트래킹 중지 =====
  function stopTracking() {
    if (!isTracking) return null;

    // GPS 감시 중지
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    isTracking = false;

    // 백그라운드 유지 기능 정리
    releaseWakeLock();
    stopKeepAlive();
    stopPeriodicSync();
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    const data = {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: getElapsedMinutes(),
      distance: Math.round(totalDistance * 1000) / 1000,
      avgPace: getElapsedMinutes() > 0 ? Math.round(totalDistance / (getElapsedMinutes() / 60) * 10) / 10 : 0,
      calories: calcCalories(totalDistance, getElapsedMinutes()),
      coordinates: coordinates.slice()
    };

    startTime = null;
    coordinates = [];
    totalDistance = 0;
    onUpdateCallback = null;
    _lastSyncIdx = 0;

    return data;
  }

  // ===== 서버 통신 =====

  // 서버에 산책 데이터 저장
  async function saveWalkToServer(userId, dogId, dogName, walkData) {
    try {
      const resp = await fetch('/api/walks/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, dogId, dogName, walkData })
      });
      return await resp.json();
    } catch (e) {
      console.error('[GPS] 서버 저장 실패:', e);
      // 로컬 백업
      const local = StorageService.get('walkHistory', []);
      local.push({ userId, dogId, dogName, walkData, savedAt: new Date().toISOString() });
      StorageService.set('walkHistory', local);
      return { success: false, error: '서버 저장 실패, 로컬에 백업됨' };
    }
  }

  // 산책 기록 조회
  async function getWalkHistory(userId, dogId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (dogId) params.set('dogId', dogId);
      if (options.role) params.set('role', options.role);
      const qs = params.toString();
      const url = `/api/walks/history/${userId}${qs ? `?${qs}` : ''}`;
      const resp = await fetch(url);
      const data = await resp.json();
      return data.success ? data.walks : [];
    } catch (e) {
      return StorageService.get('walkHistory', []).filter(w => w.userId === userId);
    }
  }

  // 산책 통계 조회
  async function getWalkStats(userId, dogId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (dogId) params.set('dogId', dogId);
      if (options.role) params.set('role', options.role);
      const qs = params.toString();
      const url = `/api/walks/stats/${userId}${qs ? `?${qs}` : ''}`;
      const resp = await fetch(url);
      const data = await resp.json();
      return data.success ? data.stats : null;
    } catch (e) {
      return null;
    }
  }

  return {
    startTracking,
    stopTracking,
    getCurrentData,
    saveWalkToServer,
    getWalkHistory,
    getWalkStats,
    isActive: () => isTracking
  };
})();
