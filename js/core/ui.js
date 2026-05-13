// Pawsitive - UI Core
// Icons, navigation, page rendering, toast notifications

const ICONS={'home':'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>','map-pin':'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>','clock':'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>','paw-print':'<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>','message-circle':'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>','activity':'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>','book-open':'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>','users':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>','wallet':'<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>','graduation-cap':'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>','search':'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>','bot':'<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>','handshake':'<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>','map':'<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>','bell':'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>','route':'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>','star':'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>','calendar':'<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>','check-circle':'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>','user':'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>','flag':'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>','navigation':'<polygon points="3 11 22 2 13 21 11 13 3 11"/>','heart':'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>','image':'<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>','sparkles':'<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>'};
function icon(name,size,color){size=size||16;color=color||'currentColor';var p=ICONS[name]||ICONS['paw-print'];return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0;">'+p+'</svg>';}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const then = new Date(isoString).getTime();
  if (isNaN(then)) return '';
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 0) {
    // 미래 시각 (예: 예약)
    const future = Math.abs(diffSec);
    if (future < 60) return '곧 시작';
    if (future < 3600) return `${Math.round(future / 60)}분 후`;
    if (future < 86400) return `${Math.round(future / 3600)}시간 후`;
    return new Date(isoString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  }
  if (diffSec < 30) return '방금';
  if (diffSec < 60) return `${diffSec}초 전`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}시간 전`;
  if (diffSec < 604800) return `${Math.round(diffSec / 86400)}일 전`;
  return new Date(isoString).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function renderNavbar() {
 const navbar = document.getElementById('navbar');
 if (!navbar) return;

 navbar.innerHTML = `
 <button class="navbar__hamburger" onclick="openNavDrawer()" aria-label="메뉴">
 <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
 <line x1="3" y1="5" x2="17" y2="5"/>
 <line x1="3" y1="10" x2="17" y2="10"/>
 <line x1="3" y1="15" x2="17" y2="15"/>
 </svg>
 </button>
 <div class="navbar__brand" onclick="Router.navigate('/')"><img src="/pawsitive_logo_transparent.png" alt="Pawsitive" class="navbar__logo"></div>
 <div class="navbar__auth" id="nav-auth"></div>
 `;

 // 드로어 + 오버레이 초기화
 document.getElementById('nav-drawer-overlay')?.remove();
 document.getElementById('nav-drawer')?.remove();

 const overlay = document.createElement('div');
 overlay.id = 'nav-drawer-overlay';
 overlay.className = 'nav-drawer-overlay';
 overlay.onclick = closeNavDrawer;
 document.body.appendChild(overlay);

 const drawer = document.createElement('div');
 drawer.id = 'nav-drawer';
 drawer.className = 'nav-drawer';
 document.body.appendChild(drawer);

 refreshDrawer();
 updateNavAuth();
}

/** 드로어 HTML을 역할에 맞게 재빌드 */
function refreshDrawer() {
 const drawer = document.getElementById('nav-drawer');
 if (!drawer) return;

 const user = AuthService.getCurrentUser();
 const profiles = StorageService.get('matchProfiles', []);
 const myProfile = user ? profiles.find(p => p.userId === user.id) : null;
 const role = myProfile?.role; // 'walker' | 'requester' | undefined

 const cur = Router.getPath ? Router.getPath() : location.hash.replace('#', '') || '/';

 const item = (iconName, label, route) => `
 <button class="nav-drawer__item${cur === route ? ' active' : ''}" onclick="navTo('${route}')">
 <span class="nav-drawer__item-icon">${icon(iconName, 17)}</span>${label}
 </button>`;

 // 역할 배지
 const roleBadge = role === 'walker'
 ? `<div class="nav-drawer__role-badge nav-drawer__role-badge--walker">산책 도우미</div>`
 : role === 'requester'
 ? `<div class="nav-drawer__role-badge nav-drawer__role-badge--requester">산책 요청자</div>`
 : '';

 // 산책 섹션 (역할별)
 let walkSection;
 if (role === 'walker') {
 walkSection = `
 <div class="nav-drawer__section-label">산책 서비스</div>
 ${item('handshake', '산책 관리', '/matching')}
 ${item('route', 'GPS 산책 트래킹', '/walk-tracking')}`;
 } else if (role === 'requester') {
 walkSection = `
 <div class="nav-drawer__section-label">산책 서비스</div>
 ${item('handshake', '나의 산책', '/matching')}
 ${item('route', 'GPS 산책 트래킹', '/walk-tracking')}`;
 } else {
 walkSection = `
 <div class="nav-drawer__section-label">산책 서비스</div>
 ${item('handshake', '산책 매칭', '/matching')}
 ${item('route', 'GPS 산책 트래킹', '/walk-tracking')}`;
 }

 drawer.innerHTML = `
 <div class="nav-drawer__header">
 <button class="nav-drawer__close" onclick="closeNavDrawer()">
 <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
 <line x1="3" y1="3" x2="15" y2="15"/>
 <line x1="15" y1="3" x2="3" y2="15"/>
 </svg>
 </button>
 </div>
 ${roleBadge}
 ${item('home', '홈', '/')}
 <div class="nav-drawer__divider"></div>
 ${walkSection}
 <div class="nav-drawer__divider"></div>
 <div class="nav-drawer__section-label">전문가 케어</div>
 ${item('users', '전문가 매칭', '/experts')}
 <div class="nav-drawer__divider"></div>
 <div class="nav-drawer__section-label">AI 서비스</div>
 ${item('', 'AI 반려견 상담', '/ai')}
 ${item('activity', 'AI 건강 분석', '/health')}
 <div class="nav-drawer__divider"></div>
 <div class="nav-drawer__section-label">정보</div>
 ${item('paw-print', '품종 정보', '/breeds')}
 ${item('book-open', '교육 센터', '/education')}
 <div class="nav-drawer__divider"></div>
 ${item('users', '커뮤니티', '/community')}
 `;
}

function openNavDrawer() {
 refreshDrawer();
 document.getElementById('nav-drawer')?.classList.add('open');
 document.getElementById('nav-drawer-overlay')?.classList.add('open');
 document.body.style.overflow = 'hidden';
}

function closeNavDrawer() {
 document.getElementById('nav-drawer')?.classList.remove('open');
 document.getElementById('nav-drawer-overlay')?.classList.remove('open');
 document.body.style.overflow = '';
}

function openServicePanel() {
 document.getElementById('service-panel')?.classList.add('open');
 document.getElementById('service-panel-overlay')?.classList.add('open');
 document.body.style.overflow = 'hidden';
}

function closeServicePanel() {
 document.getElementById('service-panel')?.classList.remove('open');
 document.getElementById('service-panel-overlay')?.classList.remove('open');
 document.body.style.overflow = '';
}

function navTo(route) {
 closeNavDrawer();
 Router.navigate(route);
}

/**
 * 네비게이션 바 인증 상태 업데이트 (드로어도 함께 갱신)
 */
function updateNavAuth() {
 const navAuth = document.getElementById('nav-auth');
 if (navAuth) {
 const user = AuthService.getCurrentUser();
 const profileIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
 if (user) {
 const isAdmin = user.isAdmin === true;
 const bellIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`;
 navAuth.innerHTML = `
 ${isAdmin ? `<button class="nav-icon-btn" onclick="Router.navigate('/admin')" title="관리자"><span class="nav-admin-badge">관리자</span></button>` : ''}
 <button class="nav-icon-btn nav-bell-btn" onclick="toggleNotificationPanel()" title="알림" style="position:relative;">${bellIcon}<span id="nav-bell-badge" class="nav-bell-badge" style="display:none;"></span></button>
 <button class="nav-icon-btn" onclick="Router.navigate('/profile')" title="${user.nickname || user.name}님 · 프로필">${profileIcon}</button>
 `;
 } else {
 navAuth.innerHTML = `
 <button class="nav-icon-btn" onclick="Router.navigate('/login')" title="로그인">${profileIcon}</button>
 `;
 }
 }
 refreshDrawer();
}

let _dwRegMap = null; // 도그워커 등록용 지도
let _dwRegMarker = null; // 등록 지도 마커
let _dwDiscMap = null; // 탐색(discovery)용 지도
let _dwUserLat = null; // 현재 사용자 위도
let _dwUserLng = null; // 현재 사용자 경도

function _cleanupMaps() {
 if (_dwRegMap) { try { _dwRegMap.remove(); } catch(e) {} _dwRegMap = null; }
 if (_dwDiscMap) { try { _dwDiscMap.remove(); } catch(e) {} _dwDiscMap = null; }
 if (_walkRouteMap) { try { _walkRouteMap.remove(); } catch(e) {} _walkRouteMap = null; }
 _dwRegMarker = null;
 stopWalkRouteWatcher(); // 페이지 이동 시 walker-position 핸들러 정리
}

function showLoginModal(message) {
 // 이미 모달이 있으면 제거
 const existing = document.getElementById('login-modal-overlay');
 if (existing) existing.remove();

 const msg = message || '이 기능을 사용하려면 로그인이 필요해요!';

 const overlay = document.createElement('div');
 overlay.id = 'login-modal-overlay';
 overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;';
 overlay.innerHTML = `
 <div style="background:#fff;border-radius:20px;padding:32px 28px;max-width:380px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:modalSlideUp 0.3s ease;">
 <div style="font-size:3rem;margin-bottom:12px;"></div>
 <h3 style="margin:0 0 8px;font-size:1.15rem;">로그인이 필요해요!</h3>
 <p style="color:#666;font-size:0.9rem;line-height:1.6;margin-bottom:20px;">${msg}</p>
 <div style="display:flex;gap:10px;justify-content:center;">
 <button onclick="document.getElementById('login-modal-overlay').remove();Router.navigate('/login')" style="flex:1;padding:12px;border:none;border-radius:12px;background:var(--color-primary,#7C4DFF);color:#fff;font-weight:700;font-size:0.95rem;cursor:pointer;">로그인</button>
 <button onclick="document.getElementById('login-modal-overlay').remove();Router.navigate('/register')" style="flex:1;padding:12px;border:none;border-radius:12px;background:#f0f0f0;color:#333;font-weight:700;font-size:0.95rem;cursor:pointer;">회원가입</button>
 </div>
 <button onclick="document.getElementById('login-modal-overlay').remove()" style="margin-top:14px;background:none;border:none;color:#999;font-size:0.82rem;cursor:pointer;">나중에 할게요</button>
 </div>
 `;
 overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
 document.body.appendChild(overlay);
}

function renderPage(html) {
 _cleanupMaps();
 const app = document.getElementById('app');
 if (app) {
 app.innerHTML = `<div class="page-content">${html}</div>`;
 }
 window.scrollTo(0, 0);
}


function showToast(message, type = 'info') {
 const toast = document.createElement('div');
 const colors = { success: '#00AA76', error: '#E53E3E', info: '#3182CE' };
 toast.style.cssText = `
 position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
 z-index:10000; background:${colors[type] || colors.info}; color:#fff;
 padding:12px 24px; border-radius:10px; font-size:0.9rem; font-weight:600;
 box-shadow:0 4px 16px rgba(0,0,0,0.2); animation:slideInUp 0.3s ease;
 max-width:90vw; text-align:center;
 `;
 toast.textContent = message;
 document.body.appendChild(toast);
 setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; setTimeout(() => toast.remove(), 400); }, 3500);
}
