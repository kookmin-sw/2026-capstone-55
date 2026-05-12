// Pawsitive - Matching Page
// Dog walker matching, profiles, and walk management

function renderMatchingPage() {
 const user = AuthService.getCurrentUser();

 if (!user) {
 renderPage(`
 <div class="page-header">
 <h1>산책 매칭</h1>
 <p>산책 도우미와 요청자를 연결해드려요.</p>
 </div>
 <div class="match-role-grid">
 <div class="match-role-card" onclick="Router.navigate('/login')">
 <div class="match-role-card__img-wrap">
 <img src="/images/dog_walker.png" alt="산책 도우미" class="match-role-card__img">
 </div>
 <div class="match-role-card__body">
 <h3 class="match-role-card__title">산책 도우미</h3>
 <p class="match-role-card__desc">다른 반려견의 산책을<br>도와주세요</p>
 </div>
 </div>
 <div class="match-role-card" onclick="Router.navigate('/login')">
 <div class="match-role-card__img-wrap">
 <img src="/images/dog_owner.png" alt="산책 요청자" class="match-role-card__img">
 </div>
 <div class="match-role-card__body">
 <h3 class="match-role-card__title">산책 요청자</h3>
 <p class="match-role-card__desc">우리 아이 산책을<br>부탁해보세요</p>
 </div>
 </div>
 </div>
 <div class="card" style="padding:20px;">
 <h3 style="margin-bottom:12px;">매칭 시스템 안내</h3>
 <div style="font-size:0.9rem; line-height:1.8; color:var(--color-text);">
 <p>• <strong>산책 도우미</strong>: 활동 지역, 가능 시간, 수용 가능 견종 크기를 등록하면 요청을 받을 수 있어요.</p>
 <p>• <strong>산책 요청자</strong>: 근처 도우미에게 산책을 요청하고 실시간으로 매칭 상태를 확인할 수 있어요.</p>
 <p>• 매칭 완료 후 <strong>GPS 산책 트래킹</strong>으로 경로를 기록할 수 있어요.</p>
 </div>
 </div>
 `);
 return;
 }

 const myProfile = MatchingService.getMyProfile(user.id);

 if (!myProfile) {
 renderMatchingRoleSelect(null);
 return;
 }

 // 요청자: 진행 중인 산책이 있으면 무조건 실시간 추적 화면으로 (다른 UI 접근 차단)
 if (myProfile.role === 'requester') {
 fetch(`/api/walk-requests?requesterId=${user.id}`)
 .then(res => res.json())
 .then(data => {
 const reqs = data.requests || [];

 // 산책 진행 중 → 실시간 추적 화면 (completed는 제외)
 const activeReq = reqs.find(r =>
   ['accepted', 'heading', 'arrived', 'handoff', 'walking'].includes(r.status)
 );
 if (activeReq) {
   renderRequesterActiveWalkScreen(user, activeReq);
 } else {
   MatchingService.refreshFromServer().then(() => renderRequesterDashboard(user, myProfile));
 }
 })
 .catch(() => {
 MatchingService.refreshFromServer().then(() => renderRequesterDashboard(user, myProfile));
 });
 return;
 }

 if (myProfile.role === 'walker') {
 renderWalkerDashboard(user, myProfile);
 }
}

/** 역할 선택 화면 */
function renderMatchingRoleSelect(selectedRole) {
 const user = AuthService.getCurrentUser();
 const walkerSel = selectedRole === 'walker';
 const reqSel = selectedRole === 'requester';

 const walkerFormHtml = walkerSel ? `
 <div class="match-form-card">
 <h3 class="match-form-title">산책 도우미 등록 및 상태 관리</h3>
 <div id="match-register-error"></div>
 <div class="match-form-grid">
 <div class="form-group">
 <label for="match-location">활동 지역 <span class="dw-required">*</span></label>
 <input type="text" id="match-location" class="form-input" placeholder="예: 서울 마포구 합정동">
 </div>
 <div class="form-group">
 <label for="match-time">산책 가능 시간 <span class="dw-required">*</span></label>
 <select id="match-time" class="form-select">
 <option value="">선택해주세요</option>
 <option value="오전 (7-9시)">오전 (7~9시)</option>
 <option value="오전 (9-11시)">오전 (9~11시)</option>
 <option value="오후 (2-4시)">오후 (2~4시)</option>
 <option value="오후 (5-7시)">오후 (5~7시)</option>
 <option value="저녁 (7-9시)">저녁 (7~9시)</option>
 <option value="상시 가능">상시 가능</option>
 </select>
 </div>
 <div class="form-group">
 <label for="match-experience">경력 / 특이사항</label>
 <input type="text" id="match-experience" class="form-input" placeholder="예: 반려견 2년 경력, 응급처치 자격">
 </div>
 </div>
 <div class="form-group">
 <label for="match-message">자기소개 <span class="dw-required">*</span></label>
 <textarea id="match-message" class="form-input" rows="3" placeholder="간단한 자기소개를 적어주세요."></textarea>
 </div>
 <div class="form-group">
 <label>선호 견종 크기 <span class="dw-required">*</span></label>
 <div class="match-check-group">
 <label class="dw-check-label"><input type="checkbox" class="match-size-cb" value="small"> 소형견 (~7kg)</label>
 <label class="dw-check-label"><input type="checkbox" class="match-size-cb" value="medium"> 중형견 (7~15kg)</label>
 <label class="dw-check-label"><input type="checkbox" class="match-size-cb" value="large"> 대형견 (15kg~)</label>
 </div>
 </div>
 <div class="form-group">
 <label>산책 경력 <span class="dw-required">*</span></label>
 <div class="match-check-group">
 <label class="dw-check-label"><input type="radio" name="match-career" value="under6m"> 6개월 미만</label>
 <label class="dw-check-label"><input type="radio" name="match-career" value="6m1y"> 6개월~1년</label>
 <label class="dw-check-label"><input type="radio" name="match-career" value="1y3y"> 1~3년</label>
 <label class="dw-check-label"><input type="radio" name="match-career" value="over3y"> 3년 이상</label>
 </div>
 </div>
 <div class="form-group">
 <label>대형견 산책 경험</label>
 <div class="match-check-group">
 <label class="dw-check-label"><input type="radio" name="match-large-exp" value="lots"> 많음</label>
 <label class="dw-check-label"><input type="radio" name="match-large-exp" value="some"> 조금</label>
 <label class="dw-check-label"><input type="radio" name="match-large-exp" value="none"> 없음</label>
 </div>
 </div>
 <div class="form-group">
 <label>공격성 대응 가능</label>
 <div class="match-check-group">
 <label class="dw-check-label"><input type="radio" name="match-aggr" value="yes"> 가능</label>
 <label class="dw-check-label"><input type="radio" name="match-aggr" value="some"> 어느 정도</label>
 <label class="dw-check-label"><input type="radio" name="match-aggr" value="no"> 불가</label>
 </div>
 </div>
 <div class="form-group">
 <label>반려견 양육 경험</label>
 <div class="match-check-group">
 <label class="dw-check-label"><input type="radio" name="match-pet-exp" value="current"> 현재 양육 중</label>
 <label class="dw-check-label"><input type="radio" name="match-pet-exp" value="past"> 과거 양육</label>
 <label class="dw-check-label"><input type="radio" name="match-pet-exp" value="none"> 없음</label>
 </div>
 </div>
 <button class="btn btn-primary match-submit-btn" onclick="handleRegisterMatchProfile('walker')">산책 도우미로 등록하기</button>
 </div>
 ` : '';

 const reqFormHtml = reqSel ? `
 <div class="match-form-card">
 <h3 class="match-form-title">산책 요청자 등록 및 매칭 요청</h3>
 <div id="match-register-error"></div>
 ${(() => {
 const dogs = (user && user.dogs) || [];
 if (dogs.length === 0) {
 return `
 <div class="match-empty-dog-card">
 <div class="match-empty-dog-card__emoji"></div>
 <div class="match-empty-dog-card__title">등록된 반려견이 없어요</div>
 <div class="match-empty-dog-card__desc">산책 요청을 보내려면 먼저 반려견 정보를 등록해야 해요.</div>
 <button class="btn btn-primary" onclick="Router.navigate('/profile')" style="margin-top:4px;">프로필에서 반려견 등록하기 →</button>
 </div>`;
 }
 const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' };
 // 반려견 1마리면 셀렉트, 여러 마리면 체크박스로 복수 선택
 if (dogs.length === 1) {
 const d = dogs[0];
 return `<div class="form-group" style="margin-bottom:16px;">
 <label>함께할 반려견</label>
 <div style="padding:12px 14px;border:1px solid var(--color-border);border-radius:10px;background:#fafaf8;display:flex;align-items:center;gap:10px;">
 <span style="font-size:1.2rem;">🐕</span>
 <div>
 <div style="font-weight:700;font-size:0.9rem;">${d.name}</div>
 <div style="font-size:0.75rem;color:var(--color-text-muted);">${d.breed || ''}${d.size ? ' · ' + (sizeLabel[d.size] || d.size) : ''}</div>
 </div>
 <input type="hidden" id="match-dog-select" value="${d.id}">
 </div>
 </div>`;
 }
 const checkboxes = dogs.map(d =>
 `<label class="match-dog-check" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1.5px solid var(--color-border);border-radius:10px;cursor:pointer;transition:all 0.15s;margin-bottom:8px;">
   <input type="checkbox" class="match-dog-checkbox" value="${d.id}" style="width:18px;height:18px;accent-color:#1a1a1a;cursor:pointer;">
   <span style="font-size:1.2rem;">🐕</span>
   <div style="flex:1;min-width:0;">
     <div style="font-weight:700;font-size:0.88rem;">${d.name}</div>
     <div style="font-size:0.72rem;color:var(--color-text-muted);">${d.breed || ''}${d.size ? ' · ' + (sizeLabel[d.size] || d.size) : ''}</div>
   </div>
 </label>`
 ).join('');
 return `<div class="form-group" style="margin-bottom:16px;">
 <label>함께할 반려견 <span class="dw-required">*</span> <span style="font-size:0.72rem;color:var(--color-text-muted);font-weight:500;">여러 마리 선택 가능</span></label>
 ${checkboxes}
 </div>`;
 })()}
 <div class="form-group">
 <label for="match-notes">요청사항</label>
 <textarea id="match-notes" class="form-input" rows="3" placeholder="특별한 요청사항이 있으면 적어주세요. (예: 목줄이 약해요, 대형견은 어려워해요 등)"></textarea>
 </div>
 <div style="padding:12px 14px;background:#f8f8f6;border-radius:10px;font-size:0.78rem;color:var(--color-text-muted);line-height:1.5;margin-bottom:16px;">
   <span style="font-weight:700;color:var(--color-text);">${icon('map-pin',13)} GPS 즉시 매칭</span> — 산책 위치와 시간은 현재 내 위치와 "지금" 기준으로 자동 설정돼요. 도우미는 실시간으로 가까운 순으로 매칭됩니다.
 </div>
 <button class="btn btn-primary match-submit-btn" onclick="handleRegisterMatchProfile('requester')">산책 요청자로 등록하기</button>
 </div>
 ` : '';

 renderPage(`
 <style>
 .match-flow-hero { text-align:center; padding:48px 0 32px; }
 .match-flow-hero h1 { font-size:1.5rem; font-weight:700; letter-spacing:-0.5px; margin-bottom:6px; }
 .match-flow-hero p { font-size:0.88rem; color:var(--color-text-muted); }
 .match-flow-cards { display:flex; gap:16px; max-width:480px; margin:0 auto; }
 .match-flow-card { flex:1; padding:32px 20px; border:1.5px solid var(--color-border); border-radius:16px; text-align:center; cursor:pointer; transition:all 0.2s; background:#fff; }
 .match-flow-card:hover { border-color:var(--color-text); background:#f9f9f7; }
 .match-flow-card h3 { font-size:1rem; font-weight:700; margin-bottom:6px; }
 .match-flow-card p { font-size:0.78rem; color:var(--color-text-muted); line-height:1.5; }
 </style>

 <div class="match-flow-hero">
 <h1>어떤 역할로 참여할까요?</h1>
 <p>산책 매칭을 시작하려면 역할을 선택해주세요</p>
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

 ${walkerFormHtml}${reqFormHtml}
 ${!selectedRole ? '<p class="match-role-hint">위 카드를 클릭해서 역할을 선택해주세요</p>' : ''}
 `);

 // Task 7.3: Pre-populate walker form fields if existing profile data is available
 if (walkerSel && user) {
 prePopulateWalkerForm(user.id);
 }
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
 { key: 'careerYears', question: '산책 경력이 어느 정도예요?', sub: '대략적인 기간을 선택해주세요', type: 'cards', options: [
 { value: 'under6m', label: '6개월 미만', desc: '입문 단계' },
 { value: '6m1y', label: '6개월~1년', desc: '초보' },
 { value: '1y3y', label: '1년~3년', desc: '중급' },
 { value: 'over3y', label: '3년 이상', desc: '숙련' }
 ]},
 { key: 'ownPetExp', question: '반려견을 직접 키워본 경험이 있나요?', sub: '', type: 'cards', options: [
 { value: 'current', label: '현재 키우는 중', desc: '반려인' },
 { value: 'past', label: '과거에 키웠어요', desc: '경험 있음' },
 { value: 'none', label: '없어요', desc: '경험 없음' }
 ]},
 { key: 'largeDogExp', question: '대형견 산책 경험이 있나요?', sub: '25kg 이상 기준이에요', type: 'cards', options: [
 { value: 'lots', label: '많아요', desc: '자주 했어요' },
 { value: 'some', label: '조금 있어요', desc: '몇 번 해봤어요' },
 { value: 'none', label: '없어요', desc: '소/중형만 해봤어요' }
 ]},
 { key: 'aggressionHandle', question: '공격성 있는 강아지도 산책할 수 있나요?', sub: '솔직하게 답변해주세요', type: 'cards', options: [
 { value: 'yes', label: '가능해요', desc: '경험 있어요' },
 { value: 'some', label: '어느 정도요', desc: '경미한 수준은 OK' },
 { value: 'no', label: '어려워요', desc: '온순한 강아지만' }
 ]},
 { key: 'breedExp', question: '어떤 견종을 많이 산책해보셨나요?', sub: '해당되는 견종을 모두 선택해주세요', type: 'multicheck', options: [
 '리트리버', '푸들', '말티즈', '진돗개', '포메라니안', '시바견', '허스키', '비글', '코커스패니얼', '기타'
 ]},
 { key: 'problemBehavior', question: '어떤 문제 행동을 다뤄봤나요?', sub: '경험 있는 항목을 모두 선택해주세요', type: 'multicheck', options: [
 '공격성', '짖음', '줄 당김', '분리불안', '낯선 사람 경계', '다른 강아지에게 예민함'
 ]},
 { key: 'message', question: '간단히 자기소개 해주세요', sub: '요청자가 참고할 수 있어요', type: 'textarea', placeholder: '산책 스타일, 성격 등을 자유롭게 적어주세요', required: true }
];

const _matchRequesterSteps = [
 { key: 'dogName', question: '반려견 이름이 뭐예요?', sub: '', type: 'text', placeholder: '예: 초코', required: true },
 { key: 'dogSize', question: '반려견 크기는요?', sub: '체중 기준으로 선택해주세요', type: 'cards', options: [
 { value: 'small', label: '소형', desc: '~7kg' },
 { value: 'medium', label: '중형', desc: '7~15kg' },
 { value: 'large', label: '대형', desc: '15kg~' }
 ]},
 { key: 'dogAggression', question: '반려견에게 공격성이 있나요?', sub: '정확할수록 더 잘 맞는 도우미를 찾아드려요', type: 'cards', options: [
 { value: 'high', label: '공격성 강함', desc: '다른 개/사람에게 반응함' },
 { value: 'medium', label: '약간 있어요', desc: '특정 상황에서만' },
 { value: 'none', label: '온순해요', desc: '공격성 없음' }
 ]},
 { key: 'dogPersonality', question: '반려견 성격은 어때요?', sub: '가장 가까운 항목을 선택해주세요', type: 'cards', options: [
 { value: 'active', label: '활발해요', desc: '에너지가 넘쳐요' },
 { value: 'normal', label: '보통이에요', desc: '평균적인 편' },
 { value: 'shy', label: '겁이 많아요', desc: '낯선 환경에 예민함' }
 ]},
 { key: 'walkDifficulty', question: '산책 난이도는 어느 정도예요?', sub: '줄 당김, 돌발행동 등을 고려해주세요', type: 'cards', options: [
 { value: 'hard', label: '어려운 편', desc: '통제가 쉽지 않아요' },
 { value: 'medium', label: '보통이에요', desc: '가끔 말 안 들어요' },
 { value: 'easy', label: '쉬워요', desc: '순한 편이에요' }
 ]},
 { key: 'location', question: '어디서 산책하고 싶으세요?', sub: '동네 이름을 알려주세요', type: 'text', placeholder: '예: 서울 마포구 합정동', required: true },
 { key: 'preferredTime', question: '원하는 산책 시간은요?', sub: '', type: 'cards', options: [
 { value: '오전 (7-9시)', label: '이른 아침', desc: '7~9시' },
 { value: '오전 (9-11시)', label: '오전', desc: '9~11시' },
 { value: '오후 (2-4시)', label: '오후', desc: '2~4시' },
 { value: '오후 (5-7시)', label: '늦은 오후', desc: '5~7시' },
 { value: '저녁 (7-9시)', label: '저녁', desc: '7~9시' }
 ]},
 { key: 'notes', question: '추가 요청사항이 있나요?', sub: '없으면 건너뛰어도 돼요', type: 'textarea', placeholder: '예: 목줄 빼지 말아주세요, 간식 챙겨드릴게요', required: false }
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
 <button onclick="closeMatchRegisterFlow()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.2rem; color:#999; cursor:pointer;">?</button>
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
 } else if (step.type === 'multicheck') {
 const selected = _matchRegData[step.key] || [];
 inputHtml = `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:24px;">
 ${step.options.map(opt => `
 <button onclick="toggleMatchRegMulti('${step.key}','${opt}')" style="padding:10px 16px; border:1.5px solid ${selected.includes(opt) ? '#1a1a1a' : '#e5e3e0'}; border-radius:999px; background:${selected.includes(opt) ? '#1a1a1a' : '#fff'}; color:${selected.includes(opt) ? '#fff' : '#333'}; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.15s;">
 ${opt}
 </button>
 `).join('')}
 </div>
 <p style="font-size:0.75rem; color:#aaa; margin-top:10px;">해당 없으면 건너뛰기를 눌러주세요</p>`;
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

function toggleMatchRegMulti(key, value) {
 if (!_matchRegData[key]) _matchRegData[key] = [];
 const arr = _matchRegData[key];
 const idx = arr.indexOf(value);
 if (idx === -1) arr.push(value); else arr.splice(idx, 1);
 renderMatchRegStep();
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
 careerYears: _matchRegData.careerYears || '',
 ownPetExp: _matchRegData.ownPetExp || '',
 largeDogExp: _matchRegData.largeDogExp || '',
 aggressionHandle: _matchRegData.aggressionHandle || '',
 breedExp: _matchRegData.breedExp || [],
 problemBehavior: _matchRegData.problemBehavior || [],
 message: _matchRegData.message || '',
 canWalkLarge: _matchRegData.largeDogExp !== 'none',
 canWalkMultiple: true
 });
 } else {
 handleRegisterMatchProfile('requester', {
 dogName: _matchRegData.dogName,
 dogSize: _matchRegData.dogSize,
 dogAggression: _matchRegData.dogAggression || 'none',
 dogPersonality: _matchRegData.dogPersonality || 'normal',
 walkDifficulty: _matchRegData.walkDifficulty || 'easy',
 location: _matchRegData.location,
 preferredTime: _matchRegData.preferredTime,
 notes: _matchRegData.notes || ''
 });
 }
 closeMatchRegisterFlow();
}

/** Task 7.3: Pre-populate walker form with existing profile data */
function prePopulateWalkerForm(userId) {
 fetch('/api/walkers')
 .then(res => res.json())
 .then(walkers => {
 const existing = walkers.find(w => w.userId === userId);
 if (!existing) return;

 // Text fields
 const locEl = document.getElementById('match-location');
 if (locEl && existing.location) locEl.value = existing.location;

 const timeEl = document.getElementById('match-time');
 if (timeEl && existing.preferredTime) timeEl.value = existing.preferredTime;

 const expEl = document.getElementById('match-experience');
 if (expEl && existing.experience) expEl.value = existing.experience;

 const msgEl = document.getElementById('match-message');
 if (msgEl && existing.message) msgEl.value = existing.message;

 // Multi-select checkboxes: acceptedSizes
 if (existing.acceptedSizes && Array.isArray(existing.acceptedSizes)) {
 existing.acceptedSizes.forEach(size => {
   const cb = document.querySelector(`.match-size-cb[value="${size}"]`);
   if (cb) cb.checked = true;
 });
 }

 // Radio: careerYears
 if (existing.careerYears) {
 const radio = document.querySelector(`input[name="match-career"][value="${existing.careerYears}"]`);
 if (radio) radio.checked = true;
 }

 // Radio: largeDogExp
 if (existing.largeDogExp) {
 const radio = document.querySelector(`input[name="match-large-exp"][value="${existing.largeDogExp}"]`);
 if (radio) radio.checked = true;
 }

 // Radio: aggressionHandle
 if (existing.aggressionHandle) {
 const radio = document.querySelector(`input[name="match-aggr"][value="${existing.aggressionHandle}"]`);
 if (radio) radio.checked = true;
 }

 // Radio: ownPetExp
 if (existing.ownPetExp) {
 const radio = document.querySelector(`input[name="match-pet-exp"][value="${existing.ownPetExp}"]`);
 if (radio) radio.checked = true;
 }
 })
 .catch(() => { /* silently ignore fetch errors */ });
}

function renderMatchingRoleSelectStatic(role) { renderMatchingRoleSelect(role); }

/** 매칭 프로필 등록 핸들러 */
function handleRegisterMatchProfile(role, flowData) {
 const user = AuthService.getCurrentUser();
 if (!user) { Router.navigate('/login'); return; }

 const errEl = document.getElementById('match-register-error');
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
 // DOM에서 직접 읽기
 message = document.getElementById('match-message')?.value || '';

 if (role === 'walker') {
 // 도우미는 활동지역/시간/자기소개 필수
 location = document.getElementById('match-location')?.value;
 preferredTime = document.getElementById('match-time')?.value;

 if (!location?.trim()) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">활동 지역을 입력해주세요.</div>'; return;
 }
 if (!preferredTime) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">시간대를 선택해주세요.</div>'; return;
 }
 if (!message.trim()) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">자기소개를 입력해주세요.</div>'; return;
 }
 extra = {
 experience: document.getElementById('match-experience')?.value || '',
 acceptedSizes: Array.from(document.querySelectorAll('.match-size-cb:checked')).map(cb => cb.value),
 careerYears: document.querySelector('input[name="match-career"]:checked')?.value || '',
 largeDogExp: document.querySelector('input[name="match-large-exp"]:checked')?.value || 'none',
 aggressionHandle: document.querySelector('input[name="match-aggr"]:checked')?.value || 'no',
 ownPetExp: document.querySelector('input[name="match-pet-exp"]:checked')?.value || 'none',
 canWalkLarge: document.querySelectorAll('.match-size-cb[value="large"]:checked').length > 0,
 canWalkMultiple: false,
 };
 if (!extra.acceptedSizes.length) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">선호 크기를 하나 이상 선택해주세요.</div>'; return;
 }
 if (!extra.careerYears) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">산책 경력을 선택해주세요.</div>'; return;
 }
 } else {
 // 요청자는 GPS + "지금" 기반 즉시 매칭 → 위치/시간 필드 없음
 // 다견 동시 산책 지원: 체크박스(다수) 또는 숨김 input(단일)에서 선택된 dogId 수집
 const checked = Array.from(document.querySelectorAll('.match-dog-checkbox:checked'))
   .map(el => el.value)
   .filter(Boolean);
 const hidden = document.getElementById('match-dog-select');
 let dogIds = checked;
 if (dogIds.length === 0 && hidden && hidden.value) dogIds = [hidden.value];

 if (dogIds.length === 0) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">함께할 반려견을 최소 1마리 선택해주세요.</div>'; return;
 }

 const selectedDogs = (user.dogs || []).filter(d => dogIds.includes(d.id));
 const primary = selectedDogs[0] || {};

 // 요청자는 현재 위치/"지금" 기준으로 자동 설정 (GPS 매칭은 별도 흐름에서 좌표 덮어씀)
 location = '현재 위치';
 preferredTime = '즉시 매칭';
 extra = {
 dogId: primary.id || null,
 dogName: primary.name || '',
 dogSize: primary.size || '',
 dogBreed: primary.breed || '',
 // 다견 동시 산책 지원 ? 전체 목록
 dogIds,
 dogs: selectedDogs.map(d => ({ id: d.id, name: d.name, breed: d.breed, size: d.size })),
 notes: document.getElementById('match-notes')?.value || ''
 };
 }
 }

 MatchingService.registerProfile(user.id, { role, location: location.trim(), preferredTime, message: message.trim(), isAvailable: true, ...extra });

 // 도우미로 등록 시 walkers.json에도 추가 (브로드캐스트 대상에 포함되도록)
 if (role === 'walker') {
 fetch('/api/walkers', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 userId: user.id,
 name: user.name || user.nickname,
 nickname: user.nickname || user.name,
 location: location.trim(),
 preferredTime: preferredTime,
 experience: extra.experience || '',
 message: message.trim(),
 price: 0,
 acceptedSizes: extra.acceptedSizes || ['small','medium','large'],
 careerYears: extra.careerYears || 'under6m',
 largeDogExp: extra.largeDogExp || 'none',
 aggressionHandle: extra.aggressionHandle || 'no',
 ownPetExp: extra.ownPetExp || 'none',
 })
 }).then(() => MatchingService.refreshFromServer()).catch(() => {});
 }

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
 const pending = requests.filter(r => r.status === 'pending');
 const newOnes = pending.filter(r => !_walkerLastRequestIds.has(r.id));
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
 notif.style.cursor = 'pointer';
 notif.onclick = () => {
 notif.style.display = 'none';
 const section = document.getElementById('walker-broadcast-section');
 if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
 };
 notif.innerHTML = `
 <span style="font-size:1.4rem;">${icon('bell',14)}</span>
 <div style="flex:1;">
 <div style="font-weight:700;">산책 요청이 들어왔어요!</div>
 <div style="font-size:0.78rem;opacity:0.8;margin-top:2px;">새 요청 ${count}건 · 탭해서 확인하세요 →</div>
 </div>
 <span style="font-size:1.1rem;opacity:0.6;">?</span>`;
 notif.style.display = 'flex';
 clearTimeout(notif._hideTimer);
 notif._hideTimer = setTimeout(() => { if (notif) notif.style.display = 'none'; }, 8000);
}

/** 산책 도우미 대시보드 */
async function renderWalkerDashboard(user, myProfile) {
 const receivedRequests = await MatchingService.getReceivedRequestsRemote(user.id);
 const scheduledWalks = MatchingService.getScheduledWalks(user.id);
 const completedWalks = MatchingService.getCompletedWalks(user.id);
 const isAvail = myProfile.isAvailable;

 // 이미 ON 상태로 앱을 열었을 때 GPS 즉시 재시작 (어제 위치 스테일 방지)
 if (isAvail) RealtimeService.startGpsUpdates(user.id);

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
 <span class="dw-toggle__status">${isAvail ? 'ON' : '? OFF'}</span>
 </div>
 </div>
 `;

 const profileCard = `
 <div class="match-profile-card">
 <div class="match-profile-card__left">
 <div class="match-profile-card__avatar">${user.name.charAt(0)}</div>
 <div>
 <div class="match-profile-card__name">${user.name} <span class="badge badge-primary">산책 도우미</span></div>
 <div class="match-profile-card__meta">${icon('map-pin',13)} ${myProfile.location} · ${icon('clock',13)} ${myProfile.preferredTime}${myProfile.experience ? ' · ' + myProfile.experience : ''}</div>
 ${myProfile.message ? `<div class="match-profile-card__bio">"${myProfile.message}"</div>` : ''}
 <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
 ${myProfile.canWalkLarge ? '<span class="dw-size-tag">대형견 가능</span>' : ''}
 ${myProfile.canWalkMultiple ? '<span class="dw-size-tag">다중 산책 가능</span>' : ''}
 </div>
 </div>
 </div>
 <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
 <button class="btn btn-secondary btn-sm" onclick="handleSwitchRole()">${icon('refresh-cw',13)} 역할 변경</button>
 <button class="btn btn-ghost btn-sm" onclick="handleRemoveMatchProfile()" style="font-size:0.75rem;color:var(--color-text-muted);">등록 해제</button>
 </div>
 </div>
 `;

 const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' };
 const pendingCount = receivedRequests.filter(r => r.status === 'pending').length;

 const receivedHtml = receivedRequests.length > 0
 ? receivedRequests.map(r => {
 const fromName = MatchingService.getUserName(r.fromUserId);
 const rd = r.requestData || {};
 const isPending = r.status === 'pending';
 const dogSizeText = rd.dogSize ? sizeLabel[rd.dogSize] || rd.dogSize : '';

 return `
 <div class="match-request-card ${isPending ? 'match-request-card--pending' : r.status === 'accepted' ? 'match-request-card--accepted' : ''}">
 ${isPending ? `<div class="match-request-card__new-badge">${icon('bell',14)} 새 요청</div>` : ''}
 <div class="match-request-card__header">
 <div class="match-request-card__avatar">${fromName.charAt(0)}</div>
 <div>
 <div class="match-request-card__from">${fromName}</div>
 <div style="font-size:0.78rem;color:var(--color-text-muted);">${formatRelativeTime(r.createdAt)}</div>
 </div>
 ${r.status === 'accepted' ? '<span class="badge badge-success" style="margin-left:auto;">? 수락됨</span>' : ''}
 ${r.status !== 'pending' && r.status !== 'accepted' ? '<span class="badge" style="margin-left:auto;">처리됨</span>' : ''}
 </div>

 <div class="match-request-card__body">
 ${(rd.dogs && rd.dogs.length > 1) ? `
 <div class="match-request-card__dog" style="align-items:flex-start;">
 <span style="font-size:1.3rem;">🟢</span>
 <div style="flex:1;">
 <div style="font-weight:700;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
 반려견 ${rd.dogs.length}마리 동시 산책
 <span style="font-size:0.68rem;background:#fef3c7;color:#b45309;padding:2px 7px;border-radius:999px;font-weight:700;">다견</span>
 </div>
 <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
 ${rd.dogs.map(d => `<span style="font-size:0.72rem;background:#f0f0ee;padding:3px 9px;border-radius:999px;">${d.name}${d.size ? ` · ${sizeLabel[d.size] || d.size}` : ''}</span>`).join('')}
 </div>
 </div>
 </div>` : (rd.dogName || dogSizeText) ? `
 <div class="match-request-card__dog">
 <span style="font-size:1.3rem;">⭕</span>
 <div>
 <div style="font-weight:700;">${rd.dogName || '반려견'}${dogSizeText ? ` <span class="dw-size-tag">${dogSizeText}</span>` : ''}</div>
 ${rd.dogBreed ? `<div style="font-size:0.8rem;color:var(--color-text-muted);">${rd.dogBreed}</div>` : ''}
 </div>
 </div>` : ''}
 <div class="match-request-card__info-grid">
 ${rd.location ? `<div class="match-request-card__info-item">${icon('map-pin',13)} ${rd.location}${rd.lat && rd.lng ? ` <span style="font-size:0.68rem;color:#00AA76;font-weight:700;margin-left:4px;">· GPS</span>` : ''}</div>` : ''}
 ${rd.desiredTime ? `<div class="match-request-card__info-item">${rd.desiredTime === '지금 (즉시 매칭)' ? `<span style="color:#00AA76;font-weight:700;">? 지금 · 즉시 매칭</span>` : `${icon('clock',13)} ${rd.desiredTime}`}</div>` : ''}
 </div>
 ${rd.notes ? `<div class="match-request-card__notes">"${rd.notes}"</div>` : ''}
 </div>

 ${isPending ? `
 <div class="match-request-card__actions">
 <button class="btn btn-primary" onclick="handleAcceptBroadcastRequest('${r.id}')" style="flex:1;">수락하기</button>
 <button class="btn btn-secondary" onclick="handleRejectMatchRequest('${r.id}')" style="flex:1;">거절하기</button>
 </div>` : ''}
 </div>`;
 }).join('')
 : `<div class="empty-state"><div class="empty-icon">📭</div><p>아직 받은 산책 요청이 없어요.<br>ON 상태를 유지하면 요청이 들어와요.</p></div>`;

 const scheduledHtml = scheduledWalks.map(s => {
 const pid = s.participants.find(id => id !== user.id) || s.participants[0];
 const pName = MatchingService.getUserName(pid);
 const relative = formatRelativeTime(s.scheduledAt);
 const time = new Date(s.scheduledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
 return `
 <div class="match-walk-card match-walk-card--scheduled">
 <div class="match-walk-card__left">
 <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
 <div class="match-walk-card__info">
 <div class="match-walk-card__name">${pName}</div>
 <div style="font-size:0.8rem;color:var(--color-text-muted);">${icon('clock',12)} 매칭 시각: ${relative} · ${time}</div>
 <span class="badge badge-info" style="margin-top:4px;">산책 진행 중</span>
 </div>
 </div>
 <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
 <button class="btn btn-primary btn-sm" onclick="Router.navigate('/walk-tracking')" style="display:flex;align-items:center;gap:4px;">${icon('map',14)} 산책 시작</button>
 <button class="btn btn-ghost btn-sm" onclick="handleCompleteWalk('${s.id}')" style="font-size:0.75rem;color:var(--color-text-muted);">산책 완료 처리</button>
 </div>
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

 <!-- 도우미 AI 점수 카드 -->
 ${renderWalkerScoreCard(myProfile)}

 <!-- 산책 요청 목록 -->
 <div class="match-section" id="walker-broadcast-section">
 <h2 class="match-section__title">산책 요청</h2>
 <div id="walker-new-requests-wrap"><div class="spinner" style="margin:20px auto;"></div></div>
 </div>

 ${completedWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">완료된 산책</h2>${completedHtml}</div>` : ''}

 <div class="match-section" id="direct-history-section" style="display:none;">
 <h2 class="match-section__title">산책 기록</h2>
 <div id="walker-history-wrap"><div class="spinner" style="margin:20px auto;"></div></div>
 </div>
 <div id="review-form-container"></div>
 `);

 // 직접 요청 목록 비동기 로드
 renderWalkerRequestsList(user.id).then(({ html, requests }) => {
 const el = document.getElementById('walker-new-requests-wrap');
 if (el) {
 el.innerHTML = html;
 setTimeout(() => initWalkerNavMaps(requests), 100);
 }
 });

 // 직접 요청 산책 기록 비동기 로드
 renderDirectWalkHistory(user.id, 'walker').then(({ html, hasRecords }) => {
 const section = document.getElementById('direct-history-section');
 const wrap = document.getElementById('walker-history-wrap');
 if (section && wrap) {
 if (hasRecords) { wrap.innerHTML = html; section.style.display = ''; }
 else section.style.display = 'none';
 }
 });

 // 폴링 시작 — 5초마다 새 요청 확인
 startWalkerPolling(user.id);

 // Trust Score 비동기 로드
 fetch(`/api/walkers/${user.id}/stats`)
   .then(r => r.json())
   .then(data => {
     const el = document.getElementById('walker-trust-score-value');
     if (el && data.success && data.stats) {
       const ts = data.stats.trustScore;
       const completed = data.stats.totalCompleted;
       if (completed === 0) el.textContent = '신규';
       else el.textContent = `${ts}점 (완료 ${completed}건)`;
     }
   })
   .catch(() => {
     const el = document.getElementById('walker-trust-score-value');
     if (el) el.textContent = '신규';
   });
}

function renderWalkerScoreCard(profile) {
  if (!profile) return '';
  const careerScore  = { over3y:15, '1y3y':10, '6m1y':5, under6m:2 }[profile.careerYears] || 3;
  const largeScore   = { lots:20, some:10, none:0 }[profile.largeDogExp] || 0;
  const aggrScore    = { yes:20, some:10, no:0 }[profile.aggressionHandle] || 0;
  const ownScore     = { current:5, past:3, none:0 }[profile.ownPetExp] || 0;
  const problemScore = Math.min((profile.problemBehavior || []).length * 2, 10);
  const ratingScore  = profile.rating ? Math.round((profile.rating - 3) * 2.5) : 0;
  const profileTotal = Math.max(0, Math.min(100, careerScore + largeScore + aggrScore + ownScore + problemScore + ratingScore + 30));

  const scoreColor   = profileTotal >= 80 ? '#00AA76' : profileTotal >= 60 ? '#F6A623' : '#718096';
  const scoreLabel   = profileTotal >= 80 ? '상위 매칭' : profileTotal >= 60 ? '평균 이상' : '개선 가능';

  const factors = [
    { label:'산책 경력', score:careerScore, max:15, tip: getWalkerLabel('careerYears', profile.careerYears) },
    { label:'대형견 경험', score:largeScore, max:20, tip: getWalkerLabel('largeDogExp', profile.largeDogExp) },
    { label:'공격성 대응', score:aggrScore, max:20, tip: getWalkerLabel('aggressionHandle', profile.aggressionHandle) },
    { label:'반려견 양육', score:ownScore, max:5, tip: getWalkerLabel('ownPetExp', profile.ownPetExp) },
    { label:'문제 행동 대응', score:problemScore, max:10 },
    { label:'평점', score:Math.max(0,ratingScore), max:5 },
  ];

  return `<div style="background:#fff;border:1px solid #f0f0ee;border-radius:14px;padding:18px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div><div style="font-size:0.75rem;font-weight:700;color:#aaa;margin-bottom:2px;">AI 매칭 점수</div>
      <div style="font-size:0.8rem;color:#555;">프로필 기반 적합도 (50%) + 이력 보너스 (30%) + 신뢰도 (20%)</div></div>
      <div style="text-align:right;"><div style="font-size:2rem;font-weight:900;color:${scoreColor};line-height:1;">${profileTotal}</div>
      <div style="font-size:0.68rem;font-weight:700;color:${scoreColor};">${scoreLabel}</div></div>
    </div>
    <div style="height:6px;background:#f0f0ee;border-radius:3px;margin-bottom:12px;overflow:hidden;">
      <div style="height:100%;width:${profileTotal}%;background:${scoreColor};border-radius:3px;"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
      ${factors.map(f => `<div style="background:#f8f8f6;border-radius:8px;padding:7px 10px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:0.72rem;color:#666;">${f.label}</span>
        <span style="font-size:0.76rem;font-weight:700;color:${f.score >= f.max*0.7?'#00AA76':f.score>0?'#F6A623':'#ccc'};">${f.score}/${f.max}</span>
      </div>`).join('')}
    </div>
    <div id="walker-trust-score-section" style="margin-top:12px;padding:10px 12px;background:#f0fdf4;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:0.78rem;font-weight:600;color:#166534;">신뢰도 점수</span>
      <span id="walker-trust-score-value" style="font-size:0.85rem;font-weight:800;color:#166534;">계산 중...</span>
    </div>
    <div style="margin-top:10px;padding:8px 10px;background:#fffbeb;border-radius:8px;font-size:0.74rem;color:#92400e;">프로필을 완성하고 산책을 완료할수록 점수가 올라가요</div>
  </div>`;
}

/**
 * AI 매칭 점수 계산 (0~100)
 * 강아지 특성 vs 도우미 역량을 비교해 적합도 산출
 */
function calcAiMatchScore(walker, requesterProfile, walkHistory) {
 let score = 50; // 기본 점수

 const dogSize = requesterProfile.dogSize || 'small';
 const aggression = requesterProfile.dogAggression || 'none';
 const difficulty = requesterProfile.walkDifficulty || 'easy';

 // 1. 공격성 대응 능력 (최대 +25점)
 if (aggression === 'high') {
 if (walker.aggressionHandle === 'yes') score += 25;
 else if (walker.aggressionHandle === 'some') score += 10;
 else score -= 20;
 } else if (aggression === 'medium') {
 if (walker.aggressionHandle === 'yes') score += 15;
 else if (walker.aggressionHandle === 'some') score += 10;
 else score -= 5;
 } else {
 score += 5; // 온순한 강아지는 누구나 OK
 }

 // 2. 대형견 경험 (최대 +20점)
 if (dogSize === 'large') {
 if (walker.largeDogExp === 'lots') score += 20;
 else if (walker.largeDogExp === 'some') score += 10;
 else score -= 15;
 } else if (dogSize === 'medium') {
 if (walker.largeDogExp === 'lots') score += 8;
 else if (walker.largeDogExp === 'some') score += 5;
 } else {
 score += 5;
 }

 // 3. 산책 경력 (최대 +15점)
 const careerScore = { over3y: 15, '1y3y': 10, '6m1y': 5, under6m: 2 };
 score += careerScore[walker.careerYears] || 3;

 // 4. 반려견 직접 키운 경험 (+5점)
 if (walker.ownPetExp === 'current') score += 5;
 else if (walker.ownPetExp === 'past') score += 3;

 // 5. 문제 행동 대응 경험 (최대 +10점)
 if (difficulty === 'hard') {
 const problems = walker.problemBehavior || [];
 score += Math.min(problems.length * 2, 10);
 }

 // 6. 산책 기록 데이터 반영 (최대 +10점) ? 완료된 산책이 많을수록 신뢰도 UP
 const completedCount = (walkHistory || []).filter(w => w.walkerId === walker.userId).length;
 score += Math.min(completedCount * 2, 10);

 // 7. 평점 반영 (+0~5점)
 if (walker.rating) score += Math.round((walker.rating - 3) * 2.5);

 return Math.max(0, Math.min(100, Math.round(score)));
}

/** AI breakdown 태그 HTML 생성 */
function renderAiBreakdownHtml(breakdown) {
  if (!breakdown) return '';
  const maxMap = {'경력_적합도':20,'공격성_대응력':25,'체형_적합도':20,'신뢰도':20,'특기_매칭':15};
  return Object.entries(breakdown).map(([k,v]) => {
    const pct = Math.round(v / maxMap[k] * 100);
    const col = pct >= 80 ? '#00AA76' : pct >= 50 ? '#F6A623' : '#ccc';
    return `<div style="font-size:0.65rem;background:#f0f0ee;border-radius:4px;padding:2px 6px;color:#555;" title="${k}: ${v}/${maxMap[k]}점">
      <span style="color:${col};font-weight:700;">${v}</span> ${k.replace('_',' ')}
    </div>`;
  }).join('');
}

/** 개별 워커 카드의 AI 점수/이유/breakdown을 DOM에서 업데이트하고 블러 해제 */
function updateWalkerCardWithAi(userId, score, reason, breakdown, enhancedData) {
  const card = document.querySelector(`.walker-card-item[data-walker-id="${userId}"]`);
  if (!card) return;

  const scoreColor = score >= 80 ? '#00AA76' : score >= 60 ? '#F6A623' : '#999';
  const scoreLabel = score >= 80 ? '최적' : score >= 60 ? '적합' : '보통';

  // 점수 업데이트
  const scoreEl = card.querySelector('.walker-card__score');
  if (scoreEl) {
    scoreEl.textContent = `${score}점`;
    scoreEl.style.color = scoreColor;
  }
  const scoreLabelEl = card.querySelector('.walker-card__score-label');
  if (scoreLabelEl) {
    scoreLabelEl.textContent = scoreLabel;
    scoreLabelEl.style.color = scoreColor;
  }

  // Trust Score 업데이트 (enhanced AI score 응답에서 받은 경우)
  if (enhancedData && typeof enhancedData.trustScore === 'number') {
    const ratingEl = card.querySelector('.dw-card__rating');
    if (ratingEl && !ratingEl.querySelector('.walker-card__trust-badge')) {
      const trustBadge = document.createElement('span');
      trustBadge.className = 'walker-card__trust-badge';
      trustBadge.style.cssText = 'font-size:0.72rem;background:#f0f0ee;padding:2px 8px;border-radius:999px;margin-left:6px;';
      trustBadge.textContent = `신뢰 ${enhancedData.trustScore}점`;
      ratingEl.appendChild(trustBadge);
    }
  }

  // AI 이유 업데이트
  const reasonEl = card.querySelector('.walker-card__ai-reason');
  if (reasonEl) {
    if (reason) {
      reasonEl.innerHTML = `${icon('sparkles',11,'#F6A623')} ${reason}`;
      reasonEl.style.display = 'inline-block';
    } else {
      reasonEl.style.display = 'none';
    }
  }

  // breakdown 업데이트
  const breakdownEl = card.querySelector('.walker-card__ai-breakdown');
  if (breakdownEl) {
    if (breakdown) {
      breakdownEl.innerHTML = renderAiBreakdownHtml(breakdown);
      breakdownEl.style.display = 'flex';
    } else {
      breakdownEl.style.display = 'none';
    }
  }

  // 블러 오버레이 제거 (애니메이션 후 완전 숨김)
  card.classList.remove('walker-card-item--pending');
  card.classList.add('walker-card-item--revealed');
  const overlay = card.querySelector('.walker-card__ai-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 400);
  }
}

/** 모든 AI 점수가 도착한 후 점수순으로 카드 재정렬 */
function resortWalkerCardsByAiScore() {
  const section = document.getElementById('walker-list-section');
  if (!section) return;
  const cards = Array.from(section.querySelectorAll('.walker-card-item'));
  if (cards.length < 2) return;

  // 현재 DOM의 점수를 읽어서 정렬
  const scored = cards.map(card => {
    const scoreText = card.querySelector('.walker-card__score')?.textContent || '0';
    const score = parseInt(scoreText.replace(/\D/g, ''), 10) || 0;
    return { card, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // 첫 번째 카드의 부모(목록 컨테이너) 기준으로 재배치
  const parent = cards[0].parentNode;
  const moreBtn = parent.querySelector('#walker-list-more-wrap');

  // INITIAL_LIMIT 기준 가시성 갱신
  const INITIAL_LIMIT = 5;
  scored.forEach((item, newIdx) => {
    const { card } = item;
    card.setAttribute('data-walker-idx', String(newIdx));

    // AI 추천 1위 뱃지 토글
    const rankBadge = card.querySelector('.walker-card__rank-badge');
    if (rankBadge) rankBadge.style.display = newIdx === 0 ? '' : 'none';

    // 1위 테두리/아바타 배경 갱신
    card.style.borderColor = newIdx === 0 ? '#00AA76' : '';
    const avatar = card.querySelector('.dw-card__avatar');
    if (avatar) avatar.style.background = newIdx === 0 ? '#00AA76' : '';

    // 접혀있던 상태 유지: 기본적으로 상위 5명만 표시
    if (newIdx >= INITIAL_LIMIT) card.style.display = 'none';
    else card.style.display = '';

    parent.insertBefore(card, moreBtn || null);
  });

  // 더보기 버튼 라벨 갱신 (접힌 상태로 초기화)
  const moreBtnEl = document.getElementById('walker-list-more-btn');
  if (moreBtnEl && scored.length > INITIAL_LIMIT) {
    moreBtnEl.innerHTML = `도우미 ${scored.length - INITIAL_LIMIT}명 더보기 ↓`;
  }
}

/** 백그라운드에서 각 도우미의 Gemini AI 점수를 받아와 개별 카드를 업데이트 */
async function fetchAiScoresAndUpdateCards(walkers, dog) {
  if (!Array.isArray(walkers) || walkers.length === 0) return;

  const tasks = walkers.map(async (w) => {
    try {
      const res = await fetch('/api/matching/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walker: w, dog })
      });
      const data = await res.json();
      const score = data.success ? data.score : calcAiMatchScore(w, dog, []);
      updateWalkerCardWithAi(w.userId, score, data.reason || '', data.breakdown || null, {
        trustScore: data.trustScore,
        historyFallback: data.historyFallback || false
      });
    } catch(e) {
      // 실패 시 로컬 점수로 대체하되 블러는 해제
      const fallback = calcAiMatchScore(w, dog, []);
      updateWalkerCardWithAi(w.userId, fallback, '', null, null);
    }
  });

  // 모든 호출 완료 후 점수순 재정렬
  await Promise.allSettled(tasks);
  resortWalkerCardsByAiScore();
}

/** AI 점수 계산 방식 설명 토글 */
function toggleAiScoreExplain() {
 const el = document.getElementById('ai-score-explain');
 if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function startAiScoreCalc() {
 const btn = document.getElementById('ai-calc-btn');
 const overlay = document.getElementById('ai-score-blur-overlay');
 const list = document.getElementById('ai-walker-list');
 if (!btn || !overlay) return;
 btn.disabled = true;
 btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;border-color:rgba(255,255,255,0.3);border-top-color:#fff;margin-right:8px;"></span> AI 분석 중...`;
 const walkers = window._aiCalcWalkers || [];
 const profile = window._aiCalcProfile || {};
 await fetchAiScoresAndUpdateCards(walkers, profile);
 overlay.style.transition = 'opacity 0.4s';
 overlay.style.opacity = '0';
 if (list) { list.style.filter = 'none'; list.style.pointerEvents = ''; list.style.userSelect = ''; }
 setTimeout(() => { overlay.style.display = 'none'; }, 400);
}

/** AI 추천 도우미 목록 더보기/접기 토글 */
function toggleWalkerListMore(btn) {
 const section = document.getElementById('walker-list-section');
 if (!section) return;
 const hiddenCards = section.querySelectorAll('.walker-card-item[style*="display:none"], .walker-card-item[style*="display: none"]');
 const isExpanding = hiddenCards.length > 0;
 const allCards = section.querySelectorAll('.walker-card-item');

 if (isExpanding) {
   // 펼치기
   allCards.forEach(card => {
     const idx = parseInt(card.getAttribute('data-walker-idx') || '0', 10);
     const borderStyle = idx === 0 ? 'border-color:#00AA76;' : '';
     card.setAttribute('style', borderStyle);
   });
   btn.innerHTML = '접기 ↑';
 } else {
   // 접기
   const INITIAL_LIMIT = 5;
   allCards.forEach(card => {
     const idx = parseInt(card.getAttribute('data-walker-idx') || '0', 10);
     const borderStyle = idx === 0 ? 'border-color:#00AA76;' : '';
     if (idx >= INITIAL_LIMIT) {
       card.setAttribute('style', borderStyle + 'display:none;');
     } else {
       card.setAttribute('style', borderStyle);
     }
   });
   btn.innerHTML = `도우미 ${allCards.length - INITIAL_LIMIT}명 더보기 ↓`;
   // 섹션 상단으로 스크롤
   section.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }
}

/** 요청자: 매칭 완료 후 도우미 이동 중 화면 */
function renderRequesterActiveWalkScreen(user, req) {
 const walkerName = req.walkerName || '도우미';
 const statusMap = {
   accepted: { label: '매칭 완료',    desc: '도우미가 출발 준비 중이에요',         icon: '✅', color: '#00AA76' },
   heading:  { label: '이동 중',      desc: '도우미가 픽업 장소로 오고 있어요',    icon: icon('navigation',14,'#3182CE'), color: '#3182CE' },
   arrived:  { label: '도착',         desc: '도우미가 도착했어요! 반려견을 전달해주세요', icon: icon('map-pin',14,'#F6A623'), color: '#F6A623' },
   handoff:  { label: '인계 완료',    desc: '반려견을 전달했어요. 산책이 곧 시작돼요!', icon: '🐕', color: '#8B5CF6' },
   walking:  { label: '산책 중',      desc: '반려견이 산책 중이에요',              icon: icon('paw-print',14,'#00AA76'), color: '#00AA76' },
 };
 const status = statusMap[req.status] || statusMap.accepted;

 renderPage(`
 <style>
 .active-walk { max-width:500px; margin:0 auto; }
 .active-walk__status { text-align:center; padding:40px 20px 32px; }
 .active-walk__icon { font-size:3rem; margin-bottom:12px; animation:${req.status === 'heading' ? 'walkBounce 1.5s ease-in-out infinite' : 'none'}; }
 @keyframes walkBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
 .active-walk__label { display:inline-block; padding:4px 14px; border-radius:999px; font-size:0.78rem; font-weight:700; margin-bottom:8px; }
 .active-walk__title { font-size:1.2rem; font-weight:800; margin-bottom:6px; }
 .active-walk__desc { font-size:0.88rem; color:var(--color-text-muted); }
 .active-walk__map { border-radius:16px; overflow:hidden; border:1px solid var(--color-border); margin-bottom:24px; position:relative; }
 .active-walk__map-inner { height:300px; width:100%; }
 .active-walk__map-hint { position:absolute; bottom:12px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.7); color:#fff; font-size:0.75rem; padding:6px 14px; border-radius:20px; pointer-events:none; }
 .active-walk__walker { display:flex; align-items:center; gap:14px; padding:18px; background:#fff; border-radius:14px; border:1px solid var(--color-border); margin-bottom:16px; }
 .active-walk__avatar { width:48px; height:48px; border-radius:50%; background:#1a1a1a; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.1rem; }
 .active-walk__actions { display:flex; gap:10px; }
 .active-walk__actions button { flex:1; padding:14px; border-radius:12px; font-weight:700; font-size:0.9rem; cursor:pointer; border:none; }
 </style>

 <div class="active-walk">
 <div class="active-walk__status">
 <div class="active-walk__icon">${status.icon}</div>
 <div class="active-walk__label" style="background:${status.color}20;color:${status.color};">${status.label}</div>
 <div class="active-walk__title">${walkerName}님${req.status === 'heading' ? '이 오고 있어요' : req.status === 'arrived' ? '이 도착했어요' : req.status === 'walking' ? '과 산책 중' : '과 매칭됐어요'}</div>
 <div class="active-walk__desc">${status.desc}</div>
 </div>

 <div class="active-walk__map">
 <div id="requester-live-map" class="active-walk__map-inner"></div>
 <div class="active-walk__map-hint">${req.status === 'heading' ? '도우미 실시간 위치가 표시돼요' : req.status === 'walking' ? '산책 경로가 실시간으로 표시돼요' : '도우미 위치를 기다리는 중...'}</div>
 </div>

 ${req.status === 'walking' ? `
 <div id="requester-walk-stats" style="display:flex;gap:16px;justify-content:center;margin-bottom:16px;padding:12px;background:#f8f8f6;border-radius:12px;">
 <div style="text-align:center;"><div id="rw-time" style="font-size:1.2rem;font-weight:800;">00:00</div><div style="font-size:0.7rem;color:var(--color-text-muted);">산책 시간</div></div>
 <div style="text-align:center;"><div id="rw-dist" style="font-size:1.2rem;font-weight:800;">0.00 km</div><div style="font-size:0.7rem;color:var(--color-text-muted);">이동 거리</div></div>
 <div style="text-align:center;"><div id="rw-points" style="font-size:1.2rem;font-weight:800;">0</div><div style="font-size:0.7rem;color:var(--color-text-muted);">포인트</div></div>
 </div>
 ` : ''}

 <div class="active-walk__walker">
 <div class="active-walk__avatar">${walkerName.charAt(0)}</div>
 <div style="flex:1;">
 <div style="font-weight:700;font-size:0.95rem;">${walkerName}</div>
 <div style="font-size:0.78rem;color:var(--color-text-muted);">산책 도우미</div>
 </div>
 <button class="btn btn-secondary btn-sm" onclick="openChatModal('${req.id}')">💬 채팅</button>
 </div>

 <div class="active-walk__actions">
 ${req.status === 'walking' ? `
 <button style="background:#1a1a1a;color:#fff;" onclick="Router.navigate('/walk-tracking')">🗺️ 경로 보기</button>
 ` : ''}
 <button style="background:#fee2e2;color:#b91c1c;" onclick="cancelActiveWalkRequest('${req.id}')">요청 취소</button>
 </div>
 </div>
 `);

 // 지도 초기화 + 도우미 실시간 위치 표시
 setTimeout(() => _initRequesterLiveMap(req), 300);

 // 하단 채팅 버튼 표시
 showChatButton(req.id);
}

/** 요청자 실시간 지도 초기화 */
function _initRequesterLiveMap(req) {
 const container = document.getElementById('requester-live-map');
 if (!container) return;

 const lat = req.pickupLatitude || 37.5665;
 const lng = req.pickupLongitude || 126.978;
 const map = L.map(container).setView([lat, lng], 16);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
   attribution: 'ⓒ OpenStreetMap'
 }).addTo(map);

 // 내 위치 마커 — GPS로 실제 위치 업데이트
 const myIcon = L.divIcon({ html: '<div style="width:14px;height:14px;background:#3182CE;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>', className: '', iconSize: [14,14], iconAnchor: [7,7] });
 let myMarker = L.marker([lat, lng], { icon: myIcon }).bindPopup('내 위치').addTo(map);
 let myLat = lat, myLng = lng;

 navigator.geolocation.getCurrentPosition((pos) => {
   myLat = pos.coords.latitude;
   myLng = pos.coords.longitude;
   myMarker.setLatLng([myLat, myLng]);
   map.setView([myLat, myLng], 16);
 }, () => {}, { timeout: 5000, enableHighAccuracy: true });

 // 도우미 마커 (실시간 업데이트) — 내 위치보다 크고 눈에 띄게
 const walkerIcon = L.divIcon({ html: '<div style="width:28px;height:28px;background:#F59E0B;border:3px solid #fff;border-radius:50%;box-shadow:0 3px 12px rgba(245,158,11,0.5);animation:pulse 2s infinite;z-index:1000;position:relative;"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.65rem;font-weight:800;">도</div></div>', className: '', iconSize: [28,28], iconAnchor: [14,14] });
 let walkerMarker = null;

 // 두 마커가 모두 보이도록 줌 조정 (서울 전역 확대 방지: 최소 zoom 13 유지)
 function fitBothMarkers(walkerLat, walkerLng) {
   const bounds = L.latLngBounds([[myLat, myLng], [walkerLat, walkerLng]]);
   const computedZoom = map.getBoundsZoom(bounds, false, [50, 50]);
   if (computedZoom < 13) {
     map.setView([myLat, myLng], 15);
   } else {
     map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
   }
 }

 // 도우미 현재 위치 가져오기 (폴링)
 async function fetchWalkerLocation() {
   try {
     const res = await fetch(`/api/walk-requests/${req.id}/walker-location`);
     const data = await res.json();
     if (data.success && data.lat && data.lng) {
       if (!walkerMarker) {
         walkerMarker = L.marker([data.lat, data.lng], { icon: walkerIcon }).bindPopup(`${req.walkerName || '도우미'} 위치`).addTo(map);
         fitBothMarkers(data.lat, data.lng);
       } else {
         walkerMarker.setLatLng([data.lat, data.lng]);
       }
     } else if (!walkerMarker) {
       // fallback: walkers.json에서 도우미 마지막 위치 사용
       try {
         const wRes = await fetch('/api/walkers');
         const walkers = await wRes.json();
         const walker = walkers.find(w => w.userId === req.walkerId);
         if (walker && walker.lat && walker.lng) {
           walkerMarker = L.marker([walker.lat, walker.lng], { icon: walkerIcon }).bindPopup(`${req.walkerName || '도우미'} (마지막 위치)`).addTo(map);
           fitBothMarkers(walker.lat, walker.lng);
         }
       } catch(e2) {}
     }
   } catch(e) {}
 }

 fetchWalkerLocation();
 const pollInterval = setInterval(fetchWalkerLocation, 5000);

 // Socket으로도 실시간 위치 수신
 if (typeof RealtimeService !== 'undefined') {
   RealtimeService.on('walker-location-update', (data) => {
     if (data.requestId !== req.id) return;
     if (!walkerMarker) {
       walkerMarker = L.marker([data.lat, data.lng], { icon: walkerIcon }).bindPopup(`${req.walkerName || '도우미'} 위치`).addTo(map);
       fitBothMarkers(data.lat, data.lng);
     } else {
       walkerMarker.setLatLng([data.lat, data.lng]);
     }
     // walking 상태면 경로 폴리라인 추가
     if (req.status === 'walking' && routePolyline) {
       routePolyline.addLatLng([data.lat, data.lng]);
       routePoints++;
       updateWalkStats();
     }
   });

   // walker-position 이벤트도 수신 (산책 중 경로 트래킹)
   RealtimeService.on('walker-position', (data) => {
     if (!data.latitude || !data.longitude) return;
     if (req.status === 'walking' && routePolyline) {
       const latlng = [data.latitude, data.longitude];
       routePolyline.addLatLng(latlng);
       if (walkerMarker) walkerMarker.setLatLng(latlng);
       else {
         walkerMarker = L.marker(latlng, { icon: walkerIcon }).addTo(map);
       }
       map.panTo(latlng);
       routePoints++;
       updateWalkStats();
     }
   });
 }

 // walking 상태: 경로 폴리라인 초기화 + 산책 시간 타이머
 let routePolyline = null;
 let routePoints = 0;
 let walkStartTime = Date.now();
 let walkTimer = null;

 if (req.status === 'walking') {
   routePolyline = L.polyline([], { color: '#00AA76', weight: 4, opacity: 0.8 }).addTo(map);
   walkStartTime = req.walkStartedAt ? new Date(req.walkStartedAt).getTime() : Date.now();

   // 기존 경로 로드 (세션에서)
   if (req.sessionId) {
     fetch(`/api/walk-sessions/${req.sessionId}/route`)
       .then(r => r.json())
       .then(data => {
         if (data.points && data.points.length > 0) {
           const points = data.points.map(p => [p.latitude, p.longitude]);
           points.forEach(p => routePolyline.addLatLng(p));
           routePoints = points.length;
           const last = points[points.length - 1];
           if (walkerMarker) walkerMarker.setLatLng(last);
           else walkerMarker = L.marker(last, { icon: walkerIcon }).addTo(map);
           map.fitBounds(routePolyline.getBounds(), { padding: [30, 30] });
           updateWalkStats();
         }
       })
       .catch(() => {});
   }

   // 산책 시간 타이머
   walkTimer = setInterval(() => {
     const elapsed = Math.floor((Date.now() - walkStartTime) / 1000);
     const min = Math.floor(elapsed / 60);
     const sec = elapsed % 60;
     const timeEl = document.getElementById('rw-time');
     if (timeEl) timeEl.textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
   }, 1000);
 }

 function updateWalkStats() {
   const pointsEl = document.getElementById('rw-points');
   if (pointsEl) pointsEl.textContent = routePoints;
   const distEl = document.getElementById('rw-dist');
   if (distEl) distEl.textContent = `${(routePoints * 0.007).toFixed(2)} km`;
 }

 // 페이지 떠날 때 정리
 window._requesterLiveMapPoll = pollInterval;
 window._requesterWalkTimer = walkTimer;
}

/** 요청자: 진행 중인 요청 취소 */
async function cancelActiveWalkRequest(requestId) {
 if (!confirm('정말 요청을 취소할까요? 도우미가 이미 이동 중일 수 있어요.')) return;
 try {
   const res = await fetch(`/api/walk-requests/${requestId}/cancel`, {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ cancelledBy: 'requester' })
   });
   const result = await res.json();
   if (!result.success) { showToast(result.error || '취소에 실패했습니다.', 'error'); return; }
   showToast('요청이 취소되었습니다.', 'info');
   if (window._requesterLiveMapPoll) { clearInterval(window._requesterLiveMapPoll); window._requesterLiveMapPoll = null; }
   window._activeWalkRequestId = null;
   // 강제로 일반 대시보드 렌더링 (active walk 체크 우회)
   const user = AuthService.getCurrentUser();
   const myProfile = user ? MatchingService.getMyProfile(user.id) : null;
   if (user && myProfile) {
     MatchingService.refreshFromServer().then(() => renderRequesterDashboard(user, myProfile));
   } else {
     renderMatchingPage();
   }
 } catch(e) {
   showToast('취소에 실패했습니다.', 'error');
 }
}

/** 도우미: 진행 중인 요청 취소 */
async function cancelWalkByWalker(requestId) {
 if (!confirm('정말 산책을 취소할까요? 요청자에게 취소 알림이 전송됩니다.')) return;
 try {
   _stopWalkerLocationSharing();
   await fetch(`/api/walk-requests/${requestId}/cancel`, {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ cancelledBy: 'walker' })
   });
   showToast('산책이 취소되었습니다.', 'info');
   window._activeWalkRequestId = null;
   _activeSessionId = null;
   Router.navigate('/matching');
 } catch(e) {
   showToast('취소에 실패했습니다.', 'error');
 }
}

/** 산책 요청자 대시보드 */
async function renderRequesterDashboard(user, myProfile) {
 const availWalkers = MatchingService.getAvailableWalkers().filter(w => w.userId !== user.id);
 const scheduledWalks = MatchingService.getScheduledWalks(user.id);
 const completedWalks = MatchingService.getCompletedWalks(user.id);

 // 내가 보낸 요청 (서버에서 모든 상태 포함, 최신순)
 let sentRequests = [];
 try {
   sentRequests = await MatchingService.getSentRequestsRemote(user.id);
 } catch(e) { sentRequests = []; }

 // 최근 30분 내 요청만 + "진행 중"으로 간주되는 상태만
 const ACTIVE_STATUSES = ['pending', 'accepted', 'walker_busy', 'rejected'];
 const cutoff = Date.now() - 30 * 60 * 1000;
 const activeRequests = sentRequests.filter(r =>
   ACTIVE_STATUSES.includes(r.status) &&
   new Date(r.createdAt).getTime() > cutoff
 ).slice(0, 5);

 // 쿨다운 맵: toUserId → { status, cooldownEndsAt }
 // 최근 30분 내 거절/walker_busy/취소 이력이 있으면 재요청 차단
 const COOLDOWN_MS = 30 * 60 * 1000;
 const blockedStatuses = ['rejected', 'walker_busy', 'cancelled', 'rejected_matched'];
 const cooldownMap = {};
 sentRequests.forEach(r => {
   if (!blockedStatuses.includes(r.status)) return;
   const updatedMs = new Date(r.updatedAt || r.createdAt).getTime();
   const remaining = COOLDOWN_MS - (Date.now() - updatedMs);
   if (remaining <= 0) return;
   const prev = cooldownMap[r.toUserId];
   if (!prev || updatedMs > prev.updatedMs) {
     cooldownMap[r.toUserId] = { status: r.status, remaining, updatedMs };
   }
 });

 // 현재 pending 중인 요청을 맵으로 (같은 도우미에 재요청 방지)
 const pendingMap = {};
 sentRequests.forEach(r => { if (r.status === 'pending') pendingMap[r.toUserId] = r; });

 const profileCard = `
 <div class="match-profile-card">
 <div class="match-profile-card__left">
 <div class="match-profile-card__avatar">${user.name.charAt(0)}</div>
 <div>
 <div class="match-profile-card__name">${user.name} <span class="badge badge-primary">산책 요청자</span></div>
 <div class="match-profile-card__meta">
 ${myProfile.dogName ? `${icon('paw-print',13)} ${myProfile.dogName}${myProfile.dogBreed ? ' · ' + myProfile.dogBreed : ''}` : ''}
 <span style="display:inline-flex;align-items:center;gap:4px;margin-left:${myProfile.dogName ? '8px' : '0'};padding:2px 8px;background:#E8F5EE;color:#00AA76;border-radius:999px;font-size:0.72rem;font-weight:700;">${icon('map-pin',13)} GPS 즉시 매칭</span>
 </div>
 ${myProfile.notes ? `<div class="match-profile-card__bio">"${myProfile.notes}"</div>` : ''}
 </div>
 </div>
 <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
 <button class="btn btn-secondary btn-sm" onclick="handleSwitchRole()">${icon('refresh-cw',13)} 역할 변경</button>
 <button class="btn btn-ghost btn-sm" onclick="handleRemoveMatchProfile()" style="font-size:0.75rem;color:var(--color-text-muted);">등록 해제</button>
 </div>
 </div>
 `;

 // 1차: 로컬 휴리스틱 점수로 즉시 계산 (AI 호출 없음 → 페이지 즉시 렌더링)
 let scoredWalkers = availWalkers.map(w => ({
   ...w,
   aiScore: calcAiMatchScore(w, myProfile, []),
   aiReason: '',
   aiBreakdown: null,
   aiPending: true  // AI 점수 도착 전이라는 표시
 }));
 scoredWalkers.sort((a, b) => b.aiScore - a.aiScore);

 const WALKER_INITIAL_LIMIT = 5;
 const hasMoreWalkers = scoredWalkers.length > WALKER_INITIAL_LIMIT;

 // 요청자 반려견 기반 최소 가격 (카드 표시용)
 const reqDogs = user.dogs || [];
 const minDogSize = reqDogs.length > 0 ? reqDogs.reduce((min, d) => {
   const order = { small: 0, medium: 1, large: 2 };
   return (order[d.size] || 0) < (order[min.size] || 0) ? d : min;
 }, reqDogs[0]).size : 'small';
 const minWalkPrice = WALK_PRICING[minDogSize] || WALK_PRICING.small;
 const hasMultipleDogs = reqDogs.length > 1;

 const walkerListHtml = scoredWalkers.length > 0
 ? scoredWalkers.map((w, idx) => {
 const displayName = w.userName || w.name || '도우미';
 const stars = '★'.repeat(Math.round(w.rating || 5)) + '☆'.repeat(5 - Math.round(w.rating || 5));
 const scoreColor = w.aiScore >= 80 ? '#00AA76' : w.aiScore >= 60 ? '#F6A623' : '#999';
 const scoreLabel = w.aiScore >= 80 ? '최적' : w.aiScore >= 60 ? '적합' : '보통';
 const isHidden = idx >= WALKER_INITIAL_LIMIT;
 return `
 <div class="dw-card walker-card-item${w.aiPending ? ' walker-card-item--pending' : ''}" data-walker-idx="${idx}" data-walker-id="${w.userId}" style="${idx === 0 ? 'border-color:#00AA76;' : ''}${isHidden ? 'display:none;' : ''}">
 <div class="dw-card__avatar" style="${idx === 0 ? 'background:#00AA76;' : ''}">${displayName.charAt(0)}</div>
 <div class="dw-card__body">
 <div class="dw-card__top">
 <div>
 <div class="dw-card__name">
 ${(() => {
   if (!w.isAvailable) return '<span class="dw-avail-dot dw-avail-dot--off"></span>';
   if (w.isStale) return '<span class="dw-avail-dot" style="background:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,0.2);"></span>';
   return '<span class="dw-avail-dot dw-avail-dot--on"></span>';
 })()}${displayName}
 ${w.isStale && w.minutesSinceSeen != null ? `<span style="font-size:0.65rem;color:#b45309;background:#fef3c7;padding:1px 6px;border-radius:999px;margin-left:6px;font-weight:600;">${w.minutesSinceSeen < 60 ? w.minutesSinceSeen + '분 전 접속' : Math.floor(w.minutesSinceSeen / 60) + '시간 전 접속'}</span>` : ''}
 <span class="walker-card__rank-badge" style="${idx === 0 ? '' : 'display:none;'}font-size:0.68rem;background:#00AA76;color:#fff;padding:2px 7px;border-radius:999px;margin-left:6px;font-weight:700;">AI 추천 1위</span>
 </div>
 <div class="dw-card__rating"><span class="dw-stars">${stars}</span> ${(w.rating || 5).toFixed(1)} · 리뷰 ${w.reviewCount || 0}건${typeof w.trustScore === 'number' ? `<span style="font-size:0.72rem;background:#f0f0ee;padding:2px 8px;border-radius:999px;margin-left:6px;">신뢰 ${w.trustScore}점</span>` : ''}</div>
 </div>
 <div class="walker-card__score-wrap" style="text-align:right;">
 <div class="walker-card__score" style="font-size:1.1rem;font-weight:800;color:${scoreColor};">${w.aiScore}점</div>
 <div class="walker-card__score-label" style="font-size:0.68rem;color:${scoreColor};font-weight:600;">${scoreLabel}</div>
 </div>
 </div>
 <div class="walker-card__ai-reason" style="${w.aiReason ? '' : 'display:none;'}font-size:0.75rem;color:#718096;margin-bottom:6px;padding:4px 8px;background:#f8f8f6;border-radius:6px;display:${w.aiReason ? 'inline-block' : 'none'};">${w.aiReason ? `${icon('sparkles',11,'#F6A623')} ${w.aiReason}` : ''}</div>
 <div class="walker-card__ai-breakdown" style="${w.aiBreakdown ? 'display:flex;' : 'display:none;'}gap:4px;flex-wrap:wrap;margin-bottom:4px;">${w.aiBreakdown ? renderAiBreakdownHtml(w.aiBreakdown) : ''}</div>
 <div class="dw-card__meta">${icon('map-pin',13)} ${w.location || ''} · ${icon('clock',13)} ${w.preferredTime || ''}</div>
 <div class="dw-card__sizes">
 ${w.careerYears ? `<span class="dw-size-tag">${getWalkerLabel('careerYears', w.careerYears)}</span>` : ''}
 ${w.largeDogExp && w.largeDogExp !== 'none' ? `<span class="dw-size-tag">대형견: ${getWalkerLabel('largeDogExp', w.largeDogExp)}</span>` : ''}
 ${w.aggressionHandle && w.aggressionHandle !== 'no' ? `<span class="dw-size-tag">공격성: ${getWalkerLabel('aggressionHandle', w.aggressionHandle)}</span>` : ''}
 ${w.ownPetExp && w.ownPetExp !== 'none' ? `<span class="dw-size-tag">양육: ${getWalkerLabel('ownPetExp', w.ownPetExp)}</span>` : ''}
 ${(w.acceptedSizes || []).map(s => `<span class="dw-size-tag" style="background:#E8F5EE;color:#2e7d32;">${getWalkerLabel('dogSize', s)}</span>`).join('')}
 </div>
 ${w.message ? `<div class="dw-card__bio">"${w.message}"</div>` : ''}
 <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:8px 10px;background:#f8f8f6;border-radius:8px;">
 <span style="font-size:0.72rem;color:#718096;">40분 기준</span>
 <span style="font-size:0.92rem;font-weight:800;color:#1a1a1a;">${minWalkPrice.toLocaleString()}원${hasMultipleDogs ? '~' : ''}</span>
 </div>
 </div>
 <div class="dw-card__action">
 ${pendingMap[w.userId] ? `
   <button class="btn btn-secondary btn-sm" disabled style="opacity:0.65;cursor:not-allowed;white-space:nowrap;">⏳ 응답 대기 중</button>
 ` : cooldownMap[w.userId] ? (() => {
   const cd = cooldownMap[w.userId];
   const mins = Math.max(1, Math.ceil(cd.remaining / 60000));
   const label = cd.status === 'rejected' ? '최근 거절됨'
               : cd.status === 'walker_busy' ? '다른 매칭 중'
               : cd.status === 'cancelled' ? '최근 취소됨'
               : '최근 매칭 실패';
   return `<button class="btn btn-secondary btn-sm" disabled title="${label} · ${mins}분 후 재요청 가능" style="opacity:0.55;cursor:not-allowed;white-space:nowrap;font-size:0.72rem;">🕒 ${mins}분 후</button>`;
 })() : `<button class="btn btn-primary btn-sm" onclick="handleSendMatchRequest('${w.userId}')" style="white-space:nowrap;">${minWalkPrice.toLocaleString()}원${hasMultipleDogs ? '~' : ''} · 요청</button>`}
 </div>
 <div class="walker-card__ai-overlay" style="${w.aiPending ? '' : 'display:none;'}">
   <div class="walker-card__ai-overlay-inner">
     <div class="walker-card__ai-spinner"></div>
     <div class="walker-card__ai-msg">
       <span class="walker-card__ai-title">AI가 적합도를 분석 중이에요</span>
       <span class="walker-card__ai-sub">잠시만 기다려주세요</span>
     </div>
   </div>
 </div>
 </div>`;
 })
 .join('')
 : `<div class="empty-state"><div class="empty-icon">${icon('search',16)}</div><p>현재 매칭 가능한 도우미가 없습니다.<br>잠시 후 다시 확인해 주세요.</p></div>`;

 const scheduledHtml = scheduledWalks.map(s => {
 const pid = s.participants.find(id => id !== user.id) || s.participants[0];
 const pName = MatchingService.getUserName(pid);
 const relative = formatRelativeTime(s.scheduledAt);
 const time = new Date(s.scheduledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
 return `
 <div class="match-walk-card match-walk-card--scheduled">
 <div class="match-walk-card__left">
 <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
 <div class="match-walk-card__info">
 <div class="match-walk-card__name">${pName}</div>
 <div style="font-size:0.8rem;color:var(--color-text-muted);">${icon('clock',12)} 매칭 시각: ${relative} · ${time}</div>
 <span class="badge badge-info" style="margin-top:4px;">산책 진행 중</span>
 </div>
 </div>
 <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
 <button class="btn btn-primary btn-sm" onclick="Router.navigate('/walk-tracking')" style="display:flex;align-items:center;gap:4px;">${icon('map',14)} 산책 시작</button>
 <button class="btn btn-ghost btn-sm" onclick="handleCompleteWalk('${s.id}')" style="font-size:0.75rem;color:var(--color-text-muted);">산책 완료 처리</button>
 </div>
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

 // 내가 보낸 요청 카드 HTML (최근 30분 내, 진행 중 상태)
 const sentRequestsHtml = activeRequests.length > 0
 ? activeRequests.map(r => {
 const toName = MatchingService.getUserName(r.toUserId) || '도우미';
 const relative = formatRelativeTime(r.createdAt);

 let statusBadge = '';
 let statusBgColor = '#fff';
 let statusBorderColor = 'var(--color-border)';
 let footerAction = '';

 if (r.status === 'pending') {
   statusBadge = `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:#fef3c7;color:#b45309;border-radius:999px;font-size:0.72rem;font-weight:700;">
     <span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;animation:dotPulse 1.5s ease-in-out infinite;"></span>응답 대기 중
   </span>`;
   statusBorderColor = '#fcd34d';
   footerAction = `<button class="btn btn-ghost btn-sm" onclick="handleCancelSentRequest('${r.id}')" style="font-size:0.75rem;color:var(--color-text-muted);white-space:nowrap;">요청 취소</button>`;
 } else if (r.status === 'accepted') {
   statusBadge = `<span style="padding:4px 10px;background:#d1fae5;color:#047857;border-radius:999px;font-size:0.72rem;font-weight:700;">? 수락됨</span>`;
   statusBgColor = '#f0fdf4';
   statusBorderColor = '#86efac';
 } else if (r.status === 'rejected') {
   statusBadge = `<span style="padding:4px 10px;background:#fee2e2;color:#b91c1c;border-radius:999px;font-size:0.72rem;font-weight:700;">? 거절됨</span>`;
   statusBorderColor = '#fca5a5';
 } else if (r.status === 'walker_busy') {
   statusBadge = `<span style="padding:4px 10px;background:#fed7aa;color:#9a3412;border-radius:999px;font-size:0.72rem;font-weight:700;">다른 산책 수락됨</span>`;
   statusBorderColor = '#fdba74';
 }

 return `
 <div style="background:${statusBgColor};border:1px solid ${statusBorderColor};border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">
 <div style="width:40px;height:40px;border-radius:50%;background:var(--color-text);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">${toName.charAt(0)}</div>
 <div style="flex:1;min-width:0;">
 <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
 <span style="font-weight:700;font-size:0.9rem;">${toName}님에게 요청</span>
 ${statusBadge}
 </div>
 <div style="font-size:0.72rem;color:var(--color-text-muted);">${relative}</div>
 </div>
 ${footerAction}
 </div>`;
 }).join('')
 : '';

 renderPage(`
 <div class="match-hero">
 <div class="section-label">산책 요청자</div>
 <h1 class="match-hero__title">주변 산책 도우미를<br>찾아보세요</h1>
 <p class="match-hero__sub">가장 빠른 매칭을 원하면 지금 바로를 눌러주세요</p>
 </div>

 <!-- 빠른 매칭 vs 직접 선택 안내 -->
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 24px;">
   <div style="padding:18px;background:#1a1a1a;border-radius:14px;display:flex;flex-direction:column;gap:10px;">
     <div>
       <div style="font-size:0.68rem;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">빠른 매칭</div>
       <div style="font-size:0.92rem;font-weight:700;color:#fff;line-height:1.3;">지금 바로</div>
       <div style="font-size:0.72rem;color:rgba(255,255,255,0.5);margin-top:4px;">온라인 도우미 전체에게 동시 알림 · 선착순 수락</div>
     </div>
     <button onclick="openBroadcastModal()" style="padding:10px;background:#00AA76;border:none;border-radius:10px;color:#fff;font-size:0.85rem;font-weight:700;cursor:pointer;">
       지금 바로 요청
     </button>
   </div>
   <div style="padding:18px;background:#f8f8f6;border:1px solid #e8e8e6;border-radius:14px;display:flex;flex-direction:column;gap:10px;">
     <div>
       <div style="font-size:0.68rem;font-weight:700;color:#aaa;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">직접 선택</div>
       <div style="font-size:0.92rem;font-weight:700;color:#1a1a1a;line-height:1.3;">도우미 지정</div>
       <div style="font-size:0.72rem;color:#aaa;margin-top:4px;">AI 추천 점수 확인 후 원하는 도우미에게 직접 요청</div>
     </div>
     <button onclick="document.getElementById('walker-list-section')?.scrollIntoView({behavior:'smooth'})" style="padding:10px;background:#fff;border:1.5px solid #1a1a1a;border-radius:10px;color:#1a1a1a;font-size:0.85rem;font-weight:700;cursor:pointer;">
       도우미 목록 보기
     </button>
   </div>
 </div>

 <div id="matching-alert"></div>
 ${profileCard}

 ${sentRequestsHtml ? `<div class="match-section">
   <h2 class="match-section__title" style="display:flex;align-items:center;gap:8px;">
     ${icon("flag",16)} 내가 보낸 요청
     <span style="font-size:0.7rem;color:var(--color-text-muted);font-weight:500;">실시간 상태</span>
   </h2>
   ${sentRequestsHtml}
 </div>` : ''}

 <!-- GPS 지도 (메인) -->
 <div class="match-section">
 <div class="dw-section__header" style="margin-bottom:12px;">
 <h2 class="match-section__title" style="margin:0;">${icon('map-pin',13)} 내 근처 산책 도우미</h2>
 <div class="dw-map-controls">
 <select id="dw-radius-sel" class="form-select" style="width:auto;padding:6px 12px;font-size:0.82rem;" onchange="loadDWDiscovery()">
 <option value="3">반경 3km</option>
 <option value="5" selected>반경 5km</option>
 <option value="10">반경 10km</option>
 <option value="20">반경 20km</option>
 </select>
 </div>
 </div>
 <div class="dw-map-wrap">
 <div id="dw-disc-map" class="dw-map"></div>
 <div class="dw-map-hint" id="dw-map-hint" style="flex-direction:column;gap:12px;background:rgba(250,250,248,0.92);backdrop-filter:blur(6px);">
 <div class="spinner" style="width:32px;height:32px;"></div>
 <div style="font-weight:700;font-size:0.95rem;color:var(--color-text);">내 위치를 찾고 있어요</div>
 <div style="font-size:0.78rem;color:var(--color-text-muted);line-height:1.5;">GPS 신호를 잡는 중이에요.<br>위치 권한을 허용해주세요 🐾</div>
 </div>
 </div>
 </div>

 ${completedWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">완료된 산책</h2>${completedHtml}</div>` : ''}

 <!-- AI 추천 도우미 목록 -->
 <div class="match-section" id="walker-list-section">
   <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
     <h2 class="match-section__title" style="margin:0;">${icon('sparkles',16)} AI 추천 도우미</h2>
     <button onclick="toggleAiScoreExplain()" style="font-size:0.75rem;color:#718096;background:none;border:1px solid #e2e8f0;border-radius:999px;padding:4px 12px;cursor:pointer;transition:all 0.15s;">점수 계산 방식 ?</button>
   </div>
   <div id="ai-score-explain" style="display:none;background:#f8f8f6;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;font-size:0.82rem;line-height:1.7;color:#4A5568;">
     <div style="font-weight:700;margin-bottom:8px;color:#1a1a1a;">AI 추천 점수는 이렇게 계산돼요</div>
     <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin-bottom:12px;">
       <span style="font-weight:700;color:#00AA76;">50%</span><span>프로필 적합도 — Gemini AI가 도우미 경력·대형견 경험·공격성 대응력을 내 반려견 특성과 비교해 평가</span>
       <span style="font-weight:700;color:#3182CE;">30%</span><span>이력 보너스 — 내 반려견과 같은 크기의 강아지를 많이 산책시킨 도우미에게 가산점</span>
       <span style="font-weight:700;color:#F6A623;">20%</span><span>신뢰도 — 산책 완료율 + 리뷰 평점 기반 (산책 3회 미만이면 프로필 점수로 대체)</span>
     </div>
     <div style="font-size:0.75rem;color:#999;">점수가 높을수록 내 반려견에게 더 적합한 도우미예요. 장시간 산책을 원하면 장시간 이력이 많은 도우미가 우선 추천돼요.</div>
   </div>
   <div id="ai-score-wrapper" style="position:relative;">
     <div id="ai-score-blur-overlay" style="position:absolute;inset:0;z-index:10;backdrop-filter:blur(6px);background:rgba(255,255,255,0.55);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;">
       <div style="font-size:0.9rem;font-weight:700;color:#1a1a1a;">${icon('sparkles',16,'#7c6ff7')} AI 적합도 분석 준비됨</div>
       <div style="font-size:0.78rem;color:#718096;text-align:center;line-height:1.6;">버튼을 누르면 Gemini AI가 내 반려견에게<br>가장 잘 맞는 도우미를 분석해드려요</div>
       <button id="ai-calc-btn" onclick="startAiScoreCalc()" style="display:flex;align-items:center;gap:8px;padding:12px 28px;background:linear-gradient(135deg,#7c6ff7,#6c47ff);color:#fff;border:none;border-radius:999px;font-size:0.9rem;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(108,71,255,0.35);">
         ${icon('sparkles',15,'#fff')} AI 적합도 계산하기
       </button>
     </div>
     <div id="ai-walker-list" style="filter:blur(4px);pointer-events:none;user-select:none;">${walkerListHtml}</div>
   </div>
   ${hasMoreWalkers ? `
   <div id="walker-list-more-wrap" style="text-align:center;margin-top:16px;">
     <button type="button" id="walker-list-more-btn" onclick="toggleWalkerListMore(this)" style="padding:10px 24px;background:#fff;border:1.5px solid #1a1a1a;border-radius:999px;color:#1a1a1a;font-size:0.82rem;font-weight:700;cursor:pointer;transition:all 0.2s;">
       도우미 ${scoredWalkers.length - WALKER_INITIAL_LIMIT}명 더보기 ↓
     </button>
   </div>` : ''}
 </div>

 <div class="match-section" id="direct-history-section" style="display:none;">
 <h2 class="match-section__title">산책 기록</h2>
 <div id="requester-history-wrap"><div class="spinner" style="margin:20px auto;"></div></div>
 </div>
 <div id="review-form-container"></div>
 `);

 // GPS 자동 로드
 setTimeout(() => loadDWDiscovery(), 300);

 // AI 점수는 버튼 클릭 시에만 계산 (API 토큰 절약)
 window._aiCalcWalkers = availWalkers;
 window._aiCalcProfile = myProfile;

 renderDirectWalkHistory(user.id, 'requester').then(({ html, hasRecords }) => {
 const section = document.getElementById('direct-history-section');
 const wrap = document.getElementById('requester-history-wrap');
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

function handleSwitchRole() {
 const user = AuthService.getCurrentUser();
 if (!user) return;
 const myProfile = MatchingService.getMyProfile(user.id);
 const currentRole = myProfile?.role === 'walker' ? '산책 도우미' : '산책 요청자';
 const nextRole = myProfile?.role === 'walker' ? '산책 요청자' : '산책 도우미';
 if (!confirm(`현재 ${currentRole} 역할을 해제하고 ${nextRole}로 변경할까요?`)) return;
 MatchingService.removeProfile(user.id);
 refreshDrawer();
 renderMatchingRoleSelect(myProfile?.role === 'walker' ? 'requester' : 'walker');
}

/** 도우미 가용 상태 토글 */
async function _syncWalkerState(userId, wantOn, lat, lng) {
 try {
 const res = await fetch('/api/walkers');
 const walkers = await res.json();
 const serverWalker = walkers.find(w => w.userId === userId);
 const serverIsOn = serverWalker?.isAvailable ?? false;

 if (wantOn && !serverIsOn) {
 // OFF → ON: toggle (lat/lng 포함 가능)
 await fetch('/api/walkers/toggle', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId, ...(lat && lng ? { lat, lng } : {}) })
 });
 } else if (wantOn && serverIsOn && lat && lng) {
 // 이미 ON, GPS만 업데이트
 await fetch(`/api/walkers/${userId}/location`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ lat, lng })
 }).catch(() => {});
 } else if (!wantOn && serverIsOn) {
 // ON → OFF: toggle
 await fetch('/api/walkers/toggle', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId })
 });
 }

 await MatchingService.refreshFromServer();
 } catch(e) { console.warn('워커 상태 동기화 실패:', e); }
}

async function handleToggleMatcherAvailability() {
 const user = AuthService.getCurrentUser();
 if (!user) return;

 const currentProfile = MatchingService.getMyProfile(user.id);
 const turningOn = !(currentProfile?.isAvailable);

 if (turningOn) {
 // ON 전환: GPS 먼저 받은 뒤 lat/lng 포함해서 토글
 const statusEl = document.getElementById('dw-avail-status');
 if (statusEl) statusEl.textContent = '위치 감지 중...';

 if (!navigator.geolocation) {
 alert('이 브라우저는 GPS를 지원하지 않아요.');
 if (statusEl) statusEl.textContent = '? 매칭 OFF';
 // 체크박스 원복
 const cb = document.getElementById('match-avail-toggle');
 if (cb) cb.checked = false;
 return;
 }

 navigator.geolocation.getCurrentPosition(async pos => {
 const lat = pos.coords.latitude;
 const lng = pos.coords.longitude;
 MatchingService.setAvailability(user.id, true, lat, lng);
 await _syncWalkerState(user.id, true, lat, lng);
 renderMatchingPage();
 }, async () => {
 MatchingService.setAvailability(user.id, true, null, null);
 await _syncWalkerState(user.id, true, null, null);
 renderMatchingPage();
 }, { timeout: 6000, enableHighAccuracy: false });

 } else {
 MatchingService.setAvailability(user.id, false, null, null);
 await _syncWalkerState(user.id, false, null, null);
 renderMatchingPage();
 }
}

// 요청자 매칭 대기 폴링
let _requesterPollInterval = null;

function startRequesterPolling(userId) {
 stopRequesterPolling();
 _requesterPollInterval = setInterval(async () => {
 try {
 const res = await fetch(`/api/matching/schedules?userId=${userId}`);
 const data = await res.json();
 const newMatch = (data.schedules || []).find(s => s.status === 'scheduled');
 if (newMatch) {
 stopRequesterPolling();
 const alertEl = document.getElementById('matching-alert');
 if (alertEl) {
 alertEl.innerHTML = `
 <div class="match-pending-banner match-pending-banner--success">
 <div class="match-pending-banner__icon"></div>
 <div class="match-pending-banner__text">
 <div class="match-pending-banner__title">매칭이 완료됐어요!</div>
 <div class="match-pending-banner__sub">산책 도우미가 요청을 수락했습니다. 아래에서 확인하세요.</div>
 </div>
 </div>`;
 }
 setTimeout(() => renderMatchingPage(), 1500);
 }
 } catch (e) {}
 }, 5000);
}

function stopRequesterPolling() {
 if (_requesterPollInterval) { clearInterval(_requesterPollInterval); _requesterPollInterval = null; }
}

/** 브로드캐스트 요청 수락 (선착순 매칭) */
async function handleAcceptBroadcastRequest(requestId) {
 const result = await MatchingService.acceptBroadcastRequest(requestId);
 const alertEl = document.getElementById('matching-alert');
 if (result.success) {
 stopWalkerPolling();
 if (alertEl) {
 alertEl.innerHTML = '<div class="alert alert-success">산책 요청을 수락했습니다. 매칭이 완료되었습니다!</div>';
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

/** 보낸 요청 취소 (요청자) */
async function handleCancelSentRequest(requestId) {
 if (!confirm('이 요청을 취소할까요?')) return;
 const result = await MatchingService.cancelSentRequest(requestId);
 const alertEl = document.getElementById('matching-alert');
 if (result && result.success) {
 if (alertEl) {
 alertEl.innerHTML = '<div class="alert alert-success">요청이 취소되었습니다.</div>';
 setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 3000);
 }
 renderMatchingPage();
 } else {
 if (alertEl) {
 alertEl.innerHTML = `<div class="alert alert-error">${result?.error || '요청 취소에 실패했습니다.'}</div>`;
 setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 3000);
 }
 }
}

/** 개별 요청 보내기 (요청자 → 특정 도우미) */
function handleSendMatchRequest(toUserId) {
 const user = AuthService.getCurrentUser();
 if (!user) { Router.navigate('/login'); return; }

 const myProfile = MatchingService.getMyProfile(user.id) || {};
 const selectedDog = (user.dogs || [])[0] || {};

 // 결제 정보 저장 후 결제 모달 표시
 window._pendingPaymentWalkerId = toUserId;
 window._pendingPaymentType = 'direct';

 showPaymentConfirmModal({ dogSize: selectedDog.size || 'small', dogName: selectedDog.name || '반려견' })
 .then(paymentResult => {
   // redirect 방식이라 여기 도달 안 함 (토스 결제창으로 이동)
   // 만약 도달하면 (팝업 방식 등) 직접 요청 전송
   _sendMatchRequestAfterPayment(toUserId, paymentResult);
 })
 .catch(e => {
   if (e === 'cancelled') showToast('결제가 취소되었어요.', 'info');
 });
}

/** 결제 완료 후 매칭 요청 전송 (redirect 복귀 시 또는 직접 호출) */
async function _sendMatchRequestAfterPayment(toUserId, paymentResult) {
 const user = AuthService.getCurrentUser();
 if (!user) return;
 const myProfile = MatchingService.getMyProfile(user.id) || {};
 const selectedDog = (user.dogs || [])[0] || {};

 const alertEl = document.getElementById('matching-alert');

 let lat = null, lng = null;
 try {
   const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
   lat = pos.coords.latitude; lng = pos.coords.longitude;
 } catch(e) {}

 const requestData = {
   dogId: selectedDog.id || null,
   dogName: selectedDog.name || '',
   dogBreed: selectedDog.breed || '',
   dogSize: selectedDog.size || '',
   dogs: paymentResult?.dogs || [{ name: selectedDog.name, size: selectedDog.size }],
   location: '현재 위치',
   lat, lng,
   desiredTime: '지금 (즉시 매칭)',
   notes: myProfile.notes || '',
   paymentOrderId: paymentResult?.orderId || null,
   paymentAmount: paymentResult?.amount || 0,
   duration: paymentResult?.duration || 40
 };

 const result = await MatchingService.sendRequest(user.id, toUserId, requestData);
 if (result && result.success) {
   if (alertEl) {
     alertEl.innerHTML = '<div class="alert alert-success">결제 완료! 매칭 요청을 보냈습니다 💳</div>';
     setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 4000);
   }
   renderMatchingPage();
 } else {
   if (alertEl) {
     alertEl.innerHTML = `<div class="alert alert-error">${result?.error || '요청 전송에 실패했습니다.'}</div>`;
     setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 5000);
   }
 }
}

/** 산책 완료 */
function handleCompleteWalk(scheduleId) {
 const user = AuthService.getCurrentUser();
 if (!user) { Router.navigate('/login'); return; }

 const ok = MatchingService.completeWalk(scheduleId, user.id);
 const alertEl = document.getElementById('matching-alert');

 if (!ok) {
 if (alertEl) {
 alertEl.innerHTML = '<div class="alert alert-error">완료 처리할 수 없는 산책이에요. (이미 완료됐거나 참가자가 아닙니다)</div>';
 setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 4000);
 }
 return;
 }

 renderMatchingPage();
 if (alertEl) {
 alertEl.innerHTML = '<div class="alert alert-success">산책이 완료되었습니다!</div>';
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
 <h3 style="margin-bottom:16px;">${targetName}님에 대한 리뷰</h3>
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

 const result = MatchingService.addReview(scheduleId, {
 reviewerId: user.id,
 targetId: targetId,
 rating: rating,
 text: text.trim()
 });

 if (!result || !result.success) {
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result?.error || '리뷰 등록에 실패했습니다.'}</div>`;
 return;
 }

 renderMatchingPage();
 const alertEl = document.getElementById('matching-alert');
 if (alertEl) {
 alertEl.innerHTML = '<div class="alert alert-success">리뷰가 등록되었습니다! 감사합니다 </div>';
 setTimeout(() => { alertEl.innerHTML = ''; }, 3000);
 }
}

// --- 프로필 페이지 (플레이스홀더) ---
