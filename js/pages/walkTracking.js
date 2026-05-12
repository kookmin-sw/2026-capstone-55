// Pawsitive - Walk Tracking Page
// --- GPS 산책 트래킹 페이지 ---
function renderWalkTrackingPage() {
  const user = AuthService.getCurrentUser();
  if (!user) {
    renderPage(`
      <div class="page-header">
        <h1>🏃 산책 트래킹</h1>
        <p>GPS로 산책을 기록하고 건강 데이터를 수집해요</p>
      </div>
      <div class="card" style="padding:24px; margin-bottom:16px; text-align:center;">
        <div style="font-size:3rem; margin-bottom:8px;">🐾</div>
        <div style="font-size:1.5rem; font-weight:800; margin-bottom:4px;">00:00:00</div>
        <div style="font-size:0.85rem; color:var(--color-text-muted);">산책 시간</div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:16px;">
        <div class="card" style="padding:16px; text-align:center;">
          <div style="font-size:0.75rem; color:var(--color-text-muted);">거리</div>
          <div style="font-size:1.2rem; font-weight:800;">0.00 km</div>
        </div>
        <div class="card" style="padding:16px; text-align:center;">
          <div style="font-size:0.75rem; color:var(--color-text-muted);">속도</div>
          <div style="font-size:1.2rem; font-weight:800;">0.0 km/h</div>
        </div>
        <div class="card" style="padding:16px; text-align:center;">
          <div style="font-size:0.75rem; color:var(--color-text-muted);">칼로리</div>
          <div style="font-size:1.2rem; font-weight:800;">0 kcal</div>
        </div>
      </div>
      <div style="height:250px; border-radius:12px; background:#e8e8e8; display:flex; align-items:center; justify-content:center; color:#999; margin-bottom:16px;">
        🗺️ 산책 경로가 여기에 표시돼요
      </div>
      <button class="btn btn-primary" style="width:100%; padding:14px; font-size:1rem;" onclick="showLoginModal('GPS 산책 트래킹을 시작하려면 로그인이 필요해요!\\n산책 경로, 거리, 시간, 칼로리를 기록할 수 있어요.')">🏃 산책 시작하기</button>
    `);
    return;
  }

  const dogs = user.dogs || [];
  const selectedIdx = StorageService.get('walkingDogIdx', 0);
  const dog = dogs.length > 0 ? dogs[Math.min(selectedIdx, dogs.length - 1)] : null;

  renderPage(`
    <style>
      .walk-page { max-width:600px; margin:0 auto; }
      .walk-hero { text-align:center; padding:40px 0 32px; }
      .walk-hero__title { font-size:1.6rem; font-weight:700; letter-spacing:-0.5px; margin-bottom:4px; }
      .walk-hero__sub { font-size:0.85rem; color:var(--color-text-muted); }
      .walk-dog-select { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:32px; }
      .walk-dog-chip { padding:8px 18px; border:1.5px solid var(--color-border); border-radius:20px; font-size:0.82rem; font-weight:600; background:#fff; cursor:pointer; transition:all 0.15s; }
      .walk-dog-chip.active { background:var(--color-text); color:#fff; border-color:var(--color-text); }
      .walk-map-container { position:relative; border-radius:16px; overflow:hidden; margin-bottom:24px; border:1px solid var(--color-border); }
      .walk-map { height:280px; width:100%; }
      .walk-map-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:var(--color-bg-section); font-size:0.88rem; color:var(--color-text-muted); pointer-events:none; }
      .walk-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1px; background:var(--color-border); border:1px solid var(--color-border); border-radius:12px; overflow:hidden; margin-bottom:32px; }
      .walk-stat { background:#fff; padding:20px 16px; text-align:center; }
      .walk-stat__value { font-size:1.8rem; font-weight:700; letter-spacing:-1px; color:var(--color-text); line-height:1; }
      .walk-stat__label { font-size:0.7rem; color:var(--color-text-muted); margin-top:6px; text-transform:uppercase; letter-spacing:1px; font-weight:600; }
      .walk-start-btn { width:120px; height:120px; border-radius:50%; border:none; font-size:1.1rem; font-weight:700; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
      .walk-start-btn--go { background:var(--color-text); color:#fff; box-shadow:0 4px 24px rgba(0,0,0,0.2); }
      .walk-start-btn--go:hover { transform:scale(1.05); box-shadow:0 6px 32px rgba(0,0,0,0.25); }
      .walk-start-btn--go:active { transform:scale(0.97); }
      .walk-start-btn--stop { background:#e53e3e; color:#fff; box-shadow:0 4px 24px rgba(229,62,62,0.3); }
      .walk-start-btn--stop:hover { transform:scale(1.05); }
      .walk-controls { text-align:center; margin-bottom:40px; }
      .walk-controls__hint { font-size:0.75rem; color:var(--color-text-muted); margin-top:8px; }
      .walk-status-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 16px; border-radius:20px; font-size:0.78rem; font-weight:700; margin-bottom:16px; }
      .walk-status-badge--idle { background:var(--color-bg-section); color:var(--color-text-muted); }
      .walk-status-badge--active { background:#f0fff4; color:#38a169; }
      .walk-status-dot { width:8px; height:8px; border-radius:50%; }
      .walk-status-dot--idle { background:var(--color-text-muted); }
      .walk-status-dot--active { background:#38a169; animation:dotPulse 1.5s ease-in-out infinite; }
      @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      .walk-history { margin-top:8px; }
      .walk-history__title { font-size:0.75rem; text-transform:uppercase; letter-spacing:1.5px; color:var(--color-text-muted); font-weight:600; margin-bottom:12px; }
      .walk-history-item { display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid var(--color-border-light); }
      .walk-history-item__date { font-size:0.85rem; font-weight:600; }
      .walk-history-item__dog { font-size:0.75rem; color:var(--color-text-muted); margin-top:2px; }
      .walk-history-item__stats { text-align:right; }
      .walk-history-item__dist { font-size:0.95rem; font-weight:700; }
      .walk-history-item__meta { font-size:0.72rem; color:var(--color-text-muted); margin-top:2px; }
      .walk-complete { text-align:center; padding:32px 0; }
      .walk-complete__title { font-size:1.2rem; font-weight:700; margin-bottom:8px; }
      .walk-complete__summary { font-size:0.88rem; color:var(--color-text-light); margin-bottom:24px; }
    </style>

    <div class="walk-page">
      <div class="walk-hero">
        <div class="walk-hero__title">산책</div>
        <div class="walk-hero__sub">GPS로 산책을 기록하세요</div>
      </div>

      ${dogs.length > 1 ? `
        <div class="walk-dog-select">
          ${dogs.map((d, i) => `<button class="walk-dog-chip ${i === Math.min(selectedIdx, dogs.length - 1) ? 'active' : ''}" onclick="StorageService.set('walkingDogIdx',${i});renderWalkTrackingPage()">${d.name}</button>`).join('')}
        </div>
      ` : dogs.length === 1 ? `
        <div style="text-align:center; margin-bottom:24px;">
          <span style="font-size:0.85rem; color:var(--color-text-light);">${dog.name} · ${dog.breed}</span>
        </div>
      ` : `
        <div style="text-align:center; margin-bottom:24px; padding:16px; border:1px dashed var(--color-border); border-radius:12px;">
          <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:8px;">반려견을 먼저 등록해주세요</p>
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/profile')">프로필에서 등록</button>
        </div>
      `}

      <div id="tracking-alert"></div>

      <div class="walk-map-container">
        <div id="tracking-map" class="walk-map"></div>
        <div class="walk-map-overlay" id="walk-map-overlay">산책을 시작하면 경로가 표시됩니다</div>
      </div>

      <div id="tracking-data" style="display:none;">
        <div class="walk-stats">
          <div class="walk-stat">
            <div class="walk-stat__value" id="track-distance">0.00</div>
            <div class="walk-stat__label">킬로미터</div>
          </div>
          <div class="walk-stat">
            <div class="walk-stat__value" id="track-duration">00:00</div>
            <div class="walk-stat__label">시간</div>
          </div>
          <div class="walk-stat">
            <div class="walk-stat__value" id="track-pace">0.0</div>
            <div class="walk-stat__label">km/h</div>
          </div>
        </div>
        <div class="walk-stats" style="grid-template-columns:1fr 1fr;">
          <div class="walk-stat">
            <div class="walk-stat__value" id="track-calories">0</div>
            <div class="walk-stat__label">칼로리</div>
          </div>
          <div class="walk-stat">
            <div class="walk-stat__value" id="track-steps">--</div>
            <div class="walk-stat__label">걸음</div>
          </div>
        </div>
      </div>

      <div class="walk-controls" id="tracking-buttons">
        <div id="tracking-status">
          <div class="walk-status-badge walk-status-badge--idle">
            <span class="walk-status-dot walk-status-dot--idle"></span>
            대기 중
          </div>
        </div>
        <button class="walk-start-btn walk-start-btn--go" onclick="handleStartTracking()">시작</button>
        <div class="walk-controls__hint">GPS를 사용하여 경로를 기록합니다</div>
      </div>

      <div id="walk-history-section" class="walk-history"></div>
    </div>
  `);

  // 지도 미리 초기화
  const mapEl = document.getElementById('tracking-map');
  if (mapEl && typeof L !== 'undefined') {
    _trackingMap = L.map(mapEl, { zoomControl: false }).setView([37.5665, 126.978], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ''
    }).addTo(_trackingMap);
    navigator.geolocation.getCurrentPosition((pos) => {
      _trackingMap.setView([pos.coords.latitude, pos.coords.longitude], 16);
      L.circleMarker([pos.coords.latitude, pos.coords.longitude], { radius: 6, fillColor: '#1a1a1a', fillOpacity: 1, color: '#fff', weight: 2 }).addTo(_trackingMap);
      document.getElementById('walk-map-overlay').style.display = 'none';
    }, () => {});
  }

  const dogId = dog ? dog.name : null;
  loadWalkHistory(user.id, dogId);
}

function handleSelectWalkingDog() {
  const sel = document.getElementById('walking-dog-select');
  if (sel) {
    StorageService.set('walkingDogIdx', parseInt(sel.value));
    renderWalkTrackingPage();
  }
}

let _trackingMap = null;
let _trackingPolyline = null;
let _trackingTimer = null;
let _trackingMarker = null;
let _trackingStartMarker = null;

function handleStartTracking() {
  const user = AuthService.getCurrentUser();
  const dogs = user ? (user.dogs || []) : [];
  const selectedIdx = StorageService.get('walkingDogIdx', 0);
  const dog = dogs.length > 0 ? dogs[Math.min(selectedIdx, dogs.length - 1)] : null;

  const result = GPSTrackingService.startTracking((data) => {
    document.getElementById('track-distance').textContent = data.distance.toFixed(2);
    const mins = data.duration;
    document.getElementById('track-duration').textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    document.getElementById('track-pace').textContent = data.avgPace.toFixed(1);
    document.getElementById('track-calories').textContent = data.calories;

    if (data.lastPosition && _trackingMap) {
      const pos = [data.lastPosition.lat, data.lastPosition.lng];
      _trackingMap.setView(pos, _trackingMap.getZoom());

      // 현재 위치 마커 업데이트
      if (_trackingMarker) {
        _trackingMarker.setLatLng(pos);
      } else {
        const myIcon = L.divIcon({
          className: '',
          html: '<div style="width:20px;height:20px;background:#F59E0B;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        _trackingMarker = L.marker(pos, { icon: myIcon }).addTo(_trackingMap);
        _trackingMarker.bindPopup('🐾 현재 위치').openPopup();
      }

      // 출발 지점 마커
      if (!_trackingStartMarker && data.coordinates.length >= 1) {
        const start = data.coordinates[0];
        const startIcon = L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;background:#22C55E;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        _trackingStartMarker = L.marker([start.lat, start.lng], { icon: startIcon }).addTo(_trackingMap);
        _trackingStartMarker.bindPopup('🟢 출발');
      }

      // 경로 업데이트
      if (_trackingPolyline && data.coordinates.length > 1) {
        _trackingPolyline.setLatLngs(data.coordinates.map(c => [c.lat, c.lng]));
      }
    }
  }, { userId: user?.id, dogId: dog?.name, dogName: dog?.name });

  if (!result.success) {
    const alertEl = document.getElementById('tracking-alert');
    if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
    return;
  }

  document.getElementById('tracking-data').style.display = 'block';
  const overlay = document.getElementById('walk-map-overlay');
  if (overlay) overlay.style.display = 'none';
  document.getElementById('tracking-status').innerHTML = `
    <div class="walk-status-badge walk-status-badge--active">
      <span class="walk-status-dot walk-status-dot--active"></span>
      산책 중
    </div>
  `;
  document.getElementById('tracking-buttons').innerHTML = `
    <div id="tracking-status">
      <div class="walk-status-badge walk-status-badge--active">
        <span class="walk-status-dot walk-status-dot--active"></span>
        산책 중
      </div>
    </div>
    <button class="walk-start-btn walk-start-btn--stop" onclick="handleStopTracking()">종료</button>
  `;

  // 지도 초기화
  const mapEl = document.getElementById('tracking-map');
  if (mapEl && typeof L !== 'undefined') {
    _trackingMap = L.map(mapEl).setView([37.5665, 126.978], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(_trackingMap);
    _trackingPolyline = L.polyline([], { color: '#F59E0B', weight: 5, opacity: 0.8 }).addTo(_trackingMap);
    _trackingMarker = null;
    _trackingStartMarker = null;

    // 즉시 현재 위치로 이동 + 마커 표시
    navigator.geolocation.getCurrentPosition((pos) => {
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      _trackingMap.setView(latlng, 16);
      const myIcon = L.divIcon({
        className: '',
        html: '<div style="width:20px;height:20px;background:#F59E0B;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);animation:pulse 2s infinite;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      _trackingMarker = L.marker(latlng, { icon: myIcon }).addTo(_trackingMap);
      _trackingMarker.bindPopup('🐾 현재 위치').openPopup();
    });
  }

  // 타이머 업데이트
  _trackingTimer = setInterval(() => {
    const data = GPSTrackingService.getCurrentData();
    document.getElementById('track-duration').textContent = data.duration + ' 분';
  }, 10000);
}

async function handleStopTracking() {
  if (_trackingTimer) { clearInterval(_trackingTimer); _trackingTimer = null; }

  const walkData = GPSTrackingService.stopTracking();
  if (!walkData) return;

  const user = AuthService.getCurrentUser();
  const dogs = user.dogs || [];
  const selectedIdx = StorageService.get('walkingDogIdx', 0);
  const dog = dogs.length > 0 ? dogs[Math.min(selectedIdx, dogs.length - 1)] : null;

  // 서버에 저장 (반려견 이름을 dogId로 사용)
  const result = await GPSTrackingService.saveWalkToServer(
    user.id,
    dog ? dog.name : 'default',
    dog ? dog.name : '우리 강아지',
    walkData
  );

  // 코인 적립
  if (walkData.distance > 0.1 && typeof WalletService !== 'undefined') {
    const coins = Math.round(walkData.distance * 10);
    WalletService.earnCoins(user.id, coins, `산책 완료 (${walkData.distance.toFixed(2)}km)`);
  }

  document.getElementById('tracking-status').innerHTML = ``;
  document.getElementById('tracking-buttons').innerHTML = `
    <div class="walk-complete">
      <div class="walk-complete__title">산책 완료</div>
      <div class="walk-complete__summary">${walkData.distance.toFixed(2)}km · ${walkData.duration}분 · ${walkData.calories}kcal</div>
      <div style="display:flex; gap:8px; justify-content:center;">
        <button class="btn btn-primary" onclick="Router.navigate('/health')">건강 분석 보기</button>
        <button class="btn btn-secondary" onclick="renderWalkTrackingPage()">다시 산책하기</button>
      </div>
    </div>
  `;

  if (_trackingMap) { try { _trackingMap.remove(); } catch(e) {} _trackingMap = null; }
  _trackingMarker = null;
  _trackingStartMarker = null;
  _trackingPolyline = null;
}

let _walkHistoryCache = [];
let _walkCalYear = new Date().getFullYear();
let _walkCalMonth = new Date().getMonth();
let _walkCalSelectedDate = null; // null이면 전체, 숫자면 해당 날짜
let _walkRouteMaps = {};

async function loadWalkHistory(userId, dogId) {
  const section = document.getElementById('walk-history-section');
  if (!section) return;

  const walks = await GPSTrackingService.getWalkHistory(userId);
  _walkHistoryCache = dogId ? walks.filter(w => w.dogName === dogId || w.dogId === dogId) : walks;
  _walkCalYear = new Date().getFullYear();
  _walkCalMonth = new Date().getMonth();
  _walkCalSelectedDate = null;

  renderWalkCalendar();
}

function renderWalkCalendar() {
  const section = document.getElementById('walk-history-section');
  if (!section) return;
  const filtered = _walkHistoryCache;

  if (filtered.length === 0) {
    section.innerHTML = `<div style="text-align:center; padding:24px; color:var(--color-text-muted); font-size:0.85rem;">아직 산책 기록이 없습니다</div>`;
    return;
  }

  const year = _walkCalYear;
  const month = _walkCalMonth;
  const now = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // 이 달의 산책 데이터
  const monthKey = year + '-' + String(month + 1).padStart(2, '0');
  const monthWalks = filtered.filter(w => {
    const d = new Date(w.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const walkDays = {};
  monthWalks.forEach(w => {
    const day = new Date(w.createdAt).getDate();
    if (!walkDays[day]) walkDays[day] = 0;
    walkDays[day]++;
  });

  let calCells = '';
  for (let i = 0; i < firstDay; i++) calCells += '<div class="walk-cal__cell walk-cal__cell--empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    const hasWalk = !!walkDays[d];
    const isSelected = _walkCalSelectedDate === d;
    calCells += `<div class="walk-cal__cell${isToday ? ' walk-cal__cell--today' : ''}${hasWalk ? ' walk-cal__cell--active' : ''}${isSelected ? ' walk-cal__cell--selected' : ''}" onclick="selectWalkCalDate(${d})">${d}${walkDays[d] > 1 ? '<span class="walk-cal__count">' + walkDays[d] + '</span>' : ''}</div>`;
  }

  const monthLabel = year + '년 ' + (month + 1) + '월';
  const monthDist = monthWalks.reduce((s, w) => s + (w.distance || 0), 0);
  const monthTime = monthWalks.reduce((s, w) => s + (w.duration || 0), 0);

  // 기록 리스트 (선택된 날짜 필터)
  let listWalks = monthWalks;
  if (_walkCalSelectedDate) {
    listWalks = monthWalks.filter(w => new Date(w.createdAt).getDate() === _walkCalSelectedDate);
  }
  listWalks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const listHtml = listWalks.length > 0 ? listWalks.map(w => {
    const hasRoute = w.coordinates && w.coordinates.length > 1;
    return `
    <div class="walk-history-item" id="walk-item-${w.id}" style="flex-wrap:wrap;">
      <div style="flex:1;">
        <div class="walk-history-item__date">${new Date(w.createdAt).toLocaleDateString('ko-KR')} ${new Date(w.createdAt).toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'})}</div>
        <div class="walk-history-item__dog" id="walk-name-${w.id}">${w.title || w.dogName || '산책'}</div>
      </div>
      <div class="walk-history-item__stats">
        <div class="walk-history-item__dist">${(w.distance || 0).toFixed(2)} km</div>
        <div class="walk-history-item__meta">${w.duration || 0}분 · ${w.calories || 0}kcal</div>
      </div>
      <div style="display:flex; gap:4px; margin-left:12px;">
        <button onclick="editWalkName('${w.id}')" style="background:none; border:none; font-size:0.75rem; color:var(--color-text-muted); cursor:pointer; padding:4px;">수정</button>
        <button onclick="deleteWalkRecord('${w.id}')" style="background:none; border:none; font-size:0.75rem; color:#e53e3e; cursor:pointer; padding:4px;">삭제</button>
      </div>
      ${hasRoute ? `<div id="walk-route-${w.id}" style="width:100%; margin-top:10px; height:160px; border-radius:10px; overflow:hidden; border:1px solid var(--color-border);"></div>` : ''}
    </div>
  `;
  }).join('') : `<div style="text-align:center; padding:16px; color:var(--color-text-muted); font-size:0.82rem;">${_walkCalSelectedDate ? _walkCalSelectedDate + '일에 기록이 없습니다' : '이 달에 기록이 없습니다'}</div>`;

  section.innerHTML = `
    <style>
      .walk-cal { margin-bottom:24px; }
      .walk-cal__header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
      .walk-cal__nav { display:flex; align-items:center; gap:12px; }
      .walk-cal__nav-btn { background:none; border:1px solid var(--color-border); border-radius:6px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-size:0.8rem; cursor:pointer; color:var(--color-text-light); transition:all 0.15s; }
      .walk-cal__nav-btn:hover { border-color:var(--color-text); color:var(--color-text); }
      .walk-cal__month { font-size:0.9rem; font-weight:700; min-width:100px; text-align:center; }
      .walk-cal__summary { font-size:0.75rem; color:var(--color-text-muted); }
      .walk-cal__days { display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; text-align:center; margin-bottom:4px; }
      .walk-cal__day-label { font-size:0.65rem; color:var(--color-text-muted); font-weight:600; padding:4px 0; }
      .walk-cal__grid { display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; }
      .walk-cal__cell { width:100%; aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:0.72rem; color:var(--color-text-muted); border-radius:8px; cursor:pointer; transition:all 0.15s; position:relative; }
      .walk-cal__cell:hover { background:var(--color-bg-section); }
      .walk-cal__cell--empty { cursor:default; }
      .walk-cal__cell--empty:hover { background:transparent; }
      .walk-cal__cell--today { font-weight:700; color:var(--color-text); border:1.5px solid var(--color-text); }
      .walk-cal__cell--active { background:var(--color-text); color:#fff; font-weight:700; }
      .walk-cal__cell--active:hover { opacity:0.85; }
      .walk-cal__cell--today.walk-cal__cell--active { border-color:var(--color-text); }
      .walk-cal__cell--selected { box-shadow:0 0 0 2px var(--color-text); }
      .walk-cal__count { position:absolute; top:2px; right:2px; font-size:0.5rem; background:#e53e3e; color:#fff; width:12px; height:12px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
      .walk-cal__filter { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
      .walk-cal__filter-label { font-size:0.78rem; color:var(--color-text-light); font-weight:600; }
      .walk-cal__filter-clear { font-size:0.72rem; color:var(--color-text-muted); background:none; border:none; cursor:pointer; text-decoration:underline; }
    </style>

    <div class="walk-cal">
      <div class="walk-cal__header">
        <div class="walk-cal__nav">
          <button class="walk-cal__nav-btn" onclick="changeWalkCalMonth(-1)">&lt;</button>
          <div class="walk-cal__month">${monthLabel}</div>
          <button class="walk-cal__nav-btn" onclick="changeWalkCalMonth(1)">&gt;</button>
        </div>
        <div class="walk-cal__summary">${monthWalks.length}회 · ${monthDist.toFixed(1)}km · ${monthTime}분</div>
      </div>
      <div class="walk-cal__days">
        <div class="walk-cal__day-label">일</div><div class="walk-cal__day-label">월</div><div class="walk-cal__day-label">화</div><div class="walk-cal__day-label">수</div><div class="walk-cal__day-label">목</div><div class="walk-cal__day-label">금</div><div class="walk-cal__day-label">토</div>
      </div>
      <div class="walk-cal__grid">${calCells}</div>
    </div>

    ${_walkCalSelectedDate ? `
      <div class="walk-cal__filter">
        <span class="walk-cal__filter-label">${month + 1}월 ${_walkCalSelectedDate}일 기록</span>
        <button class="walk-cal__filter-clear" onclick="selectWalkCalDate(null)">전체 보기</button>
      </div>
    ` : ''}

    <div class="walk-history__title">${_walkCalSelectedDate ? '' : '최근 기록'}</div>
    ${listHtml}
  `;

  // 경로가 있는 기록마다 Leaflet 미니맵 자동 초기화
  setTimeout(() => {
    listWalks.forEach(w => {
      if (w.coordinates && w.coordinates.length > 1) {
        const container = document.getElementById('walk-route-' + w.id);
        if (container && !_walkRouteMaps[w.id]) {
          const coords = w.coordinates.map(c => [c.lat, c.lng]);
          const map = L.map(container, { zoomControl: false, attributionControl: false }).fitBounds(coords, { padding: [20, 20] });
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.polyline(coords, { color: '#F59E0B', weight: 4, opacity: 0.9 }).addTo(map);
          const startIcon = L.divIcon({ className: '', html: '<div style="width:10px;height:10px;background:#22C55E;border:2px solid #fff;border-radius:50%;"></div>', iconSize: [10, 10], iconAnchor: [5, 5] });
          const endIcon   = L.divIcon({ className: '', html: '<div style="width:10px;height:10px;background:#EF4444;border:2px solid #fff;border-radius:50%;"></div>', iconSize: [10, 10], iconAnchor: [5, 5] });
          L.marker(coords[0], { icon: startIcon }).addTo(map);
          L.marker(coords[coords.length - 1], { icon: endIcon }).addTo(map);
          _walkRouteMaps[w.id] = map;
        }
      }
    });
  }, 200);
}

function changeWalkCalMonth(delta) {
  _walkCalMonth += delta;
  if (_walkCalMonth > 11) { _walkCalMonth = 0; _walkCalYear++; }
  if (_walkCalMonth < 0) { _walkCalMonth = 11; _walkCalYear--; }
  _walkCalSelectedDate = null;
  renderWalkCalendar();
}

function selectWalkCalDate(day) {
  if (_walkCalSelectedDate === day || day === null) {
    _walkCalSelectedDate = null;
  } else {
    _walkCalSelectedDate = day;
  }
  renderWalkCalendar();
}

async function deleteWalkRecord(walkId) {
  if (!confirm('이 산책 기록을 삭제할까요?')) return;
  try {
    await fetch('/api/walks/' + walkId, { method: 'DELETE' });
    const item = document.getElementById('walk-item-' + walkId);
    if (item) { item.style.opacity = '0'; item.style.transition = 'opacity 0.3s'; setTimeout(() => item.remove(), 300); }
  } catch(e) { alert('삭제에 실패했습니다.'); }
}

function editWalkName(walkId) {
  const nameEl = document.getElementById('walk-name-' + walkId);
  if (!nameEl) return;
  const current = nameEl.textContent;
  nameEl.innerHTML = `<div style="display:flex;gap:4px;align-items:center;"><input type="text" id="walk-edit-${walkId}" value="${current}" style="font-size:0.78rem;padding:3px 8px;border:1px solid var(--color-border);border-radius:6px;width:100px;" onkeydown="if(event.key==='Enter')saveWalkName('${walkId}')"><button onclick="saveWalkName('${walkId}')" style="font-size:0.7rem;background:var(--color-text);color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;">저장</button></div>`;
  document.getElementById('walk-edit-' + walkId)?.focus();
}

async function saveWalkName(walkId) {
  const input = document.getElementById('walk-edit-' + walkId);
  if (!input) return;
  const newName = input.value.trim();
  if (!newName) return;
  try {
    await fetch('/api/walks/' + walkId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newName, dogName: newName })
    });
    const nameEl = document.getElementById('walk-name-' + walkId);
    if (nameEl) nameEl.textContent = newName;
  } catch(e) { alert('수정에 실패했습니다.'); }
}

