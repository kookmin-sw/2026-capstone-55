/**
 * 산책 데이터 라우트 - GPS 트래킹 데이터 저장/조회
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

const WALKS_FILE = path.join(__dirname, '..', 'data', 'walks.json');
const DATA_DIR = path.join(__dirname, '..', 'data');

function loadWalks() {
  try {
    if (fs.existsSync(WALKS_FILE)) {
      return JSON.parse(fs.readFileSync(WALKS_FILE, 'utf8'));
    }
  } catch (e) { console.warn('[Walks] 데이터 로드 실패:', e.message); }
  return [];
}

function saveWalks(walks) {
  const dir = path.dirname(WALKS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(WALKS_FILE, JSON.stringify(walks, null, 2), 'utf8');
}

function readMatchedRoutePoints(sessionId) {
  const fp = path.join(DATA_DIR, `route_${sessionId}.json`);
  try {
    const points = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf8')) : [];
    return points.map(p => ({
      lat: Number(p.latitude ?? p.lat),
      lng: Number(p.longitude ?? p.lng),
      timestamp: p.timestamp
    })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  } catch {
    return [];
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcRouteDistanceKm(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return Math.round(total * 1000) / 1000;
}

function diffMinutes(start, end) {
  const s = start ? new Date(start).getTime() : 0;
  const e = end ? new Date(end).getTime() : 0;
  if (!s || !e || e <= s) return 0;
  return Math.max(1, Math.round((e - s) / 60000));
}

function calcCalories(distanceKm, durationMin) {
  if (!distanceKm && !durationMin) return 0;
  return Math.round((durationMin || 0) * 2.8 + (distanceKm || 0) * 18);
}

function dogAliasesForUser(userId, dogId) {
  const aliases = new Set();
  if (dogId) aliases.add(String(dogId));
  try {
    const users = db.get('users', []);
    const user = users.find(u => u.id === userId);
    const dogs = user?.dogs || [];
    const dog = dogs.find(d => [d.id, d.name].filter(Boolean).map(String).includes(String(dogId)));
    if (dog) {
      if (dog.id) aliases.add(String(dog.id));
      if (dog.name) aliases.add(String(dog.name));
    }
  } catch {}
  return aliases;
}

function recordMatchesDog(record, aliases) {
  if (!aliases || aliases.size === 0) return true;
  return aliases.has(String(record.dogId || '')) || aliases.has(String(record.dogName || ''));
}

function buildMatchedWalkRecords(userId, role) {
  const sessions = db.get('walkSessions', []);
  const requests = db.get('walkRequests', []);
  const users = db.get('users', []);
  const includeWalker = role === 'walker';

  return sessions
    .filter(s => s.status === 'completed')
    .filter(s => s.requesterId === userId || (includeWalker && s.walkerId === userId))
    .map(session => {
      const request = requests.find(r => r.id === session.requestId) || {};
      const routePoints = readMatchedRoutePoints(session.id);
      const distance = Number(session.totalDistanceKm ?? request.totalDistanceKm ?? calcRouteDistanceKm(routePoints));
      const startTime = session.walkStartedAt || session.startedAt || request.startedAt || request.createdAt;
      const endTime = session.endedAt || request.endedAt || session.updatedAt;
      const duration = diffMinutes(startTime, endTime);
      const walker = users.find(u => u.id === session.walkerId) || {};
      const requester = users.find(u => u.id === session.requesterId) || {};
      return {
        id: `matched_${session.id}`,
        source: 'matched',
        type: 'matched',
        userId: session.requesterId,
        sessionId: session.id,
        requestId: session.requestId,
        requesterId: session.requesterId,
        walkerId: session.walkerId,
        requesterName: request.requesterName || requester.nickname || requester.name || '',
        walkerName: request.walkerName || walker.nickname || walker.name || '도우미',
        dogId: request.dogId || request.dogName || session.dogName || 'matched-dog',
        dogName: session.dogName || request.dogName || '반려견',
        title: `${session.dogName || request.dogName || '반려견'} 도우미 산책`,
        startTime,
        endTime,
        duration,
        distance,
        avgPace: duration > 0 ? Math.round((distance / (duration / 60)) * 10) / 10 : 0,
        calories: calcCalories(distance, duration),
        coordinates: routePoints,
        createdAt: endTime || startTime || new Date().toISOString()
      };
    });
}

function getCombinedWalks(userId, query = {}) {
  const aliases = query.dogId ? dogAliasesForUser(userId, query.dogId) : new Set();
  const personalWalks = loadWalks()
    .filter(w => w.userId === userId)
    .map(w => ({ ...w, source: w.source || 'personal', type: w.type || 'personal' }));
  const matchedWalks = buildMatchedWalkRecords(userId, query.role);
  return [...personalWalks, ...matchedWalks]
    .filter(w => recordMatchesDog(w, aliases))
    .sort((a, b) => new Date(b.createdAt || b.endTime || b.startTime) - new Date(a.createdAt || a.endTime || a.startTime));
}

// 산책 중 실시간 동기화 (백그라운드 데이터 유실 방지)
const _activeSyncs = {}; // userId별 진행 중인 산책 데이터 임시 저장
router.post('/sync', (req, res) => {
  try {
    const { userId, dogId, dogName, partialData } = req.body;
    if (!userId || !partialData) {
      return res.status(400).json({ error: '필수 데이터 누락' });
    }
    _activeSyncs[userId] = {
      dogId: dogId || 'default',
      dogName: dogName || '우리 강아지',
      ...partialData,
      lastSyncAt: new Date().toISOString()
    };
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '동기화 실패' });
  }
});

// 동기화된 데이터 조회 (클라이언트 복구용)
router.get('/sync/:userId', (req, res) => {
  const data = _activeSyncs[req.params.userId];
  if (data) {
    res.json({ success: true, data });
  } else {
    res.json({ success: false, error: '진행 중인 산책 없음' });
  }
});

// 산책 기록 저장
router.post('/save', (req, res) => {
  try {
    const { userId, dogId, dogName, walkData } = req.body;
    if (!userId || !walkData) {
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }

    const walks = loadWalks();
    const record = {
      id: 'walk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      userId,
      dogId: dogId || 'default',
      dogName: dogName || '우리 강아지',
      startTime: walkData.startTime,
      endTime: walkData.endTime,
      duration: walkData.duration,
      distance: walkData.distance,
      avgPace: walkData.avgPace,
      calories: walkData.calories,
      coordinates: walkData.coordinates || [],
      createdAt: new Date().toISOString()
    };

    walks.push(record);
    saveWalks(walks);
    res.json({ success: true, walk: record });
  } catch (e) {
    console.error('[Walks] 저장 실패:', e);
    res.status(500).json({ error: '산책 데이터 저장 실패' });
  }
});

// 사용자 산책 기록 조회 (dogId 쿼리 파라미터로 필터링 가능)
router.get('/history/:userId', (req, res) => {
  try {
    const walks = getCombinedWalks(req.params.userId, req.query);
    res.json({ success: true, walks });
  } catch (e) {
    res.status(500).json({ error: '산책 기록 조회 실패' });
  }
});

// 산책 통계 조회 (dogId 쿼리 파라미터로 필터링 가능)
router.get('/stats/:userId', (req, res) => {
  try {
    const walks = getCombinedWalks(req.params.userId, req.query);
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const weekWalks = walks.filter(w => new Date(w.createdAt) >= weekAgo);
    const monthWalks = walks.filter(w => new Date(w.createdAt) >= monthAgo);

    const calcStats = (arr) => ({
      count: arr.length,
      totalDistance: Math.round(arr.reduce((s, w) => s + (w.distance || 0), 0) * 100) / 100,
      totalDuration: arr.reduce((s, w) => s + (w.duration || 0), 0),
      totalCalories: Math.round(arr.reduce((s, w) => s + (w.calories || 0), 0)),
      avgDistance: arr.length ? Math.round(arr.reduce((s, w) => s + (w.distance || 0), 0) / arr.length * 100) / 100 : 0,
      avgDuration: arr.length ? Math.round(arr.reduce((s, w) => s + (w.duration || 0), 0) / arr.length) : 0
    });

    res.json({
      success: true,
      stats: {
        total: calcStats(walks),
        weekly: calcStats(weekWalks),
        monthly: calcStats(monthWalks)
      }
    });
  } catch (e) {
    res.status(500).json({ error: '통계 조회 실패' });
  }
});

// 산책 기록 삭제
router.delete('/:walkId', (req, res) => {
  try {
    let walks = loadWalks();
    walks = walks.filter(w => w.id !== req.params.walkId);
    saveWalks(walks);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '삭제 실패' });
  }
});

// 산책 기록 이름 수정
router.put('/:walkId', (req, res) => {
  try {
    const walks = loadWalks();
    const walk = walks.find(w => w.id === req.params.walkId);
    if (!walk) return res.status(404).json({ error: '기록을 찾을 수 없습니다.' });
    if (req.body.dogName) walk.dogName = req.body.dogName;
    if (req.body.title) walk.title = req.body.title;
    saveWalks(walks);
    res.json({ success: true, walk });
  } catch (e) {
    res.status(500).json({ error: '수정 실패' });
  }
});

module.exports = router;
