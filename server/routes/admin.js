/**
 * 관리자 API 라우트
 * 회원 관리, 사이트 통계, 포인트 관리, 게시물 관리
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
}

function isAdmin(req, res, next) {
  const { adminEmail } = req.headers;
  if (!adminEmail || !getAdminEmails().includes(adminEmail.toLowerCase())) {
    return res.status(403).json({ success: false, error: '관리자 권한이 없습니다.' });
  }
  next();
}

// 회원 목록
router.get('/users', isAdmin, (req, res) => {
  const users = db.get('users', []);
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
  res.json({ success: true, users: safeUsers });
});

// 사이트 통계
router.get('/stats', isAdmin, (req, res) => {
  const users = db.get('users', []);
  const walkers = db.get('walkers', []);
  const community = db.get('community', []);
  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      totalWalkers: walkers.length,
      availableWalkers: walkers.filter(w => w.isAvailable).length,
      totalPosts: community.length
    }
  });
});

// 회원 삭제
router.delete('/users/:userId', isAdmin, (req, res) => {
  const users = db.get('users', []).filter(u => u.id !== req.params.userId);
  db.set('users', users);
  res.json({ success: true });
});

module.exports = router;
