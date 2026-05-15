// Pawsitive - Breeds Page
// --- 품종 목록 페이지 (탭: 백과사전 / AI 추천) ---
let breedPageTab = 'recommend'; // 'encyclopedia' | 'recommend'

function renderBreedListPage() {
  renderPage(`
    <style>
      .breed-atlas-page { max-width:1120px; margin:0 auto; padding:8px 0 44px; color:#0B1220; }
      .breed-atlas-hero { position:relative; overflow:hidden; min-height:326px; display:flex; align-items:flex-end; border:1px solid #DDE6F0; border-radius:8px; margin-bottom:18px; background-image:
        linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.92) 45%, rgba(255,255,255,.64) 70%, rgba(255,255,255,.18) 100%),
        url('/breed-atlas-hero-bg.png'); background-size:cover, cover; background-position:center, right center; background-repeat:no-repeat; box-shadow:0 24px 58px rgba(15,23,42,.08); }
      .breed-atlas-hero::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(255,255,255,0) 58%, rgba(255,255,255,.18) 100%); pointer-events:none; }
      .breed-atlas-hero__content { position:relative; z-index:1; max-width:620px; padding:42px 38px 36px; }
      .breed-atlas-hero__eyebrow { display:inline-flex; align-items:center; gap:7px; padding:6px 10px; border-radius:999px; background:#EFF6FF; color:#175CD3; font-size:.72rem; font-weight:950; margin-bottom:14px; }
      .breed-atlas-hero h1 { margin:0 0 10px; max-width:590px; font-size:2.08rem; line-height:1.18; font-weight:950; letter-spacing:0; color:#0B1220; }
      .breed-atlas-hero p { margin:0; max-width:540px; color:#52637A; line-height:1.72; font-size:.94rem; }
      .breed-atlas-hero__search { margin-top:22px; display:flex; align-items:center; gap:10px; max-width:540px; padding:12px 14px; border:1px solid #DDE6F0; border-radius:8px; background:rgba(255,255,255,.94); box-shadow:0 16px 36px rgba(15,23,42,.08); backdrop-filter:blur(10px); }
      .breed-atlas-hero__search input { flex:1; min-width:0; border:none; outline:none; background:transparent; color:#0B1220; font-size:.92rem; font-weight:850; }
      .breed-atlas-hero__search input::placeholder { color:#94A3B8; }
      .breed-atlas-stats { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
      .breed-atlas-stats span { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,.92); border:1px solid #E2E8F0; color:#64748B; font-size:.72rem; font-weight:900; }
      .breed-tabs { display:inline-flex; gap:4px; padding:4px; margin-bottom:18px; border:1px solid #DDE6F0; border-radius:999px; background:#F8FAFC; box-shadow:0 12px 28px rgba(15,23,42,.05); }
      .breed-tab { min-width:134px; padding:10px 16px; border:none; border-radius:999px; cursor:pointer; font-weight:950; font-size:.84rem; transition:all .18s; background:transparent; color:#64748B; }
      .breed-tab:hover { color:#0B1220; }
      .breed-tab--active { background:#0B1220 !important; color:#fff !important; box-shadow:0 10px 22px rgba(15,23,42,.14); }
      .breed-tab-panel { animation:breedFadeIn .18s ease; }
      @keyframes breedFadeIn { from{opacity:.7;transform:translateY(4px)} to{opacity:1;transform:none} }
      .breed-section-head { display:flex; justify-content:space-between; align-items:flex-end; gap:18px; margin:0 0 14px; }
      .breed-section-head h2 { margin:0 0 5px; font-size:1.22rem; line-height:1.25; font-weight:950; color:#0B1220; }
      .breed-section-head p { margin:0; max-width:620px; color:#64748B; font-size:.84rem; line-height:1.62; font-weight:750; }
      .breed-section-head__count { flex-shrink:0; padding:7px 10px; border-radius:999px; background:#F8FAFC; border:1px solid #E2E8F0; color:#475569; font-size:.72rem; font-weight:950; }
      .breed-search-panel { display:flex; align-items:center; gap:10px; margin-bottom:16px; padding:14px 15px; border:1px solid #DDE6F0; border-radius:8px; background:#fff; box-shadow:0 14px 34px rgba(15,23,42,.055); }
      .breed-search-panel input { flex:1; min-width:0; border:none; outline:none; font-size:.92rem; font-weight:800; color:#0B1220; }
      .breed-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
      .breed-atlas-card { overflow:hidden; border:1px solid #DDE6F0; border-radius:8px; background:#fff; cursor:pointer; box-shadow:0 16px 38px rgba(15,23,42,.055); transition:transform .16s, box-shadow .16s, border-color .16s; }
      .breed-atlas-card:hover { transform:translateY(-2px); border-color:#CBD5E1; box-shadow:0 22px 46px rgba(15,23,42,.095); }
      .breed-atlas-card__image { position:relative; height:218px; background:#F8FAFC; display:flex; align-items:center; justify-content:center; font-size:2.8rem; }
      .breed-atlas-card__badge { position:absolute; top:12px; left:12px; padding:5px 9px; border-radius:999px; background:rgba(255,255,255,.92); border:1px solid rgba(226,232,240,.9); color:#334155; font-size:.68rem; font-weight:950; }
      .breed-atlas-card__body { padding:17px 18px 18px; }
      .breed-atlas-card__name { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:4px; }
      .breed-atlas-card__name strong { font-size:1.02rem; font-weight:950; color:#0B1220; }
      .breed-atlas-card__name span { color:#94A3B8; font-size:.72rem; font-weight:800; text-align:right; }
      .breed-atlas-card__text { min-height:42px; color:#64748B; font-size:.8rem; line-height:1.55; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .breed-trait-bars { display:grid; gap:8px; margin-top:14px; }
      .breed-trait-bar { display:grid; grid-template-columns:56px minmax(0,1fr) 32px; gap:8px; align-items:center; color:#64748B; font-size:.68rem; font-weight:900; }
      .breed-trait-bar__track { height:6px; overflow:hidden; border-radius:999px; background:#E2E8F0; }
      .breed-trait-bar__track span { display:block; height:100%; border-radius:999px; background:#2563EB; }
      .breed-trait-bar:nth-child(2) .breed-trait-bar__track span { background:#0F766E; }
      .breed-trait-bar:nth-child(3) .breed-trait-bar__track span { background:#F97316; }
      .breed-recommend-hero { display:grid; grid-template-columns:minmax(0,1.06fr) minmax(280px,.76fr); gap:16px; align-items:stretch; margin-bottom:20px; }
      .breed-recommend-card { position:relative; overflow:hidden; padding:34px 32px; border:1px solid #DDE6F0; border-radius:8px; background:linear-gradient(135deg,#fff 0%,#FBFDFB 58%,#F6FAF8 100%); box-shadow:0 18px 44px rgba(15,23,42,.065); }
      .breed-recommend-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:#0F766E; }
      .breed-recommend-card > * { position:relative; z-index:1; }
      .breed-recommend-card__kicker { display:inline-flex; padding:6px 10px; border-radius:999px; background:#ECFDF5; color:#047857; font-size:.72rem; font-weight:950; margin-bottom:12px; }
      .breed-recommend-card h2 { margin:0 0 9px; max-width:560px; font-size:1.72rem; line-height:1.2; font-weight:950; }
      .breed-recommend-card p { margin:0; max-width:570px; color:#64748B; line-height:1.68; font-size:.9rem; }
      .breed-recommend-card__features { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin:18px 0 20px; }
      .breed-recommend-card__features span { padding:11px 10px; border-radius:8px; background:#fff; border:1px solid #E5E7EB; color:#334155; font-size:.74rem; font-weight:900; text-align:center; box-shadow:0 8px 18px rgba(15,23,42,.035); }
      .breed-recommend-card .btn { width:100%; max-width:320px; padding:14px; font-weight:950; display:inline-flex; align-items:center; justify-content:center; gap:9px; text-align:center; }
      .breed-recommend-btn-loading { display:inline-flex; align-items:center; justify-content:center; gap:9px; line-height:1; }
      .breed-recommend-btn-loading .spinner { width:20px; height:20px; border-width:2px; border-color:rgba(255,255,255,.28); border-top-color:#fff; flex-shrink:0; margin:0; }
      .breed-recommend-photo { position:relative; min-height:286px; overflow:hidden; border-radius:8px; border:1px solid #DDE6F0; background:url('/breed-detail-feature.png') center / cover no-repeat; box-shadow:0 18px 44px rgba(15,23,42,.08); }
      .breed-recommend-photo::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(11,18,32,.04), rgba(11,18,32,.58)); }
      .breed-recommend-photo__copy { position:absolute; left:18px; right:18px; bottom:18px; z-index:1; color:#fff; }
      .breed-recommend-photo__copy strong { display:block; font-size:1.02rem; font-weight:950; margin-bottom:5px; }
      .breed-recommend-photo__copy span { display:block; font-size:.78rem; line-height:1.55; opacity:.9; }
      .breed-recommend-loading-card { min-height:168px; padding:0; display:flex; align-items:center; justify-content:center; background:#fdfdfd; border:1px solid #E1E5EA; border-radius:8px; box-shadow:0 16px 42px rgba(15,23,42,.055); overflow:hidden; }
      .breed-recommend-loading-card:hover { transform:none; box-shadow:0 16px 42px rgba(15,23,42,.055); }
      .breed-recommend-loading-video { width:auto; height:min(134px, 80%); max-width:86%; object-fit:contain; display:block; opacity:.96; }
      @media (max-width:920px) { .breed-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .breed-recommend-hero { grid-template-columns:1fr; } }
      @media (max-width:640px) {
        .breed-atlas-hero { min-height:0; background-position:center, 64% center; }
        .breed-atlas-hero__content { padding:26px 18px; }
        .breed-atlas-hero h1 { font-size:1.55rem; }
        .breed-section-head { display:block; }
        .breed-section-head__count { display:inline-flex; margin-top:10px; }
        .breed-tabs { display:grid; grid-template-columns:1fr 1fr; width:100%; border-radius:8px; }
        .breed-tab { min-width:0; border-radius:8px; }
        .breed-grid { grid-template-columns:1fr; }
        .breed-recommend-card { padding:22px 18px; }
        .breed-recommend-card__features { grid-template-columns:1fr; }
        .breed-recommend-photo { min-height:220px; }
        .breed-recommend-loading-card { min-height:148px; }
        .breed-recommend-loading-video { height:min(112px, 78%); max-width:90%; }
      }
    </style>

    <div class="breed-atlas-page">
      <section class="breed-atlas-hero">
        <div class="breed-atlas-hero__content">
          <div class="breed-atlas-hero__eyebrow">${icon('book-open', 13, '#175CD3')} 품종 탐색 도감</div>
          <h1>궁금한 견종의 성격과 케어 정보를 한눈에 살펴봐요</h1>
          <p>좋아하는 품종의 성향, 활동량, 미용과 관리 포인트를 차분히 비교해보세요. 이름을 검색하면 원하는 견종 정보로 바로 들어갈 수 있어요.</p>
          <div class="breed-atlas-hero__search">
            <span>${icon('search', 15, '#2563EB')}</span>
            <input type="text" placeholder="품종 이름으로 바로 검색..." onfocus="switchBreedTab('encyclopedia'); setTimeout(() => document.getElementById('breed-search')?.focus(), 30)" oninput="switchBreedTab('encyclopedia'); setTimeout(() => { const el = document.getElementById('breed-search'); if (el) { el.value = this.value; handleBreedSearch(this.value); } }, 30)">
          </div>
          <div class="breed-atlas-stats">
            <span>${icon('database', 12, '#64748B')} 383종 품종 데이터</span>
            <span>${icon('activity', 12, '#64748B')} 성격·활동량 요약</span>
            <span>${icon('scissors', 12, '#64748B')} 미용·관리 포인트</span>
          </div>
        </div>
      </section>

      <div class="breed-tabs">
        <button id="tab-recommend" class="breed-tab ${breedPageTab === 'recommend' ? 'breed-tab--active' : ''}" onclick="switchBreedTab('recommend')">
          AI 맞춤 견종 찾기
        </button>
        <button id="tab-encyclopedia" class="breed-tab ${breedPageTab === 'encyclopedia' ? 'breed-tab--active' : ''}" onclick="switchBreedTab('encyclopedia')">
          품종 탐색 도감
        </button>
      </div>
      <div id="breed-tab-content" class="breed-tab-panel"></div>
    </div>
  `);
  renderBreedTabContent();
}

function switchBreedTab(tab) {
  breedPageTab = tab;
  // 탭 버튼 스타일 업데이트
  document.getElementById('tab-encyclopedia')?.classList.toggle('breed-tab--active', tab === 'encyclopedia');
  document.getElementById('tab-recommend')?.classList.toggle('breed-tab--active', tab === 'recommend');
  renderBreedTabContent();
}

function renderBreedTabContent() {
  const container = document.getElementById('breed-tab-content');
  if (!container) return;

  if (breedPageTab === 'encyclopedia') {
    container.innerHTML = `
      <div class="breed-section-head">
        <div>
          <h2>품종 백과사전</h2>
          <p>이름으로 검색해 성격, 활동량, 훈련 난이도와 관리 포인트를 빠르게 비교해요.</p>
        </div>
        <span class="breed-section-head__count">총 ${BreedService.getAll().length}종</span>
      </div>
      <div class="breed-search-panel">
        <span>${icon('search', 15, '#2563EB')}</span>
        <input type="text" id="breed-search" placeholder="품종 이름으로 검색..." oninput="handleBreedSearch(this.value)">
      </div>
      <div class="breed-grid" id="breed-list">
        ${renderBreedCards(BreedService.getAll())}
      </div>
    `;
    setTimeout(() => BreedImageService.loadAll(), 100);
  } else {
    container.innerHTML = renderBreedRecommendUI();
  }
}

// --- AI 맞춤 품종 추천 UI ---
let _breedRecStep = 0;
let _breedRecData = {};

const _breedRecommendSteps = [
  { key: 'size', question: '어떤 크기를 선호하세요?', sub: '아직 모르겠다면 상관없음을 골라도 좋아요', type: 'cards', defaultValue: 'any', options: [
    { value: 'any', label: '상관없음', desc: '폭넓게 추천' },
    { value: 'small', label: '소형', desc: '10kg 이하' },
    { value: 'medium', label: '중형', desc: '10~25kg' },
    { value: 'large', label: '대형', desc: '25kg 이상' }
  ]},
  { key: 'exercise', question: '산책과 활동량은 어느 정도가 좋아요?', sub: '보호자 생활 리듬에 맞춰주세요', type: 'cards', defaultValue: 'any', options: [
    { value: 'any', label: '상관없음', desc: '균형 있게' },
    { value: 'low', label: '적음', desc: '하루 30분 이하' },
    { value: 'medium', label: '보통', desc: '30분~1시간' },
    { value: 'high', label: '많음', desc: '1시간 이상' }
  ]},
  { key: 'grooming', question: '미용 관리는 어느 정도 가능하세요?', sub: '빗질, 목욕, 미용 주기를 기준으로 골라주세요', type: 'cards', defaultValue: 'any', options: [
    { value: 'any', label: '상관없음', desc: '제한 없음' },
    { value: 'low', label: '적음', desc: '관리 편한 견종' },
    { value: 'medium', label: '보통', desc: '주기적 관리' },
    { value: 'high', label: '많음', desc: '미용도 가능' }
  ]},
  { key: 'trainability', question: '훈련 난이도는 어떤 쪽이 좋아요?', sub: '처음 키운다면 쉬운 쪽을 추천해요', type: 'cards', defaultValue: 'any', options: [
    { value: 'any', label: '상관없음', desc: '성향 우선' },
    { value: 'high', label: '쉬운 편', desc: '초보자 추천' },
    { value: 'medium', label: '보통', desc: '꾸준히 가능' },
    { value: 'low', label: '어려워도 OK', desc: '경험자 추천' }
  ]},
  { key: 'barking', question: '짖음 정도는 얼마나 중요해요?', sub: '주거 환경을 생각해서 골라주세요', type: 'cards', defaultValue: 'any', options: [
    { value: 'any', label: '상관없음', desc: '환경과 함께 판단' },
    { value: 'low', label: '적음', desc: '조용한 견종' },
    { value: 'medium', label: '보통', desc: '일반적인 수준' },
    { value: 'high', label: '많아도 OK', desc: '표현 활발' }
  ]},
  { key: 'environment', question: '생활 환경을 알려주세요', sub: '해당되는 항목을 선택해주세요', type: 'flags', required: false, options: [
    { key: 'childFriendly', label: '아이와 함께', desc: '아이 친화 우선' },
    { key: 'apartmentFriendly', label: '아파트 거주', desc: '실내 생활 적합' }
  ]},
  { key: 'count', question: '몇 종을 추천받을까요?', sub: '원하는 추천 품종 수를 숫자로 입력해주세요', type: 'number', defaultValue: '3', min: 1, max: 20, required: true },
  { key: 'freeText', question: '추가 조건이 있나요?', sub: '없으면 바로 추천받아도 돼요', type: 'textarea', placeholder: '예: 털이 잘 안 빠지는 견종, 혼자 있는 시간이 많아요, 처음 키우는 초보예요...', required: false }
];

function renderBreedRecommendUI() {
  return `
    <input type="hidden" id="rec-size" value="any">
    <input type="hidden" id="rec-exercise" value="any">
    <input type="hidden" id="rec-grooming" value="any">
    <input type="hidden" id="rec-trainability" value="any">
    <input type="hidden" id="rec-barking" value="any">
    <input type="hidden" id="rec-count" value="3">
    <input type="checkbox" id="rec-child" style="display:none;">
    <input type="checkbox" id="rec-apartment" style="display:none;">
    <textarea id="rec-freetext" style="display:none;"></textarea>

    <section class="breed-recommend-hero">
      <div class="breed-recommend-card">
        <div class="breed-recommend-card__kicker">AI 맞춤 견종 찾기</div>
        <h2>우리 가족에게 맞는 견종을 더 선명하게 찾아요</h2>
        <p>생활 리듬, 주거 환경, 관리 여유를 차례로 정리하면 Pawsitive가 어울리는 품종 후보를 좁혀드려요.</p>
        <div class="breed-recommend-card__features">
          <span>초보자 적합</span>
          <span>아파트 생활</span>
          <span>관리 난이도</span>
        </div>
        <button id="rec-submit-btn" class="btn btn-primary" onclick="openBreedRecommendFlow()">추천 시작하기</button>
      </div>
      <div class="breed-recommend-photo">
        <div class="breed-recommend-photo__copy">
          <strong>생활 패턴으로 좁혀보는 추천</strong>
          <span>크기, 활동량, 관리 난이도를 기준으로 후보를 비교해요.</span>
        </div>
      </div>
    </section>

    <div id="breed-recommend-result"></div>
  `;
}

function openBreedRecommendFlow() {
  _breedRecStep = 0;
  _breedRecData = {
    size: 'any',
    exercise: 'any',
    grooming: 'any',
    trainability: 'any',
    barking: 'any',
    childFriendly: false,
    apartmentFriendly: false,
    count: '3',
    freeText: ''
  };

  document.getElementById('breed-rec-modal')?.remove();
  const app = document.getElementById('app');
  app.innerHTML += `
    <div id="breed-rec-modal" style="position:fixed; inset:0; z-index:5000; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:#fff; border-radius:20px; width:100%; max-width:420px; min-height:380px; padding:40px 32px; position:relative; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.15);">
          <button onclick="closeBreedRecommendFlow()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.2rem; color:#999; cursor:pointer;">✕</button>
          <div id="breed-rec-progress" style="display:flex; gap:4px; margin-bottom:32px;"></div>
          <div id="breed-rec-content" style="flex:1; display:flex; flex-direction:column;"></div>
        </div>
      </div>
    </div>
  `;
  renderBreedRecStep();
}

function closeBreedRecommendFlow() {
  document.getElementById('breed-rec-modal')?.remove();
}

function renderBreedRecStep() {
  const step = _breedRecommendSteps[_breedRecStep];
  const total = _breedRecommendSteps.length;
  const content = document.getElementById('breed-rec-content');
  const progress = document.getElementById('breed-rec-progress');
  if (!step || !content || !progress) return;

  progress.innerHTML = Array.from({ length: total }, (_, i) =>
    `<div style="flex:1; height:3px; border-radius:2px; background:${i <= _breedRecStep ? '#1a1a1a' : '#e5e3e0'}; transition:background 0.3s;"></div>`
  ).join('');

  let inputHtml = '';
  if (step.type === 'cards') {
    const current = _breedRecData[step.key] || step.defaultValue || '';
    inputHtml = `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:24px;">
      ${step.options.map(opt => `
        <button onclick="selectBreedRecCard('${step.key}','${opt.value}')" style="flex:1; min-width:90px; padding:16px 12px; border:1.5px solid ${current === opt.value ? '#1a1a1a' : '#e5e3e0'}; border-radius:14px; background:${current === opt.value ? '#f5f3f0' : '#fff'}; text-align:center; cursor:pointer; transition:all 0.15s;">
          <div style="font-size:0.92rem; font-weight:700; color:#1a1a1a;">${opt.label}</div>
          <div style="font-size:0.7rem; color:#999; margin-top:3px;">${opt.desc}</div>
        </button>
      `).join('')}
    </div>`;
  } else if (step.type === 'flags') {
    inputHtml = `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:24px;">
      ${step.options.map(opt => `
        <button onclick="toggleBreedRecFlag('${opt.key}')" style="flex:1; min-width:120px; padding:16px 12px; border:1.5px solid ${_breedRecData[opt.key] ? '#1a1a1a' : '#e5e3e0'}; border-radius:14px; background:${_breedRecData[opt.key] ? '#f5f3f0' : '#fff'}; text-align:center; cursor:pointer; transition:all 0.15s;">
          <div style="font-size:0.92rem; font-weight:700; color:#1a1a1a;">${opt.label}</div>
          <div style="font-size:0.7rem; color:#999; margin-top:3px;">${opt.desc}</div>
        </button>
      `).join('')}
    </div>`;
  } else if (step.type === 'number') {
    inputHtml = `<input type="number" id="breed-rec-input" class="form-input" min="${step.min || 1}" max="${step.max || 20}" value="${_breedRecData[step.key] || step.defaultValue || '3'}" style="font-size:1.1rem; padding:14px 16px; border-radius:12px; margin-top:24px; text-align:center; font-weight:800;" autofocus onkeydown="if(event.key==='Enter')nextBreedRecStep()">
      <p style="text-align:center; color:#999; font-size:0.78rem; margin:8px 0 0;">${step.min || 1}~${step.max || 20}종 입력 가능</p>`;
  } else if (step.type === 'textarea') {
    inputHtml = `<textarea id="breed-rec-input" class="form-input" placeholder="${step.placeholder || ''}" rows="3" style="font-size:1rem; padding:14px 16px; border-radius:12px; margin-top:24px; resize:none;">${_breedRecData[step.key] || ''}</textarea>`;
  }

  const isLast = _breedRecStep === total - 1;
  const canSkip = !step.required;

  content.innerHTML = `
    <div style="flex:1;">
      <h2 style="font-size:1.4rem; font-weight:700; letter-spacing:-0.5px; line-height:1.3;">${step.question}</h2>
      ${step.sub ? `<p style="font-size:0.88rem; color:#999; margin-top:6px;">${step.sub}</p>` : ''}
      ${inputHtml}
    </div>
    <div style="display:flex; gap:8px; margin-top:24px;">
      ${_breedRecStep > 0 ? `<button onclick="prevBreedRecStep()" style="flex:1; padding:14px; border:1.5px solid #e5e3e0; border-radius:12px; background:#fff; font-size:0.9rem; font-weight:600; cursor:pointer;">이전</button>` : ''}
      ${canSkip ? `<button onclick="skipBreedRecStep()" style="flex:1; padding:14px; border:1.5px solid #e5e3e0; border-radius:12px; background:#fff; font-size:0.9rem; font-weight:600; color:#999; cursor:pointer;">건너뛰기</button>` : ''}
      <button onclick="${isLast ? 'finishBreedRecommendFlow()' : 'nextBreedRecStep()'}" style="flex:2; padding:14px; border:none; border-radius:12px; background:#1a1a1a; color:#fff; font-size:0.9rem; font-weight:700; cursor:pointer; transition:opacity 0.15s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${isLast ? 'AI 맞춤 추천 받기' : '다음'}</button>
    </div>
  `;
  setTimeout(() => document.getElementById('breed-rec-input')?.focus(), 100);
}

function selectBreedRecCard(key, value) {
  _breedRecData[key] = value;
  renderBreedRecStep();
}

function toggleBreedRecFlag(key) {
  _breedRecData[key] = !_breedRecData[key];
  renderBreedRecStep();
}

function nextBreedRecStep() {
  const step = _breedRecommendSteps[_breedRecStep];
  const input = document.getElementById('breed-rec-input');
  if (input) _breedRecData[step.key] = input.value.trim();
  if (step.required && !_breedRecData[step.key]) { if (input) input.style.borderColor = '#e53e3e'; return; }
  if (_breedRecStep < _breedRecommendSteps.length - 1) { _breedRecStep++; renderBreedRecStep(); }
}

function prevBreedRecStep() {
  const step = _breedRecommendSteps[_breedRecStep];
  const input = document.getElementById('breed-rec-input');
  if (input) _breedRecData[step.key] = input.value.trim();
  if (_breedRecStep > 0) { _breedRecStep--; renderBreedRecStep(); }
}

function skipBreedRecStep() {
  const step = _breedRecommendSteps[_breedRecStep];
  if (step.type === 'textarea') _breedRecData[step.key] = '';
  if (_breedRecStep < _breedRecommendSteps.length - 1) { _breedRecStep++; renderBreedRecStep(); }
  else finishBreedRecommendFlow();
}

function finishBreedRecommendFlow() {
  const step = _breedRecommendSteps[_breedRecStep];
  const input = document.getElementById('breed-rec-input');
  if (input) _breedRecData[step.key] = input.value.trim();

  document.getElementById('rec-size').value = _breedRecData.size || 'any';
  document.getElementById('rec-exercise').value = _breedRecData.exercise || 'any';
  document.getElementById('rec-grooming').value = _breedRecData.grooming || 'any';
  document.getElementById('rec-trainability').value = _breedRecData.trainability || 'any';
  document.getElementById('rec-barking').value = _breedRecData.barking || 'any';
  document.getElementById('rec-count').value = String(Math.min(20, Math.max(1, parseInt(_breedRecData.count, 10) || 3)));
  document.getElementById('rec-child').checked = !!_breedRecData.childFriendly;
  document.getElementById('rec-apartment').checked = !!_breedRecData.apartmentFriendly;
  document.getElementById('rec-freetext').value = _breedRecData.freeText || '';

  closeBreedRecommendFlow();
  handleBreedRecommend();
}

// --- AI 품종 추천 요청 핸들러 ---
async function handleBreedRecommend() {
  const btn = document.getElementById('rec-submit-btn');
  const resultEl = document.getElementById('breed-recommend-result');

  const preferences = {
    size: document.getElementById('rec-size')?.value || 'any',
    exerciseLevel: document.getElementById('rec-exercise')?.value || 'any',
    groomingLevel: document.getElementById('rec-grooming')?.value || 'any',
    trainability: document.getElementById('rec-trainability')?.value || 'any',
    barkingLevel: document.getElementById('rec-barking')?.value || 'any',
    childFriendly: document.getElementById('rec-child')?.checked || false,
    apartmentFriendly: document.getElementById('rec-apartment')?.checked || false,
    freeText: document.getElementById('rec-freetext')?.value?.trim() || ''
  };
  const count = Math.min(20, Math.max(1, parseInt(document.getElementById('rec-count')?.value, 10) || 3));

  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="breed-recommend-btn-loading"><span class="spinner"></span><span>AI가 분석 중...</span></span>'; }
  if (resultEl) resultEl.innerHTML = `
    <div class="card breed-recommend-loading-card">
      <video class="breed-recommend-loading-video" src="/pawsitive_loading.mp4" autoplay muted loop playsinline preload="auto" aria-label="Pawsitive 로딩 중"></video>
    </div>
  `;

  try {
    const res = await fetch('/api/ai/recommend-breed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences, count })
    });
    const data = await res.json();

    if (data.success && data.recommendations) {
      resultEl.innerHTML = renderBreedRecommendResult(data);
      // 추천 결과 견종 이미지 로드
      setTimeout(() => BreedImageService.loadAll(), 100);
    } else if (data.success && data.rawReply) {
      // JSON 파싱 실패 시 원본 텍스트 표시
      const formatted = data.rawReply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      resultEl.innerHTML = `<div class="card" style="padding:24px; line-height:1.8;">${formatted}</div>`;
    } else {
      resultEl.innerHTML = `<div class="alert alert-error">${data.error || '추천에 실패했어요. 다시 시도해주세요.'}</div>`;
    }
  } catch (e) {
    resultEl.innerHTML = `<div class="alert alert-error">서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.</div>`;
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '🤖 AI 맞춤 추천 받기'; }
}

// --- 추천 결과 렌더링 ---
function renderBreedRecommendResult(data) {
  const { recommendations, summary, totalCandidates } = data;
  let html = '';

  if (summary) {
    html += `
    <div class="breed-rec-summary">
      <p>${summary}</p>
      <span>${totalCandidates || '?'}종 중 ${recommendations.length}종</span>
    </div>`;
  }

  recommendations.forEach((rec, idx) => {
    const breed = BreedService.getById(rec.id);
    const sizeMap = { small: '소형', medium: '중형', large: '대형' };
    const rankLabel = String(idx + 1).padStart(2, '0');

    const prosHtml = (rec.pros || []).map(p => `<span class="breed-trait breed-trait--pro">${p}</span>`).join('');
    const consHtml = (rec.cons || []).map(c => `<span class="breed-trait breed-trait--con">${c}</span>`).join('');

    html += `
    <div class="breed-rec-result-card">
      <div class="breed-rec-result-card__img-wrap">
        <div class="breed-img" data-breed-id="${rec.id}" data-fit-contain style="width:100%; height:200px; background:#F5F3F0; display:flex; align-items:center; justify-content:center; font-size:3.5rem;">🐾</div>
        <span class="breed-rec-result-card__rank">${rankLabel}</span>
      </div>
      <div class="breed-rec-result-card__body">
        <div class="breed-rec-result-card__name-row">
          <h3>${rec.name}</h3>
          ${rec.nameEn ? `<span class="breed-rec-result-card__name-en">${rec.nameEn}</span>` : ''}
          ${breed ? `<span class="breed-rec-result-card__size">${sizeMap[breed.size] || ''}</span>` : ''}
        </div>
        <p class="breed-rec-result-card__reason">${rec.reason}</p>
        ${prosHtml || consHtml ? `<div class="breed-rec-result-card__traits">${prosHtml}${consHtml}</div>` : ''}
        ${rec.tip ? `<p class="breed-rec-result-card__tip">${rec.tip}</p>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/breeds/${rec.id}')">상세 정보 →</button>
      </div>
    </div>`;
  });

  return html;
}

function breedLevelPercent(level) {
  return ({ low: 34, medium: 64, high: 92 }[level] || 52);
}

function breedLevelText(level) {
  return ({ low: '낮음', medium: '보통', high: '높음' }[level] || '-');
}

function renderBreedCards(breeds) {
  if (breeds.length === 0) {
    return `<div class="empty-state" style="grid-column: 1/-1;">
      <div class="empty-icon">🔍</div>
      <p>검색 결과가 없습니다</p>
    </div>`;
  }
  const sizeMap = { small: '소형', medium: '중형', large: '대형' };
  return breeds.map(breed => `
    <article class="breed-atlas-card" onclick="Router.navigate('/breeds/${breed.id}')">
      <div class="breed-atlas-card__image breed-img" data-breed-id="${breed.id}" data-fit-contain>
        🐾
        <span class="breed-atlas-card__badge">${sizeMap[breed.size] || '견종'}</span>
      </div>
      <div class="breed-atlas-card__body">
        <div class="breed-atlas-card__name">
          <strong>${breed.name}</strong>
          ${breed.nameEn ? `<span>${breed.nameEn}</span>` : ''}
        </div>
        <div class="breed-atlas-card__text">${breed.personality || '성격 정보가 준비 중이에요.'}</div>
        <div class="breed-trait-bars">
          <div class="breed-trait-bar">
            <span>활동량</span>
            <div class="breed-trait-bar__track"><span style="width:${breedLevelPercent(breed.exerciseLevel)}%;"></span></div>
            <strong>${breedLevelText(breed.exerciseLevel)}</strong>
          </div>
          <div class="breed-trait-bar">
            <span>미용</span>
            <div class="breed-trait-bar__track"><span style="width:${breedLevelPercent(breed.groomingLevel)}%;"></span></div>
            <strong>${breedLevelText(breed.groomingLevel)}</strong>
          </div>
          <div class="breed-trait-bar">
            <span>훈련</span>
            <div class="breed-trait-bar__track"><span style="width:${breedLevelPercent(breed.trainability)}%;"></span></div>
            <strong>${breedLevelText(breed.trainability)}</strong>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function handleBreedSearch(keyword) {
  const filtered = BreedService.search(keyword);
  const list = document.getElementById('breed-list');
  if (list) {
    list.innerHTML = renderBreedCards(filtered);
    setTimeout(() => BreedImageService.loadAll(), 100);
  }
}

// --- 품종 상세 페이지 ---
function renderBreedDetailPage(params) {
  const breed = BreedService.getById(params.id);
  if (!breed) {
    renderPage(`
      <div class="not-found">
        <div class="nf-icon">🐾</div>
        <h2>품종을 찾을 수 없습니다</h2>
        <p>요청하신 품종 정보가 존재하지 않습니다.</p>
        <button class="btn btn-primary" onclick="Router.navigate('/breeds')">품종 목록으로</button>
      </div>
    `);
    return;
  }

  const sizeMap = { small: '소형', medium: '중형', large: '대형' };
  const levelMap = { low: '낮음', medium: '보통', high: '높음' };
  const levelColor = { low: 'badge-success', medium: 'badge-info', high: 'badge-error' };

  renderPage(`
    <style>
      .breed-detail-page { max-width:1040px; margin:0 auto; padding:8px 0 44px; color:#0B1220; }
      .breed-detail-back { margin-bottom:14px; }
      .breed-detail-hero { display:grid; grid-template-columns:minmax(0,.92fr) minmax(320px,1fr); gap:18px; align-items:stretch; margin-bottom:18px; }
      .breed-detail-copy { padding:30px; border:1px solid #DDE6F0; border-radius:8px; background:#fff; box-shadow:0 18px 44px rgba(15,23,42,.065); }
      .breed-detail-copy__kicker { display:inline-flex; padding:6px 10px; border-radius:999px; background:#EFF6FF; color:#175CD3; font-size:.72rem; font-weight:950; margin-bottom:14px; }
      .breed-detail-copy h1 { margin:0 0 8px; font-size:2.05rem; line-height:1.16; font-weight:950; letter-spacing:0; }
      .breed-detail-copy h1 span { display:block; margin-top:6px; color:#94A3B8; font-size:.9rem; font-weight:850; }
      .breed-detail-copy p { margin:16px 0 0; color:#52637A; line-height:1.68; font-size:.92rem; }
      .breed-detail-badges { display:flex; flex-wrap:wrap; gap:7px; margin-top:14px; }
      .breed-detail-badges span { padding:7px 10px; border-radius:999px; background:#F8FAFC; border:1px solid #E2E8F0; color:#334155; font-size:.74rem; font-weight:950; }
      .breed-detail-image { min-height:360px; border:1px solid #DDE6F0; border-radius:8px; overflow:hidden; background:#F8FAFC; display:flex; align-items:center; justify-content:center; font-size:4.5rem; box-shadow:0 18px 44px rgba(15,23,42,.075); }
      .breed-detail-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
      .breed-detail-metric { padding:18px; border:1px solid #DDE6F0; border-radius:8px; background:#fff; text-align:center; }
      .breed-detail-metric span { display:block; color:#8290A3; font-size:.72rem; font-weight:900; margin-bottom:6px; }
      .breed-detail-metric strong { color:#0B1220; font-size:.98rem; font-weight:950; }
      .breed-detail-traits { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
      .breed-detail-trait { padding:16px; border:1px solid #DDE6F0; border-radius:8px; background:#fff; }
      .breed-detail-trait__top { display:flex; justify-content:space-between; align-items:center; gap:8px; color:#64748B; font-size:.72rem; font-weight:950; margin-bottom:9px; }
      .breed-detail-trait__bar { height:8px; border-radius:999px; overflow:hidden; background:#E2E8F0; }
      .breed-detail-trait__bar span { display:block; height:100%; border-radius:999px; background:#2563EB; }
      .breed-detail-trait:nth-child(2) .breed-detail-trait__bar span { background:#0F766E; }
      .breed-detail-trait:nth-child(3) .breed-detail-trait__bar span { background:#F97316; }
      .breed-detail-ai { padding:22px; border:1px solid #DDE6F0; border-radius:8px; background:#fff; box-shadow:0 16px 38px rgba(15,23,42,.055); }
      @media (max-width:820px) { .breed-detail-hero, .breed-detail-metrics, .breed-detail-traits { grid-template-columns:1fr; } .breed-detail-image { min-height:280px; } .breed-detail-copy { padding:24px 18px; } }
    </style>
    <div class="breed-detail-page">
      <button class="btn btn-secondary btn-sm breed-detail-back" onclick="Router.navigate('/breeds')">← 목록으로</button>
      <section class="breed-detail-hero">
        <div class="breed-detail-copy">
          <div class="breed-detail-copy__kicker">품종 프로필</div>
          <h1>${breed.name} ${breed.nameEn ? '<span>' + breed.nameEn + '</span>' : ''}</h1>
          <div class="breed-detail-badges">
            <span>${sizeMap[breed.size]}</span>
            ${breed.group ? '<span>' + breed.group + '</span>' : ''}
            ${breed.origin ? '<span>' + breed.origin + '</span>' : ''}
          </div>
          <p>${breed.personality}</p>
        </div>
        <div id="breed-detail-img" class="breed-detail-image" data-breed-id="${breed.id}" data-fit-contain>🐾</div>
      </section>

      ${breed.lifespan || breed.weight || breed.height ? `
      <div class="breed-detail-metrics">
        ${breed.lifespan ? '<div class="breed-detail-metric"><span>수명</span><strong>' + breed.lifespan + '</strong></div>' : ''}
        ${breed.weight ? '<div class="breed-detail-metric"><span>체중</span><strong>' + breed.weight + '</strong></div>' : ''}
        ${breed.height ? '<div class="breed-detail-metric"><span>키</span><strong>' + breed.height + '</strong></div>' : ''}
      </div>
      ` : ''}

      <div class="breed-detail-traits">
        <div class="breed-detail-trait">
          <div class="breed-detail-trait__top"><span>운동량</span><strong>${levelMap[breed.exerciseLevel]}</strong></div>
          <div class="breed-detail-trait__bar"><span style="width:${breedLevelPercent(breed.exerciseLevel)}%;"></span></div>
        </div>
        ${breed.groomingLevel ? '<div class="breed-detail-trait"><div class="breed-detail-trait__top"><span>미용 관리</span><strong>' + levelMap[breed.groomingLevel] + '</strong></div><div class="breed-detail-trait__bar"><span style="width:' + breedLevelPercent(breed.groomingLevel) + '%;"></span></div></div>' : ''}
        ${breed.trainability ? '<div class="breed-detail-trait"><div class="breed-detail-trait__top"><span>훈련 난이도</span><strong>' + levelMap[breed.trainability] + '</strong></div><div class="breed-detail-trait__bar"><span style="width:' + breedLevelPercent(breed.trainability) + '%;"></span></div></div>' : ''}
      </div>

    ${breed.cautions ? '<div class="detail-section"><h3>주의사항</h3><ul style="padding-left:20px;">' + breed.cautions.map(c => '<li style="margin-bottom:4px;">' + c + '</li>').join('') + '</ul></div>' : ''}

    ${breed.healthIssues ? '<div class="detail-section"><h3>주요 건강 문제</h3><ul style="padding-left:20px;">' + breed.healthIssues.map(h => '<li style="margin-bottom:4px;">' + h + '</li>').join('') + '</ul></div>' : ''}

    ${breed.dietTips ? '<div class="detail-section"><h3>식이 가이드</h3><p>' + breed.dietTips + '</p></div>' : ''}

    ${breed.exerciseTips ? '<div class="detail-section"><h3>운동 가이드</h3><p>' + breed.exerciseTips + '</p></div>' : ''}

    ${breed.groomingTips ? '<div class="detail-section"><h3>미용/관리 가이드</h3><p>' + breed.groomingTips + '</p></div>' : ''}

    ${breed.funFact ? '<div class="card" style="padding:20px; margin-bottom:16px; background:var(--color-bg-warm);"><h3 style="margin-bottom:8px;">알고 계셨나요?</h3><p style="font-size:0.9rem;">' + breed.funFact + '</p></div>' : ''}

    <div class="breed-detail-ai" style="margin-top:20px;">
      <h3 style="margin-bottom:12px;">AI에게 ${breed.name}에 대해 물어보기</h3>
      <div id="breed-ai-result"></div>
      <div style="display:flex; gap:8px;">
        <input type="text" id="breed-ai-input" class="form-input" placeholder="${breed.name}에 대해 궁금한 점을 물어보세요~" style="flex:1;" onkeydown="if(event.key==='Enter')handleBreedAiQuestion('${breed.name}')">
        <button class="btn btn-primary" onclick="handleBreedAiQuestion('${breed.name}')" id="breed-ai-btn">질문하기</button>
      </div>
    </div>
    </div>
  `);
  // 견종 상세 이미지 로드
  setTimeout(() => {
    const imgEl = document.getElementById('breed-detail-img');
    if (imgEl) BreedImageService.loadInto(imgEl, breed, true);
  }, 100);
}

/**
 * 품종 AI 질문 핸들러
 */
async function handleBreedAiQuestion(breedName) {
  const input = document.getElementById('breed-ai-input');
  const resultEl = document.getElementById('breed-ai-result');
  const btn = document.getElementById('breed-ai-btn');
  const question = input?.value?.trim();

  if (!question) return;

  if (btn) { btn.disabled = true; btn.textContent = '답변 중...'; }
  if (resultEl) resultEl.innerHTML = '<div style="text-align:center; padding:16px;"><div class="spinner"></div></div>';

  try {
    const res = await fetch('/api/ai/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: breedName + '에 대한 질문: ' + question,
        history: []
      })
    });
    const data = await res.json();

    if (data.success) {
      const formatted = data.reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      resultEl.innerHTML = '<div style="background:var(--color-bg-warm); border-radius:12px; padding:16px; margin-bottom:12px; line-height:1.8; font-size:0.9rem;">' + formatted + '</div>';
    } else {
      resultEl.innerHTML = '<div class="alert alert-error">' + data.error + '</div>';
    }
  } catch (e) {
    resultEl.innerHTML = '<div class="alert alert-error">AI 응답에 실패했어요. 잠시 후 다시 시도해주세요.</div>';
  }

  if (btn) { btn.disabled = false; btn.textContent = '질문하기'; }
}
