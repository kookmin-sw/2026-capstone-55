/**
 * MatchingService - 산책 매칭 서비스
 * StorageService를 사용하여 매칭 추천, 요청, 수락/거절, 산책 완료, 리뷰 관리
 */

const MatchingService = (() => {
  const MATCH_REQUESTS_KEY = 'matchRequests';
  const WALK_SCHEDULES_KEY = 'walkSchedules';
  const REVIEWS_KEY = 'reviews';

  // 데모용 샘플 매칭 프로필
  const SAMPLE_PROFILES = [
    {
      userId: 'demo-user-1',
      userName: '김산책',
      location: '서울 강남구',
      dogSize: 'small',
      preferredTime: '오전 (7-9시)',
      rating: 4.5
    },
    {
      userId: 'demo-user-2',
      userName: '이댕댕',
      location: '서울 서초구',
      dogSize: 'medium',
      preferredTime: '오후 (5-7시)',
      rating: 4.8
    },
    {
      userId: 'demo-user-3',
      userName: '박멍멍',
      location: '서울 송파구',
      dogSize: 'large',
      preferredTime: '오전 (7-9시)',
      rating: 4.2
    },
    {
      userId: 'demo-user-4',
      userName: '최왈왈',
      location: '서울 강남구',
      dogSize: 'small',
      preferredTime: '저녁 (7-9시)',
      rating: 4.9
    },
    {
      userId: 'demo-user-5',
      userName: '정뽀삐',
      location: '서울 마포구',
      dogSize: 'medium',
      preferredTime: '오후 (5-7시)',
      rating: 3.8
    }
  ];

  /**
   * 매칭 추천 프로필 조회
   * 데모용 샘플 프로필 반환 (현재 사용자 제외, 최소 1개 조건 일치)
   * @param {string} userId
   * @returns {MatchProfile[]}
   */
  function getRecommendations(userId) {
    return SAMPLE_PROFILES.filter(p => p.userId !== userId);
  }

  /**
   * 모든 매칭 요청 조회
   * @returns {MatchRequest[]}
   */
  function getAllRequests() {
    return StorageService.get(MATCH_REQUESTS_KEY, []);
  }

  /**
   * 매칭 요청 저장
   * @param {MatchRequest[]} requests
   */
  function saveRequests(requests) {
    StorageService.set(MATCH_REQUESTS_KEY, requests);
  }

  /**
   * 모든 산책 일정 조회
   * @returns {WalkSchedule[]}
   */
  function getAllSchedules() {
    return StorageService.get(WALK_SCHEDULES_KEY, []);
  }

  /**
   * 산책 일정 저장
   * @param {WalkSchedule[]} schedules
   */
  function saveSchedules(schedules) {
    StorageService.set(WALK_SCHEDULES_KEY, schedules);
  }

  /**
   * 모든 리뷰 조회
   * @returns {Review[]}
   */
  function getAllReviews() {
    return StorageService.get(REVIEWS_KEY, []);
  }

  /**
   * 리뷰 저장
   * @param {Review[]} reviews
   */
  function saveReviews(reviews) {
    StorageService.set(REVIEWS_KEY, reviews);
  }

  /**
   * 매칭 요청 보내기
   * @param {string} fromId - 요청 보내는 사용자 ID
   * @param {string} toId - 요청 받는 사용자 ID
   * @returns {MatchRequest}
   */
  function sendRequest(fromId, toId) {
    const requests = getAllRequests();

    // 이미 보낸 pending 요청이 있는지 확인
    const existing = requests.find(
      r => r.fromUserId === fromId && r.toUserId === toId && r.status === 'pending'
    );
    if (existing) {
      return existing;
    }

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
   * @param {string} requestId
   * @returns {WalkSchedule|null}
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

  /**
   * 매칭 요청 거절
   * @param {string} requestId
   */
  function rejectRequest(requestId) {
    const requests = getAllRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) return;

    requests[index].status = 'rejected';
    saveRequests(requests);
  }

  /**
   * 산책 완료 처리 → 10 Paw 코인 적립
   * @param {string} scheduleId
   */
  function completeWalk(scheduleId) {
    const schedules = getAllSchedules();
    const index = schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) return;

    schedules[index].status = 'completed';
    saveSchedules(schedules);

    // 참여자 모두에게 10 Paw 코인 적립
    const participants = schedules[index].participants;
    if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
      participants.forEach(userId => {
        WalletService.earnCoins(userId, 10, '산책 완료 보상');
      });
    }
  }

  /**
   * 리뷰 작성 및 대상 사용자 평균 평점 재계산
   * @param {string} scheduleId
   * @param {{ reviewerId: string, targetId: string, rating: number, text: string }} reviewData
   * @returns {Review|null}
   */
  function addReview(scheduleId, reviewData) {
    const schedules = getAllSchedules();
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || schedule.status !== 'completed') return null;

    const review = {
      id: StorageService.generateId(),
      scheduleId: scheduleId,
      reviewerId: reviewData.reviewerId,
      targetId: reviewData.targetId,
      rating: reviewData.rating,
      text: reviewData.text,
      createdAt: StorageService.now()
    };

    const reviews = getAllReviews();
    reviews.push(review);
    saveReviews(reviews);

    // 대상 사용자 평균 평점 재계산
    recalculateRating(reviewData.targetId);

    return review;
  }

  /**
   * 대상 사용자의 평균 평점 재계산
   * @param {string} targetId
   */
  function recalculateRating(targetId) {
    const reviews = getAllReviews();
    const targetReviews = reviews.filter(r => r.targetId === targetId);
    if (targetReviews.length === 0) return;

    const avgRating = targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetReviews.length;

    // 샘플 프로필에서 해당 사용자 평점 업데이트
    const profile = SAMPLE_PROFILES.find(p => p.userId === targetId);
    if (profile) {
      profile.rating = Math.round(avgRating * 10) / 10;
    }
  }

  /**
   * 사용자가 받은 매칭 요청 조회
   * @param {string} userId
   * @returns {MatchRequest[]}
   */
  function getReceivedRequests(userId) {
    return getAllRequests().filter(r => r.toUserId === userId && r.status === 'pending');
  }

  /**
   * 사용자가 보낸 매칭 요청 조회
   * @param {string} userId
   * @returns {MatchRequest[]}
   */
  function getSentRequests(userId) {
    return getAllRequests().filter(r => r.fromUserId === userId);
  }

  /**
   * 사용자의 예정된 산책 조회
   * @param {string} userId
   * @returns {WalkSchedule[]}
   */
  function getScheduledWalks(userId) {
    return getAllSchedules().filter(
      s => s.participants.includes(userId) && s.status === 'scheduled'
    );
  }

  /**
   * 사용자의 완료된 산책 조회
   * @param {string} userId
   * @returns {WalkSchedule[]}
   */
  function getCompletedWalks(userId) {
    return getAllSchedules().filter(
      s => s.participants.includes(userId) && s.status === 'completed'
    );
  }

  /**
   * 특정 산책의 리뷰 조회
   * @param {string} scheduleId
   * @returns {Review[]}
   */
  function getReviewsForSchedule(scheduleId) {
    return getAllReviews().filter(r => r.scheduleId === scheduleId);
  }

  /**
   * 프로필 이름 조회 (데모 프로필 + 실제 사용자)
   * @param {string} userId
   * @returns {string}
   */
  function getUserName(userId) {
    const profile = SAMPLE_PROFILES.find(p => p.userId === userId);
    if (profile) return profile.userName;

    const users = StorageService.get('users', []);
    const user = users.find(u => u.id === userId);
    return user ? user.name : '알 수 없음';
  }

  return {
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
