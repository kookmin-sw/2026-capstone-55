/**
 * AI 대화 이력 관리 API
 * 사용자별 대화 세션을 서버 JSON 파일에 저장
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/chat/:userId/sessions — 사용자의 세션 목록 조회
 */
router.get('/:userId/sessions', (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: '사용자 ID가 필요합니다.' });

  const allChats = db.get('chatSessions', {});
  const userSessions = allChats[userId] || [];
  // 최신순 정렬, 메시지 내용은 제외하고 메타 정보만
  const list = userSessions.map(s => ({
    id: s.id,
    title: s.title,
    mode: s.mode,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    messageCount: (s.messages || []).length
  })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(list);
});

/**
 * GET /api/chat/:userId/session/:sessionId — 특정 세션 조회
 */
router.get('/:userId/session/:sessionId', (req, res) => {
  const { userId, sessionId } = req.params;
  const allChats = db.get('chatSessions', {});
  const userSessions = allChats[userId] || [];
  const session = userSessions.find(s => s.id === sessionId);
  if (!session) return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
  res.json(session);
});

/**
 * POST /api/chat/:userId/session — 새 세션 생성 또는 기존 세션 업데이트
 */
router.post('/:userId/session', (req, res) => {
  const { userId } = req.params;
  const { sessionId, title, mode, messages } = req.body;
  if (!userId) return res.status(400).json({ error: '사용자 ID가 필요합니다.' });

  const allChats = db.get('chatSessions', {});
  if (!allChats[userId]) allChats[userId] = [];

  const existing = allChats[userId].find(s => s.id === sessionId);
  if (existing) {
    // 기존 세션 업데이트
    existing.title = title || existing.title;
    existing.mode = mode || existing.mode;
    existing.messages = (messages || []).slice(-50); // 최근 50개까지
    existing.updatedAt = db.now();
  } else {
    // 새 세션 생성
    allChats[userId].push({
      id: sessionId || db.generateId(),
      title: title || '새 대화',
      mode: mode || 'training',
      messages: (messages || []).slice(-50),
      createdAt: db.now(),
      updatedAt: db.now()
    });
  }

  // 사용자당 최대 30개 세션 유지
  if (allChats[userId].length > 30) {
    allChats[userId].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    allChats[userId] = allChats[userId].slice(0, 30);
  }

  db.set('chatSessions', allChats);
  res.json({ success: true });
});

/**
 * DELETE /api/chat/:userId/session/:sessionId — 세션 삭제
 */
router.delete('/:userId/session/:sessionId', (req, res) => {
  const { userId, sessionId } = req.params;
  const allChats = db.get('chatSessions', {});
  if (allChats[userId]) {
    allChats[userId] = allChats[userId].filter(s => s.id !== sessionId);
    db.set('chatSessions', allChats);
  }
  res.json({ success: true });
});

module.exports = router;
