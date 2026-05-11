// Pawsitive - Profile Page
// User profile, dog registration, and account management

function renderProfilePage() {
 const user = AuthService.getCurrentUser();
 if (!user) {
 renderPage(`
 <div class="page-header">
 <h1>내 프로필</h1>
 </div>
 <div class="card" style="padding:24px; margin-bottom:16px;">
 <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
 <div style="width:60px;height:60px;border-radius:50%;background:var(--color-primary,#7C4DFF);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;">?</div>
 <div>
 <h3 style="margin:0;">게스트</h3>
 <p style="color:var(--color-text-muted); font-size:0.85rem; margin:4px 0 0;">로그인하면 프로필을 설정할 수 있어요</p>
 </div>
 </div>
 <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
 <div style="padding:12px; background:var(--color-bg-warm); border-radius:10px; text-align:center;">
 <div style="font-size:0.8rem; color:var(--color-text-muted);">보유 코인</div>
 <div style="font-weight:800;">0 PAW</div>
 </div>
 <div style="padding:12px; background:var(--color-bg-warm); border-radius:10px; text-align:center;">
 <div style="font-size:0.8rem; color:var(--color-text-muted);">등록 반려견</div>
 <div style="font-weight:800;">0마리</div>
 </div>
 </div>
 </div>
 <div class="card" style="padding:20px; margin-bottom:16px;">
 <h3 style="margin-bottom:12px;">내 반려견</h3>
 <div style="text-align:center; padding:20px; color:var(--color-text-muted);">
 <div style="font-size:2rem; margin-bottom:8px;"></div>
 <p>반려견을 등록하면 맞춤 서비스를 받을 수 있어요</p>
 </div>
 </div>
 <button class="btn btn-primary" style="width:100%; padding:14px; font-size:1rem;" onclick="showLoginModal('프로필 설정, 반려견 등록, 닉네임 변경 등을 하려면 로그인이 필요해요!')">로그인하고 프로필 설정하기</button>
 `);
 return;
 }

 const sizeMap = { small: '소형', medium: '중형', large: '대형' };

 renderPage(`
 <div class="page-header">
 <h1>내 프로필</h1>
 </div>
 <div class="card" style="padding:24px; margin-bottom:16px;">
 <div class="profile-card-head">
 <label class="profile-avatar-upload">
 <span class="profile-avatar-upload__circle">
 ${user.profileImage ? `<img src="${user.profileImage}" alt="프로필 사진">` : icon('user', 34)}
 </span>
 <input type="file" accept="image/*" onchange="handleProfileImageSelect(this)">
 <span class="profile-avatar-upload__label">사진 변경</span>
 </label>
 <div class="profile-card-head__info">
 <h3 style="margin-bottom:4px;">${user.nickname || user.name}</h3>
 <p style="color:var(--color-text-light); font-size:0.82rem; margin-bottom:10px;">닉네임</p>
 <p style="color:var(--color-text); font-size:0.9rem;">이름: ${user.name}</p>
 <p style="color:var(--color-text-light); font-size:0.9rem; margin-top:4px;">이메일: ${user.email}</p>
 <p style="color:var(--color-text-light); font-size:0.9rem; margin-top:4px;">코인: ${user.pawCoins || 0} PAW (${user.pawCoins || 0}원)</p>
 <p style="color:var(--color-text-muted); font-size:0.8rem; margin-top:8px;">가입일: ${new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
 <p style="color:var(--color-text-muted); font-size:0.72rem; margin-top:4px;">* 이름은 본인만 볼 수 있어요. 다른 사람에게는 닉네임만 표시돼요.</p>
 </div>
 </div>
 ${user.referralCode ? `<div style="margin-top:12px; background:var(--color-bg-warm); border-radius:10px; padding:10px 14px; display:inline-block;">
 <span style="font-size:0.8rem; color:var(--color-text-light);">내 추천인 코드:</span>
 <span style="font-weight:900; color:var(--color-primary-dark); margin-left:6px; letter-spacing:1px;">${user.referralCode}</span>
 </div>` : ''}
 <button class="btn btn-danger btn-sm" style="margin-top:16px;" onclick="handleLogout()">로그아웃</button>
 <button class="btn btn-sm" style="margin-top:8px; background:none; color:var(--color-text-muted); text-decoration:underline; font-size:0.8rem;" onclick="handleDeleteAccount()">회원탈퇴</button>
 </div>

 <div class="card" style="padding:24px; margin-bottom:16px;">
 <h3 style="margin-bottom:16px;">닉네임 변경</h3>
 <div id="nickname-error"></div>
 <div style="display:flex; gap:8px;">
 <input type="text" id="profile-nickname" class="form-input" placeholder="새 닉네임 (2~12자)" maxlength="12" value="${user.nickname || ''}" style="flex:1;">
 <button class="btn btn-primary btn-sm" onclick="handleChangeNickname()">변경</button>
 </div>
 <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:6px;">닉네임은 2주에 한 번 변경할 수 있어요${user.nicknameChangedAt ? ' · 마지막 변경: ' + new Date(user.nicknameChangedAt).toLocaleDateString('ko-KR') : ''}</p>
 </div>

 <div class="card" style="padding:24px; margin-bottom:16px;">
 <h3 style="margin-bottom:16px;">추천인 코드</h3>
 <div style="background:var(--color-bg-warm); border-radius:10px; padding:12px 16px; margin-bottom:16px;">
 <span style="font-size:0.82rem; color:var(--color-text-light);">내 추천인 코드:</span>
 <span style="font-weight:900; color:var(--color-primary-dark); margin-left:6px; letter-spacing:1px;">${user.referralCode || '없음'}</span>
 <p style="font-size:0.72rem; color:var(--color-text-muted); margin-top:4px;">친구에게 공유하고, 친구가 가입 시 입력하면 1,500 PAW 코인을 받아요!</p>
 </div>
 ${user.usedReferralCode
 ? `<div style="padding:12px 16px; background:var(--color-mint-light); border-radius:10px;">
 <span style="font-size:0.85rem; font-weight:700; color:#2D8B5E;">사용한 추천인 코드: ${user.usedReferralCode}</span>
 </div>`
 : `<div id="referral-error"></div>
 <div style="display:flex; gap:8px;">
 <input type="text" id="profile-referral" class="form-input" placeholder="추천인 코드 입력" style="flex:1; text-transform:uppercase;">
 <button class="btn btn-primary btn-sm" onclick="handleApplyReferral()">적용</button>
 </div>
 <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:6px;">추천인 코드는 한 번만 입력할 수 있어요. 입력 시 3,000 PAW 지급!</p>`
 }
 </div>

 <div class="card" style="padding:24px; margin-bottom:16px;">
 <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
 <h3 style="margin:0;">내 반려견</h3>
 <button class="btn btn-primary btn-sm" onclick="openDogRegisterFlow()">+ 등록</button>
 </div>
 ${user.dogs && user.dogs.length > 0
 ? user.dogs.map((d, idx) => `
 <div style="padding:12px 0; ${idx < user.dogs.length - 1 ? 'border-bottom:1px solid var(--color-border);' : ''}">
 <div style="display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="toggleDogDetail(${idx})">
 <div style="width:44px; height:44px; border-radius:50%; background:var(--color-bg-section); display:flex; align-items:center; justify-content:center; overflow:hidden; color:var(--color-text-light); flex-shrink:0;">${d.photo ? `<img src="${d.photo}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover;">` : icon('user', 20)}</div>
 <div style="flex:1;">
 <div style="font-weight:700; font-size:1rem;">${d.name}</div>
 <div style="font-size:0.82rem; color:var(--color-text-light);">${d.breed} · ${d.age}살 · ${sizeMap[d.size] || d.size}</div>
 </div>
 <span id="dog-arrow-${idx}" style="font-size:0.8rem; color:var(--color-text-muted); transition:transform 0.2s;">▼</span>
 </div>
 <div id="dog-detail-${idx}" style="display:none; margin-top:12px; margin-left:56px; background:var(--color-bg); border-radius:12px; padding:16px;">
 <div id="dog-view-${idx}">
 <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
 <div><span style="font-size:0.78rem; color:var(--color-text-muted);">성별</span><div style="font-weight:600; font-size:0.9rem;">${d.gender === 'male' ? '♂ 수컷' : d.gender === 'female' ? '♀ 암컷' : '미등록'}</div></div>
 <div><span style="font-size:0.78rem; color:var(--color-text-muted);">체중</span><div style="font-weight:600; font-size:0.9rem;">${d.weight ? d.weight + 'kg' : '미등록'}</div></div>
 <div><span style="font-size:0.78rem; color:var(--color-text-muted);">중성화</span><div style="font-weight:600; font-size:0.9rem;">${d.neutered === true ? '완료' : d.neutered === false ? '미완료' : '미등록'}</div></div>
 <div><span style="font-size:0.78rem; color:var(--color-text-muted);">성향</span><div style="font-weight:600; font-size:0.9rem;">${d.personality || '미등록'}</div></div>
 </div>
 ${d.healthNote ? `<div style="margin-bottom:12px;"><span style="font-size:0.78rem; color:var(--color-text-muted);">건강 관리 정보</span><div style="font-size:0.85rem; margin-top:4px; padding:10px; background:white; border-radius:8px;">${d.healthNote}</div></div>` : ''}
 <div style="display:flex; gap:8px;">
 <button class="btn btn-secondary btn-sm" style="font-size:0.75rem;" onclick="event.stopPropagation(); showEditDogForm(${idx})">수정</button>
 <button class="btn btn-sm" style="background:#FFF0F0; color:#D32F2F; font-size:0.75rem;" onclick="event.stopPropagation(); handleDeleteDog(${idx})">삭제</button>
 </div>
 </div>
 <div id="dog-edit-${idx}" style="display:none;"></div>
 </div>
 </div>
 `).join('')
 : '<p style="color:var(--color-text-muted);">등록된 반려견이 없습니다.</p>'
 }
 </div>

 <div class="card" style="padding:24px; margin-bottom:16px;">
 <h3 style="margin-bottom:16px;">건강 서류 관리</h3>
 <div id="upload-error"></div>
 <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
 <div style="flex:1; min-width:100px;">
 <label style="font-size:0.85rem; font-weight:600; margin-bottom:4px; display:block;">반려견</label>
 <select id="upload-dog-select" class="form-select" onchange="loadUploadedFiles(null)">
 ${user.dogs && user.dogs.length > 0 ? user.dogs.map(d => `<option value="${d.id}">${d.name}</option>`).join('') : '<option value="">반려견 없음</option>'}
 </select>
 </div>
 <div style="flex:1; min-width:100px;">
 <label style="font-size:0.85rem; font-weight:600; margin-bottom:4px; display:block;">서류 종류</label>
 <select id="upload-type" class="form-select">
 <option value="vaccination">예방접종 증명서</option>
 <option value="checkup">건강검진 결과지</option>
 <option value="treatment">진료 기록 / 처방전</option>
 <option value="surgery">수술 / 시술 기록</option>
 <option value="allergy">알러지 / 질병 진단서</option>
 <option value="medication">복용 약 / 투약 기록</option>
 <option value="other">기타</option>
 </select>
 </div>
 <div style="flex:1; min-width:100px;">
 <label style="font-size:0.85rem; font-weight:600; margin-bottom:4px; display:block;">파일 선택</label>
 <input type="file" id="upload-file" accept=".pdf,.jpg,.jpeg,.png" class="form-input" style="padding:8px;">
 </div>
 </div>
 <button class="btn btn-primary btn-sm" onclick="handleUploadFile()">업로드</button>
 <div id="uploaded-files" style="margin-top:16px;"></div>
 </div>

 <div id="profile-photo-modal" class="profile-photo-modal" style="display:none;">
 <div class="profile-photo-modal__backdrop" onclick="closeProfilePhotoCrop()"></div>
 <div class="profile-photo-modal__card">
 <button class="profile-photo-modal__close" onclick="closeProfilePhotoCrop()" aria-label="닫기">×</button>
 <h3>프로필 사진 맞추기</h3>
 <p>원 안에서 드래그해서 위치를 조정하세요</p>
 <div id="profile-photo-crop-area" class="profile-photo-crop">
 <img id="profile-photo-crop-img" alt="" draggable="false">
 </div>
 <div class="profile-photo-zoom">
 <span>-</span>
 <input type="range" id="profile-photo-zoom" min="100" max="300" value="150" oninput="handleProfilePhotoZoom(this.value)">
 <span>+</span>
 </div>
 <div class="profile-photo-modal__actions">
 <button class="btn btn-secondary btn-sm" onclick="closeProfilePhotoCrop()">취소</button>
 <button class="btn btn-primary btn-sm" onclick="saveProfilePhotoCrop()">저장</button>
 </div>
 </div>
 </div>

 <!-- 토스 스타일 반려견 등록 모달 -->
 <div id="dog-reg-modal" style="display:none; position:fixed; inset:0; z-index:5000; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
 <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px;">
 <div id="dog-reg-card" style="background:#fff; border-radius:20px; width:100%; max-width:420px; min-height:400px; padding:40px 32px; position:relative; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.15);">
 <button onclick="closeDogRegisterFlow()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.2rem; color:#999; cursor:pointer;">?</button>
 <div id="dog-reg-progress" style="display:flex; gap:4px; margin-bottom:32px;"></div>
 <div id="dog-reg-content" style="flex:1; display:flex; flex-direction:column;"></div>
 </div>
 </div>
 </div>
 `);

 loadUploadedFiles(user.id);
}

let _profilePhotoCrop = null;
let _profilePhotoCropCleanup = null;

function handleProfileImageSelect(input) {
 if (!input.files || !input.files[0]) return;
 const file = input.files[0];
 if (!file.type.startsWith('image/')) {
 showToast('이미지 파일만 업로드할 수 있어요.', 'error');
 return;
 }
 if (file.size > 5 * 1024 * 1024) {
 showToast('5MB 이하 사진만 업로드 가능해요.', 'error');
 return;
 }

 const user = AuthService.getCurrentUser();
 if (!user) {
 showLoginModal('프로필 사진을 변경하려면 로그인이 필요해요!');
 return;
 }

 const reader = new FileReader();
 reader.onload = (e) => {
 openProfilePhotoCrop(e.target.result);
 };
 reader.readAsDataURL(file);
}

function openProfilePhotoCrop(src) {
 _profilePhotoCrop = {
 src,
 x: 0,
 y: 0,
 zoom: 150
 };
 const modal = document.getElementById('profile-photo-modal');
 const img = document.getElementById('profile-photo-crop-img');
 const zoom = document.getElementById('profile-photo-zoom');
 if (!modal || !img || !zoom) return;
 zoom.value = '150';
 img.src = src;
 modal.style.display = 'flex';
 setTimeout(() => initProfilePhotoCrop(), 50);
}

function closeProfilePhotoCrop() {
 const modal = document.getElementById('profile-photo-modal');
 if (modal) modal.style.display = 'none';
 if (_profilePhotoCropCleanup) {
 _profilePhotoCropCleanup();
 _profilePhotoCropCleanup = null;
 }
 _profilePhotoCrop = null;
}

function handleProfilePhotoZoom(value) {
 if (!_profilePhotoCrop) return;
 _profilePhotoCrop.zoom = Number(value);
 applyProfilePhotoCropPosition();
}

function initProfilePhotoCrop() {
 const area = document.getElementById('profile-photo-crop-area');
 const img = document.getElementById('profile-photo-crop-img');
 if (!area || !img || !_profilePhotoCrop) return;
 if (_profilePhotoCropCleanup) {
 _profilePhotoCropCleanup();
 _profilePhotoCropCleanup = null;
 }
 img.onload = () => applyProfilePhotoCropPosition();
 if (img.complete) applyProfilePhotoCropPosition();

 let dragging = false;
 let startX = 0;
 let startY = 0;
 let origX = 0;
 let origY = 0;

 function onStart(x, y) {
 dragging = true;
 startX = x;
 startY = y;
 origX = _profilePhotoCrop.x || 0;
 origY = _profilePhotoCrop.y || 0;
 area.style.cursor = 'grabbing';
 }
 function onMove(x, y) {
 if (!dragging || !_profilePhotoCrop) return;
 _profilePhotoCrop.x = origX + (x - startX);
 _profilePhotoCrop.y = origY + (y - startY);
 applyProfilePhotoCropPosition();
 }
 function onEnd() {
 if (!dragging) return;
 dragging = false;
 area.style.cursor = 'grab';
 clampProfilePhotoCropPosition();
 }

 const handleMouseDown = (e) => { e.preventDefault(); onStart(e.clientX, e.clientY); };
 const handleTouchStart = (e) => { const t = e.touches[0]; onStart(t.clientX, t.clientY); };
 const handleMouseMove = (e) => onMove(e.clientX, e.clientY);
 const handleTouchMove = (e) => { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY); };
 area.addEventListener('mousedown', handleMouseDown);
 area.addEventListener('touchstart', handleTouchStart, { passive: true });
 window.addEventListener('mousemove', handleMouseMove);
 window.addEventListener('mouseup', onEnd);
 window.addEventListener('touchmove', handleTouchMove, { passive: true });
 window.addEventListener('touchend', onEnd);
 _profilePhotoCropCleanup = () => {
 area.removeEventListener('mousedown', handleMouseDown);
 area.removeEventListener('touchstart', handleTouchStart);
 window.removeEventListener('mousemove', handleMouseMove);
 window.removeEventListener('mouseup', onEnd);
 window.removeEventListener('touchmove', handleTouchMove);
 window.removeEventListener('touchend', onEnd);
 };
}

function getProfilePhotoCropMetrics() {
 const img = document.getElementById('profile-photo-crop-img');
 if (!img || !img.naturalWidth || !_profilePhotoCrop) return null;
 const areaSize = 184;
 const zoom = (_profilePhotoCrop.zoom || 150) / 100;
 const ratio = img.naturalWidth / img.naturalHeight;
 let width;
 let height;
 if (ratio > 1) {
 height = areaSize * zoom;
 width = height * ratio;
 } else {
 width = areaSize * zoom;
 height = width / ratio;
 }
 const left = ((areaSize - width) / 2) + (_profilePhotoCrop.x || 0);
 const top = ((areaSize - height) / 2) + (_profilePhotoCrop.y || 0);
 return { img, areaSize, width, height, left, top };
}

function applyProfilePhotoCropPosition() {
 const metrics = getProfilePhotoCropMetrics();
 if (!metrics) return;
 const { img, width, height, left, top } = metrics;
 img.style.width = width + 'px';
 img.style.height = height + 'px';
 img.style.left = left + 'px';
 img.style.top = top + 'px';
}

function clampProfilePhotoCropPosition() {
 const metrics = getProfilePhotoCropMetrics();
 if (!metrics || !_profilePhotoCrop) return;
 const maxX = Math.max(0, (metrics.width - metrics.areaSize) / 2);
 const maxY = Math.max(0, (metrics.height - metrics.areaSize) / 2);
 _profilePhotoCrop.x = Math.max(-maxX, Math.min(maxX, _profilePhotoCrop.x || 0));
 _profilePhotoCrop.y = Math.max(-maxY, Math.min(maxY, _profilePhotoCrop.y || 0));
 applyProfilePhotoCropPosition();
}

function saveProfilePhotoCrop() {
 clampProfilePhotoCropPosition();
 const metrics = getProfilePhotoCropMetrics();
 const user = AuthService.getCurrentUser();
 if (!metrics || !user) return;
 const outputSize = 512;
 const canvas = document.createElement('canvas');
 canvas.width = outputSize;
 canvas.height = outputSize;
 const ctx = canvas.getContext('2d');
 const scale = outputSize / metrics.areaSize;
 ctx.drawImage(metrics.img, metrics.left * scale, metrics.top * scale, metrics.width * scale, metrics.height * scale);
 const profileImage = canvas.toDataURL('image/jpeg', 0.86);
 const result = AuthService.updateProfile(user.id, { profileImage });
 if (result.success) {
 closeProfilePhotoCrop();
 showToast('프로필 사진을 변경했어요.', 'success');
 renderProfilePage();
 } else {
 showToast(result.error || '프로필 사진 변경에 실패했어요.', 'error');
 }
}

// 토스 스타일 반려견 등록 플로우
let _dogRegStep = 0;
let _dogRegData = {};

const _dogRegSteps = [
 { key: 'photo', question: '반려견 사진을 올려주세요', sub: '프로필에 표시돼요 (건너뛰기 가능)', type: 'photo', required: false },
 { key: 'name', question: '반려견 이름이 뭐예요?', sub: '사랑하는 아이의 이름을 알려주세요', type: 'text', placeholder: '예: 초코', required: true },
 { key: 'breed', question: '품종을 알려주세요', sub: '검색해서 찾을 수 있어요', type: 'breed-search', required: true },
 { key: 'age', question: '나이가 어떻게 돼요?', sub: '대략적인 나이도 괜찮아요', type: 'number', placeholder: '예: 3', min: 0, max: 30, required: true },
 { key: 'size', question: '크기는 어느 정도예요?', sub: '체중 기준으로 선택해주세요', type: 'cards', options: [
 { value: 'small', label: '소형', desc: '~7kg' },
 { value: 'medium', label: '중형', desc: '7~15kg' },
 { value: 'large', label: '대형', desc: '15kg~' }
 ]},
 { key: 'gender', question: '성별은요?', sub: '', type: 'cards', options: [
 { value: 'male', label: '남아', desc: '수컷' },
 { value: 'female', label: '여아', desc: '암컷' }
 ]},
 { key: 'neutered', question: '중성화 했나요?', sub: '', type: 'cards', options: [
 { value: 'yes', label: '했어요', desc: '중성화 완료' },
 { value: 'no', label: '안 했어요', desc: '미완료' }
 ]},
 { key: 'personality', question: '어떤 성격이에요?', sub: '가장 가까운 걸 골라주세요', type: 'cards', options: [
 { value: '활발함', label: '활발함', desc: '에너지 넘치는' },
 { value: '온순함', label: '온순함', desc: '차분하고 얌전한' },
 { value: '사교적', label: '사교적', desc: '사람을 좋아하는' },
 { value: '겁이 많음', label: '겁쟁이', desc: '낯선 것에 예민한' },
 { value: '독립적', label: '독립적', desc: '혼자도 잘 지내는' }
 ]},
 { key: 'healthNote', question: '특이사항이 있나요?', sub: '알레르기, 지병 등 없으면 건너뛰어도 돼요', type: 'textarea', placeholder: '예: 닭고기 알레르기, 슬개골 탈구 주의', required: false }
];

function openDogRegisterFlow() {
 _dogRegStep = 0;
 _dogRegData = {};
 document.getElementById('dog-reg-modal').style.display = 'block';
 renderDogRegStep();
}

function closeDogRegisterFlow() {
 document.getElementById('dog-reg-modal').style.display = 'none';
}

function renderDogRegStep() {
 const step = _dogRegSteps[_dogRegStep];
 const total = _dogRegSteps.length;
 const content = document.getElementById('dog-reg-content');
 const progress = document.getElementById('dog-reg-progress');

 // 프로그레스 바
 progress.innerHTML = Array.from({length: total}, (_, i) =>
 `<div style="flex:1; height:3px; border-radius:2px; background:${i <= _dogRegStep ? '#1a1a1a' : '#e5e3e0'}; transition:background 0.3s;"></div>`
 ).join('');

 let inputHtml = '';
 if (step.type === 'photo') {
 const preview = _dogRegData.photoPreview || '';
 const hasPhoto = !!preview;
 inputHtml = `
 <div style="text-align:center; margin-top:24px;">
 ${hasPhoto ? `
 <p style="font-size:0.82rem; color:#999; margin-bottom:12px;">드래그해서 위치를 조정하세요</p>
 <div id="dog-photo-crop-area" style="width:160px; height:160px; border-radius:50%; margin:0 auto 16px; overflow:hidden; position:relative; cursor:grab; border:2px solid #e5e3e0; touch-action:none;">
 <img id="dog-photo-crop-img" src="${preview}" style="position:absolute; user-select:none; -webkit-user-drag:none; pointer-events:none;" draggable="false">
 </div>
 <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:16px;">
 <span style="font-size:0.8rem; color:#999;">-</span>
 <input type="range" id="dog-photo-zoom" min="100" max="300" value="${_dogRegData._cropZoom || 150}" style="width:140px; accent-color:#1a1a1a;" oninput="handleDogPhotoZoom(this.value)">
 <span style="font-size:0.8rem; color:#999;">+</span>
 </div>
 <button onclick="removeDogRegPhoto()" style="padding:8px 20px; border:1.5px solid #e5e3e0; border-radius:10px; background:#fff; font-size:0.82rem; color:#999; cursor:pointer;">사진 변경</button>
 ` : `
 <div id="dog-photo-dropzone" style="width:160px; height:160px; border-radius:50%; margin:0 auto 16px; background:#f5f3f0; display:flex; flex-direction:column; align-items:center; justify-content:center; border:2px dashed #d5d3d0; cursor:pointer; transition:border-color 0.2s, background 0.2s;"
 onclick="document.getElementById('dog-reg-photo').click()"
 ondragover="event.preventDefault(); this.style.borderColor='#1a1a1a'; this.style.background='#edecea';"
 ondragleave="this.style.borderColor='#d5d3d0'; this.style.background='#f5f3f0';"
 ondrop="event.preventDefault(); this.style.borderColor='#d5d3d0'; this.style.background='#f5f3f0'; handleDogPhotoDrop(event);">
 <div style="font-size:1.5rem; color:#bbb; margin-bottom:4px;">+</div>
 <div style="font-size:0.75rem; color:#999;">클릭 또는 드래그</div>
 </div>
 <input type="file" id="dog-reg-photo" accept="image/*" style="display:none;" onchange="handleDogPhotoSelect(this)">
 `}
 </div>`;
 } else if (step.type === 'text') {
 inputHtml = `<input type="text" id="dog-reg-input" class="form-input" placeholder="${step.placeholder || ''}" value="${_dogRegData[step.key] || ''}" style="font-size:1.1rem; padding:14px 16px; border-radius:12px; margin-top:24px;" autofocus onkeydown="if(event.key==='Enter')nextDogRegStep()">`;
 } else if (step.type === 'number') {
 inputHtml = `<div style="display:flex; align-items:center; gap:8px; margin-top:24px;"><input type="number" id="dog-reg-input" class="form-input" placeholder="${step.placeholder || ''}" value="${_dogRegData[step.key] || ''}" min="${step.min || 0}" max="${step.max || 100}" style="font-size:1.1rem; padding:14px 16px; border-radius:12px; flex:1;" autofocus onkeydown="if(event.key==='Enter')nextDogRegStep()"><span style="font-size:1rem; font-weight:600; color:var(--color-text-muted);">살</span></div>`;
 } else if (step.type === 'textarea') {
 inputHtml = `<textarea id="dog-reg-input" class="form-input" placeholder="${step.placeholder || ''}" rows="3" style="font-size:1rem; padding:14px 16px; border-radius:12px; margin-top:24px; resize:none;">${_dogRegData[step.key] || ''}</textarea>`;
 } else if (step.type === 'breed-search') {
 inputHtml = `
 <div style="position:relative; margin-top:24px;">
 <input type="text" id="dog-reg-input" class="form-input" placeholder="품종 검색..." value="${_dogRegData[step.key] || ''}" autocomplete="off" style="font-size:1.1rem; padding:14px 16px; border-radius:12px;" oninput="filterDogRegBreed(this.value)" onfocus="filterDogRegBreed(this.value)" autofocus>
 <div id="dog-reg-breed-list" style="max-height:180px; overflow-y:auto; margin-top:8px;"></div>
 </div>`;
 } else if (step.type === 'cards') {
 inputHtml = `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:24px;">
 ${step.options.map(opt => `
 <button onclick="selectDogRegCard('${step.key}','${opt.value}')" id="dog-reg-card-${opt.value}" style="flex:1; min-width:100px; padding:18px 16px; border:1.5px solid ${_dogRegData[step.key] === opt.value ? '#1a1a1a' : '#e5e3e0'}; border-radius:14px; background:${_dogRegData[step.key] === opt.value ? '#f5f3f0' : '#fff'}; text-align:center; cursor:pointer; transition:all 0.15s;">
 <div style="font-size:0.95rem; font-weight:700; color:#1a1a1a;">${opt.label}</div>
 <div style="font-size:0.72rem; color:#999; margin-top:3px;">${opt.desc}</div>
 </button>
 `).join('')}
 </div>`;
 }

 const isLast = _dogRegStep === total - 1;
 const canSkip = !step.required;

 content.innerHTML = `
 <div style="flex:1;">
 <h2 style="font-size:1.4rem; font-weight:700; letter-spacing:-0.5px; line-height:1.3;">${step.question}</h2>
 ${step.sub ? `<p style="font-size:0.88rem; color:#999; margin-top:6px;">${step.sub}</p>` : ''}
 ${inputHtml}
 </div>
 <div style="display:flex; gap:8px; margin-top:24px;">
 ${_dogRegStep > 0 ? `<button onclick="prevDogRegStep()" style="flex:1; padding:14px; border:1.5px solid #e5e3e0; border-radius:12px; background:#fff; font-size:0.9rem; font-weight:600; cursor:pointer;">이전</button>` : ''}
 ${canSkip ? `<button onclick="skipDogRegStep()" style="flex:1; padding:14px; border:1.5px solid #e5e3e0; border-radius:12px; background:#fff; font-size:0.9rem; font-weight:600; color:#999; cursor:pointer;">건너뛰기</button>` : ''}
 <button onclick="${isLast ? 'finishDogRegister()' : 'nextDogRegStep()'}" style="flex:2; padding:14px; border:none; border-radius:12px; background:#1a1a1a; color:#fff; font-size:0.9rem; font-weight:700; cursor:pointer; transition:opacity 0.15s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${isLast ? '등록 완료' : '다음'}</button>
 </div>
 `;

 // 자동 포커스
 setTimeout(() => {
 document.getElementById('dog-reg-input')?.focus();
 if (step.type === 'photo' && _dogRegData.photoPreview) initDogPhotoCrop();
 }, 100);
}

function selectDogRegCard(key, value) {
 _dogRegData[key] = value;
 renderDogRegStep();
 // 카드 선택 후 0.3초 뒤 자동 다음
 setTimeout(() => nextDogRegStep(), 300);
}

function handleDogPhotoSelect(input) {
 if (!input.files || !input.files[0]) return;
 const file = input.files[0];
 if (file.size > 5 * 1024 * 1024) { alert('5MB 이하 사진만 업로드 가능해요.'); return; }
 const reader = new FileReader();
 reader.onload = (e) => {
 _dogRegData.photoPreview = e.target.result;
 _dogRegData._cropX = 0;
 _dogRegData._cropY = 0;
 _dogRegData._cropZoom = 150;
 renderDogRegStep();
 setTimeout(() => initDogPhotoCrop(), 50);
 };
 reader.readAsDataURL(file);
}

function handleDogPhotoDrop(event) {
 const files = event.dataTransfer.files;
 if (!files || !files[0]) return;
 if (!files[0].type.startsWith('image/')) { alert('이미지 파일만 업로드 가능해요.'); return; }
 handleDogPhotoSelect({ files });
}

function removeDogRegPhoto() {
 _dogRegData.photo = '';
 _dogRegData.photoPreview = '';
 _dogRegData._cropX = 0;
 _dogRegData._cropY = 0;
 _dogRegData._cropZoom = 150;
 renderDogRegStep();
}

function handleDogPhotoZoom(val) {
 _dogRegData._cropZoom = Number(val);
 applyDogPhotoCropPosition();
}

function initDogPhotoCrop() {
 const area = document.getElementById('dog-photo-crop-area');
 const img = document.getElementById('dog-photo-crop-img');
 if (!area || !img) return;
 img.onload = () => { applyDogPhotoCropPosition(); };
 if (img.complete) applyDogPhotoCropPosition();
 let dragging = false, startX = 0, startY = 0, origX = 0, origY = 0;
 function onStart(x, y) { dragging = true; startX = x; startY = y; origX = _dogRegData._cropX || 0; origY = _dogRegData._cropY || 0; area.style.cursor = 'grabbing'; }
 function onMove(x, y) { if (!dragging) return; _dogRegData._cropX = origX + (x - startX); _dogRegData._cropY = origY + (y - startY); applyDogPhotoCropPosition(); }
 function onEnd() { dragging = false; area.style.cursor = 'grab'; clampCropPosition(); saveCroppedPhoto(); }
 area.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(e.clientX, e.clientY); });
 window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
 window.addEventListener('mouseup', onEnd);
 area.addEventListener('touchstart', (e) => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: true });
 window.addEventListener('touchmove', (e) => { const t = e.touches[0]; onMove(t.clientX, t.clientY); }, { passive: true });
 window.addEventListener('touchend', onEnd);
}

function applyDogPhotoCropPosition() {
 const img = document.getElementById('dog-photo-crop-img');
 if (!img || !img.naturalWidth) return;
 const areaSize = 160, zoom = (_dogRegData._cropZoom || 150) / 100;
 const ratio = img.naturalWidth / img.naturalHeight;
 let w, h;
 if (ratio > 1) { h = areaSize * zoom; w = h * ratio; } else { w = areaSize * zoom; h = w / ratio; }
 const cx = _dogRegData._cropX || 0, cy = _dogRegData._cropY || 0;
 img.style.width = w + 'px'; img.style.height = h + 'px';
 img.style.left = ((areaSize - w) / 2 + cx) + 'px'; img.style.top = ((areaSize - h) / 2 + cy) + 'px';
}

function clampCropPosition() {
 const img = document.getElementById('dog-photo-crop-img');
 if (!img || !img.naturalWidth) return;
 const areaSize = 160, zoom = (_dogRegData._cropZoom || 150) / 100;
 const ratio = img.naturalWidth / img.naturalHeight;
 let w, h;
 if (ratio > 1) { h = areaSize * zoom; w = h * ratio; } else { w = areaSize * zoom; h = w / ratio; }
 const maxX = Math.max(0, (w - areaSize) / 2), maxY = Math.max(0, (h - areaSize) / 2);
 _dogRegData._cropX = Math.max(-maxX, Math.min(maxX, _dogRegData._cropX || 0));
 _dogRegData._cropY = Math.max(-maxY, Math.min(maxY, _dogRegData._cropY || 0));
 applyDogPhotoCropPosition();
}

function saveCroppedPhoto() {
 const img = document.getElementById('dog-photo-crop-img');
 if (!img || !img.naturalWidth) return;
 const areaSize = 160, zoom = (_dogRegData._cropZoom || 150) / 100;
 const ratio = img.naturalWidth / img.naturalHeight;
 let w, h;
 if (ratio > 1) { h = areaSize * zoom; w = h * ratio; } else { w = areaSize * zoom; h = w / ratio; }
 const cx = _dogRegData._cropX || 0, cy = _dogRegData._cropY || 0;
 const drawX = (areaSize - w) / 2 + cx, drawY = (areaSize - h) / 2 + cy;
 const canvas = document.createElement('canvas');
 const outputSize = 320;
 canvas.width = outputSize; canvas.height = outputSize;
 const ctx = canvas.getContext('2d');
 const scale = outputSize / areaSize;
 ctx.drawImage(img, drawX * scale, drawY * scale, w * scale, h * scale);
 _dogRegData.photo = canvas.toDataURL('image/jpeg', 0.85);
}

function nextDogRegStep() {
 const step = _dogRegSteps[_dogRegStep];
 if (step.type === 'photo' && _dogRegData.photoPreview && !_dogRegData.photo) {
 saveCroppedPhoto();
 }
 if (step.type !== 'photo') {
 const input = document.getElementById('dog-reg-input');
 if (input) _dogRegData[step.key] = input.value.trim();
 }
 if (step.required && !_dogRegData[step.key]) { const input = document.getElementById('dog-reg-input'); if(input) input.style.borderColor='#e53e3e'; return; }
 if (_dogRegStep < _dogRegSteps.length - 1) { _dogRegStep++; renderDogRegStep(); }
}

function prevDogRegStep() {
 if (_dogRegStep > 0) { _dogRegStep--; renderDogRegStep(); }
}

function skipDogRegStep() {
 _dogRegData[_dogRegSteps[_dogRegStep].key] = '';
 if (_dogRegStep < _dogRegSteps.length - 1) { _dogRegStep++; renderDogRegStep(); }
 else finishDogRegister();
}

function filterDogRegBreed(query) {
 const list = document.getElementById('dog-reg-breed-list');
 if (!list || typeof BREEDS_DATA === 'undefined') return;
 const q = query.toLowerCase().trim();
 const filtered = q ? BREEDS_DATA.filter(b => b.name.toLowerCase().includes(q) || (b.nameEn && b.nameEn.toLowerCase().includes(q))).slice(0, 15) : BREEDS_DATA.slice(0, 15);
 const sizeLabel = { small: '소형', medium: '중형', large: '대형' };
 list.innerHTML = filtered.map(b =>
 `<div onclick="document.getElementById('dog-reg-input').value='${b.name}';document.getElementById('dog-reg-breed-list').innerHTML=''" style="padding:10px 14px; font-size:0.88rem; cursor:pointer; display:flex; justify-content:space-between; border-radius:8px; transition:background 0.1s;" onmouseover="this.style.background='#f5f3f0'" onmouseout="this.style.background='transparent'"><span>${b.name}</span><span style="font-size:0.72rem; color:#999;">${sizeLabel[b.size] || ''}</span></div>`
 ).join('');
}

function finishDogRegister() {
 const input = document.getElementById('dog-reg-input');
 if (input) _dogRegData[_dogRegSteps[_dogRegStep].key] = input.value.trim();
 if (_dogRegData.photoPreview && !_dogRegData.photo) {
 saveCroppedPhoto();
 }

 const user = AuthService.getCurrentUser();
 if (!user) return;

 const result = AuthService.registerDog(user.id, {
 name: _dogRegData.name,
 breed: _dogRegData.breed,
 age: Number(_dogRegData.age) || 0,
 size: _dogRegData.size || 'medium',
 gender: _dogRegData.gender || '',
 weight: _dogRegData.weight || null,
 neutered: _dogRegData.neutered === 'yes',
 personality: _dogRegData.personality || '',
 healthNote: _dogRegData.healthNote || '',
 photo: _dogRegData.photo || ''
 });

 if (result.success) {
 closeDogRegisterFlow();
 renderProfilePage();
 } else {
 alert(result.error || '등록에 실패했습니다.');
 }
}

/**
 * 닉네임 변경 핸들러
 */
function handleChangeNickname() {
 const user = AuthService.getCurrentUser();
 if (!user) return;

 const nickname = document.getElementById('profile-nickname')?.value;
 const errEl = document.getElementById('nickname-error');

 const result = AuthService.setNickname(user.id, nickname);
 if (result.success) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-success">닉네임이 변경되었어요! </div>';
 updateNavAuth();
 setTimeout(() => renderProfilePage(), 1500);
 } else {
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
 }
}

/**
 * 추천인 코드 적용 핸들러
 */
function handleApplyReferral() {
 const user = AuthService.getCurrentUser();
 if (!user) return;

 const code = document.getElementById('profile-referral')?.value;
 const errEl = document.getElementById('referral-error');

 const result = AuthService.applyReferralCode(user.id, code);
 if (result.success) {
 alert(`추천인 코드가 적용되었어요! \n\n3,000 PAW 코인이 지급되었어요!\n추천인 ${result.referrerName}님에게도 1,500 PAW가 지급되었어요!`);
 renderProfilePage();
 } else {
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
 }
}

/**
 * 반려견 등록 핸들러
 */
function handleRegisterDog() {
 const user = AuthService.getCurrentUser();
 if (!user) {
 Router.navigate('/login');
 return;
 }

 const name = document.getElementById('dog-name')?.value;
 const breed = document.getElementById('dog-breed')?.value;
 const age = document.getElementById('dog-age')?.value;
 const size = document.getElementById('dog-size')?.value;
 const gender = document.getElementById('dog-gender')?.value;
 const weight = document.getElementById('dog-weight')?.value;
 const neutered = document.getElementById('dog-neutered')?.value;
 const personality = document.getElementById('dog-personality')?.value;
 const healthNote = document.getElementById('dog-health-note')?.value;

 if (!name || !breed || !age || !size) {
 const errEl = document.getElementById('dog-register-error');
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">이름, 품종, 나이, 크기는 필수입니다.</div>';
 return;
 }

 const dogData = {
 name,
 breed,
 age: Number(age),
 size,
 gender: gender || null,
 weight: weight ? Number(weight) : null,
 neutered: neutered === 'yes' ? true : neutered === 'no' ? false : null,
 personality: personality || null,
 healthNote: healthNote || null
 };

 const result = AuthService.registerDog(user.id, dogData);
 if (result.success) {
 renderProfilePage();
 } else {
 const errEl = document.getElementById('dog-register-error');
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
 }
}

// --- 파일 업로드 핸들러 ---
async function handleUploadFile() {
 const user = AuthService.getCurrentUser();
 if (!user) return;

 const fileInput = document.getElementById('upload-file');
 const type = document.getElementById('upload-type')?.value;
 const dogSelect = document.getElementById('upload-dog-select');
 const errEl = document.getElementById('upload-error');

 if (!fileInput?.files[0]) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">파일을 선택해주세요.</div>';
 return;
 }

 const selectedDogId = dogSelect?.value || 'default';
 const selectedDog = user.dogs?.find(d => d.id === selectedDogId);

 const formData = new FormData();
 formData.append('file', fileInput.files[0]);
 formData.append('userId', user.id);
 formData.append('type', type);
 formData.append('dogId', selectedDogId);
 formData.append('dogName', selectedDog?.name || 'default');

 try {
 if (errEl) errEl.innerHTML = '<div class="alert alert-success">업로드 중... 📤</div>';
 const resp = await fetch('/api/upload', { method: 'POST', body: formData });
 const data = await resp.json();
 if (data.success) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-success">업로드 완료! ✅</div>';
 fileInput.value = '';
 loadUploadedFiles(null);
 } else {
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
 }
 } catch (e) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">업로드 실패: 서버 연결 오류</div>';
 }
}

async function loadUploadedFiles(userId) {
 const container = document.getElementById('uploaded-files');
 if (!container) return;

 const user = AuthService.getCurrentUser();
 if (!user) return;

 const dogSelect = document.getElementById('upload-dog-select');
 const selectedDogId = dogSelect?.value || '';
 const selectedDog = user.dogs?.find(d => d.id === selectedDogId);

 try {
 const resp = await fetch(`/api/upload/list/${user.id}`);
 const data = await resp.json();
 if (!data.success || data.files.length === 0) {
 container.innerHTML = `<p style="font-size:0.85rem; color:var(--color-text-muted);">${selectedDog ? selectedDog.name + '의' : ''} 업로드된 서류가 없습니다.</p>`;
 return;
 }

 // 선택된 반려견의 서류만 필터링
 const filteredFiles = selectedDogId
   ? data.files.filter(f => f.dogId === selectedDogId || f.dogName === selectedDog?.name)
   : data.files;

 if (filteredFiles.length === 0) {
   container.innerHTML = `<p style="font-size:0.85rem; color:var(--color-text-muted);">${selectedDog ? selectedDog.name + '의' : ''} 업로드된 서류가 없습니다.</p>`;
   return;
 }

 const typeLabel = { vaccination: '💉 예방접종 증명서', checkup: '🩺 건강검진 결과지', treatment: '📝 진료 기록 / 처방전', surgery: '🏥 수술 / 시술 기록', allergy: '⚠️ 알러지 / 질병 진단서', medication: '💊 복용 약 / 투약 기록', diagnosis: '🏥 진단서', other: '📄 기타' };
 container.innerHTML = filteredFiles.map(f => `
 <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--color-bg); border-radius:8px; margin-bottom:6px;">
 <div>
 <div style="font-weight:600; font-size:0.85rem;">${typeLabel[f.type] || '📄 기타'}</div>
 <div style="font-size:0.78rem; color:var(--color-text-muted);">${f.originalName} · ${(f.size / 1024).toFixed(0)}KB · ${new Date(f.uploadedAt).toLocaleDateString('ko-KR')}</div>
 </div>
 <div style="display:flex; gap:6px;">
 <a href="/api/upload/download/${f.filename}" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">다운로드</a>
 <button class="btn btn-sm" style="background:#FFF0F0; color:#D32F2F; font-size:0.75rem;" onclick="handleDeleteFile('${f.id}')">삭제</button>
 </div>
 </div>
 `).join('');
 } catch (e) {
 container.innerHTML = '<p style="font-size:0.85rem; color:var(--color-text-muted);">서류 목록을 불러올 수 없습니다.</p>';
 }
}

async function handleUploadDogFile(idx, inputEl) {
 const user = AuthService.getCurrentUser();
 if (!user || !user.dogs[idx]) return;

 const dog = user.dogs[idx];
 const file = inputEl.files[0];
 if (!file) return;

 const type = document.getElementById(`upload-type-${idx}`)?.value || 'other';
 const msgEl = document.getElementById(`upload-msg-${idx}`);

 const formData = new FormData();
 formData.append('file', file);
 formData.append('userId', user.id);
 formData.append('type', type);
 formData.append('dogId', dog.id);
 formData.append('dogName', dog.name);

 try {
 if (msgEl) msgEl.innerHTML = '<span style="font-size:0.75rem;color:var(--color-text-muted);">업로드 중...</span>';
 const resp = await fetch('/api/upload', { method: 'POST', body: formData });
 const data = await resp.json();
 if (data.success) {
 if (msgEl) msgEl.innerHTML = '<span style="font-size:0.75rem;color:#2D8B5E;">✅ 업로드 완료</span>';
 inputEl.value = '';
 loadDogFiles(idx, dog.id, user.id);
 setTimeout(() => { if (msgEl) msgEl.innerHTML = ''; }, 2000);
 } else {
 if (msgEl) msgEl.innerHTML = `<span style="font-size:0.75rem;color:#D32F2F;">${data.error}</span>`;
 }
 } catch (e) {
 if (msgEl) msgEl.innerHTML = '<span style="font-size:0.75rem;color:#D32F2F;">업로드 실패</span>';
 }
}

async function loadDogFiles(idx, dogId, userId) {
 const container = document.getElementById(`dog-files-${idx}`);
 if (!container) return;

 try {
 const resp = await fetch(`/api/upload/list/${userId}`);
 const data = await resp.json();
 if (!data.success) { container.innerHTML = ''; return; }

 const files = data.files.filter(f => f.dogId === dogId);
 if (files.length === 0) {
 container.innerHTML = '<p style="font-size:0.75rem;color:var(--color-text-muted);margin:4px 0;">등록된 서류 없음</p>';
 return;
 }

 const typeLabel = { vaccination: '💉 예방접종', checkup: '🩺 건강검진', treatment: '📝 진료/처방', surgery: '🏥 수술/시술', allergy: '⚠️ 알러지/질병', medication: '💊 투약기록', diagnosis: '🏥 진단서', other: '📄 기타' };
 container.innerHTML = files.map(f => `
 <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:var(--color-bg-section);border-radius:6px;margin-bottom:4px;">
 <div style="font-size:0.75rem;">
 <span style="font-weight:600;">${typeLabel[f.type] || '📄'}</span>
 <span style="color:var(--color-text-muted);margin-left:4px;">${f.originalName}</span>
 </div>
 <div style="display:flex;gap:4px;">
 <a href="/api/upload/download/${f.filename}" style="font-size:0.68rem;color:var(--color-mint);text-decoration:none;">다운</a>
 <button style="font-size:0.68rem;color:#D32F2F;background:none;border:none;cursor:pointer;" onclick="handleDeleteFile('${f.id}')">삭제</button>
 </div>
 </div>
 `).join('');
 } catch (e) {
 container.innerHTML = '';
 }
}

async function handleDeleteFile(fileId) {
 if (!confirm('이 서류를 삭제하시겠어요?')) return;
 try {
 await fetch(`/api/upload/${fileId}`, { method: 'DELETE' });
 const user = AuthService.getCurrentUser();
 if (user) loadUploadedFiles(user.id);
 } catch (e) {
 alert('삭제 실패');
 }
}

function handleDeleteDog(dogIndex) {
 const user = AuthService.getCurrentUser();
 if (!user || !user.dogs || !user.dogs[dogIndex]) return;

 const dogName = user.dogs[dogIndex].name;
 if (!confirm(`"${dogName}"을(를) 삭제하시겠어요?\n삭제된 정보는 복구할 수 없습니다.`)) return;

 const users = StorageService.get('users', []);
 const userIdx = users.findIndex(u => u.id === user.id);
 if (userIdx === -1) return;

 users[userIdx].dogs.splice(dogIndex, 1);
 StorageService.set('users', users);

 const updated = { ...users[userIdx] };
 delete updated.passwordHash;
 StorageService.set('currentUser', updated);

 renderProfilePage();
}

function toggleDogDetail(idx) {
 const detail = document.getElementById(`dog-detail-${idx}`);
 const arrow = document.getElementById(`dog-arrow-${idx}`);
 if (!detail) return;
 const isOpen = detail.style.display !== 'none';
 detail.style.display = isOpen ? 'none' : 'block';
 if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
}

function showEditDogForm(idx) {
 const user = AuthService.getCurrentUser();
 if (!user || !user.dogs || !user.dogs[idx]) return;
 const d = user.dogs[idx];

 const viewEl = document.getElementById(`dog-view-${idx}`);
 const editEl = document.getElementById(`dog-edit-${idx}`);
 if (!viewEl || !editEl) return;

 viewEl.style.display = 'none';
 editEl.style.display = 'block';
 editEl.innerHTML = `
 <div id="edit-dog-error-${idx}"></div>
 <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
 <div class="form-group" style="margin-bottom:0;">
 <label style="font-size:0.78rem;">이름</label>
 <input type="text" id="edit-dog-name-${idx}" class="form-input" value="${d.name || ''}">
 </div>
 <div class="form-group" style="margin-bottom:0;">
 <label style="font-size:0.78rem;">품종</label>
 <select id="edit-dog-breed-${idx}" class="form-select">
 <option value="">품종 선택</option>
 ${typeof BREEDS_DATA !== 'undefined' ? BREEDS_DATA.map(b => `<option value="${b.name}" ${d.breed === b.name ? 'selected' : ''}>${b.name}</option>`).join('') : ''}
 </select>
 </div>
 <div class="form-group" style="margin-bottom:0;">
 <label style="font-size:0.78rem;">나이 (살)</label>
 <input type="number" id="edit-dog-age-${idx}" class="form-input" value="${d.age || ''}" min="0" max="30">
 </div>
 <div class="form-group" style="margin-bottom:0;">
 <label style="font-size:0.78rem;">크기</label>
 <select id="edit-dog-size-${idx}" class="form-select">
 <option value="">크기 선택</option>
 <option value="small" ${d.size === 'small' ? 'selected' : ''}>소형</option>
 <option value="medium" ${d.size === 'medium' ? 'selected' : ''}>중형</option>
 <option value="large" ${d.size === 'large' ? 'selected' : ''}>대형</option>
 </select>
 </div>
 <div class="form-group" style="margin-bottom:0;">
 <label style="font-size:0.78rem;">성별</label>
 <select id="edit-dog-gender-${idx}" class="form-select">
 <option value="">선택</option>
 <option value="male" ${d.gender === 'male' ? 'selected' : ''}>수컷</option>
 <option value="female" ${d.gender === 'female' ? 'selected' : ''}>암컷</option>
 </select>
 </div>
 <div class="form-group" style="margin-bottom:0;">
 <label style="font-size:0.78rem;">체중 (kg)</label>
 <input type="number" id="edit-dog-weight-${idx}" class="form-input" value="${d.weight || ''}" min="0" max="100" step="0.1">
 </div>
 <div class="form-group" style="margin-bottom:0;">
 <label style="font-size:0.78rem;">중성화</label>
 <select id="edit-dog-neutered-${idx}" class="form-select">
 <option value="">선택</option>
 <option value="yes" ${d.neutered === true ? 'selected' : ''}>완료</option>
 <option value="no" ${d.neutered === false ? 'selected' : ''}>미완료</option>
 </select>
 </div>
 <div class="form-group" style="margin-bottom:0;">
 <label style="font-size:0.78rem;">성향</label>
 <select id="edit-dog-personality-${idx}" class="form-select">
 <option value="">선택</option>
 <option value="활발함" ${d.personality === '활발함' ? 'selected' : ''}>활발함</option>
 <option value="온순함" ${d.personality === '온순함' ? 'selected' : ''}>온순함</option>
 <option value="겁이 많음" ${d.personality === '겁이 많음' ? 'selected' : ''}>겁이 많음</option>
 <option value="사교적" ${d.personality === '사교적' ? 'selected' : ''}>사교적</option>
 <option value="독립적" ${d.personality === '독립적' ? 'selected' : ''}>독립적</option>
 <option value="공격적 성향" ${d.personality === '공격적 성향' ? 'selected' : ''}>공격적 성향</option>
 </select>
 </div>
 </div>
 <div class="form-group" style="margin-bottom:12px;">
 <label style="font-size:0.78rem;">건강 관리 정보</label>
 <textarea id="edit-dog-health-${idx}" class="form-input" rows="3" style="resize:vertical;" placeholder="알레르기, 지병, 복용 중인 약 등 특이사항을 입력하세요">${d.healthNote || ''}</textarea>
 </div>
 <div style="display:flex; gap:8px;">
 <button class="btn btn-primary btn-sm" onclick="handleSaveEditDog(${idx})">저장</button>
 <button class="btn btn-secondary btn-sm" onclick="cancelEditDog(${idx})">취소</button>
 </div>
 `;
}

function cancelEditDog(idx) {
 const viewEl = document.getElementById(`dog-view-${idx}`);
 const editEl = document.getElementById(`dog-edit-${idx}`);
 if (viewEl) viewEl.style.display = 'block';
 if (editEl) editEl.style.display = 'none';
}

function handleSaveEditDog(idx) {
 const user = AuthService.getCurrentUser();
 if (!user || !user.dogs || !user.dogs[idx]) return;

 const name = document.getElementById(`edit-dog-name-${idx}`)?.value?.trim();
 const breed = document.getElementById(`edit-dog-breed-${idx}`)?.value;
 const age = document.getElementById(`edit-dog-age-${idx}`)?.value;
 const size = document.getElementById(`edit-dog-size-${idx}`)?.value;
 const gender = document.getElementById(`edit-dog-gender-${idx}`)?.value;
 const weight = document.getElementById(`edit-dog-weight-${idx}`)?.value;
 const neutered = document.getElementById(`edit-dog-neutered-${idx}`)?.value;
 const personality = document.getElementById(`edit-dog-personality-${idx}`)?.value;
 const healthNote = document.getElementById(`edit-dog-health-${idx}`)?.value;

 if (!name || !breed || !age || !size) {
 const errEl = document.getElementById(`edit-dog-error-${idx}`);
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">이름, 품종, 나이, 크기는 필수입니다.</div>';
 return;
 }

 const users = StorageService.get('users', []);
 const userIdx = users.findIndex(u => u.id === user.id);
 if (userIdx === -1) return;

 const dog = users[userIdx].dogs[idx];
 dog.name = name;
 dog.breed = breed;
 dog.age = Number(age);
 dog.size = size;
 dog.gender = gender || null;
 dog.weight = weight ? Number(weight) : null;
 dog.neutered = neutered === 'yes' ? true : neutered === 'no' ? false : null;
 dog.personality = personality || null;
 dog.healthNote = healthNote || null;

 StorageService.set('users', users);
 const updated = { ...users[userIdx] };
 delete updated.passwordHash;
 StorageService.set('currentUser', updated);

 renderProfilePage();
}

// --- 로그인 페이지 ---
