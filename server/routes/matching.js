/**
 * 산책 매칭 요청 API
 * POST   /api/matching/requests    → 요청 생성 (1:1 직접 요청)
 * GET    /api/matching/requests    → 받은 요청 조회 (?userId=xxx)
 * PATCH  /api/matching/requests/:id/accept
 * PATCH  /api/matching/requests/:id/reject
 * GET    /api/matching/schedules   → 예정/완료 산책 조회 (?userId=xxx)
 * PATCH  /api/matching/schedules/:id/complete
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ============================================================
// Enhanced Scoring 가중치 설정
// ============================================================
const SCORE_WEIGHTS = { profile: 0.5, history: 0.3, trust: 0.2 };
const SCORE_WEIGHTS_NO_HISTORY = { profile: 0.8, history: 0.0, trust: 0.2 };
const HISTORY_THRESHOLD = 3;
const LONG_WALK_MINUTES = 120;

/**
 * History Bonus 계산
 * @param {Object} walkerStats - 워커 통계 (totalCompleted, bySize, longWalkCount, completionRate)
 * @param {string} requestedSize - 요청된 강아지 크기 ('small'|'medium'|'large')
 * @param {number} requestedDuration - 요청된 산책 시간 (분)
 * @returns {number} 0-100 범위의 History Bonus 점수
 */
function calcHistoryBonus(walkerStats, requestedSize, requestedDuration) {
  if (!walkerStats || walkerStats.totalCompleted < HISTORY_THRESHOLD) {
    return 0;
  }

  let bonus = 0;

  // Size match bonus: 요청된 크기의 완료 산책 수가 threshold 초과 시
  if (walkerStats.bySize && walkerStats.bySize[requestedSize] > HISTORY_THRESHOLD) {
    bonus += 50;
  }

  // Long walk bonus: 120분 이상 요청 시 longWalkCount가 threshold 초과 시
  if (requestedDuration >= LONG_WALK_MINUTES && walkerStats.longWalkCount > HISTORY_THRESHOLD) {
    bonus += 30;
  }

  // Completion rate bonus
  const completionRate = walkerStats.completionRate || 0;
  bonus += completionRate * 20;

  // 0-100 범위 클램핑
  return Math.max(0, Math.min(100, Math.round(bonus)));
}

// 1:1 직접 요청 생성 — 반려견/위치/시각 payload 포함
router.post('/requests', (req, res) => {
  const { fromUserId, toUserId, requestData } = req.body || {};
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ success: false, error: 'fromUserId, toUserId가 필요합니다.' });
  }
  if (fromUserId === toUserId) {
    return res.status(400).json({ success: false, error: '자기 자신에게 요청할 수 없습니다.' });
  }

  const requests = db.get('matchRequests', []);

  // 중복 pending 방지
  const dup = requests.find(r =>
    r.fromUserId === fromUserId &&
    r.toUserId === toUserId &&
    r.status === 'pending'
  );
  if (dup) {
    return res.json({ success: false, error: '이미 대기 중인 요청이 있습니다.', request: dup });
  }

  // 쿨다운 체크: 최근 30분 내 같은 도우미에게 거절/자동거절/취소된 이력이 있으면 차단
  const COOLDOWN_MS = 30 * 60 * 1000;
  const now = Date.now();
  const blockedStatuses = ['rejected', 'walker_busy', 'cancelled', 'rejected_matched'];
  const recentBlocked = requests
    .filter(r =>
      r.fromUserId === fromUserId &&
      r.toUserId === toUserId &&
      blockedStatuses.includes(r.status) &&
      r.updatedAt &&
      (now - new Date(r.updatedAt).getTime()) < COOLDOWN_MS
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

  if (recentBlocked) {
    const remainingMs = COOLDOWN_MS - (now - new Date(recentBlocked.updatedAt).getTime());
    const remainingMin = Math.max(1, Math.ceil(remainingMs / 60000));
    const reasonMap = {
      rejected: '도우미가 요청을 거절했어요',
      walker_busy: '도우미가 다른 산책을 수락했어요',
      cancelled: '이전 요청이 취소되었어요',
      rejected_matched: '다른 도우미가 먼저 매칭됐어요'
    };
    return res.json({
      success: false,
      cooldown: true,
      error: `${reasonMap[recentBlocked.status] || '이전 요청'}. ${remainingMin}분 후 다시 시도해주세요.`,
      retryAfterMs: remainingMs
    });
  }

  const users = db.get('users', []);
  const fromUser = users.find(u => u.id === fromUserId);

  const newRequest = {
    id: db.generateId(),
    fromUserId,
    toUserId,
    fromUserName: fromUser ? (fromUser.nickname || fromUser.name) : '알 수 없음',
    requestData: requestData || {},
    status: 'pending',
    createdAt: db.now(),
    updatedAt: db.now()
  };

  requests.push(newRequest);
  db.set('matchRequests', requests);

  // 실시간 알림
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(toUserId, 'match-request', {
      request: newRequest,
      fromUserName: newRequest.fromUserName,
      fromUserProfileImage: fromUser ? fromUser.profileImage : null
    });
  }

  res.json({ success: true, request: newRequest });
});

// 요청 조회 — userId로 받은 요청, fromUserId로 보낸 요청 조회
router.get('/requests', (req, res) => {
  const { userId, fromUserId } = req.query;
  const requests = db.get('matchRequests', []);
  let result;
  if (fromUserId) {
    // 보낸 요청: 모든 상태 반환 (pending/accepted/rejected/walker_busy 등)
    result = requests.filter(r => r.fromUserId === fromUserId);
    // 최근 순 정렬
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (userId) {
    result = requests.filter(r => r.toUserId === userId && (r.status === 'pending' || r.status === 'accepted'));
  } else {
    result = requests;
  }
  res.json({ success: true, requests: result });
});

// 요청 수락 — 선착순, 같은 broadcast 나머지 자동 거절 + 이 도우미의 다른 pending 요청도 모두 취소
router.patch('/requests/:id/accept', (req, res) => {
  const requests = db.get('matchRequests', []);
  const idx      = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });

  if (requests[idx].status !== 'pending') {
    return res.json({ success: false, alreadyMatched: true });
  }

  requests[idx].status = 'accepted';

  const acceptedId = req.params.id;
  const walkerId   = requests[idx].toUserId;
  const { broadcastId } = requests[idx];

  // (1) 같은 broadcast의 다른 pending 요청 → rejected_matched
  if (broadcastId) {
    requests.forEach((r, i) => {
      if (r.broadcastId === broadcastId && r.id !== acceptedId && r.status === 'pending') {
        requests[i].status = 'rejected_matched';
      }
    });
  }

  // (2) 이 도우미에게 들어온 다른 pending 요청(다른 요청자) → walker_busy
  //     한 도우미가 동시에 여러 수락을 하지 못하도록 자동 거절
  const emitToUser = req.app.get('emitToUser');
  requests.forEach((r, i) => {
    if (r.toUserId === walkerId && r.id !== acceptedId && r.status === 'pending') {
      requests[i].status = 'walker_busy';
      requests[i].updatedAt = db.now();
      if (emitToUser) {
        emitToUser(r.fromUserId, 'match-request-walker-busy', { requestId: r.id });
      }
    }
  });

  db.set('matchRequests', requests);

  const r        = requests[idx];
  const schedule = {
    id: db.generateId(),
    matchRequestId: r.id,
    participants: [r.fromUserId, r.toUserId],
    scheduledAt: db.now(),  // 즉시 매칭: 수락 시점 = 산책 시작 시점
    status: 'scheduled'
  };
  const schedules = db.get('walkSchedules', []);
  schedules.push(schedule);
  db.set('walkSchedules', schedules);

  // 요청자에게 수락 알림 (도우미 정보 포함)
  if (emitToUser) {
    const users   = db.get('users', []);
    const walkers = db.get('walkers', []);
    const walker  = walkers.find(w => w.userId === walkerId);
    const walkerUser = users.find(u => u.id === walkerId);
    const walkerName = walker?.userName || walkerUser?.nickname || walkerUser?.name || '도우미';

    emitToUser(r.fromUserId, 'match-request-accepted', {
      requestId: r.id,
      scheduleId: schedule.id,
      walkerId,
      walkerName,
      walkerProfileImage: walkerUser?.profileImage || null,
      walkerPhone: walkerUser?.phoneNumber || null,
      walkerRating: walker?.rating || null
    });
  }

  res.json({ success: true, schedule });
});

// 요청 거절
router.patch('/requests/:id/reject', (req, res) => {
  const requests = db.get('matchRequests', []);
  const idx      = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  requests[idx].status = 'rejected';
  requests[idx].updatedAt = db.now();
  db.set('matchRequests', requests);

  // 요청자에게 거절 알림
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(requests[idx].fromUserId, 'match-request-rejected', { requestId: requests[idx].id });
  }

  res.json({ success: true });
});

// 요청 취소 (요청자)
router.patch('/requests/:id/cancel', (req, res) => {
  const requests = db.get('matchRequests', []);
  const idx      = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });

  if (requests[idx].status !== 'pending') {
    return res.json({ success: false, error: '취소할 수 없는 상태입니다.' });
  }

  requests[idx].status = 'cancelled';
  requests[idx].updatedAt = db.now();
  db.set('matchRequests', requests);

  // 도우미에게 취소 알림
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(requests[idx].toUserId, 'match-request-cancelled', { requestId: requests[idx].id });
  }

  res.json({ success: true });
});

// 예정/완료 산책 조회
router.get('/schedules', (req, res) => {
  const { userId } = req.query;
  const schedules  = db.get('walkSchedules', []);
  const result     = userId
    ? schedules.filter(s => s.participants.includes(userId))
    : schedules;
  res.json({ success: true, schedules: result });
});

// 산책 완료 — 참가자만 가능, 중복 완료 방지
router.patch('/schedules/:id/complete', (req, res) => {
  const { userId } = req.body || {};
  const schedules = db.get('walkSchedules', []);
  const idx       = schedules.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '스케줄을 찾을 수 없습니다.' });

  if (schedules[idx].status !== 'scheduled') {
    return res.json({ success: false, error: '이미 완료되었거나 완료할 수 없는 상태입니다.' });
  }
  if (userId && !schedules[idx].participants.includes(userId)) {
    return res.status(403).json({ success: false, error: '산책 참가자만 완료 처리할 수 있습니다.' });
  }

  schedules[idx].status = 'completed';
  schedules[idx].completedAt = db.now();
  schedules[idx].completedBy = userId || null;
  db.set('walkSchedules', schedules);
  res.json({ success: true });
});

/**
 * POST /api/matching/ai-score
 * Gemini 기반 5개 차원 매칭 점수 계산
 *
 * 평가 차원:
 *   1. 경력 적합도    (0~20점) — 강아지 난이도 대비 도우미 경력
 *   2. 공격성 대응력  (0~25점) — 강아지 공격성 대비 도우미 대응 능력
 *   3. 체형 적합도    (0~20점) — 강아지 크기 대비 도우미 경험
 *   4. 신뢰도         (0~20점) — 평점·완료 산책·리뷰 수
 *   5. 특기 매칭      (0~15점) — 문제 행동 대응 경험
 *   총합 100점
 */
router.post('/ai-score', async (req, res) => {
  const { walker, dog } = req.body;
  if (!walker || !dog) {
    return res.status(400).json({ success: false, error: '도우미/강아지 정보가 필요합니다.' });
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('여기에')) {
    return res.json({ success: false, error: 'Gemini API 미설정' });
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const L = {
      career:  { under6m:'6개월 미만', '6m1y':'6개월~1년', '1y3y':'1~3년', over3y:'3년 이상' },
      large:   { lots:'대형견 경험 많음', some:'대형견 경험 조금', none:'대형견 경험 없음' },
      aggr:    { yes:'공격성 대응 가능', some:'경미한 공격성 대응', no:'공격성 대응 어려움' },
      own:     { current:'현재 반려견 양육 중', past:'과거 양육 경험', none:'양육 경험 없음' },
      dogSize: { small:'소형견(10kg 이하)', medium:'중형견(10~25kg)', large:'대형견(25kg 이상)' },
      dogAggr: { none:'온순함', medium:'약간 공격성', high:'공격성 강함' },
      diff:    { easy:'산책 쉬움', medium:'산책 보통', hard:'산책 어려움' },
    };

    const prompt = `당신은 반려견 산책 매칭 AI 전문가입니다.
아래 정보를 바탕으로 도우미의 매칭 적합도를 5가지 기준으로 평가하세요.

━━━━━━━━━━━━━━━━━━━
[산책 도우미]
- 경력: ${L.career[walker.careerYears] || '미입력'}
- 대형견 경험: ${L.large[walker.largeDogExp] || '미입력'}
- 공격성 대응: ${L.aggr[walker.aggressionHandle] || '미입력'}
- 반려견 양육: ${L.own[walker.ownPetExp] || '없음'}
- 경험 견종: ${(walker.breedExp||[]).join(', ')||'미입력'}
- 문제행동 대응: ${(walker.problemBehavior||[]).join(', ')||'없음'}
- 평점: ${walker.rating||5.0}점 / 리뷰 ${walker.reviewCount||0}건

[반려견]
- 크기: ${L.dogSize[dog.dogSize] || '미입력'}
- 공격성: ${L.dogAggr[dog.dogAggression] || '온순함'}
- 산책 난이도: ${L.diff[dog.walkDifficulty] || '보통'}
━━━━━━━━━━━━━━━━━━━

다음 5가지 기준으로 점수를 매기고, JSON 형식으로만 응답하세요.
다른 텍스트는 절대 포함하지 마세요.

평가 기준:
1. 경력_적합도 (0~20): 강아지 산책 난이도 대비 도우미 경력 수준
2. 공격성_대응력 (0~25): 강아지 공격성 대비 도우미의 공격성 대응 능력 (가장 중요)
3. 체형_적합도 (0~20): 강아지 크기 대비 도우미의 해당 체형 경험
4. 신뢰도 (0~20): 평점, 리뷰 수, 완료 산책 수 기반
5. 특기_매칭 (0~15): 강아지의 문제 행동에 대한 도우미 대응 경험

응답 형식:
{
  "경력_적합도": 숫자,
  "공격성_대응력": 숫자,
  "체형_적합도": 숫자,
  "신뢰도": 숫자,
  "특기_매칭": 숫자,
  "총점": 숫자,
  "추천_이유": "15자 이내 한 줄"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');
    const parsed = JSON.parse(jsonMatch[0]);

    const breakdown = {
      경력_적합도:  Math.min(20, Math.max(0, Math.round(Number(parsed['경력_적합도'])  || 10))),
      공격성_대응력: Math.min(25, Math.max(0, Math.round(Number(parsed['공격성_대응력']) || 12))),
      체형_적합도:  Math.min(20, Math.max(0, Math.round(Number(parsed['체형_적합도'])  || 10))),
      신뢰도:       Math.min(20, Math.max(0, Math.round(Number(parsed['신뢰도'])        || 10))),
      특기_매칭:    Math.min(15, Math.max(0, Math.round(Number(parsed['특기_매칭'])     || 7))),
    };
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const profileScore = Math.min(100, Math.max(0, total));
    const reason = parsed['추천_이유'] || '';

    // Enhanced Scoring: History Bonus + Trust Score 가중 합산
    let historyBonus = 0;
    let trustScore = 0;
    let weights = SCORE_WEIGHTS;
    let historyFallback = false;

    try {
      // 워커 통계 인라인 계산 (walkers.js stats 로직 재사용)
      const walkerId = walker.userId || walker.id;
      const requestedSize = dog.dogSize || 'medium';
      const requestedDuration = dog.walkDuration || 60;

      const walkRequests = db.get('walkRequests', []);
      const completedRequests = walkRequests.filter(
        r => r.walkerId === walkerId && (r.status === 'completed' || r.status === 'finished')
      );

      const bySize = { small: 0, medium: 0, large: 0 };
      completedRequests.forEach(r => {
        const size = r.dogSize;
        if (size === 'small' || size === 'medium' || size === 'large') {
          bySize[size]++;
        }
      });

      const totalCompleted = completedRequests.length;

      // walkSessions에서 duration 계산
      const walkSessions = db.get('walkSessions', []);
      let durations = [];

      completedRequests.forEach(r => {
        const session = walkSessions.find(
          s => s.requestId === r.id && s.walkerId === walkerId && s.status === 'completed'
        );
        if (session && session.startedAt && session.endedAt) {
          const startMs = new Date(session.startedAt).getTime();
          const endMs = new Date(session.endedAt).getTime();
          const durationMin = (endMs - startMs) / (1000 * 60);
          if (durationMin > 0) {
            durations.push(durationMin);
          }
        } else if (r.duration) {
          durations.push(r.duration);
        } else {
          durations.push(40);
        }
      });

      const longWalkCount = durations.filter(d => d >= LONG_WALK_MINUTES).length;

      // completionRate 계산
      const allWalkerRequests = walkRequests.filter(r => r.walkerId === walkerId);
      const cancelledByWalker = allWalkerRequests.filter(
        r => r.status === 'cancelled' && r.cancelledBy === 'walker'
      ).length;
      const expiredAssigned = allWalkerRequests.filter(
        r => r.status === 'expired'
      ).length;

      const denominator = totalCompleted + cancelledByWalker + expiredAssigned;
      const completionRate = denominator > 0
        ? Math.round((totalCompleted / denominator) * 100) / 100
        : 1.0;

      // avgRating from walkReviews
      const walkReviews = db.get('walkReviews', []);
      const walkerReviews = walkReviews.filter(r => r.walkerId === walkerId);
      const avgRating = walkerReviews.length > 0
        ? Math.round((walkerReviews.reduce((sum, r) => sum + r.rating, 0) / walkerReviews.length) * 10) / 10
        : 5.0;

      // Trust Score 계산
      trustScore = Math.round((completionRate * 60) + ((avgRating / 5 * 100) * 0.4));
      trustScore = Math.max(0, Math.min(100, trustScore));

      // Walker stats 객체 구성
      const walkerStats = { totalCompleted, bySize, longWalkCount, completionRate };

      // History Bonus 계산
      historyBonus = calcHistoryBonus(walkerStats, requestedSize, requestedDuration);

      // 가중치 결정: 완료 산책 3건 미만이면 history 제외
      if (totalCompleted < HISTORY_THRESHOLD) {
        weights = SCORE_WEIGHTS_NO_HISTORY;
      } else {
        weights = SCORE_WEIGHTS;
      }
    } catch (statsErr) {
      // History API 실패 시 fallback
      console.error('[AI Score] stats 계산 실패:', statsErr.message);
      historyBonus = 0;
      trustScore = 0;
      weights = SCORE_WEIGHTS_NO_HISTORY;
      historyFallback = true;
    }

    // 최종 점수 가중 합산
    let finalScore = Math.round(
      profileScore * weights.profile +
      historyBonus * weights.history +
      trustScore * weights.trust
    );
    finalScore = Math.max(0, Math.min(100, finalScore));

    const response = {
      success: true,
      score: finalScore,
      profileScore,
      historyBonus,
      trustScore,
      weights,
      finalScore,
      breakdown,
      reason
    };

    if (historyFallback) {
      response.historyFallback = true;
    }

    res.json(response);
  } catch (e) {
    console.error('[AI Score]', e.message);
    res.json({ success: false, error: e.message });
  }
});

module.exports = router;
