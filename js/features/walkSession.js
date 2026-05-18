// ============================================================
// 산책 세션 관리 + 세션 페이지 렌더링
// ============================================================

let _activeSessionId = null;
let _walkRouteMap = null;
let _walkPolyline = null;
let _walkLiveMarker = null;
let _walkRoutePoints = [];
let _walkPositionHandler = null;
let _walkNavWatchId = null;
let _walkNavLine = null;
let _walkNavMyMarker = null;
let _walkSessionPollTimer = null;
let _walkStartMs = 0;
let _walkerLocationInterval = null;
let _reviewSelectedStar = 0;
let _elapsedTimer = null;

// ── 경과 시간 타이머 ──
function _startElapsedTimer(startAt) {
  if (_elapsedTimer) clearInterval(_elapsedTimer);
  const startMs = startAt ? new Date(startAt).getTime() : Date.now();
  function tick() {
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    const el = document.getElementById('route-elapsed');
    if (el) el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  tick();
  _elapsedTimer = setInterval(tick, 1000);
}

// ── 도우미 위치 공유 ──
function _startWalkerLocationSharing(requestId) {
  _stopWalkerLocationSharing();
  if (!navigator.geolocation) return;

  function sendLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
      fetch(`/api/walk-requests/${requestId}/walker-location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }).catch(() => {});
    }, () => {}, { enableHighAccuracy: true, timeout: 5000, maximumAge: 3000 });
  }

  sendLocation();
  _walkerLocationInterval = setInterval(sendLocation, 5000);
}

function _stopWalkerLocationSharing() {
  if (_walkerLocationInterval) { clearInterval(_walkerLocationInterval); _walkerLocationInterval = null; }
}

// ── 산책 취소 (도우미용) ──
async function cancelWalkSession(sessionId) {
  if (!confirm('산책을 취소하시겠습니까?')) return;
  try {
    const res = await fetch(`/api/walk-sessions/${sessionId}/cancel`, { method: 'PATCH' });
    const result = await res.json();
    if (!result.success) { showToast(result.error || '취소에 실패했습니다.', 'error'); return; }
    _activeSessionId = null;
    _stopWalkerLocationSharing();
    showToast('산책이 취소되었습니다.', 'info');
    Router.navigate('/matching');
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

// ── 요청자: 반려견 인계 확인 ──
async function confirmHandoff(sessionId) {
  try {
    const res = await fetch(`/api/walk-sessions/${sessionId}/confirm-handoff`, { method: 'PATCH' });
    const result = await res.json();
    if (!result.success) { showToast(result.error || '오류가 발생했습니다.', 'error'); return; }
    showToast('반려견 인계 완료! 산책을 기다려주세요.', 'success');
    renderWalkSessionPage(sessionId);
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

// ── 도우미: 산책 시작 ──
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
    window._activeWalkRequestId = requestId;
    RealtimeService.startRouteTracking(_activeSessionId);
    _startWalkerLocationSharing(requestId);
    showToast('산책이 시작되었습니다!', 'success');
    Router.navigate('/walk-session');
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

// ── 도우미: 픽업 장소 도착 ──
async function arriveAtPickup(sessionId) {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  try {
    const res = await fetch(`/api/walk-sessions/${sessionId}/arrive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walkerName: user.nickname || user.name })
    });
    const result = await res.json();
    if (!result.success) { showToast(result.error || '오류가 발생했습니다.', 'error'); return; }
    showToast('도착 알림을 보냈어요! 반려견을 픽업해주세요.', 'success');
    renderWalkSessionPage(sessionId);
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

// ── 도우미: 산책 실제 시작 ──
async function startActualWalk(sessionId) {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  try {
    const res = await fetch(`/api/walk-sessions/${sessionId}/start-walk`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await res.json();
    if (!result.success) { showToast(result.error || '오류가 발생했습니다.', 'error'); return; }
    _activeSessionId = sessionId;
    RealtimeService.startRouteTracking(sessionId);
    if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(()=>{});
    showToast('산책 중 화면을 꺼지 마세요 — 위치 공유가 유지됩니다.', 'info');
    renderWalkSessionPage(sessionId);
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

// ── 도우미: 산책 종료 ──
async function endWalkSession(sessionId) {
  if (!confirm('산책을 종료하시겠습니까?')) return;
  try {
    const res = await fetch(`/api/walk-sessions/${sessionId}/end`, { method: 'PATCH' });
    const result = await res.json();
    if (!result.success) { showToast('종료에 실패했습니다.', 'error'); return; }
    RealtimeService.stopRouteTracking();
    _activeSessionId = null;
    showWalkCompletionScreen(result.session, result.totalDistanceKm);
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

function showWalkCompletionScreen(session, distKm) {
  document.getElementById('walk-completion-screen')?.remove();
  const user = AuthService.getCurrentUser();
  const el = document.createElement('div');
  el.id = 'walk-completion-screen';
  el.style.cssText = 'position:fixed;inset:0;z-index:9500;background:#fff;display:flex;flex-direction:column;overflow-y:auto;animation:ltFadeIn 0.3s ease;';

  let durationText = '-';
  if (session?.walkStartedAt && session?.endedAt) {
    const mins = Math.round((new Date(session.endedAt) - new Date(session.walkStartedAt)) / 60000);
    durationText = mins >= 60 ? `${Math.floor(mins/60)}시간 ${mins%60}분` : `${mins}분`;
  }

  el.innerHTML = `
    <div style="flex:1;padding:32px 24px 0;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:64px;height:64px;border-radius:50%;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 12px;">${icon('flag',28,'#00AA76')}</div>
        <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:4px;">산책 완료!</h2>
        <p style="font-size:0.85rem;color:#718096;">수고하셨어요. 오늘도 행복한 산책이었나요?</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:#f0f0ee;border-radius:14px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#fff;padding:16px;text-align:center;">
          <div style="font-size:1.4rem;font-weight:800;">${distKm ?? '?'}</div>
          <div style="font-size:0.7rem;color:#aaa;margin-top:3px;">km</div>
        </div>
        <div style="background:#fff;padding:16px;text-align:center;">
          <div style="font-size:1.4rem;font-weight:800;">${durationText}</div>
          <div style="font-size:0.7rem;color:#aaa;margin-top:3px;">산책 시간</div>
        </div>
        <div style="background:#fff;padding:16px;text-align:center;">
          <div style="font-size:1.4rem;font-weight:800;">${session?.dogName || '?'}</div>
          <div style="font-size:0.7rem;color:#aaa;margin-top:3px;">반려견</div>
        </div>
      </div>
    </div>

    <div style="padding:16px 24px 32px;">
      <button onclick="document.getElementById('walk-completion-screen').remove();Router.navigate('/matching')"
        style="width:100%;padding:14px;background:#1a1a1a;color:#fff;border:none;border-radius:14px;font-size:0.95rem;font-weight:700;cursor:pointer;">
        확인
      </button>
    </div>
  `;
  document.body.appendChild(el);
}

async function showRequesterReviewPrompt(sessionId, walkerId, distKm) {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  try {
    const chk = await fetch(`/api/walk-review/check/${sessionId}/${user.id}`);
    const chkData = await chk.json();
    if (chkData.reviewed) return;
  } catch(e) {}

  let walkerName = '도우미';
  try {
    const sRes = await fetch(`/api/walk-sessions?userId=${user.id}`);
    const sData = await sRes.json();
    const session = (sData.sessions || []).find(s => s.id === sessionId);
    if (session) walkerName = session.walkerName || walkerName;
  } catch(e) {}

  document.getElementById('requester-review-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'requester-review-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,0.45);display:flex;align-items:flex-end;';

  modal.innerHTML = `
    <div style="background:#fff;border-radius:24px 24px 0 0;width:100%;padding:28px 24px 40px;animation:slideUp 0.3s ease;">
      <div style="width:40px;height:4px;background:#e0e0e0;border-radius:2px;margin:0 auto 20px;"></div>
      <h3 style="font-size:1rem;font-weight:800;margin-bottom:4px;">${walkerName}님 산책 어떠셨나요?</h3>
      <p style="font-size:0.8rem;color:#aaa;margin-bottom:20px;">솔직한 리뷰가 더 좋은 서비스를 만들어요</p>

      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:12px;" id="req-review-stars">
        ${[1,2,3,4,5].map(n => `<button onclick="selectReviewStar(${n},'req')" data-star="${n}" style="background:none;border:none;cursor:pointer;padding:4px;">${icon('star',36,'#E0E0E0')}</button>`).join('')}
      </div>
      <div id="req-review-label" style="text-align:center;font-size:0.82rem;color:#aaa;margin-bottom:14px;">별점을 선택해주세요</div>
      <textarea id="req-review-comment" placeholder="도우미에 대한 후기를 남겨주세요 (선택)" rows="3"
        style="width:100%;border:1.5px solid #e8e8e6;border-radius:12px;padding:12px;font-size:0.85rem;resize:none;font-family:inherit;margin-bottom:14px;"></textarea>

      <button id="req-review-submit" onclick="submitWalkReview('${sessionId}','${walkerId}')"
        style="width:100%;padding:14px;background:#1a1a1a;color:#fff;border:none;border-radius:14px;font-size:0.92rem;font-weight:700;cursor:pointer;margin-bottom:8px;">
        리뷰 남기기
      </button>
      <button onclick="document.getElementById('requester-review-modal').remove();Router.navigate('/matching')"
        style="width:100%;padding:10px;background:none;border:none;color:#aaa;font-size:0.85rem;cursor:pointer;">
        건너뛰기
      </button>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function selectReviewStar(n, context) {
  _reviewSelectedStar = n;
  const labels = ['','별로였어요','조금 아쉬워요','보통이에요','좋았어요','최고예요!'];
  const prefix = context === 'req' ? 'req-' : '';
  const labelEl = document.getElementById(`${prefix}review-label`);
  if (labelEl) labelEl.textContent = labels[n];
  const starsEl = document.getElementById(`${prefix}review-stars`);
  if (starsEl) starsEl.querySelectorAll('button').forEach((btn, i) => {
    btn.innerHTML = icon('star', context === 'req' ? 36 : 32, i < n ? '#F6A623' : '#E0E0E0');
  });
}

async function submitWalkReview(requestId, walkerId) {
  const user = AuthService.getCurrentUser();
  if (!user || !_reviewSelectedStar) {
    showToast('별점을 선택해주세요.', 'error'); return;
  }
  const comment = (document.getElementById('req-review-comment') || document.getElementById('review-comment'))?.value?.trim();
  const btn = document.getElementById('req-review-submit') || document.getElementById('review-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = '제출 중...'; }

  try {
    const res = await fetch('/api/walk-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        reviewerId: user.id,
        walkerId,
        rating: _reviewSelectedStar,
        comment
      })
    });
    const data = await res.json();
    if (data.success) showToast('리뷰가 등록됐어요. 감사합니다!', 'success');
    else showToast(data.error || '이미 리뷰를 작성했어요.', 'info');
  } catch(e) {}

  document.getElementById('requester-review-modal')?.remove();
  document.getElementById('walk-completion-screen')?.remove();
  _reviewSelectedStar = 0;
  Router.navigate('/matching');
}

// ============================================================
// 산책 세션 페이지 렌더링 (실시간 경로 지도)
// ============================================================

async function renderWalkSessionPage(sessionId) {
  let sid = sessionId || _activeSessionId;
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  if (!sid) {
    try {
      const res = await fetch(`/api/walk-sessions?userId=${user.id}`);
      const data = await res.json();
      const active = (data.sessions || []).filter(s => ['heading','arrived','handoff','walking'].includes(s.status));
      if (active.length > 0) { sid = active[0].id; _activeSessionId = sid; window._activeWalkRequestId = active[0].requestId; }
    } catch(e) {}
  }

  if (!sid) {
    renderPage(`<div style="padding:80px 20px;text-align:center;">
      <div style="font-size:3.5rem;margin-bottom:16px;">🐾</div>
      <p style="color:#94A3B8;font-size:0.95rem;margin-bottom:24px;">진행 중인 산책이 없습니다.</p>
      <button class="btn btn-primary" onclick="Router.navigate('/matching')">매칭 페이지로</button>
    </div>`);
    return;
  }

  let sessions = [];
  try {
    const res = await fetch(`/api/walk-sessions?userId=${user.id}`);
    const data = await res.json();
    sessions = data.sessions || [];
  } catch(e) {}

  const session = sessions.find(s => s.id === sid);
  const isWalker = !!(session && session.walkerId === user.id);
  const st = session?.status || 'heading';

  const STATUS_CFG = {
    heading:   { dot:'#3B82F6', label:'픽업 장소로 이동 중',  sub:'도우미가 이동하고 있어요' },
    arrived:   { dot:'#F59E0B', label:'픽업 장소 도착',       sub:'반려견을 전달해주세요' },
    handoff:   { dot:'#8B5CF6', label:'반려견 인계 완료',      sub:'산책을 시작해주세요' },
    walking:   { dot:'#10B981', label:'산책 중',              sub:'실시간 경로를 추적 중이에요' },
    completed: { dot:'#94A3B8', label:'산책 완료',            sub:'산책이 완료되었습니다' },
  };
  const cfg = STATUS_CFG[st] || STATUS_CFG.heading;
  const pulse = st !== 'completed';
  const dogLabel = session ? `${session.dogName || '반려견'} · ${new Date(session.startedAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 시작` : cfg.sub;

  let actionBtn = '';
  if (isWalker) {
    const cancelBtn = `<button class="wsp-cancel-btn" onclick="cancelWalkSession('${sid}')">취소</button>`;
    if (st === 'heading')   actionBtn = `<div class="wsp-btn-row">${cancelBtn}<button class="wsp-btn wsp-btn--blue" onclick="arriveAtPickup('${sid}')">📍 도착했어요</button></div>`;
    else if (st === 'arrived') actionBtn = `<div class="wsp-btn-row">${cancelBtn}<span class="wsp-waiting">전달 확인 대기 중…</span></div>`;
    else if (st === 'handoff')  actionBtn = `<button class="wsp-btn wsp-btn--green" onclick="startActualWalk('${sid}')">🐾 산책 시작</button>`;
    else if (st === 'walking')  actionBtn = `<button class="wsp-btn wsp-btn--red" onclick="endWalkSession('${sid}')">🏁 산책 종료</button>`;
  } else {
    if (st === 'arrived') actionBtn = `<button class="wsp-btn wsp-btn--amber" onclick="confirmHandoff('${sid}')">🐕 반려견 전달 완료</button>`;
  }

  const showStats = st === 'walking' || st === 'completed';

  renderPage(`
  <div class="wsp-root">
    <div class="wsp-header">
      <div class="wsp-header-left">
        <span class="wsp-dot${pulse?' wsp-dot--pulse':''}" style="background:${cfg.dot}"></span>
        <div class="wsp-header-text">
          <div class="wsp-title">${cfg.label}</div>
          <div class="wsp-sub">${dogLabel}</div>
        </div>
      </div>
      <div class="wsp-header-right">${actionBtn}</div>
    </div>

    <div class="wsp-map-wrap">
      <div id="walk-session-map" class="wsp-map"></div>
      <div id="wsp-banner" class="wsp-banner" style="display:none"></div>
    </div>

    <div class="wsp-stats${showStats?'':' wsp-hidden'}">
      <div class="wsp-stat">
        <div class="wsp-stat-val" id="route-elapsed">00:00</div>
        <div class="wsp-stat-key">시간</div>
      </div>
      <div class="wsp-stat-sep"></div>
      <div class="wsp-stat">
        <div class="wsp-stat-val"><span id="route-distance">0.00</span><small> km</small></div>
        <div class="wsp-stat-key">거리</div>
      </div>
      <div class="wsp-stat-sep"></div>
      <div class="wsp-stat">
        <div class="wsp-stat-val" id="route-pace">—</div>
        <div class="wsp-stat-key">평균속도</div>
      </div>
    </div>

    ${st === 'completed' ? `<div class="wsp-footer">
      <button class="wsp-btn wsp-btn--gray" onclick="Router.navigate('/matching')">← 돌아가기</button>
    </div>` : ''}
  </div>

  <style>
  .wsp-root{display:flex;flex-direction:column;background:#F8FAFC;}
  .wsp-header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 16px;background:#fff;border-bottom:1px solid #EEF2F7;min-height:62px;}
  .wsp-header-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
  .wsp-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
  .wsp-dot--pulse{animation:wspDotPulse 2s ease infinite;}
  @keyframes wspDotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.6}}
  .wsp-header-text{min-width:0;}
  .wsp-title{font-size:0.92rem;font-weight:700;color:#0F172A;line-height:1.3;}
  .wsp-sub{font-size:0.73rem;color:#94A3B8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .wsp-header-right{flex-shrink:0;}
  .wsp-btn-row{display:flex;align-items:center;gap:7px;}
  .wsp-cancel-btn{background:none;border:1px solid #FDA4AF;color:#F43F5E;font-size:0.73rem;font-weight:600;padding:6px 10px;border-radius:8px;cursor:pointer;}
  .wsp-waiting{font-size:0.75rem;color:#94A3B8;font-weight:600;background:#F1F5F9;padding:7px 11px;border-radius:8px;}
  .wsp-btn{display:inline-flex;align-items:center;gap:5px;padding:9px 15px;border-radius:10px;font-size:0.84rem;font-weight:700;border:none;cursor:pointer;white-space:nowrap;}
  .wsp-btn--blue{background:#3B82F6;color:#fff;}
  .wsp-btn--green{background:#10B981;color:#fff;}
  .wsp-btn--red{background:#EF4444;color:#fff;}
  .wsp-btn--amber{background:#F59E0B;color:#fff;}
  .wsp-btn--gray{background:#F1F5F9;color:#374151;font-weight:600;}
  .wsp-map-wrap{position:relative;}
  .wsp-map{height:56vh;width:100%;}
  .wsp-banner{position:absolute;top:14px;left:50%;transform:translateX(-50%);z-index:900;background:rgba(15,23,42,.85);backdrop-filter:blur(6px);color:#fff;padding:8px 18px;border-radius:20px;font-size:0.8rem;font-weight:600;pointer-events:none;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.25);}
  .wsp-stats{display:flex;align-items:center;justify-content:space-around;padding:14px 20px;background:#fff;border-top:1px solid #EEF2F7;}
  .wsp-hidden{display:none!important;}
  .wsp-stat{text-align:center;}
  .wsp-stat-val{font-size:1.18rem;font-weight:800;color:#0F172A;letter-spacing:-.5px;line-height:1.2;}
  .wsp-stat-val small{font-size:.68rem;font-weight:600;color:#94A3B8;}
  .wsp-stat-key{font-size:.68rem;color:#94A3B8;margin-top:3px;font-weight:500;}
  .wsp-stat-sep{width:1px;height:30px;background:#E2E8F0;}
  .wsp-footer{padding:12px 16px;background:#fff;border-top:1px solid #EEF2F7;}
  .wsm-me{width:16px;height:16px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,.45);}
  .wsm-walker{width:38px;height:38px;background:#F59E0B;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;box-shadow:0 3px 14px rgba(245,158,11,.5);}
  .wsm-walker--pulse{animation:wsmWalkerPulse 2s ease infinite;}
  @keyframes wsmWalkerPulse{0%,100%{box-shadow:0 3px 14px rgba(245,158,11,.5)}50%{box-shadow:0 3px 22px rgba(245,158,11,.85),0 0 0 10px rgba(245,158,11,.1)}}
  .wsm-pickup{width:34px;height:34px;background:#EF4444;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 3px 12px rgba(239,68,68,.45);}
  </style>
  `);

  const resolvedReqId = window._activeWalkRequestId || session?.requestId;
  if (resolvedReqId) window._activeWalkRequestId = resolvedReqId;

  setTimeout(() => _initWalkSessionMap(sid, { isWalker, sessionStatus: st, requestId: resolvedReqId }), 80);

  if (showStats) {
    const startAt = session?.walkStartedAt || session?.startedAt;
    _walkStartMs = startAt ? new Date(startAt).getTime() : Date.now();
    _startElapsedTimer(startAt);
  }

  if (resolvedReqId) showChatButton(resolvedReqId);
}

async function _initWalkSessionMap(sessionId, opts = {}) {
  const { isWalker = false, sessionStatus = '', requestId = null } = opts;
  const container = document.getElementById('walk-session-map');
  if (!container) return;

  if (_walkNavWatchId !== null) { navigator.geolocation.clearWatch(_walkNavWatchId); _walkNavWatchId = null; }
  if (_walkSessionPollTimer) { clearInterval(_walkSessionPollTimer); _walkSessionPollTimer = null; }
  if (_walkPositionHandler) { RealtimeService.off('walker-position', _walkPositionHandler); _walkPositionHandler = null; }
  if (_walkRouteMap) { try { _walkRouteMap.remove(); } catch(e) {} _walkRouteMap = null; }
  _walkPolyline = null; _walkLiveMarker = null; _walkNavLine = null; _walkNavMyMarker = null; _walkRoutePoints = [];

  const _hav = (la1,lo1,la2,lo2) => {
    const R=6371000,r=Math.PI/180,dLa=(la2-la1)*r,dLo=(lo2-lo1)*r;
    const a=Math.sin(dLa/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  };
  const _banner = document.getElementById('wsp-banner');
  const _showBanner = t => { if (_banner) { _banner.textContent=t; _banner.style.display=''; } };
  const _hideBanner = () => { if (_banner) _banner.style.display='none'; };
  const _etaText = sec => sec < 60 ? `${sec}초` : `약 ${Math.ceil(sec/60)}분`;
  const _distText = m => m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`;

  const _iconMe = () => L.divIcon({html:'<div class="wsm-me"></div>',className:'',iconSize:[16,16],iconAnchor:[8,8]});
  const _iconWalker = (pulse=false) => L.divIcon({
    html:`<div class="wsm-walker${pulse?' wsm-walker--pulse':''}">🐾</div>`,
    className:'',iconSize:[38,38],iconAnchor:[19,19]
  });
  const _iconPickup = () => L.divIcon({
    html:`<div class="wsm-pickup">📍</div>`,
    className:'',iconSize:[34,34],iconAnchor:[17,17]
  });

  let myLat=null, myLng=null;
  try {
    const pos = await new Promise((res,rej) => navigator.geolocation.getCurrentPosition(res,rej,{timeout:7000,enableHighAccuracy:true,maximumAge:0}));
    myLat=pos.coords.latitude; myLng=pos.coords.longitude;
  } catch(e) {}

  const _hasGps = myLat !== null;
  const _initLat = myLat ?? 37.5665, _initLng = myLng ?? 126.9780;
  const _initZoom = _hasGps ? 16 : 14;

  _walkRouteMap = L.map('walk-session-map',{zoomControl:true,attributionControl:true}).setView([_initLat,_initLng],_initZoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(_walkRouteMap);

  let pickupLat=null, pickupLng=null, pickupName='요청자';
  try {
    const url = isWalker
      ? `/api/walk-requests?walkerId=${AuthService.getCurrentUser()?.id}`
      : (requestId ? `/api/walk-requests/${requestId}` : null);
    if (url) {
      const d = await (await fetch(url)).json();
      const req = isWalker
        ? (d.requests||[]).find(r=>r.id===requestId||['heading','arrived','handoff','walking'].includes(r.status))
        : (d.request||null);
      if (req?.pickupLatitude) { pickupLat=req.pickupLatitude; pickupLng=req.pickupLongitude; pickupName=req.requesterName||'요청자'; }
    }
  } catch(e) {}

  if (isWalker) {
    if (sessionStatus==='heading' || sessionStatus==='arrived') {
      if (_hasGps) {
        _walkNavMyMarker = L.marker([myLat,myLng],{icon:_iconWalker(true)}).bindPopup('내 위치').addTo(_walkRouteMap);
      }
      if (pickupLat && pickupLng) {
        L.marker([pickupLat,pickupLng],{icon:_iconPickup()}).bindPopup(`<b>${pickupName}</b><br>픽업 장소`).addTo(_walkRouteMap);
        if (_hasGps) {
          _walkNavLine = L.polyline([[myLat,myLng],[pickupLat,pickupLng]],{color:'#3B82F6',weight:3,dashArray:'8 5',opacity:.8}).addTo(_walkRouteMap);
          _walkRouteMap.fitBounds([[myLat,myLng],[pickupLat,pickupLng]],{padding:[60,60],maxZoom:17});
          const d0=_hav(myLat,myLng,pickupLat,pickupLng);
          _showBanner(`📍 픽업까지 ${_distText(d0)} · ${_etaText(Math.ceil(d0/1.3))}`);
        } else {
          _walkRouteMap.setView([pickupLat,pickupLng],16);
          _showBanner('📍 GPS 신호 확인 중…');
        }
      } else if (_hasGps) {
        _walkRouteMap.setView([myLat,myLng],16);
      }

      if (navigator.geolocation) {
        _walkNavWatchId = navigator.geolocation.watchPosition(pos => {
          const la=pos.coords.latitude, lo=pos.coords.longitude;
          if (!_walkNavMyMarker) {
            _walkNavMyMarker = L.marker([la,lo],{icon:_iconWalker(true)}).bindPopup('내 위치').addTo(_walkRouteMap);
          } else {
            _walkNavMyMarker.setLatLng([la,lo]);
          }
          if (!_walkNavLine && pickupLat) {
            _walkNavLine = L.polyline([[la,lo],[pickupLat,pickupLng]],{color:'#3B82F6',weight:3,dashArray:'8 5',opacity:.8}).addTo(_walkRouteMap);
          } else if (_walkNavLine && pickupLat) {
            _walkNavLine.setLatLngs([[la,lo],[pickupLat,pickupLng]]);
          }
          if (pickupLat) {
            const m=_hav(la,lo,pickupLat,pickupLng);
            _showBanner(`📍 픽업까지 ${_distText(m)} · ${_etaText(Math.ceil(m/1.3))}`);
          }
          if (requestId) fetch(`/api/walk-requests/${requestId}/walker-location`,{
            method:'PATCH',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({lat:la,lng:lo})
          }).catch(()=>{});
          if (_walkRouteMap) _walkRouteMap.panTo([la,lo],{animate:true,duration:.4});
        }, null, {enableHighAccuracy:true,timeout:15000,maximumAge:0});
      }

    } else if (sessionStatus==='walking' || sessionStatus==='completed') {
      _hideBanner();
      let lastPt = null;
      try {
        const d = await (await fetch(`/api/walk-sessions/${sessionId}/route`)).json();
        if (d.points?.length > 0) {
          _walkRoutePoints = d.points.map(p=>[p.latitude,p.longitude]);
          _walkPolyline = L.polyline(_walkRoutePoints,{color:'#F59E0B',weight:5,opacity:.9}).addTo(_walkRouteMap);
          lastPt = _walkRoutePoints[_walkRoutePoints.length-1];
          _walkLiveMarker = L.marker(lastPt,{icon:_iconWalker(sessionStatus==='walking')}).addTo(_walkRouteMap);
          _updateRouteStats(d.points.length, d.totalDistanceKm);
          if (sessionStatus==='completed') {
            _walkRouteMap.fitBounds(_walkPolyline.getBounds(),{padding:[50,50],maxZoom:17});
          } else {
            _walkRouteMap.setView(lastPt,17);
          }
        }
      } catch(e) {}

      if (!lastPt && _hasGps) _walkRouteMap.setView([myLat,myLng],16);
      if (sessionStatus==='walking') _showBanner('📡 GPS 신호 잡는 중…');

      if (sessionStatus==='walking') {
        RealtimeService.startRouteTracking(sessionId);
        if (navigator.geolocation) {
          let _prevLat=null, _prevLng=null;
          _walkNavWatchId = navigator.geolocation.watchPosition(pos => {
            const la=pos.coords.latitude, lo=pos.coords.longitude;
            const acc = pos.coords.accuracy;
            const isFirst = _prevLat === null;
            if (!isFirst && _hav(_prevLat,_prevLng,la,lo) < 3) return;
            _prevLat=la; _prevLng=lo;
            const latlng=[la,lo];
            _hideBanner();
            if (_walkLiveMarker) _walkLiveMarker.setLatLng(latlng);
            else _walkLiveMarker = L.marker(latlng,{icon:_iconWalker(true)}).addTo(_walkRouteMap);
            _walkRouteMap?.setView(latlng,_walkRouteMap.getZoom()>=16?_walkRouteMap.getZoom():17,{animate:true,duration:.4});
            if (acc <= 150) {
              _walkRoutePoints.push(latlng);
              if (!_walkPolyline) {
                _walkPolyline = L.polyline([latlng],{color:'#F59E0B',weight:5,opacity:.9}).addTo(_walkRouteMap);
              } else {
                _walkPolyline.addLatLng(latlng);
              }
              _updateRouteStatsDelta();
            }
          }, () => { _showBanner('📡 GPS 신호를 기다리는 중…'); }, {enableHighAccuracy:true,timeout:15000,maximumAge:0});
        }
      }
    }

  } else {
    const myMarker = _hasGps ? L.marker([myLat,myLng],{icon:_iconMe()}).bindPopup('내 위치').addTo(_walkRouteMap) : null;

    let walkerMarker = null;
    const _updateWalkerMarker = (lat,lng,panTo=true) => {
      if (!_walkRouteMap) return;
      if (!walkerMarker) {
        walkerMarker = L.marker([lat,lng],{icon:_iconWalker(true)}).bindPopup('도우미').addTo(_walkRouteMap);
      } else {
        walkerMarker.setLatLng([lat,lng]);
      }
      if (!panTo) return;
      const dist = _hav(myLat,myLng,lat,lng);
      if (dist > 300) {
        _walkRouteMap.fitBounds([[myLat,myLng],[lat,lng]],{padding:[55,55],maxZoom:17,animate:true});
      } else {
        _walkRouteMap.setView([lat,lng],17,{animate:true,duration:.4});
      }
    };

    if (sessionStatus==='heading' || sessionStatus==='arrived' || sessionStatus==='handoff') {
      _walkRouteMap.setView([myLat,myLng],15);
      _showBanner('🐾 도우미가 오고 있어요');

      const _fetchWalkerPos = async () => {
        if (!requestId) return;
        try {
          const d = await (await fetch(`/api/walk-requests/${requestId}/walker-location`)).json();
          if (d.lat && d.lng) _updateWalkerMarker(d.lat, d.lng);
        } catch(e) {}
      };
      _fetchWalkerPos();
      _walkSessionPollTimer = setInterval(_fetchWalkerPos, 3000);

      RealtimeService.on('walker-location-update', d => {
        if (d.lat && d.lng) { _updateWalkerMarker(d.lat, d.lng); }
      });

    } else if (sessionStatus==='walking' || sessionStatus==='completed') {
      _hideBanner();
      let lastPt = null;
      try {
        const d = await (await fetch(`/api/walk-sessions/${sessionId}/route`)).json();
        if (d.points?.length > 0) {
          _walkRoutePoints = d.points.map(p=>[p.latitude,p.longitude]);
          _walkPolyline = L.polyline(_walkRoutePoints,{color:'#F59E0B',weight:5,opacity:.9}).addTo(_walkRouteMap);
          lastPt = _walkRoutePoints[_walkRoutePoints.length-1];
          walkerMarker = L.marker(lastPt,{icon:_iconWalker(sessionStatus==='walking')}).addTo(_walkRouteMap);
          _updateRouteStats(d.points.length, d.totalDistanceKm);
          if (sessionStatus==='completed') {
            _walkRouteMap.fitBounds(_walkPolyline.getBounds(),{padding:[50,50],maxZoom:17});
          } else {
            _walkRouteMap.setView(lastPt,16);
          }
        }
      } catch(e) {}

      if (!lastPt) _walkRouteMap.setView([myLat,myLng],15);

      if (sessionStatus==='walking') {
        _walkSessionPollTimer = setInterval(async () => {
          if (!requestId) return;
          try {
            const d = await (await fetch(`/api/walk-requests/${requestId}/walker-location`)).json();
            if (d.lat&&d.lng && walkerMarker) walkerMarker.setLatLng([d.lat,d.lng]);
          } catch(e) {}
        }, 5000);

        _walkPositionHandler = data => {
          if (data.sessionId !== sessionId) return;
          const latlng=[data.latitude,data.longitude];
          _walkRoutePoints.push(latlng);
          if (!_walkPolyline) {
            _walkPolyline = L.polyline([latlng],{color:'#F59E0B',weight:5,opacity:.9}).addTo(_walkRouteMap);
          } else {
            _walkPolyline.addLatLng(latlng);
          }
          if (walkerMarker) walkerMarker.setLatLng(latlng);
          else walkerMarker = L.marker(latlng,{icon:_iconWalker(true)}).addTo(_walkRouteMap);
          _walkRouteMap?.setView(latlng,_walkRouteMap.getZoom()>10?_walkRouteMap.getZoom():16,{animate:true,duration:.4});
          _updateRouteStatsDelta();
        };
        RealtimeService.on('walker-position', _walkPositionHandler);
      }
    }
  }
}

function _updateRouteStats(pointCount, distKm) {
  const pcEl = document.getElementById('route-point-count');
  const distEl = document.getElementById('route-distance');
  if (pcEl) pcEl.textContent = pointCount;
  if (distEl && distKm !== null) distEl.textContent = distKm.toFixed(2);
  _updatePaceDisplay(distKm);
}

function _updateRouteStatsDelta() {
  if (_walkRoutePoints.length < 2) return;
  const distEl = document.getElementById('route-distance');
  if (!distEl) return;
  const pts = _walkRoutePoints;
  const [la1,lo1] = pts[pts.length-2];
  const [la2,lo2] = pts[pts.length-1];
  const R=6371000,r=Math.PI/180,dLa=(la2-la1)*r,dLo=(lo2-lo1)*r;
  const a=Math.sin(dLa/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2;
  const addM = R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  const newKm = (parseFloat(distEl.textContent)||0) + addM/1000;
  distEl.textContent = newKm.toFixed(2);
  _updatePaceDisplay(newKm);
}

function _updatePaceDisplay(distKm) {
  const paceEl = document.getElementById('route-pace');
  if (!paceEl || !distKm || distKm <= 0 || !_walkStartMs) return;
  const elapsedHr = (Date.now() - _walkStartMs) / 3600000;
  if (elapsedHr <= 0) return;
  const kmh = distKm / elapsedHr;
  paceEl.textContent = kmh.toFixed(1) + ' km/h';
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
