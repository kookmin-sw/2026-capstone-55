/**
 * 도그워커 API 라우트 - 서버 파일 기반 공유 저장소
 * GET    /api/walkers          → 전체 워커 목록
 * POST   /api/walkers          → 워커 등록/수정
 * PATCH  /api/walkers/toggle   → 가용 상태 토글
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const DATA_FILE = path.join(__dirname, '../data/walkers.json');

function readWalkers() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeWalkers(walkers) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(walkers, null, 2), 'utf8');
}

// 전체 워커 목록
router.get('/', (req, res) => {
  res.json(readWalkers());
});

// 워커 등록 (이미 있으면 수정)
router.post('/', (req, res) => {
  const profile = req.body;
  if (!profile || !profile.userId) {
    return res.status(400).json({ error: 'userId가 필요합니다.' });
  }
  const walkers = readWalkers();
  const idx = walkers.findIndex(w => w.userId === profile.userId);
  const entry = {
    ...profile,
    isAvailable: true,
    reviewCount: profile.reviewCount || 0,
    rating: profile.rating || 5,
    registeredAt: new Date().toISOString()
  };
  if (idx >= 0) {
    walkers[idx] = { ...walkers[idx], ...entry };
  } else {
    walkers.push(entry);
  }
  writeWalkers(walkers);
  res.json({ success: true, walker: entry });
});

// 가용 상태 토글
router.patch('/toggle', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId가 필요합니다.' });
  const walkers = readWalkers();
  const idx = walkers.findIndex(w => w.userId === userId);
  if (idx < 0) return res.status(404).json({ error: '워커를 찾을 수 없습니다.' });
  walkers[idx].isAvailable = !walkers[idx].isAvailable;
  writeWalkers(walkers);
  res.json({ success: true, isAvailable: walkers[idx].isAvailable });
});

module.exports = router;
