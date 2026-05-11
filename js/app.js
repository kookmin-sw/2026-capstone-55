// Pawsitive - Main App (Initialization, Route Registration, Walk Session)
function initApp() {
  function registerRoutes() {
    Router.register('/', renderHomePage);
    Router.register('/breeds', renderBreedListPage);
    Router.register('/breeds/:id', renderBreedDetailPage);
    Router.register('/education', renderEducationPage);
    Router.register('/education/:id', renderEducationDetailPage);
    Router.register('/ai', renderAiPage);
    Router.register('/ai-symptom', renderAiSymptomPage);
    Router.register('/ai-consult', renderAiPage);
    Router.register('/community', renderCommunityPage);
    Router.register('/wallet', renderWalletPage);
    Router.register('/matching', renderMatchingPage);
    Router.register('/dog-walker', renderDogWalkerPage);
    Router.register('/health', renderHealthDashboardPage);
    Router.register('/walk-tracking', renderWalkTrackingPage);
    Router.register('/ai-consult-claude', renderAIConsultPage);
    Router.register('/profile', renderProfilePage);
    Router.register('/admin', renderAdminPage);
    Router.register('/login', renderLoginPage);
    Router.register('/register', renderRegisterPage);
    Router.register('/auth-callback', handleSocialAuthCallback);
    Router.register('/social-agree', renderSocialAgreePage);
    Router.register('/welcome-setup', renderWelcomeSetupPage);
    Router.setNotFound(renderNotFoundPage);
  }

  // 서버에서 공유 데이터 로드 후 앱 시작
  StorageService.syncFromServer().then(() => {
    ensureAdminAccount();
    renderNavbar();
    registerRoutes();
    Router.init();
    console.log('[Pawsitive] 앱이 초기화되었습니다. 🐾');
  }).catch(e => {
    console.error('[Pawsitive] 서버 동기화 실패, 로컬 모드로 시작:', e);
    ensureAdminAccount();
    renderNavbar();
    registerRoutes();
    Router.init();
  });
}

// DOM 로드 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  initRealtimeListeners();
});

// ============================================================
// Socket.IO 실시간 이벤트 핸들러 초기화
// ============================================================

function initRealtimeListeners() {
  const user = AuthService.getCurrentUser();
  if (user && typeof RealtimeService !== 'undefined') {
    RealtimeService.connect(user.id);
  }

  if (typeof RealtimeService === 'undefined') return;

  // 산책 요청 수신 (도우미용)
  RealtimeService.on('walk-request', (data) => {
    showWalkRequestNotification(data);
  });

  // 요청 수락됨 (요청자용)
  RealtimeService.on('walk-request-accepted', (data) => {
    showToast(`✅ ${data.walkerName}님이 산책 요청을 수락했습니다!`, 'success');
    // 현재 dog-walker 페이지에 있으면 새로고침
    if (Router.getPath() === '/dog-walker') renderDogWalkerPage();
  });

  // 요청 거절됨 (요청자용)
  RealtimeService.on('walk-request-rejected', () => {
    showToast('산책 도우미가 요청을 거절했습니다.', 'error');
  });

  // 산책 시작 (요청자용)
  RealtimeService.on('walk-started', (data) => {
    showToast('🐕 산책이 시작되었습니다! 지도에서 경로를 확인하세요.', 'success');
    _activeSessionId = data.sessionId;
    if (Router.getPath() === '/walk-session') renderWalkSessionPage(data.sessionId);
  });

  // 산책 종료 (요청자용)
  RealtimeService.on('walk-ended', (data) => {
    showToast(`🏁 산책이 완료되었습니다! 총 ${data.totalDistanceKm}km`, 'success');
    stopWalkRouteWatcher();
    if (Router.getPath() === '/walk-session') renderWalkSessionPage(null);
  });

  // 지도의 도우미 상태/위치 변경 → 지도 자동 갱신 (공유 핸들러)
  function refreshDiscoveryMap() {
    if (_dwDiscMap && _dwUserLat && _dwUserLng) {
      const radius = Number(document.getElementById('dw-radius-sel')?.value || 5);
      _renderDiscMap(_dwUserLat, _dwUserLng, radius);
    }
  }
  RealtimeService.on('walker-status-changed', refreshDiscoveryMap);
  RealtimeService.on('walker-location-updated', refreshDiscoveryMap);
}


// ============================================================
// 산책 요청 모달 (요청자 → 특정 도우미)
// ============================================================

function openWalkRequestModal(walkerId, walkerName) {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  const dogs = user.dogs || [];
  const dogOptions = dogs.length > 0
    ? dogs.map(d => `<option value="${d.id}" data-name="${d.name}" data-breed="${d.breed || ''}" data-size="${d.size || 'small'}">${d.name} (${d.breed || '견종 미등록'})</option>`).join('')
    : '<option value="">반려견을 먼저 프로필에 등록해주세요</option>';

  // 기존 모달 제거
  document.getElementById('walk-req-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'walk-req-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:28px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:1.1rem;font-weight:700;">🐕 ${walkerName}님께 산책 요청</h3>
        <button onclick="document.getElementById('walk-req-modal').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#718096;">×</button>
      </div>
      <div id="walk-req-error" style="margin-bottom:12px;"></div>

      <div class="form-group" style="margin-bottom:14px;">
        <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px;">반려견 선택 *</label>
        <select id="wrm-dog" class="form-select">${dogOptions}</select>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px;">견종 / 특이사항</label>
        <input type="text" id="wrm-notes" class="form-input" placeholder="예: 겁이 많아요, 리드줄 꼭 잡아주세요">
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div class="form-group">
          <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px;">희망 시작 시간 *</label>
          <input type="datetime-local" id="wrm-start" class="form-input">
        </div>
        <div class="form-group">
          <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px;">희망 종료 시간</label>
          <input type="datetime-local" id="wrm-end" class="form-input">
        </div>
      </div>

      <div class="form-group" style="margin-bottom:20px;">
        <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px;">요청 메시지</label>
        <textarea id="wrm-msg" class="form-input" rows="3" placeholder="도우미에게 전달할 내용을 적어주세요."></textarea>
      </div>

      <button class="btn btn-primary" style="width:100%;padding:13px;" onclick="submitWalkRequest('${walkerId}')">
        요청 보내기
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function submitWalkRequest(walkerId) {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const dogSel = document.getElementById('wrm-dog');
  const notes  = document.getElementById('wrm-notes')?.value?.trim();
  const start  = document.getElementById('wrm-start')?.value;
  const end    = document.getElementById('wrm-end')?.value;
  const msg    = document.getElementById('wrm-msg')?.value?.trim();
  const errEl  = document.getElementById('walk-req-error');

  if (!dogSel?.value) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">반려견을 선택해주세요. 없으면 프로필에서 먼저 등록해주세요.</div>';
    return;
  }
  if (!start) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">희망 시작 시간을 입력해주세요.</div>';
    return;
  }

  const selectedOption = dogSel.options[dogSel.selectedIndex];
  const dogName  = selectedOption?.dataset?.name || dogSel.options[dogSel.selectedIndex]?.text;
  const dogBreed = selectedOption?.dataset?.breed || '';
  const dogSize  = selectedOption?.dataset?.size || '';

  try {
    const res = await fetch('/api/walk-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId:        user.id,
        walkerId,
        dogName,
        dogBreed,
        dogSize,
        dogSpecialNotes:    notes,
        requestMessage:     msg,
        requestedStartTime: start,
        requestedEndTime:   end
      })
    });
    const result = await res.json();
    if (!result.success) {
      if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
      return;
    }
    document.getElementById('walk-req-modal')?.remove();
    showToast('산책 요청을 보냈습니다! 도우미의 수락을 기다려주세요.', 'success');
  } catch(e) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">요청 전송에 실패했습니다. 다시 시도해주세요.</div>';
  }
}

// ============================================================
// 도우미: 실시간 요청 알림 모달
// ============================================================

function showWalkRequestNotification(data) {
  const { request, requesterName, requesterProfileImage } = data;

  // 기존 알림 제거
  document.getElementById('walker-req-notif')?.remove();

  const modal = document.createElement('div');
  modal.id = 'walker-req-notif';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:16px;';

  const startFmt = request.requestedStartTime
    ? new Date(request.requestedStartTime).toLocaleString('ko-KR', { month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })
    : '시간 미정';

  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:28px;width:100%;max-width:420px;box-shadow:0 8px 32px rgba(0,0,0,0.25);">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:2rem;">🔔</div>
        <h3 style="font-size:1.1rem;font-weight:700;margin-top:8px;">새 산책 요청이 들어왔어요!</h3>
      </div>

      <div style="background:#F7FAFC;border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:44px;height:44px;border-radius:50%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;font-size:1.2rem;overflow:hidden;">
            ${requesterProfileImage ? `<img src="${requesterProfileImage}" style="width:100%;height:100%;object-fit:cover;">` : requesterName.charAt(0)}
          </div>
          <div>
            <div style="font-weight:700;">${requesterName}</div>
            <div style="font-size:0.82rem;color:#718096;">요청자</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem;">
          <div><span style="color:#718096;">반려견</span><br><b>${request.dogName || '-'}</b></div>
          <div><span style="color:#718096;">크기</span><br><b>${DW_SIZE_LABEL[request.dogSize] || request.dogSize || '-'}</b></div>
          <div><span style="color:#718096;">견종</span><br><b>${request.dogBreed || '-'}</b></div>
          <div><span style="color:#718096;">희망 시간</span><br><b>${startFmt}</b></div>
        </div>
        ${request.dogSpecialNotes ? `<div style="margin-top:10px;font-size:0.83rem;color:#4A5568;">⚠️ 특이사항: ${request.dogSpecialNotes}</div>` : ''}
        ${request.requestMessage ? `<div style="margin-top:10px;font-size:0.83rem;background:#EDF2F7;padding:10px;border-radius:8px;">"${request.requestMessage}"</div>` : ''}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <button class="btn btn-secondary" onclick="rejectWalkRequestNotif('${request.id}')">거절하기</button>
        <button class="btn btn-primary" onclick="acceptWalkRequestNotif('${request.id}','${escapeQ(requesterName)}')">수락하기</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function acceptWalkRequestNotif(requestId, requesterName) {
  try {
    const res = await fetch(`/api/walk-requests/${requestId}/accept`, { method: 'PATCH' });
    const result = await res.json();
    if (!result.success) { showToast(result.error || '수락에 실패했습니다.', 'error'); return; }
    document.getElementById('walker-req-notif')?.remove();
    showToast(`${requesterName}님의 요청을 수락했습니다!`, 'success');
    if (Router.getPath() === '/dog-walker') renderDogWalkerPage();
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

async function rejectWalkRequestNotif(requestId) {
  try {
    await fetch(`/api/walk-requests/${requestId}/reject`, { method: 'PATCH' });
    document.getElementById('walker-req-notif')?.remove();
    showToast('요청을 거절했습니다.', 'info');
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

// ============================================================
// 산책 세션 페이지 (도우미: 산책 시작/종료 + 경로, 요청자: 실시간 추적)
// ============================================================

let _activeSessionId      = null;
let _walkRouteMap         = null;
let _walkPolyline         = null;
let _walkLiveMarker       = null;
let _walkRoutePoints      = [];
let _walkPositionHandler  = null; // off() 시 참조 보관

/** 도우미: 산책 시작 */
async function startWalkSession(requestId, requesterId, dogName) {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  try {
    const res = await fetch('/api/walk-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, walkerId: user.id, requesterId, dogName })
    });
    const result = await res.json();
    if (!result.success) { showToast(result.error || '산책 시작에 실패했습니다.', 'error'); return; }
    _activeSessionId = result.session.id;
    RealtimeService.startRouteTracking(_activeSessionId);
    showToast('산책이 시작되었습니다!', 'success');
    Router.navigate('/walk-session');
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

/** 도우미: 산책 종료 */
async function endWalkSession(sessionId) {
  if (!confirm('산책을 종료하시겠습니까?')) return;
  try {
    const res = await fetch(`/api/walk-sessions/${sessionId}/end`, { method: 'PATCH' });
    const result = await res.json();
    if (!result.success) { showToast('종료에 실패했습니다.', 'error'); return; }
    RealtimeService.stopRouteTracking();
    _activeSessionId = null;
    showToast(`산책 완료! 총 거리: ${result.totalDistanceKm}km`, 'success');
    renderDogWalkerPage();
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

/** 산책 세션 페이지 렌더링 (실시간 경로 지도) */
async function renderWalkSessionPage(sessionId) {
  const sid = sessionId || _activeSessionId;
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  if (!sid) {
    renderPage(`
      <div class="empty-state" style="padding:80px 20px;">
        <div class="empty-icon">🐕</div>
        <p>진행 중인 산책이 없습니다.</p>
        <button class="btn btn-primary" onclick="Router.navigate('/dog-walker')">도그워커 페이지로</button>
      </div>
    `);
    return;
  }

  // 세션 정보 조회
  let sessions = [];
  try {
    const res = await fetch(`/api/walk-sessions?userId=${user.id}`);
    const data = await res.json();
    sessions = data.sessions || [];
  } catch(e) {}

  const session = sessions.find(s => s.id === sid);
  const isWalker = session && session.walkerId === user.id;

  renderPage(`
    <div style="padding:0;">
      <div style="padding:20px 20px 12px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h2 style="font-size:1.1rem;font-weight:700;">🐕 산책 ${session?.status === 'completed' ? '완료' : '진행 중'}</h2>
          ${session ? `<p style="font-size:0.82rem;color:#718096;margin-top:4px;">
            반려견: ${session.dogName || '-'} · 시작: ${new Date(session.startedAt).toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit'})}
          </p>` : ''}
        </div>
        ${isWalker && session?.status === 'walking' ? `
          <button class="btn btn-danger" onclick="endWalkSession('${sid}')">🏁 산책 종료</button>
        ` : ''}
      </div>

      <div id="walk-session-map" style="height:60vh;width:100%;"></div>

      <div style="padding:16px 20px;">
        <div id="walk-route-stats" style="display:flex;gap:20px;font-size:0.88rem;color:#4A5568;">
          <span>📍 포인트: <b id="route-point-count">0</b></span>
          <span>📏 거리: <b id="route-distance">0.00</b> km</span>
        </div>
        ${session?.status === 'completed' ? `
          <button class="btn btn-secondary" style="margin-top:12px;" onclick="Router.navigate('/dog-walker')">← 돌아가기</button>
        ` : ''}
      </div>
    </div>
  `);

  // 지도 초기화
  setTimeout(() => _initWalkSessionMap(sid, isWalker && session?.status === 'walking'), 100);
}

async function _initWalkSessionMap(sessionId, isLive) {
  const container = document.getElementById('walk-session-map');
  if (!container) return;

  if (_walkRouteMap) { try { _walkRouteMap.remove(); } catch(e) {} _walkRouteMap = null; }
  _walkPolyline    = null;
  _walkLiveMarker  = null;
  _walkRoutePoints = [];

  // 기본 위치 (서울)
  _walkRouteMap = L.map('walk-session-map').setView([37.5665, 126.9780], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(_walkRouteMap);

  // 저장된 경로 로드
  try {
    const res = await fetch(`/api/walk-sessions/${sessionId}/route`);
    const data = await res.json();
    if (data.points && data.points.length > 0) {
      _walkRoutePoints = data.points.map(p => [p.latitude, p.longitude]);
      _walkPolyline = L.polyline(_walkRoutePoints, { color: '#00AA76', weight: 4, opacity: 0.8 }).addTo(_walkRouteMap);
      _walkRouteMap.fitBounds(_walkPolyline.getBounds(), { padding: [40, 40] });

      // 마지막 위치 마커
      const last = _walkRoutePoints[_walkRoutePoints.length - 1];
      const liveIcon = L.divIcon({ html: '<div class="dw-map-walker dw-map-walker--on">🦮</div>', className: '', iconSize: [38, 38], iconAnchor: [19, 19] });
      _walkLiveMarker = L.marker(last, { icon: liveIcon }).addTo(_walkRouteMap);

      _updateRouteStats(data.points.length, data.totalDistanceKm);
    }
  } catch(e) {}

  // 실시간 위치 수신 (요청자용) — 핸들러를 변수에 저장해 off()에서 제거 가능하게 함
  if (isLive) {
    _walkPositionHandler = (data) => {
      if (data.sessionId !== sessionId) return;
      const latlng = [data.latitude, data.longitude];
      _walkRoutePoints.push(latlng);

      if (!_walkPolyline) {
        _walkPolyline = L.polyline([latlng], { color: '#00AA76', weight: 4 }).addTo(_walkRouteMap);
      } else {
        _walkPolyline.addLatLng(latlng);
      }

      const liveIcon = L.divIcon({ html: '<div class="dw-map-walker dw-map-walker--on">🦮</div>', className: '', iconSize: [38, 38], iconAnchor: [19, 19] });
      if (_walkLiveMarker) _walkLiveMarker.remove();
      _walkLiveMarker = L.marker(latlng, { icon: liveIcon }).addTo(_walkRouteMap);
      _walkRouteMap.panTo(latlng);
      _updateRouteStats(_walkRoutePoints.length, null);
    };
    RealtimeService.on('walker-position', _walkPositionHandler);
  }
}

function _updateRouteStats(pointCount, distKm) {
  const pcEl = document.getElementById('route-point-count');
  const distEl = document.getElementById('route-distance');
  if (pcEl) pcEl.textContent = pointCount;
  if (distEl && distKm !== null) distEl.textContent = distKm.toFixed(2);
}

function updateLiveWalkerMarker(lat, lng) {
  if (!_walkRouteMap) return;
  const latlng = [lat, lng];
  if (_walkLiveMarker) _walkLiveMarker.setLatLng(latlng);
}

function stopWalkRouteWatcher() {
  if (_walkPositionHandler) {
    RealtimeService.off('walker-position', _walkPositionHandler);
    _walkPositionHandler = null;
  }
}

// ============================================================
// 도우미 대시보드: 수락된 요청에 산책 시작 버튼 추가
// ============================================================

async function renderWalkerRequestsList(userId) {
  let requests = [];
  try {
    const res = await fetch(`/api/walk-requests?walkerId=${userId}`);
    const data = await res.json();
    requests = (data.requests || []).filter(r => ['pending', 'accepted', 'walking'].includes(r.status));
  } catch(e) {}

  if (requests.length === 0) return '<p style="color:#718096;font-size:0.88rem;">현재 받은 요청이 없습니다.</p>';

  const users = StorageService.get('users', []);

  return requests.map(r => {
    const requester = users.find(u => u.id === r.requesterId);
    const requesterName = requester ? (requester.nickname || requester.name) : r.requesterId;
    const statusLabel = { pending: '⏳ 대기', accepted: '✅ 수락됨', walking: '🐕 산책 중' };
    const startFmt = r.requestedStartTime
      ? new Date(r.requestedStartTime).toLocaleString('ko-KR', { month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })
      : '시간 미정';

    return `
      <div style="border:1px solid var(--color-border);border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div>
            <b>${requesterName}</b>
            <span style="font-size:0.78rem;background:#EDF2F7;padding:2px 8px;border-radius:20px;margin-left:8px;">${statusLabel[r.status] || r.status}</span>
          </div>
          <span style="font-size:0.78rem;color:#718096;">${new Date(r.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>
        <div style="font-size:0.85rem;color:#4A5568;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <span>🐕 ${r.dogName || '-'} (${DW_SIZE_LABEL[r.dogSize] || r.dogSize || '-'})</span>
          <span>⏰ ${startFmt}</span>
          ${r.dogBreed ? `<span>견종: ${r.dogBreed}</span>` : ''}
          ${r.dogSpecialNotes ? `<span>⚠️ ${r.dogSpecialNotes}</span>` : ''}
        </div>
        ${r.requestMessage ? `<div style="margin-top:8px;font-size:0.83rem;background:#F7FAFC;padding:8px;border-radius:8px;">"${r.requestMessage}"</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          ${r.status === 'pending' ? `
            <button class="btn btn-primary btn-sm" onclick="acceptWalkRequestNotif('${r.id}','${escapeQ(requesterName)}')">수락</button>
            <button class="btn btn-secondary btn-sm" onclick="rejectWalkRequestNotif('${r.id}')">거절</button>
          ` : ''}
          ${r.status === 'accepted' ? `
            <button class="btn btn-primary btn-sm" onclick="startWalkSession('${r.id}','${r.requesterId}','${escapeQ(r.dogName)}')">🐕 산책 시작</button>
          ` : ''}
          ${r.status === 'walking' ? `
            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/walk-session')">📍 경로 보기</button>
            <button class="btn btn-danger btn-sm" onclick="endWalkSession('${_activeSessionId || ''}')">🏁 산책 종료</button>
          ` : ''}
        </div>
      </div>`;
  }).join('');
}

/**
 * 직접 요청 산책 기록 렌더링
 * @param {string} userId
 * @param {'walker'|'requester'} role
 * @returns {Promise<{html: string, hasRecords: boolean}>}
 */
async function renderDirectWalkHistory(userId, role) {
  const STATUS_LABEL = {
    accepted: '✅ 수락됨',
    walking:  '🐕 산책 중',
    completed:'🏁 완료됨'
  };
  const HISTORY_STATUSES = ['accepted', 'walking', 'completed'];

  let requests = [];
  try {
    const param = role === 'walker' ? `walkerId=${userId}` : `requesterId=${userId}`;
    const res   = await fetch(`/api/walk-requests?${param}`);
    const data  = await res.json();
    requests    = (data.requests || []).filter(r => HISTORY_STATUSES.includes(r.status));
  } catch (e) {
    return { html: '', hasRecords: false };
  }

  if (requests.length === 0) return { html: '', hasRecords: false };

  // 세션 데이터 (거리 표시용) — 실패해도 괜찮음
  let sessions = [];
  try {
    const res  = await fetch(`/api/walk-sessions?userId=${userId}`);
    const data = await res.json();
    sessions   = data.sessions || [];
  } catch (e) { /* 거리 정보 없이 표시 */ }

  const html = requests.map(r => {
    const partnerName = role === 'walker' ? (r.requesterName || r.requesterId) : (r.walkerName || r.walkerId);
    const session     = sessions.find(s => s.requestId === r.id);
    const distText    = session && session.totalDistanceKm != null ? `🗺 ${session.totalDistanceKm} km` : '';
    const dateText    = new Date(r.updatedAt || r.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const startFmt    = r.requestedStartTime
      ? new Date(r.requestedStartTime).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '시간 미정';

    return `
      <div class="match-walk-card ${r.status === 'completed' ? 'match-walk-card--completed' : ''}">
        <div class="match-walk-card__avatar">${partnerName.charAt(0)}</div>
        <div class="match-walk-card__info" style="flex:1;">
          <div class="match-walk-card__name">${partnerName}</div>
          <div style="font-size:0.82rem;color:#718096;margin-top:2px;">
            🐕 ${r.dogName || '-'} · ⏰ ${startFmt}
          </div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap;">
            <span class="badge ${r.status === 'completed' ? 'badge-success' : 'badge-info'}">${STATUS_LABEL[r.status] || r.status}</span>
            ${distText ? `<span style="font-size:0.82rem;color:#4A5568;">${distText}</span>` : ''}
            <span style="font-size:0.78rem;color:#A0AEC0;">${dateText}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  return { html, hasRecords: true };
}
