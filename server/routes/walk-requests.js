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

  if (!['pending', 'accepted'].includes(requests[idx].status)) {
    return res.json({ success: false, error: '취소할 수 없는 상태입니다.' });
  }

  requests[idx].status = 'cancelled';
  requests[idx].updatedAt = db.now();
  db.set('walkRequests', requests);

  const r = requests[idx];
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(r.walkerId, 'walk-request-cancelled', { requestId: r.id });
  }

  res.json({ success: true });
});

module.exports = router;
