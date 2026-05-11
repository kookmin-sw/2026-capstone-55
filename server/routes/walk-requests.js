/**
 * 산책 요청 API (특정 도우미에게 직접 요청)
 *
 * POST   /api/walk-requests              → 요청 생성 (requester → specific walker)
 * GET    /api/walk-requests              → 요청 조회 (?walkerId=xxx 또는 ?requesterId=xxx)
 * PATCH  /api/walk-requests/:id/accept  → 수락
 * PATCH  /api/walk-requests/:id/reject  → 거절
 * PATCH  /api/walk-requests/:id/cancel  → 취소 (requester)
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// 요청 생성
router.post('/', (req, res) => {
  const {
    requesterId, walkerId,
    dogName, dogBreed, dogSize, dogSpecialNotes,
    requestMessage, requestedStartTime, requestedEndTime,
    pickupLatitude, pickupLongitude
  } = req.body;

  if (!requesterId || !walkerId) {
    return res.status(400).json({ success: false, error: 'requesterId, walkerId가 필요합니다.' });
  }

  // 이미 pending 요청이 있으면 중복 방지
  const existing = db.get('walkRequests', []);
  const dup = existing.find(r =>
    r.requesterId === requesterId &&
    r.walkerId === walkerId &&
    r.status === 'pending'
  );
  if (dup) {
    return res.json({ success: false, error: '이미 대기 중인 요청이 있습니다.' });
  }

  // 요청자 정보 가져오기
  const users = db.get('users', []);
  const requester = users.find(u => u.id === requesterId);

  // 도우미 정보 가져오기 (요청 생성 시 이름 저장)
  const walkers = db.get('walkers', []);
  const walker  = walkers.find(w => w.userId === walkerId);

  const newRequest = {
    id: db.generateId(),
    requesterId,
    walkerId,
    requesterName:      requester ? (requester.nickname || requester.name) : '알 수 없음',
    walkerName:         walker ? walker.userName : '알 수 없음',
    dogName:            dogName || '',
    dogBreed:           dogBreed || '',
    dogSize:            dogSize || '',
    dogSpecialNotes:    dogSpecialNotes || '',
    requestMessage:     requestMessage || '',
    requestedStartTime: requestedStartTime || '',
    requestedEndTime:   requestedEndTime || '',
    pickupLatitude:     pickupLatitude || null,
    pickupLongitude:    pickupLongitude || null,
    status:             'pending',
    createdAt:          db.now(),
    updatedAt:          db.now()
  };

  existing.push(newRequest);
  db.set('walkRequests', existing);

  // Socket.IO로 해당 도우미에게 실시간 알림
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(walkerId, 'walk-request', {
      request: newRequest,
      requesterName: requester ? (requester.nickname || requester.name) : '알 수 없음',
      requesterProfileImage: requester ? requester.profileImage : null
    });
  }

  res.json({ success: true, request: newRequest });
});

// 요청 조회
router.get('/', (req, res) => {
  const { walkerId, requesterId } = req.query;
  let requests = db.get('walkRequests', []);

  if (walkerId) {
    requests = requests.filter(r => r.walkerId === walkerId);
  } else if (requesterId) {
    requests = requests.filter(r => r.requesterId === requesterId);
  }

  // 최신순 정렬
  requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, requests });
});

// 단건 조회
router.get('/:id', (req, res) => {
  const requests = db.get('walkRequests', []);
  const request = requests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ success: false, error: '요청을 찾을 수 없습니다.' });
  res.json({ success: true, request });
});

// 수락
router.patch('/:id/accept', (req, res) => {
  const requests = db.get('walkRequests', []);
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '요청을 찾을 수 없습니다.' });
  if (requests[idx].status !== 'pending') {
    return res.json({ success: false, error: '이미 처리된 요청입니다.' });
  }

  requests[idx].status = 'accepted';
  requests[idx].updatedAt = db.now();

  const acceptedId = req.params.id;
  const requesterId = requests[idx].requesterId;
  const walkerId   = requests[idx].walkerId;

  // (1) 같은 요청자의 다른 pending 요청 자동 취소 (1:1 매칭 보장)
  requests.forEach((r, i) => {
    if (i !== idx && r.requesterId === requesterId && r.status === 'pending') {
      requests[i].status = 'cancelled';
      requests[i].updatedAt = db.now();
    }
  });

  // (2) 같은 도우미의 다른 pending 요청(다른 요청자) 자동 거절 — 도우미 중복 수락 방지
  requests.forEach((r, i) => {
    if (i !== idx && r.walkerId === walkerId && r.status === 'pending') {
      requests[i].status = 'walker_busy';
      requests[i].updatedAt = db.now();
      // 해당 요청자에게 "도우미가 다른 요청을 수락함" 알림
      const emitToUserInner = req.app.get('emitToUser');
      if (emitToUserInner) {
        emitToUserInner(r.requesterId, 'walk-request-walker-busy', { requestId: r.id });
      }
    }
  });

  db.set('walkRequests', requests);

  const r = requests[idx];

  // 도우미 정보 가져오기
  const walkers = db.get('walkers', []);
  const walker = walkers.find(w => w.userId === r.walkerId);
  const users = db.get('users', []);
  const walkerUser = users.find(u => u.id === r.walkerId);

  const walkerName = walker ? (walker.userName || walker.name) : (walkerUser ? (walkerUser.nickname || walkerUser.name) : '알 수 없음');
  const walkerInfo = {
    requestId:    r.id,
    walkerId:     r.walkerId,
    walkerName,
    walkerIntro:  walker ? (walker.intro || walker.message || '') : '',
    walkerRating: walker ? walker.rating : 5,
    walkerReviewCount: walker ? walker.reviewCount : 0,
    walkerExperience:  walker ? walker.experience : '',
    walkerPrice:  walker ? walker.price : 0,
    walkerPhone:  walkerUser ? (walkerUser.phoneNumber || '') : '',
    walkerProfileImage: walkerUser ? (walkerUser.profileImage || '') : '',
    walkerLat:    walker ? walker.lat : null,
    walkerLng:    walker ? walker.lng : null,
  };

  // Socket.IO로 요청자에게 수락 알림
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) emitToUser(r.requesterId, 'walk-request-accepted', walkerInfo);

  res.json({ success: true, request: { ...requests[idx], walkerInfo } });
});

// 거절
router.patch('/:id/reject', (req, res) => {
  const requests = db.get('walkRequests', []);
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '요청을 찾을 수 없습니다.' });

  requests[idx].status = 'rejected';
  requests[idx].updatedAt = db.now();
  db.set('walkRequests', requests);

  const r = requests[idx];

  // Socket.IO로 요청자에게 거절 알림
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(r.requesterId, 'walk-request-rejected', { requestId: r.id });
  }

  res.json({ success: true });
});

// 도우미 실시간 위치 업데이트 (수락 후 이동 중)
router.patch('/:id/walker-location', (req, res) => {
  const { lat, lng } = req.body;
  const requests = db.get('walkRequests', []);
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });

  requests[idx].walkerCurrentLat = lat;
  requests[idx].walkerCurrentLng = lng;
  requests[idx].walkerLocationUpdatedAt = db.now();
  db.set('walkRequests', requests);

  // Socket.IO로 요청자에게 실시간 위치 전달
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) emitToUser(requests[idx].requesterId, 'walker-location-update', { requestId: req.params.id, lat, lng });

  res.json({ success: true });
});

// 도우미 현재 위치 조회
router.get('/:id/walker-location', (req, res) => {
  const requests = db.get('walkRequests', []);
  const r = requests.find(r => r.id === req.params.id);
  if (!r) return res.status(404).json({ success: false });
  res.json({ success: true, lat: r.walkerCurrentLat, lng: r.walkerCurrentLng, updatedAt: r.walkerLocationUpdatedAt });
});

// 취소 (요청자)
router.patch('/:id/cancel', (req, res) => {
  const requests = db.get('walkRequests', []);
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });

  if (!['pending', 'accepted', 'heading', 'arrived'].includes(requests[idx].status)) {
    return res.json({ success: false, error: '취소할 수 없는 상태입니다.' });
  }

  requests[idx].status = 'cancelled';
  requests[idx].updatedAt = db.now();
  requests[idx].cancelledBy = req.body?.cancelledBy || 'requester';
  db.set('walkRequests', requests);

  const r = requests[idx];
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    // 요청자가 취소 → 도우미에게 알림
    if (r.cancelledBy === 'requester' || !r.cancelledBy) {
      emitToUser(r.walkerId, 'walk-request-cancelled', { requestId: r.id, cancelledBy: 'requester' });
    }
    // 도우미가 취소 → 요청자에게 알림
    if (r.cancelledBy === 'walker') {
      emitToUser(r.requesterId, 'walk-request-cancelled', { requestId: r.id, cancelledBy: 'walker' });
    }
  }

  res.json({ success: true });
});

// GET /api/walk-requests/broadcast/active — 현재 브로드캐스팅 중인 요청 목록
router.get('/broadcast/active', (req, res) => {
  const requests = db.get('walkRequests', []);
  const now = new Date();
  const active = requests.filter(r =>
    r.type === 'broadcast' &&
    r.status === 'broadcasting' &&
    new Date(r.expiresAt) > now
  );
  res.json({ success: true, requests: active });
});

// ── 지금 바로 요청 (브로드캐스트) ──────────────────────────────
// POST /api/walk-requests/broadcast
router.post('/broadcast', (req, res) => {
  const {
    requesterId, dogName, dogBreed, dogSize,
    dogAggression, dogPersonality, walkDifficulty,
    dogSpecialNotes, pickupLatitude, pickupLongitude
  } = req.body;

  if (!requesterId) {
    return res.status(400).json({ success: false, error: 'requesterId가 필요합니다.' });
  }

  // 이미 broadcasting 중인 요청이 있으면 중복 방지
  const existing = db.get('walkRequests', []);
  const dup = existing.find(r => r.requesterId === requesterId && r.status === 'broadcasting');
  if (dup) return res.json({ success: false, error: '이미 요청 중입니다.' });

  const users = db.get('users', []);
  const requester = users.find(u => u.id === requesterId);

  const newRequest = {
    id:             db.generateId(),
    requesterId,
    walkerId:       null,           // 아직 매칭 전
    type:           'broadcast',    // 브로드캐스트 타입
    requesterName:  requester ? (requester.nickname || requester.name) : '알 수 없음',
    walkerName:     null,
    dogName:        dogName || '',
    dogBreed:       dogBreed || '',
    dogSize:        dogSize || '',
    dogAggression:  dogAggression || 'none',
    dogPersonality: dogPersonality || 'normal',
    walkDifficulty: walkDifficulty || 'easy',
    dogSpecialNotes: dogSpecialNotes || '',
    pickupLatitude:  pickupLatitude || null,
    pickupLongitude: pickupLongitude || null,
    status:         'broadcasting',
    expiresAt:      new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5분 후 만료
    createdAt:      db.now(),
    updatedAt:      db.now()
  };

  existing.push(newRequest);
  db.set('walkRequests', existing);

  // 온라인 도우미 전체에게 브로드캐스트
  const emitToAvailableWalkers = req.app.get('emitToAvailableWalkers');
  let sentCount = 0;
  if (emitToAvailableWalkers) {
    sentCount = emitToAvailableWalkers('broadcast-walk-request', {
      requestId:      newRequest.id,
      requesterName:  newRequest.requesterName,
      requesterImage: requester?.profileImage || null,
      dogName:        newRequest.dogName,
      dogSize:        newRequest.dogSize,
      dogAggression:  newRequest.dogAggression,
      walkDifficulty: newRequest.walkDifficulty,
      dogSpecialNotes: newRequest.dogSpecialNotes,
      pickupLatitude:  newRequest.pickupLatitude,
      pickupLongitude: newRequest.pickupLongitude,
      expiresAt:      newRequest.expiresAt
    });
  }

  // DB 기준 isAvailable 도우미 수 (Socket 연결 여부 무관)
  const walkers = db.get('walkers', []);
  const availableCount = walkers.filter(w => w.isAvailable && w.userId !== requesterId).length;

  res.json({ success: true, request: newRequest, sentCount, availableCount });
});

// PATCH /api/walk-requests/:id/accept-broadcast — 선착순 수락
router.patch('/:id/accept-broadcast', (req, res) => {
  const { walkerId } = req.body;
  if (!walkerId) return res.status(400).json({ success: false, error: 'walkerId가 필요합니다.' });

  const requests = db.get('walkRequests', []);
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '요청을 찾을 수 없습니다.' });
  if (requests[idx].status !== 'broadcasting') {
    return res.json({ success: false, error: '이미 다른 도우미가 수락했습니다.' });
  }

  // 만료 체크
  if (new Date(requests[idx].expiresAt) < new Date()) {
    requests[idx].status = 'expired';
    db.set('walkRequests', requests);
    return res.json({ success: false, error: '요청이 만료되었습니다.' });
  }

  const walkers = db.get('walkers', []);
  const walker = walkers.find(w => w.userId === walkerId);
  const users = db.get('users', []);
  const walkerUser = users.find(u => u.id === walkerId);

  requests[idx].status    = 'accepted';
  requests[idx].walkerId  = walkerId;
  requests[idx].walkerName = walker?.userName || walkerUser?.nickname || walkerUser?.name || '도우미';
  requests[idx].updatedAt = db.now();
  db.set('walkRequests', requests);

  const r = requests[idx];
  const emitToUser = req.app.get('emitToUser');
  const emitToAvailableWalkers = req.app.get('emitToAvailableWalkers');

  // 요청자에게 매칭 성공 알림
  if (emitToUser) {
    emitToUser(r.requesterId, 'broadcast-matched', {
      requestId:   r.id,
      walkerId:    walkerId,
      walkerName:  r.walkerName,
      walkerPhone: walkerUser?.phoneNumber || null
    });
  }

  // 다른 도우미들에게 취소 알림 (브로드캐스트)
  if (emitToAvailableWalkers) {
    emitToAvailableWalkers('broadcast-cancelled', {
      requestId: r.id,
      reason:    '다른 도우미가 수락했습니다.'
    });
  }

  res.json({ success: true, request: requests[idx] });
});

// PATCH /api/walk-requests/:id/cancel-broadcast — 요청자 취소
router.patch('/:id/cancel-broadcast', (req, res) => {
  const requests = db.get('walkRequests', []);
  const idx = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });

  requests[idx].status    = 'cancelled';
  requests[idx].updatedAt = db.now();
  db.set('walkRequests', requests);

  const emitToAvailableWalkers = req.app.get('emitToAvailableWalkers');
  if (emitToAvailableWalkers) {
    emitToAvailableWalkers('broadcast-cancelled', { requestId: req.params.id, reason: '요청자가 취소했습니다.' });
  }

  res.json({ success: true });
});

module.exports = router;
