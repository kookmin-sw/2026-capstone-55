/**
 * 공유 데이터 API
 * localStorage 대신 서버 JSON 파일 DB 사용
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ===== 범용 데이터 GET/SET =====

/**
 * GET /api/data/:key — 데이터 조회
 */
router.get('/:key', (req, res) => {
  const { key } = req.params;
  const allowed = ['users', 'communityPosts', 'transactions', 'matchRequests',
    'walkSchedules', 'reviews', 'matchProfiles', 'notices', 'walkers'];
  if (!allowed.includes(key)) {
    return res.status(400).json({ error: '허용되지 않는 키입니다.' });
  }
  const data = db.get(key, []);
  res.json(data);
});

/**
 * POST /api/data/:key — 데이터 저장
 */
router.post('/:key', (req, res) => {
  const { key } = req.params;
  const allowed = ['users', 'communityPosts', 'transactions', 'matchRequests',
    'walkSchedules', 'reviews', 'matchProfiles', 'notices', 'walkers'];
  if (!allowed.includes(key)) {
    return res.status(400).json({ error: '허용되지 않는 키입니다.' });
  }
  db.set(key, req.body);
  res.json({ success: true });
});

module.exports = router;
