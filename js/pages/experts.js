// Pawsitive - verified expert matching

const EXPERT_PAGE_CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'vet', label: '수의사' },
  { key: 'trainer', label: '훈련사' },
  { key: 'groomer', label: '미용사' }
];

const EXPERT_GUIDE = {
  vet: {
    label: '수의사',
    tone: 'medical',
    title: '수의사 면허 기반 심사',
    headline: '국가 면허와 동물병원 이력을 가장 엄격하게 확인해요.',
    required: ['수의사 면허증', '면허번호', '동물병원 재직증명 또는 개설 증빙'],
    issuers: ['농림축산식품부', '대한수의사회'],
    badge: '면허 확인'
  },
  trainer: {
    label: '훈련사',
    tone: 'training',
    title: '행동지도 자격 기반 심사',
    headline: '국가자격, KKC, KKF 계열 자격과 현장 경력을 함께 확인해요.',
    required: ['반려동물행동지도사 국가자격', 'KKC 반려견지도사', 'KKF 훈련사/핸들러', '경력증명 또는 포트폴리오'],
    issuers: ['농림축산식품부', 'KKC 한국애견협회', 'KKF 한국애견연맹'],
    badge: '행동지도 검증'
  },
  groomer: {
    label: '미용사',
    tone: 'grooming',
    title: '미용 자격/포트폴리오 심사',
    headline: 'KKC 반려견스타일리스트, KKF/FCI 계열 미용 인증과 작업 사례를 확인해요.',
    required: ['KKC 반려견스타일리스트', 'KKF 애견미용사', 'FCI/KKF 미용 인증', '미용 포트폴리오'],
    issuers: ['KKC 한국애견협회', 'KKF 한국애견연맹', 'FCI'],
    badge: '미용 검증'
  }
};

const EXPERT_AVATAR_IMAGES = {
  '윤서진': '/images/experts/yoon-seojin.png',
  '강도윤': '/images/experts/kang-doyoon.png',
  '정유민': '/images/experts/jung-yumin.png'
};

let _expertsPageCategory = 'all';
let _expertsPageSessionTab = 'active';
let _expertsPageActiveConsultationId = null;
let _expertsPageProfiles = [];
let _expertsPageConsultations = [];
let _expertsPageApplications = [];
let _expertsPageMeta = null;
let _expertsPagePendingAttachments = {};
let _expertsPageFocusChatAfterRender = false;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function getExpertAvatarImage(name) {
  return EXPERT_AVATAR_IMAGES[String(name || '').trim()] || '';
}

function renderExpertAvatar({ name, avatar, category, className = '', usePhoto = true } = {}) {
  const src = usePhoto ? getExpertAvatarImage(name) : '';
  const classes = ['expert-avatar', category ? `expert-avatar--${category}` : '', src ? 'expert-avatar--image' : '', className]
    .filter(Boolean)
    .join(' ');
  const fallback = escapeHtml(avatar || String(name || '전').charAt(0) || '전');
  return `<div class="${escapeAttr(classes)}">${src ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(name || '전문가 프로필')}">` : fallback}</div>`;
}

function formatWon(value) {
  return Number(value || 0).toLocaleString('ko-KR') + '원';
}

function getExpertCategoryLabel(category) {
  return (EXPERT_GUIDE[category] && EXPERT_GUIDE[category].label) || '전문가';
}

function getExpertStatusLabel(status) {
  const labels = {
    pending: '심사 대기',
    approved: '승인',
    rejected: '불합격',
    requested: '상담 신청',
    accepted: '상담 진행',
    declined: '진행 불가',
    completed: '상담 완료'
  };
  return labels[status] || status || '-';
}

function isExpertConsultationActive(consultation) {
  return consultation && ['requested', 'accepted'].includes(consultation.status);
}

function getCurrentExpertProfile(user) {
  if (!user) return null;
  return _expertsPageProfiles.find(p => p.userId === user.id && p.status === 'approved') || null;
}

async function expertFetch(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || '요청 처리에 실패했습니다.');
  }
  return data;
}

async function loadExpertPageData(user) {
  const consultationUrl = user ? `/api/experts/consultations?userId=${encodeURIComponent(user.id)}` : null;
  const appUrl = user ? `/api/experts/applications?userId=${encodeURIComponent(user.id)}` : null;
  const [meta, profiles, consultations, applications] = await Promise.all([
    expertFetch('/api/experts/meta').catch(() => ({ categories: {}, mockAccounts: [] })),
    expertFetch('/api/experts/profiles').catch(() => ({ profiles: [] })),
    consultationUrl ? expertFetch(consultationUrl).catch(() => ({ consultations: [] })) : Promise.resolve({ consultations: [] }),
    appUrl ? expertFetch(appUrl).catch(() => ({ applications: [] })) : Promise.resolve({ applications: [] })
  ]);
  _expertsPageMeta = meta;
  _expertsPageProfiles = profiles.profiles || [];
  _expertsPageConsultations = consultations.consultations || [];
  _expertsPageApplications = applications.applications || [];
}

async function renderExpertsPage() {
  const user = AuthService.getCurrentUser();
  renderPage(`
    <div style="padding:80px 20px;text-align:center;">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-text-muted);font-weight:700;">전문가 매칭을 준비하고 있어요...</p>
    </div>
  `);

  await loadExpertPageData(user);

  const expertProfile = getCurrentExpertProfile(user);
  const requesterConsultations = user ? _expertsPageConsultations.filter(c => c.requesterId === user.id) : [];
  const expertConsultations = user && expertProfile ? _expertsPageConsultations.filter(c => c.expertUserId === user.id) : [];
  const activeConsultation = _expertsPageActiveConsultationId
    ? _expertsPageConsultations.find(c => c.id === _expertsPageActiveConsultationId)
    : null;
  const visibleExperts = _expertsPageCategory === 'all'
    ? _expertsPageProfiles
    : _expertsPageProfiles.filter(expert => expert.category === _expertsPageCategory);
  const activeCategory = EXPERT_PAGE_CATEGORIES.find(cat => cat.key === _expertsPageCategory) || EXPERT_PAGE_CATEGORIES[0];

  renderPage(`
  <div class="experts-page experts-page--verified">
    <section class="experts-hero experts-hero--verified">
      <div class="experts-hero__content">
        <span class="experts-hero__eyebrow">Verified Expert Care</span>
        <h1 class="experts-hero__title">면허와 자격을 확인한 전문가에게 상담을 신청해요</h1>
        <p class="experts-hero__sub">수의사, 훈련사, 미용사만 운영하며 등록 서류는 관리자가 직접 합격/불합격을 결정합니다.</p>
        <div class="experts-hero__stats">
          <span class="dw-stat"><strong>${_expertsPageProfiles.length}</strong>명 승인 전문가</span>
          <span class="dw-stat-divider">·</span>
          <span class="dw-stat"><strong>3단계</strong> 서류 심사</span>
        </div>
      </div>
    </section>

    ${renderExpertTrustGuide()}
    ${renderExpertApplicationPanel(user)}
    ${expertProfile ? renderExpertDashboard(expertProfile, expertConsultations) : ''}
    ${activeConsultation ? renderExpertConsultationChat(activeConsultation, user) : ''}
    ${user ? renderRequesterConsultationStrip(requesterConsultations) : ''}

    <div class="dw-section__header experts-market-head">
      <h2 class="dw-section__title">검증 전문가 <span class="dw-count">${visibleExperts.length}</span></h2>
      <div class="dw-map-controls">
        <select class="form-select expert-category-select" onchange="setExpertCategory(this.value)">
          ${EXPERT_PAGE_CATEGORIES.map(cat => `<option value="${cat.key}" ${_expertsPageCategory === cat.key ? 'selected' : ''}>${cat.label}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="expert-tabs">
      ${EXPERT_PAGE_CATEGORIES.map(cat => `
        <button class="expert-tab ${_expertsPageCategory === cat.key ? 'active' : ''}" onclick="setExpertCategory('${cat.key}')">${cat.label}</button>
      `).join('')}
    </div>

    <div class="dw-list expert-list" aria-label="${activeCategory.label} 전문가 목록">
      ${visibleExperts.length ? visibleExperts.map((expert, idx) => renderExpertCard(expert, idx, user)).join('') : renderExpertEmpty()}
    </div>

    ${renderMockExpertAccounts()}
  </div>
  `);

  if (activeConsultation) {
    setTimeout(() => {
      if (_expertsPageFocusChatAfterRender) {
        document.getElementById('expert-chat-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        _expertsPageFocusChatAfterRender = false;
      }
      const messages = document.getElementById('expert-chat-messages');
      if (messages) messages.scrollTop = messages.scrollHeight;
    }, 50);
  }
}

function renderExpertTrustGuide() {
  return `
  <section class="expert-verify-guide">
    ${Object.entries(EXPERT_GUIDE).map(([key, guide]) => `
      <article class="expert-verify-card expert-verify-card--${key}">
        <div class="expert-verify-card__top">
          <span>${guide.label}</span>
          <strong>${guide.badge}</strong>
        </div>
        <h3>${guide.title}</h3>
        <p>${guide.headline}</p>
        <div class="expert-verify-card__docs">
          ${guide.required.slice(0, 3).map(doc => `<span>${doc}</span>`).join('')}
        </div>
      </article>
    `).join('')}
  </section>`;
}

function renderExpertApplicationPanel(user) {
  const latest = user ? _expertsPageApplications[0] : null;
  return `
  <section class="expert-apply-card">
    <div class="expert-apply-panel__intro">
      <span class="experts-hero__eyebrow">Expert onboarding</span>
      <h2>전문가로 등록하기</h2>
      <p>서류를 제출하면 관리자 심사 후 승인된 전문가만 상담 목록에 노출됩니다.</p>
      ${latest ? renderApplicationStatus(latest) : ''}
    </div>
    <div class="expert-apply-card__badges">
      <span>수의사 면허</span>
      <span>KKC/KKF</span>
      <span>포트폴리오</span>
    </div>
    <button class="btn btn-primary expert-apply-card__cta" onclick="${user ? 'openExpertApplicationModal()' : `showLoginModal('전문가 등록을 신청하려면 로그인이 필요해요.')`}">
      ${user ? '등록 신청서 작성' : '로그인 후 신청하기'}
    </button>
  </section>`;
}

function renderApplicationStatus(application) {
  return `
  <div class="expert-application-status expert-application-status--${application.status}">
    <strong>${getExpertStatusLabel(application.status)}</strong>
    <span>${application.status === 'rejected' ? escapeHtml(application.rejectionReason || '서류 보완이 필요합니다.') : `${escapeHtml(application.categoryLabel)} 등록 신청 · ${new Date(application.createdAt).toLocaleDateString('ko-KR')}`}</span>
  </div>`;
}

function renderExpertApplicationForm(user) {
  return `
  <form class="expert-apply-form" onsubmit="submitExpertApplication(event)">
    <div class="expert-form-grid">
      <label>
        <span>전문 분야</span>
        <select id="expert-apply-category" class="form-select" onchange="updateExpertApplyGuide()">
          <option value="vet">수의사</option>
          <option value="trainer">훈련사</option>
          <option value="groomer">미용사</option>
        </select>
      </label>
      <label>
        <span>노출 이름</span>
        <input id="expert-apply-name" class="form-input" value="${escapeAttr(user.nickname || user.name || '')}" placeholder="예: 김하린">
      </label>
      <label>
        <span>전문가 타이틀</span>
        <input id="expert-apply-title" class="form-input" placeholder="예: 소동물 내과 수의사">
      </label>
      <label>
        <span>상담 가격</span>
        <input id="expert-apply-price" class="form-input" type="number" min="10000" step="1000" value="30000">
      </label>
      <label>
        <span>지역/상담 방식</span>
        <input id="expert-apply-location" class="form-input" placeholder="예: 서울 강남 · 온라인">
      </label>
      <label>
        <span>경력 연수</span>
        <input id="expert-apply-years" class="form-input" type="number" min="0" max="40" placeholder="예: 7">
      </label>
      <label>
        <span>발급기관</span>
        <input id="expert-apply-issuer" class="form-input" placeholder="예: 농림축산식품부 / KKC / KKF">
      </label>
      <label>
        <span>자격명</span>
        <input id="expert-apply-license" class="form-input" placeholder="예: 수의사 면허 / 반려견지도사">
      </label>
      <label>
        <span>등급</span>
        <input id="expert-apply-grade" class="form-input" placeholder="예: 면허 / 1급 / 2급">
      </label>
      <label>
        <span>자격번호</span>
        <input id="expert-apply-number" class="form-input" placeholder="서류에 표시된 번호">
      </label>
      <label>
        <span>근무처/사업장</span>
        <input id="expert-apply-workplace" class="form-input" placeholder="예: ○○동물병원 / ○○훈련소">
      </label>
      <label>
        <span>전문 태그</span>
        <input id="expert-apply-tags" class="form-input" placeholder="쉼표로 구분: 피부, 분리불안, 위생미용">
      </label>
    </div>
    <label class="expert-form-wide">
      <span>소개 문구</span>
      <textarea id="expert-apply-intro" class="form-input" rows="3" placeholder="보호자가 어떤 상담을 받을 수 있는지 적어주세요."></textarea>
    </label>
    <label class="expert-form-wide">
      <span>등록 서류 첨부</span>
      <input id="expert-apply-docs" type="file" multiple accept="image/*,.pdf" class="form-input">
      <small>면허증/자격증/재직증명/포트폴리오 중 1개 이상, 파일당 3MB 이하</small>
    </label>
    <div id="expert-apply-guide" class="expert-apply-guide">
      <strong>${EXPERT_GUIDE.vet.label} 권장 증빙</strong>
      <span>${EXPERT_GUIDE.vet.required.join(' · ')}</span>
    </div>
    <button class="btn btn-primary expert-apply-submit" type="submit">서류 제출하고 심사 요청</button>
  </form>`;
}

function openExpertApplicationModal() {
  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('전문가 등록을 신청하려면 로그인이 필요해요.');
    return;
  }
  document.getElementById('expert-apply-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'expert-apply-modal';
  modal.className = 'expert-modal expert-apply-modal';
  modal.innerHTML = `
    <div class="expert-modal__card expert-apply-modal__card">
      <button class="expert-modal__close" onclick="document.getElementById('expert-apply-modal').remove()" aria-label="닫기">×</button>
      <div class="expert-apply-modal__head">
        <span class="experts-hero__eyebrow">Expert onboarding</span>
        <h3>전문가 등록 신청</h3>
        <p>면허/자격 서류와 활동 정보를 제출하면 관리자가 확인합니다.</p>
      </div>
      ${renderExpertApplicationForm(user)}
    </div>`;
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);
  updateExpertApplyGuide();
  document.getElementById('expert-apply-title')?.focus();
}

function updateExpertApplyGuide() {
  const category = document.getElementById('expert-apply-category')?.value || 'vet';
  const guide = EXPERT_GUIDE[category];
  const el = document.getElementById('expert-apply-guide');
  if (!el || !guide) return;
  el.innerHTML = `
    <strong>${guide.label} 권장 증빙</strong>
    <span>${guide.required.join(' · ')}</span>
  `;
}

async function submitExpertApplication(event) {
  event.preventDefault();
  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('전문가 등록을 신청하려면 로그인이 필요해요.');
    return;
  }
  const btn = event.target.querySelector('.expert-apply-submit');
  if (btn) { btn.disabled = true; btn.textContent = '서류를 제출하는 중...'; }
  try {
    const documents = await readExpertDocumentFiles(document.getElementById('expert-apply-docs'));
    const payload = {
      userId: user.id,
      applicantName: user.name || user.nickname || '',
      applicantEmail: user.email || '',
      category: document.getElementById('expert-apply-category')?.value,
      displayName: document.getElementById('expert-apply-name')?.value.trim(),
      title: document.getElementById('expert-apply-title')?.value.trim(),
      price: Number(document.getElementById('expert-apply-price')?.value || 30000),
      location: document.getElementById('expert-apply-location')?.value.trim(),
      experienceYears: document.getElementById('expert-apply-years')?.value.trim(),
      licenseIssuer: document.getElementById('expert-apply-issuer')?.value.trim(),
      licenseName: document.getElementById('expert-apply-license')?.value.trim(),
      licenseGrade: document.getElementById('expert-apply-grade')?.value.trim(),
      licenseNumber: document.getElementById('expert-apply-number')?.value.trim(),
      workplace: document.getElementById('expert-apply-workplace')?.value.trim(),
      tags: document.getElementById('expert-apply-tags')?.value.trim(),
      intro: document.getElementById('expert-apply-intro')?.value.trim(),
      documents
    };
    await expertFetch('/api/experts/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    document.getElementById('expert-apply-modal')?.remove();
    showToast('전문가 등록 신청이 접수됐어요. 관리자가 서류를 확인합니다.', 'success');
    renderExpertsPage();
  } catch (e) {
    showToast(e.message || '신청서를 제출하지 못했어요.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '서류 제출하고 심사 요청'; }
  }
}

function readExpertDocumentFiles(input) {
  const files = Array.from(input?.files || []);
  if (!files.length) throw new Error('서류 파일을 1개 이상 첨부해주세요.');
  if (files.length > 4) throw new Error('서류는 최대 4개까지 첨부할 수 있어요.');
  return Promise.all(files.map(file => new Promise((resolve, reject) => {
    if (file.size > 3 * 1024 * 1024) {
      reject(new Error('파일당 3MB 이하만 첨부할 수 있어요.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = e => resolve({ name: file.name, type: file.type, size: file.size, data: e.target.result });
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요.'));
    reader.readAsDataURL(file);
  })));
}

function renderExpertDashboard(profile, consultations) {
  const active = consultations.filter(isExpertConsultationActive);
  const history = consultations.filter(c => !isExpertConsultationActive(c));
  return `
  <section class="expert-dashboard-panel">
    <div class="expert-dashboard-panel__head">
      <div>
        <span class="experts-hero__eyebrow">Expert account</span>
        <h2>${escapeHtml(profile.name)} 전문가 대시보드</h2>
        <p>${escapeHtml(profile.categoryLabel)} 계정으로 접수된 상담 요청을 확인하고 답변할 수 있어요.</p>
      </div>
      <span class="expert-verified-badge">${icon('check-circle', 14)} 승인 완료</span>
    </div>
    <div class="expert-dashboard-grid">
      <div class="expert-dashboard-stat"><strong>${active.length}</strong><span>진행/대기 상담</span></div>
      <div class="expert-dashboard-stat"><strong>${history.length}</strong><span>종료/반려 상담</span></div>
      <div class="expert-dashboard-stat"><strong>${formatWon(profile.price)}</strong><span>1회 상담가</span></div>
    </div>
    <div class="expert-request-list">
      ${active.length ? active.map(c => renderExpertRequestCard(c, true)).join('') : '<div class="expert-session-empty">아직 접수된 상담 요청이 없어요.</div>'}
    </div>
  </section>`;
}

function renderExpertRequestCard(consultation, isExpertSide) {
  return `
  <article class="expert-request-card expert-request-card--${consultation.status}">
    <div>
      <span class="expert-card__category">${escapeHtml(consultation.categoryLabel)}</span>
      <h3>${escapeHtml(consultation.topic || '상담 요청')}</h3>
      <p>${escapeHtml(consultation.requesterName || '보호자')} · ${escapeHtml(consultation.dogName || '반려견')} · ${new Date(consultation.createdAt).toLocaleString('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
    </div>
    <div class="expert-request-card__actions">
      <span class="expert-status-pill expert-status-pill--${consultation.status}">${getExpertStatusLabel(consultation.status)}</span>
      ${isExpertSide && consultation.status === 'requested' ? `<button class="btn btn-primary btn-sm" onclick="setExpertConsultationStatus('${consultation.id}', 'accepted')">상담 수락</button>` : ''}
      ${isExpertSide && consultation.status === 'requested' ? `<button class="btn btn-secondary btn-sm" onclick="setExpertConsultationStatus('${consultation.id}', 'declined')">진행 불가</button>` : ''}
      ${isExpertSide && consultation.status === 'accepted' ? `<button class="btn btn-secondary btn-sm" onclick="setExpertConsultationStatus('${consultation.id}', 'completed')">상담 완료</button>` : ''}
      <button class="btn btn-secondary btn-sm" onclick="openExpertConsultation('${consultation.id}')">상담방 열기</button>
    </div>
  </article>`;
}

function renderRequesterConsultationStrip(consultations) {
  const active = consultations.filter(isExpertConsultationActive);
  const history = consultations.filter(c => !isExpertConsultationActive(c));
  const visible = _expertsPageSessionTab === 'history' ? history : active;
  return `
  <section class="expert-session-strip">
    <div class="expert-section-head">
      <h2>${_expertsPageSessionTab === 'history' ? '상담 기록' : '내 상담 요청'}</h2>
      <span>${visible.length}건</span>
    </div>
    <div class="expert-session-tabs">
      <button class="${_expertsPageSessionTab === 'active' ? 'active' : ''}" onclick="setExpertSessionTab('active')">진행 중 <strong>${active.length}</strong></button>
      <button class="${_expertsPageSessionTab === 'history' ? 'active' : ''}" onclick="setExpertSessionTab('history')">기록 <strong>${history.length}</strong></button>
    </div>
    <div class="expert-session-list">
      ${visible.length ? visible.map(renderRequesterConsultationChip).join('') : `<div class="expert-session-empty">${_expertsPageSessionTab === 'history' ? '아직 종료된 상담이 없어요.' : '진행 중인 전문가 상담이 없어요.'}</div>`}
    </div>
  </section>`;
}

function renderRequesterConsultationChip(consultation) {
  return `
  <button class="expert-session-chip expert-session-chip--${consultation.status}" onclick="openExpertConsultation('${consultation.id}')">
    <span class="expert-session-chip__avatar">${escapeHtml((consultation.expertName || '?').charAt(0))}</span>
    <span>
      <strong>${escapeHtml(consultation.expertName)}</strong>
      <small>${getExpertStatusLabel(consultation.status)} · ${escapeHtml(consultation.dogName || '반려견')}</small>
    </span>
  </button>`;
}

function setExpertSessionTab(tab) {
  _expertsPageSessionTab = tab === 'history' ? 'history' : 'active';
  renderExpertsPage();
}

function renderExpertCard(expert, idx, user) {
  const existing = user ? _expertsPageConsultations.find(c => c.requesterId === user.id && c.expertId === expert.id && isExpertConsultationActive(c)) : null;
  const score = Math.min(99, Math.round((Number(expert.rating || 4.7) * 18) + Math.min(Number(expert.reviews || 0), 220) / 18));
  const scoreLabel = score >= 90 ? '강력 추천' : score >= 82 ? '추천' : '검증';
  return `
  <article class="dw-card expert-card expert-card--verified">
    ${renderExpertAvatar({ name: expert.name, avatar: expert.avatar, category: expert.category, className: 'dw-card__avatar' })}
    <div class="dw-card__body">
      <div class="dw-card__top">
        <div>
          <div class="dw-card__name">
            <span class="dw-avail-dot dw-avail-dot--on"></span>${escapeHtml(expert.name)}
            <span class="expert-card__category">${escapeHtml(expert.categoryLabel)}</span>
            ${expert.source === 'mock' ? '<span class="walker-card__rank-badge expert-rank-badge">Mock 계정</span>' : ''}
          </div>
          <div class="dw-card__rating"><span class="dw-stars">${'★'.repeat(Math.round(expert.rating || 5))}</span> ${Number(expert.rating || 0).toFixed(1)} · 리뷰 ${Number(expert.reviews || 0)}건</div>
        </div>
        <div class="walker-card__score-wrap expert-score-wrap">
          <div class="walker-card__score">${score}점</div>
          <div class="walker-card__score-label">${scoreLabel}</div>
        </div>
      </div>
      <div class="walker-card__ai-reason expert-reason">${icon('sparkles',11,'#F6A623')} ${escapeHtml(expert.title)} · ${escapeHtml(expert.responseTime || '평균 15분')}</div>
      <div class="dw-card__meta">${icon('map-pin',13)} ${escapeHtml(expert.location || '온라인')} · ${icon('clock',13)} ${escapeHtml(expert.experience || '경력 확인')}</div>
      <div class="expert-badges">
        ${(expert.verificationBadges || []).map(badge => `<span>${escapeHtml(badge)}</span>`).join('')}
      </div>
      <div class="dw-card__sizes">
        ${(expert.tags || []).map(tag => `<span class="dw-size-tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="dw-card__bio">"${escapeHtml(expert.intro || '')}"</div>
      <div class="expert-price-row">
        <span>1회 상담</span>
        <strong>${formatWon(expert.price)}</strong>
      </div>
    </div>
    <div class="dw-card__action expert-card__action">
      <button class="btn ${existing ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="${existing ? `openExpertConsultation('${existing.id}')` : `startExpertCheckout('${expert.id}')`}">${existing ? '상담방 열기' : `${formatWon(expert.price)} · 신청`}</button>
    </div>
  </article>`;
}

function renderExpertEmpty() {
  return `
  <div class="expert-empty">
    <strong>아직 승인된 전문가가 없어요.</strong>
    <span>관리자 심사를 통과한 전문가가 생기면 이곳에 표시됩니다.</span>
  </div>`;
}

function renderMockExpertAccounts() {
  const accounts = _expertsPageMeta?.mockAccounts || [];
  if (!accounts.length) return '';
  return `
  <section class="expert-mock-panel">
    <div>
      <h3>테스트 전문가 계정</h3>
      <p>결제 후 해당 계정으로 로그인하면 상담 요청 알림과 요청 카드가 보여요.</p>
    </div>
    <div class="expert-mock-grid">
      ${accounts.map(acc => `
        <div class="expert-mock-account">
          <strong>${escapeHtml(acc.role)}</strong>
          <span>${escapeHtml(acc.email)}</span>
          <small>비밀번호 ${escapeHtml(acc.password)}</small>
        </div>
      `).join('')}
    </div>
  </section>`;
}

function setExpertCategory(category) {
  _expertsPageCategory = category;
  renderExpertsPage();
}

function startExpertCheckout(expertId) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('전문가 상담을 결제하고 요청하려면 로그인이 필요해요.');
    return;
  }
  const expert = _expertsPageProfiles.find(p => p.id === expertId);
  if (!expert) return;

  const existing = _expertsPageConsultations.find(c => c.requesterId === user.id && c.expertId === expertId && isExpertConsultationActive(c));
  if (existing) {
    openExpertConsultation(existing.id);
    return;
  }

  const dogs = user.dogs || [];
  const dogOptions = dogs.length
    ? dogs.map(d => `<option value="${escapeAttr(d.name || '반려견')}">${escapeHtml(d.name || '반려견')}</option>`).join('')
    : '<option value="반려견">반려견</option>';
  const modalId = 'expert-payment-modal';
  document.getElementById(modalId)?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="${modalId}" class="expert-modal">
      <div class="expert-modal__card expert-modal__card--verified">
        <button class="expert-modal__close" onclick="document.getElementById('${modalId}').remove()" aria-label="닫기">×</button>
        <div class="expert-modal__head">
          ${renderExpertAvatar({ name: expert.name, avatar: expert.avatar, category: expert.category })}
          <div>
            <span class="expert-card__category">${escapeHtml(expert.categoryLabel)}</span>
            <h3>${escapeHtml(expert.name)} 전문가 상담</h3>
            <p>${escapeHtml(expert.title)}</p>
          </div>
        </div>
        <div class="expert-pay-summary">
          <div><span>상담권</span><strong>1회 채팅 상담</strong></div>
          <div><span>전문가 상태</span><strong>${(expert.verificationBadges || ['검증 완료'])[0]}</strong></div>
          <div><span>결제 금액</span><strong>${formatWon(expert.price)}</strong></div>
        </div>
        <label class="expert-modal__label">반려견</label>
        <select id="expert-consult-dog" class="form-select">${dogOptions}</select>
        <label class="expert-modal__label">상담 주제</label>
        <input id="expert-consult-topic" class="form-input" placeholder="예: 피부 가려움 / 분리불안 / 미용 공포">
        <label class="expert-modal__label">처음 남길 메시지</label>
        <textarea id="expert-first-message" class="form-input" rows="4" placeholder="아이 나이, 상황, 이미 해본 조치, 사진 필요 여부를 적어주세요."></textarea>
        <div class="expert-modal__notice">결제 후 전문가 계정에 상담 요청 알림이 도착합니다.</div>
        <button class="btn btn-primary expert-modal__pay" onclick="requestExpertPayment('${expert.id}')">${formatWon(expert.price)} 결제하고 상담 신청</button>
      </div>
    </div>
  `);
  document.getElementById(modalId).addEventListener('click', e => {
    if (e.target.id === modalId) e.target.remove();
  });
  document.getElementById('expert-first-message')?.focus();
}

async function requestExpertPayment(expertId) {
  const user = AuthService.getCurrentUser();
  const expert = _expertsPageProfiles.find(p => p.id === expertId);
  if (!user || !expert) return;
  const btn = document.querySelector('.expert-modal__pay');
  const firstMessage = document.getElementById('expert-first-message')?.value.trim() || '상담을 시작하고 싶어요.';
  const topic = document.getElementById('expert-consult-topic')?.value.trim() || `${expert.categoryLabel} 상담`;
  const dogName = document.getElementById('expert-consult-dog')?.value || '반려견';
  const orderId = 'expert_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const pendingPayment = {
    orderId,
    amount: expert.price,
    expertId,
    firstMessage,
    topic,
    dogName,
    requestType: 'expert',
    timestamp: Date.now()
  };
  localStorage.setItem('pawsitive_pending_payment', JSON.stringify(pendingPayment));
  if (btn) { btn.disabled = true; btn.textContent = '결제 처리 중...'; }
  try {
    await requestTossPayment({
      amount: expert.price,
      orderId,
      orderName: `${expert.name} ${expert.categoryLabel} 상담`,
      customerName: user.name || user.nickname || '요청자',
      successHash: '#/experts',
      failHash: '#/experts'
    });
  } catch (e) {
    localStorage.removeItem('pawsitive_pending_payment');
    if (btn) { btn.disabled = false; btn.textContent = `${formatWon(expert.price)} 결제하고 상담 신청`; }
  }
}

async function completeExpertPayment(expertId, payment = {}) {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  try {
    const data = await expertFetch('/api/experts/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: user.id,
        requesterName: user.nickname || user.name || '보호자',
        requesterEmail: user.email || '',
        expertId,
        dogName: payment.dogName || '반려견',
        topic: payment.topic || '상담 요청',
        firstMessage: payment.firstMessage || '상담을 시작하고 싶어요.',
        amount: payment.amount || 0,
        paymentOrderId: payment.orderId || ''
      })
    });
    _expertsPageActiveConsultationId = data.consultation.id;
    _expertsPageFocusChatAfterRender = true;
    document.getElementById('expert-payment-modal')?.remove();
    showToast(data.existing ? '이미 진행 중인 상담방을 열게요.' : '결제가 완료됐어요. 전문가에게 상담 요청을 보냈습니다.', 'success');
    renderExpertsPage();
  } catch (e) {
    showToast(e.message || '전문가 상담 요청을 만들지 못했어요.', 'error');
  }
}

function openExpertConsultation(consultationId) {
  _expertsPageActiveConsultationId = consultationId;
  _expertsPageFocusChatAfterRender = true;
  renderExpertsPage();
}

function closeExpertConsultation() {
  _expertsPageActiveConsultationId = null;
  _expertsPageFocusChatAfterRender = false;
  renderExpertsPage();
}

async function setExpertConsultationStatus(consultationId, status) {
  try {
    const data = await expertFetch(`/api/experts/consultations/${consultationId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    _expertsPageActiveConsultationId = data.consultation.id;
    _expertsPageFocusChatAfterRender = true;
    showToast(status === 'accepted' ? '상담을 수락했어요.' : status === 'completed' ? '상담을 완료했어요.' : '상담 요청을 정리했어요.', 'success');
    renderExpertsPage();
  } catch (e) {
    showToast(e.message || '상담 상태를 변경하지 못했어요.', 'error');
  }
}

function getConsultationSide(consultation, user) {
  if (!user) return 'requester';
  return consultation.expertUserId === user.id ? 'expert' : 'requester';
}

function renderExpertConsultationChat(consultation, user) {
  const side = getConsultationSide(consultation, user);
  const disabled = ['declined', 'completed'].includes(consultation.status);
  const partner = side === 'expert' ? consultation.requesterName : consultation.expertName;
  return `
  <section class="expert-chat-panel" id="expert-chat-panel">
    <div class="expert-chat expert-chat--verified">
      <div class="expert-chat__head">
        ${renderExpertAvatar({ name: partner, category: consultation.category, usePhoto: side !== 'expert' })}
        <div>
          <h3>${escapeHtml(partner || '상담방')}</h3>
          <p>${escapeHtml(consultation.categoryLabel)} · ${getExpertStatusLabel(consultation.status)} · ${escapeHtml(consultation.dogName || '반려견')}</p>
        </div>
        <div class="expert-chat__actions">
          ${side === 'expert' && consultation.status === 'requested' ? `<button class="expert-chat__end" onclick="setExpertConsultationStatus('${consultation.id}', 'accepted')" type="button">수락</button>` : ''}
          ${side === 'expert' && consultation.status === 'accepted' ? `<button class="expert-chat__end" onclick="setExpertConsultationStatus('${consultation.id}', 'completed')" type="button">완료</button>` : ''}
          <button class="expert-chat__close" onclick="closeExpertConsultation()" aria-label="닫기" type="button">×</button>
        </div>
      </div>
      <div class="expert-chat__case">
        <strong>${escapeHtml(consultation.topic || '상담 요청')}</strong>
      </div>
      <div class="expert-chat__messages" id="expert-chat-messages">
        ${(consultation.messages || []).map(msg => renderExpertMessage(msg, side)).join('')}
      </div>
      ${disabled ? `
        <div class="expert-chat__ended">
          <strong>${getExpertStatusLabel(consultation.status)}</strong>
          <span>이 상담방은 더 이상 메시지를 보낼 수 없어요.</span>
        </div>` : `
        <div class="expert-chat__composer">
          <div class="expert-chat__attachments" id="expert-chat-attachments">${renderExpertAttachmentPreview(consultation.id)}</div>
          <div class="expert-chat__input">
            <label class="expert-chat__attach" for="expert-chat-file" aria-label="사진 첨부">${icon('image',18)}</label>
            <input id="expert-chat-file" type="file" accept="image/*" multiple onchange="handleExpertChatFile('${consultation.id}', this)">
            <input id="expert-chat-input" type="text" maxlength="260" placeholder="${side === 'expert' ? '보호자에게 답변하기...' : '전문가에게 메시지 보내기...'}" onpaste="handleExpertChatPaste(event, '${consultation.id}')" onkeydown="if(event.key==='Enter') sendExpertMessage('${consultation.id}')">
            <button class="btn btn-primary btn-sm" onclick="sendExpertMessage('${consultation.id}')">전송</button>
          </div>
        </div>`}
    </div>
  </section>`;
}

function renderExpertMessage(message, side) {
  if (message.from === 'system') {
    return `<div class="expert-chat__system">${escapeHtml(message.text)}</div>`;
  }
  const mine = message.from === side;
  return `
  <div class="expert-chat__row expert-chat__row--${mine ? 'user' : 'expert'}">
    <div class="expert-chat__bubble">
      ${(message.images || []).map(src => `<img class="expert-chat__image" src="${escapeHtml(src)}" alt="첨부 사진">`).join('')}
      ${message.text ? `<div>${escapeHtml(message.text)}</div>` : ''}
    </div>
  </div>`;
}

function getExpertPendingAttachments(consultationId) {
  return _expertsPagePendingAttachments[consultationId] || [];
}

function renderExpertAttachmentPreview(consultationId) {
  const attachments = getExpertPendingAttachments(consultationId);
  if (!attachments.length) return '';
  return attachments.map((src, idx) => `
    <div class="expert-chat__attachment">
      <img src="${escapeHtml(src)}" alt="첨부 예정 사진">
      <button onclick="removeExpertChatAttachment('${consultationId}', ${idx})" aria-label="첨부 사진 삭제">×</button>
    </div>
  `).join('');
}

function refreshExpertAttachmentPreview(consultationId) {
  const el = document.getElementById('expert-chat-attachments');
  if (el) el.innerHTML = renderExpertAttachmentPreview(consultationId);
}

function removeExpertChatAttachment(consultationId, index) {
  const attachments = getExpertPendingAttachments(consultationId);
  attachments.splice(index, 1);
  _expertsPagePendingAttachments[consultationId] = attachments;
  refreshExpertAttachmentPreview(consultationId);
}

function handleExpertChatPaste(event, consultationId) {
  const items = Array.from(event.clipboardData?.items || []);
  const imageItems = items.filter(item => item.type && item.type.startsWith('image/'));
  if (!imageItems.length) return;
  event.preventDefault();
  imageItems.forEach(item => addExpertChatImage(consultationId, item.getAsFile()));
}

function handleExpertChatFile(consultationId, input) {
  Array.from(input.files || []).forEach(file => addExpertChatImage(consultationId, file));
  input.value = '';
}

function addExpertChatImage(consultationId, file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (file.size > 4 * 1024 * 1024) {
    showToast('4MB 이하 사진만 첨부할 수 있어요.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const attachments = getExpertPendingAttachments(consultationId);
    attachments.push(e.target.result);
    _expertsPagePendingAttachments[consultationId] = attachments.slice(0, 4);
    refreshExpertAttachmentPreview(consultationId);
  };
  reader.readAsDataURL(file);
}

async function sendExpertMessage(consultationId) {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  const input = document.getElementById('expert-chat-input');
  const text = input?.value.trim() || '';
  const images = getExpertPendingAttachments(consultationId);
  if (!text && !images.length) return;
  try {
    const data = await expertFetch(`/api/experts/consultations/${consultationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: user.id, text, images })
    });
    _expertsPageActiveConsultationId = data.consultation.id;
    _expertsPagePendingAttachments[consultationId] = [];
    if (input) input.value = '';
    updateExpertConsultationCache(data.consultation);
    refreshActiveExpertChat(data.consultation);
  } catch (e) {
    showToast(e.message || '메시지를 보내지 못했어요.', 'error');
  }
}

function updateExpertConsultationCache(consultation) {
  if (!consultation?.id) return;
  const idx = _expertsPageConsultations.findIndex(c => c.id === consultation.id);
  if (idx >= 0) _expertsPageConsultations[idx] = consultation;
  else _expertsPageConsultations.unshift(consultation);
}

function refreshActiveExpertChat(consultation) {
  const user = AuthService.getCurrentUser();
  if (!user || !consultation || _expertsPageActiveConsultationId !== consultation.id) return false;
  const messages = document.getElementById('expert-chat-messages');
  if (!messages) return false;
  const side = getConsultationSide(consultation, user);
  messages.innerHTML = (consultation.messages || []).map(msg => renderExpertMessage(msg, side)).join('');
  messages.scrollTop = messages.scrollHeight;
  const attachments = document.getElementById('expert-chat-attachments');
  if (attachments) attachments.innerHTML = renderExpertAttachmentPreview(consultation.id);
  return true;
}

function handleExpertConsultationRealtime(consultation) {
  updateExpertConsultationCache(consultation);
  return refreshActiveExpertChat(consultation);
}
