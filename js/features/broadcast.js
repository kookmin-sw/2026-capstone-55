// ============================================================
// 브로드캐스트 매칭 (요청자 + 도우미 양측) + 라이브 트래킹 오버레이
// ============================================================

let _broadcastRequestId = null;
let _broadcastTimer = null;

function openBroadcastModal() {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }
  const dogs = user.dogs || [];

  document.getElementById('broadcast-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'broadcast-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:8000;background:rgba(0,0,0,0.5);display:flex;align-items:flex-end;';

  const dogOptions = dogs.length > 0
    ? dogs.map((d, i) => `<option value="${i}">${d.name} (${d.breed})</option>`).join('')
    : '<option value="">반려견을 먼저 등록해주세요</option>';

  modal.innerHTML = `
  <div style="background:#fff;border-radius:24px 24px 0 0;width:100%;padding:28px 24px 36px;animation:slideUp 0.3s ease;">
  <style>@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>
  <div style="width:40px;height:4px;background:#e0e0e0;border-radius:2px;margin:0 auto 24px;"></div>
  <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:4px;">지금 바로 도우미 요청</h3>
  <p style="font-size:0.8rem;color:#999;margin-bottom:20px;">주변 온라인 도우미 전원에게 알림이 전송돼요</p>

  <div class="form-group" style="margin-bottom:14px;">
  <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:6px;">반려견 선택</label>
  <select id="bc-dog" class="form-select">${dogOptions}</select>
  </div>

  <div class="form-group" style="margin-bottom:14px;">
  <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:6px;">특이사항 (선택)</label>
  <input type="text" id="bc-notes" class="form-input" placeholder="예: 목줄 꼭 잡아주세요, 간식 챙겨드릴게요">
  </div>

  <button onclick="submitBroadcastRequest()" style="width:100%;padding:15px;background:#1a1a1a;color:#fff;border:none;border-radius:14px;font-size:1rem;font-weight:800;cursor:pointer;margin-top:4px;">
  ${icon('navigation',13)} 도우미 찾기
  </button>
  </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

async function submitBroadcastRequest() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const dogSel = document.getElementById('bc-dog');
  const notes = document.getElementById('bc-notes')?.value?.trim();
  const dogs = user.dogs || [];
  const dog = dogs[parseInt(dogSel?.value)] || null;

  if (!dog) {
    showToast('반려견을 먼저 프로필에서 등록해주세요.', 'error');
    return;
  }

  document.getElementById('broadcast-modal')?.remove();

  window._pendingPaymentWalkerId = null;
  window._pendingPaymentType = 'broadcast';
  try {
    await showPaymentConfirmModal({ dogSize: dog.size || 'small', dogName: dog.name, duration: 40 });
  } catch(e) {
    if (e === 'cancelled') showToast('결제가 취소되었어요.', 'info');
    return;
  }

  let lat = null, lng = null;
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
    );
    lat = pos.coords.latitude;
    lng = pos.coords.longitude;
  } catch(e) {}

  try {
    const resp = await fetch('/api/walk-requests/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: user.id,
        dogName: dog.name,
        dogBreed: dog.breed,
        dogSize: dog.size,
        dogAggression: dog.aggression || 'none',
        dogPersonality: dog.personality || 'normal',
        walkDifficulty: dog.walkDifficulty || 'easy',
        dogSpecialNotes: notes,
        pickupLatitude: lat,
        pickupLongitude: lng
      })
    });
    const data = await resp.json();
    if (!data.success) { showToast(data.error || '요청 실패', 'error'); return; }

    _broadcastRequestId = data.request.id;
    if (data.sentCount === 0) {
      if (data.availableCount > 0) {
        showToast(`도우미 ${data.availableCount}명이 등록되어 있지만 현재 앱을 열고 있지 않아요. 도우미 목록에서 직접 요청해보세요.`, 'info');
      } else {
        showToast('주변에 등록된 도우미가 없어요. 잠시 후 다시 시도해주세요.', 'error');
      }
      await fetch(`/api/walk-requests/${data.request.id}/cancel-broadcast`, { method: 'PATCH' });
      return;
    }
    showBroadcastWaitingScreen(data.request.id, data.sentCount);
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

function showBroadcastWaitingScreen(requestId, sentCount) {
  document.getElementById('broadcast-waiting')?.remove();
  const el = document.createElement('div');
  el.id = 'broadcast-waiting';
  el.style.cssText = 'position:fixed;inset:0;z-index:8500;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;';

  el.innerHTML = `
  <style>
  @keyframes bwPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:0.7}}
  </style>
  <div style="width:80px;height:80px;border-radius:50%;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin-bottom:24px;animation:bwPulse 1.8s ease-in-out infinite;"></div>
  <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:8px;text-align:center;">도우미를 찾고 있어요</h2>
  <p style="font-size:0.88rem;color:#718096;text-align:center;margin-bottom:8px;">
  ${sentCount > 0 ? `주변 <b>${sentCount}명</b>의 도우미에게 알림 전송됨` : '온라인 도우미에게 알림 전송 중...'}
  </p>
  <div style="font-size:1.6rem;font-weight:800;color:#00AA76;margin-bottom:32px;" id="bw-timer">5:00</div>
  <div style="width:200px;height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden;margin-bottom:32px;">
  <div id="bw-progress" style="height:100%;background:#00AA76;border-radius:2px;width:100%;transition:width 1s linear;"></div>
  </div>
  <button onclick="cancelBroadcastRequest('${requestId}')" style="padding:12px 32px;background:none;border:1.5px solid #e0e0e0;border-radius:999px;color:#718096;font-size:0.88rem;font-weight:600;cursor:pointer;">요청 취소</button>
  `;
  document.body.appendChild(el);

  let remaining = 300;
  _broadcastTimer = setInterval(() => {
    remaining--;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const timerEl = document.getElementById('bw-timer');
    const progressEl = document.getElementById('bw-progress');
    if (timerEl) timerEl.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    if (progressEl) progressEl.style.width = `${(remaining / 300) * 100}%`;
    if (remaining <= 0) {
      clearInterval(_broadcastTimer);
      el.remove();
      showToast('주변에 응답 가능한 도우미가 없어요. 잠시 후 다시 시도해주세요.', 'error');
    }
  }, 1000);
}

async function cancelBroadcastRequest(requestId) {
  clearInterval(_broadcastTimer);
  document.getElementById('broadcast-waiting')?.remove();
  try {
    await fetch(`/api/walk-requests/${requestId}/cancel-broadcast`, { method: 'PATCH' });
  } catch(e) {}
  showToast('요청을 취소했어요.', 'info');
}

function showWalkerAcceptedModal(data) {
  document.getElementById('walker-accepted-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'walker-accepted-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.45);display:flex;align-items:flex-end;';

  const stars = data.walkerRating
    ? Array.from({length:5},(_,i) => icon('star',14,i<Math.round(data.walkerRating)?'#F6A623':'#E0E0E0')).join('')
    : '';

  modal.innerHTML = `
    <div style="background:#fff;border-radius:24px 24px 0 0;width:100%;padding:28px 24px 40px;animation:slideUp 0.3s ease;">
      <style>@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>
      <div style="width:40px;height:4px;background:#e0e0e0;border-radius:2px;margin:0 auto 20px;"></div>

      <div style="display:flex;align-items:center;gap:6px;margin-bottom:16px;">
        <div style="width:10px;height:10px;border-radius:50%;background:#00AA76;"></div>
        <span style="font-size:0.8rem;font-weight:700;color:#00AA76;">매칭 완료</span>
      </div>

      <div style="display:flex;align-items:center;gap:16px;padding:16px;background:#f8f8f6;border-radius:14px;margin-bottom:16px;">
        <div style="width:52px;height:52px;border-radius:50%;background:#00AA76;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.3rem;flex-shrink:0;">
          ${(data.walkerName||'도').charAt(0)}
        </div>
        <div style="flex:1;">
          <div style="font-weight:800;font-size:1rem;margin-bottom:2px;">${data.walkerName||'도우미'}님</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#718096;">
            ${stars ? `<span style="display:flex;align-items:center;gap:2px;">${stars} ${(data.walkerRating||5).toFixed(1)}</span>` : ''}
            ${data.walkerExperience ? `<span>· ${data.walkerExperience}</span>` : ''}
          </div>
          ${data.walkerIntro ? `<div style="font-size:0.8rem;color:#555;margin-top:4px;">"${data.walkerIntro}"</div>` : ''}
        </div>
      </div>

      <div style="background:#f0fdf4;border-radius:12px;padding:14px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:0.85rem;font-weight:700;color:#166534;margin-bottom:4px;">
          ${icon('clock',14,'#166534')} 도우미가 출발 준비 중이에요
        </div>
        <div style="font-size:0.78rem;color:#4ade80;">출발하면 실시간으로 위치를 확인할 수 있어요.</div>
      </div>

      <button onclick="document.getElementById('walker-accepted-modal').remove();showChatButton('${data.requestId}');Router.navigate('/matching');"
        style="width:100%;padding:14px;background:#1a1a1a;color:#fff;border:none;border-radius:14px;font-size:0.95rem;font-weight:700;cursor:pointer;">
        확인
      </button>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function showBroadcastMatchedScreen(data) {
  document.getElementById('broadcast-matched-screen')?.remove();
  const el = document.createElement('div');
  el.id = 'broadcast-matched-screen';
  el.style.cssText = 'position:fixed;inset:0;z-index:8500;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;animation:ltFadeIn 0.3s ease;';
  el.innerHTML = `
  <div style="width:80px;height:80px;border-radius:50%;background:#00AA76;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;margin-bottom:20px;">✓</div>
  <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:8px;text-align:center;">매칭 완료!</h2>
  <p style="font-size:0.95rem;color:#444;text-align:center;margin-bottom:6px;"><b>${data.walkerName}</b>님이 수락했어요</p>
  <p style="font-size:0.82rem;color:#718096;text-align:center;margin-bottom:32px;">도우미가 픽업하러 이동 중이에요</p>
  <button onclick="document.getElementById('broadcast-matched-screen').remove();showChatButton('${data.requestId}');Router.navigate('/matching')" style="padding:14px 40px;background:#1a1a1a;color:#fff;border:none;border-radius:999px;font-size:0.95rem;font-weight:700;cursor:pointer;">확인</button>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

// ============================================================
// 도우미: 브로드캐스트 수신 알림 (30초 카운트다운)
// ============================================================

function showBroadcastNotification(data) {
  document.getElementById('broadcast-notif')?.remove();
  const notif = document.createElement('div');
  notif.id = 'broadcast-notif';
  notif.style.cssText = 'position:fixed;inset:0;z-index:8500;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:20px;';

  const sizeLabel = { small:'소형견', medium:'중형견', large:'대형견' }[data.dogSize] || data.dogSize || '';
  const aggrLabel = { none:'온순해요', medium:'약간 공격성', high:'공격성 있음' }[data.dogAggression] || '';
  const diffLabel = { easy:'쉬움', medium:'보통', hard:'어려움' }[data.walkDifficulty] || '';

  notif.innerHTML = `
  <div style="background:#fff;border-radius:20px;width:100%;max-width:380px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
  <div style="background:#1a1a1a;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
  <div style="color:#fff;font-weight:800;font-size:0.95rem;">산책 요청이 들어왔어요!</div>
  <div id="bc-countdown" style="background:#00AA76;color:#fff;font-size:0.85rem;font-weight:800;padding:4px 10px;border-radius:999px;">30</div>
  </div>
  <div style="padding:20px;">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
  <div style="width:44px;height:44px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:1.2rem;"></div>
  <div>
  <div style="font-weight:700;">${data.requesterName}</div>
  <div style="font-size:0.78rem;color:#999;">산책 요청자</div>
  </div>
  </div>
  <div style="background:#f8f8f6;border-radius:12px;padding:14px;margin-bottom:16px;">
  <div style="font-weight:700;margin-bottom:8px;">${data.dogName || '반려견'}</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;">
  ${sizeLabel ? `<span style="background:#e8f5e9;color:#2e7d32;padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;">${sizeLabel}</span>` : ''}
  ${aggrLabel ? `<span style="background:#fff3e0;color:#e65100;padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;">${aggrLabel}</span>` : ''}
  ${diffLabel ? `<span style="background:#e3f2fd;color:#1565c0;padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;">난이도 ${diffLabel}</span>` : ''}
  </div>
  ${data.dogSpecialNotes ? `<div style="font-size:0.8rem;color:#718096;margin-top:8px;">"${data.dogSpecialNotes}"</div>` : ''}
  </div>
  <div style="display:flex;gap:8px;">
  <button onclick="rejectBroadcast('${data.requestId}')" style="flex:1;padding:13px;background:#f5f5f5;border:none;border-radius:12px;font-weight:700;font-size:0.88rem;cursor:pointer;">거절</button>
  <button onclick="acceptBroadcast('${data.requestId}')" style="flex:2;padding:13px;background:#1a1a1a;color:#fff;border:none;border-radius:12px;font-weight:800;font-size:0.95rem;cursor:pointer;">수락하기 ✓</button>
  </div>
  </div>
  </div>
  `;
  document.body.appendChild(notif);

  let sec = 30;
  const cdTimer = setInterval(() => {
    sec--;
    const el = document.getElementById('bc-countdown');
    if (el) {
      el.textContent = sec;
      if (sec <= 10) el.style.background = '#e53e3e';
    }
    if (sec <= 0) {
      clearInterval(cdTimer);
      notif.remove();
    }
  }, 1000);
  notif._cdTimer = cdTimer;
}

async function acceptBroadcast(requestId) {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  const notif = document.getElementById('broadcast-notif');
  clearInterval(notif?._cdTimer);
  notif?.remove();

  try {
    const res = await fetch(`/api/walk-requests/${requestId}/accept-broadcast`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walkerId: user.id })
    });
    const data = await res.json();
    if (!data.success) { showToast(data.error || '이미 다른 도우미가 수락했어요.', 'error'); return; }
    showToast('수락했어요! 요청자에게 이동 중이에요.', 'success');
    showChatButton(requestId);
    window._activeWalkRequestId = requestId;
    _startWalkerLocationSharing(requestId);

    setTimeout(() => {
      renderWalkerRequestsList(user.id).then(({ html, requests }) => {
        const el = document.getElementById('walker-new-requests-wrap');
        if (el) { el.innerHTML = html; setTimeout(() => initWalkerNavMaps(requests), 100); }
      });
    }, 500);
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

function rejectBroadcast(requestId) {
  const notif = document.getElementById('broadcast-notif');
  clearInterval(notif?._cdTimer);
  notif?.remove();
}

async function showLiveTrackingOverlay(sessionId, walkerId) {
  document.getElementById('live-tracking-overlay')?.remove();

  let walkerName = '도우미';
  let dogName = '';
  try {
    const res = await fetch(`/api/walk-sessions?userId=${AuthService.getCurrentUser()?.id}`);
    const data = await res.json();
    const session = (data.sessions || []).find(s => s.id === sessionId);
    if (session) { dogName = session.dogName || ''; }
    const walkers = StorageService.get('matchProfiles', []);
    const wp = walkers.find(w => w.userId === walkerId);
    if (wp) walkerName = wp.userName || walkerName;
  } catch(e) {}

  const overlay = document.createElement('div');
  overlay.id = 'live-tracking-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#fff;display:flex;flex-direction:column;animation:ltFadeIn 0.3s ease;';

  overlay.innerHTML = `
  <style>
  @keyframes ltFadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ltPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
  .lt-dot { width:12px;height:12px;border-radius:50%;background:#00AA76;display:inline-block;animation:ltPulse 1.5s ease infinite; }
  </style>

  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f0f0ee;flex-shrink:0;">
  <div style="display:flex;align-items:center;gap:12px;">
  <span class="lt-dot"></span>
  <div>
  <div style="display:flex;align-items:center;gap:8px;">
  <span style="font-size:0.92rem;font-weight:700;">산책 진행 중</span>
  <span id="lt-phase" style="font-size:0.68rem;font-weight:700;background:#718096;color:#fff;padding:2px 8px;border-radius:999px;transition:background 0.3s;">이동 중</span>
  </div>
  <div id="lt-status" style="font-size:0.75rem;color:#718096;margin-top:2px;">${walkerName}님이 픽업하러 이동 중이에요</div>
  </div>
  </div>
  <button onclick="document.getElementById('live-tracking-overlay').remove();renderMatchingPage();" style="background:#f5f5f5;border:none;border-radius:8px;padding:8px 14px;font-size:0.8rem;font-weight:600;cursor:pointer;">최소화</button>
  </div>

  <div id="lt-map" style="flex:1;min-height:0;"></div>

  <div style="padding:16px 20px;border-top:1px solid #f0f0ee;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
  <div style="display:flex;gap:24px;">
  <div style="text-align:center;">
  <div style="font-size:1.1rem;font-weight:800;" id="lt-distance">0.00</div>
  <div style="font-size:0.7rem;color:#999;">km</div>
  </div>
  <div style="text-align:center;">
  <div style="font-size:1.1rem;font-weight:800;" id="lt-points">0</div>
  <div style="font-size:0.7rem;color:#999;">위치 업데이트</div>
  </div>
  </div>
  <div id="lt-walker-info" style="display:flex;align-items:center;gap:10px;">
  <div style="width:36px;height:36px;border-radius:50%;background:#00AA76;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1rem;">${walkerName.charAt(0)}</div>
  <div>
  <div style="font-size:0.85rem;font-weight:700;">${walkerName}</div>
  <div style="font-size:0.72rem;color:#718096;">산책 도우미</div>
  </div>
  </div>
  </div>

  <div id="lt-end-banner" style="display:none;background:#00AA76;color:#fff;padding:16px 20px;text-align:center;font-weight:700;font-size:0.95rem;flex-shrink:0;">
  산책이 완료되었습니다! 잠시 후 화면이 닫힙니다.
  </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(async () => {
    const mapEl = document.getElementById('lt-map');
    if (!mapEl || typeof L === 'undefined') return;

    const ltMap = L.map('lt-map').setView([37.5665, 126.9780], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'ⓒ OpenStreetMap'
    }).addTo(ltMap);

    let ltPolyline = null;
    let ltMarker = null;
    let ltPoints = [];

    try {
      const res = await fetch(`/api/walk-sessions/${sessionId}/route`);
      const data = await res.json();
      if (data.points?.length > 0) {
        ltPoints = data.points.map(p => [p.latitude, p.longitude]);
        ltPolyline = L.polyline(ltPoints, { color:'#00AA76', weight:4 }).addTo(ltMap);
        ltMap.fitBounds(ltPolyline.getBounds(), { padding:[30,30] });
        document.getElementById('lt-distance').textContent = (data.totalDistanceKm || 0).toFixed(2);
        document.getElementById('lt-points').textContent = ltPoints.length;
      }
    } catch(e) {}

    const posHandler = (data) => {
      if (data.sessionId !== sessionId) return;
      const latlng = [data.latitude, data.longitude];
      ltPoints.push(latlng);

      if (!ltPolyline) {
        ltPolyline = L.polyline([latlng], { color:'#00AA76', weight:4 }).addTo(ltMap);
      } else {
        ltPolyline.addLatLng(latlng);
      }

      const markerIcon = L.divIcon({
        html: `<div style="width:40px;height:40px;border-radius:50%;background:#00AA76;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:1.1rem;"></div>`,
        className: '', iconSize:[40,40], iconAnchor:[20,20]
      });
      if (ltMarker) ltMarker.remove();
      ltMarker = L.marker(latlng, { icon: markerIcon }).addTo(ltMap);
      ltMap.panTo(latlng);

      if (ltPoints.length > 1) {
        let total = 0;
        for (let i = 1; i < ltPoints.length; i++) {
          const [lat1,lng1] = ltPoints[i-1];
          const [lat2,lng2] = ltPoints[i];
          const R = 6371, toRad = x => x * Math.PI / 180;
          const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
          const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
          total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        }
        document.getElementById('lt-distance').textContent = total.toFixed(2);
      }
      document.getElementById('lt-points').textContent = ltPoints.length;
    };

    RealtimeService.on('walker-position', posHandler);
    overlay._cleanupLT = () => RealtimeService.off('walker-position', posHandler);
  }, 300);
}
