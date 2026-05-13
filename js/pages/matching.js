// Pawsitive - Matching Page
function renderMatchingPage() {
  const user = AuthService.getCurrentUser();

  if (!user) {
    renderLoginPage();
    return;
  }

  const myProfile = MatchingService.getMyProfile(user.id);

  if (!myProfile) {
    renderMatchingRoleSelect(null);
    return;
  }

  if (myProfile.role === 'walker') {
    renderWalkerDashboard(user, myProfile);
  } else {
    MatchingService.refreshFromServer().then(() => renderRequesterDashboard(user, myProfile));
  }
}

/** 역할 선택 화면 */
function renderMatchingRoleSelect(selectedRole) {
  const walkerSel = selectedRole === 'walker';
  const reqSel = selectedRole === 'requester';

  renderPage(`
    <div class="page-header">
      <h1>산책 매칭</h1>
      <p>산책 도우미와 요청자를 연결해드려요.</p>
    </div>

    <div class="match-role-grid">
      <div class="match-role-card ${walkerSel ? 'match-role-card--selected' : ''}" onclick="openMatchRegisterFlow('walker')">
        ${walkerSel ? '<div class="match-role-card__badge">선택됨 ✓</div>' : ''}
        <div class="match-role-card__img-wrap">
          <img src="/images/dog_walker.png" alt="산책 도우미" class="match-role-card__img">
        </div>
        <div class="match-role-card__body">
          <h3 class="match-role-card__title">산책 도우미</h3>
          <p class="match-role-card__desc">다른 분의 반려견을<br>산책시켜 드려요</p>
        </div>
      </div>
      <div class="match-role-card ${reqSel ? 'match-role-card--selected' : ''}" onclick="openMatchRegisterFlow('requester')">
        ${reqSel ? '<div class="match-role-card__badge">선택됨 ✓</div>' : ''}
        <div class="match-role-card__img-wrap">
          <img src="/images/dog_owner.png" alt="산책 요청자" class="match-role-card__img">
        </div>
        <div class="match-role-card__body">
          <h3 class="match-role-card__title">산책 요청자</h3>
          <p class="match-role-card__desc">우리 아이 산책을<br>부탁하고 싶어요</p>
        </div>
      </div>
    </div>
    ${!selectedRole ? '<p class="match-role-hint">위 카드를 클릭해서 역할을 선택해주세요</p>' : ''}
  `);
}

// 토스 스타일 매칭 등록 플로우
let _matchRegStep = 0;
let _matchRegData = {};
let _matchRegRole = '';

const _matchWalkerSteps = [
  { key: 'location', question: '어디서 활동하세요?', sub: '동네 이름을 알려주세요', type: 'text', placeholder: '예: 서울 마포구 합정동', required: true },
  { key: 'preferredTime', question: '언제 산책 가능해요?', sub: '가능한 시간대를 골라주세요', type: 'cards', options: [
    { value: '오전 (7-9시)', label: '이른 아침', desc: '7~9시' },
    { value: '오전 (9-11시)', label: '오전', desc: '9~11시' },
    { value: '오후 (2-4시)', label: '오후', desc: '2~4시' },
    { value: '오후 (5-7시)', label: '늦은 오후', desc: '5~7시' },
    { value: '저녁 (7-9시)', label: '저녁', desc: '7~9시' },
    { value: '상시 가능', label: '상시', desc: '언제든' }
  ]},
  { key: 'experience', question: '반려견 경험이 있으세요?', sub: '없어도 괜찮아요', type: 'text', placeholder: '예: 반려견 2년 경력, 응급처치 자격', required: false },
  { key: 'canWalkLarge', question: '대형견도 산책 가능해요?', sub: '25kg 이상의 대형견 기준이에요', type: 'cards', options: [
    { value: 'yes', label: '가능해요', desc: '대형견 OK' },
    { value: 'no', label: '어려워요', desc: '소/중형견만' }
  ]},
  { key: 'canWalkMultiple', question: '여러 마리 동시 산책도 가능해요?', sub: '', type: 'cards', options: [
    { value: 'yes', label: '가능해요', desc: '2마리 이상 OK' },
    { value: 'no', label: '한 마리만', desc: '1마리만 가능' }
  ]},
  { key: 'message', question: '간단히 자기소개 해주세요', sub: '요청자가 참고할 수 있어요', type: 'textarea', placeholder: '산책 스타일, 성격 등을 자유롭게 적어주세요', required: true }
];

const _matchRequesterSteps = [
  { key: 'dogName', question: '반려견 이름이 뭐예요?', sub: '', type: 'text', placeholder: '예: 초코', required: true },
  { key: 'dogSize', question: '반려견 크기는요?', sub: '체중 기준으로 선택해주세요', type: 'cards', options: [
    { value: 'small', label: '소형', desc: '~10kg' },
    { value: 'medium', label: '중형', desc: '10~25kg' },
    { value: 'large', label: '대형', desc: '25kg~' }
  ]},
  { key: 'location', question: '어디서 산책하고 싶으세요?', sub: '동네 이름을 알려주세요', type: 'text', placeholder: '예: 서울 마포구 합정동', required: true },
  { key: 'preferredTime', question: '원하는 산책 시간은요?', sub: '', type: 'cards', options: [
    { value: '오전 (7-9시)', label: '이른 아침', desc: '7~9시' },
    { value: '오전 (9-11시)', label: '오전', desc: '9~11시' },
    { value: '오후 (2-4시)', label: '오후', desc: '2~4시' },
    { value: '오후 (5-7시)', label: '늦은 오후', desc: '5~7시' },
    { value: '저녁 (7-9시)', label: '저녁', desc: '7~9시' }
  ]},
  { key: 'notes', question: '요청사항이 있나요?', sub: '없으면 건너뛰어도 돼요', type: 'textarea', placeholder: '특별한 요청사항을 적어주세요', required: false }
];

function openMatchRegisterFlow(role) {
  _matchRegRole = role;
  _matchRegStep = 0;
  _matchRegData = {};

  const app = document.getElementById('app');
  app.innerHTML += `
    <div id="match-reg-modal" style="position:fixed; inset:0; z-index:5000; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:#fff; border-radius:20px; width:100%; max-width:420px; min-height:380px; padding:40px 32px; position:relative; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.15);">
          <button onclick="closeMatchRegisterFlow()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.2rem; color:#999; cursor:pointer;">✕</button>
          <div id="match-reg-progress" style="display:flex; gap:4px; margin-bottom:32px;"></div>
          <div id="match-reg-content" style="flex:1; display:flex; flex-direction:column;"></div>
        </div>
      </div>
    </div>
  `;
  renderMatchRegStep();
}

function closeMatchRegisterFlow() {
  const modal = document.getElementById('match-reg-modal');
  if (modal) modal.remove();
}

function _getMatchSteps() {
  return _matchRegRole === 'walker' ? _matchWalkerSteps : _matchRequesterSteps;
}

function renderMatchRegStep() {
  const steps = _getMatchSteps();
  const step = steps[_matchRegStep];
  const total = steps.length;
  const content = document.getElementById('match-reg-content');
  const progress = document.getElementById('match-reg-progress');

  progress.innerHTML = Array.from({length: total}, (_, i) =>
    `<div style="flex:1; height:3px; border-radius:2px; background:${i <= _matchRegStep ? '#1a1a1a' : '#e5e3e0'}; transition:background 0.3s;"></div>`
  ).join('');

  let inputHtml = '';
  if (step.type === 'text') {
    inputHtml = `<input type="text" id="match-reg-input" class="form-input" placeholder="${step.placeholder || ''}" value="${_matchRegData[step.key] || ''}" style="font-size:1.1rem; padding:14px 16px; border-radius:12px; margin-top:24px;" autofocus onkeydown="if(event.key==='Enter')nextMatchRegStep()">`;
  } else if (step.type === 'textarea') {
    inputHtml = `<textarea id="match-reg-input" class="form-input" placeholder="${step.placeholder || ''}" rows="3" style="font-size:1rem; padding:14px 16px; border-radius:12px; margin-top:24px; resize:none;">${_matchRegData[step.key] || ''}</textarea>`;
  } else if (step.type === 'cards') {
    inputHtml = `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:24px;">
      ${step.options.map(opt => `
        <button onclick="selectMatchRegCard('${step.key}','${opt.value}')" style="flex:1; min-width:90px; padding:16px 12px; border:1.5px solid ${_matchRegData[step.key] === opt.value ? '#1a1a1a' : '#e5e3e0'}; border-radius:14px; background:${_matchRegData[step.key] === opt.value ? '#f5f3f0' : '#fff'}; text-align:center; cursor:pointer; transition:all 0.15s;">
          <div style="font-size:0.92rem; font-weight:700; color:#1a1a1a;">${opt.label}</div>
          <div style="font-size:0.7rem; color:#999; margin-top:3px;">${opt.desc}</div>
        </button>
      `).join('')}
    </div>`;
  }

  const isLast = _matchRegStep === total - 1;
  const canSkip = !step.required;

  content.innerHTML = `
    <div style="flex:1;">
      <h2 style="font-size:1.4rem; font-weight:700; letter-spacing:-0.5px; line-height:1.3;">${step.question}</h2>
      ${step.sub ? `<p style="font-size:0.88rem; color:#999; margin-top:6px;">${step.sub}</p>` : ''}
      ${inputHtml}
    </div>
    <div style="display:flex; gap:8px; margin-top:24px;">
      ${_matchRegStep > 0 ? `<button onclick="prevMatchRegStep()" style="flex:1; padding:14px; border:1.5px solid #e5e3e0; border-radius:12px; background:#fff; font-size:0.9rem; font-weight:600; cursor:pointer;">이전</button>` : ''}
      ${canSkip ? `<button onclick="skipMatchRegStep()" style="flex:1; padding:14px; border:1.5px solid #e5e3e0; border-radius:12px; background:#fff; font-size:0.9rem; font-weight:600; color:#999; cursor:pointer;">건너뛰기</button>` : ''}
      <button onclick="${isLast ? 'finishMatchRegister()' : 'nextMatchRegStep()'}" style="flex:2; padding:14px; border:none; border-radius:12px; background:#1a1a1a; color:#fff; font-size:0.9rem; font-weight:700; cursor:pointer; transition:opacity 0.15s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${isLast ? '등록 완료' : '다음'}</button>
    </div>
  `;
  setTimeout(() => document.getElementById('match-reg-input')?.focus(), 100);
}

function selectMatchRegCard(key, value) {
  _matchRegData[key] = value;
  renderMatchRegStep();
  setTimeout(() => nextMatchRegStep(), 300);
}

function nextMatchRegStep() {
  const steps = _getMatchSteps();
  const step = steps[_matchRegStep];
  const input = document.getElementById('match-reg-input');
  if (input) _matchRegData[step.key] = input.value.trim();
  if (step.required && !_matchRegData[step.key]) { if(input) input.style.borderColor='#e53e3e'; return; }
  if (_matchRegStep < steps.length - 1) { _matchRegStep++; renderMatchRegStep(); }
}

function prevMatchRegStep() {
  if (_matchRegStep > 0) { _matchRegStep--; renderMatchRegStep(); }
}

function skipMatchRegStep() {
  const steps = _getMatchSteps();
  _matchRegData[steps[_matchRegStep].key] = '';
  if (_matchRegStep < steps.length - 1) { _matchRegStep++; renderMatchRegStep(); }
  else finishMatchRegister();
}

function finishMatchRegister() {
  const steps = _getMatchSteps();
  const input = document.getElementById('match-reg-input');
  if (input) _matchRegData[steps[_matchRegStep].key] = input.value.trim();

  const user = AuthService.getCurrentUser();
  if (!user) return;

  if (_matchRegRole === 'walker') {
    handleRegisterMatchProfile('walker', {
      location: _matchRegData.location,
      preferredTime: _matchRegData.preferredTime,
      experience: _matchRegData.experience || '',
      message: _matchRegData.message || '',
      canWalkLarge: _matchRegData.canWalkLarge === 'yes',
      canWalkMultiple: _matchRegData.canWalkMultiple === 'yes'
    });
  } else {
    handleRegisterMatchProfile('requester', {
      dogName: _matchRegData.dogName,
      dogSize: _matchRegData.dogSize,
      location: _matchRegData.location,
      preferredTime: _matchRegData.preferredTime,
      notes: _matchRegData.notes || ''
    });
  }
  closeMatchRegisterFlow();
}

function renderMatchingRoleSelectStatic(role) { renderMatchingRoleSelect(role); }

/** 매칭 프로필 등록 핸들러 */
function handleRegisterMatchProfile(role, flowData) {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  let location, preferredTime, message, extra;

  if (flowData) {
    // 토스 스타일 플로우에서 전달받은 데이터
    location = flowData.location;
    preferredTime = flowData.preferredTime;
    message = flowData.message || '';
    if (role === 'walker') {
      extra = { experience: flowData.experience || '', canWalkLarge: flowData.canWalkLarge || false, canWalkMultiple: flowData.canWalkMultiple || false };
    } else {
      extra = { dogName: flowData.dogName, dogSize: flowData.dogSize, notes: flowData.notes || '' };
    }
  } else {
    // 기존 DOM 방식 (폴백)
    location = document.getElementById('match-location')?.value;
    preferredTime = document.getElementById('match-time')?.value;
    message = document.getElementById('match-message')?.value || '';
    const errEl = document.getElementById('match-register-error');

    if (!location || !location.trim()) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-error">활동 지역을 입력해주세요.</div>'; return;
    }
    if (!preferredTime) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-error">시간대를 선택해주세요.</div>'; return;
    }

    if (role === 'walker') {
      extra = {
        experience: document.getElementById('match-experience')?.value || '',
        canWalkLarge: document.getElementById('match-large-dog')?.checked || false,
        canWalkMultiple: document.getElementById('match-multi-dog')?.checked || false,
      };
    } else {
      const dogName = document.getElementById('match-dog-name')?.value;
      const dogSize = document.getElementById('match-dog-size')?.value;
      extra = { dogName: dogName?.trim(), dogSize, notes: document.getElementById('match-notes')?.value || '' };
    }
  }

  MatchingService.registerProfile(user.id, { role, location: location.trim(), preferredTime, message: message.trim(), isAvailable: true, ...extra });
  refreshDrawer();
  renderMatchingPage();
}

// 도우미 폴링 인터벌 관리
let _walkerPollInterval = null;
let _walkerLastRequestIds = new Set();

function startWalkerPolling(userId) {
  stopWalkerPolling();
  _walkerPollInterval = setInterval(async () => {
    try {
      const requests = await MatchingService.getReceivedRequestsRemote(userId);
      const pending  = requests.filter(r => r.status === 'pending');
      const newOnes  = pending.filter(r => !_walkerLastRequestIds.has(r.id));
      if (newOnes.length > 0) {
        newOnes.forEach(r => _walkerLastRequestIds.add(r.id));
        showWalkerNotification(newOnes.length);
        const user = AuthService.getCurrentUser();
        const profile = MatchingService.getMyProfile(userId);
        if (user && profile) renderWalkerDashboard(user, profile);
      }
    } catch (e) { /* 네트워크 오류 무시 */ }
  }, 5000);
}

function stopWalkerPolling() {
  if (_walkerPollInterval) { clearInterval(_walkerPollInterval); _walkerPollInterval = null; }
}

function showWalkerNotification(count) {
  let notif = document.getElementById('walker-notif-popup');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'walker-notif-popup';
    notif.style.cssText = 'position:fixed;top:24px;right:24px;z-index:9999;background:#1A1A1A;color:#fff;padding:16px 20px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.25);font-size:0.9rem;font-weight:600;display:flex;align-items:center;gap:10px;animation:slideInRight 0.3s ease;max-width:280px;';
    document.body.appendChild(notif);
  }
  notif.innerHTML = `<span style="font-size:1.4rem;">🔔</span><div><div style="font-weight:700;">근처에서 산책 요청이 들어왔어요!</div><div style="font-size:0.78rem;opacity:0.8;margin-top:2px;">새 요청 ${count}건 · 지금 확인하세요</div></div>`;
  notif.style.display = 'flex';
  clearTimeout(notif._hideTimer);
  notif._hideTimer = setTimeout(() => { if (notif) notif.style.display = 'none'; }, 6000);
}

/** 산책 도우미 대시보드 */
async function renderWalkerDashboard(user, myProfile) {
  const receivedRequests = await MatchingService.getReceivedRequestsRemote(user.id);
  const scheduledWalks   = MatchingService.getScheduledWalks(user.id);
  const completedWalks   = MatchingService.getCompletedWalks(user.id);
  const isAvail          = myProfile.isAvailable;

  const statusBanner = `
    <div class="match-status-banner ${isAvail ? 'match-status-banner--on' : 'match-status-banner--off'}">
      <div class="match-status-banner__text">
        <div class="match-status-banner__main">${isAvail ? '현재 산책 요청을 받을 수 있어요.' : '현재 산책 요청을 받지 않고 있어요.'}</div>
        <div class="match-status-banner__sub">${isAvail ? '주변 산책 요청자에게 노출되고 있어요.' : '산책 요청자에게 노출되지 않습니다.'}</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
        <label class="dw-toggle">
          <input type="checkbox" id="match-avail-toggle" ${isAvail ? 'checked' : ''} onchange="handleToggleMatcherAvailability()">
          <span class="dw-toggle__track"></span>
        </label>
        <span class="dw-toggle__status">${isAvail ? '🟢 ON' : '⭕ OFF'}</span>
      </div>
    </div>
  `;

  const profileCard = `
    <div class="match-profile-card">
      <div class="match-profile-card__left">
        <div class="match-profile-card__avatar">${user.name.charAt(0)}</div>
        <div>
          <div class="match-profile-card__name">${user.name} <span class="badge badge-primary">산책 도우미</span></div>
          <div class="match-profile-card__meta">📍 ${myProfile.location} · ⏰ ${myProfile.preferredTime}${myProfile.experience ? ' · ' + myProfile.experience : ''}</div>
          ${myProfile.message ? `<div class="match-profile-card__bio">"${myProfile.message}"</div>` : ''}
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
            ${myProfile.canWalkLarge    ? '<span class="dw-size-tag">대형견 가능</span>' : ''}
            ${myProfile.canWalkMultiple ? '<span class="dw-size-tag">다중 산책 가능</span>' : ''}
          </div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="handleRemoveMatchProfile()">등록 해제</button>
    </div>
  `;

  const receivedHtml = receivedRequests.length > 0
    ? receivedRequests.map(r => {
        const fromName = MatchingService.getUserName(r.fromUserId);
        const rd = r.requestData || {};
        return `
          <div class="match-request-card ${r.status === 'accepted' ? 'match-request-card--accepted' : ''}">
            <div class="match-request-card__top">
              <div class="match-request-card__avatar">${fromName.charAt(0)}</div>
              <div class="match-request-card__info">
                <div class="match-request-card__from">${fromName}</div>
                <div class="match-request-card__detail">
                  ${rd.dogName ? `🐕 ${rd.dogName}` : ''}${rd.dogSize ? ` (${rd.dogSize === 'small' ? '소형' : rd.dogSize === 'medium' ? '중형' : '대형'})` : ''}
                  ${rd.desiredTime ? ` · ⏰ ${rd.desiredTime}` : ''}
                  ${rd.location ? ` · 📍 ${rd.location}` : ''}
                </div>
                ${rd.notes ? `<div class="match-request-card__notes">"${rd.notes}"</div>` : ''}
              </div>
            </div>
            ${r.status === 'pending' ? `
              <div class="match-request-card__alert">근처에서 산책 요청이 들어왔어요. 지금 수락하시겠어요?</div>
              <div style="display:flex; gap:8px; margin-top:10px;">
                <button class="btn btn-primary btn-sm" onclick="handleAcceptBroadcastRequest('${r.id}')">✅ 수락하기</button>
                <button class="btn btn-secondary btn-sm" onclick="handleRejectMatchRequest('${r.id}')">거절하기</button>
              </div>
            ` : r.status === 'accepted'
              ? '<div style="margin-top:8px;"><span class="badge badge-success">✓ 수락됨 · 매칭 완료</span></div>'
              : '<div style="margin-top:8px;"><span class="badge">처리됨</span></div>'}
          </div>`;
      }).join('')
    : `<div class="empty-state"><div class="empty-icon">📭</div><p>아직 받은 산책 요청이 없어요.<br>ON 상태를 유지하면 요청이 들어와요.</p></div>`;

  const scheduledHtml = scheduledWalks.map(s => {
    const pid = s.participants.find(id => id !== user.id) || s.participants[0];
    const pName = MatchingService.getUserName(pid);
    const date = new Date(s.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return `
      <div class="match-walk-card">
        <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
        <div class="match-walk-card__info"><div class="match-walk-card__name">${pName}</div><div>📅 ${date}</div></div>
        <button class="btn btn-primary btn-sm" onclick="handleCompleteWalk('${s.id}')">산책 완료</button>
      </div>`;
  }).join('');

  const completedHtml = completedWalks.map(s => {
    const pid = s.participants.find(id => id !== user.id) || s.participants[0];
    const pName = MatchingService.getUserName(pid);
    const reviewed = MatchingService.getReviewsForSchedule(s.id).some(r => r.reviewerId === user.id);
    return `
      <div class="match-walk-card match-walk-card--completed">
        <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
        <div class="match-walk-card__info"><div class="match-walk-card__name">${pName}</div><span class="badge badge-success">완료됨</span></div>
        ${reviewed ? '<span class="badge badge-success">리뷰 완료</span>' : `<button class="btn btn-secondary btn-sm" onclick="handleShowReviewForm('${s.id}','${pid}')">리뷰 작성</button>`}
      </div>`;
  }).join('');

  renderPage(`
    <div class="match-hero">
      <div class="section-label">산책 도우미</div>
      <h1 class="match-hero__title">산책 매칭 관리</h1>
      <p class="match-hero__sub">ON 상태에서만 주변 산책 요청자에게 노출돼요</p>
    </div>
    <div id="matching-alert"></div>
    ${statusBanner}
    ${profileCard}

    <!-- 직접 요청 목록 (새 API) -->
    <div class="match-section">
      <h2 class="match-section__title">📩 직접 산책 요청</h2>
      <div id="walker-new-requests-wrap"><div class="spinner" style="margin:20px auto;"></div></div>
    </div>

    <!-- 브로드캐스트 요청 (기존) -->
    <div class="match-section">
      <h2 class="match-section__title">📡 브로드캐스트 요청 <span class="dw-count">${receivedRequests.length}</span></h2>
      ${receivedHtml}
    </div>
    ${scheduledWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">🚶 예정된 산책</h2>${scheduledHtml}</div>` : ''}
    ${completedWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">✅ 완료된 산책</h2>${completedHtml}</div>` : ''}

    <!-- 직접 요청 산책 기록 -->
    <div class="match-section" id="direct-history-section" style="display:none;">
      <h2 class="match-section__title">📋 직접 요청 산책 기록</h2>
      <div id="walker-history-wrap"><div class="spinner" style="margin:20px auto;"></div></div>
    </div>
    <div id="review-form-container"></div>
  `);

  // 직접 요청 목록 비동기 로드
  renderWalkerRequestsList(user.id).then(html => {
    const el = document.getElementById('walker-new-requests-wrap');
    if (el) el.innerHTML = html;
  });

  // 직접 요청 산책 기록 비동기 로드
  renderDirectWalkHistory(user.id, 'walker').then(({ html, hasRecords }) => {
    const section = document.getElementById('direct-history-section');
    const wrap    = document.getElementById('walker-history-wrap');
    if (section && wrap) {
      if (hasRecords) { wrap.innerHTML = html; section.style.display = ''; }
      else section.style.display = 'none';
    }
  });

  // 폴링 시작 — 5초마다 새 요청 확인
  startWalkerPolling(user.id);
}

/** 산책 요청자 대시보드 */
async function renderRequesterDashboard(user, myProfile) {
  const availWalkers   = MatchingService.getAvailableWalkers().filter(w => w.userId !== user.id);
  const scheduledWalks = MatchingService.getScheduledWalks(user.id);
  const completedWalks = MatchingService.getCompletedWalks(user.id);

  const profileCard = `
    <div class="match-profile-card">
      <div class="match-profile-card__left">
        <div class="match-profile-card__avatar">${user.name.charAt(0)}</div>
        <div>
          <div class="match-profile-card__name">${user.name} <span class="badge badge-primary">산책 요청자</span></div>
          <div class="match-profile-card__meta">
            ${myProfile.dogName ? `🐕 ${myProfile.dogName} · ` : ''}📍 ${myProfile.location} · ⏰ ${myProfile.preferredTime || ''}
          </div>
          ${myProfile.notes ? `<div class="match-profile-card__bio">"${myProfile.notes}"</div>` : ''}
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="handleRemoveMatchProfile()">등록 해제</button>
    </div>
  `;

  const walkerListHtml = availWalkers.length > 0
    ? availWalkers.map(w => `
        <div class="match-walker-card">
          <div class="match-walker-card__avatar">${w.userName.charAt(0)}</div>
          <div class="match-walker-card__body">
            <div class="match-walker-card__name"><span class="dw-avail-dot dw-avail-dot--on"></span>${w.userName}</div>
            <div class="match-walker-card__meta">📍 ${w.location} · ⏰ ${w.preferredTime}</div>
            ${w.message ? `<div class="match-walker-card__bio">"${w.message}"</div>` : ''}
            <div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:5px;">
              ${w.canWalkLarge    ? '<span class="dw-size-tag">대형견 가능</span>' : ''}
              ${w.canWalkMultiple ? '<span class="dw-size-tag">다중 산책 가능</span>' : ''}
              ${w.experience      ? `<span class="dw-size-tag">${w.experience}</span>` : ''}
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="handleSendMatchRequest('${w.userId}')">요청 보내기</button>
        </div>`)
      .join('')
    : `<div class="empty-state"><div class="empty-icon">🔍</div><p>현재 주변에 산책 가능한 도우미가 없습니다.<br>잠시 후 다시 확인해 주세요.</p></div>`;

  const scheduledHtml = scheduledWalks.map(s => {
    const pid = s.participants.find(id => id !== user.id) || s.participants[0];
    const pName = MatchingService.getUserName(pid);
    const date = new Date(s.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return `
      <div class="match-walk-card">
        <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
        <div class="match-walk-card__info"><div class="match-walk-card__name">${pName}</div><div>📅 ${date}</div><span class="badge badge-info">예정됨</span></div>
        <button class="btn btn-primary btn-sm" onclick="handleCompleteWalk('${s.id}')">산책 완료</button>
      </div>`;
  }).join('');

  const completedHtml = completedWalks.map(s => {
    const pid = s.participants.find(id => id !== user.id) || s.participants[0];
    const pName = MatchingService.getUserName(pid);
    const reviewed = MatchingService.getReviewsForSchedule(s.id).some(r => r.reviewerId === user.id);
    return `
      <div class="match-walk-card match-walk-card--completed">
        <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
        <div class="match-walk-card__info"><div class="match-walk-card__name">${pName}</div><span class="badge badge-success">완료됨</span></div>
        ${reviewed ? '<span class="badge badge-success">리뷰 완료</span>' : `<button class="btn btn-secondary btn-sm" onclick="handleShowReviewForm('${s.id}','${pid}')">리뷰 작성</button>`}
      </div>`;
  }).join('');

  renderPage(`
    <div class="match-hero">
      <div class="section-label">산책 요청자</div>
      <h1 class="match-hero__title">산책 도우미를<br>찾고 있어요</h1>
      <p class="match-hero__sub">현재 산책 가능한 도우미 <strong>${availWalkers.length}명</strong>이 근처에 있어요</p>
    </div>
    <div id="matching-alert"></div>
    ${profileCard}

    <div class="match-broadcast-banner">
      <div>
        <div class="match-broadcast-banner__title">📣 주변 도우미에게 산책 요청 보내기</div>
        <div class="match-broadcast-banner__sub">ON 상태인 도우미 ${availWalkers.length}명에게 알림이 전송돼요. 가장 먼저 수락한 분과 매칭됩니다.</div>
      </div>
      <button class="btn btn-primary" onclick="handleBroadcastWalkRequest()" ${availWalkers.length === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>매칭 요청 보내기</button>
    </div>

    <div class="match-section">
      <h2 class="match-section__title">🚶‍♂️ 주변 산책 가능한 도우미 <span class="dw-count">${availWalkers.length}</span></h2>
      ${walkerListHtml}
    </div>
    ${scheduledWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">📅 예정된 산책</h2>${scheduledHtml}</div>` : ''}
    ${completedWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">✅ 완료된 산책</h2>${completedHtml}</div>` : ''}

    <!-- 직접 요청 산책 기록 -->
    <div class="match-section" id="direct-history-section" style="display:none;">
      <h2 class="match-section__title">📋 직접 요청 산책 기록</h2>
      <div id="requester-history-wrap"><div class="spinner" style="margin:20px auto;"></div></div>
    </div>
    <div id="review-form-container"></div>
  `);

  renderDirectWalkHistory(user.id, 'requester').then(({ html, hasRecords }) => {
    const section = document.getElementById('direct-history-section');
    const wrap    = document.getElementById('requester-history-wrap');
    if (section && wrap) {
      if (hasRecords) { wrap.innerHTML = html; section.style.display = ''; }
      else section.style.display = 'none';
    }
  });
}

/** 매칭 프로필 등록 해제 */
function handleRemoveMatchProfile() {
  if (!confirm('매칭 등록을 해제하시겠어요?')) return;
  const user = AuthService.getCurrentUser();
  if (!user) return;
  MatchingService.removeProfile(user.id);
  refreshDrawer();
  renderMatchingPage();
}

/** 도우미 가용 상태 토글 */
function handleToggleMatcherAvailability() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  MatchingService.toggleAvailability(user.id);
  renderMatchingPage();
}

/** 전체 브로드캐스트 요청 */
async function handleBroadcastWalkRequest() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  const myProfile = MatchingService.getMyProfile(user.id);
  if (!myProfile) return;

  const result = await MatchingService.broadcastWalkRequest(user.id, {
    dogName:     myProfile.dogName || '',
    dogSize:     myProfile.dogSize || '',
    location:    myProfile.location || '',
    desiredTime: myProfile.preferredTime || '',
    notes:       myProfile.notes || ''
  });

  const alertEl = document.getElementById('matching-alert');
  if (result.success) {
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-success">🎉 주변 도우미 ${result.targetCount}명에게 산책 요청을 보냈어요! 수락 대기 중...</div>`;
      setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 5000);
    }
  } else {
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
      setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 4000);
    }
  }
}

/** 브로드캐스트 요청 수락 (선착순 매칭) */
async function handleAcceptBroadcastRequest(requestId) {
  const result  = await MatchingService.acceptBroadcastRequest(requestId);
  const alertEl = document.getElementById('matching-alert');
  if (result.success) {
    stopWalkerPolling();
    if (alertEl) {
      alertEl.innerHTML = '<div class="alert alert-success">✅ 산책 요청을 수락했습니다. 매칭이 완료되었습니다!</div>';
      setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 4000);
    }
    renderMatchingPage();
  } else if (result.alreadyMatched) {
    if (alertEl) {
      alertEl.innerHTML = '<div class="alert alert-error">이미 다른 도우미와 매칭이 완료된 요청입니다.</div>';
      setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; renderMatchingPage(); }, 3000);
    }
  }
}

/** 요청 거절 */
async function handleRejectMatchRequest(requestId) {
  await MatchingService.rejectRequestRemote(requestId);
  renderMatchingPage();
}

/** 개별 요청 보내기 (요청자 → 특정 도우미) */
function handleSendMatchRequest(toUserId) {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }
  MatchingService.sendRequest(user.id, toUserId);
  const alertEl = document.getElementById('matching-alert');
  if (alertEl) {
    alertEl.innerHTML = '<div class="alert alert-success">매칭 요청을 보냈습니다! 🎉</div>';
    setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 3000);
  }
}

/** 산책 완료 */
function handleCompleteWalk(scheduleId) {
  MatchingService.completeWalk(scheduleId);
  renderMatchingPage();
  const alertEl = document.getElementById('matching-alert');
  if (alertEl) {
    alertEl.innerHTML = '<div class="alert alert-success">산책이 완료되었습니다! 🐾 10 Paw 코인이 적립되었습니다.</div>';
    setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 4000);
  }
}

/** 리뷰 작성 폼 */
function handleShowReviewForm(scheduleId, targetId) {
  const container = document.getElementById('review-form-container');
  if (!container) return;
  const targetName = MatchingService.getUserName(targetId);
  container.innerHTML = `
    <div class="card" style="padding:24px; margin-top:16px;">
      <h3 style="margin-bottom:16px;">📝 ${targetName}님에 대한 리뷰</h3>
      <div class="form-group">
        <label>평점</label>
        <div class="star-rating" id="review-stars">
          ${[1,2,3,4,5].map(n => `<span class="star" data-value="${n}" onclick="handleSelectStar(${n})">★</span>`).join('')}
        </div>
        <input type="hidden" id="review-rating" value="0">
      </div>
      <div class="form-group">
        <label for="review-text">후기</label>
        <textarea id="review-text" class="form-input" placeholder="산책 후기를 작성해주세요..."></textarea>
      </div>
      <div id="review-error"></div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary" onclick="handleSubmitReview('${scheduleId}','${targetId}')">리뷰 등록</button>
        <button class="btn btn-secondary" onclick="document.getElementById('review-form-container').innerHTML=''">취소</button>
      </div>
    </div>
  `;
}

/**
 * 별점 선택 핸들러
 * @param {number} value
 */
function handleSelectStar(value) {
  const ratingInput = document.getElementById('review-rating');
  if (ratingInput) ratingInput.value = value;

  document.querySelectorAll('#review-stars .star').forEach(star => {
    const starVal = parseInt(star.getAttribute('data-value'));
    star.classList.toggle('filled', starVal <= value);
  });
}

/**
 * 리뷰 제출 핸들러
 * @param {string} scheduleId
 * @param {string} targetId
 */
function handleSubmitReview(scheduleId, targetId) {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  const rating = parseInt(document.getElementById('review-rating')?.value || '0');
  const text = document.getElementById('review-text')?.value || '';
  const errEl = document.getElementById('review-error');

  if (rating < 1 || rating > 5) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">평점을 선택해주세요.</div>';
    return;
  }
  if (!text.trim()) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">후기를 작성해주세요.</div>';
    return;
  }

  MatchingService.addReview(scheduleId, {
    reviewerId: user.id,
    targetId: targetId,
    rating: rating,
    text: text.trim()
  });

  renderMatchingPage();
  const alertEl = document.getElementById('matching-alert');
  if (alertEl) {
    alertEl.innerHTML = '<div class="alert alert-success">리뷰가 등록되었습니다! 감사합니다 🐾</div>';
    setTimeout(() => { alertEl.innerHTML = ''; }, 3000);
  }
}
