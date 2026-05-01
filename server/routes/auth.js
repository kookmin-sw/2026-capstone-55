/**
 * 소셜 로그인 라우트
 * 구글 / 카카오 / 네이버
 * 로그인과 회원가입을 별도 경로로 분리
 */

const express = require('express');
const passport = require('passport');
const router = express.Router();

// 요청 호스트 기반으로 BASE_URL 동적 생성 (로컬이면 localhost, ngrok이면 ngrok)
function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// 공통 콜백 생성 함수
function makeCallback(action) {
  return (req, res) => {
    const user = req.user;
    const userData = encodeURIComponent(JSON.stringify({
      provider: user.provider,
      providerId: user.providerId,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      action: action
    }));
    res.redirect(`/#/auth-callback?user=${userData}`);
  };
}

// ===== 구글 =====
// 로그인용 — 매번 계정 선택
router.get('/google',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('여기에')) {
      return res.status(503).json({ error: '구글 로그인이 아직 설정되지 않았습니다.' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
  }
);
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/#/login?error=google' }),
  makeCallback('login')
);
// 회원가입용 — 계정 선택 + 동의
router.get('/google/register',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('여기에')) {
      return res.status(503).json({ error: '구글 로그인이 아직 설정되지 않았습니다.' });
    }
    passport.authenticate('google-register', { scope: ['profile', 'email'], prompt: 'consent' })(req, res, next);
  }
);
router.get('/google/register/callback',
  passport.authenticate('google-register', { failureRedirect: '/#/register?error=google' }),
  makeCallback('register')
);

// ===== 카카오 =====
// 로그인용 — 아이디/비번 입력, 동의 화면 절대 안 뜸
router.get('/kakao', (req, res) => {
  if (!process.env.KAKAO_CLIENT_ID || process.env.KAKAO_CLIENT_ID.includes('여기에')) {
    return res.status(503).json({ error: '카카오 로그인이 아직 설정되지 않았습니다.' });
  }
  const base = getBaseUrl(req);
  const kakaoAuthUrl = 'https://kauth.kakao.com/oauth/authorize'
    + '?client_id=' + process.env.KAKAO_CLIENT_ID
    + '&redirect_uri=' + encodeURIComponent(`${base}/auth/kakao/callback`)
    + '&response_type=code'
    + '&prompt=login';
  res.redirect(kakaoAuthUrl);
});
router.get('/kakao/callback',
  passport.authenticate('kakao', { failureRedirect: '/#/login?error=kakao' }),
  makeCallback('login')
);

// 회원가입용 — 먼저 unlink로 동의 기록 초기화 후 인증 (동의 화면 무조건 뜸)
router.get('/kakao/register', async (req, res) => {
  if (!process.env.KAKAO_CLIENT_ID || process.env.KAKAO_CLIENT_ID.includes('여기에')) {
    return res.status(503).json({ error: '카카오 로그인이 아직 설정되지 않았습니다.' });
  }
  const base = getBaseUrl(req);
  const kakaoAuthUrl = 'https://kauth.kakao.com/oauth/authorize'
    + '?client_id=' + process.env.KAKAO_CLIENT_ID
    + '&redirect_uri=' + encodeURIComponent(`${base}/auth/kakao/register/callback`)
    + '&response_type=code'
    + '&prompt=login'
    + '&scope=profile_nickname,profile_image';
  res.redirect(kakaoAuthUrl);
});
router.get('/kakao/register/callback',
  passport.authenticate('kakao-register', { failureRedirect: '/#/register?error=kakao' }),
  makeCallback('register')
);

// ===== 네이버 =====
// 로그인용 — 매번 아이디/비번 입력
router.get('/naver', (req, res) => {
  if (!process.env.NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID.includes('여기에')) {
    return res.status(503).json({ error: '네이버 로그인이 아직 설정되지 않았습니다.' });
  }
  const base = getBaseUrl(req);
  const state = Math.random().toString(36).substring(2);
  req.session.naverState = state;
  const naverAuthUrl = 'https://nid.naver.com/oauth2.0/authorize'
    + '?client_id=' + process.env.NAVER_CLIENT_ID
    + '&redirect_uri=' + encodeURIComponent(`${base}/auth/naver/callback`)
    + '&response_type=code'
    + '&state=' + state
    + '&auth_type=reauthenticate';
  res.redirect(naverAuthUrl);
});
router.get('/naver/callback',
  passport.authenticate('naver', { failureRedirect: '/#/login?error=naver' }),
  makeCallback('login')
);

// 회원가입용
router.get('/naver/register', (req, res) => {
  if (!process.env.NAVER_CLIENT_ID || process.env.NAVER_CLIENT_ID.includes('여기에')) {
    return res.status(503).json({ error: '네이버 로그인이 아직 설정되지 않았습니다.' });
  }
  const base = getBaseUrl(req);
  const state = Math.random().toString(36).substring(2);
  req.session.naverRegState = state;
  const naverAuthUrl = 'https://nid.naver.com/oauth2.0/authorize'
    + '?client_id=' + process.env.NAVER_CLIENT_ID
    + '&redirect_uri=' + encodeURIComponent(`${base}/auth/naver/register/callback`)
    + '&response_type=code'
    + '&state=' + state
    + '&auth_type=reauthenticate';
  res.redirect(naverAuthUrl);
});
router.get('/naver/register/callback',
  passport.authenticate('naver-register', { failureRedirect: '/#/register?error=naver' }),
  makeCallback('register')
);

// ===== 카카오 연결 끊기 API =====
router.post('/kakao/unlink', async (req, res) => {
  const { kakaoId } = req.body;
  if (!kakaoId || !process.env.KAKAO_ADMIN_KEY) {
    return res.json({ success: false });
  }
  try {
    const response = await fetch('https://kapi.kakao.com/v1/user/unlink', {
      method: 'POST',
      headers: {
        'Authorization': `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `target_id_type=user_id&target_id=${kakaoId}`
    });
    const data = await response.json();
    console.log('[카카오 연결 끊기]', data);
    res.json({ success: true });
  } catch (e) {
    console.error('[카카오 연결 끊기 실패]', e.message);
    res.json({ success: false });
  }
});

// ===== 로그아웃 =====
router.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/#/');
    });
  });
});

module.exports = router;
