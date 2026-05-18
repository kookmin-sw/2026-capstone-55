/**
 * 이메일 인증코드 발송/검증 라우트
 */

const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 로고 이미지 base64 (이메일용)
let _logoBase64 = '';
try {
  const logoPath = path.join(__dirname, '..', '..', 'pawsitive_logo_transparent.png');
  _logoBase64 = fs.readFileSync(logoPath).toString('base64');
} catch(e) { console.warn('로고 이미지 로드 실패:', e.message); }

// 인증코드 임시 저장소 (메모리)
// 실제 서비스에서는 Redis나 DB 사용 권장
const verificationCodes = new Map();

// 6자리 인증코드 생성
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SMTP 설정 확인
function isEmailConfigured() {
  return process.env.SMTP_USER &&
         process.env.SMTP_PASS &&
         !process.env.SMTP_USER.includes('여기에') &&
         !process.env.SMTP_PASS.includes('여기에');
}

// Nodemailer 트랜스포터 생성
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * POST /api/email/send-code
 * 이메일로 인증코드 발송
 */
router.post('/send-code', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: '올바른 이메일을 입력해주세요.' });
  }

  // SMTP 미설정 시 테스트 모드
  if (!isEmailConfigured()) {
    const code = generateCode();
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5분
    });
    console.log(`📧 [테스트 모드] ${email} 인증코드: ${code}`);
    return res.json({
      success: true,
      testMode: true,
      testCode: code,
      message: 'SMTP 미설정 상태입니다. 테스트 코드가 반환됩니다.'
    });
  }

  // 실제 이메일 발송
  try {
    const code = generateCode();
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Pawsitive 🐾" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Pawsitive 이메일 인증코드',
      html: `
        <div style="font-family:-apple-system,'Helvetica Neue',sans-serif; max-width:440px; margin:0 auto; padding:40px 32px; background:#FAFAF8;">
          <div style="text-align:center; margin-bottom:32px;">
            <img src="data:image/png;base64,${_logoBase64}" width="200" alt="pawsitive" style="display:block; margin:0 auto;">
          </div>
          <div style="background:#fff; border-radius:12px; padding:32px; border:1px solid #E5E3E0; text-align:center;">
            <p style="color:#1A1A1A; font-size:0.95rem; margin:0 0 20px; font-weight:500;">이메일 인증코드</p>
            <div style="background:#1A1A1A; color:#fff; font-size:1.8rem; font-weight:700; letter-spacing:8px; padding:16px 28px; border-radius:8px; display:inline-block;">
              ${code}
            </div>
            <p style="color:#A0A0A0; font-size:0.82rem; margin-top:20px;">5분 이내에 입력해주세요.</p>
          </div>
          <p style="text-align:center; color:#A0A0A0; font-size:0.75rem; margin-top:20px;">본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>
        </div>
      `
    });

    console.log(`📧 ${email}로 인증코드 발송 완료`);
    res.json({ success: true, message: '인증코드가 발송되었습니다.' });

  } catch (error) {
    console.error('📧 이메일 발송 실패:', error.message);
    res.status(500).json({ success: false, error: '이메일 발송에 실패했습니다.' });
  }
});

/**
 * POST /api/email/verify-code
 * 인증코드 검증
 */
router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, error: '이메일과 인증코드를 입력해주세요.' });
  }

  const stored = verificationCodes.get(email);

  if (!stored) {
    return res.json({ success: false, error: '인증코드를 먼저 요청해주세요.' });
  }

  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email);
    return res.json({ success: false, error: '인증코드가 만료되었습니다. 다시 요청해주세요.' });
  }

  if (stored.code !== code) {
    return res.json({ success: false, error: '인증코드가 일치하지 않습니다.' });
  }

  // 인증 성공 → 코드 삭제
  verificationCodes.delete(email);
  res.json({ success: true, message: '이메일 인증이 완료되었습니다!' });
});

module.exports = router;
