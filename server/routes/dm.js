/**
 * DM (1:1 다이렉트 메시지) API
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const DM_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'dm');
if (!fs.existsSync(DM_UPLOAD_DIR)) fs.mkdirSync(DM_UPLOAD_DIR, { recursive: true });

const dmStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DM_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `dm_${Date.now()}_${Math.random().toString(36).slice(2,7)}${ext}`);
  }
});
const dmUpload = multer({
  storage: dmStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm|heic)$/i.test(file.originalname);
    cb(null, ok);
  }
});

// DM 미디어 업로드
router.post('/upload', dmUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '파일 없음' });
  const isVideo = /\.(mp4|mov|webm)$/i.test(req.file.filename);
  res.json({
    success: true,
    url: `/uploads/dm/${req.file.filename}`,
    mediaType: isVideo ? 'video' : 'image'
  });
});

function convId(a, b) {
  return [a, b].sort().join('_');
}

// 내 DM 대화 목록
router.get('/list/:userId', (req, res) => {
  const { userId } = req.params;
  const convIds = db.get(`dm_user_${userId}`, []);
  const convs = convIds.map(cid => {
    const conv = db.get(`dm_conv_${cid}`, null);
    if (!conv) return null;
    const otherId = conv.participants.find(p => p !== userId);
    return {
      convId: cid,
      otherId,
      otherName:   conv.names?.[otherId]   || '사용자',
      otherAvatar: conv.avatars?.[otherId] || '',
      lastMessage: conv.lastMessage || '',
      lastAt:      conv.lastAt || conv.createdAt,
      unread:      (conv.unread || {})[userId] || 0
    };
  }).filter(Boolean).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  res.json({ success: true, conversations: convs });
});

// 두 유저 간 메시지 조회 + 읽음 처리
router.get('/conv/:userId/:otherId', (req, res) => {
  const { userId, otherId } = req.params;
  const cid  = convId(userId, otherId);
  const conv = db.get(`dm_conv_${cid}`, null);
  if (!conv) return res.json({ success: true, messages: [] });

  // 읽음 처리
  if (!conv.unread) conv.unread = {};
  conv.unread[userId] = 0;
  db.set(`dm_conv_${cid}`, conv);

  res.json({ success: true, messages: conv.messages || [] });
});

// 메시지 전송
router.post('/conv/:userId/:otherId', (req, res) => {
  const { userId, otherId } = req.params;
  const { content, senderName, senderAvatar, otherName, otherAvatar, mediaUrl, mediaType } = req.body;
  if (!content?.trim() && !mediaUrl) return res.status(400).json({ success: false, error: '내용을 입력해주세요.' });

  const cid = convId(userId, otherId);
  let conv  = db.get(`dm_conv_${cid}`, null);

  if (!conv) {
    conv = {
      id: cid,
      participants: [userId, otherId].sort(),
      names:   { [userId]: senderName || '사용자', [otherId]: otherName || '사용자' },
      avatars: { [userId]: senderAvatar || '',     [otherId]: otherAvatar || '' },
      messages: [],
      unread: {},
      createdAt: db.now()
    };
    // 양쪽 유저 대화 목록에 추가
    const myList    = db.get(`dm_user_${userId}`, []);
    const otherList = db.get(`dm_user_${otherId}`, []);
    if (!myList.includes(cid))    { myList.push(cid);    db.set(`dm_user_${userId}`, myList); }
    if (!otherList.includes(cid)) { otherList.push(cid); db.set(`dm_user_${otherId}`, otherList); }
  }

  const trimmed = content?.trim() || '';
  const msg = {
    id:        db.generateId(),
    senderId:  userId,
    senderName: senderName || '사용자',
    content:   trimmed,
    ...(mediaUrl  ? { mediaUrl }  : {}),
    ...(mediaType ? { mediaType } : {}),
    createdAt: db.now()
  };

  conv.messages.push(msg);
  conv.lastMessage = mediaUrl ? (mediaType === 'video' ? '📹 동영상' : '🖼️ 사진') : trimmed.slice(0, 40);
  conv.lastAt      = msg.createdAt;
  if (!conv.unread) conv.unread = {};
  conv.unread[otherId] = (conv.unread[otherId] || 0) + 1;
  // 이름/아바타 최신화
  if (!conv.names)   conv.names   = {};
  if (!conv.avatars) conv.avatars = {};
  conv.names[userId]   = senderName  || conv.names[userId]   || '사용자';
  conv.names[otherId]  = otherName   || conv.names[otherId]  || '사용자';
  conv.avatars[userId] = senderAvatar  || conv.avatars[userId]  || '';
  conv.avatars[otherId]= otherAvatar   || conv.avatars[otherId] || '';

  db.set(`dm_conv_${cid}`, conv);

  // Socket.IO 실시간 전송
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(otherId, 'dm-message', { ...msg, convId: cid, fromId: userId });
  }

  res.json({ success: true, message: msg });
});

// 전체 읽지 않은 메시지 수
router.get('/unread/:userId', (req, res) => {
  const { userId } = req.params;
  const convIds = db.get(`dm_user_${userId}`, []);
  let total = 0;
  convIds.forEach(cid => {
    const conv = db.get(`dm_conv_${cid}`, null);
    if (conv?.unread?.[userId]) total += conv.unread[userId];
  });
  res.json({ success: true, unread: total });
});

module.exports = router;
