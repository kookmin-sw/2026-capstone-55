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

// 전체 워커 목록 (기본: 전체, ?available=true 이면 가용만)
router.get('/', (req, res) => {
  let walkers = readWalkers();
  if (req.query.available === 'true') {
    walkers = walkers.filter(w => w.isAvailable);
  }
  res.json(walkers);
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
    isAvailable: false,           // 등록 직후는 OFF 상태
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

// 가용 상태 토글 (ON 시 GPS 좌표 필수)
router.patch('/toggle', (req, res) => {
  const { userId, lat, lng } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId가 필요합니다.' });

  const walkers = readWalkers();
  const idx = walkers.findIndex(w => w.userId === userId);
  if (idx < 0) return res.status(404).json({ error: '워커를 찾을 수 없습니다.' });

  const newState = !walkers[idx].isAvailable;

  // ON으로 전환하는데 GPS 좌표가 없으면 거부
  if (newState && !lat && !walkers[idx].lat) {
    return res.status(400).json({ error: 'GPS 위치가 필요합니다. 위치 권한을 허용해주세요.' });
  }

  walkers[idx].isAvailable = newState;

  if (newState && lat && lng) {
    walkers[idx].lat = lat;
    walkers[idx].lng = lng;
    walkers[idx].lastLocationUpdatedAt = new Date().toISOString();
  }

  // OFF 상태로 전환 시 위치 정보 숨김 (null 처리)
  if (!newState) {
    walkers[idx].lat = null;
    walkers[idx].lng = null;
  }

  writeWalkers(walkers);

  // Socket.IO로 지도 갱신 이벤트 브로드캐스트
  const io = req.app.get('io');
  if (io) io.emit('walker-status-changed', { userId, isAvailable: newState });

  res.json({ success: true, isAvailable: walkers[idx].isAvailable });
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
  writeWalkers(walkers);

  // Socket.IO로 위치 업데이트 브로드캐스트
  const io = req.app.get('io');
  if (io) io.emit('walker-location-updated', { userId, lat, lng });

  res.json({ success: true });
});

module.exports = router;
