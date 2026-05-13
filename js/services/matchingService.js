/**
 * MatchingService - 산책 매칭 서비스
 * 역할 기반 매칭: 산책 도우미(walker) / 산책 요청자(requester)
 */

const MatchingService = (() => {
  const MATCH_PROFILES_KEY = 'matchProfiles';
  const MATCH_REQUESTS_KEY = 'matchRequests';
  const WALK_SCHEDULES_KEY = 'walkSchedules';
  const REVIEWS_KEY = 'reviews';

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
   * @param {string} userId
   * @returns {Object|null}
   */
  function getMyProfile(userId) {
    return getAllProfiles().find(p => p.userId === userId) || null;
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

  // --- 요청/일정/리뷰 관리 (기존 유지) ---

  function getAllRequests() {
    return StorageService.get(MATCH_REQUESTS_KEY, []);
  }

  function saveRequests(requests) {
    StorageService.set(MATCH_REQUESTS_KEY, requests);
  }

  function getAllSchedules() {
    return StorageService.get(WALK_SCHEDULES_KEY, []);
  }

  function saveSchedules(schedules) {
    StorageService.set(WALK_SCHEDULES_KEY, schedules);
  }

  function getAllReviews() {
    return StorageService.get(REVIEWS_KEY, []);
  }

  function saveReviews(reviews) {
    StorageService.set(REVIEWS_KEY, reviews);
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
    // 서버 API 우선 호출 (쿨다운/에러 응답 수신)
    try {
      const res = await fetch('/api/matching/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: fromId, toUserId: toId, requestData: requestData || {} })
      });
      const data = await res.json();
      if (data && data.success && data.request) {
        // 로컬 캐시에도 반영
        const requests = getAllRequests();
        if (!requests.find(r => r.id === data.request.id)) {
          requests.push(data.request);
          saveRequests(requests);
        }
      }
      return data || { success: false };
    } catch (e) {
      // 네트워크 오류 시 로컬 폴백
      const requests = getAllRequests();
      const existing = requests.find(
        r => r.fromUserId === fromId && r.toUserId === toId && r.status === 'pending'
      );
      if (existing) return { success: true, request: existing };

      const request = {
        id: StorageService.generateId(),
        fromUserId: fromId,
        toUserId: toId,
        requestData: requestData || {},
        status: 'pending',
        createdAt: StorageService.now(),
        updatedAt: StorageService.now()
      };
      requests.push(request);
      saveRequests(requests);
      return { success: true, request };
    }
  }

  /**
   * 매칭 요청 수락 → WalkSchedule 생성
   */
  function acceptRequest(requestId) {
    const requests = getAllRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) return null;

    requests[index].status = 'accepted';
    saveRequests(requests);

    const req = requests[index];
    const schedule = {
      id: StorageService.generateId(),
      matchRequestId: req.id,
      participants: [req.fromUserId, req.toUserId],
      scheduledAt: StorageService.now(),  // 즉시 매칭
      status: 'scheduled'
    };

    const schedules = getAllSchedules();
    schedules.push(schedule);
    saveSchedules(schedules);
    return schedule;
  }

  function rejectRequest(requestId) {
    const requests = getAllRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) return;
    requests[index].status = 'rejected';
    saveRequests(requests);
  }

  function completeWalk(scheduleId, actorUserId) {
    const schedules = getAllSchedules();
    const index = schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) return false;

    // 이미 완료/취소된 스케줄은 중복 처리 불가
    if (schedules[index].status !== 'scheduled') return false;

    // 참가자만 완료 처리 가능
    if (actorUserId && !schedules[index].participants.includes(actorUserId)) return false;

    schedules[index].status = 'completed';
    schedules[index].completedAt = StorageService.now();
    schedules[index].completedBy = actorUserId || null;
    saveSchedules(schedules);

    // 코인 보상 제거 (자기거래 어뷰징 방지)
    return true;
  }

  function addReview(scheduleId, reviewData) {
    const schedules = getAllSchedules();
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return { success: false, error: '스케줄을 찾을 수 없습니다.' };
    if (schedule.status !== 'completed') return { success: false, error: '완료된 산책만 리뷰할 수 있습니다.' };

    const { reviewerId, targetId, rating, text } = reviewData || {};
    if (!reviewerId || !targetId) return { success: false, error: '작성자/대상 정보가 필요합니다.' };

    // 자기 자신 리뷰 금지
    if (reviewerId === targetId) return { success: false, error: '본인에게 리뷰를 작성할 수 없습니다.' };

    // 둘 다 스케줄 참가자여야 함
    if (!schedule.participants.includes(reviewerId) || !schedule.participants.includes(targetId)) {
      return { success: false, error: '산책 참가자만 리뷰를 작성할 수 있습니다.' };
    }

    // 별점 범위 강제 (1~5)
    const numRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));

    // 같은 스케줄에 같은 리뷰어 중복 방지
    const reviews = getAllReviews();
    const already = reviews.some(r => r.scheduleId === scheduleId && r.reviewerId === reviewerId);
    if (already) return { success: false, error: '이미 이 산책에 리뷰를 작성했습니다.' };

    const review = {
      id: StorageService.generateId(),
      scheduleId,
      reviewerId,
      targetId,
      rating: numRating,
      text: String(text || '').slice(0, 500),
      createdAt: StorageService.now()
    };

    reviews.push(review);
    saveReviews(reviews);
    recalculateRating(targetId);
    return { success: true, review };
  }

  function recalculateRating(targetId) {
    const reviews = getAllReviews();
    const targetReviews = reviews.filter(r => r.targetId === targetId);
    if (targetReviews.length === 0) return;

    const avgRating = targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetReviews.length;
    const profiles = getAllProfiles();
    const profile = profiles.find(p => p.userId === targetId);
    if (profile) {
      profile.rating = Math.round(avgRating * 10) / 10;
      saveProfiles(profiles);
    }
  }

  function getReceivedRequests(userId) {
    return getAllRequests().filter(r => r.toUserId === userId && r.status === 'pending');
  }

  function getSentRequests(userId) {
    return getAllRequests().filter(r => r.fromUserId === userId);
  }

  function getScheduledWalks(userId) {
    return getAllSchedules().filter(s => s.participants.includes(userId) && s.status === 'scheduled');
  }

  function getCompletedWalks(userId) {
    return getAllSchedules().filter(s => s.participants.includes(userId) && s.status === 'completed');
  }

  function getReviewsForSchedule(scheduleId) {
    return getAllReviews().filter(r => r.scheduleId === scheduleId);
  }

  // 서버에서 가져온 워커 캐시
  let _serverWalkersCache = null;

  async function refreshFromServer() {
    try {
      // walkers.json 동기화
      const res = await fetch('/api/walkers');
      const data = await res.json();
      _serverWalkersCache = data.map(w => ({
        ...w,
        userName: w.userName || w.name || '도우미',
        preferredTime: w.preferredTime || '',
        acceptedSizes: w.acceptedSizes || ['small', 'medium', 'large'],
      }));

      // 서버 워커 목록을 기준으로 localStorage 구형 더미 워커 정리
      // dummy- 접두사 워커는 walkers.json에서만 관리하므로 localStorage에서 전부 제거
      if (_serverWalkersCache.length > 0) {
        const serverIds = new Set(_serverWalkersCache.map(w => w.userId));
        const profiles = StorageService.get('matchProfiles', []);
        const cleaned = profiles.filter(p => {
          if (p.role === 'walker' && p.userId) {
            // dummy- 또는 test- 접두사 워커는 localStorage에서 제거 (서버가 단일 소스)
            if (p.userId.startsWith('dummy-') || p.userId.startsWith('test-')) return false;
            // 서버에 동일 userId가 있는 워커도 로컬에서 제거 (서버 데이터 우선)
            if (serverIds.has(p.userId)) return false;
          }
          return true;
        });
        if (cleaned.length !== profiles.length) {
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
        if (Array.isArray(profiles)) StorageService.setCache('matchProfiles', profiles);
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
    if (!isAvailable) {
      profiles[idx].lat = null;
      profiles[idx].lng = null;
    }
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
    return getAllWalkers()
      .filter(w => w.lat && w.lng)
      .map(w => ({ ...w, distance: haversineDistance(lat, lng, w.lat, w.lng) }))
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
      const serverAvailable = _serverWalkersCache.filter(w => w.isAvailable);
      const serverIds = new Set(serverAvailable.map(w => w.userId));
      // 서버에 없는 로컬 전용 워커만 추가 (서버 데이터가 항상 우선)
      const localOnly = localWalkers.filter(w => !serverIds.has(w.userId));
      return [...serverAvailable, ...localOnly];
    }

    return localWalkers;
  }

  /** 받은 요청 조회 — 서버 API 우선 */
  async function getReceivedRequestsRemote(userId) {
    try {
      const res    = await fetch(`/api/matching/requests?userId=${userId}`);
      const result = await res.json();
      return result.requests || [];
    } catch (e) {
      return getAllRequests().filter(r => r.toUserId === userId && (r.status === 'pending' || r.status === 'accepted'));
    }
  }

  /** 보낸 요청 조회 — 서버 API 우선 (모든 상태 포함, 최신순) */
  async function getSentRequestsRemote(userId) {
    try {
      const res    = await fetch(`/api/matching/requests?fromUserId=${userId}`);
      const result = await res.json();
      return result.requests || [];
    } catch (e) {
      return getAllRequests()
        .filter(r => r.fromUserId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  /** 보낸 요청 취소 */
  async function cancelSentRequest(requestId) {
    try {
      const res = await fetch(`/api/matching/requests/${requestId}/cancel`, { method: 'PATCH' });
      return await res.json();
    } catch (e) {
      // 로컬 fallback
      const requests = getAllRequests();
      const idx = requests.findIndex(r => r.id === requestId);
      if (idx === -1) return { success: false };
      if (requests[idx].status !== 'pending') return { success: false, error: '취소할 수 없는 상태입니다.' };
      requests[idx].status = 'cancelled';
      saveRequests(requests);
      return { success: true };
    }
  }

  /** 브로드캐스트 요청 수락 — 서버 API 우선 */
  async function acceptBroadcastRequest(requestId) {
    try {
      const res    = await fetch(`/api/matching/requests/${requestId}/accept`, { method: 'PATCH' });
      return await res.json();
    } catch (e) {
      // 로컬 fallback
      const requests = getAllRequests();
      const idx      = requests.findIndex(r => r.id === requestId);
      if (idx === -1) return { success: false };
      if (requests[idx].status !== 'pending') return { success: false, alreadyMatched: true };
      requests[idx].status = 'accepted';
      if (requests[idx].broadcastId) {
        requests.forEach((r, i) => {
          if (r.broadcastId === requests[idx].broadcastId && r.id !== requestId && r.status === 'pending') requests[i].status = 'rejected_matched';
        });
      }
      saveRequests(requests);
      const r        = requests[idx];
      const schedule = { id: StorageService.generateId(), matchRequestId: r.id, participants: [r.fromUserId, r.toUserId], scheduledAt: StorageService.now(), status: 'scheduled' };
      const schedules = getAllSchedules(); schedules.push(schedule); saveSchedules(schedules);
      return { success: true, schedule };
    }
  }

  /** 요청 거절 — 서버 API 우선 */
  async function rejectRequestRemote(requestId) {
    try {
      await fetch(`/api/matching/requests/${requestId}/reject`, { method: 'PATCH' });
    } catch (e) {
      rejectRequest(requestId);
    }
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
    acceptRequest,
    acceptBroadcastRequest,
    rejectRequest,
    rejectRequestRemote,
    getReceivedRequestsRemote,
    getSentRequestsRemote,
    cancelSentRequest,
    completeWalk,
    addReview,
    getReceivedRequests,
    getSentRequests,
    getScheduledWalks,
    getCompletedWalks,
    getReviewsForSchedule,
    getUserName
  };
})();
