/**
 * 산책 매칭 채팅 API (요청자 ↔ 도우미)
 * requestId를 채팅방 ID로 사용
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// 채팅 메시지 조회
router.get('/:requestId', (req, res) => {
  const msgs = db.get(`walkChat_${req.params.requestId}`, []);
  res.json({ success: true, messages: msgs });
});

// 메시지 전송
router.post('/:requestId', (req, res) => {
  const { senderId, senderName, content } = req.body;
  if (!senderId || !content?.trim()) {
    return res.status(400).json({ success: false, error: '내용을 입력해주세요.' });
  }

  const msg = {
    id:         db.generateId(),
    requestId:  req.params.requestId,
    senderId,
    senderName: senderName || '사용자',
    content:    content.trim(),
    createdAt:  db.now()
  };

  const msgs = db.get(`walkChat_${req.params.requestId}`, []);
  msgs.push(msg);
  db.set(`walkChat_${req.params.requestId}`, msgs);

  // 상대방에게 Socket.IO 실시간 전송
  const requests = db.get('walkRequests', []);
  const req_ = requests.find(r => r.id === req.params.requestId);
  if (req_) {
    const emitToUser = req.app.get('emitToUser');
    const targetId = req_.requesterId === senderId ? req_.walkerId : req_.requesterId;
    if (emitToUser && targetId) {
      emitToUser(targetId, 'walk-chat-message', msg);
    }
  }

  res.json({ success: true, message: msg });
});

module.exports = router;
