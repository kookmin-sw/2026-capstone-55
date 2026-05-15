// ============================================================
// 도우미 대시보드: 요청 목록, 네비게이션, 산책 이력
// ============================================================

function escapeQ(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);
}

async function renderWalkerRequestsList(userId) {
  let requests = [];
  try {
    const res = await fetch(`/api/walk-requests?walkerId=${userId}`);
    const data = await res.json();
    requests = (data.requests || []).filter(r => ['pending', 'accepted', 'heading', 'arrived', 'handoff', 'walking', 'returning', 'return_arrived'].includes(r.status));
  } catch(e) {}

  if (requests.length === 0) return { html: '<p style="color:#718096;font-size:0.88rem;">현재 받은 요청이 없습니다.</p>', requests: [] };

  const users = StorageService.get('users', []);

  try {
  const html = requests.map(r => {
    const requester = users.find(u => u.id === r.requesterId);
    const requesterName = requester ? (requester.nickname || requester.name) : (r.requesterName || '요청자');
    const requesterPhoto = requester?.profileImage || '';
    const statusLabel = {
      pending: '수락 대기',
      accepted: '출발 준비',
      heading: '이동 중',
      arrived: '도착',
      handoff: '산책 시작 준비',
      walking: '산책 중',
      returning: '복귀 중',
      return_arrived: '복귀 도착'
    };
    const statusColor = {
      pending: '#F6AD55',
      accepted: '#4299E1',
      heading: '#3B82F6',
      arrived: '#F59E0B',
      handoff: '#8B5CF6',
      walking: '#48BB78',
      returning: '#0EA5E9',
      return_arrived: '#FB7185'
    };

    return `
    <div class="match-request-card ${r.status === 'pending' ? 'match-request-card--pending' : ''}">
    <div class="match-request-card__header">
    <div class="match-request-card__avatar">${requesterPhoto ? `<img src="${escapeHtml(requesterPhoto)}" alt="${escapeHtml(requesterName)}">` : escapeHtml(requesterName.charAt(0) || '?')}</div>
    <div>
    <div class="match-request-card__from">${requesterName}</div>
    <div style="font-size:0.75rem;color:var(--color-text-muted);">${new Date(r.createdAt).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
    </div>
    <span style="margin-left:auto;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;background:${statusColor[r.status]}20;color:${statusColor[r.status]};">${statusLabel[r.status]||r.status}</span>
    </div>
    <div class="match-face-notice match-face-notice--compact">
      <strong>! 요청자 얼굴을 잘 확인하세요</strong>
      <span>실제 개인 얼굴이 보이는 프로필 사진을 기준으로 안전하게 매칭돼요.</span>
    </div>
    <div class="match-request-card__body">
    <div class="match-request-card__dog">
    <span style="font-size:1.2rem;"></span>
    <div>
    <div style="font-weight:700;">${r.dogName || '반려견'}${r.dogSize ? ` <span class="dw-size-tag">${{small:'소형견',medium:'중형견',large:'대형견'}[r.dogSize]||r.dogSize}</span>` : ''}</div>
    ${r.dogBreed ? `<div style="font-size:0.78rem;color:var(--color-text-muted);">${r.dogBreed}</div>` : ''}
    </div>
    </div>
    ${r.requestMessage ? `<div class="match-request-card__notes">"${r.requestMessage}"</div>` : ''}
    </div>
    ${r.status === 'pending' ? `
    <div class="match-request-card__actions">
    <button class="btn btn-primary" onclick="acceptWalkRequestNotif('${r.id}','${escapeQ(requesterName)}')">수락하기</button>
    <button class="btn btn-secondary" onclick="rejectWalkRequestNotif('${r.id}')">거절</button>
    </div>
    ` : ''}
    ${r.status === 'accepted' ? `
    <div style="background:#F0FDF4;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #86EFAC;">
    <div style="font-weight:700;font-size:0.9rem;color:#166534;margin-bottom:6px;">수락 완료 · 출발 준비 중</div>
    <div style="font-size:0.8rem;color:#4A5568;margin-bottom:12px;">출발 준비가 되면 아래 버튼을 눌러주세요. 요청자에게 이동 중 알림이 전송됩니다.</div>
    <button class="btn btn-primary" style="width:100%;padding:13px;" onclick="startWalkSession('${r.id}','${r.requesterId}','${escapeQ(r.dogName||'')}')">
    출발하기
    </button>
    </div>
    ${r.pickupLatitude && r.pickupLongitude ? `
    <div style="display:flex;gap:8px;margin-top:4px;">
    <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="openNavMap('${r.pickupLatitude}','${r.pickupLongitude}')">카카오맵</button>
    <button class="btn btn-secondary btn-sm" onclick="openNavMapNaver('${r.pickupLatitude}','${r.pickupLongitude}')">N 네이버</button>
    </div>
    ` : ''}
    ` : ''}
    ${r.status === 'heading' ? `
    <div style="background:#EFF6FF;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #93C5FD;">
    <div style="font-weight:700;font-size:0.9rem;color:#1E40AF;margin-bottom:6px;">이동 중 · 요청자 위치로 향하는 중</div>
    <div style="font-size:0.8rem;color:#4A5568;margin-bottom:12px;">요청자 위치에 도착하면 아래 버튼을 눌러주세요.</div>
    <div style="display:flex;gap:8px;">
    <button class="btn btn-primary" style="flex:2;padding:13px;" onclick="arriveAtPickup('${r.sessionId||_activeSessionId||''}')">
    도착했어요
    </button>
    <button class="btn btn-ghost" style="flex:1;padding:13px;color:#b91c1c;border:1px solid #fca5a5;" onclick="cancelWalkByWalker('${r.id}')">
    취소
    </button>
    </div>
    </div>
    ` : ''}
    ${r.status === 'arrived' ? `
    <div style="background:#FFFBEB;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #FCD34D;">
    <div style="font-weight:700;font-size:0.9rem;color:#92400E;margin-bottom:6px;">도착 · 반려견 픽업 중</div>
    <div style="font-size:0.8rem;color:#4A5568;">요청자가 반려견 전달완료를 누르면 산책이 바로 시작돼요.</div>
    </div>
    ` : ''}
    ${r.status === 'handoff' ? `
    <div style="background:#F5F3FF;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #C4B5FD;">
    <div style="font-weight:700;font-size:0.9rem;color:#5B21B6;margin-bottom:6px;">산책 시작 처리 중</div>
    <div style="font-size:0.8rem;color:#4A5568;margin-bottom:12px;">전달 확인을 산책 시작 상태로 반영하고 있어요.</div>
    <button class="btn btn-primary" style="width:100%;padding:13px;background:#00AA76;" onclick="Router.navigate('/walk-session')">
    지도 열기
    </button>
    </div>
    ` : ''}
    ${r.status === 'walking' ? `
    <div style="display:flex;gap:8px;">
    <button class="btn btn-primary btn-sm" style="flex:1;" onclick="Router.navigate('/walk-session')">트래킹 보기</button>
    <button class="btn btn-danger btn-sm" onclick="startReturnToRequester('${r.sessionId||_activeSessionId||''}')">복귀 시작</button>
    </div>
    ` : ''}
    ${r.status === 'returning' ? `
    <div style="display:flex;gap:8px;">
    <button class="btn btn-primary btn-sm" style="flex:1;" onclick="Router.navigate('/walk-session')">실시간 보기</button>
    <button class="btn btn-secondary btn-sm" onclick="arriveReturnToRequester('${r.sessionId||_activeSessionId||''}')">복귀 도착</button>
    </div>
    ` : ''}
    ${r.status === 'return_arrived' ? `
    <div style="background:#FFF1F2;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #FDA4AF;">
    <div style="font-weight:700;font-size:0.9rem;color:#9F1239;margin-bottom:6px;">재인계 확인</div>
    <div style="font-size:0.8rem;color:#4A5568;margin-bottom:12px;">요청자와 도우미가 모두 확인하면 산책이 완료돼요.</div>
    ${r.walkerReturnHandoffConfirmedAt ? `
    <div style="font-size:0.8rem;color:#64748B;background:#F1F5F9;border-radius:9px;padding:10px;text-align:center;font-weight:700;">요청자 확인 대기 중…</div>
    ` : `
    <button class="btn btn-primary" style="width:100%;padding:13px;background:#00AA76;" onclick="confirmWalkerReturnHandoff('${r.sessionId||_activeSessionId||''}')">
    반려견을 잘 인계했어요
    </button>
    `}
    </div>
    ` : ''}
    </div>`;
  }).join('');

  return { html, requests };
  } catch (e) {
    console.error('[WalkerDashboard] 요청 목록 렌더링 실패:', e);
    return {
      html: '<div class="empty-state"><div class="empty-icon">!</div><p>산책 요청을 불러오지 못했어요.<br>잠시 후 다시 시도해주세요.</p></div>',
      requests: []
    };
  }
}

function initWalkerNavMaps(requests) {
  requests.filter(r => r.status === 'accepted' && r.pickupLatitude && r.pickupLongitude).forEach(r => {
    const container = document.getElementById(`walker-nav-map-${r.id}`);
    if (!container || container._mapInit) return;
    container._mapInit = true;
    const map = L.map(container).setView([r.pickupLatitude, r.pickupLongitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const markerIcon = L.divIcon({ html: '<div style="background:#e53e3e;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:1rem;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>', className: '', iconSize: [32,32], iconAnchor: [16,16] });
    L.marker([r.pickupLatitude, r.pickupLongitude], { icon: markerIcon }).bindPopup(`<b>${r.requesterName}</b><br>요청자 위치`).openPopup().addTo(map);
  });
}

function openNavMap(lat, lng) {
  window.open(`https://map.kakao.com/link/to/요청자위치,${lat},${lng}`, '_blank');
}

function openNavMapNaver(lat, lng) {
  window.open(`https://map.naver.com/v5/directions/-/-/-/walk?c=${lng},${lat},15,0,0,0,dh`, '_blank');
}

async function showWalkRouteModal(sessionId, partnerName, distText, dateText) {
  if (!sessionId) { showToast('경로 데이터가 없어요.', 'info'); return; }

  const modalId = 'walk-route-modal';
  document.getElementById(modalId)?.remove();

  const modal = document.createElement('div');
  modal.id = modalId;
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `
  <div style="background:#fff;border-radius:20px;width:100%;max-width:500px;max-height:85vh;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.25);display:flex;flex-direction:column;">
  <div style="padding:20px 24px;border-bottom:1px solid #f0f0ee;display:flex;justify-content:space-between;align-items:center;">
  <div>
  <div style="font-weight:800;font-size:1rem;">${partnerName}님과의 산책</div>
  <div style="font-size:0.78rem;color:#718096;margin-top:2px;">${dateText}${distText ? ` · ${distText}` : ''}</div>
  </div>
  <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#718096;">×</button>
  </div>
  <div id="walk-route-modal-map" style="flex:1;min-height:350px;"></div>
  <div id="walk-route-modal-stats" style="padding:16px 24px;border-top:1px solid #f0f0ee;display:flex;gap:24px;justify-content:center;">
  <div class="spinner" style="margin:8px auto;"></div>
  </div>
  </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  try {
    const res = await fetch(`/api/walk-sessions/${sessionId}/route`);
    const data = await res.json();
    const points = (data.points || []).map(p => [p.latitude, p.longitude]);

    const mapContainer = document.getElementById('walk-route-modal-map');
    if (!mapContainer || points.length === 0) {
      const statsEl = document.getElementById('walk-route-modal-stats');
      if (statsEl) statsEl.innerHTML = '<div style="text-align:center;color:#718096;font-size:0.85rem;padding:8px;">기록된 경로가 없어요.<br><span style="font-size:0.75rem;color:#b0b0b0;">실제 이동 시 경로가 기록됩니다.</span></div>';
      return;
    }

    const map = L.map(mapContainer).setView(points[0], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'ⓒ OpenStreetMap' }).addTo(map);

    const startIcon = L.divIcon({ html: '<div style="width:14px;height:14px;background:#3B82F6;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(59,130,246,0.5);"></div>', className: '', iconSize: [14,14], iconAnchor: [7,7] });
    const endIcon = L.divIcon({ html: '<div style="width:14px;height:14px;background:#EF4444;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(239,68,68,0.5);"></div>', className: '', iconSize: [14,14], iconAnchor: [7,7] });
    L.marker(points[0], { icon: startIcon }).bindPopup('출발').addTo(map);
    if (points.length > 1) {
      L.marker(points[points.length - 1], { icon: endIcon }).bindPopup('도착').addTo(map);
    }

    if (points.length >= 2) {
      const polyline = L.polyline(points, { color: '#F59E0B', weight: 5, opacity: 0.85 }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 17 });
    } else {
      map.setView(points[0], 16);
      const statsEl2 = document.getElementById('walk-route-modal-stats');
      if (statsEl2) {
        statsEl2.innerHTML = '<div style="text-align:center;color:#94A3B8;font-size:0.82rem;padding:6px 0;">이동 경로가 기록되지 않았어요.<br><span style="font-size:0.75rem;">고정 위치 테스트이거나 GPS 신호가 약했어요.</span></div>';
        return;
      }
    }

    const statsEl = document.getElementById('walk-route-modal-stats');
    const dist = data.totalDistanceKm != null ? `${data.totalDistanceKm} km` : '0 km';
    const duration = data.totalDistanceKm > 0 ? Math.round(points.length * 3 / 60) : 0;
    if (statsEl) {
      statsEl.innerHTML = `
        <div style="text-align:center;"><div style="font-size:1.2rem;font-weight:800;">${dist}</div><div style="font-size:0.72rem;color:#718096;">거리</div></div>
        <div style="text-align:center;"><div style="font-size:1.2rem;font-weight:800;">${duration}분</div><div style="font-size:0.72rem;color:#718096;">시간</div></div>
        <div style="text-align:center;"><div style="font-size:1.2rem;font-weight:800;">${points.length}</div><div style="font-size:0.72rem;color:#718096;">포인트</div></div>
      `;
    }
  } catch(e) {
    const statsEl = document.getElementById('walk-route-modal-stats');
    if (statsEl) statsEl.innerHTML = '<div style="text-align:center;color:#b91c1c;font-size:0.85rem;padding:8px;">경로를 불러오지 못했어요.</div>';
  }
}

async function renderDirectWalkHistory(userId, role) {
  const STATUS_LABEL = {
    accepted: '출발 준비',
    walking: '산책 중',
    completed: '완료'
  };
  const HISTORY_STATUSES = ['accepted', 'walking', 'completed'];

  let requests = [];
  try {
    const param = role === 'walker' ? `walkerId=${userId}` : `requesterId=${userId}`;
    const res = await fetch(`/api/walk-requests?${param}`);
    const data = await res.json();
    requests = (data.requests || []).filter(r => HISTORY_STATUSES.includes(r.status));
  } catch (e) {
    return { html: '', hasRecords: false };
  }

  if (requests.length === 0) return { html: '', hasRecords: false };

  let sessions = [];
  try {
    const res = await fetch(`/api/walk-sessions?userId=${userId}`);
    const data = await res.json();
    sessions = data.sessions || [];
  } catch (e) {}

  const sortedRequests = requests
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const completedCount = sortedRequests.filter(r => r.status === 'completed').length;
  const activeCount = sortedRequests.length - completedCount;
  const totalKm = sessions.reduce((sum, s) => sum + (Number(s.totalDistanceKm) || 0), 0);
  const roleLabel = role === 'walker' ? '도우미 기록' : '요청 기록';
  const emptyRouteHint = role === 'walker' ? '산책 완료 후 경로가 저장돼요' : '완료된 산책은 경로를 다시 볼 수 있어요';

  const cards = sortedRequests.map(r => {
    const partnerName = role === 'walker' ? (r.requesterName || r.requesterId) : (r.walkerName || r.walkerId);
    const session = sessions.find(s => s.requestId === r.id);
    const distText = session && session.totalDistanceKm != null ? `${Number(session.totalDistanceKm).toFixed(2)} km` : '';
    const dateText = new Date(r.updatedAt || r.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const startFmt = r.requestedStartTime
      ? new Date(r.requestedStartTime).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '시간 미정';
    const sessionId = session?.id || '';
    const hasRoute = session && session.totalDistanceKm != null;
    const dogName = r.dogName || '반려견';
    const statusClass = r.status === 'completed' ? 'is-complete' : r.status === 'walking' ? 'is-live' : 'is-ready';
    const tagText = hasRoute ? '경로 보기' : emptyRouteHint;

    return `
    <article class="match-history-card ${hasRoute ? 'match-history-card--clickable' : ''}" ${hasRoute ? `onclick="showWalkRouteModal('${escapeQ(sessionId)}','${escapeQ(partnerName)}','${escapeQ(distText)}','${escapeQ(dateText)}')"` : ''}>
      <div class="match-history-card__avatar">${escapeHtml(partnerName.charAt(0) || '?')}</div>
      <div class="match-history-card__main">
        <div class="match-history-card__top">
          <div>
            <div class="match-history-card__name">${escapeHtml(partnerName)}</div>
            <div class="match-history-card__sub">${escapeHtml(dogName)} · ${escapeHtml(startFmt)}</div>
          </div>
          <span class="match-history-status ${statusClass}">${escapeHtml(STATUS_LABEL[r.status] || r.status)}</span>
        </div>
        <div class="match-history-card__meta">
          <span>${icon('calendar', 13)} ${escapeHtml(dateText)}</span>
          <span>${icon('map-pin', 13)} ${escapeHtml(distText || '기록 대기')}</span>
          <span class="${hasRoute ? 'is-link' : 'is-muted'}">${escapeHtml(tagText)}${hasRoute ? ' →' : ''}</span>
        </div>
      </div>
    </article>`;
  }).join('');

  const html = `
  <div class="match-history-panel">
    <div class="match-history-summary">
      <div>
        <span>${escapeHtml(roleLabel)}</span>
        <strong>${sortedRequests.length}건</strong>
      </div>
      <div>
        <span>완료</span>
        <strong>${completedCount}건</strong>
      </div>
      <div>
        <span>진행</span>
        <strong>${activeCount}건</strong>
      </div>
      <div>
        <span>누적 거리</span>
        <strong>${totalKm.toFixed(2)}km</strong>
      </div>
    </div>
    <div class="match-history-list">${cards}</div>
  </div>`;

  return { html, hasRecords: true };
}
