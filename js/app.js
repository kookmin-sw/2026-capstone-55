/**
 * Pawsitive - 반려견 산책 매칭 웹 애플리케이션
 * 메인 애플리케이션 로직, 라우팅, 네비게이션
 */

// ============================================================
// 데이터 모델 / 클래스 정의
// ============================================================

/**
 * 품종 모델
 * @typedef {Object} Breed
 * @property {string} id
 * @property {string} name
 * @property {'small'|'medium'|'large'} size
 * @property {string} personality
 * @property {'low'|'medium'|'high'} exerciseLevel
 * @property {string[]} cautions
 * @property {string} imageUrl
 */

/**
 * 교육 콘텐츠 모델
 * @typedef {Object} EducationContent
 * @property {string} id
 * @property {string} title
 * @property {'posture'|'leash'|'safety'} category
 * @property {string} body
 * @property {string[]} imageUrls
 */

/**
 * 진행률 정보
 * @typedef {Object} ProgressInfo
 * @property {number} total
 * @property {number} completed
 * @property {number} ratio
 * @property {string[]} completedIds
 */

/**
 * 게시물 모델
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} authorId
 * @property {string} authorName
 * @property {string} text
 * @property {string[]} imageUrls
 * @property {number} likes
 * @property {string[]} likedBy
 * @property {Comment[]} comments
 * @property {string} createdAt
 */

/**
 * 댓글 모델
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} authorId
 * @property {string} authorName
 * @property {string} text
 * @property {string} createdAt
 */

/**
 * 거래 모델
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} userId
 * @property {'earn'|'spend'} type
 * @property {number} amount
 * @property {string} reason
 * @property {string} createdAt
 * @property {number} balanceAfter
 */

/**
 * 매칭 프로필 모델
 * @typedef {Object} MatchProfile
 * @property {string} userId
 * @property {string} userName
 * @property {string} location
 * @property {'small'|'medium'|'large'} dogSize
 * @property {string} preferredTime
 * @property {number} rating
 */

/**
 * 매칭 요청 모델
 * @typedef {Object} MatchRequest
 * @property {string} id
 * @property {string} fromUserId
 * @property {string} toUserId
 * @property {'pending'|'accepted'|'rejected'} status
 * @property {string} createdAt
 */

/**
 * 산책 일정 모델
 * @typedef {Object} WalkSchedule
 * @property {string} id
 * @property {string} matchRequestId
 * @property {string[]} participants
 * @property {string} scheduledAt
 * @property {'scheduled'|'completed'|'cancelled'} status
 */

/**
 * 리뷰 모델
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} scheduleId
 * @property {string} reviewerId
 * @property {string} targetId
 * @property {number} rating
 * @property {string} text
 * @property {string} createdAt
 */

/**
 * 사용자 모델
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} passwordHash
 * @property {Dog[]} dogs
 * @property {number} pawCoins
 * @property {string} createdAt
 */

/**
 * 반려견 모델
 * @typedef {Object} Dog
 * @property {string} id
 * @property {string} name
 * @property {string} breed
 * @property {number} age
 * @property {'small'|'medium'|'large'} size
 */

/**
 * 인증 토큰 모델
 * @typedef {Object} AuthToken
 * @property {string} token
 * @property {string} userId
 * @property {string} expiresAt
 */

// ============================================================
// 서비스 인터페이스 정의 (JSDoc 기반)
// ============================================================

/**
 * @typedef {Object} BreedService
 * @property {function(): Breed[]} getAll
 * @property {function(string): Breed|null} getById
 * @property {function(string): Breed[]} search
 */

/**
 * @typedef {Object} EducationService
 * @property {function(string): EducationContent[]} getByCategory
 * @property {function(string): EducationContent|null} getById
 * @property {function(string, string): void} markComplete
 * @property {function(string): ProgressInfo} getProgress
 */

/**
 * @typedef {Object} CommunityService
 * @property {function(number): Post[]} getFeed
 * @property {function(Object): Post} createPost
 * @property {function(string, string): Post} toggleLike
 * @property {function(string, Object): Comment} addComment
 */

/**
 * @typedef {Object} WalletService
 * @property {function(string): number} getBalance
 * @property {function(string): Transaction[]} getTransactions
 * @property {function(string, number, string): Transaction} earnCoins
 * @property {function(string, number, string): Transaction|null} spendCoins
 */

/**
 * @typedef {Object} MatchingService
 * @property {function(string): MatchProfile[]} getRecommendations
 * @property {function(string, string): MatchRequest} sendRequest
 * @property {function(string): WalkSchedule} acceptRequest
 * @property {function(string): void} rejectRequest
 * @property {function(string): void} completeWalk
 * @property {function(string, Object): Review} addReview
 */

/**
 * @typedef {Object} AuthService
 * @property {function(Object): User} register
 * @property {function(string, string): AuthToken|null} login
 * @property {function(): User|null} getCurrentUser
 * @property {function(string, Object): User} updateProfile
 * @property {function(string, Object): Dog} registerDog
 */

// ============================================================
// 라우터
// ============================================================

const Router = (() => {
  const routes = {};
  let currentRoute = null;
  let notFoundHandler = null;

  /**
   * 라우트 등록
   * @param {string} path - 해시 경로 (예: '/', '/breeds', '/breeds/:id')
   * @param {function(Object): void} handler - 라우트 핸들러 (params 객체 전달)
   */
  function register(path, handler) {
    routes[path] = handler;
  }

  /**
   * 404 핸들러 등록
   * @param {function(): void} handler
   */
  function setNotFound(handler) {
    notFoundHandler = handler;
  }

  /**
   * 현재 해시에서 경로 추출
   * @returns {string}
   */
  function getPath() {
    const hash = window.location.hash || '#/';
    const fullPath = hash.substring(1) || '/';
    // 쿼리 파라미터 제거
    return fullPath.split('?')[0];
  }

  /**
   * 경로 매칭 (파라미터 포함)
   * @param {string} pattern - 라우트 패턴 (예: '/breeds/:id')
   * @param {string} path - 실제 경로
   * @returns {Object|null} 매칭된 파라미터 또는 null
   */
  function matchRoute(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].substring(1)] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  /**
   * 현재 경로에 맞는 핸들러 실행
   */
  function resolve() {
    const path = getPath();

    // 매칭 페이지 벗어나면 폴링 정지
    if (typeof stopWalkerPolling === 'function' && path !== '/matching') stopWalkerPolling();

    // 정확한 매칭 먼저 시도
    if (routes[path]) {
      currentRoute = path;
      routes[path]({});
      updateActiveNav();
      return;
    }

    // 파라미터 매칭 시도
    for (const pattern of Object.keys(routes)) {
      const params = matchRoute(pattern, path);
      if (params !== null) {
        currentRoute = pattern;
        routes[pattern](params);
        updateActiveNav();
        return;
      }
    }

    // 404
    if (notFoundHandler) {
      currentRoute = null;
      notFoundHandler();
    }
  }

  /**
   * 프로그래밍 방식으로 네비게이션
   * @param {string} path
   */
  function navigate(path) {
    window.location.hash = '#' + path;
  }

  /**
   * 네비게이션 바 활성 상태 업데이트
   */
  function updateActiveNav() {
    const path = getPath();
    document.querySelectorAll('.navbar__link').forEach(link => {
      const href = link.getAttribute('data-route');
      if (!href) return;
      const isActive = path === href || (href !== '/' && path.startsWith(href));
      link.classList.toggle('active', isActive);
    });
  }

  /**
   * 라우터 초기화
   */
  function init() {
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return {
    register,
    setNotFound,
    navigate,
    resolve,
    init,
    getPath
  };
})();

// ============================================================
// 네비게이션 바 렌더링
// ============================================================

function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const navItems = [
    { route: '/', icon: '🏠', label: '홈' },
    { route: '/breeds', icon: '🐕', label: '품종정보' },
    { route: '/education', icon: '📚', label: '교육' },
    { route: '/ai', icon: '🤖', label: 'AI상담' },
    { route: '/community', icon: '💬', label: '커뮤니티' },
    { route: '/wallet', icon: '🪙', label: '지갑' },
    { route: '/matching', icon: '🤝', label: '산책매칭' },
    { route: '/dog-walker', icon: '🦮', label: '도그워커' },
    { route: '/profile', icon: '👤', label: '프로필' }
  ];

  navbar.innerHTML = `
    <div class="navbar__brand" onclick="Router.navigate('/')">
      <svg class="brand-paw" viewBox="0 0 32 32" width="28" height="28" fill="currentColor">
        <ellipse cx="16" cy="22" rx="8" ry="7"/>
        <circle cx="8" cy="11" r="4"/>
        <circle cx="16" cy="7" r="3.5"/>
        <circle cx="24" cy="11" r="4"/>
      </svg>
      <span class="brand-text">Pawsitive</span>
    </div>
    <nav class="navbar__links">
      ${navItems.map(item => `
        <button class="navbar__link" data-route="${item.route}" onclick="Router.navigate('${item.route}')">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `).join('')}
    </nav>
    <div class="navbar__auth" id="nav-auth"></div>
  `;

  updateNavAuth();
}

/**
 * 네비게이션 바 인증 상태 업데이트
 */
function updateNavAuth() {
  const navAuth = document.getElementById('nav-auth');
  if (!navAuth) return;

  const user = AuthService.getCurrentUser();

  if (user) {
    const isAdmin = user.isAdmin === true;
    navAuth.innerHTML = `
      ${isAdmin ? '<button class="btn btn-sm" style="background:#FF6B6B; color:#fff; margin-right:4px;" onclick="Router.navigate(\'/admin\')">관리자</button>' : ''}
      <span style="font-size:0.85rem; font-weight:600; color:var(--color-text);">${user.nickname || user.name}님</span>
      <button class="btn btn-secondary btn-sm" onclick="handleLogout()">로그아웃</button>
    `;
  } else {
    navAuth.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="Router.navigate('/login')">로그인</button>
    `;
  }
}

// ============================================================
// 지도(Leaflet) 전역 상태
// ============================================================

let _dwRegMap = null;     // 도그워커 등록용 지도
let _dwRegMarker = null;  // 등록 지도 마커
let _dwDiscMap = null;    // 탐색(discovery)용 지도
let _dwUserLat = null;    // 현재 사용자 위도
let _dwUserLng = null;    // 현재 사용자 경도

function _cleanupMaps() {
  if (_dwRegMap) { try { _dwRegMap.remove(); } catch(e) {} _dwRegMap = null; }
  if (_dwDiscMap) { try { _dwDiscMap.remove(); } catch(e) {} _dwDiscMap = null; }
  _dwRegMarker = null;
}

// ============================================================
// 페이지 렌더러
// ============================================================

function renderPage(html) {
  _cleanupMaps();
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<div class="page-content">${html}</div>`;
  }
  window.scrollTo(0, 0);
}

// --- 홈 페이지 ---
function renderHomePage() {
  const user = AuthService.getCurrentUser();

  renderPage(`
    <style>
      .modern-home { min-height: 85vh; display:flex; flex-direction:column; justify-content:center; position:relative; }
      .modern-tagline { font-size:clamp(2.4rem, 6vw, 4.5rem); font-weight:700; letter-spacing:-2.5px; line-height:1.05; color:var(--color-text); max-width:650px; }
      .modern-sub { font-size:1rem; color:var(--color-text-muted); margin-top:24px; max-width:360px; line-height:1.7; font-weight:400; }
      .modern-footer { display:flex; justify-content:space-between; align-items:center; padding:24px 0; margin-top:60px; border-top:1px solid var(--color-border); }
      .modern-footer-item { font-size:0.72rem; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; }
      .modern-scroll-hint { font-size:0.72rem; color:var(--color-text-muted); letter-spacing:1px; margin-top:48px; text-transform:uppercase; animation: fadeInUp 1.5s ease; }
      @keyframes fadeInUp { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
      .modern-tagline span { display:inline-block; animation: wordReveal 0.8s ease both; }
      @keyframes wordReveal { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
    </style>

    <div class="modern-home">
      <div>
        ${user
          ? `<p style="font-size:0.82rem; color:var(--color-text-muted); margin-bottom:20px; font-weight:500;">Welcome back, ${user.nickname || user.name}</p>`
          : `<p style="font-size:0.82rem; color:var(--color-text-muted); margin-bottom:20px; font-weight:500;">Pawsitive —</p>`
        }
        <h1 class="modern-tagline">
          <span style="animation-delay:0.1s">반려견과</span><br>
          <span style="animation-delay:0.25s">함께하는</span><br>
          <span style="animation-delay:0.4s; color:var(--color-text-muted);">더 나은 일상.</span>
        </h1>
        <p class="modern-sub">
          AI 건강 상담부터 산책 매칭까지,<br>당신과 반려견을 위한 공간.
        </p>
        <div style="margin-top:36px;">
          ${!user
            ? `<button class="btn btn-primary" onclick="Router.navigate('/register')" style="padding:12px 32px; font-size:0.9rem;">시작하기 →</button>`
            : `<button class="btn btn-primary" onclick="Router.navigate('/dog-walker')" style="padding:12px 32px; font-size:0.9rem;">도그워커 찾기 →</button>`
          }
        </div>
        <p class="modern-scroll-hint">↓ scroll to explore</p>
      </div>

      <div class="modern-footer">
        <span class="modern-footer-item">© 2026 Pawsitive</span>
        <span class="modern-footer-item">Seoul, Korea</span>
      </div>
    </div>
  `);
}

// --- 품종 목록 페이지 ---
function renderBreedListPage() {
  renderPage(`
    <div class="page-header">
      <h1>🐕 품종 정보</h1>
      <p>우리 아이 품종의 특성과 주의사항을 알아봐요~</p>
    </div>
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="text" id="breed-search" placeholder="품종 이름으로 검색..." oninput="handleBreedSearch(this.value)">
    </div>
    <div class="grid-2" id="breed-list">
      ${renderBreedCards(BreedService.getAll())}
    </div>
  `);
  // 견종 이미지 로드
  setTimeout(() => BreedImageService.loadAll(), 100);
}

function renderBreedCards(breeds) {
  if (breeds.length === 0) {
    return `<div class="empty-state" style="grid-column: 1/-1;">
      <div class="empty-icon">🔍</div>
      <p>검색 결과가 없습니다</p>
    </div>`;
  }
  const sizeMap = { small: '소형', medium: '중형', large: '대형' };
  const exerciseMap = { low: '낮음', medium: '보통', high: '높음' };
  return breeds.map(breed => `
    <div class="card" onclick="Router.navigate('/breeds/${breed.id}')" style="cursor:pointer;">
      <div class="card__image breed-img" data-breed-id="${breed.id}" style="background: linear-gradient(135deg, #FFB3C6, #C9A9E9); display:flex; align-items:center; justify-content:center; font-size:3rem; position:relative;">🐕</div>
      <div class="card__body">
        <div class="card__title">${breed.name}</div>
        <div class="card__subtitle">
          <span class="badge badge-primary">${sizeMap[breed.size]}</span>
          <span class="badge badge-info" style="margin-left:4px;">운동량: ${exerciseMap[breed.exerciseLevel]}</span>
        </div>
        <div class="card__text" style="margin-top:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${breed.personality}
        </div>
      </div>
    </div>
  `).join('');
}

function handleBreedSearch(keyword) {
  const filtered = BreedService.search(keyword);
  const list = document.getElementById('breed-list');
  if (list) {
    list.innerHTML = renderBreedCards(filtered);
    setTimeout(() => BreedImageService.loadAll(), 100);
  }
}

// --- 품종 상세 페이지 ---
function renderBreedDetailPage(params) {
  const breed = BreedService.getById(params.id);
  if (!breed) {
    renderPage(`
      <div class="not-found">
        <div class="nf-icon">🐾</div>
        <h2>품종을 찾을 수 없습니다</h2>
        <p>요청하신 품종 정보가 존재하지 않습니다.</p>
        <button class="btn btn-primary" onclick="Router.navigate('/breeds')">품종 목록으로</button>
      </div>
    `);
    return;
  }

  const sizeMap = { small: '소형', medium: '중형', large: '대형' };
  const levelMap = { low: '낮음', medium: '보통', high: '높음' };
  const levelColor = { low: 'badge-success', medium: 'badge-info', high: 'badge-error' };

  renderPage(`
    <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/breeds')" style="margin-bottom:16px;">← 목록으로</button>
    <div class="detail-header">
      <div id="breed-detail-img" data-breed-id="${breed.id}" style="width:100%; height:260px; background: linear-gradient(135deg, #FFB3C6, #C9A9E9); border-radius: var(--radius-lg); display:flex; align-items:center; justify-content:center; font-size:5rem; margin-bottom:16px; position:relative;">🐕</div>
      <h1>${breed.name} ${breed.nameEn ? '<span style="font-size:0.9rem; color:var(--color-text-light); font-weight:600;">' + breed.nameEn + '</span>' : ''}</h1>
      <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:6px;">
        <span class="badge badge-primary">${sizeMap[breed.size]}</span>
        ${breed.group ? '<span class="badge badge-info">' + breed.group + '</span>' : ''}
        ${breed.origin ? '<span class="badge badge-success">' + breed.origin + '</span>' : ''}
      </div>
    </div>

    ${breed.lifespan || breed.weight || breed.height ? `
    <div class="card" style="padding:20px; margin-bottom:16px;">
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:12px; text-align:center;">
        ${breed.lifespan ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">수명</div><div style="font-weight:800; margin-top:2px;">' + breed.lifespan + '</div></div>' : ''}
        ${breed.weight ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">체중</div><div style="font-weight:800; margin-top:2px;">' + breed.weight + '</div></div>' : ''}
        ${breed.height ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">키</div><div style="font-weight:800; margin-top:2px;">' + breed.height + '</div></div>' : ''}
      </div>
    </div>` : ''}

    <div class="card" style="padding:20px; margin-bottom:16px;">
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:12px; text-align:center;">
        <div><div style="font-size:0.75rem; color:var(--color-text-muted);">운동량</div><span class="badge ${levelColor[breed.exerciseLevel]}" style="margin-top:4px;">${levelMap[breed.exerciseLevel]}</span></div>
        ${breed.groomingLevel ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">미용 관리</div><span class="badge ' + levelColor[breed.groomingLevel] + '" style="margin-top:4px;">' + levelMap[breed.groomingLevel] + '</span></div>' : ''}
        ${breed.trainability ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">훈련 난이도</div><span class="badge ' + levelColor[breed.trainability] + '" style="margin-top:4px;">' + levelMap[breed.trainability] + '</span></div>' : ''}
        ${breed.barkingLevel ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">짖음</div><span class="badge ' + levelColor[breed.barkingLevel] + '" style="margin-top:4px;">' + levelMap[breed.barkingLevel] + '</span></div>' : ''}
        ${breed.childFriendly !== undefined ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">아이 친화</div><div style="font-weight:800; margin-top:4px;">' + (breed.childFriendly ? '⭕' : '❌') + '</div></div>' : ''}
        ${breed.apartmentFriendly !== undefined ? '<div><div style="font-size:0.75rem; color:var(--color-text-muted);">아파트 적합</div><div style="font-weight:800; margin-top:4px;">' + (breed.apartmentFriendly ? '⭕' : '❌') + '</div></div>' : ''}
      </div>
    </div>

    <div class="detail-section">
      <h3>성격</h3>
      <p>${breed.personality}</p>
    </div>

    ${breed.cautions ? '<div class="detail-section"><h3>주의사항</h3><ul style="padding-left:20px;">' + breed.cautions.map(c => '<li style="margin-bottom:4px;">' + c + '</li>').join('') + '</ul></div>' : ''}

    ${breed.healthIssues ? '<div class="detail-section"><h3>주요 건강 문제</h3><ul style="padding-left:20px;">' + breed.healthIssues.map(h => '<li style="margin-bottom:4px;">' + h + '</li>').join('') + '</ul></div>' : ''}

    ${breed.dietTips ? '<div class="detail-section"><h3>식이 가이드</h3><p>' + breed.dietTips + '</p></div>' : ''}

    ${breed.exerciseTips ? '<div class="detail-section"><h3>운동 가이드</h3><p>' + breed.exerciseTips + '</p></div>' : ''}

    ${breed.groomingTips ? '<div class="detail-section"><h3>미용/관리 가이드</h3><p>' + breed.groomingTips + '</p></div>' : ''}

    ${breed.funFact ? '<div class="card" style="padding:20px; margin-bottom:16px; background:var(--color-bg-warm);"><h3 style="margin-bottom:8px;">알고 계셨나요?</h3><p style="font-size:0.9rem;">' + breed.funFact + '</p></div>' : ''}

    <div class="card" style="padding:24px; margin-top:20px;">
      <h3 style="margin-bottom:12px;">AI에게 ${breed.name}에 대해 물어보기</h3>
      <div id="breed-ai-result"></div>
      <div style="display:flex; gap:8px;">
        <input type="text" id="breed-ai-input" class="form-input" placeholder="${breed.name}에 대해 궁금한 점을 물어보세요~" style="flex:1;" onkeydown="if(event.key==='Enter')handleBreedAiQuestion('${breed.name}')">
        <button class="btn btn-primary" onclick="handleBreedAiQuestion('${breed.name}')" id="breed-ai-btn">질문하기</button>
      </div>
    </div>
  `);
  // 견종 상세 이미지 로드
  setTimeout(() => {
    const imgEl = document.getElementById('breed-detail-img');
    if (imgEl) BreedImageService.loadInto(imgEl, breed, true);
  }, 100);
}

/**
 * 품종 AI 질문 핸들러
 */
async function handleBreedAiQuestion(breedName) {
  const input = document.getElementById('breed-ai-input');
  const resultEl = document.getElementById('breed-ai-result');
  const btn = document.getElementById('breed-ai-btn');
  const question = input?.value?.trim();

  if (!question) return;

  if (btn) { btn.disabled = true; btn.textContent = '답변 중...'; }
  if (resultEl) resultEl.innerHTML = '<div style="text-align:center; padding:16px;"><div class="spinner"></div></div>';

  try {
    const res = await fetch('/api/ai/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: breedName + '에 대한 질문: ' + question,
        history: []
      })
    });
    const data = await res.json();

    if (data.success) {
      const formatted = data.reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      resultEl.innerHTML = '<div style="background:var(--color-bg-warm); border-radius:12px; padding:16px; margin-bottom:12px; line-height:1.8; font-size:0.9rem;">' + formatted + '</div>';
    } else {
      resultEl.innerHTML = '<div class="alert alert-error">' + data.error + '</div>';
    }
  } catch (e) {
    resultEl.innerHTML = '<div class="alert alert-error">AI 응답에 실패했어요. 잠시 후 다시 시도해주세요.</div>';
  }

  if (btn) { btn.disabled = false; btn.textContent = '질문하기'; }
}

// --- 교육 콘텐츠 페이지 ---
function renderEducationPage() {
  const user = AuthService.getCurrentUser();
  const progress = user ? EducationService.getProgress(user.id) : { total: EDUCATION_DATA.length, completed: 0, ratio: 0, completedIds: [] };
  const pct = Math.round(progress.ratio * 100);

  renderPage(`
    <div class="page-header">
      <h1>📚 산책 교육</h1>
      <p>올바른 산책 방법을 함께 배워봐요~ 🐾</p>
    </div>
    <div class="progress-section" style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-weight:600; font-size:0.9rem;">학습 진행률</span>
        <span style="font-size:0.85rem; color:var(--color-text-light);">${progress.completed} / ${progress.total} 완료 (${pct}%)</span>
      </div>
      <div style="width:100%; height:12px; background:var(--color-border, #F5E6EA); border-radius:6px; overflow:hidden;">
        <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, var(--color-primary-light), var(--color-primary)); border-radius:6px; transition:width 0.3s;"></div>
      </div>
    </div>
    <div class="tabs">
      <button class="tab active" onclick="filterEducation('all', this)">전체</button>
      <button class="tab" onclick="filterEducation('posture', this)">🧍 자세</button>
      <button class="tab" onclick="filterEducation('leash', this)">🦮 리드줄</button>
      <button class="tab" onclick="filterEducation('safety', this)">🛡️ 안전</button>
    </div>
    <div class="grid-2" id="education-list">
      ${renderEducationCards(EducationService.getByCategory('all'), progress.completedIds)}
    </div>
  `);
}

function renderEducationCards(items, completedIds) {
  if (items.length === 0) {
    return `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-icon">📭</div>
      <p>콘텐츠가 없습니다</p>
    </div>`;
  }
  completedIds = completedIds || [];
  const catMap = { posture: '🧍 자세', leash: '🦮 리드줄', safety: '🛡️ 안전' };
  return items.map(item => {
    const isCompleted = completedIds.includes(item.id);
    return `
    <div class="card" onclick="Router.navigate('/education/${item.id}')" style="cursor:pointer;${isCompleted ? ' border-left:3px solid var(--color-primary, #FF8FAB);' : ''}">
      <div class="card__body">
        <div class="card__subtitle">
          <span class="badge badge-primary">${catMap[item.category]}</span>
          ${isCompleted ? '<span class="badge" style="background:#d1fae5; color:#065f46; margin-left:4px;">✅ 완료</span>' : ''}
        </div>
        <div class="card__title" style="margin-top:8px;">${item.title}</div>
        <div class="card__text" style="margin-top:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${item.body.substring(0, 80)}...
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function filterEducation(category, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const filtered = EducationService.getByCategory(category);
  const user = AuthService.getCurrentUser();
  const progress = user ? EducationService.getProgress(user.id) : { completedIds: [] };
  const list = document.getElementById('education-list');
  if (list) list.innerHTML = renderEducationCards(filtered, progress.completedIds);
}

// --- 교육 상세 페이지 ---
function renderEducationDetailPage(params) {
  const content = EducationService.getById(params.id);
  if (!content) {
    renderPage(`
      <div class="not-found">
        <div class="nf-icon">📭</div>
        <h2>콘텐츠를 찾을 수 없습니다</h2>
        <p>요청하신 교육 콘텐츠가 존재하지 않습니다.</p>
        <button class="btn btn-primary" onclick="Router.navigate('/education')">교육 목록으로</button>
      </div>
    `);
    return;
  }

  const catMap = { posture: '🧍 자세', leash: '🦮 리드줄', safety: '🛡️ 안전' };
  const user = AuthService.getCurrentUser();
  const progress = user ? EducationService.getProgress(user.id) : { completedIds: [] };
  const isCompleted = progress.completedIds.includes(content.id);

  let completeButtonHtml = '';
  if (user) {
    if (isCompleted) {
      completeButtonHtml = `
        <div style="margin-top:24px; padding:16px; background:#d1fae5; border-radius:var(--radius-md, 8px); text-align:center;">
          <span style="font-size:1.2rem;">✅</span>
          <span style="font-weight:600; color:#065f46; margin-left:8px;">이미 완료한 콘텐츠입니다</span>
        </div>`;
    } else {
      completeButtonHtml = `
        <div style="margin-top:24px; text-align:center;">
          <button class="btn btn-primary" id="complete-btn" onclick="handleCompleteEducation('${content.id}')" style="padding:12px 32px; font-size:1rem;">
            ✅ 완료
          </button>
        </div>`;
    }
  } else {
    completeButtonHtml = `
      <div style="margin-top:24px; padding:16px; background:var(--color-bg-secondary, #f9fafb); border-radius:var(--radius-md, 8px); text-align:center;">
        <p style="color:var(--color-text-light); margin:0;">학습 완료를 기록하려면 <a href="#/login" style="color:var(--color-primary, #FF8FAB); font-weight:700;">로그인</a>하세요.</p>
      </div>`;
  }

  renderPage(`
    <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/education')" style="margin-bottom:16px;">← 목록으로</button>
    <div class="detail-header">
      <span class="badge badge-primary">${catMap[content.category]}</span>
      <h1 style="margin-top:8px;">${content.title}</h1>
    </div>
    <div class="detail-section">
      <div style="white-space:pre-line; line-height:1.8; font-size:0.95rem;">${content.body}</div>
    </div>
    ${completeButtonHtml}
  `);
}

/**
 * 교육 콘텐츠 완료 핸들러
 * @param {string} contentId - 콘텐츠 ID
 */
function handleCompleteEducation(contentId) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    Router.navigate('/login');
    return;
  }

  EducationService.markComplete(user.id, contentId);

  // WalletService가 존재하면 5 Paw 코인 적립
  if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
    WalletService.earnCoins(user.id, 5, '교육 콘텐츠 완료');
  }

  // 상세 페이지 다시 렌더링하여 완료 상태 반영
  renderEducationDetailPage({ id: contentId });
}

// --- 통합 AI 상담 페이지 ---
let _aiChatMode = 'training';
let _aiCurrentSession = null; // { id, title, mode, messages:[] }
let _aiSessionList = [];

function renderAiPage() {
  const user = AuthService.getCurrentUser();
  _aiChatMode = 'training';
  _aiCurrentSession = { id: StorageService.generateId(), title: '새 대화', mode: 'training', messages: [] };

  const aiName = (user && user.aiName) || '포피';

  renderPage(`
    <div class="page-header">
      <h1>🤖 ${aiName} - AI 반려견 상담</h1>
      <p>훈련/행동 상담부터 건강/질병 분석까지, ${aiName}가 도와드려요~ 🐾</p>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <button class="btn btn-secondary btn-sm" onclick="toggleAiSessions()" id="ai-sessions-toggle">📋 이전 대화 목록</button>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="startNewAiSession()">➕ 새 대화</button>
        <button class="btn btn-secondary btn-sm" onclick="showAiNameSetting()">✏️ AI 비서 이름</button>
      </div>
    </div>

    <div id="ai-sessions-panel" style="display:none; margin-bottom:12px;"></div>
    <div id="ai-name-setting" style="display:none; margin-bottom:12px;"></div>

    <div class="tabs" style="margin-bottom:16px;">
      <button class="tab active" id="ai-tab-training" onclick="switchAiMode('training')">🐾 훈련/행동 상담</button>
      <button class="tab" id="ai-tab-health" onclick="switchAiMode('health')">🩺 건강/질병 상담</button>
    </div>

    <div id="ai-mode-desc" class="card" style="padding:16px; margin-bottom:16px; background:var(--color-bg-warm);"></div>

    <div id="ai-health-fields" style="display:none; margin-bottom:16px;">
      <div class="card" style="padding:16px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:0.82rem; font-weight:600;">품종 (선택)</label>
            <select id="ai-breed" class="form-select" style="margin-top:4px;">
              <option value="">선택해주세요</option>
              ${typeof BREEDS_DATA !== 'undefined' ? BREEDS_DATA.map(b => '<option value="' + b.name + '">' + b.name + '</option>').join('') : ''}
            </select>
          </div>
          <div>
            <label style="font-size:0.82rem; font-weight:600;">나이 (선택)</label>
            <input type="text" id="ai-age" class="form-input" placeholder="예: 3살" style="margin-top:4px;">
          </div>
        </div>
      </div>
    </div>

    <div id="ai-chat" style="margin-bottom:16px; min-height:200px; max-height:500px; overflow-y:auto;"></div>

    <div style="display:flex; gap:8px; position:sticky; bottom:16px; background:var(--color-bg); padding:8px 0;">
      <label for="ai-file" class="btn btn-secondary btn-sm" title="사진/영상 첨부" style="padding:8px 12px; cursor:pointer; margin:0;">📎</label>
      <input type="file" id="ai-file" accept="image/*,video/*" style="display:none;" onchange="handleAiFileSelect(this)">
      <input type="text" id="ai-input" class="form-input" placeholder="질문을 입력해주세요..." style="flex:1;" onkeydown="if(event.key==='Enter')handleAiChat()" onpaste="handleAiPaste(event)">
      <button class="btn btn-primary" onclick="handleAiChat()" id="ai-send-btn">전송</button>
    </div>
    <div id="ai-file-preview" style="display:none; padding:8px 0;"></div>
  `);

  updateAiModeDesc();
  restoreAiChat();

  // 세션 목록 로드
  if (user) loadAiSessionList(user.id);
}

// 세션 목록 로드
async function loadAiSessionList(userId) {
  try {
    const res = await fetch('/api/chat/' + userId + '/sessions');
    if (res.ok) _aiSessionList = await res.json();
  } catch(e) { _aiSessionList = []; }
}

// 세션 목록 패널 토글
function toggleAiSessions() {
  const panel = document.getElementById('ai-sessions-panel');
  if (!panel) return;
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    renderAiSessionList();
  } else {
    panel.style.display = 'none';
  }
}

function renderAiSessionList() {
  const panel = document.getElementById('ai-sessions-panel');
  if (!panel) return;

  if (_aiSessionList.length === 0) {
    panel.innerHTML = '<div class="card" style="padding:16px;text-align:center;color:var(--color-text-muted);font-size:0.85rem;">이전 대화가 없어요.</div>';
    return;
  }

  const modeIcon = { training: '🐾', health: '🩺' };
  const items = _aiSessionList.map(s => {
    const date = new Date(s.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const isActive = _aiCurrentSession && _aiCurrentSession.id === s.id;
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--color-border);' + (isActive ? 'background:var(--color-bg-warm);' : '') + '"><span onclick="loadAiSession(\'' + s.id + '\')" style="cursor:pointer;">' + (modeIcon[s.mode] || '💬') + '</span><div style="flex:1;min-width:0;cursor:pointer;" onclick="loadAiSession(\'' + s.id + '\')"><div id="session-title-' + s.id + '" style="font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + s.title + '</div><div style="font-size:0.75rem;color:var(--color-text-muted);">' + date + ' · ' + s.messageCount + '개 메시지</div></div><button onclick="event.stopPropagation();editSessionTitle(\'' + s.id + '\')" style="background:none;border:none;cursor:pointer;font-size:0.8rem;color:var(--color-text-muted);" title="제목 수정">✏️</button><button onclick="event.stopPropagation();deleteAiSession(\'' + s.id + '\')" style="background:none;border:none;cursor:pointer;font-size:0.9rem;color:var(--color-text-muted);" title="삭제">🗑️</button></div>';
  }).join('');

  panel.innerHTML = '<div class="card" style="padding:0;max-height:300px;overflow-y:auto;">' + items + '</div>';
}

// 세션 제목 수정
function editSessionTitle(sessionId) {
  const titleEl = document.getElementById('session-title-' + sessionId);
  if (!titleEl) return;
  const currentTitle = titleEl.textContent;
  titleEl.innerHTML = '<div style="display:flex;gap:4px;"><input type="text" id="edit-title-input-' + sessionId + '" class="form-input" value="' + currentTitle.replace(/"/g, '&quot;') + '" maxlength="30" style="font-size:0.82rem;padding:4px 8px;height:28px;" onkeydown="if(event.key===\'Enter\')confirmEditTitle(\'' + sessionId + '\');if(event.key===\'Escape\')renderAiSessionList();"><button onclick="confirmEditTitle(\'' + sessionId + '\')" style="background:var(--color-primary);color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:0.75rem;cursor:pointer;">✓</button></div>';
  const input = document.getElementById('edit-title-input-' + sessionId);
  if (input) { input.focus(); input.select(); }
}

async function confirmEditTitle(sessionId) {
  const input = document.getElementById('edit-title-input-' + sessionId);
  if (!input) return;
  const newTitle = input.value.trim();
  if (!newTitle) return;

  const user = AuthService.getCurrentUser();
  if (!user) return;

  // 서버에 저장
  try {
    // 세션 데이터 가져와서 제목만 변경
    const res = await fetch('/api/chat/' + user.id + '/session/' + sessionId);
    if (res.ok) {
      const session = await res.json();
      session.title = newTitle;
      await fetch('/api/chat/' + user.id + '/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, title: newTitle, mode: session.mode, messages: session.messages })
      });
    }
  } catch(e) {}

  // 로컬 목록 업데이트
  const s = _aiSessionList.find(x => x.id === sessionId);
  if (s) s.title = newTitle;
  if (_aiCurrentSession && _aiCurrentSession.id === sessionId) _aiCurrentSession.title = newTitle;

  renderAiSessionList();
}

// 새 대화 시작
function startNewAiSession() {
  // 현재 세션 저장
  saveCurrentSession();
  // 새 세션
  _aiCurrentSession = { id: StorageService.generateId(), title: '새 대화', mode: _aiChatMode, messages: [] };
  restoreAiChat();
  document.getElementById('ai-sessions-panel').style.display = 'none';
}

// 이전 세션 로드
async function loadAiSession(sessionId) {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  // 현재 세션 먼저 저장
  saveCurrentSession();

  try {
    const res = await fetch('/api/chat/' + user.id + '/session/' + sessionId);
    if (res.ok) {
      const session = await res.json();
      _aiCurrentSession = session;
      _aiChatMode = session.mode || 'training';

      // 탭 상태 업데이트
      document.getElementById('ai-tab-training').classList.toggle('active', _aiChatMode === 'training');
      document.getElementById('ai-tab-health').classList.toggle('active', _aiChatMode === 'health');
      document.getElementById('ai-health-fields').style.display = _aiChatMode === 'health' ? 'block' : 'none';
      updateAiModeDesc();
      restoreAiChat();
      document.getElementById('ai-sessions-panel').style.display = 'none';
    }
  } catch(e) { console.warn('세션 로드 실패:', e); }
}

// 세션 삭제
async function deleteAiSession(sessionId) {
  if (!confirm('이 대화를 삭제할까요?')) return;
  const user = AuthService.getCurrentUser();
  if (!user) return;

  try {
    await fetch('/api/chat/' + user.id + '/session/' + sessionId, { method: 'DELETE' });
    _aiSessionList = _aiSessionList.filter(s => s.id !== sessionId);
    renderAiSessionList();
    // 현재 세션이 삭제된 경우 새 대화 시작
    if (_aiCurrentSession && _aiCurrentSession.id === sessionId) {
      startNewAiSession();
    }
  } catch(e) {}
}

// 현재 세션 서버에 저장
async function saveCurrentSession() {
  const user = AuthService.getCurrentUser();
  if (!user || !_aiCurrentSession || _aiCurrentSession.messages.length === 0) return;

  // 첫 사용자 메시지로 제목 자동 생성
  if (_aiCurrentSession.title === '새 대화') {
    const firstMsg = _aiCurrentSession.messages.find(m => m.role === 'user');
    if (firstMsg) {
      _aiCurrentSession.title = firstMsg.text.substring(0, 30) + (firstMsg.text.length > 30 ? '...' : '');
    }
  }

  try {
    await fetch('/api/chat/' + user.id + '/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: _aiCurrentSession.id,
        title: _aiCurrentSession.title,
        mode: _aiCurrentSession.mode || _aiChatMode,
        messages: _aiCurrentSession.messages
      })
    });
    // 세션 목록 갱신
    await loadAiSessionList(user.id);
  } catch(e) {}
}

function updateAiModeDesc() {
  const descEl = document.getElementById('ai-mode-desc');
  if (!descEl) return;
  if (_aiChatMode === 'training') {
    descEl.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:1.5rem;">🐕‍🦺</span><div><div style="font-weight:700;font-size:0.9rem;">훈련/행동 상담 모드</div><div style="font-size:0.82rem;color:var(--color-text-light);">문제 행동 교정, 훈련 방법, 사회화 등에 대해 상담해드려요</div></div></div>';
  } else {
    descEl.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:1.5rem;">🩺</span><div><div style="font-weight:700;font-size:0.9rem;">건강/질병 상담 모드</div><div style="font-size:0.82rem;color:var(--color-text-light);">증상 분석, 질병 정보, 응급 대처법 등을 안내해드려요</div></div></div>';
  }
}

function restoreAiChat() {
  const chatEl = document.getElementById('ai-chat');
  if (!chatEl) return;
  const messages = (_aiCurrentSession && _aiCurrentSession.messages) || [];

  if (messages.length === 0) {
    const icon = _aiChatMode === 'training' ? '🐕‍🦺' : '🩺';
    const desc = _aiChatMode === 'training'
      ? '반려견 행동 문제나 훈련 방법에 대해 물어봐주세요!'
      : '반려견의 증상이나 건강 고민을 알려주세요!';
    chatEl.innerHTML = '<div class="card" style="padding:20px;text-align:center;color:var(--color-text-light);"><div style="font-size:2.5rem;margin-bottom:8px;">' + icon + '</div><p style="font-weight:700;">안녕하세요! ' + getAiName() + '예요~</p><p style="font-size:0.85rem;margin-top:4px;">' + desc + '</p></div>';
    return;
  }

  chatEl.innerHTML = '';
  messages.forEach(msg => {
    if (msg.role === 'user') {
      chatEl.innerHTML += '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><div style="background:var(--color-primary);color:#fff;padding:12px 16px;border-radius:16px 16px 4px 16px;max-width:75%;font-size:0.9rem;">' + msg.text + '</div></div>';
    } else {
      const formatted = msg.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      chatEl.innerHTML += '<div style="display:flex;margin-bottom:12px;"><div style="background:var(--color-bg-warm);border:2px solid var(--color-border);padding:12px 16px;border-radius:16px 16px 16px 4px;max-width:85%;font-size:0.9rem;line-height:1.7;">' + formatted + '</div></div>';
    }
  });
  chatEl.scrollTop = chatEl.scrollHeight;
}

function switchAiMode(mode) {
  _aiChatMode = mode;
  if (_aiCurrentSession) _aiCurrentSession.mode = mode;

  document.getElementById('ai-tab-training').classList.toggle('active', mode === 'training');
  document.getElementById('ai-tab-health').classList.toggle('active', mode === 'health');
  document.getElementById('ai-health-fields').style.display = mode === 'health' ? 'block' : 'none';
  updateAiModeDesc();

  const input = document.getElementById('ai-input');
  if (input) input.placeholder = mode === 'training' ? '훈련/행동 관련 질문을 입력해주세요...' : '증상이나 건강 관련 질문을 입력해주세요...';
}

function clearAiChat() {
  if (!confirm('현재 대화를 초기화하고 새 대화를 시작할까요?')) return;
  startNewAiSession();
}

// AI 비서 이름 관련
function getAiName() {
  const user = AuthService.getCurrentUser();
  return (user && user.aiName) || '포피';
}

function showAiNameSetting() {
  const user = AuthService.getCurrentUser();
  if (!user) { alert('로그인이 필요해요!'); return; }
  const el = document.getElementById('ai-name-setting');
  if (!el) return;
  const current = user.aiName || '포피';
  el.style.display = 'block';
  el.innerHTML = '<div class="card" style="padding:16px;"><div style="font-weight:700;font-size:0.9rem;margin-bottom:8px;">✏️ AI 비서 이름 설정</div><p style="font-size:0.82rem;color:var(--color-text-light);margin-bottom:10px;">나만의 AI 비서 이름을 지어주세요! AI가 이 이름으로 자기소개해요.</p><div style="display:flex;gap:8px;"><input type="text" id="ai-name-input" class="form-input" value="' + current + '" placeholder="예: 뽀삐, 멍멍이, 코코" maxlength="10" style="flex:1;"><button class="btn btn-primary btn-sm" onclick="saveAiName()">저장</button><button class="btn btn-secondary btn-sm" onclick="document.getElementById(\'ai-name-setting\').style.display=\'none\'">취소</button></div></div>';
}

function saveAiName() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  const name = document.getElementById('ai-name-input')?.value?.trim();
  if (!name) { alert('이름을 입력해주세요!'); return; }
  if (name.length > 10) { alert('10자 이내로 입력해주세요!'); return; }

  // 사용자 데이터에 aiName 저장
  const users = StorageService.get('users', []);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    users[idx].aiName = name;
    StorageService.set('users', users);
  }
  // currentUser도 업데이트
  user.aiName = name;
  StorageService.set('currentUser', user);

  document.getElementById('ai-name-setting').style.display = 'none';
  alert(name + '(으)로 설정되었어요! 🐾');
  renderAiPage(); // 페이지 새로고침
}

// AI 클립보드 붙여넣기 (Ctrl+V 스크린샷)
function handleAiPaste(event) {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault();
      const file = item.getAsFile();
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 크기는 10MB 이하만 가능해요.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Full = e.target.result;
        const base64Data = base64Full.split(',')[1];
        _aiAttachedFile = {
          base64: base64Data,
          mimeType: file.type,
          name: '붙여넣기 이미지'
        };

        const preview = document.getElementById('ai-file-preview');
        if (preview) {
          preview.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--color-bg-warm);border-radius:8px;"><img src="' + base64Full + '" style="width:60px;height:60px;object-fit:cover;border-radius:6px;"><div style="flex:1;font-size:0.82rem;font-weight:600;">📋 클립보드 이미지</div><button onclick="removeAiFile()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">✕</button></div>';
          preview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
      return;
    }
  }
}

// AI 파일 첨부 관련
let _aiAttachedFile = null; // { base64, mimeType, name }

function handleAiFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  // 10MB 제한
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하만 가능해요.');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Full = e.target.result;
    const base64Data = base64Full.split(',')[1]; // data:image/jpeg;base64, 부분 제거
    _aiAttachedFile = {
      base64: base64Data,
      mimeType: file.type,
      name: file.name
    };

    // 미리보기 표시
    const preview = document.getElementById('ai-file-preview');
    if (preview) {
      if (file.type.startsWith('image/')) {
        preview.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--color-bg-warm);border-radius:8px;"><img src="' + base64Full + '" style="width:60px;height:60px;object-fit:cover;border-radius:6px;"><div style="flex:1;font-size:0.82rem;font-weight:600;">' + file.name + '</div><button onclick="removeAiFile()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">✕</button></div>';
      } else {
        preview.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--color-bg-warm);border-radius:8px;"><span style="font-size:1.5rem;">🎬</span><div style="flex:1;font-size:0.82rem;font-weight:600;">' + file.name + '</div><button onclick="removeAiFile()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">✕</button></div>';
      }
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

function removeAiFile() {
  _aiAttachedFile = null;
  const preview = document.getElementById('ai-file-preview');
  if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
  const fileInput = document.getElementById('ai-file');
  if (fileInput) fileInput.value = '';
}

async function handleAiChat() {
  const input = document.getElementById('ai-input');
  const chatEl = document.getElementById('ai-chat');
  const btn = document.getElementById('ai-send-btn');
  const message = input?.value?.trim();
  if (!message) return;
  input.value = '';

  // 첫 메시지면 환영 카드 제거
  if (_aiCurrentSession.messages.length === 0) chatEl.innerHTML = '';

  // 사용자 메시지 표시 (이미지 포함)
  let userMsgHtml = '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><div style="background:var(--color-primary);color:#fff;padding:12px 16px;border-radius:16px 16px 4px 16px;max-width:75%;font-size:0.9rem;">';
  if (_aiAttachedFile && _aiAttachedFile.mimeType.startsWith('image/')) {
    userMsgHtml += '<img src="data:' + _aiAttachedFile.mimeType + ';base64,' + _aiAttachedFile.base64 + '" style="max-width:200px;max-height:150px;border-radius:8px;margin-bottom:8px;display:block;">';
  } else if (_aiAttachedFile) {
    userMsgHtml += '<div style="margin-bottom:6px;">📎 ' + _aiAttachedFile.name + '</div>';
  }
  userMsgHtml += message + '</div></div>';
  chatEl.innerHTML += userMsgHtml;

  // 로딩
  chatEl.innerHTML += '<div id="ai-loading" style="display:flex;margin-bottom:12px;"><div style="background:var(--color-bg-warm);padding:12px 16px;border-radius:16px 16px 16px 4px;max-width:75%;"><div class="spinner" style="width:20px;height:20px;"></div></div></div>';
  chatEl.scrollTop = chatEl.scrollHeight;
  if (btn) btn.disabled = true;

  _aiCurrentSession.messages.push({ role: 'user', text: message });

  try {
    let apiUrl, body;
    const hasFile = !!_aiAttachedFile;

    if (hasFile) {
      // 이미지 첨부 → 멀티모달 API
      apiUrl = '/api/ai/consult-with-image';
      body = JSON.stringify({
        message,
        imageBase64: _aiAttachedFile.base64,
        mimeType: _aiAttachedFile.mimeType,
        history: _aiCurrentSession.messages,
        mode: _aiChatMode,
        aiName: getAiName()
      });
      // 파일 첨부 초기화
      removeAiFile();
    } else if (_aiChatMode === 'health') {
      const breed = document.getElementById('ai-breed')?.value || '';
      const age = document.getElementById('ai-age')?.value || '';
      apiUrl = '/api/ai/consult';
      const healthPrefix = '[건강/질병 상담 모드] ';
      const breedInfo = breed ? '품종: ' + breed + '. ' : '';
      const ageInfo = age ? '나이: ' + age + '. ' : '';
      body = JSON.stringify({
        message: healthPrefix + breedInfo + ageInfo + message,
        history: _aiCurrentSession.messages,
        mode: 'health',
        aiName: getAiName()
      });
    } else {
      apiUrl = '/api/ai/consult';
      body = JSON.stringify({
        message,
        history: _aiCurrentSession.messages,
        mode: 'training',
        aiName: getAiName()
      });
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const data = await res.json();

    const loading = document.getElementById('ai-loading');
    if (loading) loading.remove();

    const reply = data.reply || data.analysis || data.error || '응답을 받지 못했어요.';
    const isSuccess = data.success !== false;

    if (isSuccess) {
      const formatted = reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      chatEl.innerHTML += '<div style="display:flex;margin-bottom:12px;"><div style="background:var(--color-bg-warm);border:2px solid var(--color-border);padding:12px 16px;border-radius:16px 16px 16px 4px;max-width:85%;font-size:0.9rem;line-height:1.7;">' + formatted + '</div></div>';
      _aiCurrentSession.messages.push({ role: 'ai', text: reply });
    } else {
      chatEl.innerHTML += '<div class="alert alert-error" style="margin-bottom:12px;">' + reply + '</div>';
    }

    // 메모리 저장
    const user = AuthService.getCurrentUser();
    if (user) saveCurrentSession();

  } catch (e) {
    const loading = document.getElementById('ai-loading');
    if (loading) loading.remove();
    chatEl.innerHTML += '<div class="alert alert-error" style="margin-bottom:12px;">서버 연결에 실패했습니다.</div>';
  }

  if (btn) btn.disabled = false;
  chatEl.scrollTop = chatEl.scrollHeight;
}


// --- AI 증상 분석 페이지 (레거시 - /ai-symptom 직접 접근 시) ---
function renderAiSymptomPage() {
  const user = AuthService.getCurrentUser();

  renderPage(`
    <div class="page-header">
      <h1>🩺 AI 질병 분석</h1>
      <p>우리 아이 증상을 입력하면 AI가 분석해줘요~ 🐾</p>
    </div>

    <div class="card" style="padding:24px; margin-bottom:20px;">
      <div class="form-group">
        <label for="symptom-breed">품종</label>
        <select id="symptom-breed" class="form-select">
          <option value="">선택해주세요 (선택)</option>
          ${typeof BREEDS_DATA !== 'undefined' ? BREEDS_DATA.map(b => `<option value="${b.name}">${b.name}</option>`).join('') : ''}
        </select>
      </div>
      <div class="form-group">
        <label for="symptom-age">나이</label>
        <input type="text" id="symptom-age" class="form-input" placeholder="예: 3살">
      </div>
      <div class="form-group">
        <label for="symptom-text">증상 설명</label>
        <textarea id="symptom-text" class="form-input" placeholder="우리 아이가 어떤 증상을 보이나요? 자세히 적어주세요~&#10;예: 어제부터 밥을 안 먹고, 구토를 2번 했어요. 기운이 없고 축 처져있어요." style="min-height:120px;"></textarea>
      </div>
      <button class="btn btn-primary" style="width:100%;" onclick="handleAiSymptom()" id="symptom-btn">🩺 AI 분석하기</button>
    </div>

    <div id="symptom-result"></div>
  `);
}

async function handleAiSymptom() {
  const symptoms = document.getElementById('symptom-text')?.value;
  const breed = document.getElementById('symptom-breed')?.value;
  const age = document.getElementById('symptom-age')?.value;
  const resultEl = document.getElementById('symptom-result');
  const btn = document.getElementById('symptom-btn');

  if (!symptoms || !symptoms.trim()) {
    if (resultEl) resultEl.innerHTML = '<div class="alert alert-error">증상을 입력해주세요.</div>';
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = '분석 중... 🔍'; }
  if (resultEl) resultEl.innerHTML = '<div style="text-align:center; padding:32px;"><div class="spinner"></div><p style="margin-top:12px; color:var(--color-text-muted);">AI가 분석하고 있어요...</p></div>';

  try {
    const res = await fetch('/api/ai/symptom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, breed, age })
    });
    const data = await res.json();

    if (data.success) {
      const formatted = data.analysis.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      resultEl.innerHTML = `
        <div class="card" style="padding:24px;">
          <h3 style="margin-bottom:16px; font-weight:800;">🩺 AI 분석 결과</h3>
          <div style="line-height:1.8; font-size:0.92rem;">${formatted}</div>
        </div>
      `;
    } else {
      resultEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
    }
  } catch (e) {
    resultEl.innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
  }

  if (btn) { btn.disabled = false; btn.textContent = '🩺 AI 분석하기'; }
}

// --- AI 상담 페이지 ---
function renderAiConsultPage() {
  renderPage(`
    <div class="page-header">
      <h1>💭 AI 훈련사 상담</h1>
      <p>문제 행동이나 고민이 있으면 AI 훈련사에게 물어봐요~ 🐾</p>
    </div>

    <div id="consult-chat" style="margin-bottom:16px;">
      <div class="card" style="padding:20px; text-align:center; color:var(--color-text-light);">
        <div style="font-size:2.5rem; margin-bottom:8px;">🐕‍🦺</div>
        <p style="font-weight:700;">안녕하세요! AI 훈련사예요~</p>
        <p style="font-size:0.85rem; margin-top:4px;">반려견 행동 문제나 훈련 방법에 대해 물어봐주세요!</p>
      </div>
    </div>

    <div style="display:flex; gap:8px; position:sticky; bottom:16px;">
      <input type="text" id="consult-input" class="form-input" placeholder="고민을 입력해주세요..." style="flex:1;" onkeydown="if(event.key==='Enter')handleAiConsult()">
      <button class="btn btn-primary" onclick="handleAiConsult()" id="consult-btn">전송</button>
    </div>
  `);

  // 대화 내역 초기화
  window._consultHistory = [];
}

async function handleAiConsult() {
  const input = document.getElementById('consult-input');
  const chatEl = document.getElementById('consult-chat');
  const btn = document.getElementById('consult-btn');
  const message = input?.value?.trim();

  if (!message) return;
  input.value = '';

  // 사용자 메시지 표시
  chatEl.innerHTML += `
    <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
      <div style="background:var(--color-primary); color:#fff; padding:12px 16px; border-radius:16px 16px 4px 16px; max-width:75%; font-size:0.9rem;">${message}</div>
    </div>
  `;

  // 로딩 표시
  chatEl.innerHTML += `
    <div id="consult-loading" style="display:flex; margin-bottom:12px;">
      <div style="background:var(--color-bg-warm); padding:12px 16px; border-radius:16px 16px 16px 4px; max-width:75%;"><div class="spinner" style="width:20px;height:20px;"></div></div>
    </div>
  `;
  chatEl.scrollTop = chatEl.scrollHeight;

  if (btn) { btn.disabled = true; }
  window._consultHistory.push({ role: 'user', text: message });

  try {
    const res = await fetch('/api/ai/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: window._consultHistory })
    });
    const data = await res.json();

    // 로딩 제거
    const loading = document.getElementById('consult-loading');
    if (loading) loading.remove();

    if (data.success) {
      const formatted = data.reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      chatEl.innerHTML += `
        <div style="display:flex; margin-bottom:12px;">
          <div style="background:var(--color-bg-warm); border:2px solid var(--color-border); padding:12px 16px; border-radius:16px 16px 16px 4px; max-width:75%; font-size:0.9rem; line-height:1.7;">${formatted}</div>
        </div>
      `;
      window._consultHistory.push({ role: 'ai', text: data.reply });
    } else {
      chatEl.innerHTML += `<div class="alert alert-error">${data.error}</div>`;
    }
  } catch (e) {
    const loading = document.getElementById('consult-loading');
    if (loading) loading.remove();
    chatEl.innerHTML += '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
  }

  if (btn) { btn.disabled = false; }
  chatEl.scrollTop = chatEl.scrollHeight;
}

// --- 커뮤니티 페이지 ---
function renderCommunityPage() {
  const user = AuthService.getCurrentUser();
  const posts = CommunityService.getFeed(1);

  let createFormHtml = '';
  if (user) {
    createFormHtml = `
      <div class="card" style="padding:16px; margin-bottom:20px;">
        <div style="display:flex; gap:10px; align-items:flex-start;">
          <div class="post-card__avatar">${user.name.charAt(0)}</div>
          <div style="flex:1;">
            <textarea id="new-post-text" class="form-input" placeholder="산책 이야기를 공유해보세요..." style="min-height:60px;"></textarea>
            <div id="post-create-error" style="margin-top:4px;"></div>
            <div style="text-align:right; margin-top:8px;">
              <button class="btn btn-primary btn-sm" onclick="handleCreatePost()">게시하기</button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    createFormHtml = `
      <div class="alert alert-error" style="margin-bottom:20px; text-align:center;">
        로그인이 필요합니다. <a href="#/login" style="font-weight:600;">로그인하기</a>
      </div>
    `;
  }

  renderPage(`
    <div class="page-header">
      <h1>💬 커뮤니티</h1>
      <p>반려인들과 우리 아이 이야기를 나눠봐요~ 🐶</p>
    </div>
    ${createFormHtml}
    <div id="community-feed">
      ${renderPostCards(posts, user)}
    </div>
  `);
}

/**
 * 게시물 카드 목록 렌더링
 * @param {Post[]} posts
 * @param {User|null} user
 * @returns {string}
 */
function renderPostCards(posts, user) {
  if (posts.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>아직 게시물이 없습니다. 첫 번째 게시물을 작성해보세요!</p>
      </div>
    `;
  }

  return posts.map(post => {
    const isLiked = user && post.likedBy.includes(user.id);
    const heartIcon = isLiked ? '❤️' : '🤍';
    const likedClass = isLiked ? ' liked' : '';
    const timeAgo = formatTimeAgo(post.createdAt);

    const commentsHtml = post.comments.length > 0
      ? `<div class="comment-list">
          ${post.comments.map(c => `
            <div class="comment-item">
              <div class="comment-item__avatar">${c.authorName.charAt(0)}</div>
              <div class="comment-item__content">
                <span class="comment-item__author">${c.authorName}</span>
                <div class="comment-item__text">${c.text}</div>
              </div>
            </div>
          `).join('')}
        </div>`
      : '';

    const commentFormHtml = user
      ? `<div class="comment-form">
          <input type="text" id="comment-input-${post.id}" placeholder="댓글을 입력하세요..." onkeydown="if(event.key==='Enter')handleAddComment('${post.id}')">
          <button onclick="handleAddComment('${post.id}')">게시</button>
        </div>`
      : '';

    return `
      <div class="post-card">
        <div class="post-card__header">
          <div class="post-card__avatar">${post.authorName.charAt(0)}</div>
          <div>
            <div class="post-card__author">${post.authorName}</div>
            <div class="post-card__time">${timeAgo}</div>
          </div>
        </div>
        <div class="post-card__body">${post.text}</div>
        <div class="post-card__actions">
          <button class="post-action-btn${likedClass}" onclick="handleToggleLike('${post.id}')">
            ${heartIcon} <span>${post.likes}</span>
          </button>
          <button class="post-action-btn">
            💬 <span>${post.comments.length}</span>
          </button>
        </div>
        ${commentsHtml}
        ${commentFormHtml}
      </div>
    `;
  }).join('');
}

/**
 * 시간 경과 포맷팅
 * @param {string} dateStr - ISO 날짜 문자열
 * @returns {string}
 */
function formatTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

/**
 * 게시물 작성 핸들러
 */
function handleCreatePost() {
  const user = AuthService.getCurrentUser();
  if (!user) {
    Router.navigate('/login');
    return;
  }

  const textEl = document.getElementById('new-post-text');
  const text = textEl ? textEl.value : '';
  const errEl = document.getElementById('post-create-error');

  try {
    CommunityService.createPost({
      authorId: user.id,
      authorName: user.name,
      text: text
    });
    renderCommunityPage();
  } catch (e) {
    if (errEl) errEl.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

/**
 * 좋아요 토글 핸들러
 * @param {string} postId
 */
function handleToggleLike(postId) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    Router.navigate('/login');
    return;
  }

  try {
    CommunityService.toggleLike(postId, user.id);
    renderCommunityPage();
  } catch (e) {
    console.error('[Pawsitive] 좋아요 오류:', e.message);
  }
}

/**
 * 댓글 추가 핸들러
 * @param {string} postId
 */
function handleAddComment(postId) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    Router.navigate('/login');
    return;
  }

  const inputEl = document.getElementById('comment-input-' + postId);
  const text = inputEl ? inputEl.value : '';

  try {
    CommunityService.addComment(postId, {
      authorId: user.id,
      authorName: user.name,
      text: text
    });
    renderCommunityPage();
  } catch (e) {
    console.error('[Pawsitive] 댓글 오류:', e.message);
  }
}

// --- 지갑 페이지 ---
function renderWalletPage() {
  const user = AuthService.getCurrentUser();

  if (!user) {
    renderPage(`
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-logo">🪙</div>
          <h2>로그인이 필요합니다</h2>
          <p style="text-align:center; color:var(--color-text-light); margin-bottom:20px;">Paw 지갑을 이용하려면 먼저 로그인하세요.</p>
          <button class="btn btn-primary" style="width:100%;" onclick="Router.navigate('/login')">로그인하기</button>
          <div class="auth-footer">
            계정이 없으신가요? <a href="#/register">회원가입</a>
          </div>
        </div>
      </div>
    `);
    return;
  }

  const balance = WalletService.getBalance(user.id);
  const transactions = WalletService.getTransactions(user.id);

  let transactionListHtml = '';
  if (transactions.length === 0) {
    transactionListHtml = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>거래 내역이 없습니다</p>
      </div>
    `;
  } else {
    transactionListHtml = `
      <div class="card">
        ${transactions.map(tx => {
          const isEarn = tx.type === 'earn';
          const sign = isEarn ? '+' : '-';
          const amountClass = isEarn ? 'earn' : 'spend';
          const date = new Date(tx.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric'
          });
          return `
            <div class="transaction-item">
              <div class="tx-info">
                <div class="tx-reason">${tx.reason}</div>
                <div class="tx-date">${date}</div>
              </div>
              <div class="tx-amount ${amountClass}">${sign}${tx.amount} PAW</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderPage(`
    <div class="page-header">
      <h1>🪙 Paw 지갑</h1>
      <p>활동으로 코인을 모으고 사용해봐요~ 💕</p>
    </div>
    <div class="wallet-balance">
      <div class="balance-label">보유 Paw 코인</div>
      <div class="balance-amount">${balance}</div>
      <div class="balance-unit">🐾 PAW (${balance}원)</div>
    </div>
    <div class="page-header" style="margin-top:8px;">
      <h1 style="font-size:1.1rem;">📋 거래 내역</h1>
    </div>
    ${transactionListHtml}
  `);
}

// --- 매칭 페이지 ---
/* ===================================================
   산책 매칭 페이지 — 실시간 매칭 중심 UI
   =================================================== */

function renderMatchingPage() {
  const user = AuthService.getCurrentUser();

  if (!user) {
    renderPage(`
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-logo">🤝</div>
          <h2>로그인이 필요합니다</h2>
          <p style="text-align:center; color:var(--color-text-light); margin-bottom:20px;">산책 매칭을 이용하려면 먼저 로그인하세요.</p>
          <button class="btn btn-primary" style="width:100%;" onclick="Router.navigate('/login')">로그인하기</button>
          <div class="auth-footer">계정이 없으신가요? <a href="#/register">회원가입</a></div>
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

  if (myProfile.role === 'walker') {
    renderWalkerDashboard(user, myProfile);
  } else {
    MatchingService.refreshFromServer().then(() => renderRequesterDashboard(user, myProfile));
  }
}

/** 역할 선택 화면 */
function renderMatchingRoleSelect(selectedRole) {
  const walkerSel = selectedRole === 'walker';
  const reqSel    = selectedRole === 'requester';

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
        <label>추가 정보</label>
        <div class="match-check-group">
          <label class="dw-check-label"><input type="checkbox" id="match-large-dog"> 대형견 산책 가능</label>
          <label class="dw-check-label"><input type="checkbox" id="match-multi-dog"> 여러 마리 동시 산책 가능</label>
        </div>
      </div>
      <button class="btn btn-primary match-submit-btn" onclick="handleRegisterMatchProfile('walker')">🚶‍♂️ 산책 도우미로 등록하기</button>
    </div>
  ` : '';

  const reqFormHtml = reqSel ? `
    <div class="match-form-card">
      <h3 class="match-form-title">산책 요청자 등록 및 매칭 요청</h3>
      <div id="match-register-error"></div>
      <div class="match-form-grid">
        <div class="form-group">
          <label for="match-dog-name">반려견 이름 <span class="dw-required">*</span></label>
          <input type="text" id="match-dog-name" class="form-input" placeholder="예: 초코">
        </div>
        <div class="form-group">
          <label for="match-dog-size">반려견 크기 <span class="dw-required">*</span></label>
          <select id="match-dog-size" class="form-select">
            <option value="">선택해주세요</option>
            <option value="small">소형견 (~10kg)</option>
            <option value="medium">중형견 (10~25kg)</option>
            <option value="large">대형견 (25kg~)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="match-location">산책 희망 장소 <span class="dw-required">*</span></label>
          <input type="text" id="match-location" class="form-input" placeholder="예: 서울 마포구 합정동">
        </div>
        <div class="form-group">
          <label for="match-time">원하는 산책 시간 <span class="dw-required">*</span></label>
          <select id="match-time" class="form-select">
            <option value="">선택해주세요</option>
            <option value="오전 (7-9시)">오전 (7~9시)</option>
            <option value="오전 (9-11시)">오전 (9~11시)</option>
            <option value="오후 (2-4시)">오후 (2~4시)</option>
            <option value="오후 (5-7시)">오후 (5~7시)</option>
            <option value="저녁 (7-9시)">저녁 (7~9시)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="match-notes">요청사항</label>
        <textarea id="match-notes" class="form-input" rows="2" placeholder="특별한 요청사항이 있으면 적어주세요."></textarea>
      </div>
      <button class="btn btn-primary match-submit-btn" onclick="handleRegisterMatchProfile('requester')">🐕 산책 요청자로 등록하기</button>
    </div>
  ` : '';

  renderPage(`
    <div class="match-hero">
      <div class="section-label">산책 매칭</div>
      <h1 class="match-hero__title">지금 바로 산책 매칭을<br>시작해보세요</h1>
      <p class="match-hero__sub">산책 도우미와 요청자를 실시간으로 연결해드려요</p>
    </div>

    <div class="match-role-grid">
      <div class="match-role-card ${walkerSel ? 'match-role-card--selected' : ''}" onclick="renderMatchingRoleSelectStatic('walker')">
        ${walkerSel ? '<div class="match-role-card__badge">선택됨 ✓</div>' : ''}
        <div class="match-role-card__icon">🚶‍♂️</div>
        <h3 class="match-role-card__title">산책 도우미</h3>
        <p class="match-role-card__desc">다른 분의 반려견을<br>산책시켜 드려요</p>
      </div>
      <div class="match-role-card ${reqSel ? 'match-role-card--selected' : ''}" onclick="renderMatchingRoleSelectStatic('requester')">
        ${reqSel ? '<div class="match-role-card__badge">선택됨 ✓</div>' : ''}
        <div class="match-role-card__icon">🐕</div>
        <h3 class="match-role-card__title">산책 요청자</h3>
        <p class="match-role-card__desc">우리 아이 산책을<br>부탁하고 싶어요</p>
      </div>
    </div>

    ${walkerFormHtml}${reqFormHtml}
    ${!selectedRole ? '<p class="match-role-hint">위 카드를 클릭해서 역할을 선택해주세요</p>' : ''}
  `);
}

function renderMatchingRoleSelectStatic(role) { renderMatchingRoleSelect(role); }

/** 매칭 프로필 등록 핸들러 */
function handleRegisterMatchProfile(role) {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  const location     = document.getElementById('match-location')?.value;
  const preferredTime = document.getElementById('match-time')?.value;
  const message      = document.getElementById('match-message')?.value || '';
  const errEl        = document.getElementById('match-register-error');

  if (!location || !location.trim()) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">활동 지역을 입력해주세요.</div>'; return;
  }
  if (!preferredTime) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">시간대를 선택해주세요.</div>'; return;
  }

  let extra = {};
  if (role === 'walker') {
    if (!message.trim()) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-error">자기소개를 입력해주세요.</div>'; return;
    }
    extra = {
      experience:      document.getElementById('match-experience')?.value || '',
      canWalkLarge:    document.getElementById('match-large-dog')?.checked || false,
      canWalkMultiple: document.getElementById('match-multi-dog')?.checked || false,
    };
  } else {
    const dogName = document.getElementById('match-dog-name')?.value;
    const dogSize = document.getElementById('match-dog-size')?.value;
    if (!dogName?.trim()) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-error">반려견 이름을 입력해주세요.</div>'; return;
    }
    if (!dogSize) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-error">반려견 크기를 선택해주세요.</div>'; return;
    }
    extra = {
      dogName: dogName.trim(),
      dogSize,
      notes: document.getElementById('match-notes')?.value || ''
    };
  }

  MatchingService.registerProfile(user.id, { role, location: location.trim(), preferredTime, message: message.trim(), isAvailable: true, ...extra });
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
      const pending  = requests.filter(r => r.status === 'pending');
      const newOnes  = pending.filter(r => !_walkerLastRequestIds.has(r.id));
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
  notif.innerHTML = `<span style="font-size:1.4rem;">🔔</span><div><div style="font-weight:700;">근처에서 산책 요청이 들어왔어요!</div><div style="font-size:0.78rem;opacity:0.8;margin-top:2px;">새 요청 ${count}건 · 지금 확인하세요</div></div>`;
  notif.style.display = 'flex';
  clearTimeout(notif._hideTimer);
  notif._hideTimer = setTimeout(() => { if (notif) notif.style.display = 'none'; }, 6000);
}

/** 산책 도우미 대시보드 */
async function renderWalkerDashboard(user, myProfile) {
  const receivedRequests = await MatchingService.getReceivedRequestsRemote(user.id);
  const scheduledWalks   = MatchingService.getScheduledWalks(user.id);
  const completedWalks   = MatchingService.getCompletedWalks(user.id);
  const isAvail          = myProfile.isAvailable;

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
        <span class="dw-toggle__status">${isAvail ? '🟢 ON' : '⭕ OFF'}</span>
      </div>
    </div>
  `;

  const profileCard = `
    <div class="match-profile-card">
      <div class="match-profile-card__left">
        <div class="match-profile-card__avatar">${user.name.charAt(0)}</div>
        <div>
          <div class="match-profile-card__name">${user.name} <span class="badge badge-primary">산책 도우미</span></div>
          <div class="match-profile-card__meta">📍 ${myProfile.location} · ⏰ ${myProfile.preferredTime}${myProfile.experience ? ' · ' + myProfile.experience : ''}</div>
          ${myProfile.message ? `<div class="match-profile-card__bio">"${myProfile.message}"</div>` : ''}
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
            ${myProfile.canWalkLarge    ? '<span class="dw-size-tag">대형견 가능</span>' : ''}
            ${myProfile.canWalkMultiple ? '<span class="dw-size-tag">다중 산책 가능</span>' : ''}
          </div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="handleRemoveMatchProfile()">등록 해제</button>
    </div>
  `;

  const receivedHtml = receivedRequests.length > 0
    ? receivedRequests.map(r => {
        const fromName = MatchingService.getUserName(r.fromUserId);
        const rd = r.requestData || {};
        return `
          <div class="match-request-card ${r.status === 'accepted' ? 'match-request-card--accepted' : ''}">
            <div class="match-request-card__top">
              <div class="match-request-card__avatar">${fromName.charAt(0)}</div>
              <div class="match-request-card__info">
                <div class="match-request-card__from">${fromName}</div>
                <div class="match-request-card__detail">
                  ${rd.dogName ? `🐕 ${rd.dogName}` : ''}${rd.dogSize ? ` (${rd.dogSize === 'small' ? '소형' : rd.dogSize === 'medium' ? '중형' : '대형'})` : ''}
                  ${rd.desiredTime ? ` · ⏰ ${rd.desiredTime}` : ''}
                  ${rd.location ? ` · 📍 ${rd.location}` : ''}
                </div>
                ${rd.notes ? `<div class="match-request-card__notes">"${rd.notes}"</div>` : ''}
              </div>
            </div>
            ${r.status === 'pending' ? `
              <div class="match-request-card__alert">근처에서 산책 요청이 들어왔어요. 지금 수락하시겠어요?</div>
              <div style="display:flex; gap:8px; margin-top:10px;">
                <button class="btn btn-primary btn-sm" onclick="handleAcceptBroadcastRequest('${r.id}')">✅ 수락하기</button>
                <button class="btn btn-secondary btn-sm" onclick="handleRejectMatchRequest('${r.id}')">거절하기</button>
              </div>
            ` : r.status === 'accepted'
              ? '<div style="margin-top:8px;"><span class="badge badge-success">✓ 수락됨 · 매칭 완료</span></div>'
              : '<div style="margin-top:8px;"><span class="badge">처리됨</span></div>'}
          </div>`;
      }).join('')
    : `<div class="empty-state"><div class="empty-icon">📭</div><p>아직 받은 산책 요청이 없어요.<br>ON 상태를 유지하면 요청이 들어와요.</p></div>`;

  const scheduledHtml = scheduledWalks.map(s => {
    const pid = s.participants.find(id => id !== user.id) || s.participants[0];
    const pName = MatchingService.getUserName(pid);
    const date = new Date(s.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return `
      <div class="match-walk-card">
        <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
        <div class="match-walk-card__info"><div class="match-walk-card__name">${pName}</div><div>📅 ${date}</div></div>
        <button class="btn btn-primary btn-sm" onclick="handleCompleteWalk('${s.id}')">산책 완료</button>
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
    <div class="match-section">
      <h2 class="match-section__title">📩 받은 산책 요청 <span class="dw-count">${receivedRequests.length}</span></h2>
      ${receivedHtml}
    </div>
    ${scheduledWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">🚶 예정된 산책</h2>${scheduledHtml}</div>` : ''}
    ${completedWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">✅ 완료된 산책</h2>${completedHtml}</div>` : ''}
    <div id="review-form-container"></div>
  `);

  // 폴링 시작 — 5초마다 새 요청 확인
  startWalkerPolling(user.id);
}

/** 산책 요청자 대시보드 */
function renderRequesterDashboard(user, myProfile) {
  const availWalkers   = MatchingService.getAvailableWalkers().filter(w => w.userId !== user.id);
  const scheduledWalks = MatchingService.getScheduledWalks(user.id);
  const completedWalks = MatchingService.getCompletedWalks(user.id);

  const profileCard = `
    <div class="match-profile-card">
      <div class="match-profile-card__left">
        <div class="match-profile-card__avatar">${user.name.charAt(0)}</div>
        <div>
          <div class="match-profile-card__name">${user.name} <span class="badge badge-primary">산책 요청자</span></div>
          <div class="match-profile-card__meta">
            ${myProfile.dogName ? `🐕 ${myProfile.dogName} · ` : ''}📍 ${myProfile.location} · ⏰ ${myProfile.preferredTime || ''}
          </div>
          ${myProfile.notes ? `<div class="match-profile-card__bio">"${myProfile.notes}"</div>` : ''}
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="handleRemoveMatchProfile()">등록 해제</button>
    </div>
  `;

  const walkerListHtml = availWalkers.length > 0
    ? availWalkers.map(w => `
        <div class="match-walker-card">
          <div class="match-walker-card__avatar">${w.userName.charAt(0)}</div>
          <div class="match-walker-card__body">
            <div class="match-walker-card__name"><span class="dw-avail-dot dw-avail-dot--on"></span>${w.userName}</div>
            <div class="match-walker-card__meta">📍 ${w.location} · ⏰ ${w.preferredTime}</div>
            ${w.message ? `<div class="match-walker-card__bio">"${w.message}"</div>` : ''}
            <div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:5px;">
              ${w.canWalkLarge    ? '<span class="dw-size-tag">대형견 가능</span>' : ''}
              ${w.canWalkMultiple ? '<span class="dw-size-tag">다중 산책 가능</span>' : ''}
              ${w.experience      ? `<span class="dw-size-tag">${w.experience}</span>` : ''}
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="handleSendMatchRequest('${w.userId}')">요청 보내기</button>
        </div>`)
      .join('')
    : `<div class="empty-state"><div class="empty-icon">🔍</div><p>현재 주변에 산책 가능한 도우미가 없습니다.<br>잠시 후 다시 확인해 주세요.</p></div>`;

  const scheduledHtml = scheduledWalks.map(s => {
    const pid = s.participants.find(id => id !== user.id) || s.participants[0];
    const pName = MatchingService.getUserName(pid);
    const date = new Date(s.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return `
      <div class="match-walk-card">
        <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
        <div class="match-walk-card__info"><div class="match-walk-card__name">${pName}</div><div>📅 ${date}</div><span class="badge badge-info">예정됨</span></div>
        <button class="btn btn-primary btn-sm" onclick="handleCompleteWalk('${s.id}')">산책 완료</button>
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
      <div class="section-label">산책 요청자</div>
      <h1 class="match-hero__title">산책 도우미를<br>찾고 있어요</h1>
      <p class="match-hero__sub">현재 산책 가능한 도우미 <strong>${availWalkers.length}명</strong>이 근처에 있어요</p>
    </div>
    <div id="matching-alert"></div>
    ${profileCard}

    <div class="match-broadcast-banner">
      <div>
        <div class="match-broadcast-banner__title">📣 주변 도우미에게 산책 요청 보내기</div>
        <div class="match-broadcast-banner__sub">ON 상태인 도우미 ${availWalkers.length}명에게 알림이 전송돼요. 가장 먼저 수락한 분과 매칭됩니다.</div>
      </div>
      <button class="btn btn-primary" onclick="handleBroadcastWalkRequest()" ${availWalkers.length === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>매칭 요청 보내기</button>
    </div>

    <div class="match-section">
      <h2 class="match-section__title">🚶‍♂️ 주변 산책 가능한 도우미 <span class="dw-count">${availWalkers.length}</span></h2>
      ${walkerListHtml}
    </div>
    ${scheduledWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">📅 예정된 산책</h2>${scheduledHtml}</div>` : ''}
    ${completedWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">✅ 완료된 산책</h2>${completedHtml}</div>` : ''}
    <div id="review-form-container"></div>
  `);
}

/** 매칭 프로필 등록 해제 */
function handleRemoveMatchProfile() {
  if (!confirm('매칭 등록을 해제하시겠어요?')) return;
  const user = AuthService.getCurrentUser();
  if (!user) return;
  MatchingService.removeProfile(user.id);
  renderMatchingPage();
}

/** 도우미 가용 상태 토글 */
function handleToggleMatcherAvailability() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  MatchingService.toggleAvailability(user.id);
  renderMatchingPage();
}

/** 전체 브로드캐스트 요청 */
async function handleBroadcastWalkRequest() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  const myProfile = MatchingService.getMyProfile(user.id);
  if (!myProfile) return;

  const result = await MatchingService.broadcastWalkRequest(user.id, {
    dogName:     myProfile.dogName || '',
    dogSize:     myProfile.dogSize || '',
    location:    myProfile.location || '',
    desiredTime: myProfile.preferredTime || '',
    notes:       myProfile.notes || ''
  });

  const alertEl = document.getElementById('matching-alert');
  if (result.success) {
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-success">🎉 주변 도우미 ${result.targetCount}명에게 산책 요청을 보냈어요! 수락 대기 중...</div>`;
      setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 5000);
    }
  } else {
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
      setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 4000);
    }
  }
}

/** 브로드캐스트 요청 수락 (선착순 매칭) */
async function handleAcceptBroadcastRequest(requestId) {
  const result  = await MatchingService.acceptBroadcastRequest(requestId);
  const alertEl = document.getElementById('matching-alert');
  if (result.success) {
    stopWalkerPolling();
    if (alertEl) {
      alertEl.innerHTML = '<div class="alert alert-success">✅ 산책 요청을 수락했습니다. 매칭이 완료되었습니다!</div>';
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

/** 개별 요청 보내기 (요청자 → 특정 도우미) */
function handleSendMatchRequest(toUserId) {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }
  MatchingService.sendRequest(user.id, toUserId);
  const alertEl = document.getElementById('matching-alert');
  if (alertEl) {
    alertEl.innerHTML = '<div class="alert alert-success">매칭 요청을 보냈습니다! 🎉</div>';
    setTimeout(() => { if (alertEl) alertEl.innerHTML = ''; }, 3000);
  }
}

/** 산책 완료 */
function handleCompleteWalk(scheduleId) {
  MatchingService.completeWalk(scheduleId);
  renderMatchingPage();
  const alertEl = document.getElementById('matching-alert');
  if (alertEl) {
    alertEl.innerHTML = '<div class="alert alert-success">산책이 완료되었습니다! 🐾 10 Paw 코인이 적립되었습니다.</div>';
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
      <h3 style="margin-bottom:16px;">📝 ${targetName}님에 대한 리뷰</h3>
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

  MatchingService.addReview(scheduleId, {
    reviewerId: user.id,
    targetId: targetId,
    rating: rating,
    text: text.trim()
  });

  renderMatchingPage();
  const alertEl = document.getElementById('matching-alert');
  if (alertEl) {
    alertEl.innerHTML = '<div class="alert alert-success">리뷰가 등록되었습니다! 감사합니다 🐾</div>';
    setTimeout(() => { alertEl.innerHTML = ''; }, 3000);
  }
}

// --- 프로필 페이지 (플레이스홀더) ---
function renderProfilePage() {
  const user = AuthService.getCurrentUser();
  if (!user) {
    renderPage(`
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-logo">👤</div>
          <h2>로그인이 필요합니다</h2>
          <p style="text-align:center; color:var(--color-text-light); margin-bottom:20px;">프로필을 보려면 먼저 로그인하세요.</p>
          <button class="btn btn-primary" style="width:100%;" onclick="Router.navigate('/login')">로그인하기</button>
          <div class="auth-footer">
            계정이 없으신가요? <a href="#/register">회원가입</a>
          </div>
        </div>
      </div>
    `);
    return;
  }

  const sizeMap = { small: '소형', medium: '중형', large: '대형' };

  renderPage(`
    <div class="page-header">
      <h1>내 프로필</h1>
    </div>
    <div class="card" style="padding:24px; margin-bottom:16px;">
      <h3 style="margin-bottom:4px;">${user.nickname || user.name}</h3>
      <p style="color:var(--color-text-light); font-size:0.82rem; margin-bottom:10px;">닉네임</p>
      <p style="color:var(--color-text); font-size:0.9rem;">이름: ${user.name}</p>
      <p style="color:var(--color-text-light); font-size:0.9rem; margin-top:4px;">이메일: ${user.email}</p>
      <p style="color:var(--color-text-light); font-size:0.9rem; margin-top:4px;">코인: ${user.pawCoins || 0} PAW (${user.pawCoins || 0}원)</p>
      <p style="color:var(--color-text-muted); font-size:0.8rem; margin-top:8px;">가입일: ${new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
      <p style="color:var(--color-text-muted); font-size:0.72rem; margin-top:4px;">* 이름은 본인만 볼 수 있어요. 다른 사람에게는 닉네임만 표시돼요.</p>
      ${user.referralCode ? `<div style="margin-top:12px; background:var(--color-bg-warm); border-radius:10px; padding:10px 14px; display:inline-block;">
        <span style="font-size:0.8rem; color:var(--color-text-light);">내 추천인 코드:</span>
        <span style="font-weight:900; color:var(--color-primary-dark); margin-left:6px; letter-spacing:1px;">${user.referralCode}</span>
      </div>` : ''}
      <button class="btn btn-danger btn-sm" style="margin-top:16px;" onclick="handleLogout()">로그아웃</button>
      <button class="btn btn-sm" style="margin-top:8px; background:none; color:var(--color-text-muted); text-decoration:underline; font-size:0.8rem;" onclick="handleDeleteAccount()">회원탈퇴</button>
    </div>

    <div class="card" style="padding:24px; margin-bottom:16px;">
      <h3 style="margin-bottom:16px;">✏️ 닉네임 변경</h3>
      <div id="nickname-error"></div>
      <div style="display:flex; gap:8px;">
        <input type="text" id="profile-nickname" class="form-input" placeholder="새 닉네임 (2~12자)" maxlength="12" value="${user.nickname || ''}" style="flex:1;">
        <button class="btn btn-primary btn-sm" onclick="handleChangeNickname()">변경</button>
      </div>
      <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:6px;">닉네임은 2주에 한 번 변경할 수 있어요${user.nicknameChangedAt ? ' · 마지막 변경: ' + new Date(user.nicknameChangedAt).toLocaleDateString('ko-KR') : ''}</p>
    </div>

    <div class="card" style="padding:24px; margin-bottom:16px;">
      <h3 style="margin-bottom:16px;">🎁 추천인 코드</h3>
      <div style="background:var(--color-bg-warm); border-radius:10px; padding:12px 16px; margin-bottom:16px;">
        <span style="font-size:0.82rem; color:var(--color-text-light);">내 추천인 코드:</span>
        <span style="font-weight:900; color:var(--color-primary-dark); margin-left:6px; letter-spacing:1px;">${user.referralCode || '없음'}</span>
        <p style="font-size:0.72rem; color:var(--color-text-muted); margin-top:4px;">친구에게 공유하고, 친구가 가입 시 입력하면 1,500 PAW 코인을 받아요!</p>
      </div>
      ${user.usedReferralCode
        ? `<div style="padding:12px 16px; background:var(--color-mint-light); border-radius:10px;">
            <span style="font-size:0.85rem; font-weight:700; color:#2D8B5E;">✅ 사용한 추천인 코드: ${user.usedReferralCode}</span>
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
      <h3 style="margin-bottom:12px;">🐕 내 반려견</h3>
      ${user.dogs && user.dogs.length > 0
        ? user.dogs.map(d => `
          <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--color-border);">
            <div style="width:40px; height:40px; border-radius:50%; background:var(--color-primary-light); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🐕</div>
            <div>
              <div style="font-weight:600;">${d.name}</div>
              <div style="font-size:0.8rem; color:var(--color-text-light);">${d.breed} · ${d.age}살 · ${sizeMap[d.size] || d.size}</div>
            </div>
          </div>
        `).join('')
        : '<p style="color:var(--color-text-muted);">등록된 반려견이 없습니다.</p>'
      }
    </div>

    <div class="card" style="padding:24px;">
      <h3 style="margin-bottom:16px;">🐾 반려견 등록</h3>
      <div id="dog-register-error"></div>
      <div class="form-group">
        <label for="dog-name">이름</label>
        <input type="text" id="dog-name" class="form-input" placeholder="반려견 이름을 입력하세요">
      </div>
      <div class="form-group">
        <label for="dog-breed">품종</label>
        <select id="dog-breed" class="form-select">
          <option value="">품종을 선택하세요</option>
          ${typeof BREEDS_DATA !== 'undefined' ? BREEDS_DATA.map(b => `<option value="${b.name}">${b.name}</option>`).join('') : ''}
        </select>
      </div>
      <div class="form-group">
        <label for="dog-age">나이 (살)</label>
        <input type="number" id="dog-age" class="form-input" placeholder="나이를 입력하세요" min="0" max="30">
      </div>
      <div class="form-group">
        <label for="dog-size">크기</label>
        <select id="dog-size" class="form-select">
          <option value="">크기를 선택하세요</option>
          <option value="small">소형</option>
          <option value="medium">중형</option>
          <option value="large">대형</option>
        </select>
      </div>
      <button class="btn btn-primary" style="width:100%;" onclick="handleRegisterDog()">반려견 등록</button>
    </div>
  `);
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
    if (errEl) errEl.innerHTML = '<div class="alert alert-success">닉네임이 변경되었어요! 🐾</div>';
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
    alert(`추천인 코드가 적용되었어요! 🎉\n\n🪙 3,000 PAW 코인이 지급되었어요!\n추천인 ${result.referrerName}님에게도 1,500 PAW가 지급되었어요!`);
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

  if (!name || !breed || !age || !size) {
    const errEl = document.getElementById('dog-register-error');
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">모든 필드를 입력하세요.</div>';
    return;
  }

  const result = AuthService.registerDog(user.id, { name, breed, age: Number(age), size });
  if (result.success) {
    renderProfilePage();
  } else {
    const errEl = document.getElementById('dog-register-error');
    if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
  }
}

// --- 로그인 페이지 ---
function renderLoginPage() {
  renderPage(`
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">🐾</div>
        <h2>로그인</h2>
        <div id="login-error"></div>

        <!-- 소셜 로그인 버튼들 -->
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
          <button onclick="window.location.href='/auth/google'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#fff; border:2px solid #E5E7EB; color:#374151; cursor:pointer; transition:all 0.2s;">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style="width:20px; height:20px;"> 구글로 로그인
          </button>
          <button onclick="window.location.href='/auth/kakao'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#FEE500; border:none; color:#3C1E1E; cursor:pointer; transition:all 0.2s;">
            💬 카카오로 로그인
          </button>
          <button onclick="window.location.href='/auth/naver'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#03C75A; border:none; color:#fff; cursor:pointer; transition:all 0.2s;">
            <span style="font-weight:900; font-size:1rem;">N</span> 네이버로 로그인
          </button>
        </div>

        <!-- 구분선 -->
        <div style="display:flex; align-items:center; gap:12px; margin:20px 0;">
          <div style="flex:1; height:1px; background:var(--color-border);"></div>
          <span style="font-size:0.8rem; color:var(--color-text-muted); font-weight:600;">또는 이메일로 로그인</span>
          <div style="flex:1; height:1px; background:var(--color-border);"></div>
        </div>

        <!-- 이메일 로그인 -->
        <div class="form-group">
          <label for="login-email">이메일</label>
          <input type="email" id="login-email" class="form-input" placeholder="이메일을 입력하세요">
        </div>
        <div class="form-group">
          <label for="login-password">비밀번호</label>
          <input type="password" id="login-password" class="form-input" placeholder="비밀번호를 입력하세요">
        </div>
        <label style="display:flex; align-items:center; gap:6px; margin-bottom:16px; cursor:pointer;">
          <input type="checkbox" id="login-remember" style="width:16px; height:16px; cursor:pointer;">
          <span style="font-size:0.85rem; color:var(--color-text-light); font-weight:600;">로그인 유지</span>
        </label>
        <button class="btn btn-primary" style="width:100%;" onclick="handleLogin()">로그인</button>
        <div class="auth-footer">
          계정이 없으신가요? <a href="#/register">회원가입</a>
        </div>
      </div>
    </div>
  `);
}

// --- 회원가입 페이지 ---
function renderRegisterPage() {
  renderPage(`
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">🐾</div>
        <h2>회원가입</h2>
        <div id="register-error"></div>

        <!-- 소셜 가입 버튼들 -->
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
          <button onclick="window.location.href='/auth/google/register'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#fff; border:2px solid #E5E7EB; color:#374151; cursor:pointer; transition:all 0.2s;">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style="width:20px; height:20px;"> 구글로 가입하기
          </button>
          <button onclick="handleKakaoRegister()" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#FEE500; border:none; color:#3C1E1E; cursor:pointer; transition:all 0.2s;">
            💬 카카오로 가입하기
          </button>
          <button onclick="window.location.href='/auth/naver/register'" style="width:100%; padding:12px 16px; border-radius:var(--radius-full); font-weight:700; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:10px; background:#03C75A; border:none; color:#fff; cursor:pointer; transition:all 0.2s;">
            <span style="font-weight:900; font-size:1rem;">N</span> 네이버로 가입하기
          </button>
        </div>

        <!-- 구분선 -->
        <div style="display:flex; align-items:center; gap:12px; margin:20px 0;">
          <div style="flex:1; height:1px; background:var(--color-border);"></div>
          <span style="font-size:0.8rem; color:var(--color-text-muted); font-weight:600;">또는 이메일로 가입</span>
          <div style="flex:1; height:1px; background:var(--color-border);"></div>
        </div>

        <!-- 이메일 가입 (인증코드 방식) -->
        <div class="form-group">
          <label for="reg-name">이름</label>
          <input type="text" id="reg-name" class="form-input" placeholder="이름을 입력하세요">
        </div>
        <div class="form-group">
          <label for="reg-email">이메일</label>
          <div style="display:flex; gap:8px;">
            <input type="email" id="reg-email" class="form-input" placeholder="이메일을 입력하세요" style="flex:1;">
            <button class="btn btn-secondary btn-sm" id="send-code-btn" onclick="handleSendVerificationCode()" style="white-space:nowrap;">인증코드 발송</button>
          </div>
        </div>
        <div class="form-group" id="verify-code-group" style="display:none;">
          <label for="reg-code">인증코드</label>
          <div style="display:flex; gap:8px;">
            <input type="text" id="reg-code" class="form-input" placeholder="6자리 인증코드 입력" maxlength="6" style="flex:1; letter-spacing:4px; font-weight:700; text-align:center;">
            <button class="btn btn-primary btn-sm" onclick="handleVerifyCode()" style="white-space:nowrap;">확인</button>
          </div>
          <div id="verify-code-message" style="margin-top:6px;"></div>
        </div>
        <div class="form-group">
          <label for="reg-password">비밀번호</label>
          <input type="password" id="reg-password" class="form-input" placeholder="비밀번호를 입력하세요">
        </div>
        <input type="hidden" id="reg-email-verified" value="false">

        <div style="background:var(--color-bg-warm); border:2px solid var(--color-border); border-radius:12px; padding:16px; margin-bottom:16px;">
          <p style="font-size:0.82rem; color:var(--color-text-light); margin-bottom:10px;">Pawsitive 서비스 이용을 위해 이름, 이메일을 수집하며 회원 탈퇴 시까지 보유합니다.</p>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:6px;">
            <input type="checkbox" id="reg-agree-privacy" style="width:16px; height:16px; cursor:pointer;">
            <span style="font-size:0.83rem; font-weight:700; color:var(--color-text);">[필수] 개인정보 수집 및 이용에 동의합니다</span>
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="reg-agree-terms" style="width:16px; height:16px; cursor:pointer;">
            <span style="font-size:0.83rem; font-weight:700; color:var(--color-text);">[필수] Pawsitive 이용약관에 동의합니다</span>
          </label>
        </div>

        <button class="btn btn-primary" style="width:100%;" onclick="handleRegister()">가입하기</button>
        <div class="auth-footer">
          이미 계정이 있으신가요? <a href="#/login">로그인</a>
        </div>
      </div>
    </div>
  `);
}

// --- 로그인/회원가입 핸들러 ---

/**
 * 카카오 회원가입 — 바로 카카오 인증으로 이동
 */
function handleKakaoRegister() {
  window.location.href = '/auth/kakao/register';
}

/**
 * 소셜 회원가입 동의 페이지
 */
function renderSocialAgreePage() {
  const userData = StorageService.get('pendingSocialUser');
  if (!userData) {
    Router.navigate('/register');
    return;
  }

  const providerName = { kakao: '카카오', naver: '네이버', google: '구글' }[userData.provider] || userData.provider;

  renderPage(`
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">🐾</div>
        <h2>Pawsitive 회원가입 동의</h2>
        <div style="text-align:center; margin-bottom:20px;">
          <span class="badge badge-primary" style="font-size:0.85rem; padding:6px 16px;">${providerName} 계정: ${userData.name || '사용자'}</span>
        </div>

        <div style="background:var(--color-bg-warm); border:2px solid var(--color-border); border-radius:16px; padding:20px; margin-bottom:20px;">
          <h3 style="font-size:0.95rem; font-weight:800; margin-bottom:12px; color:var(--color-text);">📋 개인정보 수집 및 이용 동의</h3>
          <div style="font-size:0.82rem; color:var(--color-text-light); line-height:1.8;">
            <p style="margin-bottom:8px;">Pawsitive 서비스 이용을 위해 아래 정보를 수집합니다.</p>
            <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
              <tr style="border-bottom:1px solid var(--color-border);">
                <td style="padding:6px 0; font-weight:700;">수집 항목</td>
                <td style="padding:6px 0;">닉네임, 프로필 사진</td>
              </tr>
              <tr style="border-bottom:1px solid var(--color-border);">
                <td style="padding:6px 0; font-weight:700;">수집 목적</td>
                <td style="padding:6px 0;">서비스 내 프로필 표시, 커뮤니티 활동</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:700;">보유 기간</td>
                <td style="padding:6px 0;">회원 탈퇴 시까지</td>
              </tr>
            </table>
          </div>
        </div>

        <label style="display:flex; align-items:center; gap:8px; margin-bottom:12px; cursor:pointer;">
          <input type="checkbox" id="agree-privacy" style="width:18px; height:18px; cursor:pointer;">
          <span style="font-size:0.85rem; font-weight:700; color:var(--color-text);">[필수] 개인정보 수집 및 이용에 동의합니다</span>
        </label>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:20px; cursor:pointer;">
          <input type="checkbox" id="agree-terms" style="width:18px; height:18px; cursor:pointer;">
          <span style="font-size:0.85rem; font-weight:700; color:var(--color-text);">[필수] Pawsitive 이용약관에 동의합니다</span>
        </label>

        <button class="btn btn-primary" style="width:100%; opacity:0.5;" id="agree-submit-btn" onclick="handleSocialAgreeSubmit()" disabled>동의하고 가입하기 🐾</button>
        <button class="btn btn-secondary" style="width:100%; margin-top:8px;" onclick="handleSocialAgreeCancel()">취소</button>
      </div>
    </div>
  `);

  // 체크박스 이벤트
  const check1 = document.getElementById('agree-privacy');
  const check2 = document.getElementById('agree-terms');
  const btn = document.getElementById('agree-submit-btn');
  function updateBtn() {
    const allChecked = check1.checked && check2.checked;
    btn.disabled = !allChecked;
    btn.style.opacity = allChecked ? '1' : '0.5';
  }
  check1.addEventListener('change', updateBtn);
  check2.addEventListener('change', updateBtn);
}

/**
 * 소셜 동의 완료 → 실제 가입 처리
 */
function handleSocialAgreeSubmit() {
  const userData = StorageService.get('pendingSocialUser');
  if (!userData) { Router.navigate('/register'); return; }

  const socialKey = userData.provider + '_' + userData.providerId;
  const existingUsers = StorageService.get('users', []);

  const user = {
    id: StorageService.generateId(),
    email: userData.email || socialKey + '@social',
    name: userData.name || '소셜 사용자',
    nickname: '',
    passwordHash: '',
    socialKey: socialKey,
    provider: userData.provider,
    profileImage: userData.profileImage || '',
    referralCode: AuthService.generateReferralCode(),
    dogs: [],
    pawCoins: 0,
    createdAt: StorageService.now()
  };
  existingUsers.push(user);
  StorageService.set('users', existingUsers);
  StorageService.remove('pendingSocialUser');

  // 서버에 유저 동기화
  fetch('/api/users/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...user, pawCoins: 3000 })
  }).catch(() => {});

  // 가입 축하 3,000 PAW 코인 지급
  if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
    WalletService.earnCoins(user.id, 3000, '회원가입 축하 보상 🎉');
  }

  // 로그인 처리
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  StorageService.set('currentUser', safeUser);
  StorageService.set('authToken', {
    token: StorageService.generateId(),
    userId: user.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  updateNavAuth();
  // 닉네임 + 추천인 설정 페이지로 이동
  alert('🎉 회원가입을 축하해요!\n\n🪙 가입 축하 3,000 PAW 코인이 지급되었어요!\n\n닉네임과 추천인 코드를 설정해주세요~');
  Router.navigate('/welcome-setup');
}

/**
 * 소셜 동의 취소
 */
function handleSocialAgreeCancel() {
  StorageService.remove('pendingSocialUser');
  fetch('/auth/logout', { credentials: 'include' });
  Router.navigate('/register');
}

/**
 * 가입 후 닉네임 + 추천인 설정 페이지
 */
function renderWelcomeSetupPage() {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  renderPage(`
    <div class="auth-container" style="max-width:460px;">
      <div class="auth-card">
        <div style="text-align:center; margin-bottom:20px;">
          <div style="font-size:3rem;">🎉</div>
          <h2 style="margin-top:8px;">환영해요, ${user.name}님!</h2>
          <p style="color:var(--color-text-light); font-size:0.9rem;">마지막 설정만 하면 가입 완료예요~</p>
        </div>

        <div id="welcome-error"></div>

        <div class="form-group">
          <label for="setup-nickname">닉네임 설정</label>
          <input type="text" id="setup-nickname" class="form-input" placeholder="다른 사람들에게 보여질 닉네임 (2~12자)" maxlength="12">
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:4px;">커뮤니티, 산책 매칭 등에서 사용돼요</p>
        </div>

        <div class="form-group">
          <label for="setup-referral">추천인 코드 (선택)</label>
          <input type="text" id="setup-referral" class="form-input" placeholder="추천인 코드가 있다면 입력해주세요" style="text-transform:uppercase;">
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:4px;">추천인 입력 시 나에게 3,000 PAW, 추천인에게 1,500 PAW 지급! 🪙</p>
        </div>

        <div style="background:var(--color-bg-warm); border-radius:12px; padding:14px; margin-bottom:20px; text-align:center;">
          <p style="font-size:0.82rem; color:var(--color-text-light);">내 추천인 코드</p>
          <p style="font-size:1.2rem; font-weight:900; color:var(--color-primary-dark); letter-spacing:2px; margin-top:4px;">${user.referralCode || '생성 중...'}</p>
          <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:4px;">친구에게 공유하고, 친구가 가입 시 입력하면 1,500 PAW 코인을 받아요!</p>
        </div>

        <button class="btn btn-primary" style="width:100%; font-size:1rem; padding:14px;" onclick="handleWelcomeSetup()">설정 완료 🐾</button>
        <button class="btn btn-secondary" style="width:100%; margin-top:8px;" onclick="handleSkipSetup()">나중에 할게요</button>
      </div>
    </div>
  `);
}

/**
 * 닉네임 + 추천인 설정 완료 핸들러
 */
function handleWelcomeSetup() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const nickname = document.getElementById('setup-nickname')?.value?.trim();
  const referralCode = document.getElementById('setup-referral')?.value?.trim().toUpperCase();
  const errEl = document.getElementById('welcome-error');

  // 닉네임 설정
  if (!nickname) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">닉네임을 입력해주세요.</div>';
    return;
  }

  const nicknameResult = AuthService.setNickname(user.id, nickname);
  if (!nicknameResult.success) {
    if (errEl) errEl.innerHTML = `<div class="alert alert-error">${nicknameResult.error}</div>`;
    return;
  }

  // 추천인 코드 처리
  if (referralCode) {
    if (referralCode === user.referralCode) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-error">본인의 추천인 코드는 입력할 수 없어요.</div>';
      return;
    }

    const referrer = AuthService.findByReferralCode(referralCode);
    if (!referrer) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-error">존재하지 않는 추천인 코드예요.</div>';
      return;
    }

    // 추천인 코드 사용 기록 저장
    const users = StorageService.get('users', []);
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].usedReferralCode = referralCode;
      StorageService.set('users', users);
    }

    // 양쪽에 코인 지급 (입력한 사람 3000, 추천인 1500)
    if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
      WalletService.earnCoins(user.id, 3000, '추천인 코드 입력 보상');
      WalletService.earnCoins(referrer.id, 1500, (user.nickname || user.name) + '님의 추천 보상');
    }
  }

  // 완료 메시지
  let welcomeMsg = '🎉 회원가입을 축하해요!\n\n🪙 가입 축하 3,000 PAW 코인이 지급되었어요!';
  if (referralCode && AuthService.findByReferralCode(referralCode)) {
    welcomeMsg += '\n🪙 추천인 보상 3,000 PAW 코인이 추가 지급되었어요!';
    welcomeMsg += '\n\n총 6,000 PAW 코인으로 시작해요! 🐾';
  } else {
    welcomeMsg += '\n\nPawsitive에 오신 걸 환영해요! 🐾';
  }
  alert(welcomeMsg);
  Router.navigate('/');
}

/**
 * 설정 건너뛰기
 */
function handleSkipSetup() {
  const user = AuthService.getCurrentUser();
  if (user && !user.nickname) {
    // 닉네임 없으면 이름으로 기본 설정
    AuthService.setNickname(user.id, user.name);
  }
  alert('Pawsitive에 오신 걸 환영해요! 🐾\n\n닉네임과 추천인 코드는 프로필에서 언제든 설정할 수 있어요~');
  Router.navigate('/');
}

/**
 * 이메일 인증코드 발송
 */
async function handleSendVerificationCode() {
  const email = document.getElementById('reg-email')?.value;
  const errEl = document.getElementById('register-error');
  const btn = document.getElementById('send-code-btn');

  if (!email || !email.includes('@')) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">올바른 이메일을 입력해주세요.</div>';
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = '발송 중...'; }

  try {
    const res = await fetch('/api/email/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (data.success) {
      // 인증코드 입력 필드 표시
      const codeGroup = document.getElementById('verify-code-group');
      if (codeGroup) codeGroup.style.display = 'block';

      const msgEl = document.getElementById('verify-code-message');
      if (data.testMode) {
        // SMTP 미설정 → 테스트 모드: 코드를 화면에 표시
        if (msgEl) msgEl.innerHTML = `<div class="alert alert-success">테스트 모드: 인증코드는 <strong>${data.testCode}</strong> 입니다</div>`;
      } else {
        if (msgEl) msgEl.innerHTML = '<div class="alert alert-success">인증코드가 이메일로 발송되었어요! 📧</div>';
      }

      if (btn) { btn.textContent = '재발송'; btn.disabled = false; }
    } else {
      if (errEl) errEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
      if (btn) { btn.textContent = '인증코드 발송'; btn.disabled = false; }
    }
  } catch (e) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.</div>';
    if (btn) { btn.textContent = '인증코드 발송'; btn.disabled = false; }
  }
}

/**
 * 인증코드 검증
 */
async function handleVerifyCode() {
  const email = document.getElementById('reg-email')?.value;
  const code = document.getElementById('reg-code')?.value;
  const msgEl = document.getElementById('verify-code-message');

  if (!code || code.length !== 6) {
    if (msgEl) msgEl.innerHTML = '<div class="alert alert-error">6자리 인증코드를 입력해주세요.</div>';
    return;
  }

  try {
    const res = await fetch('/api/email/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();

    if (data.success) {
      if (msgEl) msgEl.innerHTML = '<div class="alert alert-success">이메일 인증 완료! ✅</div>';
      const verifiedInput = document.getElementById('reg-email-verified');
      if (verifiedInput) verifiedInput.value = 'true';
      // 이메일 필드 비활성화
      const emailInput = document.getElementById('reg-email');
      if (emailInput) emailInput.readOnly = true;
    } else {
      if (msgEl) msgEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
    }
  } catch (e) {
    if (msgEl) msgEl.innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
  }
}

/**
 * 소셜 로그인 콜백 처리
 */
function handleSocialAuthCallback() {
  const hash = window.location.hash;
  if (!hash.includes('/auth-callback')) return;

  try {
    const queryStr = hash.split('?')[1];
    if (!queryStr) return;
    const params = new URLSearchParams(queryStr);
    const userParam = params.get('user');
    if (!userParam) return;
    const userData = JSON.parse(decodeURIComponent(userParam));

    if (userData && userData.provider) {
      const existingUsers = StorageService.get('users', []);
      const socialKey = userData.provider + '_' + userData.providerId;
      let user = existingUsers.find(u => u.socialKey === socialKey);
      const action = userData.action || StorageService.get('socialAction', 'login');
      StorageService.remove('socialAction');

      if (action === 'login') {
        // 로그인 모드: 가입된 계정만 로그인 허용
        if (!user) {
          alert('가입된 계정이 없어요. 회원가입을 먼저 해주세요! 🐾');
          // 서버 세션 끊기
          fetch('/auth/logout', { credentials: 'include' });
          Router.navigate('/register');
          return;
        }
      } else {
        // 회원가입 모드: 이미 가입된 계정이면 안내
        if (user) {
          alert('이미 가입된 계정이에요! 로그인 페이지로 이동할게요 🐾');
          fetch('/auth/logout', { credentials: 'include' });
          Router.navigate('/login');
          return;
        }
        // 신규 가입 — 동의 화면을 우리가 직접 표시
        StorageService.set('pendingSocialUser', userData);
        fetch('/auth/logout', { credentials: 'include' });
        Router.navigate('/social-agree');
        return;
      }

      // 서버에 유저 동기화
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      }).catch(() => {});

      // 로그인 처리
      const safeUser = { ...user };
      delete safeUser.passwordHash;
      StorageService.set('currentUser', safeUser);
      StorageService.set('authToken', {
        token: StorageService.generateId(),
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      updateNavAuth();
      Router.navigate('/');
    }
  } catch (e) {
    console.error('[Pawsitive] 소셜 로그인 콜백 처리 오류:', e);
    Router.navigate('/login');
  }
}

async function handleLogin() {
  const email = document.getElementById('login-email')?.value;
  const password = document.getElementById('login-password')?.value;
  const remember = document.getElementById('login-remember')?.checked;
  const errEl = document.getElementById('login-error');

  if (!email || !password) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">이메일과 비밀번호를 입력하세요.</div>';
    return;
  }

  const result = await AuthService.login(email, password);
  if (result.success) {
    if (remember) {
      const token = StorageService.get('authToken');
      if (token) {
        token.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        StorageService.set('authToken', token);
      }
    }
    updateNavAuth();
    Router.navigate('/');
  } else {
    if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
  }
}

async function handleRegister() {
  const name = document.getElementById('reg-name')?.value;
  const email = document.getElementById('reg-email')?.value;
  const password = document.getElementById('reg-password')?.value;
  const emailVerified = document.getElementById('reg-email-verified')?.value;

  if (!name || !email || !password) {
    const errEl = document.getElementById('register-error');
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">모든 필드를 입력하세요.</div>';
    return;
  }

  if (emailVerified !== 'true') {
    const errEl = document.getElementById('register-error');
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">이메일 인증을 완료해주세요.</div>';
    return;
  }

  const agreePrivacy = document.getElementById('reg-agree-privacy')?.checked;
  const agreeTerms = document.getElementById('reg-agree-terms')?.checked;
  if (!agreePrivacy || !agreeTerms) {
    const errEl = document.getElementById('register-error');
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">필수 동의항목에 모두 동의해주세요.</div>';
    return;
  }

  const result = await AuthService.register({ name, email, password });
  if (result.success) {
    updateNavAuth();
    alert('🎉 회원가입을 축하해요!\n\n🪙 가입 축하 3,000 PAW 코인이 지급되었어요!\n\n닉네임과 추천인 코드를 설정해주세요~');
    Router.navigate('/welcome-setup');
  } else {
    const errEl = document.getElementById('register-error');
    if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
  }
}

/**
 * 로그아웃 핸들러
 */
function handleLogout() {
  AuthService.logout();
  window.location.replace('/auth/logout');
}

/**
 * 회원탈퇴 핸들러
 */
function handleDeleteAccount() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const pawCoins = user.pawCoins || 0;

  // 탈퇴 확인 모달 표시
  const overlay = document.createElement('div');
  overlay.id = 'delete-modal-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:32px;max-width:400px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
      <div style="font-size:3rem;margin-bottom:12px;">😢</div>
      <h3 style="font-size:1.2rem;font-weight:900;margin-bottom:16px;color:#4A3728;">정말 탈퇴하시겠어요?</h3>
      <div style="background:#FFF0F0;border:2px solid #FFD4D4;border-radius:12px;padding:16px;margin-bottom:16px;text-align:left;">
        <p style="font-size:0.85rem;color:#D32F2F;font-weight:700;margin-bottom:8px;">⚠️ 탈퇴 시 아래 내용이 모두 삭제됩니다:</p>
        <ul style="font-size:0.82rem;color:#4A3728;padding-left:18px;line-height:1.8;">
          <li>보유 중인 <strong>${pawCoins} PAW 코인</strong></li>
          <li>등록된 반려견 정보</li>
          <li>커뮤니티 활동 내역</li>
          <li>산책 매칭 기록</li>
        </ul>
        <p style="font-size:0.8rem;color:#D32F2F;margin-top:8px;font-weight:600;">삭제된 데이터는 복구할 수 없습니다.</p>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:20px;cursor:pointer;justify-content:center;">
        <input type="checkbox" id="delete-agree-check" style="width:18px;height:18px;cursor:pointer;">
        <span style="font-size:0.85rem;font-weight:700;color:#4A3728;">위 내용을 확인했으며 탈퇴에 동의합니다</span>
      </label>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button class="btn btn-secondary" onclick="document.getElementById('delete-modal-overlay').remove()">취소</button>
        <button class="btn btn-danger" id="delete-confirm-btn" onclick="executeDeleteAccount()" disabled style="opacity:0.5;">탈퇴하기</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // 체크박스 이벤트
  document.getElementById('delete-agree-check').addEventListener('change', function() {
    const btn = document.getElementById('delete-confirm-btn');
    btn.disabled = !this.checked;
    btn.style.opacity = this.checked ? '1' : '0.5';
  });
}

/**
 * 실제 탈퇴 실행
 */
function executeDeleteAccount() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  // 모달 제거
  const overlay = document.getElementById('delete-modal-overlay');
  if (overlay) overlay.remove();

  // 사용자 데이터 삭제 (카카오 unlink 안 함 — 로그인 시 동의 화면 방지)
  const users = StorageService.get('users', []);
  const filtered = users.filter(u => u.id !== user.id);
  StorageService.set('users', filtered);

  // 매칭 프로필 삭제
  if (typeof MatchingService !== 'undefined' && MatchingService.removeProfile) {
    MatchingService.removeProfile(user.id);
  }

  // 로컬 완전 로그아웃
  StorageService.remove('authToken');
  StorageService.remove('currentUser');

  // 탈퇴 완료 안내
  setTimeout(() => {
    alert('회원탈퇴가 완료되었어요.\n그동안 이용해주셔서 감사합니다 🐾');
    window.location.replace('/auth/logout');
  }, 100);
}

// ============================================================
// 도그워커 페이지
// ============================================================

const DW_SIZE_LABEL = { small: '소형견', medium: '중형견', large: '대형견' };
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
  await MatchingService.refreshFromServer();
  const user      = AuthService.getCurrentUser();
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

  // 도그워커 마커
  const nearbyWalkers = MatchingService.getNearbyWalkers(userLat, userLng, radiusKm);
  const allWalkers    = MatchingService.getAllWalkers().filter(w => w.lat && w.lng);

  // 반경 밖 워커도 회색으로 표시
  allWalkers.forEach(w => {
    const isNear = nearbyWalkers.some(n => n.userId === w.userId);
    const cls = w.isAvailable && isNear ? 'dw-map-walker--on' : 'dw-map-walker--off';
    const icon = L.divIcon({
      html: `<div class="dw-map-walker ${cls}">🦮</div>`,
      className: '', iconSize: [38, 38], iconAnchor: [19, 19]
    });
    const dist = nearbyWalkers.find(n => n.userId === w.userId);
    const distTxt = dist ? (dist.distance < 1 ? `${(dist.distance * 1000).toFixed(0)}m` : `${dist.distance.toFixed(1)}km`) : '';
    L.marker([w.lat, w.lng], { icon })
      .bindPopup(`
        <div style="min-width:150px">
          <b>${w.userName}</b> ${w.isAvailable ? '🟢' : '⭕'}<br>
          ${distTxt ? `<span style="color:#00AA76;font-weight:700">${distTxt}</span> · ` : ''}
          ${w.price ? `₩${Number(w.price).toLocaleString()}/시간` : ''}<br>
          <span style="font-size:0.8rem;color:#718096">${(w.acceptedSizes || []).map(s => DW_SIZE_LABEL[s]).join(' · ')}</span>
        </div>
      `).addTo(_dwDiscMap);
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

/** 가용 상태 토글 */
async function handleToggleAvailability() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  try {
    const result = await MatchingService.toggleAvailabilityRemote(user.id);
    const statusEl = document.getElementById('dw-avail-status');
    if (statusEl) statusEl.textContent = result.isAvailable ? '🟢 매칭 ON' : '⭕ 매칭 OFF';
  } catch(e) {
    console.error('토글 실패:', e);
  }
}

// ============================================================
// AI 도그워커 추천
// ============================================================

async function handleAIRecommend() {
  const user    = AuthService.getCurrentUser();
  const resultEl = document.getElementById('dw-ai-result');

  if (!user) { Router.navigate('/login'); return; }

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
  _aiHistory = [];  // 페이지 진입 시 초기화
  const user    = AuthService.getCurrentUser();
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

// --- 관리자 계정 자동 생성 ---
function ensureAdminAccount() {
  const adminEmail = 'pawsitivecompanyofficial@gmail.com';
  const users = StorageService.get('users', []);
  let admin = users.find(u => u.email === adminEmail);

  if (!admin) {
    admin = {
      id: StorageService.generateId(),
      email: adminEmail,
      name: 'Pawsitive 관리자',
      nickname: '관리자',
      passwordHash: AuthService.hashPassword('pawsitive2026!'),
      referralCode: 'PAW-ADMIN',
      isAdmin: true,
      dogs: [],
      pawCoins: 0,
      createdAt: StorageService.now()
    };
    users.push(admin);
    StorageService.set('users', users);
    console.log('[Pawsitive] 관리자 계정이 생성되었습니다.');
  } else if (!admin.isAdmin) {
    admin.isAdmin = true;
    StorageService.set('users', users);
  }
}

// --- 관리자 대시보드 ---
function renderAdminPage() {
  const user = AuthService.getCurrentUser();

  if (!user || !user.isAdmin) {
    renderPage(`
      <div class="not-found">
        <div class="nf-icon">🔒</div>
        <h2>접근 권한이 없습니다</h2>
        <p>관리자만 접근할 수 있는 페이지예요.</p>
        <button class="btn btn-primary" onclick="Router.navigate('/')">홈으로 돌아가기</button>
      </div>
    `);
    return;
  }

  // 전체 사용자 목록
  const allUsers = StorageService.get('users', []);
  const allPosts = StorageService.get('communityPosts', []);
  const allTransactions = StorageService.get('transactions', []);
  const totalCoins = allUsers.reduce((sum, u) => sum + (u.pawCoins || 0), 0);

  // 사용자 목록 HTML
  const usersHtml = allUsers.map((u, i) => `
    <tr style="border-bottom:1px solid var(--color-border);">
      <td style="padding:10px 8px; font-size:0.82rem;">${i + 1}</td>
      <td style="padding:10px 8px; font-size:0.82rem; font-weight:700;">${u.nickname || u.name || '미설정'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.name || '-'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.email || '-'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.provider || '이메일'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.pawCoins || 0} PAW</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.referralCode || '-'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
      <td style="padding:10px 8px;">
        ${u.isAdmin ? '<span style="font-size:0.8rem; color:var(--color-text-muted); font-weight:700;">총관리자</span>' : `
        <button class="btn btn-sm btn-secondary" onclick="adminGiveCoins('${u.id}')">코인지급</button>
        <button class="btn btn-sm" style="background:var(--color-accent); color:#fff;" onclick="adminTakeCoins('${u.id}')">코인회수</button>
        <button class="btn btn-sm btn-danger" onclick="adminDeleteUser('${u.id}', '${u.nickname || u.name}')">삭제</button>
        `}
      </td>
    </tr>
  `).join('');

  renderPage(`
    <div class="page-header">
      <h1>관리자 대시보드</h1>
      <p>Pawsitive 사이트 관리 페이지</p>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="card" style="padding:20px; text-align:center;">
        <div style="font-size:2rem;">👥</div>
        <div style="font-size:1.5rem; font-weight:900; margin-top:8px;">${allUsers.length}</div>
        <div style="font-size:0.82rem; color:var(--color-text-light);">총 회원 수</div>
      </div>
      <div class="card" style="padding:20px; text-align:center;">
        <div style="font-size:2rem;">💬</div>
        <div style="font-size:1.5rem; font-weight:900; margin-top:8px;">${allPosts.length}</div>
        <div style="font-size:0.82rem; color:var(--color-text-light);">총 게시물</div>
      </div>
      <div class="card" style="padding:20px; text-align:center;">
        <div style="font-size:2rem;">🪙</div>
        <div style="font-size:1.5rem; font-weight:900; margin-top:8px;">${totalCoins.toLocaleString()}</div>
        <div style="font-size:0.82rem; color:var(--color-text-light);">총 발행 코인</div>
      </div>
      <div class="card" style="padding:20px; text-align:center;">
        <div style="font-size:2rem;">📋</div>
        <div style="font-size:1.5rem; font-weight:900; margin-top:8px;">${allTransactions.length}</div>
        <div style="font-size:0.82rem; color:var(--color-text-light);">총 거래 수</div>
      </div>
    </div>

    <div class="card" style="padding:24px; margin-bottom:24px;">
      <h3 style="margin-bottom:16px;">공지사항 보내기</h3>
      <div class="form-group">
        <textarea id="admin-notice" class="form-input" placeholder="전체 사용자에게 보낼 공지사항을 입력하세요..." style="min-height:80px;"></textarea>
      </div>
      <button class="btn btn-primary" onclick="adminSendNotice()">공지 등록</button>
    </div>

    <div class="card" style="padding:24px;">
      <h3 style="margin-bottom:16px;">회원 목록 (${allUsers.length}명)</h3>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:2px solid var(--color-border); text-align:left;">
              <th style="padding:10px 8px; font-size:0.8rem;">#</th>
              <th style="padding:10px 8px; font-size:0.8rem;">닉네임</th>
              <th style="padding:10px 8px; font-size:0.8rem;">이름</th>
              <th style="padding:10px 8px; font-size:0.8rem;">이메일</th>
              <th style="padding:10px 8px; font-size:0.8rem;">가입방식</th>
              <th style="padding:10px 8px; font-size:0.8rem;">코인</th>
              <th style="padding:10px 8px; font-size:0.8rem;">추천코드</th>
              <th style="padding:10px 8px; font-size:0.8rem;">가입일</th>
              <th style="padding:10px 8px; font-size:0.8rem;">관리</th>
            </tr>
          </thead>
          <tbody>
            ${usersHtml || '<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--color-text-muted);">가입된 회원이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

// 관리자: 코인 지급
function adminGiveCoins(userId) {
  const amount = prompt('지급할 코인 수량을 입력하세요:');
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  const reason = prompt('지급 사유를 입력하세요:') || '관리자 지급';

  if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
    WalletService.earnCoins(userId, Number(amount), reason);
    alert(Number(amount) + ' PAW 코인이 지급되었습니다.');
    renderAdminPage();
  }
}

// 관리자: 코인 회수
function adminTakeCoins(userId) {
  const amount = prompt('회수할 코인 수량을 입력하세요:');
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  const reason = prompt('회수 사유를 입력하세요:') || '관리자 회수';

  if (typeof WalletService !== 'undefined' && WalletService.spendCoins) {
    const result = WalletService.spendCoins(userId, Number(amount), reason);
    if (result) {
      alert(Number(amount) + ' PAW 코인이 회수되었습니다.');
    } else {
      alert('코인이 부족하여 회수할 수 없습니다.');
    }
    renderAdminPage();
  }
}

// 관리자: 회원 삭제
function adminDeleteUser(userId, userName) {
  if (!confirm(userName + '님을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

  const users = StorageService.get('users', []);
  const filtered = users.filter(u => u.id !== userId);
  StorageService.set('users', filtered);

  alert(userName + '님이 삭제되었습니다.');
  renderAdminPage();
}

// 관리자: 공지사항 등록
function adminSendNotice() {
  const notice = document.getElementById('admin-notice')?.value;
  if (!notice || !notice.trim()) {
    alert('공지사항 내용을 입력해주세요.');
    return;
  }

  const notices = StorageService.get('notices', []);
  notices.unshift({
    id: StorageService.generateId(),
    text: notice.trim(),
    createdAt: StorageService.now()
  });
  StorageService.set('notices', notices);

  alert('공지사항이 등록되었습니다!');
  document.getElementById('admin-notice').value = '';
}

// --- 404 페이지 ---
function renderNotFoundPage() {
  renderPage(`
    <div class="not-found">
      <div class="nf-icon">🐾</div>
      <h2>페이지를 찾을 수 없습니다</h2>
      <p>요청하신 페이지가 존재하지 않습니다.</p>
      <button class="btn btn-primary" onclick="Router.navigate('/')">홈으로 돌아가기</button>
    </div>
  `);
}

// ============================================================
// 라우트 등록 및 앱 초기화
// ============================================================

function initApp() {
  // 서버에서 공유 데이터 로드 후 앱 시작
  StorageService.syncFromServer().then(() => {
    // 관리자 계정 자동 생성
    ensureAdminAccount();

    // 네비게이션 바 렌더링
    renderNavbar();

  // 라우트 등록
  Router.register('/', renderHomePage);
  Router.register('/breeds', renderBreedListPage);
  Router.register('/breeds/:id', renderBreedDetailPage);
  Router.register('/education', renderEducationPage);
  Router.register('/education/:id', renderEducationDetailPage);
  Router.register('/ai-symptom', renderAiPage);
  Router.register('/ai-consult', renderAiPage);
  Router.register('/ai', renderAiPage);
  Router.register('/community', renderCommunityPage);
  Router.register('/wallet', renderWalletPage);
  Router.register('/matching', renderMatchingPage);
  Router.register('/dog-walker', renderDogWalkerPage);
  Router.register('/ai-consult-claude', renderAIConsultPage);
  Router.register('/profile', renderProfilePage);
  Router.register('/admin', renderAdminPage);
  Router.register('/login', renderLoginPage);
  Router.register('/register', renderRegisterPage);
  Router.register('/auth-callback', handleSocialAuthCallback);
  Router.register('/social-agree', renderSocialAgreePage);
  Router.register('/welcome-setup', renderWelcomeSetupPage);

  // 404 핸들러
  Router.setNotFound(renderNotFoundPage);

  // 라우터 시작
  Router.init();

  console.log('[Pawsitive] 앱이 초기화되었습니다. 🐾');
  }).catch(e => {
    console.error('[Pawsitive] 서버 동기화 실패, 로컬 모드로 시작:', e);
    ensureAdminAccount();
    renderNavbar();
    Router.init();
  });
}

// DOM 로드 후 앱 초기화
document.addEventListener('DOMContentLoaded', initApp);
