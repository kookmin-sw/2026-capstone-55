/**
 * 산책 매칭 요청 API
 * POST   /api/matching/broadcast   → 브로드캐스트 요청 생성
 * GET    /api/matching/requests    → 받은 요청 조회 (?userId=xxx)
 * PATCH  /api/matching/requests/:id/accept
 * PATCH  /api/matching/requests/:id/reject
 * GET    /api/matching/schedules   → 예정/완료 산책 조회 (?userId=xxx)
 * PATCH  /api/matching/schedules/:id/complete
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// 브로드캐스트 요청 — 가용 도우미 전체에게 전송
router.post('/broadcast', (req, res) => {
  const { fromUserId, requestData } = req.body;
  if (!fromUserId) return res.status(400).json({ success: false, error: 'fromUserId 필요' });

  const walkers = db.get('walkers', []).filter(w => w.isAvailable && w.userId !== fromUserId);

  // 위치 필터: GPS 좌표 기반 우선, 없으면 텍스트 매칭, 텍스트도 짧거나 없으면 전체 대상
  let targets = walkers;
  const loc = requestData?.location?.trim() || '';
  if (loc.length >= 3) {
    const city = loc.split(' ')[0];
    const filtered = walkers.filter(w => !w.location || w.location.includes(city));
    // 필터 결과 있으면 사용, 없으면 전체 대상으로 폴백
    if (filtered.length > 0) targets = filtered;
  }

  if (targets.length === 0) {
    return res.json({ success: false, error: '현재 주변에 산책 가능한 도우미가 없습니다.' });
  }

  const broadcastId = db.generateId();
  const requests    = db.get('matchRequests', []);

  targets.forEach(walker => {
    requests.push({
      id: db.generateId(),
      broadcastId,
      fromUserId,
      toUserId: walker.userId,
      requestData: requestData || {},
      status: 'pending',
      createdAt: db.now()
    });
  });

  db.set('matchRequests', requests);
  res.json({ success: true, broadcastId, targetCount: targets.length });
});

// 받은 요청 조회
router.get('/requests', (req, res) => {
  const { userId } = req.query;
  const requests = db.get('matchRequests', []);
  const result   = userId
    ? requests.filter(r => r.toUserId === userId && (r.status === 'pending' || r.status === 'accepted'))
    : requests;
  res.json({ success: true, requests: result });
});

// 요청 수락 — 선착순, 같은 broadcast 나머지 자동 거절
router.patch('/requests/:id/accept', (req, res) => {
  const requests = db.get('matchRequests', []);
  const idx      = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });

  if (requests[idx].status !== 'pending') {
    return res.json({ success: false, alreadyMatched: true });
  }

  requests[idx].status = 'accepted';

  const { broadcastId } = requests[idx];
  if (broadcastId) {
    requests.forEach((r, i) => {
      if (r.broadcastId === broadcastId && r.id !== req.params.id && r.status === 'pending') {
        requests[i].status = 'rejected_matched';
      }
    });
  }
  db.set('matchRequests', requests);

  const r        = requests[idx];
  const schedule = {
    id: db.generateId(),
    matchRequestId: r.id,
    participants: [r.fromUserId, r.toUserId],
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled'
  };
  const schedules = db.get('walkSchedules', []);
  schedules.push(schedule);
  db.set('walkSchedules', schedules);

  res.json({ success: true, schedule });
});

// 요청 거절
router.patch('/requests/:id/reject', (req, res) => {
  const requests = db.get('matchRequests', []);
  const idx      = requests.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  requests[idx].status = 'rejected';
  db.set('matchRequests', requests);
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

// 산책 완료
router.patch('/schedules/:id/complete', (req, res) => {
  const schedules = db.get('walkSchedules', []);
  const idx       = schedules.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  schedules[idx].status = 'completed';
  db.set('walkSchedules', schedules);
  res.json({ success: true });
});

module.exports = router;
