// Pawsitive - Breeds Page
// --- 품종 목록 페이지 (탭: 백과사전 / AI 추천) ---
let breedPageTab = 'recommend'; // 'encyclopedia' | 'recommend'
let _breedRecDir = 1;

function renderBreedListPage() {
  renderPage(`
    <div class="page-header">
      <h1>🐕 품종 정보</h1>
      <p>우리 아이 품종의 특성과 주의사항을 알아봐요~</p>
    </div>
    <div class="breed-tabs" style="display:flex; gap:0; margin-bottom:20px; border-radius:12px; overflow:hidden; border:2px solid var(--color-primary);">
      <button id="tab-recommend" class="breed-tab ${breedPageTab === 'recommend' ? 'breed-tab--active' : ''}" onclick="switchBreedTab('recommend')" style="flex:1; padding:12px 16px; border:none; cursor:pointer; font-weight:700; font-size:0.95rem; transition:all 0.2s;">
        AI 맞춤 추천
      </button>
      <button id="tab-encyclopedia" class="breed-tab ${breedPageTab === 'encyclopedia' ? 'breed-tab--active' : ''}" onclick="switchBreedTab('encyclopedia')" style="flex:1; padding:12px 16px; border:none; cursor:pointer; font-weight:700; font-size:0.95rem; transition:all 0.2s;">
        품종 백과사전
      </button>
    </div>
    <div id="breed-tab-content"></div>
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
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" id="breed-search" placeholder="품종 이름으로 검색..." oninput="handleBreedSearch(this.value)">
      </div>
      <div class="grid-2" id="breed-list">
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
    <style>
      .breed-rec-start { padding:28px; margin-bottom:20px; text-align:center; }
      .breed-rec-start__icon { font-size:2.4rem; margin-bottom:12px; }
      .breed-rec-start h2 { margin-bottom:6px; }
      .breed-rec-start p { color:var(--color-text-muted); font-size:0.9rem; line-height:1.6; margin:0 auto 20px; max-width:360px; }
      .breed-rec-flow__progress { display:flex; gap:4px; margin-bottom:32px; }
      .breed-rec-flow__bar { flex:1; height:3px; border-radius:2px; background:#e5e3e0; transition:background 0.3s; }
      .breed-rec-flow__bar--on { background:#1a1a1a; }
      .breed-rec-flow__content { flex:1; display:flex; flex-direction:column; }
      .breed-rec-flow__title { font-size:1.4rem; font-weight:700; line-height:1.3; margin:0; }
      .breed-rec-flow__sub { font-size:0.88rem; color:#999; margin-top:6px; }
      .breed-rec-flow__cards { display:flex; flex-wrap:wrap; gap:10px; margin-top:24px; }
      .breed-rec-flow__card { flex:1; min-width:92px; padding:16px 12px; border:1.5px solid #e5e3e0; border-radius:14px; background:#fff; text-align:center; cursor:pointer; transition:all 0.15s; }
      .breed-rec-flow__card:hover { border-color:#1a1a1a; }
      .breed-rec-flow__card--selected { border-color:#1a1a1a; background:#f5f3f0; }
      .breed-rec-flow__label { font-size:0.92rem; font-weight:700; color:#1a1a1a; }
      .breed-rec-flow__desc { font-size:0.7rem; color:#999; margin-top:3px; line-height:1.35; }
      .breed-rec-flow__number { width:100%; margin-top:24px; padding:18px 16px; border:1.5px solid #e5e3e0; border-radius:14px; background:#fff; color:#1a1a1a; font-size:1.3rem; font-weight:800; text-align:center; outline:none; transition:border-color 0.15s, box-shadow 0.15s; }
      .breed-rec-flow__number:focus { border-color:#1a1a1a; box-shadow:0 0 0 3px rgba(26,26,26,0.08); }
      .breed-rec-flow__hint { margin-top:8px; color:#999; font-size:0.75rem; text-align:center; }
      .breed-rec-flow__actions { display:flex; gap:8px; margin-top:24px; }
      .breed-rec-flow__btn { padding:14px; border-radius:12px; font-size:0.9rem; font-weight:700; cursor:pointer; transition:opacity 0.15s; }
      .breed-rec-flow__btn--ghost { flex:1; border:1.5px solid #e5e3e0; background:#fff; color:#1a1a1a; }
      .breed-rec-flow__btn--muted { flex:1; border:1.5px solid #e5e3e0; background:#fff; color:#999; }
      .breed-rec-flow__btn--primary { flex:2; border:none; background:#1a1a1a; color:#fff; }
      .breed-rec-flow__btn--primary:hover { opacity:0.85; }
      .breed-rec-modal__stage { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px; overflow:hidden; z-index:2; }
      .breed-rec-modal__card { background:#fff; border-radius:20px; width:100%; max-width:420px; min-height:380px; padding:40px 32px; position:relative; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.15); z-index:2; animation:modalSlideUp 0.28s ease both; }
      @media (max-width:520px) {
        .breed-rec-flow__card { min-width:120px; }
        .breed-rec-modal__stage { padding:14px; align-items:flex-end; }
        .breed-rec-modal__card { padding:36px 24px 28px; min-height:360px; border-radius:20px 20px 0 0; }
      }
    </style>

    <input type="hidden" id="rec-size" value="any">
    <input type="hidden" id="rec-exercise" value="any">
    <input type="hidden" id="rec-grooming" value="any">
    <input type="hidden" id="rec-trainability" value="any">
    <input type="hidden" id="rec-barking" value="any">
    <input type="hidden" id="rec-count" value="3">
    <input type="checkbox" id="rec-child" style="display:none;">
    <input type="checkbox" id="rec-apartment" style="display:none;">
    <textarea id="rec-freetext" style="display:none;"></textarea>

    <div class="card breed-rec-start">
      <div class="breed-rec-start__icon">🐾</div>
      <h2>나에게 맞는 반려견 찾기</h2>
      <p>생활 패턴, 주거 환경, 선호도를 바탕으로 383종 중 딱 맞는 견종을 골라드려요.</p>
      <button class="btn btn-primary" onclick="openBreedRecommendFlow()" style="width:100%; max-width:320px; padding:14px; font-weight:800;">추천 시작하기</button>
    </div>

    <div id="breed-recommend-result"></div>
  `;
}

function openBreedRecommendFlow() {
  _breedRecStep = 0;
  _breedRecDir = 1;
  _breedRecData = {
    size: 'any', exercise: 'any', grooming: 'any',
    trainability: 'any', barking: 'any',
    childFriendly: false, apartmentFriendly: false,
    count: '3', freeText: ''
  };

  document.getElementById('breed-rec-modal')?.remove();
  const app = document.getElementById('app');
  app.innerHTML += `
    <style id="brf-styles">
      @keyframes brfSU  { from{transform:translateY(100%)} to{transform:translateY(0)} }
      @keyframes brfFwd { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:none} }
      @keyframes brfBwd { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:none} }
      .brf-fwd  { animation:brfFwd 0.26s cubic-bezier(.4,0,.2,1) both }
      .brf-bwd  { animation:brfBwd 0.26s cubic-bezier(.4,0,.2,1) both }
      .brf-dot  { width:6px;height:6px;border-radius:3px;background:#E5E3E0;transition:all 0.3s }
      .brf-dot-on   { width:22px;background:#C8553D }
      .brf-dot-done { background:#588B8B }
      .brf-opt { flex:1;min-width:80px;padding:14px 10px;border:1.5px solid #E5E3E0;border-radius:14px;background:#fff;text-align:center;cursor:pointer;transition:all 0.15s;box-sizing:border-box }
      .brf-opt:hover { border-color:#1a1a1a;background:#F5F3F0 }
      .brf-opt-sel   { border-color:#C8553D;background:#F9EEEB }
    </style>
    <div id="breed-rec-modal"
      onclick="if(event.target===this)closeBreedRecommendFlow()"
      style="position:fixed;inset:0;z-index:5000;background:rgba(0,0,0,0.52);backdrop-filter:blur(4px);">
      <div style="position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;z-index:2;">
        <div style="background:#FAFAF8;border-radius:28px 28px 0 0;width:100%;max-width:480px;height:86vh;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,0.18);animation:brfSU 0.3s cubic-bezier(.4,0,.2,1);overflow:hidden;">
          <div style="padding:12px 0 4px;display:flex;justify-content:center;flex-shrink:0;">
            <div style="width:36px;height:4px;background:#D1CFC9;border-radius:2px;"></div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 20px 10px;flex-shrink:0;">
            <button id="brf-back-btn" onclick="prevBreedRecStep()"
              style="width:36px;height:36px;border-radius:50%;border:none;background:#F5F3F0;font-size:1.4rem;font-weight:300;color:#1a1a1a;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;opacity:0;pointer-events:none;transition:opacity 0.2s;">‹</button>
            <div id="breed-rec-progress" style="display:flex;gap:6px;align-items:center;"></div>
            <button onclick="closeBreedRecommendFlow()"
              style="width:36px;height:36px;border-radius:50%;border:none;background:#F5F3F0;font-size:0.82rem;color:#6B6B6B;cursor:pointer;">✕</button>
          </div>
          <div id="breed-rec-content" style="flex:1;overflow-y:auto;padding:0 24px 32px;"></div>
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
  const backBtn = document.getElementById('brf-back-btn');
  if (!step || !content || !progress) return;

  progress.innerHTML = Array.from({length: total}, (_, i) => {
    const cls = i === _breedRecStep ? 'brf-dot brf-dot-on' : i < _breedRecStep ? 'brf-dot brf-dot-done' : 'brf-dot';
    return `<div class="${cls}"></div>`;
  }).join('');

  if (backBtn) {
    backBtn.style.opacity = _breedRecStep > 0 ? '1' : '0';
    backBtn.style.pointerEvents = _breedRecStep > 0 ? 'auto' : 'none';
  }

  const ilMap = { size:{e:'📏',bg:'#F9EEEB'}, exercise:{e:'🏃',bg:'#E4EFEF'}, grooming:{e:'✂️',bg:'#FAF6F0'}, trainability:{e:'🎓',bg:'#E4EFEF'}, barking:{e:'🔊',bg:'#F9EEEB'}, environment:{e:'🏠',bg:'#FAF6F0'}, count:{e:'🔢',bg:'#F9EEEB'}, freeText:{e:'💬',bg:'#E4EFEF'} };
  const il = ilMap[step.key] || {e:'🐾',bg:'#F5F3F0'};

  let inputHtml = '';
  if (step.type === 'cards') {
    const current = _breedRecData[step.key] || step.defaultValue || '';
    inputHtml = `<div style="display:flex;flex-wrap:wrap;gap:10px;">
      ${step.options.map(opt => `
        <button type="button" onclick="selectBreedRecCard('${step.key}','${opt.value}',this)"
          class="brf-opt ${current === opt.value ? 'brf-opt-sel' : ''}">
          <div style="font-size:0.92rem;font-weight:700;color:#1a1a1a;">${opt.label}</div>
          <div style="font-size:0.72rem;color:#999;margin-top:3px;">${opt.desc}</div>
        </button>`).join('')}
    </div>`;
  } else if (step.type === 'flags') {
    inputHtml = `<div style="display:flex;flex-wrap:wrap;gap:10px;">
      ${step.options.map(opt => `
        <button type="button" onclick="toggleBreedRecFlag('${opt.key}')"
          class="brf-opt ${_breedRecData[opt.key] ? 'brf-opt-sel' : ''}">
          <div style="font-size:0.92rem;font-weight:700;color:#1a1a1a;">${opt.label}</div>
          <div style="font-size:0.72rem;color:#999;margin-top:3px;">${opt.desc}</div>
        </button>`).join('')}
    </div>`;
  } else if (step.type === 'textarea') {
    inputHtml = `<textarea id="breed-rec-input" class="form-input"
      placeholder="${step.placeholder || ''}" rows="4"
      style="font-size:1rem;padding:14px 16px;border-radius:14px;resize:none;"
      >${_breedRecData[step.key] || ''}</textarea>`;
  } else if (step.type === 'number') {
    const cur = _breedRecData[step.key] || step.defaultValue || '';
    inputHtml = `
      <input id="breed-rec-input" type="number" inputmode="numeric"
        min="${step.min||1}" max="${step.max||20}" step="1" value="${cur}"
        style="width:100%;padding:18px;border:1.5px solid #E5E3E0;border-radius:14px;background:#fff;font-size:1.6rem;font-weight:800;text-align:center;outline:none;transition:border-color 0.15s;box-sizing:border-box;"
        onfocus="this.style.borderColor='#C8553D'" onblur="this.style.borderColor='#E5E3E0'"
        onkeydown="if(event.key==='Enter')nextBreedRecStep()">
      <p style="text-align:center;color:#A0A0A0;font-size:0.78rem;margin:8px 0 0;">${step.min||1}~${step.max||20}종 입력 가능</p>
    `;
  }

  const isLast = _breedRecStep === total - 1;
  const canSkip = !step.required;
  const animClass = _breedRecDir >= 0 ? 'brf-fwd' : 'brf-bwd';

  content.innerHTML = `
    <div class="${animClass}" style="display:flex;flex-direction:column;min-height:100%;padding-top:4px;">
      <div style="display:flex;justify-content:center;padding:8px 0 20px;">
        <div style="width:88px;height:88px;border-radius:26px;background:${il.bg};display:flex;align-items:center;justify-content:center;font-size:2.6rem;">${il.e}</div>
      </div>
      <h2 style="font-size:1.4rem;font-weight:900;color:#1a1a1a;letter-spacing:-0.4px;line-height:1.3;margin:0 0 6px;">${step.question}</h2>
      ${step.sub ? `<p style="font-size:0.88rem;color:#6B6B6B;margin:0 0 18px;line-height:1.5;">${step.sub}</p>` : '<div style="margin-bottom:18px;"></div>'}
      ${inputHtml}
      <div style="flex:1;min-height:24px;"></div>
      <div style="display:flex;flex-direction:column;gap:10px;padding-top:8px;">
        <button id="rec-submit-btn"
          onclick="${isLast ? 'finishBreedRecommendFlow()' : 'nextBreedRecStep()'}"
          style="width:100%;padding:16px;border:none;border-radius:9999px;background:#1a1a1a;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;transition:opacity 0.15s;"
          onmouseenter="this.style.opacity='.85'" onmouseleave="this.style.opacity='1'">
          ${isLast ? 'AI 맞춤 추천 받기 ✨' : '다음'}
        </button>
        ${canSkip ? `<button onclick="skipBreedRecStep()" style="width:100%;padding:12px;border:none;background:transparent;color:#A0A0A0;font-size:0.9rem;font-weight:600;cursor:pointer;">건너뛰기</button>` : ''}
      </div>
    </div>
  `;
  setTimeout(() => document.getElementById('breed-rec-input')?.focus(), 80);
}

function selectBreedRecCard(key, value, el) {
  _breedRecData[key] = value;
  document.querySelectorAll('.brf-opt').forEach(b => b.classList.remove('brf-opt-sel'));
  if (el) el.classList.add('brf-opt-sel');
  setTimeout(() => { _breedRecDir = 1; nextBreedRecStep(); }, 220);
}

function toggleBreedRecFlag(key) {
  _breedRecData[key] = !_breedRecData[key];
  renderBreedRecStep();
}

function nextBreedRecStep() {
  const step = _breedRecommendSteps[_breedRecStep];
  const input = document.getElementById('breed-rec-input');
  if (input) _breedRecData[step.key] = input.value.trim();
  if (_breedRecStep < _breedRecommendSteps.length - 1) {
    _breedRecDir = 1;
    _breedRecStep++;
    renderBreedRecStep();
  }
}

function prevBreedRecStep() {
  const step = _breedRecommendSteps[_breedRecStep];
  const input = document.getElementById('breed-rec-input');
  if (input) _breedRecData[step.key] = input.value.trim();
  if (_breedRecStep > 0) {
    _breedRecDir = -1;
    _breedRecStep--;
    renderBreedRecStep();
  }
}

function skipBreedRecStep() {
  const step = _breedRecommendSteps[_breedRecStep];
  if (step.type === 'textarea') _breedRecData[step.key] = '';
  if (_breedRecStep < _breedRecommendSteps.length - 1) {
    _breedRecDir = 1;
    _breedRecStep++;
    renderBreedRecStep();
  } else {
    finishBreedRecommendFlow();
  }
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
  const normalizedCount = Math.min(20, Math.max(1, parseInt(_breedRecData.count, 10) || 3));
  document.getElementById('rec-count').value = String(normalizedCount);
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

  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> AI가 분석 중...'; }
  if (resultEl) resultEl.innerHTML = `
    <div class="card" style="padding:40px; text-align:center;">
      <div class="spinner" style="margin:0 auto 16px;"></div>
      <p style="color:var(--color-text-muted);">383종의 품종 데이터를 분석하고 있어요...</p>
      <p style="color:var(--color-text-muted); font-size:0.85rem;">잠시만 기다려주세요 🐾</p>
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

function renderBreedCards(breeds) {
  if (breeds.length === 0) {
    return `<div class="empty-state" style="grid-column: 1/-1;">
      <div class="empty-icon">🔍</div>
      <p>검색 결과가 없습니다</p>
    </div>`;
  }
  const sizeMap = { small: '소형', medium: '중형', large: '대형' };
  const exerciseMap = { low: '낮음', medium: '보통', high: '높음' };
  return breeds.map(breed => `
    <div class="card" onclick="Router.navigate('/breeds/${breed.id}')" style="cursor:pointer;">
      <div class="card__image breed-img" data-breed-id="${breed.id}" style="background: #F5F3F0; display:flex; align-items:center; justify-content:center; font-size:2.8rem; position:relative;">🐾</div>
      <div class="card__body">
        <div class="card__title">${breed.name}</div>
        <div class="card__subtitle">
          <span class="badge badge-primary">${sizeMap[breed.size]}</span>
          <span class="badge badge-info" style="margin-left:4px;">운동량: ${exerciseMap[breed.exerciseLevel]}</span>
        </div>
        <div class="card__text" style="margin-top:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${breed.personality}
        </div>
      </div>
    </div>
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
    <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/breeds')" style="margin-bottom:16px;">← 목록으로</button>
    <div class="detail-header">
      <div id="breed-detail-img" data-breed-id="${breed.id}" data-fit-contain style="width:100%; height:300px; background: #F5F3F0; border-radius: var(--radius-lg); display:flex; align-items:center; justify-content:center; font-size:4.5rem; margin-bottom:16px; position:relative;">🐾</div>
      <h1>${breed.name} ${breed.nameEn ? '<span style="font-size:0.9rem; color:var(--color-text-light); font-weight:600;">' + breed.nameEn + '</span>' : ''}</h1>
      <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:6px;">
        <span class="badge badge-primary">${sizeMap[breed.size]}</span>
        ${breed.group ? '<span class="badge badge-info">' + breed.group + '</span>' : ''}
        ${breed.origin ? '<span class="badge badge-success">' + breed.origin + '</span>' : ''}
      </div>
    </div>

    ${breed.lifespan || breed.weight || breed.height ? `
    <div class="card" style="padding:20px; margin-bottom:16px;">
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:12px; text-align:center;">
        ${breed.lifespan ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">수명</div><div style="font-weight:800; margin-top:2px;">' + breed.lifespan + '</div></div>' : ''}
        ${breed.weight ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">체중</div><div style="font-weight:800; margin-top:2px;">' + breed.weight + '</div></div>' : ''}
        ${breed.height ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">키</div><div style="font-weight:800; margin-top:2px;">' + breed.height + '</div></div>' : ''}
      </div>
    </div>` : ''}

    <div class="card" style="padding:20px; margin-bottom:16px;">
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:12px; text-align:center;">
        <div><div style="font-size:0.75rem; color:var(--color-text-muted);">운동량</div><span class="badge ${levelColor[breed.exerciseLevel]}" style="margin-top:4px;">${levelMap[breed.exerciseLevel]}</span></div>
        ${breed.groomingLevel ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">미용 관리</div><span class="badge ' + levelColor[breed.groomingLevel] + '" style="margin-top:4px;">' + levelMap[breed.groomingLevel] + '</span></div>' : ''}
        ${breed.trainability ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">훈련 난이도</div><span class="badge ' + levelColor[breed.trainability] + '" style="margin-top:4px;">' + levelMap[breed.trainability] + '</span></div>' : ''}
        ${breed.barkingLevel ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">짖음</div><span class="badge ' + levelColor[breed.barkingLevel] + '" style="margin-top:4px;">' + levelMap[breed.barkingLevel] + '</span></div>' : ''}
        ${breed.childFriendly !== undefined ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">아이 친화</div><div style="font-weight:800; margin-top:4px;">' + (breed.childFriendly ? '⭕' : '❌') + '</div></div>' : ''}
        ${breed.apartmentFriendly !== undefined ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">아파트 적합</div><div style="font-weight:800; margin-top:4px;">' + (breed.apartmentFriendly ? '⭕' : '❌') + '</div></div>' : ''}
      </div>
    </div>

    <div class="detail-section">
      <h3>성격</h3>
      <p>${breed.personality}</p>
    </div>

    ${breed.cautions ? '<div class="detail-section"><h3>주의사항</h3><ul style="padding-left:20px;">' + breed.cautions.map(c => '<li style="margin-bottom:4px;">' + c + '</li>').join('') + '</ul></div>' : ''}

    ${breed.healthIssues ? '<div class="detail-section"><h3>주요 건강 문제</h3><ul style="padding-left:20px;">' + breed.healthIssues.map(h => '<li style="margin-bottom:4px;">' + h + '</li>').join('') + '</ul></div>' : ''}

    ${breed.dietTips ? '<div class="detail-section"><h3>식이 가이드</h3><p>' + breed.dietTips + '</p></div>' : ''}

    ${breed.exerciseTips ? '<div class="detail-section"><h3>운동 가이드</h3><p>' + breed.exerciseTips + '</p></div>' : ''}

    ${breed.groomingTips ? '<div class="detail-section"><h3>미용/관리 가이드</h3><p>' + breed.groomingTips + '</p></div>' : ''}

    ${breed.funFact ? '<div class="card" style="padding:20px; margin-bottom:16px; background:var(--color-bg-warm);"><h3 style="margin-bottom:8px;">알고 계셨나요?</h3><p style="font-size:0.9rem;">' + breed.funFact + '</p></div>' : ''}

    <div class="card" style="padding:24px; margin-top:20px;">
      <h3 style="margin-bottom:12px;">AI에게 ${breed.name}에 대해 물어보기</h3>
      <div id="breed-ai-result"></div>
      <div style="display:flex; gap:8px;">
        <input type="text" id="breed-ai-input" class="form-input" placeholder="${breed.name}에 대해 궁금한 점을 물어보세요~" style="flex:1;" onkeydown="if(event.key==='Enter')handleBreedAiQuestion('${breed.name}')">
        <button class="btn btn-primary" onclick="handleBreedAiQuestion('${breed.name}')" id="breed-ai-btn">질문하기</button>
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
