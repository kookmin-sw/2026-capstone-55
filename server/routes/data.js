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
  const allowed = ['users', 'communityPosts', 'communityStories', 'transactions',
    'matchProfiles', 'notices', 'walkers'];
  if (!allowed.includes(key)) {
    return res.status(400).json({ error: '허용되지 않는 키입니다.' });
  }
  const data = db.get(key, []);
  res.json(data);
});

/**
 * POST /api/data/broadcast-notice — 공지사항 전체 브로드캐스트
 */
router.post('/broadcast-notice', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: '공지 내용이 필요합니다.' });
  const io = req.app.get('io');
  if (io) {
    io.emit('admin-notice', { text, createdAt: new Date().toISOString() });
  }
  res.json({ success: true });
});

/**
 * POST /api/data/notify-user — 특정 사용자에게 실시간 앱 알림 전송
 */
router.post('/notify-user', (req, res) => {
  const { toUserId, notification } = req.body || {};
  if (!toUserId || !notification) {
    return res.status(400).json({ error: '알림 대상과 내용이 필요합니다.' });
  }
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(toUserId, 'user-notification', { notification });
  }
  res.json({ success: true });
});

/**
 * POST /api/data/:key — 데이터 저장
 */
router.post('/:key', (req, res) => {
  const { key } = req.params;
  const allowed = ['users', 'communityPosts', 'communityStories', 'transactions',
    'matchProfiles', 'notices', 'walkers'];
  if (!allowed.includes(key)) {
    return res.status(400).json({ error: '허용되지 않는 키입니다.' });
  }
  db.set(key, req.body);
  res.json({ success: true });
});

module.exports = router;
