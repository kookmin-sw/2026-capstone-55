/**
 * AI 채팅 기록 API
 * 사용자별 채팅 스레드 저장/조회/삭제
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'chats.json');

function readChats() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeChats(chats) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(chats, null, 2), 'utf8');
}

// 사용자의 채팅 스레드 목록 조회
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const chats = readChats();
  const userChats = chats.filter(c => c.userId === userId);
  res.json({ success: true, threads: userChats });
});

// 특정 스레드 조회
router.get('/:userId/:threadId', (req, res) => {
  const { userId, threadId } = req.params;
  const chats = readChats();
  const thread = chats.find(c => c.userId === userId && c.id === threadId);
  if (!thread) return res.status(404).json({ success: false, error: '스레드를 찾을 수 없습니다.' });
  res.json({ success: true, thread });
});

// 새 스레드 생성
router.post('/:userId', (req, res) => {
  const { userId } = req.params;
  const { id, mode, messages, createdAt } = req.body;
  const chats = readChats();

  const thread = { id, userId, mode, messages: messages || [], createdAt: createdAt || new Date().toISOString() };
  chats.push(thread);
  writeChats(chats);
  res.json({ success: true, thread });
});

// 스레드에 메시지 추가
router.put('/:userId/:threadId', (req, res) => {
  const { userId, threadId } = req.params;
  const { messages } = req.body;
  const chats = readChats();
  const idx = chats.findIndex(c => c.userId === userId && c.id === threadId);

  if (idx === -1) return res.status(404).json({ success: false, error: '스레드를 찾을 수 없습니다.' });

  chats[idx].messages = messages;
  writeChats(chats);
  res.json({ success: true, thread: chats[idx] });
});

// 스레드 삭제
router.delete('/:userId/:threadId', (req, res) => {
  const { userId, threadId } = req.params;
  let chats = readChats();
  chats = chats.filter(c => !(c.userId === userId && c.id === threadId));
  writeChats(chats);
  res.json({ success: true });
});

module.exports = router;
