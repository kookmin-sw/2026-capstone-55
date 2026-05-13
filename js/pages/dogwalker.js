// Pawsitive - Dog Walker Page
// Dog walker discovery, registration, and AI consultation

// ============================================================
// 도그워커 페이지
// ============================================================

const DW_SIZE_LABEL = { small: '소형견', medium: '중형견', large: '대형견' };

/** 인라인 onclick 속성에서 문자열을 안전하게 사용하기 위한 단따옴표 이스케이프 */
function escapeQ(str) { return String(str || '').replace(/'/g, "\\'"); }
const DW_EXP_LABEL = { '없음': '경력 없음', '1년 미만': '1년 미만', '1-3년': '1~3년', '3년 이상': '3년 이상' };


/** 탐색 지도 로드 (GPS 기반) */
function loadDWDiscovery() {
 const btn = document.getElementById('dw-gps-btn');
 if (btn) { btn.textContent = '위치 감지 중...'; btn.disabled = true; }
 const hint = document.getElementById('dw-map-hint');

 // 로딩 상태 표시
 if (hint) {
   hint.style.display = 'flex';
   hint.innerHTML = `
     <div class="spinner" style="width:32px;height:32px;"></div>
     <div style="font-weight:700;font-size:0.95rem;color:var(--color-text);">내 위치를 찾고 있어요</div>
     <div style="font-size:0.78rem;color:var(--color-text-muted);line-height:1.5;">GPS 신호를 잡는 중이에요.<br>위치 권한을 허용해주세요 🐾</div>
   `;
 }

 if (!navigator.geolocation) {
 if (hint) hint.innerHTML = '<div style="font-size:0.9rem;color:var(--color-text-muted);">이 브라우저는 GPS를 지원하지 않아요.</div>';
 if (btn) { btn.textContent = '내 위치로 찾기'; btn.disabled = false; }
 return;
 }

 navigator.geolocation.getCurrentPosition(
 pos => {
 _dwUserLat = pos.coords.latitude;
 _dwUserLng = pos.coords.longitude;
 if (btn) { btn.textContent = '내 위치로 찾기'; btn.disabled = false; }
 // hint는 지도 렌더링 완료 후 숨김 (아래 _renderDiscMap에서 처리)
 if (hint) {
   hint.innerHTML = `
     <div class="spinner" style="width:32px;height:32px;"></div>
     <div style="font-weight:700;font-size:0.95rem;color:var(--color-text);">지도를 불러오는 중이에요</div>
     <div style="font-size:0.78rem;color:var(--color-text-muted);">주변 도우미를 찾고 있어요 🐾</div>
   `;
 }
 const radius = Number(document.getElementById('dw-radius-sel')?.value || 5);
 _renderDiscMap(_dwUserLat, _dwUserLng, radius);
 },
 err => {
 if (hint) hint.innerHTML = `
   <div style="font-size:1.5rem;margin-bottom:8px;">${icon('map-pin',24)}</div>
   <div style="font-weight:700;font-size:0.9rem;color:var(--color-text);">위치 권한이 필요해요</div>
   <div style="font-size:0.78rem;color:var(--color-text-muted);line-height:1.5;margin-top:4px;">브라우저 주소창의 자물쇠 아이콘에서<br>위치 접근을 허용해주세요.</div>
 `;
 if (btn) { btn.textContent = '내 위치로 찾기'; btn.disabled = false; }
 },
 { timeout: 10000, enableHighAccuracy: true }
 );
}

/** 탐색 지도 실제 렌더링 */
async function _renderDiscMap(userLat, userLng, radiusKm) {
 await MatchingService.refreshFromServer();
 if (_dwDiscMap) { try { _dwDiscMap.remove(); } catch(e) {} _dwDiscMap = null; }

 const container = document.getElementById('dw-disc-map');
 if (!container) return;

 _dwDiscMap = L.map('dw-disc-map').setView([userLat, userLng], 14);
 const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
 attribution: 'ⓒ <a href="https://openstreetmap.org">OpenStreetMap</a>'
 }).addTo(_dwDiscMap);

 // 지도 타일 로드 완료 후 로딩 오버레이 숨김
 tileLayer.on('load', () => {
   const hint = document.getElementById('dw-map-hint');
   if (hint) {
     hint.style.transition = 'opacity 0.4s ease';
     hint.style.opacity = '0';
     setTimeout(() => { hint.style.display = 'none'; hint.style.opacity = '1'; }, 400);
   }
 });
 // 안전장치: 5초 후에도 안 사라졌으면 강제 숨김
 setTimeout(() => {
   const hint = document.getElementById('dw-map-hint');
   if (hint && hint.style.display !== 'none') {
     hint.style.display = 'none';
   }
 }, 5000);

 // 내 위치 마커
 const userIcon = L.divIcon({ html: '<div class="dw-map-me"></div>', className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
 L.marker([userLat, userLng], { icon: userIcon }).bindPopup('<b>내 위치</b>').addTo(_dwDiscMap);

 // 반경 원
 L.circle([userLat, userLng], { radius: radiusKm * 1000, color: '#00AA76', fillColor: '#00AA76', fillOpacity: 0.05, weight: 1.5 }).addTo(_dwDiscMap);

 // 도그워커 마커 (ON + GPS 있는 것만 지도에 표시)
 const nearbyWalkers = MatchingService.getNearbyWalkers(userLat, userLng, radiusKm);
 const allWalkers = MatchingService.getAllWalkers().filter(w => w.lat && w.lng && w.isAvailable);
 const noGpsWalkers = MatchingService.getAllWalkers().filter(w => !w.lat && w.isAvailable);

 const currentUser = AuthService.getCurrentUser();

 // GPS 없는 ON 워커 안내
 if (noGpsWalkers.length > 0) {
 const hint = document.getElementById('dw-map-hint');
 const noGpsEl = document.createElement('div');
 noGpsEl.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.65);color:#fff;font-size:0.78rem;padding:6px 14px;border-radius:20px;z-index:999;white-space:nowrap;pointer-events:none;';
 noGpsEl.textContent = `GPS 미등록 도우미 ${noGpsWalkers.length}명은 지도에 표시되지 않아요`;
 document.getElementById('dw-disc-map')?.parentElement?.style && (document.getElementById('dw-disc-map').parentElement.style.position = 'relative');
 document.getElementById('dw-disc-map')?.after(noGpsEl);
 }

 allWalkers.forEach(w => {
 const distObj = nearbyWalkers.find(n => n.userId === w.userId);
 const distTxt = distObj
 ? (distObj.distance < 1 ? `${(distObj.distance * 1000).toFixed(0)}m` : `${distObj.distance.toFixed(1)}km`)
 : '';

 const walkerPhoto = w.profilePhoto || w.profileImage || '';
 const walkerInitial = (w.userName || w.name || '?').charAt(0);
 const icon = L.divIcon({
   html: `<div class="dw-map-walker-pin">
     <div class="dw-map-walker-pin__avatar" style="overflow:hidden;padding:0;">
       ${walkerPhoto
         ? `<img src="${walkerPhoto}" alt="${walkerInitial}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`
         : `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:800;">${walkerInitial}</span>`}
     </div>
     <div class="dw-map-walker-pin__tail"></div>
   </div>`,
   className: '', iconSize: [60, 72], iconAnchor: [30, 72]
 });

 const stars = '★'.repeat(Math.round(w.rating || 5)) + '☆'.repeat(5 - Math.round(w.rating || 5));
 const isMine = currentUser && w.userId === currentUser.id;
 const canRequest = currentUser && !isMine;

 const reqProfile = currentUser ? MatchingService.getMyProfile(currentUser.id) : null;
 const reqDogSize = reqProfile?.dogSize || (currentUser?.dogs?.[0]?.size) || 'small';
 const walkPrice = WALK_PRICING[reqDogSize] || WALK_PRICING.small;
 const photo = w.profilePhoto || w.profileImage || '';
 const careerLabel = {under6m:'6개월 미만','6m1y':'6개월~1년','1y3y':'1~3년',over3y:'3년 이상'}[w.careerYears] || '';
 const largeDogLabel = {lots:'대형견 숙련',some:'대형견 경험',none:''}[w.largeDogExp] || '';
 const aggrLabel = {yes:'공격성 대응 가능',some:'경미한 공격성 OK',no:''}[w.aggressionHandle] || '';
 const tags = [
   w.preferredTime ? `<span style="background:#f0f0ee;color:#555;padding:3px 9px;border-radius:20px;font-size:0.7rem;font-weight:600;">${w.preferredTime}</span>` : '',
   careerLabel ? `<span style="background:#EEF2FF;color:#4338CA;padding:3px 9px;border-radius:20px;font-size:0.7rem;font-weight:600;">경력 ${careerLabel}</span>` : '',
   largeDogLabel ? `<span style="background:#F0FDF4;color:#15803D;padding:3px 9px;border-radius:20px;font-size:0.7rem;font-weight:600;">${largeDogLabel}</span>` : '',
   aggrLabel ? `<span style="background:#FFF7ED;color:#C2410C;padding:3px 9px;border-radius:20px;font-size:0.7rem;font-weight:600;">${aggrLabel}</span>` : '',
 ].filter(Boolean).join('');

 const popupHtml = `
 <div style="font-family:inherit;width:300px;border-radius:20px;overflow:hidden;">
   <!-- 상단: 헤더 (고정, 스크롤 안됨) -->
   <div style="background:linear-gradient(160deg,#1a1a1a 0%,#2d2d2d 100%);padding:22px 20px 18px;text-align:center;">
     <div style="width:86px;height:86px;border-radius:50%;margin:0 auto 12px;border:3px solid #fff;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.35);background:#333;">
       ${photo
         ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;display:block;">`
         : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem;font-weight:800;">${(w.userName||'?').charAt(0)}</div>`}
     </div>
     <div style="color:#fff;font-size:1.05rem;font-weight:800;margin-bottom:4px;">${w.userName || '도우미'}</div>
     <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;">
       <span style="color:#00AA76;font-size:0.72rem;font-weight:700;">● ON</span>
       <span style="color:rgba(255,255,255,0.6);font-size:0.72rem;">${stars} ${(w.rating||5).toFixed(1)} · 리뷰 ${w.reviewCount||0}건</span>
       ${distTxt ? `<span style="color:#00AA76;font-size:0.72rem;font-weight:700;">${distTxt}</span>` : ''}
     </div>
   </div>
   <!-- 본문: 이 div만 스크롤됨 -->
   <div style="background:#fff;padding:16px 18px;max-height:240px;overflow-y:auto;-webkit-overflow-scrolling:touch;">
     ${w.message ? `<div style="font-size:0.8rem;color:#555;line-height:1.55;margin-bottom:12px;padding:10px 12px;background:#f8f8f6;border-radius:10px;font-style:italic;">"${w.message}"</div>` : ''}
     ${tags ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;">${tags}</div>` : ''}
     <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;font-size:0.78rem;color:#555;">
       ${w.location ? `<div style="display:flex;gap:8px;"><span style="color:#aaa;min-width:40px;">위치</span><span style="color:#1a1a1a;font-weight:600;">${w.location.replace('서울특별시 ','')}</span></div>` : ''}
       ${w.ownPetExp && w.ownPetExp !== 'none' ? `<div style="display:flex;gap:8px;"><span style="color:#aaa;min-width:40px;">양육</span><span>${{current:'현재 반려견 양육 중',past:'과거 양육 경험'}[w.ownPetExp]||''}</span></div>` : ''}
       ${(w.breedExp||[]).length > 0 ? `<div style="display:flex;gap:8px;"><span style="color:#aaa;min-width:40px;">견종</span><span>${w.breedExp.slice(0,4).join(' · ')}</span></div>` : ''}
     </div>
     <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8f8f6;border-radius:10px;margin-bottom:12px;">
       <span style="font-size:0.75rem;color:#999;">40분 기준</span>
       <span style="font-size:1.05rem;font-weight:900;color:#1a1a1a;">${walkPrice.toLocaleString()}원~</span>
     </div>
     ${canRequest ? `<button style="width:100%;padding:12px;background:#1a1a1a;color:#fff;border:none;border-radius:12px;font-size:0.9rem;font-weight:800;cursor:pointer;letter-spacing:-0.3px;"
       onclick="openWalkRequestModal('${w.userId}','${escapeQ(w.userName)}')">
       ${walkPrice.toLocaleString()}원 · 산책 요청하기
     </button>` : ''}
     ${isMine ? `<div style="text-align:center;font-size:0.78rem;color:#aaa;padding:6px 0;">내 프로필이에요</div>` : ''}
     ${!currentUser ? `<button style="width:100%;padding:12px;background:#f0f0ee;color:#1a1a1a;border:none;border-radius:12px;font-size:0.88rem;font-weight:700;cursor:pointer;" onclick="Router.navigate('/login')">로그인 후 요청하기</button>` : ''}
   </div>
 </div>`;


 L.marker([w.lat, w.lng], { icon })
 .bindPopup(popupHtml, { maxWidth: 320, className: 'walker-popup', offset: [0, -68] })
 .addTo(_dwDiscMap);
 });

 // 목록을 거리순으로 업데이트
 const listEl = document.getElementById('dw-walker-list');
 const user = AuthService.getCurrentUser();
 if (listEl) {
 if (nearbyWalkers.length === 0) {
 listEl.innerHTML = `<div class="empty-state"><div class="empty-icon"></div><p>반경 ${radiusKm}km 내 도그워커가 없어요.<br>반경을 늘려보세요!</p></div>`;
 } else {
 listEl.innerHTML = nearbyWalkers.map(w => _dwWalkerCard(w, user)).join('');
 }
 // 섹션 제목 업데이트
 const titleEl = document.querySelector('.dw-section__title');
 if (titleEl) titleEl.innerHTML = `반경 ${radiusKm}km 내 도그워커 <span class="dw-count">${nearbyWalkers.length}</span>`;
 }
}

/** 등록 지도 초기화 (GPS 감지 후 마커 표시) */
async function handleToggleAvailability() {
 const user = AuthService.getCurrentUser();
 if (!user) return;

 const cb = document.getElementById('dw-avail-cb');
 const statusEl = document.getElementById('dw-avail-status');
 const turningOn = cb ? cb.checked : false;

 if (turningOn) {
 // GPS 권한 확인 후 ON
 if (!navigator.geolocation) {
 alert('이 브라우저는 GPS를 지원하지 않아 ON 상태로 변경할 수 없습니다.');
 if (cb) cb.checked = false;
 return;
 }

 if (statusEl) statusEl.textContent = '위치 감지 중...';

 navigator.geolocation.getCurrentPosition(
 async (pos) => {
 try {
 const res = await fetch('/api/walkers/toggle', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: user.id, lat: pos.coords.latitude, lng: pos.coords.longitude })
 });
 const result = await res.json();
 if (!result.success) throw new Error(result.error);

 if (statusEl) statusEl.textContent = '매칭 ON';
 await MatchingService.refreshFromServer();

 // GPS 위치 주기 업데이트 시작
 RealtimeService.startGpsUpdates(user.id);
 } catch(e) {
 if (statusEl) statusEl.textContent = '? 매칭 OFF';
 if (cb) cb.checked = false;
 alert(e.message || 'ON 전환에 실패했습니다.');
 }
 },
 (err) => {
 if (statusEl) statusEl.textContent = '? 매칭 OFF';
 if (cb) cb.checked = false;
 alert('위치 권한이 거부됐어요. 브라우저 주소창의 자물쇠 아이콘에서 위치 허용 후 다시 시도해주세요.');
 },
 { enableHighAccuracy: true, timeout: 10000 }
 );
 } else {
 // OFF: 바로 전환
 try {
 const res = await fetch('/api/walkers/toggle', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId: user.id })
 });
 const result = await res.json();
 if (statusEl) statusEl.textContent = '? 매칭 OFF';
 RealtimeService.stopGpsUpdates();
 await MatchingService.refreshFromServer();
 } catch(e) {
 console.error('토글 실패:', e);
 }
 }
}

// ============================================================
// AI 도그워커 추천
// ============================================================

async function handleAIRecommend() {
 const user = AuthService.getCurrentUser();
 const resultEl = document.getElementById('dw-ai-result');

 if (!user) {
 if (resultEl) resultEl.innerHTML = `<div class="card" style="padding:20px; text-align:center; background:var(--color-bg-warm);">AI 추천을 이용하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a>이 필요해요!</div>`;
 return;
 }

 const dogs = user.dogs || [];
 if (dogs.length === 0) {
 if (resultEl) resultEl.innerHTML = `
 <div class="ai-rec-empty">
 반려견 정보가 없어요. <a href="#/profile">프로필에서 강아지를 먼저 등록</a>해주세요!
 </div>`;
 return;
 }

 await MatchingService.refreshFromServer();
 const walkers = MatchingService.getAllWalkers()
 .filter(w => w.isAvailable && w.userId !== user.id);

 if (walkers.length === 0) {
 if (resultEl) resultEl.innerHTML = '<div class="alert alert-error" style="margin-top:12px;">현재 매칭 가능한 도그워커가 없어요.</div>';
 return;
 }

 const dog = dogs[0];
 if (resultEl) resultEl.innerHTML = `
 <div class="ai-rec-loading">
 <div class="spinner"></div>
 <span>AI가 <strong>${dog.name}</strong>에게 맞는 도그워커를 분석하고 있어요...</span>
 </div>`;

 try {
 const resp = await fetch('/api/ai/recommend-walker', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ dogProfile: dog, walkers })
 });
 const data = await resp.json();
 if (data.error) throw new Error(data.error);

 const walkerMap = {};
 walkers.forEach(w => { walkerMap[w.userName] = w; });

 const medals = ['🥇', '🥈', '🥉'];
 if (resultEl) resultEl.innerHTML = `
 <div class="ai-rec-wrap">
 <div class="ai-rec-header">
 <span class="ai-rec-title"> <strong>${dog.name}</strong> 맞춤 도그워커 AI 추천</span>
 <button class="btn btn-secondary btn-sm" onclick="handleAIRecommend()">다시 분석</button>
 </div>
 <div class="ai-rec-list">
 ${(data.recommendations || []).map((rec, i) => {
 const w = walkerMap[rec.walkerName];
 const scoreColor = rec.score >= 90 ? '#00AA76' : rec.score >= 75 ? '#D69E2E' : '#718096';
 return `
 <div class="ai-rec-card">
 <div class="ai-rec-rank">${medals[i] || ''}</div>
 <div class="ai-rec-avatar">${rec.walkerName.charAt(0)}</div>
 <div class="ai-rec-body">
 <div class="ai-rec-name">
 ${rec.walkerName}
 <span class="ai-rec-score" style="color:${scoreColor}">궁합 ${rec.score}점</span>
 </div>
 <div class="ai-rec-highlight"> ${rec.highlight}</div>
 <div class="ai-rec-reason">${rec.matchReason}</div>
 ${w ? `<div class="ai-rec-meta">${w.location} · \${Number(w.price || 0).toLocaleString()}/시간 · ${(w.rating || 5).toFixed(1)}</div>` : ''}
 </div>
 ${w ? `<button class="btn btn-primary btn-sm" onclick="handleDWSendRequest('${w.userId}')">매칭 요청</button>` : ''}
 </div>`;
 }).join('')}
 </div>
 </div>`;
 } catch (err) {
 if (resultEl) resultEl.innerHTML = `<div class="alert alert-error" style="margin-top:12px;">${err.message}</div>`;
 }
}

// ============================================================
// AI 반려견 상담 페이지
// ============================================================

let _aiHistory = []; // 대화 히스토리 (페이지 이탈 전까지 유지)

function renderAIConsultPage() {
 _aiHistory = [];
 const user = AuthService.getCurrentUser();
 if (!user) {
 renderPage(`
 <div class="page-header">
 <h1>AI 행동 상담</h1>
 <p>반려견 행동 전문 AI와 실시간 상담</p>
 </div>
 <div id="ai-chat" style="min-height:300px; max-height:500px; overflow-y:auto; margin-bottom:16px;">
 <div class="card" style="padding:20px; text-align:center; color:var(--color-text-light);">
 <div style="font-size:2.5rem; margin-bottom:8px;">🐕</div>
 <p style="font-weight:700;">안녕하세요! AI 행동 상담사예요~</p>
 <p style="font-size:0.85rem; margin-top:4px;">반려견 행동 문제나 훈련 방법에 대해 물어봐주세요!</p>
 </div>
 </div>
 <div style="display:flex; gap:8px;">
 <input type="text" class="form-input" placeholder="고민을 입력해주세요..." style="flex:1;" onclick="showLoginModal('AI 행동 상담을 이용하려면 로그인이 필요해요!\\n반려견의 행동 문제를 AI가 분석하고 솔루션을 제안해드려요.')">
 <button class="btn btn-primary" onclick="showLoginModal('AI 행동 상담을 이용하려면 로그인이 필요해요!')">전송</button>
 </div>
 `);
 return;
 }
 const dog = user?.dogs?.[0] || null;

 const dogBadge = dog
 ? `<div class="ai-dog-badge">${dog.name} (${dog.breed}) 기준으로 상담</div>`
 : `<div class="ai-dog-badge ai-dog-badge--none">강아지 정보 없이 일반 상담 중</div>`;

 const quickQuestions = [
 '산책 중 다른 개를 보면 짖어요',
 '리드줄 당기는 버릇 고치는 법',
 '하루 산책 시간 얼마나 해야 하나요?',
 '낯선 사람 보면 숨거나 떨어요',
 '산책 중 아무거나 먹으려 해요',
 '대소변 실수를 자꾸 해요',
 ];

 renderPage(`
 <div class="ai-page">
 <div class="ai-page-header">
 <div class="ai-page-header__left">
 <div class="ai-avatar-lg"></div>
 <div>
 <h1 class="ai-page-header__title">포피 AI 상담</h1>
 <p class="ai-page-header__sub">반려견 행동 · 훈련 · 산책 전문 AI</p>
 </div>
 </div>
 ${dogBadge}
 </div>

 <div class="ai-chat" id="ai-chat">
 <div class="ai-msg ai-msg--bot">
 <div class="ai-msg__avatar"></div>
 <div class="ai-msg__bubble">
 안녕하세요! 반려견 전문 AI 포피예요 <br>
 ${dog ? `<strong>${dog.name}</strong>(${dog.breed})에 대해 무엇이든 물어보세요!` : '반려견에 대해 무엇이든 물어보세요!'}
 </div>
 </div>
 </div>

 <div class="ai-quick" id="ai-quick">
 <p class="ai-quick__label">자주 묻는 질문</p>
 <div class="ai-quick__chips">
 ${quickQuestions.map(q => `<button class="ai-chip" onclick="handleQuickQ(this)">${q}</button>`).join('')}
 </div>
 </div>

 <div class="ai-input-row">
 <input
 type="text"
 id="ai-input"
 class="form-input ai-input"
 placeholder="반려견에 대해 무엇이든 물어보세요..."
 onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();handleAIConsultSend();}"
 >
 <button class="btn btn-primary ai-send-btn" id="ai-send-btn" onclick="handleAIConsultSend()">전송</button>
 </div>
 </div>
 `);
}

function handleQuickQ(btn) {
 const input = document.getElementById('ai-input');
 if (input) { input.value = btn.textContent; handleAIConsultSend(); }
}

async function handleAIConsultSend() {
 const input = document.getElementById('ai-input');
 const chat = document.getElementById('ai-chat');
 const sendBtn = document.getElementById('ai-send-btn');
 const quick = document.getElementById('ai-quick');
 const text = input?.value?.trim();
 if (!text || sendBtn?.disabled) return;

 input.value = '';
 if (quick) quick.style.display = 'none';
 sendBtn.disabled = true;
 sendBtn.textContent = '...';

 // 유저 메시지
 _aiHistory.push({ role: 'user', content: text });
 _appendAIMsg('user', text, chat);

 // 봇 응답 자리 (스트리밍으로 채워짐)
 const botId = 'ai-bot-' + Date.now();
 _appendAIMsg('bot', '', chat, botId);
 const bubble = document.querySelector(`#${botId} .ai-msg__bubble`);
 if (bubble) bubble.innerHTML = '<span class="ai-typing">?</span>';

 const user = AuthService.getCurrentUser();
 const dog = user?.dogs?.[0] || null;

 try {
 const response = await fetch('/api/ai/pet-consult', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ messages: _aiHistory, dogProfile: dog })
 });

 const reader = response.body.getReader();
 const decoder = new TextDecoder();
 let buffer = '';
 let aiText = '';

 while (true) {
 const { done, value } = await reader.read();
 if (done) break;
 buffer += decoder.decode(value, { stream: true });
 const lines = buffer.split('\n');
 buffer = lines.pop() || '';

 for (const line of lines) {
 if (!line.startsWith('data: ')) continue;
 const raw = line.slice(6).trim();
 if (raw === '[DONE]') break;
 try {
 const parsed = JSON.parse(raw);
 if (parsed.error) {
 if (bubble) bubble.textContent = parsed.error;
 break;
 }
 if (parsed.text) {
 aiText += parsed.text;
 if (bubble) bubble.innerHTML = aiText.replace(/\n/g, '<br>');
 chat.scrollTop = chat.scrollHeight;
 }
 } catch (_) {}
 }
 }

 if (aiText) _aiHistory.push({ role: 'assistant', content: aiText });
 } catch (_) {
 if (bubble) bubble.textContent = '죄송해요, 잠시 오류가 발생했어요. 다시 시도해주세요.';
 } finally {
 sendBtn.disabled = false;
 sendBtn.textContent = '전송';
 chat.scrollTop = chat.scrollHeight;
 }
}

function _appendAIMsg(type, text, container, id) {
 const div = document.createElement('div');
 div.className = `ai-msg ai-msg--${type}`;
 if (id) div.id = id;
 div.innerHTML = type === 'bot'
 ? `<div class="ai-msg__avatar"></div><div class="ai-msg__bubble">${text}</div>`
 : `<div class="ai-msg__bubble">${text}</div>`;
 container.appendChild(div);
 container.scrollTop = container.scrollHeight;
}

/** 도그워커 등록 해제 */
function startWalkRequestPolling(userId, requestId) {
 if (_walkRequestPollInterval) clearInterval(_walkRequestPollInterval);
 let _shownAcceptedModal = false;

 _walkRequestPollInterval = setInterval(async () => {
 try {
 const res = await fetch(`/api/walk-requests?requesterId=${userId}`);
 const data = await res.json();
 const req = (data.requests || []).find(r => r.id === requestId);
 if (!req) return;

 if (req.status === 'accepted') {
 // 수락 팝업 (최초 1회)
 if (!_shownAcceptedModal) {
 _shownAcceptedModal = true;
 showWalkerAcceptedModal(req);
 }
 // 도우미 위치 지도에 표시
 if (req.walkerCurrentLat && req.walkerCurrentLng && _dwDiscMap) {
 updateWalkerMarkerOnRequesterMap(req.walkerCurrentLat, req.walkerCurrentLng, req.walkerName);
 }
 } else if (req.status === 'rejected' || req.status === 'cancelled') {
 clearInterval(_walkRequestPollInterval); _walkRequestPollInterval = null;
 const alertEl = document.getElementById('matching-alert');
 if (alertEl) {
 alertEl.innerHTML = `<div class="alert alert-error">도우미가 요청을 거절했어요. 다른 도우미를 찾아보세요.</div>`;
 setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 4000);
 }
 } else if (req.status === 'walking') {
 clearInterval(_walkRequestPollInterval); _walkRequestPollInterval = null;
 showWalkingStatus(req);
 }
 } catch(e) {}
 }, 4000);
}

function updateWalkerMarkerOnRequesterMap(lat, lng, walkerName) {
 if (!_dwDiscMap) return;
 const icon = L.divIcon({
 html: `<div style="background:#4299E1;color:#fff;border-radius:50% 50% 50% 0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;border:2px solid #fff;box-shadow:0 2px 8px rgba(66,153,225,0.5);transform:rotate(-45deg)"><span style="transform:rotate(45deg)"></span></div>`,
 className: '', iconSize: [36,36], iconAnchor: [18,36]
 });
 if (_walkerMapMarker) {
 _walkerMapMarker.setLatLng([lat, lng]);
 } else {
 _walkerMapMarker = L.marker([lat, lng], { icon })
 .bindPopup(`<b>${walkerName || '도우미'}</b><br>이동 중 `)
 .addTo(_dwDiscMap);
 }
}

function cancelWalkRequest(requestId) {
 if (!requestId) return;
 fetch(`/api/walk-requests/${requestId}/cancel`, { method: 'PATCH' }).catch(() => {});
 if (_walkRequestPollInterval) { clearInterval(_walkRequestPollInterval); _walkRequestPollInterval = null; }
 const alertEl = document.getElementById('matching-alert');
 if (alertEl) alertEl.innerHTML = '';
}

// 도우미 수락 시 팝업
function showWalkerAcceptedModal(req) {
 const stars = '★'.repeat(Math.round(req.walkerRating || 5)) + '☆'.repeat(5 - Math.round(req.walkerRating || 5));
 const modal = document.createElement('div');
 modal.id = 'walker-accepted-modal';
 modal.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);padding:20px;';
 modal.innerHTML = `
 <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:slideInRight 0.3s ease;">
 <div style="text-align:center;margin-bottom:20px;">
 <div style="font-size:2.5rem;margin-bottom:8px;"></div>
 <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:4px;">도우미님이 오고 계세요!</h2>
 <p style="font-size:0.85rem;color:#718096;">잠시만 기다려주세요. 곧 만나게 돼요.</p>
 </div>

 <div style="background:#F7FAFC;border-radius:12px;padding:16px;margin-bottom:16px;">
 <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
 <div style="width:48px;height:48px;border-radius:50%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800;overflow:hidden;flex-shrink:0;">
 ${req.walkerProfileImage ? `<img src="${req.walkerProfileImage}" style="width:100%;height:100%;object-fit:cover;">` : (req.walkerName || '도').charAt(0)}
 </div>
 <div>
 <div style="font-weight:700;font-size:1rem;">${req.walkerName || '도우미'}</div>
 <div style="font-size:0.8rem;color:#F6AD55;">${stars}</div>
 </div>
 </div>
 ${req.walkerIntro ? `<div style="font-size:0.82rem;color:#4A5568;font-style:italic;margin-bottom:8px;">"${req.walkerIntro}"</div>` : ''}
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.8rem;color:#4A5568;">
 ${req.walkerExperience ? `<span>경력 ${req.walkerExperience}</span>` : ''}
 ${req.walkerPrice ? `<span>${icon("wallet",12)} \${Number(req.walkerPrice).toLocaleString()}/시간</span>` : ''}
 ${req.walkerRating ? `<span> ${Number(req.walkerRating).toFixed(1)}점</span>` : ''}
 ${req.walkerReviewCount ? `<span>리뷰 ${req.walkerReviewCount}건</span>` : ''}
 </div>
 ${req.walkerPhone ? `<div style="margin-top:10px;padding:8px 12px;background:#EBF8FF;border-radius:8px;font-size:0.85rem;"><span style="font-weight:700;">${icon("bell",12)} 연락처:</span> ${req.walkerPhone}</div>` : ''}
 </div>

 <button class="btn btn-primary" style="width:100%;margin-bottom:10px;padding:14px;font-size:1rem;" onclick="startWalkSessionByRequester('${req.id}','${req.walkerId}')">
 도우미 도착! 산책 시작
 </button>
 <button class="btn btn-secondary" style="width:100%;font-size:0.85rem;" onclick="document.getElementById('walker-accepted-modal').remove()">
 닫기 (나중에 시작)
 </button>
 </div>
 `;
 document.body.appendChild(modal);

 // alert 영역도 업데이트
 const alertEl = document.getElementById('matching-alert');
 if (alertEl) alertEl.innerHTML = '';
}

// 요청자가 산책 시작 버튼 누를 때
async function startWalkSessionByRequester(requestId, walkerId) {
 const user = AuthService.getCurrentUser();
 if (!user) return;
 document.getElementById('walker-accepted-modal')?.remove();
 try {
 const res = await fetch('/api/walk-sessions', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ requestId, walkerId, requesterId: user.id })
 });
 const data = await res.json();
 if (data.success && data.session) {
 // GPS 트래킹 페이지로 이동
 window._activeWalkSessionId = data.session.id;
 window._activeWalkRequestId = requestId;
 Router.navigate('/walk-tracking');
 }
 } catch(e) {
 alert('산책 시작에 실패했어요. 다시 시도해주세요.');
 }
}

function showWalkingStatus(req) {
 const alertEl = document.getElementById('matching-alert');
 if (alertEl) {
 alertEl.innerHTML = `
 <div class="match-pending-banner match-pending-banner--success">
 <div class="match-pending-banner__icon"></div>
 <div class="match-pending-banner__text">
 <div class="match-pending-banner__title">산책 중이에요!</div>
 <div class="match-pending-banner__sub">GPS 트래킹으로 이동할게요.</div>
 </div>
 </div>`;
 setTimeout(() => Router.navigate('/walk-tracking'), 1500);
 }
}

// --- 관리자 계정 자동 생성 ---
