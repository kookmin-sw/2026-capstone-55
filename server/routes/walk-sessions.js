/**
 * 산책 세션 API
 *
 * POST   /api/walk-sessions              → 세션 시작
 * PATCH  /api/walk-sessions/:id/end      → 세션 종료
 * POST   /api/walk-sessions/:id/route    → 경로 포인트 추가 (세션별 파일로 분리)
 * GET    /api/walk-sessions/:id/route    → 경로 조회
 * GET    /api/walk-sessions              → 내 세션 목록 (?userId=xxx)
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const db      = require('../db');

const DATA_DIR = path.join(__dirname, '../data');

// 세션별 경로 파일 경로
function routeFilePath(sessionId) {
  return path.join(DATA_DIR, `route_${sessionId}.json`);
}

function readRoutePoints(sessionId) {
  const fp = routeFilePath(sessionId);
  try {
    return fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf8')) : [];
  } catch { return []; }
}

function appendRoutePoint(sessionId, point) {
  const fp     = routeFilePath(sessionId);
  const points = readRoutePoints(sessionId);
  points.push(point);
  // 경로 파일은 pretty-print 없이 저장 (고빈도 쓰기)
  fs.writeFileSync(fp, JSON.stringify(points), 'utf8');
  return points;
}

// 세션 시작
router.post('/', (req, res) => {
  const { requestId, walkerId, requesterId, dogName } = req.body;
  if (!requestId || !walkerId || !requesterId) {
    return res.status(400).json({ success: false, error: 'requestId, walkerId, requesterId가 필요합니다.' });
  }

  // walk request 상태 → walking
  const requests = db.get('walkRequests', []);
  const reqIdx   = requests.findIndex(r => r.id === requestId);
  if (reqIdx !== -1) {
    requests[reqIdx].status    = 'walking';
    requests[reqIdx].updatedAt = db.now();
    db.set('walkRequests', requests);
  }

  const session = {
    id: db.generateId(),
    requestId,
    walkerId,
    requesterId,
    dogName:   dogName || '',
    status:    'walking',
    startedAt: db.now(),
    endedAt:   null
  };

  const sessions = db.get('walkSessions', []);
  sessions.push(session);
  db.set('walkSessions', sessions);

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) emitToUser(requesterId, 'walk-started', { sessionId: session.id, walkerId });

  res.json({ success: true, session });
});

// 세션 종료
router.patch('/:id/end', (req, res) => {
  const sessions = db.get('walkSessions', []);
  const idx      = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });

  sessions[idx].status  = 'completed';
  sessions[idx].endedAt = db.now();

  const s = sessions[idx];
  const points    = readRoutePoints(s.id);
  const totalDist = calcTotalDistance(points);
  sessions[idx].totalDistanceKm = totalDist;
  db.set('walkSessions', sessions);

  const requests = db.get('walkRequests', []);
  const reqIdx   = requests.findIndex(r => r.id === s.requestId);
  if (reqIdx !== -1) {
    requests[reqIdx].status    = 'completed';
    requests[reqIdx].updatedAt = db.now();
    db.set('walkRequests', requests);
  }

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) emitToUser(s.requesterId, 'walk-ended', { sessionId: s.id, totalDistanceKm: totalDist });

  res.json({ success: true, session: sessions[idx], totalDistanceKm: totalDist });
});

// 경로 포인트 추가 (세션별 파일에 직접 append)
router.post('/:id/route', (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, error: 'latitude, longitude가 필요합니다.' });
  }

  const sessions = db.get('walkSessions', []);
  const session  = sessions.find(s => s.id === req.params.id);
  if (!session || session.status !== 'walking') {
    return res.status(400).json({ success: false, error: '진행 중인 세션이 없습니다.' });
  }

  // 마지막 포인트와 거리 비교 — 5m 미만이면 저장 건너뜀
  const existing = readRoutePoints(req.params.id);
  if (existing.length > 0) {
    const last = existing[existing.length - 1];
    if (haversineMeters(last.latitude, last.longitude, latitude, longitude) < 5) {
      return res.json({ success: true, skipped: true });
    }
  }

  const point = {
    id:            db.generateId(),
    walkSessionId: req.params.id,
    latitude,
    longitude,
    timestamp:     db.now()
  };

  appendRoutePoint(req.params.id, point);

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(session.requesterId, 'walker-position', {
      sessionId: req.params.id,
      latitude,
      longitude,
      timestamp: point.timestamp
    });
  }

  res.json({ success: true, point });
});

// 경로 조회 (세션별 파일에서 직접 읽기)
router.get('/:id/route', (req, res) => {
  const points    = readRoutePoints(req.params.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const totalDist = calcTotalDistance(points);
  res.json({ success: true, points, totalDistanceKm: totalDist });
});

// 내 세션 목록
router.get('/', (req, res) => {
  const { userId } = req.query;
  let sessions = db.get('walkSessions', []);
  if (userId) sessions = sessions.filter(s => s.walkerId === userId || s.requesterId === userId);
  sessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  res.json({ success: true, sessions });
});

// ── 유틸 ──────────────────────────────────────────────────────

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R    = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a    = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcTotalDistance(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(
      points[i - 1].latitude, points[i - 1].longitude,
      points[i].latitude,     points[i].longitude
    );
  }
  return Math.round(total) / 1000;
}

module.exports = router;
