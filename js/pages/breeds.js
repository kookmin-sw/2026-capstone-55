// Pawsitive - Breeds Page
// Breed encyclopedia, recommendations, and detail views

let breedPageTab = 'recommend'; // 'encyclopedia' | 'recommend'

function renderBreedListPage() {
 renderPage(`
 <div class="page-header">
 <h1>품종 정보</h1>
 <p>우리 아이 품종의 특성과 주의사항을 알아봐요~</p>
 </div>
 <div class="breed-tabs" style="display:flex; gap:0; margin-bottom:20px; border-radius:12px; overflow:hidden; border:2px solid var(--color-primary, #7C4DFF);">
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
 <span class="search-icon">${icon('search',16)}</span>
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
function renderBreedRecommendUI() {
 return `
 <div style="padding:24px; margin-bottom:20px; border:1px solid var(--color-border); border-radius:16px; text-align:center;">
 <h2 style="margin-bottom:4px; font-size:1.1rem; font-weight:700;">나에게 맞는 반려견 찾기</h2>
 <p style="color:var(--color-text-muted); margin-bottom:20px; font-size:0.85rem;">생활 환경과 선호도를 선택하면 AI가 맞춤 추천해드려요</p>
 <button class="btn btn-primary" onclick="openBreedRecFlow()" style="padding:14px 32px; font-size:0.95rem;">추천 시작하기</button>
 </div>
 <div id="breed-recommend-result"></div>
 <div id="breed-rec-modal" style="display:none; position:fixed; inset:0; z-index:5000; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
 <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px;">
 <div style="background:#fff; border-radius:20px; width:100%; max-width:540px; min-height:440px; padding:48px 40px; position:relative; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.15);">
 <button onclick="closeBreedRecFlow()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.2rem; color:#999; cursor:pointer;">✕</button>
 <div id="breed-rec-progress" style="display:flex; gap:4px; margin-bottom:32px;"></div>
 <div id="breed-rec-content" style="flex:1; display:flex; flex-direction:column;"></div>
 </div>
 </div>
 </div>
 `;
}

let _breedRecStep = 0;
let _breedRecData = {};
const _breedRecSteps = [
 { key: 'size', question: '선호하는 크기는?', type: 'cards', options: [
 { value: 'any', label: '상관없음', desc: '' }, { value: 'small', label: '소형', desc: '7kg 이하' },
 { value: 'medium', label: '중형', desc: '7~15kg' }, { value: 'large', label: '대형', desc: '15kg 이상' }
 ]},
 { key: 'exerciseLevel', question: '원하는 운동량은?', type: 'cards', options: [
 { value: 'any', label: '상관없음', desc: '' }, { value: 'low', label: '적음', desc: '하루 30분 이하' },
 { value: 'medium', label: '보통', desc: '30분~1시간' }, { value: 'high', label: '많음', desc: '1시간 이상' }
 ]},
 { key: 'groomingLevel', question: '미용 관리는?', type: 'cards', options: [
 { value: 'any', label: '상관없음', desc: '' }, { value: 'low', label: '적음', desc: '관리 편한' },
 { value: 'medium', label: '보통', desc: '' }, { value: 'high', label: '많음', desc: '미용 즐기는' }
 ]},
 { key: 'trainability', question: '훈련 용이성은?', type: 'cards', options: [
 { value: 'any', label: '상관없음', desc: '' }, { value: 'high', label: '높음', desc: '초보자도 쉽게' },
 { value: 'medium', label: '보통', desc: '' }, { value: 'low', label: '낮음', desc: '경험자 추천' }
 ]},
 { key: 'environment', question: '생활 환경은?', type: 'cards', options: [
 { value: 'apartment', label: '아파트', desc: '' }, { value: 'house', label: '주택/마당', desc: '' },
 { value: 'child', label: '아이가 있어요', desc: '' }, { value: 'any', label: '상관없음', desc: '' }
 ]},
 { key: 'freetext', question: '추가로 원하는 조건이 있나요?', sub: '없으면 건너뛰어도 돼요', type: 'textarea', placeholder: '예: 털이 잘 안 빠지는 견종, 처음 키우는 초보예요...', required: false }
];

function openBreedRecFlow() { _breedRecStep = 0; _breedRecData = {}; document.getElementById('breed-rec-modal').style.display = 'block'; renderBreedRecStep(); }
function closeBreedRecFlow() { document.getElementById('breed-rec-modal').style.display = 'none'; }

function renderBreedRecStep() {
 const step = _breedRecSteps[_breedRecStep]; const total = _breedRecSteps.length;
 const content = document.getElementById('breed-rec-content');
 const progress = document.getElementById('breed-rec-progress');
 progress.innerHTML = Array.from({length:total}, (_,i) => `<div style="flex:1; height:3px; border-radius:2px; background:${i <= _breedRecStep ? '#1a1a1a' : '#e5e3e0'};"></div>`).join('');
 let inputHtml = '';
 if (step.type === 'cards') {
 inputHtml = `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:24px;">${step.options.map(o => `<button onclick="selectBreedRecCard('${step.key}','${o.value}')" style="flex:1; min-width:90px; padding:18px 14px; border:2px solid ${_breedRecData[step.key]===o.value?'#1a1a1a':'#e5e3e0'}; border-radius:14px; background:${_breedRecData[step.key]===o.value?'#1a1a1a':'#fff'}; color:${_breedRecData[step.key]===o.value?'#fff':'#1a1a1a'}; text-align:center; cursor:pointer; transition:all 0.15s;"><div style="font-size:0.92rem; font-weight:700;">${o.label}</div>${o.desc ? `<div style="font-size:0.7rem; opacity:0.7; margin-top:3px;">${o.desc}</div>` : ''}</button>`).join('')}</div>`;
 } else if (step.type === 'textarea') {
 inputHtml = `<textarea id="breed-rec-input" class="form-input" placeholder="${step.placeholder||''}" rows="3" style="font-size:1rem; padding:14px 16px; border-radius:12px; margin-top:24px; resize:none;">${_breedRecData[step.key]||''}</textarea>`;
 }
 const isLast = _breedRecStep === total - 1;
 content.innerHTML = `<div style="flex:1;"><h2 style="font-size:1.6rem; font-weight:700; letter-spacing:-0.5px;">${step.question}</h2>${step.sub?`<p style="font-size:0.88rem; color:#999; margin-top:6px;">${step.sub}</p>`:''}${inputHtml}</div><div style="display:flex; gap:8px; margin-top:24px;">${_breedRecStep>0?`<button onclick="_breedRecStep--;renderBreedRecStep()" style="flex:1; padding:16px; border:1.5px solid #e5e3e0; border-radius:14px; background:#fff; font-size:0.9rem; font-weight:600; cursor:pointer;">이전</button>`:``}${!step.required&&step.type!=='cards'?`<button onclick="_breedRecData[_breedRecSteps[_breedRecStep].key]='';${isLast?'finishBreedRec()':'_breedRecStep++;renderBreedRecStep()'}" style="flex:1; padding:16px; border:1.5px solid #e5e3e0; border-radius:14px; background:#fff; font-size:0.9rem; font-weight:600; color:#999; cursor:pointer;">건너뛰기</button>`:``}<button onclick="${isLast?'finishBreedRec()':'nextBreedRecStep()'}" style="flex:2; padding:16px; border:none; border-radius:14px; background:#1a1a1a; color:#fff; font-size:1rem; font-weight:700; cursor:pointer;">${isLast?'추천 받기':'다음'}</button></div>`;
}

function selectBreedRecCard(key, value) { _breedRecData[key] = value; renderBreedRecStep(); setTimeout(() => nextBreedRecStep(), 300); }
function nextBreedRecStep() { const step = _breedRecSteps[_breedRecStep]; const input = document.getElementById('breed-rec-input'); if (input) _breedRecData[step.key] = input.value.trim(); if (_breedRecStep < _breedRecSteps.length - 1) { _breedRecStep++; renderBreedRecStep(); } }

function finishBreedRec() {
 const input = document.getElementById('breed-rec-input');
 if (input) _breedRecData[_breedRecSteps[_breedRecStep].key] = input.value.trim();
 closeBreedRecFlow();
 const resultEl = document.getElementById('breed-recommend-result');
 if (resultEl) resultEl.innerHTML = '<div style="text-align:center; padding:32px;"><div class="spinner"></div><p style="color:var(--color-text-muted); margin-top:12px;">품종 데이터를 분석하고 있어요...</p></div>';
 handleBreedRecommend();
}

// --- AI 품종 추천 요청 핸들러 ---
async function handleBreedRecommend() {
 const resultEl = document.getElementById('breed-recommend-result');

 const preferences = {
 size: _breedRecData.size || 'any',
 exerciseLevel: _breedRecData.exerciseLevel || 'any',
 groomingLevel: _breedRecData.groomingLevel || 'any',
 trainability: _breedRecData.trainability || 'any',
 barkingLevel: 'any',
 childFriendly: _breedRecData.environment === 'child',
 apartmentFriendly: _breedRecData.environment === 'apartment',
 freeText: _breedRecData.freetext || ''
 };
 const count = 3;

 if (resultEl) resultEl.innerHTML = `
 <div class="card" style="padding:40px; text-align:center;">
 <div class="spinner" style="margin:0 auto 16px;"></div>
 <p style="color:var(--color-text-muted);">383종의 품종 데이터를 분석하고 있어요...</p>
 <p style="color:var(--color-text-muted); font-size:0.85rem;">잠시만 기다려주세요 </p>
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
}

// --- 추천 결과 렌더링 ---
function renderBreedRecommendResult(data) {
 const { recommendations, summary, totalCandidates } = data;

 let html = '';

 if (summary) {
 html += `<div class="card" style="padding:16px 20px; margin-bottom:16px; background:var(--color-bg-warm);">
 <p style="font-size:0.95rem; margin:0;"><strong>AI 분석 결과</strong> ? ${summary}</p>
 <p style="font-size:0.8rem; color:var(--color-text-muted); margin:4px 0 0;">총 ${totalCandidates || '?'}종 후보 중 ${recommendations.length}종 추천</p>
 </div>`;
 }

 recommendations.forEach((rec, idx) => {
 const breed = BreedService.getById(rec.id);
 const sizeMap = { small: '소형', medium: '중형', large: '대형' };

 html += `
 <div class="card" style="padding:0; margin-bottom:16px; overflow:hidden;">
 <!-- 이미지 상단 배치 -->
 <div style="position:relative;">
 <div class="breed-img" data-breed-id="${rec.id}" data-fit-contain style="width:100%; height:220px; background:linear-gradient(135deg, #FFB3C6, #C9A9E9); display:flex; align-items:center; justify-content:center; font-size:4rem;"></div>
 <div style="position:absolute; top:10px; left:10px; background:var(--color-primary, #7C4DFF); color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.2);">${idx + 1}</div>
 ${rec.matchScore ? `<div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:#FFD700; padding:4px 10px; border-radius:10px; font-size:0.85rem; font-weight:700;"> ${rec.matchScore}점</div>` : ''}
 </div>
 <!-- 정보 -->
 <div style="padding:16px 20px;">
 <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
 <h3 style="margin:0; font-size:1.15rem;">${rec.name}</h3>
 <span style="font-size:0.8rem; color:var(--color-text-muted);">${rec.nameEn || ''}</span>
 ${breed ? `<span class="badge badge-primary" style="font-size:0.7rem;">${sizeMap[breed.size] || ''}</span>` : ''}
 </div>
 <p style="font-size:0.9rem; line-height:1.7; margin-bottom:12px; color:var(--color-text);">${rec.reason}</p>
 <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px;">
 ${rec.pros ? `<div style="flex:1; min-width:140px;"><div style="font-size:0.8rem; font-weight:700; color:#4CAF50; margin-bottom:6px;">장점</div>${rec.pros.map(p => `<div style="font-size:0.85rem; padding:2px 0;">? ${p}</div>`).join('')}</div>` : ''}
 ${rec.cons ? `<div style="flex:1; min-width:140px;"><div style="font-size:0.8rem; font-weight:700; color:#FF9800; margin-bottom:6px;">주의점</div>${rec.cons.map(c => `<div style="font-size:0.85rem; padding:2px 0;">? ${c}</div>`).join('')}</div>` : ''}
 </div>
 ${rec.tip ? `<div style="background:var(--color-bg-warm); padding:10px 14px; border-radius:10px; font-size:0.85rem; margin-bottom:12px;"><strong>꿀팁:</strong> ${rec.tip}</div>` : ''}
 <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/breeds/${rec.id}')" style="margin-top:2px;">상세 정보 보기 →</button>
 </div>
 </div>`;
 });

 return html;
}

function renderBreedCards(breeds) {
 if (breeds.length === 0) {
 return `<div class="empty-state" style="grid-column: 1/-1;">
 <div class="empty-icon">${icon('search',16)}</div>
 <p>검색 결과가 없습니다</p>
 </div>`;
 }
 const sizeMap = { small: '소형', medium: '중형', large: '대형' };
 const exerciseMap = { low: '낮음', medium: '보통', high: '높음' };
 return breeds.map(breed => `
 <div class="card" onclick="Router.navigate('/breeds/${breed.id}')" style="cursor:pointer;">
 <div class="card__image breed-img" data-breed-id="${breed.id}" style="background: linear-gradient(135deg, #FFB3C6, #C9A9E9); display:flex; align-items:center; justify-content:center; font-size:3rem; position:relative;"></div>
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
 <div class="nf-icon"></div>
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
 <div id="breed-detail-img" data-breed-id="${breed.id}" data-fit-contain style="width:100%; height:300px; background: linear-gradient(135deg, #FFB3C6, #C9A9E9); border-radius: var(--radius-lg); display:flex; align-items:center; justify-content:center; font-size:5rem; margin-bottom:16px; position:relative;"></div>
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
 ${breed.childFriendly !== undefined ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">아이 친화</div><div style="font-weight:800; margin-top:4px;">' + (breed.childFriendly ? '?' : '?') + '</div></div>' : ''}
 ${breed.apartmentFriendly !== undefined ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">아파트 적합</div><div style="font-weight:800; margin-top:4px;">' + (breed.apartmentFriendly ? '?' : '?') + '</div></div>' : ''}
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

// --- 교육 콘텐츠 페이지 ---
