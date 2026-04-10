/**
 * 관리자 API 라우트
 * 회원 관리, 사이트 통계, 코인 관리, 게시물 관리
 */

const express = require('express');
const router = express.Router();

// 관리자 이메일 목록
function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
}

// 관리자 확인 미들웨어
function isAdmin(req, res, next) {
  const { adminEmail } = req.headers;
  if (!adminEmail || !getAdminEmails().includes(adminEmail.toLowerCase())) {
    return res.status(403).json({ success: false, error: '관리자 권한이 없습니다.' });
  }
  next();
}

// ===== 회원 목록 조회 =====
router.get('/users', isAdmin, (req, res) => {
  const StorageService = req.app.locals.StorageService;
  // 클라이언트에서 localStorage 데이터를 보내줘야 하므로 프론트에서 처리
  res.json({ success: true, message: '프론트엔드에서 처리' });
});

// ===== 사이트 통계 =====
router.get('/stats', isAdmin, (req, res) => {
  res.json({ success: true, message: '프론트엔드에서 처리' });
});

module.exports = router;
