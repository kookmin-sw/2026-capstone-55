/**
 * 산책 데이터 라우트 - GPS 트래킹 데이터 저장/조회
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const WALKS_FILE = path.join(__dirname, '..', 'data', 'walks.json');

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

// 사용자 산책 기록 조회
router.get('/history/:userId', (req, res) => {
  try {
    const walks = loadWalks();
    const userWalks = walks
      .filter(w => w.userId === req.params.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, walks: userWalks });
  } catch (e) {
    res.status(500).json({ error: '산책 기록 조회 실패' });
  }
});

// 산책 통계 조회
router.get('/stats/:userId', (req, res) => {
  try {
    const walks = loadWalks().filter(w => w.userId === req.params.userId);
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

module.exports = router;
