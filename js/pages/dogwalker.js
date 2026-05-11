// Pawsitive - Dog Walker Page
function escapeQ(str) { return String(str || '').replace(/'/g, "\\'"); }
const DW_EXP_LABEL  = { '없음': '경력 없음', '1년 미만': '1년 미만', '1-3년': '1~3년', '3년 이상': '3년 이상' };

/** 도그워커 카드 HTML 생성 */
function _dwWalkerCard(w, user) {
  const isMine = user && w.userId === user.id;
  const stars   = '★'.repeat(Math.round(w.rating || 5)) + '☆'.repeat(5 - Math.round(w.rating || 5));
  const distTxt = w.distance != null ? `<span class="dw-distance">${w.distance < 1 ? (w.distance * 1000).toFixed(0) + 'm' : w.distance.toFixed(1) + 'km'}</span>` : '';
  const availDot = w.isAvailable ? '<span class="dw-avail-dot dw-avail-dot--on"></span>' : '<span class="dw-avail-dot dw-avail-dot--off"></span>';
  return `
    <div class="dw-card${isMine ? ' dw-card--mine' : ''}${!w.isAvailable ? ' dw-card--offline' : ''}" data-walker-id="${w.userId}">
      <div class="dw-card__avatar">${w.userName.charAt(0)}</div>
      <div class="dw-card__body">
        <div class="dw-card__top">
          <div>
            <div class="dw-card__name">
              ${availDot}${w.userName}${isMine ? ' <span class="dw-mine-badge">나</span>' : ''}
              ${distTxt}
            </div>
            <div class="dw-card__rating"><span class="dw-stars">${stars}</span> ${(w.rating || 5).toFixed(1)} · 리뷰 ${w.reviewCount || 0}건</div>
          </div>
          ${w.price ? `<div class="dw-card__price">₩${Number(w.price).toLocaleString()}<span>/시간</span></div>` : ''}
        </div>
        <div class="dw-card__meta">📍 ${w.location} · ⏰ ${w.preferredTime}</div>
        <div class="dw-card__sizes">${(w.acceptedSizes || []).map(s => `<span class="dw-size-tag">${DW_SIZE_LABEL[s] || s}</span>`).join('')}</div>
        ${w.experience && w.experience !== '없음' ? `<div class="dw-card__exp">경력 ${DW_EXP_LABEL[w.experience] || w.experience}</div>` : ''}
        ${w.message ? `<div class="dw-card__bio">"${w.message}"</div>` : ''}
        ${w.specialty ? `<div class="dw-card__specialty">✔ ${w.specialty}</div>` : ''}
      </div>
      <div class="dw-card__action">
        ${!isMine && user && w.isAvailable ? `<button class="btn btn-primary btn-sm" onclick="handleDWSendRequest('${w.userId}')">매칭 요청</button>` : ''}
        ${!isMine && user && !w.isAvailable ? `<span class="dw-offline-badge">매칭 중단</span>` : ''}
        ${!user ? `<button class="btn btn-secondary btn-sm" onclick="Router.navigate('/login')">로그인 후 요청</button>` : ''}
      </div>
    </div>`;
}

async function renderDogWalkerPage() {
  const user = AuthService.getCurrentUser();
  if (!user) {
    // 비로그인: 실제 UI를 보여주되 데이터는 서버에서 가져옴
    let walkers = [];
    try {
      const res = await fetch('/api/walkers');
      if (res.ok) walkers = await res.json();
    } catch(e) {}
    const availCount = Array.isArray(walkers) ? walkers.filter(w => w.isAvailable).length : 0;
    renderPage(`
      <div class="page-header">
        <h1>🦮 도그워커 찾기</h1>
        <p>내 주변의 도그워커를 찾아보세요~ 🐕</p>
      </div>
      <div class="card" style="padding:20px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-weight:700;">현재 활동 중인 도그워커</span>
            <span class="badge badge-success" style="margin-left:8px;">${availCount}명</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="showLoginModal('도그워커 등록은 로그인 후 이용할 수 있어요!')">🐕 도그워커 등록</button>
        </div>
      </div>
      <div id="dw-disc-map" style="height:300px; border-radius:12px; margin-bottom:16px; background:#e8e8e8; display:flex; align-items:center; justify-content:center; color:#999;">
        🗺️ 지도를 보려면 로그인해주세요
      </div>
      <div class="card" style="padding:20px;">
        <h3 style="margin-bottom:12px;">📋 도그워커 목록</h3>
        ${Array.isArray(walkers) && walkers.length > 0 ? walkers.slice(0, 5).map(w => `
          <div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--color-border);">
            <div class="dw-avatar" style="width:40px;height:40px;border-radius:50%;background:var(--color-primary,#7C4DFF);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${(w.name || '?').charAt(0)}</div>
            <div style="flex:1;">
              <div style="font-weight:700;">${w.name || '도그워커'}</div>
              <div style="font-size:0.82rem; color:var(--color-text-muted);">📍 ${w.location || '위치 미등록'}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="showLoginModal('산책 요청은 로그인 후 이용할 수 있어요!')">요청하기</button>
          </div>
        `).join('') : '<p style="text-align:center; color:var(--color-text-muted); padding:20px;">등록된 도그워커가 없습니다.</p>'}
      </div>
    `);
    return;
  }
  await MatchingService.refreshFromServer();
  const walkers   = MatchingService.getAllWalkers();
  const myProfile = user ? (walkers.find(w => w.userId === user.id) || MatchingService.getMyProfile(user.id)) : null;
  const isWalker  = myProfile && myProfile.role === 'walker';

  // 가용 도그워커 수
  const availCount = walkers.filter(w => w.isAvailable).length;

  // 내 프로필 + 가용 토글 섹션
  const myProfileHtml = isWalker ? `
    <div class="dw-my-profile">
      <div class="dw-my-profile__badge">내 도그워커 프로필</div>
      <div class="dw-my-profile__row">
        <div class="dw-avatar">${user.name.charAt(0)}</div>
        <div class="dw-my-profile__info">
          <div class="dw-my-profile__name">${user.name}</div>
          <div class="dw-my-profile__meta">📍 ${myProfile.location} · ⏰ ${myProfile.preferredTime}${myProfile.lat ? ' · 📡 GPS 등록됨' : ''}</div>
          <div class="dw-my-profile__tags">
            ${(myProfile.acceptedSizes || []).map(s => `<span class="dw-size-tag">${DW_SIZE_LABEL[s] || s}</span>`).join('')}
            ${myProfile.price ? `<span class="dw-price-tag">₩${Number(myProfile.price).toLocaleString()}/시간</span>` : ''}
          </div>
        </div>
        <div class="dw-my-profile__controls">
          <label class="dw-toggle" title="${myProfile.isAvailable ? '매칭 끄기' : '매칭 켜기'}">
            <input type="checkbox" id="dw-avail-cb" ${myProfile.isAvailable ? 'checked' : ''} onchange="handleToggleAvailability()">
            <span class="dw-toggle__track"></span>
          </label>
          <div class="dw-toggle__status" id="dw-avail-status">${myProfile.isAvailable ? '🟢 매칭 ON' : '⭕ 매칭 OFF'}</div>
          <button class="btn btn-secondary btn-sm" onclick="handleRemoveDogWalker()" style="margin-top:8px;">등록 해제</button>
        </div>
      </div>
    </div>
  ` : '';

  // 탐색 지도 섹션
  const discMapHtml = `
    <div class="dw-section">
      <div class="dw-section__header">
        <h2 class="dw-section__title">📍 내 근처 도그워커 지도</h2>
        <div class="dw-map-controls">
          <button class="btn btn-secondary btn-sm" id="dw-gps-btn" onclick="loadDWDiscovery()">📡 내 위치로 찾기</button>
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
        <div class="dw-map-hint" id="dw-map-hint">📡 "내 위치로 찾기"를 눌러 GPS로 근처 도그워커를 확인하세요</div>
      </div>
    </div>
  `;

  // 워커 목록
  const walkerListHtml = walkers.length > 0
    ? walkers.map(w => _dwWalkerCard(w, user)).join('')
    : `<div class="empty-state"><div class="empty-icon">🦮</div><p>아직 등록된 도그워커가 없어요.<br>첫 번째 도그워커가 되어보세요!</p></div>`;

  // 등록 폼 섹션
  const registerHtml = isWalker ? '' : `
    <div class="dw-register-section">
      <h2 class="dw-register-section__title">🦮 도그워커 등록하기</h2>
      <p class="dw-register-section__sub">정보를 입력하고 GPS로 내 위치를 등록하면 근처 고객과 바로 매칭돼요.</p>
      ${!user ? `
        <div class="dw-login-prompt">
          <p>도그워커로 등록하려면 먼저 로그인이 필요해요.</p>
          <button class="btn btn-primary" onclick="Router.navigate('/login')">로그인하기</button>
        </div>
      ` : `
        <div id="dw-register-error"></div>
        <div class="dw-form-grid">
          <div class="form-group">
            <label for="dw-location">활동 지역명 <span class="dw-required">*</span></label>
            <input type="text" id="dw-location" class="form-input" placeholder="예: 서울 마포구 합정동">
          </div>
          <div class="form-group">
            <label for="dw-time">가능 시간대 <span class="dw-required">*</span></label>
            <select id="dw-time" class="form-select">
              <option value="">선택해주세요</option>
              <option value="오전 (7-9시)">오전 (7~9시)</option>
              <option value="오전 (9-11시)">오전 (9~11시)</option>
              <option value="오후 (2-4시)">오후 (2~4시)</option>
              <option value="오후 (5-7시)">오후 (5~7시)</option>
              <option value="저녁 (7-9시)">저녁 (7~9시)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="dw-price">시간당 요금 (원) <span class="dw-required">*</span></label>
            <input type="number" id="dw-price" class="form-input" placeholder="예: 15000" min="0" step="1000">
          </div>
          <div class="form-group">
            <label for="dw-experience">반려견 경력</label>
            <select id="dw-experience" class="form-select">
              <option value="없음">없음</option>
              <option value="1년 미만">1년 미만</option>
              <option value="1-3년">1~3년</option>
              <option value="3년 이상">3년 이상</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>가능한 견종 크기 <span class="dw-required">*</span></label>
          <div class="dw-size-checks">
            <label class="dw-check-label"><input type="checkbox" value="small" class="dw-size-cb" checked> 소형견 (~10kg)</label>
            <label class="dw-check-label"><input type="checkbox" value="medium" class="dw-size-cb" checked> 중형견 (10~25kg)</label>
            <label class="dw-check-label"><input type="checkbox" value="large" class="dw-size-cb"> 대형견 (25kg~)</label>
          </div>
        </div>
        <div class="form-group">
          <label for="dw-specialty">특기/자격 (선택)</label>
          <input type="text" id="dw-specialty" class="form-input" placeholder="예: 반려견 행동교정 수료, 응급처치 자격증">
        </div>
        <div class="form-group">
          <label for="dw-message">자기소개 <span class="dw-required">*</span></label>
          <textarea id="dw-message" class="form-input" rows="3" placeholder="경험, 성격, 산책 스타일 등을 자유롭게 적어주세요."></textarea>
        </div>

        <!-- GPS 위치 등록 -->
        <div class="dw-gps-section">
          <div class="dw-gps-section__header">
            <div>
              <div class="dw-gps-section__title">📍 내 활동 위치 GPS 등록</div>
              <div class="dw-gps-section__sub">마커를 드래그해서 정확한 위치를 설정하세요 (선택, 하지만 매칭에 중요!)</div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="initDWRegMap()">📡 내 위치 감지</button>
          </div>
          <div class="dw-map-wrap" id="dw-reg-map-wrap" style="display:none;">
            <div id="dw-reg-map" class="dw-map"></div>
          </div>
          <input type="hidden" id="dw-lat" value="">
          <input type="hidden" id="dw-lng" value="">
          <div id="dw-gps-status" class="dw-gps-status"></div>
        </div>

        <button class="btn btn-primary dw-submit-btn" onclick="handleDogWalkerRegister()">🦮 도그워커 등록 완료</button>
      `}
    </div>
  `;

  renderPage(`
    <div class="dw-hero">
      <div class="dw-hero__content">
        <div class="section-label">Dog Walker</div>
        <h1 class="dw-hero__title">믿을 수 있는 도그워커를<br>찾거나, 직접 되어보세요</h1>
        <p class="dw-hero__sub">GPS 기반으로 내 근처 도그워커를 실시간 확인!</p>
        <div class="dw-hero__stats">
          <div class="dw-stat"><strong>${walkers.length}</strong>명 등록</div>
          <div class="dw-stat-divider">·</div>
          <div class="dw-stat"><strong>${availCount}</strong>명 지금 매칭 가능</div>
          <div class="dw-stat-divider">·</div>
          <div class="dw-stat">GPS 실시간 매칭</div>
        </div>
      </div>
    </div>

    ${myProfileHtml}

    <!-- AI 추천 배너 -->
    <div class="dw-ai-banner">
      <div class="dw-ai-banner__left">
        <div class="dw-ai-banner__icon">✨</div>
        <div>
          <div class="dw-ai-banner__title">AI가 우리 강아지에게 딱 맞는 도그워커를 추천해줘요</div>
          <div class="dw-ai-banner__sub">품종·크기·성격을 분석한 궁합 기반 매칭, 단순 거리순이 아닌 진짜 추천</div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="handleAIRecommend()">AI 추천 받기</button>
    </div>
    <div id="dw-ai-result"></div>

    ${discMapHtml}

    <div class="dw-section">
      <h2 class="dw-section__title">전체 도그워커 <span class="dw-count">${walkers.length}</span></h2>
      <div class="dw-list" id="dw-walker-list">${walkerListHtml}</div>
    </div>

    ${registerHtml}
  `);
}

/** 탐색 지도 로드 (GPS 기반) */
function loadDWDiscovery() {
  const btn = document.getElementById('dw-gps-btn');
  if (btn) { btn.textContent = '📡 위치 감지 중...'; btn.disabled = true; }
  const hint = document.getElementById('dw-map-hint');

  if (!navigator.geolocation) {
    if (hint) hint.textContent = '⚠️ 이 브라우저는 GPS를 지원하지 않아요.';
    if (btn) { btn.textContent = '📡 내 위치로 찾기'; btn.disabled = false; }
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      _dwUserLat = pos.coords.latitude;
      _dwUserLng = pos.coords.longitude;
      if (btn) { btn.textContent = '📡 내 위치로 찾기'; btn.disabled = false; }
      if (hint) hint.style.display = 'none';
      const radius = Number(document.getElementById('dw-radius-sel')?.value || 5);
      _renderDiscMap(_dwUserLat, _dwUserLng, radius);
    },
    err => {
      if (hint) hint.textContent = '⚠️ 위치 권한이 거부됐어요. 브라우저 주소창의 자물쇠 아이콘에서 허용해주세요.';
      if (btn) { btn.textContent = '📡 내 위치로 찾기'; btn.disabled = false; }
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
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
  }).addTo(_dwDiscMap);

  // 내 위치 마커
  const userIcon = L.divIcon({ html: '<div class="dw-map-me"></div>', className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
  L.marker([userLat, userLng], { icon: userIcon }).bindPopup('<b>내 위치</b>').addTo(_dwDiscMap);

  // 반경 원
  L.circle([userLat, userLng], { radius: radiusKm * 1000, color: '#00AA76', fillColor: '#00AA76', fillOpacity: 0.05, weight: 1.5 }).addTo(_dwDiscMap);

  // 도그워커 마커 (ON 상태인 것만 지도에 표시)
  const nearbyWalkers = MatchingService.getNearbyWalkers(userLat, userLng, radiusKm);
  const allWalkers    = MatchingService.getAllWalkers().filter(w => w.lat && w.lng && w.isAvailable);

  const currentUser = AuthService.getCurrentUser();

  allWalkers.forEach(w => {
    const distObj = nearbyWalkers.find(n => n.userId === w.userId);
    const distTxt = distObj
      ? (distObj.distance < 1 ? `${(distObj.distance * 1000).toFixed(0)}m` : `${distObj.distance.toFixed(1)}km`)
      : '';

    const icon = L.divIcon({
      html: `<div class="dw-map-walker dw-map-walker--on">🦮</div>`,
      className: '', iconSize: [38, 38], iconAnchor: [19, 19]
    });

    const stars = '★'.repeat(Math.round(w.rating || 5)) + '☆'.repeat(5 - Math.round(w.rating || 5));
    const isMine = currentUser && w.userId === currentUser.id;
    const canRequest = currentUser && !isMine;

    const popupHtml = `
      <div class="walker-card-popup">
        <div class="wcp-header">
          <div class="wcp-avatar">${(w.profileImage
            ? `<img src="${w.profileImage}" alt="${w.userName}">`
            : `<span>${w.userName.charAt(0)}</span>`)}</div>
          <div class="wcp-info">
            <div class="wcp-name">${w.userName} <span class="wcp-online">● ON</span></div>
            <div class="wcp-rating">${stars} <b>${(w.rating || 5).toFixed(1)}</b> · 리뷰 ${w.reviewCount || 0}건</div>
            ${distTxt ? `<div class="wcp-dist">📍 ${distTxt} 거리</div>` : ''}
          </div>
        </div>
        <div class="wcp-body">
          ${w.message ? `<div class="wcp-bio">"${w.message}"</div>` : ''}
          <div class="wcp-meta">
            <span>⏰ ${w.preferredTime || '-'}</span>
            ${w.price ? `<span>₩${Number(w.price).toLocaleString()}/시간</span>` : ''}
          </div>
          <div class="wcp-sizes">${(w.acceptedSizes || []).map(s => `<span>${DW_SIZE_LABEL[s] || s}</span>`).join('')}</div>
          ${w.experience && w.experience !== '없음' ? `<div class="wcp-exp">경력 ${w.experience}</div>` : ''}
        </div>
        ${canRequest ? `
          <div class="wcp-action">
            <button class="btn btn-primary btn-sm" style="width:100%;"
              onclick="openWalkRequestModal('${w.userId}','${escapeQ(w.userName)}')">
              🐕 산책 요청하기
            </button>
          </div>` : ''}
        ${isMine ? `<div class="wcp-mine-note">내 프로필입니다</div>` : ''}
        ${!currentUser ? `
          <div class="wcp-action">
            <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="Router.navigate('/login')">로그인 후 요청</button>
          </div>` : ''}
      </div>`;

    L.marker([w.lat, w.lng], { icon })
      .bindPopup(popupHtml, { maxWidth: 280, className: 'walker-popup' })
      .addTo(_dwDiscMap);
  });

  // 목록을 거리순으로 업데이트
  const listEl = document.getElementById('dw-walker-list');
  const user = AuthService.getCurrentUser();
  if (listEl) {
    if (nearbyWalkers.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>반경 ${radiusKm}km 내 도그워커가 없어요.<br>반경을 늘려보세요!</p></div>`;
    } else {
      listEl.innerHTML = nearbyWalkers.map(w => _dwWalkerCard(w, user)).join('');
    }
    // 섹션 제목 업데이트
    const titleEl = document.querySelector('.dw-section__title');
    if (titleEl) titleEl.innerHTML = `반경 ${radiusKm}km 내 도그워커 <span class="dw-count">${nearbyWalkers.length}</span>`;
  }
}

/** 등록 지도 초기화 (GPS 감지 후 마커 표시) */
function initDWRegMap() {
  const statusEl = document.getElementById('dw-gps-status');
  if (statusEl) statusEl.innerHTML = '<span style="color:#718096;font-size:0.85rem;">📡 위치 감지 중...</span>';

  if (!navigator.geolocation) {
    if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E;font-size:0.85rem;">⚠️ GPS를 지원하지 않는 브라우저예요.</span>';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      document.getElementById('dw-lat').value = lat;
      document.getElementById('dw-lng').value = lng;

      const wrap = document.getElementById('dw-reg-map-wrap');
      if (wrap) wrap.style.display = 'block';

      if (_dwRegMap) { try { _dwRegMap.remove(); } catch(e) {} _dwRegMap = null; }
      _dwRegMap = L.map('dw-reg-map').setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }).addTo(_dwRegMap);

      _dwRegMarker = L.marker([lat, lng], { draggable: true }).addTo(_dwRegMap);
      _dwRegMarker.bindPopup('📍 활동 위치입니다.<br>드래그해서 조정하세요.').openPopup();

      _dwRegMarker.on('dragend', e => {
        const p = e.target.getLatLng();
        document.getElementById('dw-lat').value = p.lat;
        document.getElementById('dw-lng').value = p.lng;
        if (statusEl) statusEl.innerHTML = `<span style="color:#00AA76;font-size:0.85rem;">✅ 위치 설정됨 (${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})</span>`;
      });

      if (statusEl) statusEl.innerHTML = `<span style="color:#00AA76;font-size:0.85rem;">✅ GPS 감지 완료! 마커를 드래그해 조정할 수 있어요.</span>`;

      // 지역명 자동 채우기 (Nominatim 역지오코딩)
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`)
        .then(r => r.json())
        .then(data => {
          const addr = data.address;
          const locStr = [addr.city || addr.county, addr.suburb || addr.neighbourhood || addr.quarter].filter(Boolean).join(' ');
          const locInput = document.getElementById('dw-location');
          if (locInput && !locInput.value) locInput.value = locStr;
        })
        .catch(() => {});
    },
    err => {
      if (statusEl) statusEl.innerHTML = '<span style="color:#E53E3E;font-size:0.85rem;">⚠️ 위치 권한을 허용해주세요.</span>';
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

/** 도그워커 등록 처리 */
async function handleDogWalkerRegister() {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  const location     = document.getElementById('dw-location')?.value?.trim();
  const preferredTime = document.getElementById('dw-time')?.value;
  const price        = document.getElementById('dw-price')?.value;
  const experience   = document.getElementById('dw-experience')?.value;
  const specialty    = document.getElementById('dw-specialty')?.value?.trim();
  const message      = document.getElementById('dw-message')?.value?.trim();
  const lat          = parseFloat(document.getElementById('dw-lat')?.value) || null;
  const lng          = parseFloat(document.getElementById('dw-lng')?.value) || null;
  const errEl        = document.getElementById('dw-register-error');
  const checkedSizes = [...document.querySelectorAll('.dw-size-cb:checked')].map(cb => cb.value);

  if (!location)            { errEl.innerHTML = '<div class="alert alert-error">활동 지역명을 입력해주세요.</div>'; return; }
  if (!preferredTime)       { errEl.innerHTML = '<div class="alert alert-error">가능 시간대를 선택해주세요.</div>'; return; }
  if (!price || Number(price) <= 0) { errEl.innerHTML = '<div class="alert alert-error">시간당 요금을 입력해주세요.</div>'; return; }
  if (checkedSizes.length === 0)    { errEl.innerHTML = '<div class="alert alert-error">가능한 견종 크기를 하나 이상 선택해주세요.</div>'; return; }
  if (!message)             { errEl.innerHTML = '<div class="alert alert-error">자기소개를 입력해주세요.</div>'; return; }

  const btn = document.querySelector('.dw-submit-btn');
  if (btn) { btn.textContent = '등록 중...'; btn.disabled = true; }

  try {
    await MatchingService.registerProfileRemote(user.id, {
      role: 'walker', location, lat, lng,
      preferredTime, price: Number(price),
      experience: experience || '없음',
      acceptedSizes: checkedSizes,
      specialty, message
    });
    renderDogWalkerPage();
  } catch(e) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">등록 중 오류가 발생했습니다. 다시 시도해주세요.</div>';
    if (btn) { btn.textContent = '🦮 도그워커 등록 완료'; btn.disabled = false; }
  }
}

/** 가용 상태 토글 (GPS 권한 필수) */
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

    if (statusEl) statusEl.textContent = '📡 위치 감지 중...';

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

          if (statusEl) statusEl.textContent = '🟢 매칭 ON';
          await MatchingService.refreshFromServer();

          // GPS 위치 주기 업데이트 시작
          RealtimeService.startGpsUpdates(user.id);
        } catch(e) {
          if (statusEl) statusEl.textContent = '⭕ 매칭 OFF';
          if (cb) cb.checked = false;
          alert(e.message || 'ON 전환에 실패했습니다.');
        }
      },
      (err) => {
        if (statusEl) statusEl.textContent = '⭕ 매칭 OFF';
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
      if (statusEl) statusEl.textContent = '⭕ 매칭 OFF';
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
  const user    = AuthService.getCurrentUser();
  const resultEl = document.getElementById('dw-ai-result');

  if (!user) {
    if (resultEl) resultEl.innerHTML = `<div class="card" style="padding:20px; text-align:center; background:var(--color-bg-warm);">🔒 AI 추천을 이용하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a>이 필요해요!</div>`;
    return;
  }

  const dogs = user.dogs || [];
  if (dogs.length === 0) {
    if (resultEl) resultEl.innerHTML = `
      <div class="ai-rec-empty">
        🐕 반려견 정보가 없어요. <a href="#/profile">프로필에서 강아지를 먼저 등록</a>해주세요!
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
          <span class="ai-rec-title">✨ <strong>${dog.name}</strong> 맞춤 도그워커 AI 추천</span>
          <button class="btn btn-secondary btn-sm" onclick="handleAIRecommend()">다시 분석</button>
        </div>
        <div class="ai-rec-list">
          ${(data.recommendations || []).map((rec, i) => {
            const w = walkerMap[rec.walkerName];
            const scoreColor = rec.score >= 90 ? '#00AA76' : rec.score >= 75 ? '#D69E2E' : '#718096';
            return `
              <div class="ai-rec-card">
                <div class="ai-rec-rank">${medals[i] || '🏅'}</div>
                <div class="ai-rec-avatar">${rec.walkerName.charAt(0)}</div>
                <div class="ai-rec-body">
                  <div class="ai-rec-name">
                    ${rec.walkerName}
                    <span class="ai-rec-score" style="color:${scoreColor}">궁합 ${rec.score}점</span>
                  </div>
                  <div class="ai-rec-highlight">✨ ${rec.highlight}</div>
                  <div class="ai-rec-reason">${rec.matchReason}</div>
                  ${w ? `<div class="ai-rec-meta">📍 ${w.location} · ₩${Number(w.price || 0).toLocaleString()}/시간 · ⭐${(w.rating || 5).toFixed(1)}</div>` : ''}
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

let _aiHistory = [];  // 대화 히스토리 (페이지 이탈 전까지 유지)

function renderAIConsultPage() {
  _aiHistory = [];
  const user    = AuthService.getCurrentUser();
  if (!user) {
    renderPage(`
      <div class="page-header">
        <h1>🐕 AI 행동 상담</h1>
        <p>반려견 행동 전문 AI와 실시간 상담</p>
      </div>
      <div id="ai-chat" style="min-height:300px; max-height:500px; overflow-y:auto; margin-bottom:16px;">
        <div class="card" style="padding:20px; text-align:center; color:var(--color-text-light);">
          <div style="font-size:2.5rem; margin-bottom:8px;">🐕‍🦺</div>
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
  const dog     = user?.dogs?.[0] || null;

  const dogBadge = dog
    ? `<div class="ai-dog-badge">🐕 ${dog.name} (${dog.breed}) 기준으로 상담</div>`
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
          <div class="ai-avatar-lg">🤖</div>
          <div>
            <h1 class="ai-page-header__title">포피 AI 상담</h1>
            <p class="ai-page-header__sub">반려견 행동 · 훈련 · 산책 전문 AI</p>
          </div>
        </div>
        ${dogBadge}
      </div>

      <div class="ai-chat" id="ai-chat">
        <div class="ai-msg ai-msg--bot">
          <div class="ai-msg__avatar">🤖</div>
          <div class="ai-msg__bubble">
            안녕하세요! 반려견 전문 AI 포피예요 🐾<br>
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
  const input   = document.getElementById('ai-input');
  const chat    = document.getElementById('ai-chat');
  const sendBtn = document.getElementById('ai-send-btn');
  const quick   = document.getElementById('ai-quick');
  const text    = input?.value?.trim();
  if (!text || sendBtn?.disabled) return;

  input.value = '';
  if (quick) quick.style.display = 'none';
  sendBtn.disabled = true;
  sendBtn.textContent = '...';

  // 유저 메시지
  _aiHistory.push({ role: 'user', content: text });
  _appendAIMsg('user', text, chat);

  // 봇 응답 자리 (스트리밍으로 채워짐)
  const botId  = 'ai-bot-' + Date.now();
  _appendAIMsg('bot', '', chat, botId);
  const bubble = document.querySelector(`#${botId} .ai-msg__bubble`);
  if (bubble) bubble.innerHTML = '<span class="ai-typing">▍</span>';

  const user = AuthService.getCurrentUser();
  const dog  = user?.dogs?.[0] || null;

  try {
    const response = await fetch('/api/ai/pet-consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: _aiHistory, dogProfile: dog })
    });

    const reader  = response.body.getReader();
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
    ? `<div class="ai-msg__avatar">🤖</div><div class="ai-msg__bubble">${text}</div>`
    : `<div class="ai-msg__bubble">${text}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

/** 도그워커 등록 해제 */
function handleRemoveDogWalker() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  if (!confirm('도그워커 등록을 해제할까요?')) return;
  MatchingService.removeProfile(user.id);
  renderDogWalkerPage();
}

/** 도그워커 매칭 요청 (dog-walker 페이지용) */
function handleDWSendRequest(toUserId) {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }
  MatchingService.sendRequest(user.id, toUserId);
  // 버튼 피드백
  const btn = document.querySelector(`[data-walker-id="${toUserId}"] .btn-primary`);
  if (btn) { btn.textContent = '요청 완료 ✓'; btn.disabled = true; btn.style.opacity = '0.7'; }
}

