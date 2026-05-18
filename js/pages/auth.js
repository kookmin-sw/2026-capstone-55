// Pawsitive - Auth Pages
// Login, register, social auth, and welcome setup

function renderLoginPage() {
 renderPage(`
 <div class="auth-container">
 <div class="auth-card">
 <div id="login-error"></div>

 <!-- 소셜 로그인 버튼들 -->
 <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
 <button onclick="window.location.href='/auth/google'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#fff; border:2px solid #E5E7EB; color:#374151; cursor:pointer; transition:all 0.2s;">
 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style="width:20px; height:20px;"> 구글로 로그인
 </button>
 <button onclick="window.location.href='/auth/kakao'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#FEE500; border:none; color:#3C1E1E; cursor:pointer; transition:all 0.2s;">
 카카오로 로그인
 </button>
 <button onclick="window.location.href='/auth/naver'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#03C75A; border:none; color:#fff; cursor:pointer; transition:all 0.2s;">
 <span style="font-weight:900; font-size:1rem;">N</span> 네이버로 로그인
 </button>
 </div>

 <!-- 구분선 -->
 <div style="display:flex; align-items:center; gap:12px; margin:20px 0;">
 <div style="flex:1; height:1px; background:var(--color-border);"></div>
 <span style="font-size:0.8rem; color:var(--color-text-muted); font-weight:600;">또는 이메일로 로그인</span>
 <div style="flex:1; height:1px; background:var(--color-border);"></div>
 </div>

 <!-- 이메일 로그인 -->
 <div class="form-group">
 <label for="login-email">이메일</label>
 <input type="email" id="login-email" class="form-input" placeholder="이메일을 입력하세요">
 </div>
 <div class="form-group">
 <label for="login-password">비밀번호</label>
 <input type="password" id="login-password" class="form-input" placeholder="비밀번호를 입력하세요">
 </div>
 <label style="display:flex; align-items:center; gap:6px; margin-bottom:16px; cursor:pointer;">
 <input type="checkbox" id="login-remember" style="width:16px; height:16px; cursor:pointer;">
 <span style="font-size:0.85rem; color:var(--color-text-light); font-weight:600;">로그인 유지</span>
 </label>
 <button class="btn btn-primary" style="width:100%;" onclick="handleLogin()">로그인</button>
 <div style="display:flex; align-items:center; gap:12px; margin-top:16px;">
 <div style="flex:1; height:1px; background:var(--color-border);"></div>
 <span style="font-size:0.75rem; color:var(--color-text-muted); white-space:nowrap;">아직 계정이 없으신가요?</span>
 <div style="flex:1; height:1px; background:var(--color-border);"></div>
 </div>
 <a href="#/register" style="display:block; margin-top:12px; padding:13px 16px; background:#111; border-radius:var(--radius-full); font-size:0.88rem; font-weight:700; color:#fff; text-align:center; text-decoration:none; transition:opacity 0.15s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">회원가입</a>
 </div>
 </div>
 `);
}

// --- 회원가입 페이지 ---
function renderRegisterPage() {
 renderPage(`
 <div class="auth-container">
 <div class="auth-card">
 <div class="auth-logo"></div>
 <h2>회원가입</h2>
 <div id="register-error"></div>

 <!-- 소셜 가입 버튼들 -->
 <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
 <button onclick="window.location.href='/auth/google/register'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#fff; border:2px solid #E5E7EB; color:#374151; cursor:pointer; transition:all 0.2s;">
 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style="width:20px; height:20px;"> 구글로 가입하기
 </button>
 <button onclick="handleKakaoRegister()" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#FEE500; border:none; color:#3C1E1E; cursor:pointer; transition:all 0.2s;">
 카카오로 가입하기
 </button>
 <button onclick="window.location.href='/auth/naver/register'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#03C75A; border:none; color:#fff; cursor:pointer; transition:all 0.2s;">
 <span style="font-weight:900; font-size:1rem;">N</span> 네이버로 가입하기
 </button>
 </div>

 <!-- 구분선 -->
 <div style="display:flex; align-items:center; gap:12px; margin:20px 0;">
 <div style="flex:1; height:1px; background:var(--color-border);"></div>
 <span style="font-size:0.8rem; color:var(--color-text-muted); font-weight:600;">또는 이메일로 가입</span>
 <div style="flex:1; height:1px; background:var(--color-border);"></div>
 </div>

 <!-- 이메일 가입 (인증코드 방식) -->
 <div class="form-group">
 <label for="reg-name">이름</label>
 <input type="text" id="reg-name" class="form-input" placeholder="이름을 입력하세요">
 </div>
 <div class="form-group">
 <label for="reg-email">이메일</label>
 <div style="display:flex; gap:8px;">
 <input type="email" id="reg-email" class="form-input" placeholder="이메일을 입력하세요" style="flex:1;">
 <button class="btn btn-secondary btn-sm" id="send-code-btn" onclick="handleSendVerificationCode()" style="white-space:nowrap;">인증코드 발송</button>
 </div>
 </div>
 <div class="form-group" id="verify-code-group" style="display:none;">
 <label for="reg-code">인증코드</label>
 <div style="display:flex; gap:8px;">
 <input type="text" id="reg-code" class="form-input" placeholder="6자리 인증코드 입력" maxlength="6" style="flex:1; letter-spacing:4px; font-weight:700; text-align:center;">
 <button class="btn btn-primary btn-sm" onclick="handleVerifyCode()" style="white-space:nowrap;">확인</button>
 </div>
 <div id="verify-code-message" style="margin-top:6px;"></div>
 </div>
 <div class="form-group">
 <label for="reg-password">비밀번호</label>
 <input type="password" id="reg-password" class="form-input" placeholder="비밀번호를 입력하세요">
 </div>
 <input type="hidden" id="reg-email-verified" value="false">

 <!-- 핸드폰 인증 -->
 ${_phoneVerifyHtml()}

 <div style="background:var(--color-bg-warm); border:2px solid var(--color-border); border-radius:12px; padding:16px; margin-bottom:16px;">
 <p style="font-size:0.82rem; color:var(--color-text-light); margin-bottom:10px;">Pawsitive 서비스 이용을 위해 이름, 이메일을 수집하며 회원 탈퇴 시까지 보유합니다.</p>
 <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:6px;">
 <input type="checkbox" id="reg-agree-privacy" style="width:16px; height:16px; cursor:pointer;">
 <span style="font-size:0.83rem; font-weight:700; color:var(--color-text);">[필수] 개인정보 수집 및 이용에 동의합니다</span>
 </label>
 <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
 <input type="checkbox" id="reg-agree-terms" style="width:16px; height:16px; cursor:pointer;">
 <span style="font-size:0.83rem; font-weight:700; color:var(--color-text);">[필수] Pawsitive 이용약관에 동의합니다</span>
 </label>
 </div>

 <button class="btn btn-primary" style="width:100%;" onclick="handleRegister()">가입하기</button>
 <div class="auth-footer">
 이미 계정이 있으신가요? <a href="#/login">로그인</a>
 </div>
 </div>
 </div>
 `);
}

// --- 로그인/회원가입 핸들러 ---

/**
 * 카카오 회원가입 ? 바로 카카오 인증으로 이동
 */
function handleKakaoRegister() {
 window.location.href = '/auth/kakao/register';
}

/**
 * 소셜 회원가입 동의 페이지
 */
function renderSocialAgreePage() {
 const userData = StorageService.get('pendingSocialUser');
 if (!userData) {
 Router.navigate('/register');
 return;
 }

 const providerName = { kakao: '카카오', naver: '네이버', google: '구글' }[userData.provider] || userData.provider;

 renderPage(`
 <div class="auth-container">
 <div class="auth-card">
 <div class="auth-logo"></div>
 <h2>Pawsitive 회원가입 동의</h2>
 <div style="text-align:center; margin-bottom:20px;">
 <span class="badge badge-primary" style="font-size:0.85rem; padding:6px 16px;">${providerName} 계정: ${userData.name || '사용자'}</span>
 </div>

 <div style="background:var(--color-bg-warm); border:2px solid var(--color-border); border-radius:16px; padding:20px; margin-bottom:20px;">
 <h3 style="font-size:0.95rem; font-weight:800; margin-bottom:12px; color:var(--color-text);">개인정보 수집 및 이용 동의</h3>
 <div style="font-size:0.82rem; color:var(--color-text-light); line-height:1.8;">
 <p style="margin-bottom:8px;">Pawsitive 서비스 이용을 위해 아래 정보를 수집합니다.</p>
 <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
 <tr style="border-bottom:1px solid var(--color-border);">
 <td style="padding:6px 0; font-weight:700;">수집 항목</td>
 <td style="padding:6px 0;">닉네임, 프로필 사진</td>
 </tr>
 <tr style="border-bottom:1px solid var(--color-border);">
 <td style="padding:6px 0; font-weight:700;">수집 목적</td>
 <td style="padding:6px 0;">서비스 내 프로필 표시, 커뮤니티 활동</td>
 </tr>
 <tr>
 <td style="padding:6px 0; font-weight:700;">보유 기간</td>
 <td style="padding:6px 0;">회원 탈퇴 시까지</td>
 </tr>
 </table>
 </div>
 </div>

 <label style="display:flex; align-items:center; gap:8px; margin-bottom:12px; cursor:pointer;">
 <input type="checkbox" id="agree-privacy" style="width:18px; height:18px; cursor:pointer;">
 <span style="font-size:0.85rem; font-weight:700; color:var(--color-text);">[필수] 개인정보 수집 및 이용에 동의합니다</span>
 </label>
 <label style="display:flex; align-items:center; gap:8px; margin-bottom:20px; cursor:pointer;">
 <input type="checkbox" id="agree-terms" style="width:18px; height:18px; cursor:pointer;">
 <span style="font-size:0.85rem; font-weight:700; color:var(--color-text);">[필수] Pawsitive 이용약관에 동의합니다</span>
 </label>

 <!-- 핸드폰 인증 -->
 <div id="social-phone-error"></div>
 ${_phoneVerifyHtml()}

 <button class="btn btn-primary" style="width:100%; opacity:0.5;" id="agree-submit-btn" onclick="handleSocialAgreeSubmit()" disabled>동의하고 가입하기 </button>
 <button class="btn btn-secondary" style="width:100%; margin-top:8px;" onclick="handleSocialAgreeCancel()">취소</button>
 </div>
 </div>
 `);

 // 체크박스 이벤트
 const check1 = document.getElementById('agree-privacy');
 const check2 = document.getElementById('agree-terms');
 const btn = document.getElementById('agree-submit-btn');
 function updateBtn() {
 const allChecked = check1.checked && check2.checked;
 btn.disabled = !allChecked;
 btn.style.opacity = allChecked ? '1' : '0.5';
 }
 check1.addEventListener('change', updateBtn);
 check2.addEventListener('change', updateBtn);
}

/**
 * 소셜 동의 완료 → 실제 가입 처리
 */
async function handleSocialAgreeSubmit() {
 const userData = StorageService.get('pendingSocialUser');
 if (!userData) { Router.navigate('/register'); return; }

 // 핸드폰 인증 확인
 const phoneToken = document.getElementById('reg-phone-token')?.value;
 if (!phoneToken) {
  const errEl = document.getElementById('social-phone-error');
  if (errEl) errEl.innerHTML = '<div class="alert alert-error">핸드폰 인증을 완료해주세요.</div>';
  document.getElementById('reg-phone')?.focus();
  return;
 }

 const socialKey = userData.provider + '_' + userData.providerId;
 const existingUsers = StorageService.get('users', []);

 const user = {
 id: StorageService.generateId(),
 email: userData.email || socialKey + '@social',
 name: userData.name || '소셜 사용자',
 nickname: '',
 passwordHash: '',
 socialKey: socialKey,
 provider: userData.provider,
 profileImage: userData.profileImage || '',
 referralCode: AuthService.generateReferralCode(),
 dogs: [],
 pawCoins: 0,
 createdAt: StorageService.now()
 };
 existingUsers.push(user);
 StorageService.set('users', existingUsers);
 StorageService.remove('pendingSocialUser');

 // 서버에 유저 동기화
 await fetch('/api/users/sync', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...user, pawCoins: 3000 })
 }).catch(() => {});

 // 핸드폰 번호 서버에 연결 (phoneToken 검증 + phone 저장)
 const linkRes = await fetch('/api/phone/link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id, phoneToken })
 }).catch(() => null);
 if (linkRes && !linkRes.ok) {
  const linkData = await linkRes.json().catch(() => ({}));
  const errEl = document.getElementById('social-phone-error');
  if (errEl) errEl.innerHTML = `<div class="alert alert-error">${linkData.error || '핸드폰 인증 연결에 실패했습니다.'}</div>`;
  return;
 }

 // 가입 축하 3,000 PAW 포인트 지급
 if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
 WalletService.earnCoins(user.id, 3000, '회원가입 축하 보상 ');
 }

 // 로그인 처리
 const safeUser = { ...user };
 delete safeUser.passwordHash;
 StorageService.set('currentUser', safeUser);
 StorageService.set('authToken', {
 token: StorageService.generateId(),
 userId: user.id,
 expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
 });

 updateNavAuth();
 alert(' 회원가입을 축하해요!\n\n가입 축하 3,000 PAW 포인트가 지급되었어요!\n\n닉네임과 추천인 코드를 설정해주세요~');
 Router.navigate('/welcome-setup');
}

/**
 * 소셜 동의 취소
 */
function handleSocialAgreeCancel() {
 StorageService.remove('pendingSocialUser');
 fetch('/auth/logout', { credentials: 'include' });
 Router.navigate('/register');
}

/**
 * 가입 후 닉네임 + 추천인 설정 페이지
 */
function renderWelcomeSetupPage() {
 const user = AuthService.getCurrentUser();
 if (!user) { Router.navigate('/login'); return; }

 renderPage(`
 <div class="auth-container" style="max-width:460px;">
 <div class="auth-card">
 <div style="text-align:center; margin-bottom:20px;">
 <div style="font-size:3rem;"></div>
 <h2 style="margin-top:8px;">환영해요, ${user.name}님!</h2>
 <p style="color:var(--color-text-light); font-size:0.9rem;">마지막 설정만 하면 가입 완료예요~</p>
 </div>

 <div id="welcome-error"></div>

 <div class="form-group">
 <label for="setup-nickname">닉네임 설정</label>
 <input type="text" id="setup-nickname" class="form-input" placeholder="다른 사람들에게 보여질 닉네임 (2~12자)" maxlength="12">
 <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:4px;">커뮤니티, 산책 매칭 등에서 사용돼요</p>
 </div>

 <div class="form-group">
 <label for="setup-referral">추천인 코드 (선택)</label>
 <input type="text" id="setup-referral" class="form-input" placeholder="추천인 코드가 있다면 입력해주세요" style="text-transform:uppercase;">
 <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:4px;">추천인 입력 시 나에게 3,000 PAW, 추천인에게 1,500 PAW 지급! </p>
 </div>

 <div style="background:var(--color-bg-warm); border-radius:12px; padding:14px; margin-bottom:20px; text-align:center;">
 <p style="font-size:0.82rem; color:var(--color-text-light);">내 추천인 코드</p>
 <p style="font-size:1.2rem; font-weight:900; color:var(--color-primary-dark); letter-spacing:2px; margin-top:4px;">${user.referralCode || '생성 중...'}</p>
 <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:4px;">친구에게 공유하고, 친구가 가입 시 입력하면 1,500 PAW 포인트를 받아요!</p>
 </div>

 <button class="btn btn-primary" style="width:100%; font-size:1rem; padding:14px;" onclick="handleWelcomeSetup()">설정 완료 </button>
 <button class="btn btn-secondary" style="width:100%; margin-top:8px;" onclick="handleSkipSetup()">나중에 할게요</button>
 </div>
 </div>
 `);
}

/**
 * 닉네임 + 추천인 설정 완료 핸들러
 */
function handleWelcomeSetup() {
 const user = AuthService.getCurrentUser();
 if (!user) return;

 const nickname = document.getElementById('setup-nickname')?.value?.trim();
 const referralCode = document.getElementById('setup-referral')?.value?.trim().toUpperCase();
 const errEl = document.getElementById('welcome-error');

 // 닉네임 설정
 if (!nickname) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">닉네임을 입력해주세요.</div>';
 return;
 }

 const nicknameResult = AuthService.setNickname(user.id, nickname);
 if (!nicknameResult.success) {
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${nicknameResult.error}</div>`;
 return;
 }

 // 추천인 코드 처리
 if (referralCode) {
 if (referralCode === user.referralCode) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">본인의 추천인 코드는 입력할 수 없어요.</div>';
 return;
 }

 const referrer = AuthService.findByReferralCode(referralCode);
 if (!referrer) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">존재하지 않는 추천인 코드예요.</div>';
 return;
 }

 // 추천인 코드 사용 기록 저장
 const users = StorageService.get('users', []);
 const userIndex = users.findIndex(u => u.id === user.id);
 if (userIndex !== -1) {
 users[userIndex].usedReferralCode = referralCode;
 StorageService.set('users', users);
 }

 // 양쪽에 포인트 지급 (입력한 사람 3000, 추천인 1500)
 if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
 WalletService.earnCoins(user.id, 3000, '추천인 코드 입력 보상');
 WalletService.earnCoins(referrer.id, 1500, (user.nickname || user.name) + '님의 추천 보상');
 }
 }

 // 완료 메시지
 let welcomeMsg = ' 회원가입을 축하해요!\n\n가입 축하 3,000 PAW 포인트가 지급되었어요!';
 if (referralCode && AuthService.findByReferralCode(referralCode)) {
 welcomeMsg += '\n추천인 보상 3,000 PAW 포인트가 추가 지급되었어요!';
 welcomeMsg += '\n\n총 6,000 PAW 포인트로 시작해요! ';
 } else {
 welcomeMsg += '\n\nPawsitive에 오신 걸 환영해요! ';
 }
 alert(welcomeMsg);
 Router.navigate('/');
}

/**
 * 설정 건너뛰기
 */
function handleSkipSetup() {
 const user = AuthService.getCurrentUser();
 if (user && !user.nickname) {
 // 닉네임 없으면 이름으로 기본 설정
 AuthService.setNickname(user.id, user.name);
 }
 alert('Pawsitive에 오신 걸 환영해요! \n\n닉네임과 추천인 코드는 프로필에서 언제든 설정할 수 있어요~');
 Router.navigate('/');
}

/**
 * 이메일 인증코드 발송
 */
async function handleSendVerificationCode() {
 const email = document.getElementById('reg-email')?.value;
 const errEl = document.getElementById('register-error');
 const btn = document.getElementById('send-code-btn');

 if (!email || !email.includes('@')) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">올바른 이메일을 입력해주세요.</div>';
 return;
 }

 if (btn) { btn.disabled = true; btn.textContent = '발송 중...'; }

 try {
 const res = await fetch('/api/email/send-code', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email })
 });
 const data = await res.json();

 if (data.success) {
 // 인증코드 입력 필드 표시
 const codeGroup = document.getElementById('verify-code-group');
 if (codeGroup) codeGroup.style.display = 'block';

 const msgEl = document.getElementById('verify-code-message');
 if (data.testMode) {
 // SMTP 미설정 → 테스트 모드: 코드를 화면에 표시
 if (msgEl) msgEl.innerHTML = `<div class="alert alert-success">테스트 모드: 인증코드는 <strong>${data.testCode}</strong> 입니다</div>`;
 } else {
 if (msgEl) msgEl.innerHTML = '<div class="alert alert-success">인증코드가 이메일로 발송되었어요! 📧</div>';
 }

 if (btn) { btn.textContent = '재발송'; btn.disabled = false; }
 } else {
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
 if (btn) { btn.textContent = '인증코드 발송'; btn.disabled = false; }
 }
 } catch (e) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.</div>';
 if (btn) { btn.textContent = '인증코드 발송'; btn.disabled = false; }
 }
}

/**
 * 인증코드 검증
 */
async function handleVerifyCode() {
 const email = document.getElementById('reg-email')?.value;
 const code = document.getElementById('reg-code')?.value;
 const msgEl = document.getElementById('verify-code-message');

 if (!code || code.length !== 6) {
 if (msgEl) msgEl.innerHTML = '<div class="alert alert-error">6자리 인증코드를 입력해주세요.</div>';
 return;
 }

 try {
 const res = await fetch('/api/email/verify-code', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, code })
 });
 const data = await res.json();

 if (data.success) {
 if (msgEl) msgEl.innerHTML = '<div class="alert alert-success">이메일 인증 완료! </div>';
 const verifiedInput = document.getElementById('reg-email-verified');
 if (verifiedInput) verifiedInput.value = 'true';
 // 이메일 필드 비활성화
 const emailInput = document.getElementById('reg-email');
 if (emailInput) emailInput.readOnly = true;
 } else {
 if (msgEl) msgEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
 }
 } catch (e) {
 if (msgEl) msgEl.innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
 }
}

/**
 * 소셜 로그인 콜백 처리
 */
function handleSocialAuthCallback() {
 const hash = window.location.hash;
 if (!hash.includes('/auth-callback')) return;

 try {
 const queryStr = hash.split('?')[1];
 if (!queryStr) return;
 const params = new URLSearchParams(queryStr);
 const userParam = params.get('user');
 if (!userParam) return;
 const userData = JSON.parse(decodeURIComponent(userParam));

 if (userData && userData.provider) {
 const existingUsers = StorageService.get('users', []);
 const socialKey = userData.provider + '_' + userData.providerId;
 let user = existingUsers.find(u => u.socialKey === socialKey);
 const action = userData.action || StorageService.get('socialAction', 'login');
 StorageService.remove('socialAction');

 if (action === 'login') {
 // 로그인 모드: 가입된 계정만 로그인 허용
 if (!user) {
 alert('가입된 계정이 없어요. 회원가입을 먼저 해주세요! ');
 // 서버 세션 끊기
 fetch('/auth/logout', { credentials: 'include' });
 Router.navigate('/register');
 return;
 }
 } else {
 // 회원가입 모드: 이미 가입된 계정이면 안내
 if (user) {
 alert('이미 가입된 계정이에요! 로그인 페이지로 이동할게요 ');
 fetch('/auth/logout', { credentials: 'include' });
 Router.navigate('/login');
 return;
 }
 // 신규 가입 ? 동의 화면을 우리가 직접 표시
 StorageService.set('pendingSocialUser', userData);
 fetch('/auth/logout', { credentials: 'include' });
 Router.navigate('/social-agree');
 return;
 }

 // 서버에 유저 동기화
 fetch('/api/users/sync', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(user)
 }).catch(() => {});

 // 로그인 처리
 const safeUser = { ...user };
 delete safeUser.passwordHash;
 StorageService.set('currentUser', safeUser);
 StorageService.set('authToken', {
 token: StorageService.generateId(),
 userId: user.id,
 expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
 });

 updateNavAuth();
 Router.navigate('/');
 }
 } catch (e) {
 console.error('[Pawsitive] 소셜 로그인 콜백 처리 오류:', e);
 Router.navigate('/login');
 }
}

async function handleLogin() {
 const email = document.getElementById('login-email')?.value;
 const password = document.getElementById('login-password')?.value;
 const remember = document.getElementById('login-remember')?.checked;
 const errEl = document.getElementById('login-error');

 if (!email || !password) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">이메일과 비밀번호를 입력하세요.</div>';
 return;
 }

 const result = await AuthService.login(email, password);
  if (result.success) {
  if (remember) {
 const token = StorageService.get('authToken');
 if (token) {
 token.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
 StorageService.set('authToken', token);
 }
 }
  updateNavAuth();
  getNotifications(); updateBellBadge(); loadServerNotices();
  const loggedUser = AuthService.getCurrentUser();
  if (loggedUser && typeof RealtimeService !== 'undefined') RealtimeService.connect(loggedUser.id);
  Router.navigate('/');
  } else {
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
 }
}

async function handleRegister() {
 const name = document.getElementById('reg-name')?.value;
 const email = document.getElementById('reg-email')?.value;
 const password = document.getElementById('reg-password')?.value;
 const emailVerified = document.getElementById('reg-email-verified')?.value;

 if (!name || !email || !password) {
 const errEl = document.getElementById('register-error');
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">모든 필드를 입력하세요.</div>';
 return;
 }

 if (emailVerified !== 'true') {
 const errEl = document.getElementById('register-error');
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">이메일 인증을 완료해주세요.</div>';
 return;
 }

 const agreePrivacy = document.getElementById('reg-agree-privacy')?.checked;
 const agreeTerms = document.getElementById('reg-agree-terms')?.checked;
 if (!agreePrivacy || !agreeTerms) {
 const errEl = document.getElementById('register-error');
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">필수 동의항목에 모두 동의해주세요.</div>';
 return;
 }

 const result = await AuthService.register({ name, email, password });
 if (result.success) {
  updateNavAuth();
  const loggedUser = AuthService.getCurrentUser();
  if (loggedUser && typeof RealtimeService !== 'undefined') RealtimeService.connect(loggedUser.id);
  alert(' 회원가입을 축하해요!\n\n가입 축하 3,000 PAW 포인트가 지급되었어요!\n\n닉네임과 추천인 코드를 설정해주세요~');
  Router.navigate('/welcome-setup');
 } else {
 const errEl = document.getElementById('register-error');
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
 }
}

/**
 * 로그아웃 핸들러
 */
function handleLogout() {
  if (typeof RealtimeService !== 'undefined') RealtimeService.disconnect();
 AuthService.logout();
 window.location.replace('/auth/logout');
}

/**
 * 회원탈퇴 핸들러
 */
function handleDeleteAccount() {
 const user = AuthService.getCurrentUser();
 if (!user) return;

 const pawCoins = user.pawCoins || 0;

 // 탈퇴 확인 모달 표시
 const overlay = document.createElement('div');
 overlay.id = 'delete-modal-overlay';
 overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
 overlay.innerHTML = `
 <div style="background:#fff;border-radius:24px;padding:32px;max-width:400px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
 <div style="font-size:3rem;margin-bottom:12px;"></div>
 <h3 style="font-size:1.2rem;font-weight:900;margin-bottom:16px;color:#4A3728;">정말 탈퇴하시겠어요?</h3>
 <div style="background:#FFF0F0;border:2px solid #FFD4D4;border-radius:12px;padding:16px;margin-bottom:16px;text-align:left;">
 <p style="font-size:0.85rem;color:#D32F2F;font-weight:700;margin-bottom:8px;">탈퇴 시 아래 내용이 모두 삭제됩니다:</p>
 <ul style="font-size:0.82rem;color:#4A3728;padding-left:18px;line-height:1.8;">
 <li>보유 중인 <strong>${pawCoins} PAW 포인트</strong></li>
 <li>등록된 반려견 정보</li>
 <li>커뮤니티 활동 내역</li>
 <li>산책 매칭 기록</li>
 </ul>
 <p style="font-size:0.8rem;color:#D32F2F;margin-top:8px;font-weight:600;">삭제된 데이터는 복구할 수 없습니다.</p>
 </div>
 <label style="display:flex;align-items:center;gap:8px;margin-bottom:20px;cursor:pointer;justify-content:center;">
 <input type="checkbox" id="delete-agree-check" style="width:18px;height:18px;cursor:pointer;">
 <span style="font-size:0.85rem;font-weight:700;color:#4A3728;">위 내용을 확인했으며 탈퇴에 동의합니다</span>
 </label>
 <div style="display:flex;gap:10px;justify-content:center;">
 <button class="btn btn-secondary" onclick="document.getElementById('delete-modal-overlay').remove()">취소</button>
 <button class="btn btn-danger" id="delete-confirm-btn" onclick="executeDeleteAccount()" disabled style="opacity:0.5;">탈퇴하기</button>
 </div>
 </div>
 `;
 document.body.appendChild(overlay);

 // 체크박스 이벤트
 document.getElementById('delete-agree-check').addEventListener('change', function() {
 const btn = document.getElementById('delete-confirm-btn');
 btn.disabled = !this.checked;
 btn.style.opacity = this.checked ? '1' : '0.5';
 });
}

/**
 * 실제 탈퇴 실행
 */
async function executeDeleteAccount() {
 const user = AuthService.getCurrentUser();
 if (!user) return;

 // 모달 제거
 const overlay = document.getElementById('delete-modal-overlay');
 if (overlay) overlay.remove();

 // 서버 DB에서 삭제 (전화번호 포함 모든 데이터 제거 → 같은 번호로 재가입 가능)
 await fetch(`/api/users/${user.id}`, { method: 'DELETE' }).catch(() => {});

 // 로컬 스토리지에서 삭제
 const users = StorageService.get('users', []);
 StorageService.set('users', users.filter(u => u.id !== user.id));

 // 매칭 프로필 삭제
 if (typeof MatchingService !== 'undefined' && MatchingService.removeProfile) {
 MatchingService.removeProfile(user.id);
 }

 // 로컬 완전 로그아웃
 StorageService.remove('authToken');
 StorageService.remove('currentUser');

 // 탈퇴 완료 안내
 setTimeout(() => {
 alert('회원탈퇴가 완료되었어요.\n그동안 이용해주셔서 감사합니다 ');
 window.location.replace('/auth/logout');
 }, 100);
}

// ─── 본인인증 모달 시스템 ────────────────────────────────────────────────────

let _kycTimerInterval = null;
let _kycMethod = 'SMS';
let _kycCarrier = '';
let _kycSentPhone = '';
let _kycOnSuccessCallback = null;

const _KYC_CHECK_SVG = `<svg width="12" height="9" viewBox="0 0 12 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,4.5 4.5,8 11,1"/></svg>`;

/** 폼에 삽입되는 버튼+뱃지 (이메일 가입 / 소셜 가입 공용) */
function _phoneVerifyHtml() {
  return `
  <div style="border-top:1px solid var(--color-border-light);margin:20px 0 16px;padding-top:18px;">
    <p style="font-size:0.8rem;font-weight:700;color:var(--color-text);margin-bottom:10px;">
      📱 본인인증 <span style="color:var(--color-error);font-size:0.75rem;font-weight:500;">필수 — 중복 가입 방지용</span>
    </p>
    <button type="button" id="kyc-open-btn" onclick="openKycModal()"
      style="width:100%;padding:13px;border-radius:12px;border:2px solid var(--color-border);background:#fff;font-size:0.92rem;font-weight:700;color:var(--color-text);cursor:pointer;transition:all 0.15s;"
      onmouseenter="this.style.borderColor='var(--color-primary)';this.style.color='var(--color-primary-dark)'"
      onmouseleave="this.style.borderColor='var(--color-border)';this.style.color='var(--color-text)'">
      휴대폰 본인인증하기
    </button>
    <div id="kyc-verified-badge" style="display:none;margin-top:10px;padding:12px 16px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;align-items:center;gap:8px;">
      <span style="font-size:1.1rem;">✅</span>
      <div>
        <div style="font-size:0.85rem;font-weight:700;color:#15803d;" id="kyc-badge-name"></div>
        <div style="font-size:0.78rem;color:#166534;" id="kyc-badge-phone"></div>
      </div>
    </div>
    <input type="hidden" id="reg-phone-token" value="">
  </div>
  `;
}

/** 본인인증 모달 열기 */
function openKycModal() {
  if (document.getElementById('kyc-modal-overlay')) return;

  const mvnoList = ['KT엠모바일','SK세븐모바일','헬로모바일','U+알뜰모바일','LG헬로비전','에스원','프리텔레콤','아이즈모바일','기타 알뜰폰'];
  const mvnoOptions = mvnoList.map(m => `<option value="${m}">${m}</option>`).join('');

  const carriers = [
    { id:'SKT',  name:'SK텔레콤', abbr:'SKT',  iBg:'#FEE2E2', iFg:'#DC2626', sBg:'#FEF2F2', sBd:'#DC2626' },
    { id:'KT',   name:'KT',       abbr:'kt',   iBg:'#FFF7ED', iFg:'#EA580C', sBg:'#FFF7ED', sBd:'#EA580C' },
    { id:'LG',   name:'LG U+',    abbr:'U+',   iBg:'#FAE8FF', iFg:'#A21CAF', sBg:'#FAE8FF', sBd:'#A21CAF' },
    { id:'MVNO', name:'알뜰폰',   abbr:'알뜰', iBg:'#F1F5F9', iFg:'#475569', sBg:'#F8FAFC', sBd:'#64748b' }
  ];
  const carrierGrid = carriers.map(c => `
    <button type="button" id="kyc-carrier-${c.id}" onclick="kycSelectCarrier('${c.id}')"
      style="padding:18px 14px;border-radius:14px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;transition:all 0.15s;text-align:left;">
      <div id="kyc-cicon-${c.id}" style="width:42px;height:42px;border-radius:10px;background:${c.iBg};display:flex;align-items:center;justify-content:center;margin-bottom:10px;transition:all 0.15s;">
        <span id="kyc-cspan-${c.id}" style="font-size:${c.id==='KT'?'1rem':'0.74rem'};font-weight:900;color:${c.iFg};letter-spacing:-0.5px;${c.id==='KT'?'font-style:italic;':''}">${c.abbr}</span>
      </div>
      <div style="font-size:0.88rem;font-weight:700;color:#1a1a1a;">${c.name}</div>
    </button>`).join('');

  const otpBoxes = [0,1,2,3,4,5].map(() =>
    `<input type="text" inputmode="numeric" maxlength="1" class="kyc-otp-box"
      style="width:46px;height:56px;border-radius:12px;border:2px solid #e2e8f0;font-size:1.5rem;font-weight:800;text-align:center;color:#1a1a1a;outline:none;transition:all 0.15s;box-sizing:border-box;"
      oninput="kycOtpInput(this)" onkeydown="kycOtpKeydown(this,event)" onpaste="kycOtpPaste(event)"
      onfocus="this.style.borderColor='#1a1a1a';this.style.boxShadow='0 0 0 3px rgba(26,26,26,0.08)'"
      onblur="this.style.borderColor=this.value?'#1a1a1a':'#e2e8f0';this.style.boxShadow='none'">`
  ).join('');

  const overlay = document.createElement('div');
  overlay.id = 'kyc-modal-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn 0.15s;';
  overlay.innerHTML = `
  <div style="background:#fff;border-radius:24px 24px 0 0;width:100%;max-width:480px;padding-bottom:24px;max-height:92vh;overflow-y:auto;animation:slideUp 0.25s ease-out;">

    <!-- 헤더 -->
    <div style="position:sticky;top:0;background:#fff;border-radius:24px 24px 0 0;z-index:1;">
      <div style="position:relative;display:flex;align-items:center;justify-content:space-between;padding:20px 20px 16px;">
        <button id="kyc-back-btn" onclick="kycGoBack()"
          style="width:36px;height:36px;border-radius:50%;border:none;background:#f1f5f9;font-size:1.3rem;cursor:pointer;color:#374151;opacity:0;pointer-events:none;transition:opacity 0.2s;line-height:1;">‹</button>
        <div id="kyc-header-title" style="font-size:1rem;font-weight:800;color:#1a1a1a;position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;">휴대폰 본인인증</div>
        <button onclick="closeKycModal()" style="width:36px;height:36px;border-radius:50%;border:none;background:#f1f5f9;font-size:0.85rem;cursor:pointer;color:#64748b;">✕</button>
      </div>
      <div style="height:1px;background:#f1f5f9;"></div>
    </div>

    <div style="padding:20px 20px 0;">

      <!-- ── STEP 1: 통신사 선택 ── -->
      <div id="kyc-step-carrier">
        <p style="font-size:0.85rem;color:#64748b;text-align:center;margin:0 0 18px;">이용 중인 통신사를 선택해 주세요</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">${carrierGrid}</div>
        <div id="kyc-mvno-wrap" style="display:none;margin-bottom:14px;">
          <select id="kyc-mvno-select" class="form-input" style="width:100%;">
            <option value="">알뜰폰 통신사 선택</option>${mvnoOptions}
          </select>
        </div>
        <div id="kyc-carrier-error" style="min-height:0;margin-bottom:8px;"></div>

        <!-- 약관 동의 -->
        <div style="border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:18px;">
          <div onclick="kycToggleAllNew()" style="padding:14px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
            <div id="kyc-all-check" data-on="0" style="width:22px;height:22px;border-radius:6px;border:2px solid #d1d5db;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;color:#fff;"></div>
            <span style="font-size:0.9rem;font-weight:700;color:#1a1a1a;">전체 동의하기</span>
          </div>
          ${['[필수] 개인정보 수집·이용 동의','[필수] 고유식별정보 처리 동의','[필수] 통신사 서비스 이용약관 동의'].map((t,i,a) => `
          <div onclick="kycToggleItem(this)" style="padding:12px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;${i<a.length-1?'border-bottom:1px solid #f8fafc;':''}">
            <div class="kyc-chk" data-on="0" style="width:20px;height:20px;border-radius:5px;border:1.5px solid #d1d5db;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;color:#fff;"></div>
            <span style="font-size:0.8rem;color:#374151;">${t}</span>
          </div>`).join('')}
        </div>

        <!-- 두 액션 버튼 -->
        <div style="display:flex;flex-direction:column;gap:10px;padding-bottom:4px;">
          <button type="button" onclick="kycChooseMethod('PASS')"
            style="width:100%;padding:16px;border-radius:14px;border:none;background:#1a1a1a;color:#fff;font-size:0.95rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.15s;"
            onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
            <span style="background:#fff;color:#1a1a1a;font-size:0.68rem;font-weight:900;padding:2px 7px;border-radius:4px;letter-spacing:0.5px;">PASS</span>
            PASS 앱으로 인증하기
          </button>
          <button type="button" onclick="kycChooseMethod('SMS')"
            style="width:100%;padding:16px;border-radius:14px;border:1.5px solid #d1d5db;background:#fff;color:#374151;font-size:0.95rem;font-weight:700;cursor:pointer;transition:background 0.15s;"
            onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background='#fff'">
            문자(SMS)로 인증하기
          </button>
        </div>
      </div>

      <!-- ── STEP 2: 정보 입력 ── -->
      <div id="kyc-step-info" style="display:none;">
        <p style="font-size:0.85rem;color:#64748b;text-align:center;margin:0 0 18px;">본인 정보를 입력해 주세요</p>
        <div id="kyc-info-error" style="min-height:0;margin-bottom:10px;"></div>
        <div style="margin-bottom:14px;">
          <label style="font-size:0.8rem;font-weight:700;color:#374151;display:block;margin-bottom:6px;">이름</label>
          <input id="kyc-name" type="text" placeholder="실명 입력" class="form-input" style="width:100%;">
        </div>
        <div style="margin-bottom:14px;">
          <label style="font-size:0.8rem;font-weight:700;color:#374151;display:block;margin-bottom:6px;">생년월일 <span style="font-weight:400;color:#94a3b8;">6자리 (예: 990101)</span></label>
          <input id="kyc-birth" type="text" placeholder="990101" maxlength="6" class="form-input"
            oninput="this.value=this.value.replace(/[^0-9]/g,'')" style="width:100%;letter-spacing:4px;">
        </div>
        <div style="margin-bottom:22px;">
          <label style="font-size:0.8rem;font-weight:700;color:#374151;display:block;margin-bottom:6px;">휴대폰 번호</label>
          <input id="kyc-phone" type="tel" placeholder="010-0000-0000" class="form-input"
            oninput="this.value=this.value.replace(/[^0-9]/g,'').replace(/^(01[016789])([0-9]{3,4})([0-9]{4})$/,'$1-$2-$3')"
            style="width:100%;">
        </div>
        <button id="kyc-info-btn" type="button" onclick="kycSubmitInfo()"
          style="width:100%;padding:16px;border-radius:14px;border:none;background:#1a1a1a;color:#fff;font-size:0.95rem;font-weight:700;cursor:pointer;transition:opacity 0.15s;margin-bottom:10px;"
          onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
          인증번호 받기
        </button>
      </div>

      <!-- ── STEP 3a: PASS 대기 ── -->
      <div id="kyc-step-pass" style="display:none;text-align:center;padding:12px 0 20px;">
        <div style="position:relative;width:90px;height:90px;margin:0 auto 22px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:#e5e7eb;animation:kycPulse 2s ease-in-out infinite;"></div>
          <div style="position:absolute;inset:10px;border-radius:50%;background:#d1d5db;animation:kycPulse 2s ease-in-out infinite 0.4s;"></div>
          <div style="position:absolute;inset:20px;border-radius:50%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:0.58rem;font-weight:900;color:#fff;letter-spacing:0.5px;">PASS</span>
          </div>
        </div>
        <div style="font-size:1rem;font-weight:800;color:#1a1a1a;margin-bottom:8px;">PASS 앱에서 인증을 완료해 주세요</div>
        <div style="font-size:0.82rem;color:#64748b;margin-bottom:22px;line-height:1.6;">PASS 앱 알림을 확인하고<br>인증 버튼을 눌러주세요</div>
        <div style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:20px;background:#f8fafc;font-size:0.82rem;color:#64748b;margin-bottom:6px;">
          <div style="width:14px;height:14px;border:2px solid #d1d5db;border-top-color:#64748b;border-radius:50%;animation:spin 0.9s linear infinite;"></div>
          인증 대기 중...
        </div>
        <div id="kyc-pass-timer" style="font-size:0.75rem;color:#94a3b8;margin-bottom:24px;min-height:18px;"></div>
        <button type="button" onclick="kycRetry()" style="padding:11px 28px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:0.83rem;color:#64748b;cursor:pointer;">다시 시도</button>
      </div>

      <!-- ── STEP 3b: SMS OTP ── -->
      <div id="kyc-step-sms" style="display:none;padding-bottom:8px;">
        <div style="text-align:center;margin-bottom:22px;">
          <div style="width:58px;height:58px;border-radius:50%;background:#f8fafc;border:2px solid #e2e8f0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 12px;">💬</div>
          <div style="font-size:0.95rem;font-weight:800;color:#1a1a1a;margin-bottom:6px;">인증번호를 입력해 주세요</div>
          <div id="kyc-sms-desc" style="font-size:0.82rem;color:#64748b;line-height:1.5;"></div>
        </div>
        <div id="kyc-sms-error" style="min-height:0;margin-bottom:10px;"></div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px;">${otpBoxes}</div>
        <input type="hidden" id="kyc-otp-input">
        <div id="kyc-sms-timer" style="font-size:0.78rem;color:#ef4444;text-align:center;margin-bottom:18px;min-height:18px;"></div>
        <button type="button" onclick="kycVerifySms()"
          style="width:100%;padding:16px;border-radius:14px;border:none;background:#1a1a1a;color:#fff;font-size:0.95rem;font-weight:700;cursor:pointer;transition:opacity 0.15s;margin-bottom:10px;"
          onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
          인증번호 확인
        </button>
        <button type="button" onclick="kycRetry()" style="width:100%;padding:13px;border-radius:14px;border:1.5px solid #e2e8f0;background:#fff;font-size:0.88rem;color:#64748b;cursor:pointer;">
          다시 시도
        </button>
      </div>

      <!-- ── STEP 4: 완료 ── -->
      <div id="kyc-step-success" style="display:none;text-align:center;padding:24px 0 16px;">
        <div style="width:80px;height:80px;border-radius:50%;background:#f0fdf4;border:3px solid #86efac;display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin:0 auto 20px;animation:kycBounce 0.4s ease-out;">✅</div>
        <div style="font-size:1.1rem;font-weight:800;color:#15803d;margin-bottom:6px;">본인인증 완료!</div>
        <div id="kyc-success-info" style="font-size:0.88rem;color:#166534;margin-bottom:28px;"></div>
        <button type="button" onclick="closeKycModal()"
          style="width:100%;padding:15px;border-radius:14px;border:none;background:var(--color-primary);color:#fff;font-size:0.97rem;font-weight:800;cursor:pointer;">
          확인
        </button>
      </div>

    </div>
  </div>
  <style>
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{transform:translateY(60px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes kycPulse  { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.1);opacity:.15} }
    @keyframes kycBounce { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
  </style>
  `;
  document.body.appendChild(overlay);
  _kycMethod = 'SMS';
  _kycCarrier = '';
}

function closeKycModal() {
  if (_kycTimerInterval) clearInterval(_kycTimerInterval);
  const el = document.getElementById('kyc-modal-overlay');
  if (el) el.remove();
}

/** 헤더 뒤로가기: 정보입력 → 통신사 선택 */
function kycGoBack() {
  if (_kycTimerInterval) clearInterval(_kycTimerInterval);
  ['kyc-step-info','kyc-step-pass','kyc-step-sms'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('kyc-step-carrier').style.display = 'block';
  const bb = document.getElementById('kyc-back-btn');
  bb.style.opacity = '0'; bb.style.pointerEvents = 'none';
  document.getElementById('kyc-header-title').textContent = '휴대폰 본인인증';
}

/** 다시 시도: PASS/SMS 대기 → 정보 입력 */
function kycRetry() {
  if (_kycTimerInterval) clearInterval(_kycTimerInterval);
  document.getElementById('kyc-step-pass').style.display = 'none';
  document.getElementById('kyc-step-sms').style.display = 'none';
  document.getElementById('kyc-step-info').style.display = 'block';
  document.getElementById('kyc-header-title').textContent = _kycMethod === 'PASS' ? 'PASS 앱 인증' : 'SMS 인증';
}

function kycSelectCarrier(id) {
  _kycCarrier = id;
  const def = { SKT:['#FEE2E2','#DC2626'], KT:['#FFF7ED','#EA580C'], LG:['#FAE8FF','#A21CAF'], MVNO:['#F1F5F9','#475569'] };
  const sel = { SKT:['#FEF2F2','#DC2626'], KT:['#FFF7ED','#EA580C'], LG:['#FAE8FF','#A21CAF'], MVNO:['#F8FAFC','#64748b'] };
  ['SKT','KT','LG','MVNO'].forEach(c => {
    const btn  = document.getElementById('kyc-carrier-' + c);
    const icon = document.getElementById('kyc-cicon-' + c);
    const span = document.getElementById('kyc-cspan-' + c);
    if (!btn) return;
    if (c === id) {
      btn.style.borderColor = sel[c][1]; btn.style.background = sel[c][0];
      icon.style.background = sel[c][1]; span.style.color = '#fff';
    } else {
      btn.style.borderColor = '#e2e8f0'; btn.style.background = '#fff';
      icon.style.background = def[c][0]; span.style.color = def[c][1];
    }
  });
  document.getElementById('kyc-mvno-wrap').style.display = id === 'MVNO' ? 'block' : 'none';
}

function _kycSetCheck(el, on) {
  el.dataset.on = on ? '1' : '0';
  el.style.background = on ? 'var(--color-primary,#4F46E5)' : '#fff';
  el.style.borderColor = on ? 'var(--color-primary,#4F46E5)' : '#d1d5db';
  el.style.color = '#fff';
  el.innerHTML = on ? _KYC_CHECK_SVG : '';
}

function kycToggleItem(row) {
  const box = row.querySelector('.kyc-chk');
  if (!box) return;
  _kycSetCheck(box, box.dataset.on !== '1');
  const allOn = [...document.querySelectorAll('.kyc-chk')].every(b => b.dataset.on === '1');
  const allBox = document.getElementById('kyc-all-check');
  if (allBox) _kycSetCheck(allBox, allOn);
}

function kycToggleAllNew() {
  const allBox = document.getElementById('kyc-all-check');
  const newState = allBox.dataset.on !== '1';
  _kycSetCheck(allBox, newState);
  document.querySelectorAll('.kyc-chk').forEach(b => _kycSetCheck(b, newState));
}

function kycChooseMethod(method) {
  const errEl = document.getElementById('kyc-carrier-error');
  if (!_kycCarrier) {
    errEl.innerHTML = '<div class="alert alert-error">통신사를 먼저 선택해 주세요.</div>'; return;
  }
  if (![...document.querySelectorAll('.kyc-chk')].every(b => b.dataset.on === '1')) {
    errEl.innerHTML = '<div class="alert alert-error">필수 약관에 모두 동의해 주세요.</div>'; return;
  }
  errEl.innerHTML = '';
  _kycMethod = method;
  document.getElementById('kyc-step-carrier').style.display = 'none';
  document.getElementById('kyc-step-info').style.display = 'block';
  const bb = document.getElementById('kyc-back-btn');
  bb.style.opacity = '1'; bb.style.pointerEvents = 'auto';
  document.getElementById('kyc-header-title').textContent = method === 'PASS' ? 'PASS 앱 인증' : 'SMS 인증';
  const btn = document.getElementById('kyc-info-btn');
  if (btn) btn.textContent = method === 'PASS' ? 'PASS 앱으로 인증하기' : '인증번호 받기';
  setTimeout(() => document.getElementById('kyc-name')?.focus(), 100);
}

async function kycSubmitInfo() {
  const name  = document.getElementById('kyc-name')?.value?.trim();
  const birth = document.getElementById('kyc-birth')?.value?.trim();
  const phone = document.getElementById('kyc-phone')?.value?.trim();
  const errEl = document.getElementById('kyc-info-error');
  if (!name)  { errEl.innerHTML = '<div class="alert alert-error">이름을 입력해 주세요.</div>'; return; }
  if (!birth || birth.length !== 6) { errEl.innerHTML = '<div class="alert alert-error">생년월일 6자리를 입력해 주세요.</div>'; return; }
  if (!phone || phone.replace(/[^0-9]/g,'').length < 10) { errEl.innerHTML = '<div class="alert alert-error">올바른 휴대폰 번호를 입력해 주세요.</div>'; return; }
  errEl.innerHTML = '';
  _kycSentPhone = phone;
  if (_kycMethod === 'PASS') await _kycPassFlow(name, phone);
  else await _kycSmsFlow(name, phone);
}

function kycOtpInput(el) {
  el.value = el.value.replace(/[^0-9]/g,'');
  const boxes = [...document.querySelectorAll('.kyc-otp-box')];
  const idx = boxes.indexOf(el);
  if (el.value && idx < boxes.length - 1) boxes[idx + 1].focus();
  const hidden = document.getElementById('kyc-otp-input');
  if (hidden) hidden.value = boxes.map(b => b.value).join('');
}

function kycOtpKeydown(el, e) {
  if (e.key === 'Backspace' && !el.value) {
    const boxes = [...document.querySelectorAll('.kyc-otp-box')];
    const idx = boxes.indexOf(el);
    if (idx > 0) { boxes[idx - 1].value = ''; boxes[idx - 1].focus(); }
  }
}

function kycOtpPaste(e) {
  const text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g,'').slice(0,6);
  if (!text) return;
  e.preventDefault();
  const boxes = [...document.querySelectorAll('.kyc-otp-box')];
  text.split('').forEach((d,i) => { if (boxes[i]) boxes[i].value = d; });
  const hidden = document.getElementById('kyc-otp-input');
  if (hidden) hidden.value = text;
  boxes[Math.min(text.length, 5)].focus();
}

/** PASS 인증 플로우 (실제 연동 전: 자동 완료 모킹) */
async function _kycPassFlow(name, phone) {
  document.getElementById('kyc-step-info').style.display = 'none';
  document.getElementById('kyc-step-pass').style.display = 'block';
  document.getElementById('kyc-header-title').textContent = 'PASS 앱 인증';

  let phoneToken = null;
  try {
    const sendRes = await fetch('/api/phone/send-otp', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ phone })
    });
    const sendData = await sendRes.json();
    if (!sendData.success) {
      kycRetry();
      document.getElementById('kyc-info-error').innerHTML = `<div class="alert alert-error">${sendData.error}</div>`;
      return;
    }
    if (sendData.testMode) {
      const verRes = await fetch('/api/phone/verify-otp', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ phone, code: sendData.testCode })
      });
      const verData = await verRes.json();
      if (verData.success) phoneToken = verData.phoneToken;
    }
  } catch(e) {
    kycRetry();
    document.getElementById('kyc-info-error').innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
    return;
  }

  let t = 30;
  const timerEl = document.getElementById('kyc-pass-timer');
  if (_kycTimerInterval) clearInterval(_kycTimerInterval);
  _kycTimerInterval = setInterval(() => {
    if (timerEl) timerEl.textContent = `남은 시간 ${t}초`;
    t--;
    if (t < 0) clearInterval(_kycTimerInterval);
  }, 1000);

  await new Promise(r => setTimeout(r, 2500));
  if (_kycTimerInterval) clearInterval(_kycTimerInterval);
  document.getElementById('kyc-step-pass').style.display = 'none';

  if (phoneToken) {
    _onKycSuccess(phoneToken, name, phone);
  } else {
    kycRetry();
    document.getElementById('kyc-info-error').innerHTML = '<div class="alert alert-error">인증에 실패했습니다. SMS 인증을 이용해 주세요.</div>';
  }
}

/** SMS 인증 플로우 */
async function _kycSmsFlow(name, phone) {
  try {
    const res = await fetch('/api/phone/send-otp', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (!data.success) {
      document.getElementById('kyc-info-error').innerHTML = `<div class="alert alert-error">${data.error}</div>`;
      return;
    }

    document.getElementById('kyc-step-info').style.display = 'none';
    document.getElementById('kyc-step-sms').style.display = 'block';
    document.getElementById('kyc-header-title').textContent = 'SMS 인증';

    const masked = phone.replace(/[^0-9]/g,'').replace(/^(01[016789])([0-9]{3,4})([0-9]{4})$/, '$1-****-$3');
    const desc = document.getElementById('kyc-sms-desc');
    if (data.testMode) {
      desc.innerHTML = `${masked}으로 발송<br><span style="color:var(--color-primary,#4F46E5);font-weight:700;">테스트 모드 — 인증번호: ${data.testCode}</span>`;
      setTimeout(() => {
        const code = data.testCode;
        const boxes = [...document.querySelectorAll('.kyc-otp-box')];
        code.split('').forEach((d, i) => { if (boxes[i]) boxes[i].value = d; });
        const hidden = document.getElementById('kyc-otp-input');
        if (hidden) hidden.value = code;
        boxes[5]?.focus();
      }, 400);
    } else {
      desc.textContent = `${masked}으로 발송된 인증번호를 입력해 주세요`;
    }
    _startKycTimer();
  } catch(e) {
    document.getElementById('kyc-info-error').innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
  }
}

/** SMS 인증번호 확인 */
async function kycVerifySms() {
  const code  = document.getElementById('kyc-otp-input')?.value?.trim();
  const errEl = document.getElementById('kyc-sms-error');
  if (!code || code.length !== 6) {
    errEl.innerHTML = '<div class="alert alert-error">6자리 인증번호를 입력해 주세요.</div>'; return;
  }
  const name = document.getElementById('kyc-name')?.value?.trim() || '';
  try {
    const res = await fetch('/api/phone/verify-otp', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ phone: _kycSentPhone, code })
    });
    const data = await res.json();
    if (data.success) {
      if (_kycTimerInterval) clearInterval(_kycTimerInterval);
      document.getElementById('kyc-step-sms').style.display = 'none';
      _onKycSuccess(data.phoneToken, name, _kycSentPhone);
    } else {
      errEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
    }
  } catch(e) {
    errEl.innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
  }
}

/** 인증 성공 처리 */
function _onKycSuccess(phoneToken, name, phone) {
  const normalized = phone.replace(/[^0-9]/g,'');
  const masked = normalized.replace(/^(01[016789])([0-9]{3,4})([0-9]{4})$/, '$1-****-$3');

  document.getElementById('kyc-step-success').style.display = 'block';
  document.getElementById('kyc-success-info').textContent = `${name || ''}  ${masked}`;
  document.getElementById('kyc-header-title').textContent = '인증 완료';
  const bb = document.getElementById('kyc-back-btn');
  if (bb) { bb.style.opacity = '0'; bb.style.pointerEvents = 'none'; }

  const tokenInput = document.getElementById('reg-phone-token');
  if (tokenInput) tokenInput.value = phoneToken;

  const badge = document.getElementById('kyc-verified-badge');
  if (badge) {
    badge.style.display = 'flex';
    const badgeName = document.getElementById('kyc-badge-name');
    const badgePhone = document.getElementById('kyc-badge-phone');
    if (badgeName) badgeName.textContent = `${name || ''} 본인인증 완료`;
    if (badgePhone) badgePhone.textContent = masked;
  }

  const openBtn = document.getElementById('kyc-open-btn');
  if (openBtn) {
    openBtn.textContent = '✅ 본인인증 완료 (재인증)';
    openBtn.style.borderColor = '#86efac';
    openBtn.style.color = '#15803d';
    openBtn.style.background = '#f0fdf4';
  }

  setTimeout(() => {
    closeKycModal();
    if (_kycOnSuccessCallback) {
      const cb = _kycOnSuccessCallback;
      _kycOnSuccessCallback = null;
      cb(phoneToken, phone);
    }
  }, 2000);
}

/** SMS 3분 타이머 */
function _startKycTimer() {
  if (_kycTimerInterval) clearInterval(_kycTimerInterval);
  let seconds = 180;
  const tick = () => {
    const el = document.getElementById('kyc-sms-timer');
    if (!el) { clearInterval(_kycTimerInterval); return; }
    if (seconds <= 0) {
      clearInterval(_kycTimerInterval);
      el.textContent = '⏰ 인증번호가 만료되었어요. 다시 시도해주세요.';
      return;
    }
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2,'0');
    el.textContent = `⏱ 유효시간 ${m}:${s}`;
    seconds--;
  };
  tick();
  _kycTimerInterval = setInterval(tick, 1000);
}
