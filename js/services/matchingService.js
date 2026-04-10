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
   * 매칭 요청 보내기
   */
  function sendRequest(fromId, toId) {
    const requests = getAllRequests();
    const existing = requests.find(
      r => r.fromUserId === fromId && r.toUserId === toId && r.status === 'pending'
    );
    if (existing) return existing;

    const request = {
      id: StorageService.generateId(),
      fromUserId: fromId,
      toUserId: toId,
      status: 'pending',
      createdAt: StorageService.now()
    };

    requests.push(request);
    saveRequests(requests);
    return request;
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
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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

  function completeWalk(scheduleId) {
    const schedules = getAllSchedules();
    const index = schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) return;

    schedules[index].status = 'completed';
    saveSchedules(schedules);

    const participants = schedules[index].participants;
    if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
      participants.forEach(userId => {
        WalletService.earnCoins(userId, 10, '산책 완료 보상');
      });
    }
  }

  function addReview(scheduleId, reviewData) {
    const schedules = getAllSchedules();
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || schedule.status !== 'completed') return null;

    const review = {
      id: StorageService.generateId(),
      scheduleId,
      reviewerId: reviewData.reviewerId,
      targetId: reviewData.targetId,
      rating: reviewData.rating,
      text: reviewData.text,
      createdAt: StorageService.now()
    };

    const reviews = getAllReviews();
    reviews.push(review);
    saveReviews(reviews);
    recalculateRating(reviewData.targetId);
    return review;
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
      const res = await fetch('/api/walkers');
      _serverWalkersCache = await res.json();
    } catch(e) {
      console.error('[MatchingService] 서버 동기화 실패:', e);
      _serverWalkersCache = null;
    }
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

  return {
    getMyProfile,
    registerProfile,
    registerProfileRemote,
    removeProfile,
    getAllWalkers,
    refreshFromServer,
    toggleAvailability,
    toggleAvailabilityRemote,
    getNearbyWalkers,
    getRecommendations,
    sendRequest,
    acceptRequest,
    rejectRequest,
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
