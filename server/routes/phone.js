/**
 * 핸드폰 OTP 인증 라우트
 * POST /api/phone/send-otp    - 인증번호 발송 (Solapi 또는 테스트 모드)
 * POST /api/phone/verify-otp  - 인증번호 검증 → phoneToken 반환
 * POST /api/phone/link        - phoneToken으로 기존 유저에 전화번호 연결 (소셜 가입용)
 */

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const db      = require('../db');

// ─── 인메모리 저장소 ───────────────────────────────────────────────────────────
// phone → { code, expires, attempts }
const otpStore = new Map();
// phoneToken → { phone, expires }
const tokenStore = new Map();

// 만료된 항목 주기적 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of otpStore)   if (v.expires < now) otpStore.delete(k);
  for (const [k, v] of tokenStore) if (v.expires < now) tokenStore.delete(k);
}, 5 * 60 * 1000);

// ─── 유틸 ──────────────────────────────────────────────────────────────────────
function normalizePhone(phone) {
  return (phone || '').replace(/[^0-9]/g, '');
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSms(phone, code) {
  const apiKey     = process.env.SOLAPI_API_KEY;
  const apiSecret  = process.env.SOLAPI_API_SECRET;
  const fromNumber = process.env.SOLAPI_FROM_NUMBER;

  // API 키 미설정 → 테스트 모드 (콘솔 출력 + 응답에 코드 포함)
  if (!apiKey || !apiSecret || !fromNumber) {
    console.log(`\n[Phone OTP] ★ 테스트 모드 ★  ${phone} → ${code}\n`);
    return { success: true, mock: true, testCode: code };
  }

  // Solapi HMAC-SHA256 인증
  const date      = new Date().toISOString();
  const salt      = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  const authHeader = `HMAC-SHA256 ApiKey=${apiKey}, Date=${date}, Salt=${salt}, Signature=${signature}`;

  try {
    const resp = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({
        message: {
          to: phone,
          from: fromNumber,
          text: `[Pawsitive] 인증번호: ${code}\n5분 이내 입력해 주세요.`
        }
      })
    });
    const result = await resp.json();
    if (result.errorCode) {
      console.error('[Solapi]', result.errorCode, result.errorMessage);
      return { success: false, error: 'SMS 발송에 실패했습니다. (' + result.errorCode + ')' };
    }
    return { success: true };
  } catch (e) {
    console.error('[Solapi] 네트워크 오류:', e.message);
    return { success: false, error: 'SMS 서버 연결에 실패했습니다.' };
  }
}

// ─── 공개 유틸: phoneToken 검증 (users.js에서 import) ────────────────────────
function verifyPhoneToken(phoneToken) {
  if (!phoneToken) return null;
  const entry = tokenStore.get(phoneToken);
  if (!entry || entry.expires < Date.now()) {
    tokenStore.delete(phoneToken);
    return null;
  }
  tokenStore.delete(phoneToken); // 1회용 토큰
  return entry.phone;
}

// ─── 라우트 ───────────────────────────────────────────────────────────────────

// POST /api/phone/send-otp
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: '전화번호를 입력해주세요.' });

  const normalized = normalizePhone(phone);
  if (!/^010\d{7,8}$/.test(normalized)) {
    return res.status(400).json({ success: false, error: '올바른 휴대폰 번호를 입력해주세요. (010으로 시작)' });
  }

  // 이미 등록된 번호 체크
  const users = db.get('users', []);
  if (users.find(u => u.phone === normalized)) {
    return res.status(409).json({ success: false, error: '이미 가입된 휴대폰 번호입니다.' });
  }

  // 60초 재발송 쿨다운
  const prev = otpStore.get(normalized);
  if (prev && (prev.expires - 4 * 60 * 1000) > Date.now()) {
    const wait = Math.ceil((prev.expires - 4 * 60 * 1000 - Date.now()) / 1000);
    return res.status(429).json({ success: false, error: `${wait}초 후 재발송 가능합니다.` });
  }

  const code = generateOtp();
  otpStore.set(normalized, { code, expires: Date.now() + 5 * 60 * 1000, attempts: 0 });

  const result = await sendSms(normalized, code);
  if (!result.success) return res.status(500).json({ success: false, error: result.error });

  const resp = { success: true };
  if (result.mock) { resp.testMode = true; resp.testCode = code; }
  res.json(resp);
});

// POST /api/phone/verify-otp
router.post('/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ success: false, error: '전화번호와 인증번호를 입력해주세요.' });

  const normalized = normalizePhone(phone);
  const entry = otpStore.get(normalized);

  if (!entry) return res.status(400).json({ success: false, error: '인증번호를 먼저 발송해주세요.' });
  if (entry.expires < Date.now()) {
    otpStore.delete(normalized);
    return res.status(400).json({ success: false, error: '인증번호가 만료되었습니다. 다시 발송해주세요.' });
  }
  if (entry.attempts >= 5) {
    otpStore.delete(normalized);
    return res.status(400).json({ success: false, error: '인증 시도 횟수(5회)를 초과했습니다. 다시 발송해주세요.' });
  }
  if (entry.code !== String(code).trim()) {
    entry.attempts++;
    return res.status(400).json({ success: false, error: `인증번호가 올바르지 않습니다. (${entry.attempts}/5회)` });
  }

  // 인증 성공 → 10분짜리 phoneToken 발급
  otpStore.delete(normalized);
  const phoneToken = crypto.randomBytes(32).toString('hex');
  tokenStore.set(phoneToken, { phone: normalized, expires: Date.now() + 10 * 60 * 1000 });

  res.json({ success: true, phoneToken });
});

// POST /api/phone/link  (소셜 가입 완료 후 전화번호 연결)
router.post('/link', (req, res) => {
  const { userId, phoneToken } = req.body;
  if (!userId || !phoneToken) return res.status(400).json({ success: false, error: '필수 파라미터가 누락되었습니다.' });

  const phone = verifyPhoneToken(phoneToken);
  if (!phone) return res.status(400).json({ success: false, error: '핸드폰 인증이 만료되었습니다. 다시 인증해주세요.' });

  const users = db.get('users', []);
  if (users.find(u => u.phone === phone && u.id !== userId)) {
    return res.status(409).json({ success: false, error: '이미 가입된 휴대폰 번호입니다.' });
  }

  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return res.status(404).json({ success: false, error: '유저를 찾을 수 없습니다.' });

  users[idx].phone = phone;
  db.set('users', users);
  res.json({ success: true });
});

module.exports = router;
module.exports.verifyPhoneToken = verifyPhoneToken;
