/**
 * 유저 API 라우트 - 서버 공유 DB 연동
 * POST /api/users/register  → 이메일 회원가입
 * POST /api/users/login     → 이메일 로그인
 * GET  /api/users           → 전체 유저 목록 (관리자용)
 * GET  /api/users/:id       → 특정 유저 조회
 * PUT  /api/users/:id       → 유저 정보 수정
 * POST /api/users/:id/dogs  → 반려견 추가
 * PATCH /api/users/:id/nickname → 닉네임 설정
 * POST /api/users/referral  → 추천인 코드 적용
 * DELETE /api/users/:id     → 회원 탈퇴
 * POST /api/users/sync      → OAuth 유저 서버 동기화
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(36);
}

function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'PAW-' + code;
}

// 이메일 회원가입
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: '모든 항목을 입력하세요.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ success: false, error: '비밀번호는 4자 이상이어야 합니다.' });
  }

  const users = db.get('users', []);
  const exists = users.find(u => u.email === email.trim().toLowerCase());
  if (exists) {
    return res.status(409).json({ success: false, error: '이미 사용 중인 이메일입니다.' });
  }

  const newUser = {
    id: db.generateId(),
    email: email.trim().toLowerCase(),
    name: name.trim(),
    nickname: '',
    passwordHash: hashPassword(password),
    referralCode: generateReferralCode(),
    dogs: [],
    pawCoins: 3000,
    createdAt: db.now()
  };

  users.push(newUser);
  db.set('users', users);

  const { passwordHash, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});

// 이메일 로그인
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: '이메일과 비밀번호를 입력하세요.' });
  }

  const users = db.get('users', []);
  const user = users.find(u => u.email === email.trim().toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// OAuth 유저 서버 동기화 (로그인/가입 시 호출)
router.post('/sync', (req, res) => {
  const userData = req.body;
  if (!userData || !userData.id) {
    return res.status(400).json({ success: false, error: 'id가 필요합니다.' });
  }

  const users = db.get('users', []);
  const idx = users.findIndex(u => u.id === userData.id);

  if (idx >= 0) {
    // 기존 유저 업데이트 (서버 데이터 우선, 일부 필드만 덮어쓰기)
    users[idx] = { ...users[idx], ...userData };
  } else {
    users.push({ ...userData, pawCoins: userData.pawCoins || 3000, createdAt: userData.createdAt || db.now() });
  }

  db.set('users', users);
  const { passwordHash, ...safeUser } = users[idx >= 0 ? idx : users.length - 1];
  res.json({ success: true, user: safeUser });
});

// 유저 조회
router.get('/:id', (req, res) => {
  const users = db.get('users', []);
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: '유저를 찾을 수 없습니다.' });
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// 전체 유저 목록 (관리자용)
router.get('/', (req, res) => {
  const users = db.get('users', []);
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
  res.json({ success: true, users: safeUsers });
});

// 유저 정보 수정
router.put('/:id', (req, res) => {
  const users = db.get('users', []);
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '유저를 찾을 수 없습니다.' });

  const allowed = ['name', 'nickname', 'dogs', 'pawCoins', 'profileImage', 'nicknameChangedAt', 'usedReferralCode', 'notes'];
  allowed.forEach(key => {
    if (req.body[key] !== undefined) users[idx][key] = req.body[key];
  });

  db.set('users', users);
  const { passwordHash, ...safeUser } = users[idx];
  res.json({ success: true, user: safeUser });
});

// 반려견 추가
router.post('/:id/dogs', (req, res) => {
  const users = db.get('users', []);
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '유저를 찾을 수 없습니다.' });

  const dog = { id: db.generateId(), ...req.body };
  if (!users[idx].dogs) users[idx].dogs = [];
  users[idx].dogs.push(dog);
  db.set('users', users);

  res.json({ success: true, dog });
});

// 닉네임 설정
router.patch('/:id/nickname', (req, res) => {
  const { nickname } = req.body;
  if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 12) {
    return res.status(400).json({ success: false, error: '닉네임은 2~12자로 입력해주세요.' });
  }

  const users = db.get('users', []);
  const duplicate = users.find(u => u.nickname === nickname.trim() && u.id !== req.params.id);
  if (duplicate) return res.status(409).json({ success: false, error: '이미 사용 중인 닉네임이에요.' });

  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '유저를 찾을 수 없습니다.' });

  if (users[idx].nickname && users[idx].nicknameChangedAt) {
    const lastChanged = new Date(users[idx].nicknameChangedAt);
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - lastChanged.getTime() < twoWeeks) {
      const nextDate = new Date(lastChanged.getTime() + twoWeeks);
      return res.status(400).json({ success: false, error: `닉네임은 2주에 한 번만 변경할 수 있어요. 다음 변경 가능일: ${nextDate.toLocaleDateString('ko-KR')}` });
    }
  }

  users[idx].nickname = nickname.trim();
  users[idx].nicknameChangedAt = db.now();
  db.set('users', users);

  const { passwordHash, ...safeUser } = users[idx];
  res.json({ success: true, user: safeUser });
});

// 회원 탈퇴
router.delete('/:id', (req, res) => {
  const users = db.get('users', []);
  const filtered = users.filter(u => u.id !== req.params.id);
  db.set('users', filtered);
  res.json({ success: true });
});

module.exports = router;
