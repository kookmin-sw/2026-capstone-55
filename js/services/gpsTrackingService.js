/**
 * GPSTrackingService - GPS 기반 산책 트래킹 서비스
 * 위치 추적, 거리/속도/칼로리 계산, 서버 저장
 */
const GPSTrackingService = (() => {
  let watchId = null;
  let isTracking = false;
  let startTime = null;
  let coordinates = [];
  let totalDistance = 0;
  let onUpdateCallback = null;

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

  // 트래킹 시작
  function startTracking(onUpdate) {
    if (isTracking) return { success: false, error: '이미 트래킹 중입니다.' };
    if (!navigator.geolocation) return { success: false, error: 'GPS를 지원하지 않는 브라우저입니다.' };

    isTracking = true;
    startTime = Date.now();
    coordinates = [];
    totalDistance = 0;
    onUpdateCallback = onUpdate || null;

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

  // 트래킹 중지
  function stopTracking() {
    if (!isTracking) return null;
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    isTracking = false;

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

    return data;
  }

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
  async function getWalkHistory(userId) {
    try {
      const resp = await fetch(`/api/walks/history/${userId}`);
      const data = await resp.json();
      return data.success ? data.walks : [];
    } catch (e) {
      return StorageService.get('walkHistory', []).filter(w => w.userId === userId);
    }
  }

  // 산책 통계 조회
  async function getWalkStats(userId) {
    try {
      const resp = await fetch(`/api/walks/stats/${userId}`);
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
