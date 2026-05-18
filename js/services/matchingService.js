/**
 * MatchingService - 산책 매칭 서비스
 * 역할 기반 매칭: 산책 도우미(walker) / 산책 요청자(requester)
 */

const MatchingService = (() => {
  const MATCH_PROFILES_KEY = 'matchProfiles';

  function isDemoWalkerId(userId) {
    return String(userId || '').startsWith('dummy-walker-');
  }

  function mergeServerWalkerProfile(localProfile, serverWalker) {
    if (!serverWalker) return localProfile || null;
    const isDemoWalker = serverWalker.isDemoWalker === true || isDemoWalkerId(serverWalker.userId || localProfile?.userId);

    return {
      ...(localProfile || {}),
      ...serverWalker,
      userId: serverWalker.userId || localProfile?.userId,
      userName: serverWalker.userName || serverWalker.name || localProfile?.userName || '도우미',
      role: 'walker',
      location: serverWalker.location || localProfile?.location || '',
      preferredTime: serverWalker.preferredTime || localProfile?.preferredTime || '',
      message: serverWalker.message || serverWalker.intro || localProfile?.message || '',
      profilePhoto: serverWalker.profilePhoto || serverWalker.profileImage || localProfile?.profilePhoto || '',
      acceptedSizes: serverWalker.acceptedSizes || localProfile?.acceptedSizes || ['small', 'medium', 'large'],
      isAvailable: serverWalker.isAvailable ?? localProfile?.isAvailable ?? false,
      lat: serverWalker.lat ?? localProfile?.lat ?? null,
      lng: serverWalker.lng ?? localProfile?.lng ?? null,
      isDemoWalker,
      isStale: isDemoWalker ? false : (serverWalker.isStale ?? localProfile?.isStale ?? false),
      minutesSinceSeen: isDemoWalker ? null : (serverWalker.minutesSinceSeen ?? localProfile?.minutesSinceSeen ?? null)
    };
  }

  // --- 프로필(역할) 관리 ---

  /**
   * 모든 매칭 프로필 조회
   * @returns {Object[]}
   */
  function getAllProfiles() {
    return StorageService.get(MATCH_PROFILES_KEY, []);
  }

  /**
   * 매칭 프로필 저장
   * @param {Object[]} profiles
   */
  function saveProfiles(profiles) {
    StorageService.set(MATCH_PROFILES_KEY, profiles);
  }

  /**
   * 내 매칭 프로필 조회
   * matchProfiles에 없으면 서버 워커 캐시에서도 확인 (refreshFromServer 정리 후 복구)
   * @param {string} userId
   * @returns {Object|null}
   */
  function getMyProfile(userId) {
    const local = getAllProfiles().find(p => p.userId === userId);
    if (local) {
      if (local.role === 'walker' && _serverWalkersCache) {
        const serverWalker = _serverWalkersCache.find(w => w.userId === userId);
        if (serverWalker) return mergeServerWalkerProfile(local, serverWalker);
      }
      return local;
    }

    // matchProfiles에서 삭제됐지만 서버 walkers.json에는 있는 경우 (동기화 타이밍 이슈 복구)
    if (_serverWalkersCache) {
      const serverWalker = _serverWalkersCache.find(w => w.userId === userId);
      if (serverWalker) {
        // 서버 워커 데이터를 matchProfile 형태로 변환하여 반환
        return {
          userId: serverWalker.userId,
          userName: serverWalker.userName || serverWalker.name || '도우미',
          role: 'walker',
          location: serverWalker.location || '',
          lat: serverWalker.lat || null,
          lng: serverWalker.lng || null,
          preferredTime: serverWalker.preferredTime || '',
          message: serverWalker.message || serverWalker.intro || '',
          price: serverWalker.price || 0,
          experience: serverWalker.experience || '',
          acceptedSizes: serverWalker.acceptedSizes || ['small', 'medium', 'large'],
          careerYears: serverWalker.careerYears || 'under6m',
          largeDogExp: serverWalker.largeDogExp || 'none',
          aggressionHandle: serverWalker.aggressionHandle || 'no',
          ownPetExp: serverWalker.ownPetExp || 'none',
          isAvailable: serverWalker.isAvailable ?? false,
          rating: serverWalker.rating || 5.0,
          reviewCount: serverWalker.reviewCount || 0,
          profilePhoto: serverWalker.profilePhoto || serverWalker.profileImage || '',
          createdAt: serverWalker.createdAt || ''
        };
      }
    }

    return null;
  }

  /**
   * 매칭 프로필 등록/수정
   * @param {string} userId
   * @param {{ role: 'walker'|'requester', location: string, preferredTime: string, message: string }} data
   * @returns {Object}
   */
  function registerProfile(userId, data) {
    const profiles = getAllProfiles();
    const index = profiles.findIndex(p => p.userId === userId);

    const users = StorageService.get('users', []);
    const user = users.find(u => u.id === userId);
    const userName = user ? user.name : '알 수 없음';
    const dogSize = (user && user.dogs && user.dogs.length > 0) ? user.dogs[0].size : 'medium';

    const profile = {
      userId,
      userName,
      role: data.role,
      location: data.location,
      lat: data.lat || null,
      lng: data.lng || null,
      dogSize,
      preferredTime: data.preferredTime,
      message: data.message || '',
      price: data.price || 0,
      experience: data.experience || '없음',
      acceptedSizes: data.acceptedSizes || ['small', 'medium', 'large'],
      specialty: data.specialty || '',
      profilePhoto: data.profilePhoto || user?.profileImage || '',
      isAvailable: true,
      rating: 5.0,
      reviewCount: 0,
      createdAt: StorageService.now()
    };

    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...profile };
    } else {
      profiles.push(profile);
    }

    saveProfiles(profiles);
    return profile;
  }

  /**
   * 매칭 프로필 삭제
   * @param {string} userId
   */
  function removeProfile(userId) {
    const profiles = getAllProfiles().filter(p => p.userId !== userId);
    saveProfiles(profiles);
  }

  /**
   * 추천 프로필 조회 (반대 역할만 표시)
   * @param {string} userId
   * @returns {Object[]}
   */
  function getRecommendations(userId) {
    const myProfile = getMyProfile(userId);
    if (!myProfile) return [];

    const oppositeRole = myProfile.role === 'walker' ? 'requester' : 'walker';
    return getAllProfiles().filter(p => p.userId !== userId && p.role === oppositeRole);
  }

  // --- 요청 관리 ---

  function normalizeWalkRequest(r) {
    if (!r) return r;
    return {
      ...r,
      fromUserId: r.fromUserId || r.requesterId,
      toUserId: r.toUserId || r.walkerId,
      fromUserName: r.fromUserName || r.requesterName,
      requestData: r.requestData || {
        dogId: r.dogId || null,
        dogName: r.dogName || '',
        dogBreed: r.dogBreed || '',
        dogSize: r.dogSize || '',
        location: r.pickupLatitude && r.pickupLongitude ? '현재 위치' : '',
        lat: r.pickupLatitude || null,
        lng: r.pickupLongitude || null,
        desiredTime: r.requestedStartTime ? '지금 (즉시 매칭)' : '',
        notes: r.requestMessage || r.dogSpecialNotes || '',
        dogs: r.dogs || null,
        duration: r.duration || null,
        paymentOrderId: r.paymentOrderId || null,
        paymentAmount: r.paymentAmount || r.totalPrice || 0
      }
    };
  }

  /**
  /**
   * 매칭 요청 보내기
   * @param {string} fromId
   * @param {string} toId
   * @param {Object} [requestData] - { dogName, dogBreed, dogSize, dogId, location, lat, lng, desiredTime, notes }
   * @returns {Promise<{success: boolean, request?: Object, error?: string, cooldown?: boolean, retryAfterMs?: number}>}
   */
  async function sendRequest(fromId, toId, requestData) {
    if (isDemoWalkerId(toId)) {
      return {
        success: false,
        error: '이 도우미는 AI 추천/GPS 표시용 샘플이라 실제 요청을 보낼 수 없어요. 실시간 접속 도우미를 선택해주세요.'
      };
    }

    // 실제 산책 세션과 이어지는 walk-requests API로 통합
    try {
      const payload = requestData || {};
      const res = await fetch('/api/walk-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: fromId,
          walkerId: toId,
          dogId: payload.dogId || null,
          dogName: payload.dogName || '',
          dogBreed: payload.dogBreed || '',
          dogSize: payload.dogSize || '',
          dogs: payload.dogs || null,
          dogSpecialNotes: payload.notes || '',
          requestMessage: payload.notes || '',
          duration: payload.duration || 40,
          totalPrice: payload.paymentAmount || 0,
          paymentOrderId: payload.paymentOrderId || null,
          paymentAmount: payload.paymentAmount || 0,
          requestedStartTime: new Date().toISOString(),
          requestedEndTime: new Date(Date.now() + (payload.duration || 40) * 60000).toISOString(),
          pickupLatitude: payload.lat || null,
          pickupLongitude: payload.lng || null
        })
      });
      const data = await res.json();
      if (data && data.success && data.request) {
        data.request = normalizeWalkRequest(data.request);
      }
      return data || { success: false };
    } catch (e) {
      return { success: false, error: '요청을 서버에 전송하지 못했습니다.' };
    }
  }

  // 서버에서 가져온 워커 캐시
  let _serverWalkersCache = null;

  async function refreshFromServer() {
    try {
      // walkers.json 동기화
      const res = await fetch('/api/walkers');
      const data = await res.json();
      _serverWalkersCache = data.map(w => {
        const isDemoWalker = w.isDemoWalker === true || isDemoWalkerId(w.userId);
        return {
          ...w,
          userName: w.userName || w.name || '도우미',
          preferredTime: w.preferredTime || '',
          acceptedSizes: w.acceptedSizes || ['small', 'medium', 'large'],
          isDemoWalker,
          isStale: isDemoWalker ? false : w.isStale,
          minutesSinceSeen: isDemoWalker ? null : w.minutesSinceSeen
        };
      });

      const profiles = StorageService.get('matchProfiles', []);
      const syncedProfiles = profiles.map(profile => {
        if (profile.role !== 'walker') return profile;
        const serverWalker = _serverWalkersCache.find(w => w.userId === profile.userId);
        return serverWalker ? mergeServerWalkerProfile(profile, serverWalker) : profile;
      });
      if (JSON.stringify(syncedProfiles) !== JSON.stringify(profiles)) {
        StorageService.set('matchProfiles', syncedProfiles);
      }

      // 서버 워커 목록을 기준으로 localStorage 구형 더미 워커 정리
      // 서버 walkers.json에 실제로 존재하는 워커는 절대 삭제하지 않음
      if (_serverWalkersCache.length > 0) {
        const serverIds = new Set(_serverWalkersCache.map(w => w.userId));
        const cleaned = syncedProfiles.filter(p => {
          if (p.role === 'walker' && p.userId) {
            // 서버에 존재하는 워커는 보호 (실제 등록된 사용자)
            if (serverIds.has(p.userId)) return true;
            // 서버에 없는 dummy-/test- 접두사 워커만 제거 (레거시 로컬 데이터)
            if (p.userId.startsWith('dummy-') || p.userId.startsWith('test-')) return false;
          }
          return true;
        });
        if (cleaned.length !== syncedProfiles.length) {
          StorageService.set('matchProfiles', cleaned);
        }
      }
    } catch(e) {
      console.error('[MatchingService] 서버 동기화 실패:', e);
      _serverWalkersCache = null;
    }

    try {
      // matchProfiles 동기화 (다른 탭/사용자가 업데이트한 내용 반영)
      const res2 = await fetch('/api/data/matchProfiles');
      if (res2.ok) {
        const profiles = await res2.json();
        if (Array.isArray(profiles)) {
          const mergedProfiles = profiles.map(profile => {
            if (profile.role !== 'walker') return profile;
            const serverWalker = _serverWalkersCache?.find(w => w.userId === profile.userId);
            return serverWalker ? mergeServerWalkerProfile(profile, serverWalker) : profile;
          });
          StorageService.setCache('matchProfiles', mergedProfiles);
        }
      }
    } catch(e) {}
  }

  function getAllWalkers() {
    if (_serverWalkersCache !== null) return _serverWalkersCache;
    return getAllProfiles().filter(p => p.role === 'walker');
  }

  async function registerProfileRemote(userId, data) {
    const users = StorageService.get('users', []);
    const user = users.find(u => u.id === userId);
    const payload = {
      userId,
      userName: user ? user.name : '알 수 없음',
      role: 'walker',
      location: data.location,
      lat: data.lat || null,
      lng: data.lng || null,
      preferredTime: data.preferredTime,
      price: data.price || 0,
      experience: data.experience || '없음',
      acceptedSizes: data.acceptedSizes || ['small', 'medium', 'large'],
      careerYears: data.careerYears || 'under6m',
      largeDogExp: data.largeDogExp || 'none',
      aggressionHandle: data.aggressionHandle || 'no',
      ownPetExp: data.ownPetExp || 'none',
      preferredTimeSlots: data.preferredTimeSlots || [],
      specialty: data.specialty || '',
      message: data.message || ''
    };
    const res = await fetch('/api/walkers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    await refreshFromServer();
    return result.walker;
  }

  async function toggleAvailabilityRemote(userId) {
    const res = await fetch('/api/walkers/toggle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const result = await res.json();
    await refreshFromServer();
    return result;
  }

  /**
   * 가용 상태 토글 (로컬 fallback)
   */
  function toggleAvailability(userId) {
    const profiles = getAllProfiles();
    const idx = profiles.findIndex(p => p.userId === userId);
    if (idx === -1) return null;
    profiles[idx].isAvailable = !profiles[idx].isAvailable;
    saveProfiles(profiles);
    return profiles[idx];
  }

  /**
   * matchProfiles에 GPS 좌표 저장
   */
  function updateProfileLocation(userId, lat, lng) {
    const profiles = getAllProfiles();
    const idx = profiles.findIndex(p => p.userId === userId);
    if (idx === -1) return;
    profiles[idx].lat = lat;
    profiles[idx].lng = lng;
    saveProfiles(profiles);
  }

  function setAvailability(userId, isAvailable, lat, lng) {
    const profiles = getAllProfiles();
    const idx = profiles.findIndex(p => p.userId === userId);
    if (idx === -1) return;
    profiles[idx].isAvailable = isAvailable;
    if (isAvailable && lat && lng) {
      profiles[idx].lat = lat;
      profiles[idx].lng = lng;
    }
    // OFF 시에도 마지막 위치는 유지 (지도 표시용, isAvailable로 필터링)
    // lat/lng를 null로 만들면 다시 ON할 때 GPS 재획득 전까지 지도에서 사라짐
    saveProfiles(profiles);
  }

  /**
   * Haversine 공식으로 두 GPS 좌표 사이의 거리(km) 계산
   */
  function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * 근방 도그워커 조회 (가용 상태 + GPS 좌표 있는 walker만)
   * @param {number} lat 사용자 위도
   * @param {number} lng 사용자 경도
   * @param {number} radiusKm 반경(km), 기본 10km
   * @returns {Object[]} 거리순 정렬된 walker 배열 (distance 필드 포함)
   */
  function getNearbyWalkers(lat, lng, radiusKm = 10) {
    return getAvailableWalkers()
      .filter(w => Number.isFinite(Number(w.lat)) && Number.isFinite(Number(w.lng)))
      .map(w => ({
        ...w,
        lat: Number(w.lat),
        lng: Number(w.lng),
        distance: haversineDistance(lat, lng, Number(w.lat), Number(w.lng))
      }))
      .filter(w => w.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  function getUserName(userId) {
    const profile = getAllProfiles().find(p => p.userId === userId);
    if (profile) return profile.userName;

    const users = StorageService.get('users', []);
    const user = users.find(u => u.id === userId);
    return user ? user.name : '알 수 없음';
  }

  /** 산책 매칭 가능 상태인 도우미 반환 — 서버 데이터 우선, 로컬은 보완 */
  function getAvailableWalkers() {
    const localWalkers = getAllProfiles().filter(p => p.role === 'walker' && p.isAvailable);

    if (_serverWalkersCache !== null && _serverWalkersCache.length > 0) {
      const serverAvailable = _serverWalkersCache.filter(w => (
        w.isAvailable && (!w.isStale || w.isDemoWalker || isDemoWalkerId(w.userId))
      ));
      const serverIds = new Set(_serverWalkersCache.map(w => w.userId));
      // 서버에 없는 로컬 전용 워커만 추가 (서버 데이터가 항상 우선)
      const localOnly = localWalkers.filter(w => !serverIds.has(w.userId));
      return [...serverAvailable, ...localOnly];
    }

    return localWalkers;
  }

  /** 받은 요청 조회 — 서버 API 우선 */
  async function getReceivedRequestsRemote(userId) {
    try {
      const res    = await fetch(`/api/walk-requests?walkerId=${userId}`);
      const result = await res.json();
      return (result.requests || []).map(normalizeWalkRequest);
    } catch (e) {
      return [];
    }
  }

  /** 보낸 요청 조회 — 서버 API 우선 (모든 상태 포함, 최신순) */
  async function getSentRequestsRemote(userId) {
    try {
      const res    = await fetch(`/api/walk-requests?requesterId=${userId}`);
      const result = await res.json();
      return (result.requests || []).map(normalizeWalkRequest);
    } catch (e) {
      return [];
    }
  }

  /** 보낸 요청 취소 */
  async function cancelSentRequest(requestId) {
    try {
      const res = await fetch(`/api/walk-requests/${requestId}/cancel`, { method: 'PATCH' });
      return await res.json();
    } catch (e) {
      return { success: false, error: '요청 취소에 실패했습니다.' };
    }
  }

  /** 브로드캐스트 요청 수락 — 서버 API 우선 */
  async function acceptBroadcastRequest(requestId) {
    try {
      const res    = await fetch(`/api/walk-requests/${requestId}/accept`, { method: 'PATCH' });
      return await res.json();
    } catch (e) {
      return { success: false, error: '요청 수락에 실패했습니다.' };
    }
  }

  /** 요청 거절 — 서버 API 우선 */
  async function rejectRequestRemote(requestId) {
    try {
      await fetch(`/api/walk-requests/${requestId}/reject`, { method: 'PATCH' });
    } catch (e) {
      return { success: false, error: '요청 거절에 실패했습니다.' };
    }
    return { success: true };
  }

  return {
    getMyProfile,
    registerProfile,
    registerProfileRemote,
    removeProfile,
    getAllWalkers,
    getAvailableWalkers,
    refreshFromServer,
    toggleAvailability,
    updateProfileLocation,
    setAvailability,
    toggleAvailabilityRemote,
    getNearbyWalkers,
    getRecommendations,
    sendRequest,
    acceptBroadcastRequest,
    rejectRequestRemote,
    getReceivedRequestsRemote,
    getSentRequestsRemote,
    cancelSentRequest,
    getUserName
  };
})();
