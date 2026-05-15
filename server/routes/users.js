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
const { verifyPhoneToken } = require('./phone');

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
  const { name, email, password, phoneToken } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: '모든 항목을 입력하세요.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ success: false, error: '비밀번호는 4자 이상이어야 합니다.' });
  }

  // 핸드폰 인증 필수
  if (!phoneToken) {
    return res.status(400).json({ success: false, error: '핸드폰 인증을 완료해주세요.' });
  }
  const phone = verifyPhoneToken(phoneToken);
  if (!phone) {
    return res.status(400).json({ success: false, error: '핸드폰 인증이 만료되었습니다. 다시 인증해주세요.' });
  }

  const users = db.get('users', []);

  // 전화번호 중복 체크
  if (users.find(u => u.phone === phone)) {
    return res.status(409).json({ success: false, error: '이미 가입된 휴대폰 번호입니다.' });
  }

  const exists = users.find(u => u.email === email.trim().toLowerCase());
  if (exists) {
    // passwordHash가 없는 기존 사용자 → 비밀번호 설정 후 로그인 처리
    if (!exists.passwordHash) {
      exists.passwordHash = hashPassword(password);
      exists.name = exists.name || name.trim();
      if (!exists.phone) exists.phone = phone;
      db.set('users', users);
      console.log(`[Users] ${email} 기존 계정에 비밀번호 설정 완료`);
      const { passwordHash, ...safeUser } = exists;
      return res.json({ success: true, user: safeUser });
    }
    return res.status(409).json({ success: false, error: '이미 사용 중인 이메일입니다.' });
  }

  const newUser = {
    id: db.generateId(),
    email: email.trim().toLowerCase(),
    name: name.trim(),
    phone,
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
  if (!user) {
    return res.status(401).json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  // passwordHash가 없는 사용자 (로컬 fallback으로 가입된 경우) → 비밀번호 설정
  if (!user.passwordHash) {
    user.passwordHash = hashPassword(password);
    db.set('users', users);
    console.log(`[Users] ${email} 비밀번호 최초 설정 완료`);
  }

  if (user.passwordHash !== hashPassword(password)) {
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

// 관리자: 포인트 지급 / 회수
router.post('/:id/admin-points', (req, res) => {
  const { amount, reason, type } = req.body; // type: 'earn' | 'spend'
  if (!amount || !type || !['earn', 'spend'].includes(type)) {
    return res.status(400).json({ success: false, error: 'amount와 type(earn/spend)이 필요합니다.' });
  }
  const users = db.get('users', []);
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '유저를 찾을 수 없습니다.' });

  const current = users[idx].pawCoins || 0;
  const amt = Number(amount);
  if (type === 'spend' && current < amt) {
    return res.status(400).json({ success: false, error: '포인트가 부족하여 회수할 수 없습니다.' });
  }
  const newBalance = type === 'earn' ? current + amt : current - amt;
  users[idx].pawCoins = newBalance;
  db.set('users', users);

  // 거래 기록 저장
  const txs = db.get('transactions', []);
  txs.push({
    id: db.generateId(),
    userId: req.params.id,
    type,
    amount: amt,
    reason: reason || (type === 'earn' ? '관리자 지급' : '관리자 회수'),
    createdAt: db.now(),
    balanceAfter: newBalance
  });
  db.set('transactions', txs);

  // 서버 사이드 알림 저장 (오프라인 사용자용)
  const notifKey = 'user_notifs_' + req.params.id;
  const notifs = db.get(notifKey, []);
  const notifReason = reason || (type === 'earn' ? '관리자 지급' : '관리자 회수');
  notifs.unshift({
    id: db.generateId(),
    message: type === 'earn'
      ? `관리자가 ${amt.toLocaleString()} PAW 포인트를 지급했어요 🎁`
      : `관리자가 ${amt.toLocaleString()} PAW 포인트를 회수했어요`,
    detail: notifReason,
    type: 'info',
    source: 'system',
    read: false,
    createdAt: db.now()
  });
  if (notifs.length > 30) notifs.splice(30);
  db.set(notifKey, notifs);

  // 실시간 소켓 전송 (온라인 사용자용)
  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(req.params.id, 'admin-points', {
      type, amount: amt,
      reason: reason || (type === 'earn' ? '관리자 지급' : '관리자 회수'),
      newBalance
    });
  }

  res.json({ success: true, newBalance });
});

// 서버 사이드 사용자 알림 조회 (로그인 시 호출 → 읽으면 삭제)
router.get('/:id/server-notifs', (req, res) => {
  const notifKey = 'user_notifs_' + req.params.id;
  const notifs = db.get(notifKey, []);
  db.set(notifKey, []);
  res.json({ success: true, notifications: notifs });
});

module.exports = router;
