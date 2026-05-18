/**
 * 도그워커 API 라우트
 * GET    /api/walkers                      → 전체 워커 목록 (isAvailable=true인 것만 기본)
 * POST   /api/walkers                      → 워커 등록/수정
 * PATCH  /api/walkers/toggle               → 가용 상태 토글
 * PATCH  /api/walkers/:userId/location     → GPS 위치 실시간 업데이트
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const DATA_FILE = path.join(__dirname, '../data/walkers.json');

// ============================================================
// 워커 프로필 Label 매핑 (한국어) 및 유효성 검증
// ============================================================
const WALKER_LABELS = {
  careerYears: { under6m: '6개월 미만', '6m1y': '6개월~1년', '1y3y': '1~3년', over3y: '3년 이상' },
  largeDogExp: { lots: '많음', some: '조금', none: '없음' },
  aggressionHandle: { yes: '가능', some: '어느 정도', no: '불가' },
  ownPetExp: { current: '현재 양육 중', past: '과거 양육', none: '없음' },
  dogSize: { small: '소형견', medium: '중형견', large: '대형견' },
  timeSlots: {
    'morning-early': '오전 (7-9시)',
    morning: '오전 (9-11시)',
    afternoon: '오후 (2-4시)',
    evening: '오후 (5-7시)',
    night: '저녁 (7-9시)',
    anytime: '상시 가능'
  }
};

const VALID_SIZES = ['small', 'medium', 'large'];
const VALID_CAREER_YEARS = ['under6m', '6m1y', '1y3y', 'over3y'];
const VALID_LARGE_DOG_EXP = ['lots', 'some', 'none'];
const VALID_AGGRESSION_HANDLE = ['yes', 'some', 'no'];
const VALID_OWN_PET_EXP = ['current', 'past', 'none'];

/**
 * 워커 프로필 확장 필드 유효성 검증
 * @param {Object} body - 요청 body
 * @returns {{ valid: boolean, error?: string }}
 */
function validateWalkerProfile(body) {
  // acceptedSizes: 비어있지 않은 배열, 모든 요소가 유효한 크기
  if (body.acceptedSizes !== undefined) {
    if (!Array.isArray(body.acceptedSizes) || body.acceptedSizes.length === 0) {
      return { valid: false, error: '선호 크기를 하나 이상 선택해주세요' };
    }
    if (!body.acceptedSizes.every(s => VALID_SIZES.includes(s))) {
      return { valid: false, error: '선호 크기에 유효하지 않은 값이 포함되어 있습니다' };
    }
  }

  // careerYears: 단일 선택
  if (body.careerYears !== undefined) {
    if (!VALID_CAREER_YEARS.includes(body.careerYears)) {
      return { valid: false, error: '산책 경력을 선택해주세요' };
    }
  }

  // largeDogExp: 단일 선택
  if (body.largeDogExp !== undefined) {
    if (!VALID_LARGE_DOG_EXP.includes(body.largeDogExp)) {
      return { valid: false, error: '대형견 경험을 선택해주세요' };
    }
  }

  // aggressionHandle: 단일 선택
  if (body.aggressionHandle !== undefined) {
    if (!VALID_AGGRESSION_HANDLE.includes(body.aggressionHandle)) {
      return { valid: false, error: '공격성 대응 능력을 선택해주세요' };
    }
  }

  // ownPetExp: 단일 선택
  if (body.ownPetExp !== undefined) {
    if (!VALID_OWN_PET_EXP.includes(body.ownPetExp)) {
      return { valid: false, error: '반려견 양육 경험을 선택해주세요' };
    }
  }

  return { valid: true };
}

function readWalkers() {
  try {
    let raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // BOM 제거
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeWalkers(walkers) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(walkers, null, 2), 'utf8');
}

// 전체 워커 목록
//  - ?available=true 이면 isAvailable && 최근 접속(기본 10분) 워커만
//  - 응답에 신선도(freshness) 계산 필드 추가: isStale, minutesSinceSeen
router.get('/', (req, res) => {
  let walkers = readWalkers();
  const FRESH_MS = 10 * 60 * 1000; // 10분
  const now = Date.now();

  walkers = walkers.map(w => {
    const seen = w.lastSeenAt ? new Date(w.lastSeenAt).getTime() : 0;
    const minutesSinceSeen = seen ? Math.floor((now - seen) / 60000) : null;
    const isStale = !seen || (now - seen) > FRESH_MS;

    // 확장 필드 fallback 기본값 (레거시 데이터 하위 호환)
    const careerYears = w.careerYears !== undefined ? w.careerYears : 'under6m';
    const largeDogExp = w.largeDogExp !== undefined ? w.largeDogExp : 'none';
    const aggressionHandle = w.aggressionHandle !== undefined ? w.aggressionHandle : 'no';
    const ownPetExp = w.ownPetExp !== undefined ? w.ownPetExp : 'none';
    const acceptedSizes = w.acceptedSizes !== undefined ? w.acceptedSizes : ['small', 'medium', 'large'];

    // preferredTimeSlots: 있으면 사용, 없으면 기존 preferredTime에서 유도
    let preferredTimeSlots = w.preferredTimeSlots;
    if (preferredTimeSlots === undefined) {
      if (w.preferredTime) {
        // 기존 preferredTime 한국어 라벨을 timeSlots 키로 역매핑
        const timeSlotReverseMap = {};
        Object.entries(WALKER_LABELS.timeSlots).forEach(([key, label]) => {
          timeSlotReverseMap[label] = key;
        });
        const mapped = timeSlotReverseMap[w.preferredTime];
        preferredTimeSlots = mapped ? [mapped] : ['anytime'];
      } else {
        preferredTimeSlots = ['anytime'];
      }
    }

    return {
      ...w,
      minutesSinceSeen,
      isStale,
      careerYears,
      largeDogExp,
      aggressionHandle,
      ownPetExp,
      acceptedSizes,
      preferredTimeSlots
    };
  });

  if (req.query.available === 'true') {
    walkers = walkers.filter(w => w.isAvailable && !w.isStale);
  }
  res.json(walkers);
});

// 워커 등록 (이미 있으면 수정)
router.post('/', (req, res) => {
  const profile = req.body;
  if (!profile || !profile.userId) {
    return res.status(400).json({ error: 'userId가 필요합니다.' });
  }

  // 확장 필드가 하나라도 있으면 유효성 검증 수행 (하위 호환)
  const hasExtendedFields = profile.acceptedSizes !== undefined ||
    profile.careerYears !== undefined ||
    profile.largeDogExp !== undefined ||
    profile.aggressionHandle !== undefined ||
    profile.ownPetExp !== undefined;

  if (hasExtendedFields) {
    const validation = validateWalkerProfile(profile);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
  }

  const walkers = readWalkers();
  const idx = walkers.findIndex(w => w.userId === profile.userId);
  const entry = {
    ...profile,
    isAvailable: false,           // 등록 직후는 OFF 상태
    reviewCount: profile.reviewCount || 0,
    rating: profile.rating || 5,
    registeredAt: new Date().toISOString()
  };

  // 확장 필드 명시적 저장 (전달된 경우에만)
  if (profile.careerYears !== undefined) entry.careerYears = profile.careerYears;
  if (profile.largeDogExp !== undefined) entry.largeDogExp = profile.largeDogExp;
  if (profile.aggressionHandle !== undefined) entry.aggressionHandle = profile.aggressionHandle;
  if (profile.ownPetExp !== undefined) entry.ownPetExp = profile.ownPetExp;
  if (profile.preferredTimeSlots !== undefined) entry.preferredTimeSlots = profile.preferredTimeSlots;
  if (profile.acceptedSizes !== undefined) entry.acceptedSizes = profile.acceptedSizes;
  if (profile.breedExp !== undefined) entry.breedExp = profile.breedExp;
  if (profile.problemBehavior !== undefined) entry.problemBehavior = profile.problemBehavior;
  if (profile.specialty !== undefined) entry.specialty = profile.specialty;

  if (idx >= 0) {
    walkers[idx] = { ...walkers[idx], ...entry };
  } else {
    walkers.push(entry);
  }
  writeWalkers(walkers);
  res.json({ success: true, walker: entry });
});

// 가용 상태 직접 설정 (ON/OFF + 선택적 GPS)
router.patch('/availability', (req, res) => {
  const { userId, isAvailable, lat, lng } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId가 필요합니다.' });

  const walkers = readWalkers();
  const idx = walkers.findIndex(w => w.userId === userId);
  const nowIso = new Date().toISOString();
  if (idx < 0) {
    // walkers.json에 없으면 신규 추가
    walkers.push({ userId, isAvailable: !!isAvailable, lat: lat || null, lng: lng || null, lastSeenAt: nowIso });
  } else {
    walkers[idx].isAvailable = !!isAvailable;
    walkers[idx].lastSeenAt = nowIso;
    if (isAvailable && lat && lng) {
      walkers[idx].lat = lat;
      walkers[idx].lng = lng;
      walkers[idx].lastLocationUpdatedAt = nowIso;
    }
  }

  writeWalkers(walkers);
  const io = req.app.get('io');
  if (io) io.emit('walker-status-changed', { userId, isAvailable: !!isAvailable });
  res.json({ success: true, isAvailable: !!isAvailable });
});

// 가용 상태 토글 (하위 호환)
router.patch('/toggle', (req, res) => {
  const { userId, lat, lng } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId가 필요합니다.' });

  const walkers = readWalkers();
  const idx = walkers.findIndex(w => w.userId === userId);
  if (idx < 0) return res.status(404).json({ error: '워커를 찾을 수 없습니다.' });

  const newState = !walkers[idx].isAvailable;
  const nowIso = new Date().toISOString();

  walkers[idx].isAvailable = newState;
  walkers[idx].lastSeenAt = nowIso;

  if (newState && lat && lng) {
    walkers[idx].lat = lat;
    walkers[idx].lng = lng;
    walkers[idx].lastLocationUpdatedAt = nowIso;
  }

  writeWalkers(walkers);

  // Socket.IO로 지도 갱신 이벤트 브로드캐스트
  const io = req.app.get('io');
  if (io) io.emit('walker-status-changed', { userId, isAvailable: newState });

  res.json({ success: true, isAvailable: walkers[idx].isAvailable });
});

// Walk History 집계 통계 조회
router.get('/:userId/stats', (req, res) => {
  const { userId } = req.params;
  const db = require('../db');

  // 워커 존재 확인
  const walkers = readWalkers();
  const walker = walkers.find(w => w.userId === userId);
  if (!walker) {
    return res.status(404).json({ success: false, error: '워커를 찾을 수 없습니다.' });
  }

  try {
    // walkRequests에서 이 워커의 완료된 산책 필터링
    const walkRequests = db.get('walkRequests', []);
    const completedRequests = walkRequests.filter(
      r => r.walkerId === userId && (r.status === 'completed' || r.status === 'finished')
    );

    // 크기별 집계
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
      // 매칭되는 세션 찾기
      const session = walkSessions.find(
        s => s.requestId === r.id && s.walkerId === userId && s.status === 'completed'
      );
      if (session && session.startedAt && session.endedAt) {
        const startMs = new Date(session.startedAt).getTime();
        const endMs = new Date(session.endedAt).getTime();
        const durationMin = (endMs - startMs) / (1000 * 60);
        if (durationMin > 0) {
          durations.push(durationMin);
        }
      } else if (r.duration) {
        // fallback: walkRequest의 duration 필드 사용
        durations.push(r.duration);
      } else {
        // 기본값 40분
        durations.push(40);
      }
    });

    const avgDurationMin = durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0;

    const longWalkCount = durations.filter(d => d >= 120).length;

    // completionRate 계산: completed / (completed + cancelled_by_walker + expired where walker was assigned)
    const allWalkerRequests = walkRequests.filter(r => r.walkerId === userId);
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
    const walkerReviews = walkReviews.filter(r => r.walkerId === userId);
    const avgRating = walkerReviews.length > 0
      ? Math.round((walkerReviews.reduce((sum, r) => sum + r.rating, 0) / walkerReviews.length) * 10) / 10
      : 5.0;

    // Trust Score 계산: (completionRate * 60) + ((avgRating / 5 * 100) * 0.4)
    let trustScore = Math.round((completionRate * 60) + ((avgRating / 5 * 100) * 0.4));
    // 0-100 범위 클램핑
    trustScore = Math.max(0, Math.min(100, trustScore));

    res.json({
      success: true,
      stats: {
        totalCompleted,
        bySize,
        avgDurationMin,
        longWalkCount,
        completionRate,
        avgRating,
        trustScore
      }
    });
  } catch (err) {
    console.error(`[Walkers] stats 조회 실패 (${userId}):`, err.message);
    // 데이터 읽기 실패 시 빈 stats 반환
    res.json({
      success: true,
      stats: {
        totalCompleted: 0,
        bySize: { small: 0, medium: 0, large: 0 },
        avgDurationMin: 0,
        longWalkCount: 0,
        completionRate: 0,
        avgRating: 0,
        trustScore: 0
      }
    });
  }
});

// Heartbeat: 클라이언트가 주기적으로 호출 → lastSeenAt 갱신
router.patch('/:userId/heartbeat', (req, res) => {
  const { userId } = req.params;
  const walkers = readWalkers();
  const idx = walkers.findIndex(w => w.userId === userId);
  if (idx < 0) return res.status(404).json({ success: false });
  walkers[idx].lastSeenAt = new Date().toISOString();
  writeWalkers(walkers);
  res.json({ success: true });
});

// GPS 위치 실시간 업데이트 (ON 상태인 워커만)
router.patch('/:userId/location', (req, res) => {
  const { userId } = req.params;
  const { lat, lng } = req.body;

  if (!lat || !lng) return res.status(400).json({ error: 'lat, lng가 필요합니다.' });

  const walkers = readWalkers();
  const idx = walkers.findIndex(w => w.userId === userId);
  if (idx < 0) return res.status(404).json({ error: '워커를 찾을 수 없습니다.' });

  if (!walkers[idx].isAvailable) {
    return res.status(400).json({ error: 'OFF 상태에서는 위치를 업데이트할 수 없습니다.' });
  }

  walkers[idx].lat = lat;
  walkers[idx].lng = lng;
  walkers[idx].lastLocationUpdatedAt = new Date().toISOString();
  walkers[idx].lastSeenAt = walkers[idx].lastLocationUpdatedAt;
  writeWalkers(walkers);

  // Socket.IO로 위치 업데이트 브로드캐스트
  const io = req.app.get('io');
  if (io) io.emit('walker-location-updated', { userId, lat, lng });

  res.json({ success: true });
});

module.exports = router;
