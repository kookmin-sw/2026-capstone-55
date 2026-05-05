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

  navbar.innerHTML = `
    <button class="navbar__hamburger" onclick="openNavDrawer()" aria-label="메뉴">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <line x1="3" y1="5"  x2="17" y2="5"/>
        <line x1="3" y1="10" x2="17" y2="10"/>
        <line x1="3" y1="15" x2="17" y2="15"/>
      </svg>
    </button>
    <div class="navbar__brand" onclick="Router.navigate('/')"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB/8AAANtCAYAAAB2dbicAAC7kklEQVR4nOz9d5hl6V3geX4zb1WWSlUllbyEJIwkZBAIBEIWGQTCCCS8Ny0GGpo2A3T3dG+73d6dnZ3Znd5tQ89MN91D03Q33oMkEE7IC+SFvBDIq+RVKpXJqsjcP964T0alMqsyzr0RGefez+d54ok0cSNO3HvuOe/7/sx77D73uU8AAAAAAAAAwHwdv9gHAAAAAAAAAACsRvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO8B8AAAAAAAAAZk7wHwAAAAAAAABmTvAfAAAAAAAAAGZO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/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjRP+AwAAAAAAAEDjhP8AAAAAAAAA0DjhPwAAAAAAAAA0TvgPAAAAAAAAAI0T/gMAAAAAAABA44T/AAAAAAAAANA44T8AAAAAAAAANE74DwAAAAAAAACNE/4DAAAAAAAAQOOE/wAAAAAAAADQOOE/AAAAAAAAADRO+A8AAAAAAAAAjfv/AexjEOxtbCmAAAAAAElFTkSuQmCC" alt="Pawsitive" class="navbar__logo"></div>
    <div class="navbar__auth" id="nav-auth"></div>
  `;

  // 드로어 + 오버레이 초기화
  document.getElementById('nav-drawer-overlay')?.remove();
  document.getElementById('nav-drawer')?.remove();

  const overlay = document.createElement('div');
  overlay.id        = 'nav-drawer-overlay';
  overlay.className = 'nav-drawer-overlay';
  overlay.onclick   = closeNavDrawer;
  document.body.appendChild(overlay);

  const drawer = document.createElement('div');
  drawer.id        = 'nav-drawer';
  drawer.className = 'nav-drawer';
  document.body.appendChild(drawer);

  refreshDrawer();
  updateNavAuth();
}

/** 드로어 HTML을 역할에 맞게 재빌드 */
function refreshDrawer() {
  const drawer = document.getElementById('nav-drawer');
  if (!drawer) return;

  const user     = AuthService.getCurrentUser();
  const profiles = StorageService.get('matchProfiles', []);
  const myProfile = user ? profiles.find(p => p.userId === user.id) : null;
  const role      = myProfile?.role; // 'walker' | 'requester' | undefined

  const cur = Router.getPath ? Router.getPath() : location.hash.replace('#', '') || '/';

  const item = (_icon, label, route) => `
    <button class="nav-drawer__item${cur === route ? ' active' : ''}" onclick="navTo('${route}')">
      ${label}
    </button>`;

  // 역할 배지 (클릭 → 매칭 페이지, 토글 → ON/OFF)
  const isAvail = myProfile?.isAvailable !== false;
  const roleBadge = role === 'walker'
    ? `<div class="nav-drawer__role-badge nav-drawer__role-badge--walker" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;" onclick="closeNavDrawer();Router.navigate('/matching')">
        <span>산책 도우미</span>
        <button onclick="event.stopPropagation();toggleMatchAvail()" style="background:${isAvail ? '#1a1a1a' : '#ccc'}; color:#fff; border:none; border-radius:10px; padding:2px 10px; font-size:0.65rem; font-weight:700; cursor:pointer;">${isAvail ? 'ON' : 'OFF'}</button>
      </div>`
    : role === 'requester'
    ? `<div class="nav-drawer__role-badge nav-drawer__role-badge--requester" style="cursor:pointer;" onclick="closeNavDrawer();Router.navigate('/matching')">산책 요청자</div>`
    : '';

  // 산책 섹션 (역할별)
  let walkSection;
  if (role === 'walker') {
    walkSection = `
      <div class="nav-drawer__section-label">산책 서비스</div>
      ${item('🤝', '산책 관리', '/matching')}
      ${item('🗺️', 'GPS 산책 트래킹', '/walk-tracking')}`;
  } else if (role === 'requester') {
    walkSection = `
      <div class="nav-drawer__section-label">산책 서비스</div>
      ${item('🤝', '나의 산책', '/matching')}
      ${item('🗺️', 'GPS 산책 트래킹', '/walk-tracking')}`;
  } else {
    walkSection = `
      <div class="nav-drawer__section-label">산책 서비스</div>
      ${item('🤝', '산책 매칭', '/matching')}
      ${item('🗺️', 'GPS 산책 트래킹', '/walk-tracking')}`;
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
    ${item('🏠', '홈', '/')}
    <div class="nav-drawer__divider"></div>
    ${walkSection}
    <div class="nav-drawer__divider"></div>
    <div class="nav-drawer__section-label">AI 서비스</div>
    ${item('🤖', 'AI 반려견 상담', '/ai')}
    ${item('❤️', '건강 분석', '/health')}
    <div class="nav-drawer__divider"></div>
    <div class="nav-drawer__section-label">정보</div>
    ${item('🐕', '품종 정보', '/breeds')}
    ${item('📚', '교육 센터', '/education')}
    <div class="nav-drawer__divider"></div>
    ${item('💬', '커뮤니티', '/community')}
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
      navAuth.innerHTML = `
        ${isAdmin ? `<button class="nav-icon-btn" onclick="Router.navigate('/admin')" title="관리자"><span class="nav-admin-badge">관리자</span></button>` : ''}
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

// ============================================================
// 지도(Leaflet) 전역 상태
// ============================================================

let _dwRegMap = null;     // 도그워커 등록용 지도
let _dwRegMarker = null;  // 등록 지도 마커
let _dwDiscMap = null;    // 탐색(discovery)용 지도
let _dwUserLat = null;    // 현재 사용자 위도
let _dwUserLng = null;    // 현재 사용자 경도

function _cleanupMaps() {
  if (_dwRegMap)   { try { _dwRegMap.remove();  } catch(e) {} _dwRegMap  = null; }
  if (_dwDiscMap)  { try { _dwDiscMap.remove(); } catch(e) {} _dwDiscMap = null; }
  if (_walkRouteMap) { try { _walkRouteMap.remove(); } catch(e) {} _walkRouteMap = null; }
  _dwRegMarker = null;
  stopWalkRouteWatcher(); // 페이지 이동 시 walker-position 핸들러 정리
}

// ============================================================
// 페이지 렌더러
// ============================================================

/**
 * 로그인 유도 모달 — 비로그인 사용자가 기능 사용 시 표시
 */
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
      <div style="font-size:3rem;margin-bottom:12px;">🐾</div>
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

// --- 홈 페이지 ---
function renderHomePage() {
  _cleanupMaps();
  window.scrollTo(0, 0);
  const user = AuthService.getCurrentUser();
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <style>
      .hero-banner { position:relative; overflow:hidden; height:calc(100vh - 64px); min-height:520px; width:100%; }
      .hero-banner__bg { position:absolute; inset:0; background:url('/background_pawsitive.png') center/cover no-repeat; animation:heroBgSlideUp 1.2s cubic-bezier(0.16,1,0.3,1) both; }
      .hero-banner__overlay { position:absolute; inset:0; background:linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 60%, transparent 100%); }
      .hero-banner__content { position:absolute; top:50%; left:0; transform:translateY(-50%); z-index:1; padding:0 60px; max-width:540px; animation:heroContentUp 0.9s 0.25s cubic-bezier(0.16,1,0.3,1) both; }
      .hero-banner__title { font-size:clamp(2rem,4.5vw,3.2rem); font-weight:700; color:#fff; letter-spacing:-1px; line-height:1.2; margin:0 0 16px; }
      .hero-banner__title span { color:rgba(255,255,255,0.72); }
      .hero-banner__sub { font-size:0.95rem; color:rgba(255,255,255,0.82); line-height:1.7; margin-bottom:32px; }
      .hero-banner__btn { display:inline-flex; align-items:center; padding:12px 28px; border-radius:999px; background:#fff; color:#222; font-weight:700; font-size:0.9rem; border:none; cursor:pointer; transition:all 0.2s; }
      .hero-banner__btn:hover { background:#f0f0f0; transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.15); }
      .hero-banner__scroll { position:absolute; bottom:36px; left:50%; transform:translateX(-50%); z-index:2; display:flex; flex-direction:column; align-items:center; gap:8px; animation:heroScrollFloat 2.4s ease-in-out infinite; }
      .hero-banner__scroll span { font-size:0.65rem; color:rgba(255,255,255,0.7); letter-spacing:2.5px; text-transform:uppercase; font-weight:500; }
      .hero-banner__scroll svg { opacity:0.7; }
      @keyframes heroBgSlideUp { 0%{transform:translateY(60px);opacity:0.5} 100%{transform:translateY(0);opacity:1} }
      @keyframes heroContentUp { 0%{opacity:0;transform:translateY(-40%) } 100%{opacity:1;transform:translateY(-50%)} }
      @keyframes heroScrollFloat { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-10px)} }
      @media(max-width:600px){ .hero-banner{height:calc(100vh - 64px);} .hero-banner__content{padding:0 24px;} }
      .modern-footer { display:flex; justify-content:space-between; align-items:center; padding:24px 0; margin-top:60px; border-top:1px solid var(--color-border); }
      .modern-footer-item { font-size:0.72rem; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; }
      /* 서비스 소개 버블 */
      .service-intro { display:flex; justify-content:center; align-items:center; padding:56px 24px; background:#fafaf8; }
      .service-bubble { position:relative; display:inline-flex; align-items:center; gap:6px; padding:18px 36px; background:#fff; border:none; border-radius:999px; box-shadow:0 6px 32px rgba(0,0,0,0.1); cursor:pointer; font-size:1rem; font-weight:600; color:#222; letter-spacing:-0.3px; transition:all 0.25s cubic-bezier(0.16,1,0.3,1); }
      .service-bubble:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,0.14); }
      .service-bubble::after { content:''; position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); border:6px solid transparent; border-top-color:#fff; filter:drop-shadow(0 3px 3px rgba(0,0,0,0.06)); }
      .service-bubble__logo { height:56px; width:auto; margin-right:0; margin-left:-19px; object-fit:contain; }
      /* 서비스 패널 */
      .service-panel { position:fixed; top:0; right:-480px; width:min(480px,100vw); height:100vh; background:#fff; z-index:2100; box-shadow:-8px 0 48px rgba(0,0,0,0.12); transition:right 0.45s cubic-bezier(0.16,1,0.3,1); overflow-y:auto; display:flex; flex-direction:column; }
      .service-panel.open { right:0; }
      .service-panel__head { padding:32px 32px 0; display:flex; align-items:center; justify-content:space-between; }
      .service-panel__logo { height:28px; width:auto; margin-left:-8px; }
      .service-panel__close { width:36px; height:36px; border:none; background:#f4f4f2; border-radius:50%; cursor:pointer; font-size:1.1rem; color:#666; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
      .service-panel__close:hover { background:#eee; }
      .service-panel__body { padding:28px 32px 48px; flex:1; }
      .service-panel__tag { display:inline-block; padding:4px 12px; border-radius:999px; background:#f0f0ec; font-size:0.72rem; font-weight:700; color:#888; letter-spacing:1px; text-transform:uppercase; margin-bottom:16px; }
      .service-panel__title { font-size:1.4rem; font-weight:700; letter-spacing:-0.5px; line-height:1.35; margin-bottom:24px; }
      .service-panel__item { display:flex; gap:16px; padding:20px 0; border-bottom:1px solid #f0f0ee; }
      .service-panel__item:last-child { border-bottom:none; }
      .service-panel__item-icon { width:44px; height:44px; border-radius:12px; background:#f8f8f6; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; }
      .service-panel__item-text h4 { font-size:0.92rem; font-weight:700; margin:0 0 4px; }
      .service-panel__item-text p { font-size:0.82rem; color:#888; line-height:1.6; margin:0; }
      .service-panel-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.28); z-index:2099; opacity:0; pointer-events:none; transition:opacity 0.3s; backdrop-filter:blur(2px); }
      .service-panel-overlay.open { opacity:1; pointer-events:all; }
    </style>
    <div class="hero-banner">
      <div class="hero-banner__bg"></div>
      <div class="hero-banner__overlay"></div>
      <div class="hero-banner__content">
        <h1 class="hero-banner__title">반려견과<br>함께하는<br><span>더 나은 일상.</span></h1>
        <p class="hero-banner__sub">AI 건강 상담부터 산책 매칭까지,<br>당신과 반려견을 위한 공간.</p>
        ${!user
          ? `<button class="hero-banner__btn" onclick="Router.navigate('/register')">시작하기 →</button>`
          : `<button class="hero-banner__btn" onclick="Router.navigate('/dog-walker')">도그워커 찾기 →</button>`
        }
      </div>
      <div class="hero-banner__scroll">
        <span>scroll to explore</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 8 10 14 16 8"/>
        </svg>
      </div>
    </div>
    <div class="service-intro">
      <button class="service-bubble" onclick="openServicePanel()">
        <img src="/pawsitive_logo_transparent.png" class="service-bubble__logo" alt="Pawsitive">
        는 어떤 서비스일까요?
      </button>
    </div>

    <div id="service-panel" class="service-panel">
      <div class="service-panel__head">
        <img src="/pawsitive_logo_transparent.png" class="service-panel__logo" alt="Pawsitive">
        <button class="service-panel__close" onclick="closeServicePanel()">✕</button>
      </div>
      <div class="service-panel__body">
        <span class="service-panel__tag">서비스 소개</span>
        <h2 class="service-panel__title">반려견과 함께하는<br>더 나은 일상을 만들어요</h2>
        <div class="service-panel__item">
          <div class="service-panel__item-icon">🦮</div>
          <div class="service-panel__item-text">
            <h4>산책 도우미 매칭</h4>
            <p>추후 서비스 설명을 입력해주세요.</p>
          </div>
        </div>
        <div class="service-panel__item">
          <div class="service-panel__item-icon">🩺</div>
          <div class="service-panel__item-text">
            <h4>AI 건강 진단</h4>
            <p>추후 서비스 설명을 입력해주세요.</p>
          </div>
        </div>
        <div class="service-panel__item">
          <div class="service-panel__item-icon">💬</div>
          <div class="service-panel__item-text">
            <h4>AI 반려견 상담</h4>
            <p>추후 서비스 설명을 입력해주세요.</p>
          </div>
        </div>
        <div class="service-panel__item">
          <div class="service-panel__item-icon">🐕</div>
          <div class="service-panel__item-text">
            <h4>품종 정보 & 교육 센터</h4>
            <p>추후 서비스 설명을 입력해주세요.</p>
          </div>
        </div>
      </div>
    </div>
    <div id="service-panel-overlay" class="service-panel-overlay" onclick="closeServicePanel()"></div>

    <div class="page-content">
      <div class="home-section">
        <div class="home-section__hd">
          <span class="home-section__title">품종 정보</span>
          <button class="home-section__more" onclick="Router.navigate('/breeds')">전체보기 →</button>
        </div>
        <div class="grid-3" id="home-breed-grid">${renderBreedCards(BreedService.getAll().slice(0, 6))}</div>
      </div>
      <div class="home-section">
        <div class="home-section__hd">
          <span class="home-section__title">교육 센터</span>
          <button class="home-section__more" onclick="Router.navigate('/education')">전체보기 →</button>
        </div>
        <div class="grid-3">${renderEducationCards(EducationService.getByCategory('all').slice(0, 6), user ? EducationService.getProgress(user.id).completedIds : [])}</div>
      </div>
      <div class="modern-footer">
        <span class="modern-footer-item">© 2026 Pawsitive</span>
        <span class="modern-footer-item">Seoul, Korea</span>
      </div>
    </div>
  `;
  setTimeout(() => BreedImageService.loadAll(), 100);
}


// --- 품종 목록 페이지 (탭: 백과사전 / AI 추천) ---
let breedPageTab = 'recommend'; // 'encyclopedia' | 'recommend'

function renderBreedListPage() {
  renderPage(`
    <div class="page-header">
      <h1>품종 정보</h1>
      <p>우리 아이 품종의 특성과 주의사항을 알아보세요</p>
    </div>
    <div class="breed-tabs" style="display:flex; gap:0; margin-bottom:20px; border-radius:12px; overflow:hidden; border:2px solid var(--color-primary, #7C4DFF);">
      <button id="tab-recommend" class="breed-tab ${breedPageTab === 'recommend' ? 'breed-tab--active' : ''}" onclick="switchBreedTab('recommend')" style="flex:1; padding:12px 16px; border:none; cursor:pointer; font-weight:700; font-size:0.95rem; transition:all 0.2s;">
        AI 맞춤 추천
      </button>
      <button id="tab-encyclopedia" class="breed-tab ${breedPageTab === 'encyclopedia' ? 'breed-tab--active' : ''}" onclick="switchBreedTab('encyclopedia')" style="flex:1; padding:12px 16px; border:none; cursor:pointer; font-weight:700; font-size:0.95rem; transition:all 0.2s;">
        품종 백과사전
      </button>
    </div>
    <div id="breed-tab-content"></div>
  `);
  renderBreedTabContent();
}

function switchBreedTab(tab) {
  breedPageTab = tab;
  // 탭 버튼 스타일 업데이트
  document.getElementById('tab-encyclopedia')?.classList.toggle('breed-tab--active', tab === 'encyclopedia');
  document.getElementById('tab-recommend')?.classList.toggle('breed-tab--active', tab === 'recommend');
  renderBreedTabContent();
}

function renderBreedTabContent() {
  const container = document.getElementById('breed-tab-content');
  if (!container) return;

  if (breedPageTab === 'encyclopedia') {
    container.innerHTML = `
      <div class="search-bar">
        <span class="search-icon" style="font-size:0.9rem; color:#999;">&#9906;</span>
        <input type="text" id="breed-search" placeholder="품종 이름으로 검색..." oninput="handleBreedSearch(this.value)">
      </div>
      <div class="grid-2" id="breed-list">
        ${renderBreedCards(BreedService.getAll())}
      </div>
    `;
    setTimeout(() => BreedImageService.loadAll(), 100);
  } else {
    container.innerHTML = renderBreedRecommendUI();
  }
}

// --- AI 맞춤 품종 추천 UI ---
function renderBreedRecommendUI() {
  return `
    <div style="padding:24px; margin-bottom:20px; border:1px solid var(--color-border); border-radius:16px; text-align:center;">
      <h2 style="margin-bottom:4px; font-size:1.1rem; font-weight:700;">나에게 맞는 반려견 찾기</h2>
      <p style="color:var(--color-text-muted); margin-bottom:20px; font-size:0.85rem;">생활 환경과 선호도를 선택하면 AI가 맞춤 추천해드려요</p>
      <button class="btn btn-primary" onclick="openBreedRecFlow()" style="padding:14px 32px; font-size:0.95rem;">추천 시작하기</button>
    </div>
    <div id="breed-recommend-result"></div>

    <div id="breed-rec-modal" style="display:none; position:fixed; inset:0; z-index:5000; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:#fff; border-radius:20px; width:100%; max-width:540px; min-height:440px; padding:48px 40px; position:relative; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.15);">
          <button onclick="closeBreedRecFlow()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.2rem; color:#999; cursor:pointer;">✕</button>
          <div id="breed-rec-progress" style="display:flex; gap:4px; margin-bottom:32px;"></div>
          <div id="breed-rec-content" style="flex:1; display:flex; flex-direction:column;"></div>
        </div>
      </div>
    </div>
  `;
}

let _breedRecStep = 0;
let _breedRecData = {};
const _breedRecSteps = [
  { key: 'size', question: '선호하는 크기는?', type: 'cards', options: [
    { value: 'any', label: '상관없음', desc: '' }, { value: 'small', label: '소형', desc: '10kg 이하' },
    { value: 'medium', label: '중형', desc: '10~25kg' }, { value: 'large', label: '대형', desc: '25kg 이상' }
  ]},
  { key: 'exerciseLevel', question: '원하는 운동량은?', type: 'cards', options: [
    { value: 'any', label: '상관없음', desc: '' }, { value: 'low', label: '적음', desc: '하루 30분 이하' },
    { value: 'medium', label: '보통', desc: '30분~1시간' }, { value: 'high', label: '많음', desc: '1시간 이상' }
  ]},
  { key: 'groomingLevel', question: '미용 관리는?', type: 'cards', options: [
    { value: 'any', label: '상관없음', desc: '' }, { value: 'low', label: '적음', desc: '관리 편한' },
    { value: 'medium', label: '보통', desc: '' }, { value: 'high', label: '많음', desc: '미용 즐기는' }
  ]},
  { key: 'trainability', question: '훈련 용이성은?', type: 'cards', options: [
    { value: 'any', label: '상관없음', desc: '' }, { value: 'high', label: '높음', desc: '초보자도 쉽게' },
    { value: 'medium', label: '보통', desc: '' }, { value: 'low', label: '낮음', desc: '경험자 추천' }
  ]},
  { key: 'barkingLevel', question: '짖음 정도는?', type: 'cards', options: [
    { value: 'any', label: '상관없음', desc: '' }, { value: 'low', label: '적음', desc: '조용한 견종' },
    { value: 'medium', label: '보통', desc: '' }, { value: 'high', label: '많음', desc: '' }
  ]},
  { key: 'environment', question: '생활 환경은?', sub: '해당하는 것을 선택해주세요', type: 'cards', options: [
    { value: 'apartment', label: '아파트', desc: '' }, { value: 'house', label: '주택/마당', desc: '' },
    { value: 'child', label: '아이가 있어요', desc: '' }, { value: 'any', label: '상관없음', desc: '' }
  ]},
  { key: 'freetext', question: '추가로 원하는 조건이 있나요?', sub: '없으면 건너뛰어도 돼요', type: 'textarea', placeholder: '예: 털이 잘 안 빠지는 견종, 처음 키우는 초보예요...', required: false }
];

function openBreedRecFlow() { _breedRecStep = 0; _breedRecData = {}; document.getElementById('breed-rec-modal').style.display = 'block'; renderBreedRecStep(); }
function closeBreedRecFlow() { document.getElementById('breed-rec-modal').style.display = 'none'; }

function renderBreedRecStep() {
  const step = _breedRecSteps[_breedRecStep]; const total = _breedRecSteps.length;
  const content = document.getElementById('breed-rec-content');
  const progress = document.getElementById('breed-rec-progress');
  progress.innerHTML = Array.from({length:total}, (_,i) => `<div style="flex:1; height:3px; border-radius:2px; background:${i <= _breedRecStep ? '#1a1a1a' : '#e5e3e0'}; transition:background 0.3s;"></div>`).join('');
  let inputHtml = '';
  if (step.type === 'cards') {
    inputHtml = `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:24px;">${step.options.map(o => `<button onclick="selectBreedRecCard('${step.key}','${o.value}')" style="flex:1; min-width:90px; padding:18px 14px; border:2px solid ${_breedRecData[step.key]===o.value?'#1a1a1a':'#e5e3e0'}; border-radius:14px; background:${_breedRecData[step.key]===o.value?'#1a1a1a':'#fff'}; color:${_breedRecData[step.key]===o.value?'#fff':'#1a1a1a'}; text-align:center; cursor:pointer; transition:all 0.15s;"><div style="font-size:0.92rem; font-weight:700;">${o.label}</div>${o.desc ? `<div style="font-size:0.7rem; opacity:0.7; margin-top:3px;">${o.desc}</div>` : ''}</button>`).join('')}</div>`;
  } else if (step.type === 'textarea') {
    inputHtml = `<textarea id="breed-rec-input" class="form-input" placeholder="${step.placeholder||''}" rows="3" style="font-size:1rem; padding:14px 16px; border-radius:12px; margin-top:24px; resize:none;">${_breedRecData[step.key]||''}</textarea>`;
  }
  const isLast = _breedRecStep === total - 1;
  content.innerHTML = `<div style="flex:1;"><h2 style="font-size:1.6rem; font-weight:700; letter-spacing:-0.5px; line-height:1.3;">${step.question}</h2>${step.sub?`<p style="font-size:0.88rem; color:#999; margin-top:6px;">${step.sub}</p>`:''}${inputHtml}</div><div style="display:flex; gap:8px; margin-top:24px;">${_breedRecStep>0?`<button onclick="_breedRecStep--;renderBreedRecStep()" style="flex:1; padding:16px; border:1.5px solid #e5e3e0; border-radius:14px; background:#fff; font-size:0.9rem; font-weight:600; cursor:pointer;">이전</button>`:``}${!step.required&&step.type!=='cards'?`<button onclick="_breedRecData[_breedRecSteps[_breedRecStep].key]='';${isLast?'finishBreedRec()':'_breedRecStep++;renderBreedRecStep()'}" style="flex:1; padding:16px; border:1.5px solid #e5e3e0; border-radius:14px; background:#fff; font-size:0.9rem; font-weight:600; color:#999; cursor:pointer;">건너뛰기</button>`:``}<button onclick="${isLast?'finishBreedRec()':'nextBreedRecStep()'}" style="flex:2; padding:16px; border:none; border-radius:14px; background:#1a1a1a; color:#fff; font-size:1rem; font-weight:700; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.15);">${isLast?'추천 받기':'다음'}</button></div>`;
}

function selectBreedRecCard(key, value) { _breedRecData[key] = value; renderBreedRecStep(); setTimeout(() => nextBreedRecStep(), 300); }
function nextBreedRecStep() { const step = _breedRecSteps[_breedRecStep]; const input = document.getElementById('breed-rec-input'); if (input) _breedRecData[step.key] = input.value.trim(); if (_breedRecStep < _breedRecSteps.length - 1) { _breedRecStep++; renderBreedRecStep(); } }

function finishBreedRec() {
  const input = document.getElementById('breed-rec-input');
  if (input) _breedRecData[_breedRecSteps[_breedRecStep].key] = input.value.trim();
  closeBreedRecFlow();
  // 기존 handleBreedRecommend 호출
  const resultEl = document.getElementById('breed-recommend-result');
  if (resultEl) resultEl.innerHTML = '<div style="text-align:center; padding:32px;"><div class="spinner"></div><p style="color:var(--color-text-muted); margin-top:12px;">383종의 품종 데이터를 분석하고 있어요...</p></div>';
  _runBreedRecommendFromFlow(_breedRecData);
}

async function _runBreedRecommendFromFlow(data) {
  const resultEl = document.getElementById('breed-recommend-result');
  if (!resultEl) return;
  const preferences = {
    size: data.size || 'any', exerciseLevel: data.exerciseLevel || 'any',
    groomingLevel: data.groomingLevel || 'any', trainability: data.trainability || 'any',
    barkingLevel: data.barkingLevel || 'any',
    childFriendly: data.environment === 'child', apartmentFriendly: data.environment === 'apartment',
    freeText: data.freetext || ''
  };
  try {
    const res = await fetch('/api/ai/recommend-breed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences, count: 3 }) });
    const result = await res.json();
    if (result.success) {
      renderBreedRecommendResult(result.recommendations, result.summary, result.totalCandidates, resultEl);
    } else {
      resultEl.innerHTML = '<div class="alert alert-error">' + (result.error || '추천에 실패했습니다.') + '</div>';
    }
  } catch(e) {
    resultEl.innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
  }
}

// --- AI 품종 추천 요청 핸들러 ---
async function handleBreedRecommend() {
  const btn = document.getElementById('rec-submit-btn');
  const resultEl = document.getElementById('breed-recommend-result');

  const preferences = {
    size: document.getElementById('rec-size')?.value || 'any',
    exerciseLevel: document.getElementById('rec-exercise')?.value || 'any',
    groomingLevel: document.getElementById('rec-grooming')?.value || 'any',
    trainability: document.getElementById('rec-trainability')?.value || 'any',
    barkingLevel: document.getElementById('rec-barking')?.value || 'any',
    childFriendly: document.getElementById('rec-child')?.checked || false,
    apartmentFriendly: document.getElementById('rec-apartment')?.checked || false,
    freeText: document.getElementById('rec-freetext')?.value?.trim() || ''
  };
  const count = parseInt(document.getElementById('rec-count')?.value) || 3;

  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> AI가 분석 중...'; }
  if (resultEl) resultEl.innerHTML = `
    <div class="card" style="padding:40px; text-align:center;">
      <div class="spinner" style="margin:0 auto 16px;"></div>
      <p style="color:var(--color-text-muted);">383종의 품종 데이터를 분석하고 있어요...</p>
      <p style="color:var(--color-text-muted); font-size:0.85rem;">잠시만 기다려주세요</p>
    </div>
  `;

  try {
    const res = await fetch('/api/ai/recommend-breed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences, count })
    });
    const data = await res.json();

    if (data.success && data.recommendations) {
      resultEl.innerHTML = renderBreedRecommendResult(data);
      // 추천 결과 견종 이미지 로드
      setTimeout(() => BreedImageService.loadAll(), 100);
    } else if (data.success && data.rawReply) {
      // JSON 파싱 실패 시 원본 텍스트 표시
      const formatted = data.rawReply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      resultEl.innerHTML = `<div class="card" style="padding:24px; line-height:1.8;">${formatted}</div>`;
    } else {
      resultEl.innerHTML = `<div class="alert alert-error">${data.error || '추천에 실패했어요. 다시 시도해주세요.'}</div>`;
    }
  } catch (e) {
    resultEl.innerHTML = `<div class="alert alert-error">서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.</div>`;
  }

  if (btn) { btn.disabled = false; btn.innerHTML = 'AI 맞춤 추천 받기'; }
}

// --- 추천 결과 렌더링 ---
function renderBreedRecommendResult(data) {
  const { recommendations, summary, totalCandidates } = data;

  let html = '';

  if (summary) {
    html += `<div class="card" style="padding:16px 20px; margin-bottom:16px; background:var(--color-bg-warm);">
      <p style="font-size:0.95rem; margin:0;"><strong>AI 분석 결과</strong> — ${summary}</p>
      <p style="font-size:0.8rem; color:var(--color-text-muted); margin:4px 0 0;">총 ${totalCandidates || '?'}종 후보 중 ${recommendations.length}종 추천</p>
    </div>`;
  }

  recommendations.forEach((rec, idx) => {
    const breed = BreedService.getById(rec.id);
    const sizeMap = { small: '소형', medium: '중형', large: '대형' };

    html += `
    <div class="card" style="padding:0; margin-bottom:16px; overflow:hidden;">
      <!-- 이미지 상단 배치 -->
      <div style="position:relative;">
        <div class="breed-img" data-breed-id="${rec.id}" data-fit-contain style="width:100%; height:220px; background:linear-gradient(135deg, #FFB3C6, #C9A9E9); display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:#fff; font-weight:700;">${rec.name.charAt(0)}</div>
        <div style="position:absolute; top:10px; left:10px; background:var(--color-primary, #7C4DFF); color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.2);">${idx + 1}</div>
        ${rec.matchScore ? `<div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:#FFD700; padding:4px 10px; border-radius:10px; font-size:0.85rem; font-weight:700;">${rec.matchScore}점</div>` : ''}
      </div>
      <!-- 정보 -->
      <div style="padding:16px 20px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
          <h3 style="margin:0; font-size:1.15rem;">${rec.name}</h3>
          <span style="font-size:0.8rem; color:var(--color-text-muted);">${rec.nameEn || ''}</span>
          ${breed ? `<span class="badge badge-primary" style="font-size:0.7rem;">${sizeMap[breed.size] || ''}</span>` : ''}
        </div>
        <p style="font-size:0.9rem; line-height:1.7; margin-bottom:12px; color:var(--color-text);">${rec.reason}</p>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px;">
          ${rec.pros ? `<div style="flex:1; min-width:140px;"><div style="font-size:0.8rem; font-weight:700; color:#4CAF50; margin-bottom:6px;">장점</div>${rec.pros.map(p => `<div style="font-size:0.85rem; padding:2px 0;">• ${p}</div>`).join('')}</div>` : ''}
          ${rec.cons ? `<div style="flex:1; min-width:140px;"><div style="font-size:0.8rem; font-weight:700; color:#FF9800; margin-bottom:6px;">주의점</div>${rec.cons.map(c => `<div style="font-size:0.85rem; padding:2px 0;">• ${c}</div>`).join('')}</div>` : ''}
        </div>
        ${rec.tip ? `<div style="background:var(--color-bg-warm); padding:10px 14px; border-radius:10px; font-size:0.85rem; margin-bottom:12px;"><strong>Tip:</strong> ${rec.tip}</div>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/breeds/${rec.id}')" style="margin-top:2px;">상세 정보 보기 →</button>
      </div>
    </div>`;
  });

  return html;
}

function renderBreedCards(breeds) {
  if (breeds.length === 0) {
    return `<div class="empty-state" style="grid-column: 1/-1;">
      <p>검색 결과가 없습니다</p>
    </div>`;
  }
  const sizeMap = { small: '소형', medium: '중형', large: '대형' };
  const exerciseMap = { low: '낮음', medium: '보통', high: '높음' };
  return breeds.map(breed => `
    <div class="card" onclick="Router.navigate('/breeds/${breed.id}')" style="cursor:pointer;">
      <div class="card__image breed-img" data-breed-id="${breed.id}" style="background: linear-gradient(135deg, #FFB3C6, #C9A9E9); display:flex; align-items:center; justify-content:center; font-size:1rem; color:#fff; font-weight:700; position:relative;">${breed.name.charAt(0)}</div>
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
      <div id="breed-detail-img" data-breed-id="${breed.id}" data-fit-contain style="width:100%; height:300px; background: linear-gradient(135deg, #FFB3C6, #C9A9E9); border-radius: var(--radius-lg); display:flex; align-items:center; justify-content:center; font-size:5rem; margin-bottom:16px; position:relative;">🐕</div>
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

  const categories = [
    { key: 'all', label: '전체', color: '#1a1a1a' },
    { key: 'basics', label: '기본상식', color: '#6366f1' },
    { key: 'body-language', label: '바디랭귀지', color: '#8b5cf6' },
    { key: 'training', label: '훈련', color: '#ec4899' },
    { key: 'health', label: '건강관리', color: '#ef4444' },
    { key: 'nutrition', label: '영양/식이', color: '#f59e0b' },
    { key: 'grooming', label: '미용/관리', color: '#10b981' },
    { key: 'safety', label: '안전', color: '#3b82f6' },
    { key: 'puppy', label: '퍼피케어', color: '#f472b6' },
    { key: 'senior', label: '노견케어', color: '#78716c' },
    { key: 'law', label: '법률/에티켓', color: '#64748b' }
  ];

  renderPage(`
    <div class="page-header">
      <h1>반려견 교육 센터</h1>
      <p>반려견과 행복하게 살기 위한 모든 지식을 배워보세요</p>
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
    <div class="tabs" style="flex-wrap:wrap; gap:4px;">
      ${categories.map(c => `<button class="tab${c.key === 'all' ? ' active' : ''}" onclick="filterEducation('${c.key}', this)" style="font-size:0.82rem; padding:8px 12px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${c.color}; margin-right:5px; vertical-align:middle;"></span>${c.label}</button>`).join('')}
    </div>
    <div class="grid-2" id="education-list">
      ${renderEducationCards(EducationService.getByCategory('all'), progress.completedIds)}
    </div>
  `);
}

function renderEducationCards(items, completedIds) {
  if (items.length === 0) {
    return `<div class="empty-state" style="grid-column:1/-1;">
      <p>콘텐츠가 없습니다</p>
    </div>`;
  }
  completedIds = completedIds || [];
  const catMeta = {
    basics: { label: '기본상식', color: '#6366f1', bg: '#eef2ff' },
    'body-language': { label: '바디랭귀지', color: '#8b5cf6', bg: '#f5f3ff' },
    training: { label: '훈련', color: '#ec4899', bg: '#fdf2f8' },
    health: { label: '건강관리', color: '#ef4444', bg: '#fef2f2' },
    nutrition: { label: '영양/식이', color: '#f59e0b', bg: '#fffbeb' },
    grooming: { label: '미용/관리', color: '#10b981', bg: '#ecfdf5' },
    safety: { label: '안전', color: '#3b82f6', bg: '#eff6ff' },
    puppy: { label: '퍼피케어', color: '#f472b6', bg: '#fdf2f8' },
    senior: { label: '노견케어', color: '#78716c', bg: '#f5f5f4' },
    law: { label: '법률/에티켓', color: '#64748b', bg: '#f8fafc' },
    posture: { label: '자세', color: '#8b5cf6', bg: '#f5f3ff' },
    leash: { label: '리드줄', color: '#ec4899', bg: '#fdf2f8' }
  };
  return items.map(item => {
    const isCompleted = completedIds.includes(item.id);
    const meta = catMeta[item.category] || { label: item.category, color: '#999', bg: '#f5f5f5' };
    const imgUrl = '';
    return `
    <div class="card" onclick="Router.navigate('/education/${item.id}')" style="cursor:pointer; overflow:hidden; position:relative;">
      <div style="height:4px; background:${meta.color};"></div>
      <div class="card__body" style="padding-top:12px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
          <span style="display:inline-block; padding:3px 10px; border-radius:6px; font-size:0.72rem; font-weight:600; background:${meta.bg}; color:${meta.color};">${meta.label}</span>
          ${isCompleted ? `<span style="display:inline-block; padding:3px 10px; border-radius:6px; font-size:0.72rem; font-weight:600; background:#d1fae5; color:#065f46;">완료</span>` : ''}
        </div>
        <div class="card__title" style="font-size:0.95rem; line-height:1.4;">${item.title}</div>
        <div class="card__text" style="margin-top:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-size:0.82rem; color:#777;">
          ${item.body.substring(0, 80)}...
        </div>
        <div style="margin-top:10px; display:flex; align-items:center; gap:6px;">
          <span style="font-size:0.72rem; color:#aaa;">${item.quiz ? item.quiz.length + '문제' : ''}</span>
          <span style="flex:1;"></span>
          <span style="font-size:0.75rem; color:${meta.color}; font-weight:600;">학습하기 &rarr;</span>
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

  const catMap = {
    basics: '기본상식', 'body-language': '바디랭귀지', training: '훈련',
    health: '건강관리', nutrition: '영양/식이', grooming: '미용/관리',
    safety: '안전', puppy: '퍼피케어', senior: '노견케어', law: '법률/에티켓',
    posture: '자세', leash: '리드줄'
  };
  const user = AuthService.getCurrentUser();
  const progress = user ? EducationService.getProgress(user.id) : { completedIds: [] };
  const isCompleted = progress.completedIds.includes(content.id);

  let completeButtonHtml = '';
  const hasQuiz = content.quiz && content.quiz.length > 0;

  if (isCompleted) {
    completeButtonHtml = `
      <div style="margin-top:24px; padding:16px; background:#d1fae5; border-radius:var(--radius-md, 8px); text-align:center;">
        <span style="font-size:1.2rem;">✅</span>
        <span style="font-weight:600; color:#065f46; margin-left:8px;">이미 완료한 콘텐츠입니다</span>
      </div>`;
  } else if (hasQuiz) {
    completeButtonHtml = `
      <div id="edu-quiz-section" style="margin-top:24px;">
        <div class="card" style="padding:24px;">
          <h3 style="margin-bottom:4px;">📝 학습 확인 퀴즈</h3>
          <p style="color:var(--color-text-muted); font-size:0.85rem; margin-bottom:20px;">3문제 중 2문제 이상 맞추면 통과!</p>
          ${content.quiz.map((q, qi) => `
            <div class="quiz-question" style="margin-bottom:20px; padding:16px; background:var(--color-bg-warm); border-radius:12px;">
              <p style="font-weight:700; margin-bottom:10px;">Q${qi + 1}. ${q.question}</p>
              <div style="display:grid; gap:8px;">
                ${q.options.map((opt, oi) => `
                  <label class="quiz-option" id="quiz-opt-${qi}-${oi}" style="display:flex; align-items:center; gap:10px; padding:10px 14px; background:#fff; border:2px solid var(--color-border, #e5e5e5); border-radius:10px; cursor:pointer; transition:all 0.2s; font-size:0.9rem;" onclick="selectQuizOption(${qi}, ${oi})">
                    <input type="radio" name="quiz-${qi}" value="${oi}" style="display:none;">
                    <span class="quiz-radio" style="width:20px; height:20px; border:2px solid #ccc; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s;"></span>
                    <span>${opt}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <div id="quiz-result" style="display:none; margin-bottom:16px;"></div>
          <button class="btn btn-primary" id="quiz-submit-btn" onclick="submitEducationQuiz('${content.id}')" style="width:100%; padding:14px; font-size:1rem;">
            🎯 정답 확인하기
          </button>
        </div>
      </div>`;
  } else {
    // 퀴즈 없는 콘텐츠 (기존 완료 버튼)
    if (user) {
      completeButtonHtml = `
        <div style="margin-top:24px; text-align:center;">
          <button class="btn btn-primary" id="complete-btn" onclick="handleCompleteEducation('${content.id}')" style="padding:12px 32px; font-size:1rem;">✅ 완료</button>
        </div>`;
    } else {
      completeButtonHtml = `
        <div style="margin-top:24px; text-align:center;">
          <button class="btn btn-primary" onclick="showLoginModal('학습 완료를 기록하려면 로그인이 필요해요!')" style="padding:12px 32px; font-size:1rem;">✅ 완료</button>
        </div>`;
    }
  }

  let bodyHtml = content.body;

  renderPage(`
    <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/education')" style="margin-bottom:16px;">&larr; 목록으로</button>
    <div class="detail-header">
      <span class="badge badge-primary">${catMap[content.category]}</span>
      <h1 style="margin-top:8px;">${content.title}</h1>
    </div>
    <div class="detail-section" style="padding:20px;">
      <div style="white-space:pre-line; line-height:1.8; font-size:0.95rem;">${bodyHtml}</div>
    </div>
    ${completeButtonHtml}
  `);
}

/**
 * 퀴즈 옵션 선택
 */
function selectQuizOption(questionIdx, optionIdx) {
  // 해당 문제의 모든 옵션 초기화
  document.querySelectorAll(`[id^="quiz-opt-${questionIdx}-"]`).forEach(el => {
    el.style.borderColor = 'var(--color-border, #e5e5e5)';
    el.style.background = '#fff';
    const radio = el.querySelector('.quiz-radio');
    if (radio) { radio.style.borderColor = '#ccc'; radio.innerHTML = ''; }
  });
  // 선택된 옵션 하이라이트
  const selected = document.getElementById(`quiz-opt-${questionIdx}-${optionIdx}`);
  if (selected) {
    selected.style.borderColor = 'var(--color-primary, #7C4DFF)';
    selected.style.background = 'rgba(124, 77, 255, 0.05)';
    const radio = selected.querySelector('.quiz-radio');
    if (radio) {
      radio.style.borderColor = 'var(--color-primary, #7C4DFF)';
      radio.style.background = 'var(--color-primary, #7C4DFF)';
      radio.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="white"/></svg>';
    }
    const input = selected.querySelector('input');
    if (input) input.checked = true;
  }
}

/**
 * 퀴즈 제출 및 채점
 */
function submitEducationQuiz(contentId) {
  const content = EducationService.getById(contentId);
  if (!content || !content.quiz) return;

  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('퀴즈 결과를 저장하려면 로그인이 필요해요!\n학습 진행률을 추적할 수 있어요.');
    return;
  }

  const quiz = content.quiz;
  let correct = 0;
  let allAnswered = true;

  quiz.forEach((q, qi) => {
    const selected = document.querySelector(`input[name="quiz-${qi}"]:checked`);
    if (!selected) { allAnswered = false; return; }
    const userAnswer = parseInt(selected.value);
    const isCorrect = userAnswer === q.answer;
    if (isCorrect) correct++;

    // 정답/오답 표시
    q.options.forEach((_, oi) => {
      const optEl = document.getElementById(`quiz-opt-${qi}-${oi}`);
      if (!optEl) return;
      optEl.style.cursor = 'default';
      optEl.onclick = null;
      if (oi === q.answer) {
        optEl.style.borderColor = '#4CAF50';
        optEl.style.background = '#e8f5e9';
      } else if (oi === userAnswer && !isCorrect) {
        optEl.style.borderColor = '#f44336';
        optEl.style.background = '#ffebee';
      }
    });
  });

  if (!allAnswered) {
    const resultEl = document.getElementById('quiz-result');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = '<div class="alert alert-error" style="text-align:center;">모든 문제에 답해주세요!</div>';
    }
    return;
  }

  const passed = correct >= 2;
  const resultEl = document.getElementById('quiz-result');
  const btn = document.getElementById('quiz-submit-btn');

  if (resultEl) {
    resultEl.style.display = 'block';
    if (passed) {
      resultEl.innerHTML = `
        <div style="text-align:center; padding:20px; background:#d1fae5; border-radius:12px;">
          <div style="font-size:2rem; margin-bottom:8px;">🎉</div>
          <div style="font-weight:800; color:#065f46; font-size:1.1rem;">${correct}/${quiz.length} 정답 — 통과!</div>
          <p style="color:#065f46; font-size:0.85rem; margin-top:4px;">학습 완료로 기록되었습니다.</p>
        </div>`;
      // 학습 완료 처리
      EducationService.markComplete(user.id, contentId);
      if (btn) btn.style.display = 'none';
    } else {
      resultEl.innerHTML = `
        <div style="text-align:center; padding:20px; background:#fff3e0; border-radius:12px;">
          <div style="font-size:2rem; margin-bottom:8px;">😅</div>
          <div style="font-weight:800; color:#e65100; font-size:1.1rem;">${correct}/${quiz.length} 정답 — 아쉬워요!</div>
          <p style="color:#e65100; font-size:0.85rem; margin-top:4px;">2문제 이상 맞춰야 통과예요. 내용을 다시 읽고 도전해보세요!</p>
        </div>`;
      if (btn) {
        btn.textContent = '🔄 다시 도전하기';
        btn.onclick = () => Router.navigate('/education/' + contentId);
      }
    }
  }
}

/**
 * 교육 콘텐츠 완료 핸들러 (퀴즈 없는 콘텐츠용)
 * @param {string} contentId - 콘텐츠 ID
 */
function handleCompleteEducation(contentId) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('학습 완료를 기록하려면 로그인이 필요해요!');
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

  // 풀스크린 ChatGPT 스타일 레이아웃 (page-content 패딩 오버라이드)
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
    <style>
      .ai-layout { display:flex; height:calc(100vh - 64px); overflow:hidden; }
      .ai-sidebar { width:260px; background:#f9f9f7; border-right:1px solid #e5e3e0; display:flex; flex-direction:column; flex-shrink:0; }
      .ai-sidebar__header { padding:16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e3e0; }
      .ai-sidebar__new { padding:8px 16px; border:1px solid #e5e3e0; border-radius:8px; font-size:0.82rem; font-weight:600; background:#fff; color:#1a1a1a; width:100%; text-align:left; transition:background 0.15s; }
      .ai-sidebar__new:hover { background:#f0eeeb; }
      .ai-sidebar__list { flex:1; overflow-y:auto; padding:8px; }
      .ai-sidebar__list::-webkit-scrollbar { width:3px; }
      .ai-sidebar__list::-webkit-scrollbar-thumb { background:#ddd; border-radius:2px; }
      .ai-sidebar__item { padding:10px 12px; border-radius:8px; font-size:0.82rem; color:#666; cursor:pointer; transition:background 0.15s; margin-bottom:2px; display:flex; justify-content:space-between; align-items:center; }
      .ai-sidebar__item:hover { background:#f0eeeb; }
      .ai-sidebar__item.active { background:#e8e6e3; color:#1a1a1a; font-weight:600; }
      .ai-sidebar__item-title { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .ai-sidebar__item-del { opacity:0; font-size:0.75rem; color:#999; background:none; border:none; padding:2px 4px; transition:opacity 0.15s; }
      .ai-sidebar__item:hover .ai-sidebar__item-del { opacity:1; }
      .ai-sidebar__item-del:hover { color:#e53e3e; }
      .ai-sidebar__footer { padding:12px 16px; border-top:1px solid #e5e3e0; }
      .ai-main { flex:1; display:flex; flex-direction:column; min-width:0; }
      .ai-main__header { padding:12px 24px; border-bottom:1px solid #e5e3e0; display:flex; align-items:center; gap:12px; flex-shrink:0; }
      .ai-main__tabs { display:inline-flex; background:#f0eeeb; border-radius:10px; padding:3px; }
      .ai-main__tab { padding:7px 18px; border-radius:8px; font-size:0.8rem; font-weight:600; color:#888; background:none; border:none; transition:all 0.2s; cursor:pointer; }
      .ai-main__tab:hover { color:#555; }
      .ai-main__tab.active { color:#fff; background:#1a1a1a; box-shadow:0 1px 3px rgba(0,0,0,0.12); }
      .ai-chat-area { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
      .ai-chat-area::-webkit-scrollbar { width:4px; }
      .ai-chat-area::-webkit-scrollbar-thumb { background:#ddd; border-radius:2px; }
      .ai-chat-center { max-width:720px; width:100%; margin:0 auto; padding:24px; flex:1; display:flex; flex-direction:column; }
      .ai-welcome-center { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
      .ai-welcome-center h2 { font-size:1.4rem; font-weight:700; color:#1a1a1a; letter-spacing:-0.5px; margin-bottom:8px; }
      .ai-welcome-center p { font-size:0.88rem; color:#999; }
      .ai-input-area { padding:16px 24px 24px; flex-shrink:0; }
      .ai-input-box { max-width:720px; margin:0 auto; display:flex; gap:8px; align-items:flex-end; border:1.5px solid #e5e3e0; border-radius:24px; padding:10px 16px; background:#fff; transition:border-color 0.15s; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
      .ai-input-box:focus-within { border-color:#1a1a1a; box-shadow:0 2px 16px rgba(0,0,0,0.08); }
      .ai-input-box input { flex:1; border:none; background:transparent; font-size:0.9rem; outline:none; padding:4px 0; font-family:inherit; color:#1a1a1a; }
      .ai-input-box input::placeholder { color:#bbb; }
      .ai-send-circle { width:32px; height:32px; border-radius:50%; background:#1a1a1a; color:#fff; border:none; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:opacity 0.15s; }
      .ai-send-circle:hover { opacity:0.8; }
      .ai-send-circle:disabled { opacity:0.2; }
      .ai-attach-btn { background:none; border:none; font-size:1.1rem; padding:4px; color:#999; flex-shrink:0; transition:color 0.15s; }
      .ai-attach-btn:hover { color:#1a1a1a; }
      .ai-msg-row { max-width:720px; width:100%; margin:0 auto; padding:16px 24px; }
      .ai-msg-row--user { }
      .ai-msg-row--ai { background:#f9f9f7; border-radius:12px; margin-bottom:8px; }
      .ai-msg-label { font-size:0.75rem; font-weight:700; color:#1a1a1a; margin-bottom:6px; }
      .ai-msg-text { font-size:0.9rem; line-height:1.7; color:#333; }
      .ai-msg-text img { max-width:100%; max-height:240px; border-radius:8px; margin:8px 0; }
      .ai-health-bar { max-width:720px; margin:0 auto; padding:0 24px 12px; }
      .ai-health-bar__inner { display:flex; gap:8px; }
      @media (max-width:768px) {
        .ai-sidebar { display:none; }
        .ai-chat-center, .ai-msg-row, .ai-health-bar { padding-left:16px; padding-right:16px; }
        .ai-input-area { padding:12px 16px 16px; }
      }
    </style>

    <div class="ai-layout">
      <!-- 사이드바 -->
      <div class="ai-sidebar">
        <div class="ai-sidebar__header">
          <button class="ai-sidebar__new" onclick="startNewAiSession()">+ 새 대화</button>
        </div>
        <div class="ai-sidebar__list" id="ai-sidebar-list"></div>
        <div class="ai-sidebar__footer">
          <button onclick="showAiNameSetting()" style="background:none;border:none;font-size:0.78rem;color:#999;cursor:pointer;">AI 비서 이름 설정</button>
          <div id="ai-name-setting" style="display:none; margin-top:8px;"></div>
        </div>
      </div>

      <!-- 메인 채팅 -->
      <div class="ai-main">
        <div class="ai-main__header">
        </div>

        <div id="ai-training-dog-selector" style="display:none;">
          <div class="ai-health-bar">
            <div class="ai-health-bar__inner" style="padding-top:12px;">
              <div id="ai-dog-selector-training" style="width:100%;"></div>
            </div>
            <div class="ai-health-bar__inner" style="padding-top:8px;">
              <div style="position:relative; flex:1;">
                <input type="text" id="ai-breed-training" class="form-input" placeholder="품종 검색..." autocomplete="off" style="font-size:0.82rem; padding:6px 10px; border-radius:8px; width:100%;" oninput="filterBreedDropdownTraining(this.value)" onfocus="showBreedDropdownTraining()" onblur="setTimeout(()=>hideBreedDropdownTraining(),200)">
                <div id="ai-breed-dropdown-training" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:180px; overflow-y:auto; background:#fff; border:1px solid #e5e3e0; border-radius:8px; margin-top:4px; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.08);"></div>
              </div>
              <input type="text" id="ai-age-training" class="form-input" placeholder="나이" style="font-size:0.82rem; padding:6px 10px; border-radius:8px; width:80px;">
            </div>
          </div>
        </div>

        <div id="ai-health-fields" style="display:none;">
          <div class="ai-health-bar">
            <div class="ai-health-bar__inner" style="padding-top:12px;">
              <div id="ai-dog-selector" style="width:100%;"></div>
            </div>
            <div class="ai-health-bar__inner" style="padding-top:8px;">
              <div style="position:relative; flex:1;">
                <input type="text" id="ai-breed" class="form-input" placeholder="품종 검색..." autocomplete="off" style="font-size:0.82rem; padding:6px 10px; border-radius:8px; width:100%;" oninput="filterBreedDropdown(this.value)" onfocus="showBreedDropdown()" onblur="setTimeout(()=>hideBreedDropdown(),200)">
                <div id="ai-breed-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:180px; overflow-y:auto; background:#fff; border:1px solid #e5e3e0; border-radius:8px; margin-top:4px; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                </div>
              </div>
              <input type="text" id="ai-age" class="form-input" placeholder="나이" style="font-size:0.82rem; padding:6px 10px; border-radius:8px; width:80px;">
            </div>
          </div>
        </div>

        <div class="ai-chat-area" id="ai-chat"></div>

        <div class="ai-input-area">
          <div class="ai-input-box" id="ai-input-wrap" ondragover="event.preventDefault();this.style.borderColor='#1a1a1a'" ondragleave="this.style.borderColor='#e5e3e0'" ondrop="event.preventDefault();this.style.borderColor='#e5e3e0';handleAiDrop(event)">
            <button class="ai-attach-btn" onclick="document.getElementById('ai-file').click()" title="사진 첨부">+</button>
            <input type="file" id="ai-file" accept="image/*,video/*" style="display:none;" onchange="handleAiFileSelect(this)">
            <div style="flex:1; min-width:0;">
              <div id="ai-file-preview" style="display:none; margin-bottom:6px;"></div>
              <input type="text" id="ai-input" placeholder="무엇이든 물어보세요" onkeydown="if(event.key==='Enter')handleAiChat()" onpaste="handleAiPaste(event)">
            </div>
            <button class="ai-send-circle" onclick="handleAiChat()" id="ai-send-btn">&#x2191;</button>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  updateAiModeDesc();
  restoreAiChat();
  _renderAiSidebar();

  // 세션 목록 로드
  if (user) loadAiSessionList(user.id);
}

// 세션 목록 로드
async function loadAiSessionList(userId) {
  try {
    const res = await fetch('/api/chat/' + userId + '/sessions');
    if (res.ok) _aiSessionList = await res.json();
  } catch(e) { _aiSessionList = []; }
  _renderAiSidebar();
}

// 세션 목록 패널 토글
function toggleAiSessions() {
  _renderAiSidebar();
}

function _renderAiSidebar() {
  const list = document.getElementById('ai-sidebar-list');
  if (!list) return;

  if (_aiSessionList.length === 0) {
    list.innerHTML = '<div style="padding:16px; text-align:center; font-size:0.78rem; color:#999;">이전 대화가 없어요</div>';
    return;
  }

  list.innerHTML = _aiSessionList.map(s => {
    const isActive = _aiCurrentSession && _aiCurrentSession.id === s.id;
    return '<div class="ai-sidebar__item' + (isActive ? ' active' : '') + '" onclick="loadAiSession(\'' + s.id + '\')">' +
      '<span class="ai-sidebar__item-title">' + s.title + '</span>' +
      '<button class="ai-sidebar__item-del" onclick="event.stopPropagation();deleteAiSession(\'' + s.id + '\')" title="삭제">✕</button>' +
    '</div>';
  }).join('');
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
  // ChatGPT 스타일에서는 모드 설명을 별도로 표시하지 않음
}

function restoreAiChat() {
  const chatEl = document.getElementById('ai-chat');
  if (!chatEl) return;
  const messages = (_aiCurrentSession && _aiCurrentSession.messages) || [];

  if (messages.length === 0) {
    chatEl.innerHTML = `
    <div class="ai-chat-center">
      <div class="ai-welcome-center">
        <h2>무엇이 궁금하세요?</h2>
        <p>상담 유형을 선택해주세요</p>
        <div style="display:flex; gap:16px; margin-top:32px; max-width:480px; width:100%;">
          <div onclick="selectAiModeCard('training')" class="ai-mode-card" id="ai-mode-card-training" style="flex:1; padding:24px 20px; border:1.5px solid #e5e3e0; border-radius:14px; cursor:pointer; transition:all 0.2s; text-align:left;" onmouseover="this.style.borderColor='#1a1a1a';this.style.background='#f9f9f7'" onmouseout="if(!this.classList.contains('selected')){this.style.borderColor='#e5e3e0';this.style.background='#fff'}">
            <div style="font-size:0.95rem; font-weight:700; color:#1a1a1a; margin-bottom:8px;">훈련 / 행동</div>
            <div style="font-size:0.78rem; color:#888; line-height:1.5;">문제 행동 교정, 훈련 방법,<br>사회화 등에 대해 상담</div>
          </div>
          <div onclick="selectAiModeCard('health')" class="ai-mode-card" id="ai-mode-card-health" style="flex:1; padding:24px 20px; border:1.5px solid #e5e3e0; border-radius:14px; cursor:pointer; transition:all 0.2s; text-align:left;" onmouseover="this.style.borderColor='#1a1a1a';this.style.background='#f9f9f7'" onmouseout="if(!this.classList.contains('selected')){this.style.borderColor='#e5e3e0';this.style.background='#fff'}">
            <div style="font-size:0.95rem; font-weight:700; color:#1a1a1a; margin-bottom:8px;">건강 / 질병</div>
            <div style="font-size:0.78rem; color:#888; line-height:1.5;">증상 분석, 질병 정보,<br>응급 대처법 안내</div>
          </div>
        </div>
        <div id="ai-mode-detail" style="margin-top:20px; max-width:480px; width:100%; text-align:left; min-height:60px;"></div>
      </div>
    </div>`;
    return;
  }

  let html = '<div class="ai-chat-center">';
  messages.forEach(msg => {
    if (msg.role === 'user') {
      let imgHtml = '';
      if (msg.imageData) imgHtml = '<img src="' + msg.imageData + '">';
      html += '<div class="ai-msg-row ai-msg-row--user"><div class="ai-msg-label">나</div><div class="ai-msg-text">' + imgHtml + msg.text + '</div></div>';
    } else {
      const formatted = msg.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += '<div class="ai-msg-row ai-msg-row--ai"><div class="ai-msg-label">' + getAiName() + '</div><div class="ai-msg-text">' + formatted + '</div></div>';
    }
  });
  html += '</div>';
  chatEl.innerHTML = html;
  chatEl.scrollTop = chatEl.scrollHeight;

  // 대화 복원 시 반려견 선택 칩 표시
  const trainingDogSel = document.getElementById('ai-training-dog-selector');
  if (trainingDogSel) trainingDogSel.style.display = _aiChatMode === 'training' ? 'block' : 'none';
  const healthFields = document.getElementById('ai-health-fields');
  if (healthFields) healthFields.style.display = _aiChatMode === 'health' ? 'block' : 'none';
  _renderAiDogSelector();
}

function switchAiMode(mode) {
  _aiChatMode = mode;
  if (_aiCurrentSession) _aiCurrentSession.mode = mode;

  const tabT = document.getElementById('ai-tab-training');
  const tabH = document.getElementById('ai-tab-health');
  if (tabT) tabT.classList.toggle('active', mode === 'training');
  if (tabH) tabH.classList.toggle('active', mode === 'health');

  const healthFields = document.getElementById('ai-health-fields');
  if (healthFields) healthFields.style.display = mode === 'health' ? 'block' : 'none';
  const trainingDogSel = document.getElementById('ai-training-dog-selector');
  if (trainingDogSel) trainingDogSel.style.display = mode === 'training' ? 'block' : 'none';
  updateAiModeDesc();

  const input = document.getElementById('ai-input');
  if (input) input.placeholder = mode === 'training' ? '훈련/행동 관련 질문을 입력해주세요...' : '증상이나 건강 관련 질문을 입력해주세요...';
}

function selectAiModeCard(mode) {
  _aiChatMode = mode;
  if (_aiCurrentSession) _aiCurrentSession.mode = mode;

  // 카드 하이라이트
  const cards = document.querySelectorAll('.ai-mode-card');
  cards.forEach(c => { c.classList.remove('selected'); c.style.borderColor = '#e5e3e0'; c.style.background = '#fff'; });
  const selected = document.getElementById('ai-mode-card-' + mode);
  if (selected) {
    selected.classList.add('selected');
    selected.style.borderColor = '#1a1a1a';
    selected.style.background = '#f5f3f0';
  }

  // 상단 탭도 동기화
  const tabT = document.getElementById('ai-tab-training');
  const tabH = document.getElementById('ai-tab-health');
  if (tabT) tabT.classList.toggle('active', mode === 'training');
  if (tabH) tabH.classList.toggle('active', mode === 'health');

  const healthFields = document.getElementById('ai-health-fields');
  if (healthFields) healthFields.style.display = mode === 'health' ? 'block' : 'none';
  const trainingDogSel2 = document.getElementById('ai-training-dog-selector');
  if (trainingDogSel2) trainingDogSel2.style.display = mode === 'training' ? 'block' : 'none';

  // 설명 표시
  const detail = document.getElementById('ai-mode-detail');
  if (detail) {
    if (mode === 'training') {
      detail.innerHTML = '<div style="font-size:0.82rem; color:#666; border-left:2px solid #1a1a1a; padding-left:12px;"><div style="font-weight:700; color:#1a1a1a; margin-bottom:4px;">이런 질문에 좋아요</div><div style="line-height:1.6;">• 강아지가 짖는 이유와 교정법<br>• 분리불안 해결 방법<br>• 산책 훈련, 사회화 방법</div></div>';
    } else {
      detail.innerHTML = '<div style="font-size:0.82rem; color:#666; border-left:2px solid #1a1a1a; padding-left:12px;"><div style="font-weight:700; color:#1a1a1a; margin-bottom:4px;">이런 질문에 좋아요</div><div style="line-height:1.6;">• 구토, 설사 등 증상 분석<br>• 사진으로 피부/눈 상태 진단<br>• 예방접종, 응급 대처법</div></div>';
    }
  }

  // 입력창 포커스
  const input = document.getElementById('ai-input');
  if (input) {
    input.placeholder = mode === 'training' ? '훈련/행동 관련 질문을 입력해주세요...' : '증상이나 건강 관련 질문을 입력해주세요...';
    input.focus();
  }

  // 반려견 선택 칩 렌더링
  _renderAiDogSelector();

  // 등록된 반려견 정보 자동 채우기
  const user = AuthService.getCurrentUser();
  const dogs = user?.dogs || [];
  const selectedDog = dogs[_aiSelectedDogIdx] || dogs[0];
  if (selectedDog) {
    if (mode === 'health') {
      const breedInput = document.getElementById('ai-breed');
      const ageInput = document.getElementById('ai-age');
      if (breedInput) breedInput.value = selectedDog.breed || '';
      if (ageInput) ageInput.value = selectedDog.age ? selectedDog.age + '살' : '';
    } else {
      const breedInputT = document.getElementById('ai-breed-training');
      const ageInputT = document.getElementById('ai-age-training');
      if (breedInputT) breedInputT.value = selectedDog.breed || '';
      if (ageInputT) ageInputT.value = selectedDog.age ? selectedDog.age + '살' : '';
    }
  }
}

// 반려견 선택 상태 (-1 = 다른 강아지)
let _aiSelectedDogIdx = 0;

function _renderAiDogSelector() {
  const user = AuthService.getCurrentUser();
  const dogs = user?.dogs || [];

  // 두 곳 모두 렌더링 (건강 모드용, 훈련 모드용)
  ['ai-dog-selector', 'ai-dog-selector-training'].forEach(containerId => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (dogs.length === 0) {
      container.innerHTML = '';
      return;
    }

    const chips = dogs.map((d, i) =>
      `<button onclick="selectAiDog(${i})" style="padding:6px 14px; border-radius:20px; font-size:0.78rem; font-weight:600; border:1.5px solid ${_aiSelectedDogIdx === i ? '#1a1a1a' : '#e5e3e0'}; background:${_aiSelectedDogIdx === i ? '#1a1a1a' : '#fff'}; color:${_aiSelectedDogIdx === i ? '#fff' : '#666'}; cursor:pointer; transition:all 0.15s;">${d.name}</button>`
    ).join('');

    const otherChip = `<button onclick="selectAiDog(-1)" style="padding:6px 14px; border-radius:20px; font-size:0.78rem; font-weight:600; border:1.5px solid ${_aiSelectedDogIdx === -1 ? '#1a1a1a' : '#e5e3e0'}; background:${_aiSelectedDogIdx === -1 ? '#1a1a1a' : '#fff'}; color:${_aiSelectedDogIdx === -1 ? '#fff' : '#666'}; cursor:pointer; transition:all 0.15s;">다른 강아지</button>`;

    container.innerHTML = `<div style="display:flex; gap:6px; flex-wrap:wrap;">${chips}${otherChip}</div>`;
  });
}

function selectAiDog(idx) {
  _aiSelectedDogIdx = idx;
  _renderAiDogSelector();

  const user = AuthService.getCurrentUser();
  const dogs = user?.dogs || [];
  const breedInput = document.getElementById('ai-breed');
  const ageInput = document.getElementById('ai-age');
  const breedInputT = document.getElementById('ai-breed-training');
  const ageInputT = document.getElementById('ai-age-training');

  if (idx >= 0 && dogs[idx]) {
    const d = dogs[idx];
    if (breedInput) breedInput.value = d.breed || '';
    if (ageInput) ageInput.value = d.age ? d.age + '살' : '';
    if (breedInputT) breedInputT.value = d.breed || '';
    if (ageInputT) ageInputT.value = d.age ? d.age + '살' : '';
  } else {
    if (breedInput) breedInput.value = '';
    if (ageInput) ageInput.value = '';
    if (breedInputT) breedInputT.value = '';
    if (ageInputT) ageInputT.value = '';
  }
}

function _getAiDogContext() {
  const user = AuthService.getCurrentUser();
  const dogs = user?.dogs || [];

  if (_aiSelectedDogIdx === -1 || dogs.length === 0) {
    // 다른 강아지 또는 등록된 반려견 없음 — 현재 모드에 맞는 필드에서 가져오기
    const breed = (_aiChatMode === 'training'
      ? document.getElementById('ai-breed-training')?.value
      : document.getElementById('ai-breed')?.value) || '';
    const age = (_aiChatMode === 'training'
      ? document.getElementById('ai-age-training')?.value
      : document.getElementById('ai-age')?.value) || '';
    if (breed || age) return '[질문 대상: ' + breed + (age ? ', ' + age : '') + '] ';
    return '';
  }

  const dog = dogs[_aiSelectedDogIdx] || dogs[0];
  if (!dog) return '';

  const sizeMap = { small: '소형', medium: '중형', large: '대형' };
  let ctx = '[반려견: ' + dog.name + ', ' + (dog.breed || '') + ', ' + (dog.age || '?') + '살';
  ctx += ', ' + (sizeMap[dog.size] || '');
  if (dog.weight) ctx += ', ' + dog.weight + 'kg';
  if (dog.gender) ctx += ', ' + (dog.gender === 'male' ? '수컷' : '암컷');
  if (dog.neutered === true) ctx += ', 중성화 완료';
  if (dog.personality) ctx += ', 성격: ' + dog.personality;
  if (dog.healthNote) ctx += ', 특이사항: ' + dog.healthNote;
  ctx += '] ';

  // 여러 마리면 다른 반려견 정보도 간략히 추가
  if (dogs.length > 1) {
    const others = dogs.filter((_, i) => i !== _aiSelectedDogIdx).map(d => d.name + '(' + (d.breed || '') + ', ' + (d.age || '?') + '살)').join(', ');
    ctx += '[함께 사는 반려견: ' + others + '] ';
  }

  return ctx;
}

function showBreedDropdown() {
  filterBreedDropdown(document.getElementById('ai-breed')?.value || '');
  document.getElementById('ai-breed-dropdown').style.display = 'block';
}

function hideBreedDropdown() {
  document.getElementById('ai-breed-dropdown').style.display = 'none';
}

function showBreedDropdownTraining() {
  filterBreedDropdownTraining(document.getElementById('ai-breed-training')?.value || '');
  document.getElementById('ai-breed-dropdown-training').style.display = 'block';
}

function hideBreedDropdownTraining() {
  document.getElementById('ai-breed-dropdown-training').style.display = 'none';
}

function filterBreedDropdown(query) {
  const dropdown = document.getElementById('ai-breed-dropdown');
  if (!dropdown || typeof BREEDS_DATA === 'undefined') return;

  const q = query.toLowerCase().trim();
  const filtered = q ? BREEDS_DATA.filter(b => b.name.toLowerCase().includes(q) || (b.nameEn && b.nameEn.toLowerCase().includes(q))).slice(0, 20) : BREEDS_DATA.slice(0, 20);

  if (filtered.length === 0) {
    dropdown.innerHTML = '<div style="padding:10px 12px; font-size:0.78rem; color:#999;">검색 결과가 없어요</div>';
    dropdown.style.display = 'block';
    return;
  }

  const sizeLabel = { small: '소형', medium: '중형', large: '대형' };
  dropdown.innerHTML = filtered.map(b =>
    '<div onclick="selectBreed(\'' + b.name.replace(/'/g, "\\'") + '\')" style="padding:8px 12px; font-size:0.82rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:background 0.1s;" onmouseover="this.style.background=\'#f5f3f0\'" onmouseout="this.style.background=\'#fff\'">' +
      '<span>' + b.name + '</span>' +
      '<span style="font-size:0.7rem; color:#999;">' + (sizeLabel[b.size] || '') + '</span>' +
    '</div>'
  ).join('');
  dropdown.style.display = 'block';
}

function selectBreed(name) {
  const input = document.getElementById('ai-breed');
  if (input) input.value = name;
  hideBreedDropdown();
}

function filterBreedDropdownTraining(query) {
  const dropdown = document.getElementById('ai-breed-dropdown-training');
  if (!dropdown || typeof BREEDS_DATA === 'undefined') return;

  const q = query.toLowerCase().trim();
  const filtered = q ? BREEDS_DATA.filter(b => b.name.toLowerCase().includes(q) || (b.nameEn && b.nameEn.toLowerCase().includes(q))).slice(0, 20) : BREEDS_DATA.slice(0, 20);

  if (filtered.length === 0) {
    dropdown.innerHTML = '<div style="padding:10px 12px; font-size:0.78rem; color:#999;">검색 결과가 없어요</div>';
    dropdown.style.display = 'block';
    return;
  }

  const sizeLabel = { small: '소형', medium: '중형', large: '대형' };
  dropdown.innerHTML = filtered.map(b =>
    '<div onclick="selectBreedTraining(\'' + b.name.replace(/'/g, "\\'") + '\')" style="padding:8px 12px; font-size:0.82rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:background 0.1s;" onmouseover="this.style.background=\'#f5f3f0\'" onmouseout="this.style.background=\'#fff\'">' +
      '<span>' + b.name + '</span>' +
      '<span style="font-size:0.7rem; color:#999;">' + (sizeLabel[b.size] || '') + '</span>' +
    '</div>'
  ).join('');
  dropdown.style.display = 'block';
}

function selectBreedTraining(name) {
  const input = document.getElementById('ai-breed-training');
  if (input) input.value = name;
  hideBreedDropdownTraining();
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
  if (!user) { showLoginModal('AI 비서 이름을 설정하려면 로그인이 필요해요!'); return; }
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
      _processAiFile(file);
      return;
    }
  }
}

// AI 파일 첨부 관련
let _aiAttachedFile = null; // { base64, mimeType, name }

function handleAiFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하만 가능해요.');
    input.value = '';
    return;
  }
  _processAiFile(file);
  input.value = '';
}

function removeAiFile() {
  _aiAttachedFile = null;
  const preview = document.getElementById('ai-file-preview');
  if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
  const fileInput = document.getElementById('ai-file');
  if (fileInput) fileInput.value = '';
}

function handleAiDrop(event) {
  const file = event.dataTransfer.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    alert('이미지 또는 영상 파일만 첨부할 수 있어요.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하만 가능해요.');
    return;
  }
  _processAiFile(file);
}

function _processAiFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Full = e.target.result;
    const base64Data = base64Full.split(',')[1];
    _aiAttachedFile = { base64: base64Data, mimeType: file.type, name: file.name };
    const preview = document.getElementById('ai-file-preview');
    if (preview) {
      if (file.type.startsWith('image/')) {
        preview.innerHTML = '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;background:var(--color-bg-warm);border-radius:8px;position:relative;"><img src="' + base64Full + '" style="height:48px;max-width:120px;object-fit:cover;border-radius:6px;"><button onclick="removeAiFile()" style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:#333;color:#fff;border:none;font-size:0.6rem;display:flex;align-items:center;justify-content:center;cursor:pointer;">✕</button></div>';
      } else {
        preview.innerHTML = '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;background:var(--color-bg-warm);border-radius:8px;"><span style="font-size:1rem;">🎬</span><span style="font-size:0.78rem;font-weight:600;">' + file.name + '</span><button onclick="removeAiFile()" style="background:none;border:none;cursor:pointer;font-size:0.9rem;">✕</button></div>';
      }
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

async function handleAiChat() {
  const input = document.getElementById('ai-input');
  const chatEl = document.getElementById('ai-chat');
  const btn = document.getElementById('ai-send-btn');
  const message = input?.value?.trim();
  if (!message) return;

  // 비로그인 시 로그인 유도
  const user = AuthService.getCurrentUser();
  if (!user) {
    chatEl.innerHTML += `<div style="display:flex;margin-bottom:12px;"><div style="background:var(--color-bg-warm);padding:14px 18px;border-radius:16px 16px 16px 4px;max-width:85%;font-size:0.9rem;">
      🔒 AI 상담을 이용하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a> 또는 <a href="#/register" style="color:var(--color-primary, #7C4DFF); font-weight:700;">회원가입</a>이 필요해요!
    </div></div>`;
    chatEl.scrollTop = chatEl.scrollHeight;
    return;
  }

  input.value = '';

  // 첫 메시지면 환영 카드 제거 + 반려견 선택 칩 표시
  if (_aiCurrentSession.messages.length === 0) {
    chatEl.innerHTML = '';
    const trainingDogSel = document.getElementById('ai-training-dog-selector');
    if (trainingDogSel) trainingDogSel.style.display = _aiChatMode === 'training' ? 'block' : 'none';
    const healthFields = document.getElementById('ai-health-fields');
    if (healthFields) healthFields.style.display = _aiChatMode === 'health' ? 'block' : 'none';
    _renderAiDogSelector();
  }

  // 사용자 메시지 표시 (이미지 포함)
  let imgHtml = '';
  if (_aiAttachedFile && _aiAttachedFile.mimeType.startsWith('image/')) {
    imgHtml = '<img src="data:' + _aiAttachedFile.mimeType + ';base64,' + _aiAttachedFile.base64 + '">';
  }
  chatEl.innerHTML += '<div class="ai-msg-row ai-msg-row--user"><div class="ai-msg-label">나</div><div class="ai-msg-text">' + imgHtml + message + '</div></div>';

  // 로딩
  chatEl.innerHTML += '<div class="ai-msg-row ai-msg-row--ai" id="ai-loading"><div class="ai-msg-label">' + getAiName() + '</div><div class="ai-msg-text"><div class="spinner" style="width:20px;height:20px;"></div></div></div>';
  chatEl.scrollTop = chatEl.scrollHeight;
  if (btn) btn.disabled = true;

  const msgObj = { role: 'user', text: message };
  if (_aiAttachedFile && _aiAttachedFile.mimeType.startsWith('image/')) {
    msgObj.imageData = 'data:' + _aiAttachedFile.mimeType + ';base64,' + _aiAttachedFile.base64;
  }
  _aiCurrentSession.messages.push(msgObj);

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
      let breed = document.getElementById('ai-breed')?.value || '';
      let age = document.getElementById('ai-age')?.value || '';
      const dogContext = _getAiDogContext();
      if (!dogContext) {
        // 다른 강아지 선택 시 입력 필드에서 가져오기
        const manualCtx = (breed || age) ? '[질문 대상: ' + breed + (age ? ', ' + age : '') + '] ' : '';
        apiUrl = '/api/ai/consult';
        body = JSON.stringify({
          message: '[건강/질병 상담 모드] ' + manualCtx + message,
          history: _aiCurrentSession.messages,
          mode: 'health',
          aiName: getAiName()
        });
      } else {
        apiUrl = '/api/ai/consult';
        body = JSON.stringify({
          message: '[건강/질병 상담 모드] ' + dogContext + message,
          history: _aiCurrentSession.messages,
          mode: 'health',
          aiName: getAiName()
        });
      }
    } else {
      apiUrl = '/api/ai/consult';
      const dogContext = _getAiDogContext();
      body = JSON.stringify({
        message: dogContext + message,
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
      chatEl.innerHTML += '<div class="ai-msg-row ai-msg-row--ai"><div class="ai-msg-label">' + getAiName() + '</div><div class="ai-msg-text">' + formatted + '</div></div>';
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

  if (!AuthService.getCurrentUser()) {
    if (resultEl) resultEl.innerHTML = `<div class="card" style="padding:20px; text-align:center; background:var(--color-bg-warm);">🔒 AI 분석을 이용하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a>이 필요해요!</div>`;
    return;
  }

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
  const user = AuthService.getCurrentUser();

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

  if (!AuthService.getCurrentUser()) {
    chatEl.innerHTML += `<div style="display:flex;margin-bottom:12px;"><div style="background:var(--color-bg-warm);padding:14px 18px;border-radius:16px 16px 16px 4px;max-width:85%;font-size:0.9rem;">
      🔒 AI 상담을 이용하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a> 또는 <a href="#/register" style="color:var(--color-primary, #7C4DFF); font-weight:700;">회원가입</a>이 필요해요!
    </div></div>`;
    chatEl.scrollTop = chatEl.scrollHeight;
    return;
  }

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
      <div class="card" style="padding:20px; margin-bottom:20px; text-align:center; background:var(--color-bg-warm);">
        <p style="margin:0; font-size:0.95rem;">✏️ 게시물을 작성하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a>이 필요해요!</p>
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
    showLoginModal('게시물을 작성하려면 로그인이 필요해요!');
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
    showLoginModal('좋아요를 누르려면 로그인이 필요해요!');
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
    showLoginModal('댓글을 작성하려면 로그인이 필요해요!');
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
      <div class="page-header">
        <h1>🪙 Paw 지갑</h1>
        <p>활동으로 코인을 모으고 사용해봐요~ 💕</p>
      </div>
      <div class="wallet-balance">
        <div class="balance-label">보유 Paw 코인</div>
        <div class="balance-amount">0</div>
        <div class="balance-unit">🐾 PAW (0원)</div>
      </div>
      <div class="page-header" style="margin-top:8px;">
        <h1 style="font-size:1.1rem;">📋 거래 내역</h1>
      </div>
      <div class="card" style="padding:20px;">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>거래 내역이 없습니다</p>
        </div>
      </div>
      <div style="margin-top:16px; text-align:center;">
        <button class="btn btn-primary" onclick="showLoginModal('Paw 코인을 적립하고 사용하려면 로그인이 필요해요!\\n산책, 커뮤니티 활동으로 코인을 모을 수 있어요.')">💰 코인 적립 시작하기</button>
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
      <div class="page-header">
        <h1>🤝 산책 매칭</h1>
        <p>산책 도우미와 요청자를 연결해드려요~ 🐕</p>
      </div>
      <div class="match-role-grid">
        <div class="match-role-card" onclick="Router.navigate('/login')">
          <div class="match-role-card__img-wrap">
            <img src="/images/dog_walker.png" alt="산책 도우미" class="match-role-card__img">
          </div>
          <div class="match-role-card__body">
            <h3 class="match-role-card__title">산책 도우미</h3>
            <p class="match-role-card__desc">다른 반려견의 산책을<br>도와주세요</p>
          </div>
        </div>
        <div class="match-role-card" onclick="Router.navigate('/login')">
          <div class="match-role-card__img-wrap">
            <img src="/images/dog_owner.png" alt="산책 요청자" class="match-role-card__img">
          </div>
          <div class="match-role-card__body">
            <h3 class="match-role-card__title">산책 요청자</h3>
            <p class="match-role-card__desc">우리 아이 산책을<br>부탁해보세요</p>
          </div>
        </div>
      </div>
      <div class="card" style="padding:20px;">
        <h3 style="margin-bottom:12px;">📋 매칭 시스템 안내</h3>
        <div style="font-size:0.9rem; line-height:1.8; color:var(--color-text);">
          <p>🔹 <strong>산책 도우미</strong>: 활동 지역, 가능 시간, 수용 가능 견종 크기를 등록하면 요청을 받을 수 있어요.</p>
          <p>🔹 <strong>산책 요청자</strong>: 근처 도우미에게 산책을 요청하고 실시간으로 매칭 상태를 확인할 수 있어요.</p>
          <p>🔹 매칭 완료 후 <strong>GPS 산책 트래킹</strong>으로 경로를 기록할 수 있어요.</p>
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
  const user      = AuthService.getCurrentUser();
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
      ${(() => {
        const dogs = (user && user.dogs) || [];
        if (dogs.length === 0) {
          return `
            <div class="match-empty-dog-card">
              <div class="match-empty-dog-card__emoji">🐾</div>
              <div class="match-empty-dog-card__title">등록된 반려견이 없어요</div>
              <div class="match-empty-dog-card__desc">산책 요청을 보내려면 먼저 반려견 정보를 등록해야 해요.</div>
              <button class="btn btn-primary" onclick="Router.navigate('/profile')" style="margin-top:4px;">프로필에서 반려견 등록하기 →</button>
            </div>`;
        }
        const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' };
        const options = dogs.map(d =>
          `<option value="${d.id}">${d.name}${d.breed ? ' · ' + d.breed : ''}${d.size ? ' (' + (sizeLabel[d.size] || d.size) + ')' : ''}</option>`
        ).join('');
        return `<div class="form-group" style="margin-bottom:16px;">
          <label for="match-dog-select">함께할 반려견 <span class="dw-required">*</span></label>
          <select id="match-dog-select" class="form-select">
            <option value="">선택해주세요</option>
            ${options}
          </select>
        </div>`;
      })()}
      <div class="match-form-grid">
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
    <style>
      .match-flow-hero { text-align:center; padding:48px 0 32px; }
      .match-flow-hero h1 { font-size:1.5rem; font-weight:700; letter-spacing:-0.5px; margin-bottom:6px; }
      .match-flow-hero p { font-size:0.88rem; color:var(--color-text-muted); }
      .match-flow-cards { display:flex; gap:16px; max-width:480px; margin:0 auto; }
      .match-flow-card { flex:1; padding:32px 20px; border:1.5px solid var(--color-border); border-radius:16px; text-align:center; cursor:pointer; transition:all 0.2s; background:#fff; }
      .match-flow-card:hover { border-color:var(--color-text); background:#f9f9f7; }
      .match-flow-card h3 { font-size:1rem; font-weight:700; margin-bottom:6px; }
      .match-flow-card p { font-size:0.78rem; color:var(--color-text-muted); line-height:1.5; }
    </style>

    <div class="match-flow-hero">
      <h1>어떤 역할로 참여할까요?</h1>
      <p>산책 매칭을 시작하려면 역할을 선택해주세요</p>
    </div>

    <div class="match-role-grid">
      <div class="match-role-card" onclick="openMatchRegisterFlow('walker')" style="cursor:pointer;">
        <div class="match-role-card__img-wrap">
          <img src="/images/dog_walker.png" alt="산책 도우미" class="match-role-card__img">
        </div>
        <div class="match-role-card__body">
          <h3 class="match-role-card__title">산책 도우미</h3>
          <p class="match-role-card__desc">다른 분의 반려견을<br>산책시켜 드려요</p>
        </div>
      </div>
      <div class="match-role-card" onclick="openMatchRegisterFlow('requester')" style="cursor:pointer;">
        <div class="match-role-card__img-wrap">
          <img src="/images/dog_owner.png" alt="산책 요청자" class="match-role-card__img">
        </div>
        <div class="match-role-card__body">
          <h3 class="match-role-card__title">산책 요청자</h3>
          <p class="match-role-card__desc">우리 아이 산책을<br>부탁하고 싶어요</p>
        </div>
      </div>
    </div>
  `);
}

// 토스 스타일 매칭 등록 플로우
let _matchRegStep = 0;
let _matchRegData = {};
let _matchRegRole = '';

const _matchWalkerSteps = [
  { key: 'location', question: '어디서 활동하세요?', sub: '동네 이름을 알려주세요', type: 'text', placeholder: '예: 서울 마포구 합정동', required: true },
  { key: 'preferredTime', question: '언제 산책 가능해요?', sub: '가능한 시간대를 골라주세요', type: 'cards', options: [
    { value: '오전 (7-9시)', label: '이른 아침', desc: '7~9시' },
    { value: '오전 (9-11시)', label: '오전', desc: '9~11시' },
    { value: '오후 (2-4시)', label: '오후', desc: '2~4시' },
    { value: '오후 (5-7시)', label: '늦은 오후', desc: '5~7시' },
    { value: '저녁 (7-9시)', label: '저녁', desc: '7~9시' },
    { value: '상시 가능', label: '상시', desc: '언제든' }
  ]},
  { key: 'careerYears', question: '산책 경력이 어느 정도예요?', sub: '대략적인 기간을 선택해주세요', type: 'cards', options: [
    { value: 'under6m', label: '6개월 미만', desc: '입문 단계' },
    { value: '6m1y',    label: '6개월~1년', desc: '초보' },
    { value: '1y3y',    label: '1년~3년',   desc: '중급' },
    { value: 'over3y',  label: '3년 이상',  desc: '숙련' }
  ]},
  { key: 'ownPetExp', question: '반려견을 직접 키워본 경험이 있나요?', sub: '', type: 'cards', options: [
    { value: 'current', label: '현재 키우는 중', desc: '반려인' },
    { value: 'past',    label: '과거에 키웠어요', desc: '경험 있음' },
    { value: 'none',    label: '없어요',         desc: '경험 없음' }
  ]},
  { key: 'largeDogExp', question: '대형견 산책 경험이 있나요?', sub: '25kg 이상 기준이에요', type: 'cards', options: [
    { value: 'lots',   label: '많아요',     desc: '자주 했어요' },
    { value: 'some',   label: '조금 있어요', desc: '몇 번 해봤어요' },
    { value: 'none',   label: '없어요',     desc: '소/중형만 해봤어요' }
  ]},
  { key: 'aggressionHandle', question: '공격성 있는 강아지도 산책할 수 있나요?', sub: '솔직하게 답변해주세요', type: 'cards', options: [
    { value: 'yes',    label: '가능해요',      desc: '경험 있어요' },
    { value: 'some',   label: '어느 정도요',   desc: '경미한 수준은 OK' },
    { value: 'no',     label: '어려워요',      desc: '온순한 강아지만' }
  ]},
  { key: 'breedExp', question: '어떤 견종을 많이 산책해보셨나요?', sub: '해당되는 견종을 모두 선택해주세요', type: 'multicheck', options: [
    '리트리버', '푸들', '말티즈', '진돗개', '포메라니안', '시바견', '허스키', '비글', '코커스패니얼', '기타'
  ]},
  { key: 'problemBehavior', question: '어떤 문제 행동을 다뤄봤나요?', sub: '경험 있는 항목을 모두 선택해주세요', type: 'multicheck', options: [
    '공격성', '짖음', '줄 당김', '분리불안', '낯선 사람 경계', '다른 강아지에게 예민함'
  ]},
  { key: 'message', question: '간단히 자기소개 해주세요', sub: '요청자가 참고할 수 있어요', type: 'textarea', placeholder: '산책 스타일, 성격 등을 자유롭게 적어주세요', required: true }
];

const _matchRequesterSteps = [
  { key: 'dogName', question: '반려견 이름이 뭐예요?', sub: '', type: 'text', placeholder: '예: 초코', required: true },
  { key: 'dogSize', question: '반려견 크기는요?', sub: '체중 기준으로 선택해주세요', type: 'cards', options: [
    { value: 'small', label: '소형', desc: '~10kg' },
    { value: 'medium', label: '중형', desc: '10~25kg' },
    { value: 'large', label: '대형', desc: '25kg~' }
  ]},
  { key: 'dogAggression', question: '반려견에게 공격성이 있나요?', sub: '정확할수록 더 잘 맞는 도우미를 찾아드려요', type: 'cards', options: [
    { value: 'high',   label: '공격성 강함',   desc: '다른 개/사람에게 반응함' },
    { value: 'medium', label: '약간 있어요',   desc: '특정 상황에서만' },
    { value: 'none',   label: '온순해요',      desc: '공격성 없음' }
  ]},
  { key: 'dogPersonality', question: '반려견 성격은 어때요?', sub: '가장 가까운 항목을 선택해주세요', type: 'cards', options: [
    { value: 'active',  label: '활발해요',    desc: '에너지가 넘쳐요' },
    { value: 'normal',  label: '보통이에요',  desc: '평균적인 편' },
    { value: 'shy',     label: '겁이 많아요', desc: '낯선 환경에 예민함' }
  ]},
  { key: 'walkDifficulty', question: '산책 난이도는 어느 정도예요?', sub: '줄 당김, 돌발행동 등을 고려해주세요', type: 'cards', options: [
    { value: 'hard',   label: '어려운 편',  desc: '통제가 쉽지 않아요' },
    { value: 'medium', label: '보통이에요', desc: '가끔 말 안 들어요' },
    { value: 'easy',   label: '쉬워요',    desc: '순한 편이에요' }
  ]},
  { key: 'location', question: '어디서 산책하고 싶으세요?', sub: '동네 이름을 알려주세요', type: 'text', placeholder: '예: 서울 마포구 합정동', required: true },
  { key: 'preferredTime', question: '원하는 산책 시간은요?', sub: '', type: 'cards', options: [
    { value: '오전 (7-9시)', label: '이른 아침', desc: '7~9시' },
    { value: '오전 (9-11시)', label: '오전', desc: '9~11시' },
    { value: '오후 (2-4시)', label: '오후', desc: '2~4시' },
    { value: '오후 (5-7시)', label: '늦은 오후', desc: '5~7시' },
    { value: '저녁 (7-9시)', label: '저녁', desc: '7~9시' }
  ]},
  { key: 'notes', question: '추가 요청사항이 있나요?', sub: '없으면 건너뛰어도 돼요', type: 'textarea', placeholder: '예: 목줄 빼지 말아주세요, 간식 챙겨드릴게요', required: false }
];

function openMatchRegisterFlow(role) {
  _matchRegRole = role;
  _matchRegStep = 0;
  _matchRegData = {};

  const app = document.getElementById('app');
  app.innerHTML += `
    <div id="match-reg-modal" style="position:fixed; inset:0; z-index:5000; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:#fff; border-radius:20px; width:100%; max-width:420px; min-height:380px; padding:40px 32px; position:relative; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.15);">
          <button onclick="closeMatchRegisterFlow()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.2rem; color:#999; cursor:pointer;">✕</button>
          <div id="match-reg-progress" style="display:flex; gap:4px; margin-bottom:32px;"></div>
          <div id="match-reg-content" style="flex:1; display:flex; flex-direction:column;"></div>
        </div>
      </div>
    </div>
  `;
  renderMatchRegStep();
}

function closeMatchRegisterFlow() {
  const modal = document.getElementById('match-reg-modal');
  if (modal) modal.remove();
}

function _getMatchSteps() {
  return _matchRegRole === 'walker' ? _matchWalkerSteps : _matchRequesterSteps;
}

function renderMatchRegStep() {
  const steps = _getMatchSteps();
  const step = steps[_matchRegStep];
  const total = steps.length;
  const content = document.getElementById('match-reg-content');
  const progress = document.getElementById('match-reg-progress');

  progress.innerHTML = Array.from({length: total}, (_, i) =>
    `<div style="flex:1; height:3px; border-radius:2px; background:${i <= _matchRegStep ? '#1a1a1a' : '#e5e3e0'}; transition:background 0.3s;"></div>`
  ).join('');

  let inputHtml = '';
  if (step.type === 'text') {
    inputHtml = `<input type="text" id="match-reg-input" class="form-input" placeholder="${step.placeholder || ''}" value="${_matchRegData[step.key] || ''}" style="font-size:1.1rem; padding:14px 16px; border-radius:12px; margin-top:24px;" autofocus onkeydown="if(event.key==='Enter')nextMatchRegStep()">`;
  } else if (step.type === 'textarea') {
    inputHtml = `<textarea id="match-reg-input" class="form-input" placeholder="${step.placeholder || ''}" rows="3" style="font-size:1rem; padding:14px 16px; border-radius:12px; margin-top:24px; resize:none;">${_matchRegData[step.key] || ''}</textarea>`;
  } else if (step.type === 'cards') {
    inputHtml = `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:24px;">
      ${step.options.map(opt => `
        <button onclick="selectMatchRegCard('${step.key}','${opt.value}')" style="flex:1; min-width:90px; padding:16px 12px; border:1.5px solid ${_matchRegData[step.key] === opt.value ? '#1a1a1a' : '#e5e3e0'}; border-radius:14px; background:${_matchRegData[step.key] === opt.value ? '#f5f3f0' : '#fff'}; text-align:center; cursor:pointer; transition:all 0.15s;">
          <div style="font-size:0.92rem; font-weight:700; color:#1a1a1a;">${opt.label}</div>
          <div style="font-size:0.7rem; color:#999; margin-top:3px;">${opt.desc}</div>
        </button>
      `).join('')}
    </div>`;
  } else if (step.type === 'multicheck') {
    const selected = _matchRegData[step.key] || [];
    inputHtml = `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:24px;">
      ${step.options.map(opt => `
        <button onclick="toggleMatchRegMulti('${step.key}','${opt}')" style="padding:10px 16px; border:1.5px solid ${selected.includes(opt) ? '#1a1a1a' : '#e5e3e0'}; border-radius:999px; background:${selected.includes(opt) ? '#1a1a1a' : '#fff'}; color:${selected.includes(opt) ? '#fff' : '#333'}; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.15s;">
          ${opt}
        </button>
      `).join('')}
    </div>
    <p style="font-size:0.75rem; color:#aaa; margin-top:10px;">해당 없으면 건너뛰기를 눌러주세요</p>`;
  }

  const isLast = _matchRegStep === total - 1;
  const canSkip = !step.required;

  content.innerHTML = `
    <div style="flex:1;">
      <h2 style="font-size:1.4rem; font-weight:700; letter-spacing:-0.5px; line-height:1.3;">${step.question}</h2>
      ${step.sub ? `<p style="font-size:0.88rem; color:#999; margin-top:6px;">${step.sub}</p>` : ''}
      ${inputHtml}
    </div>
    <div style="display:flex; gap:8px; margin-top:24px;">
      ${_matchRegStep > 0 ? `<button onclick="prevMatchRegStep()" style="flex:1; padding:14px; border:1.5px solid #e5e3e0; border-radius:12px; background:#fff; font-size:0.9rem; font-weight:600; cursor:pointer;">이전</button>` : ''}
      ${canSkip ? `<button onclick="skipMatchRegStep()" style="flex:1; padding:14px; border:1.5px solid #e5e3e0; border-radius:12px; background:#fff; font-size:0.9rem; font-weight:600; color:#999; cursor:pointer;">건너뛰기</button>` : ''}
      <button onclick="${isLast ? 'finishMatchRegister()' : 'nextMatchRegStep()'}" style="flex:2; padding:14px; border:none; border-radius:12px; background:#1a1a1a; color:#fff; font-size:0.9rem; font-weight:700; cursor:pointer; transition:opacity 0.15s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${isLast ? '등록 완료' : '다음'}</button>
    </div>
  `;
  setTimeout(() => document.getElementById('match-reg-input')?.focus(), 100);
}

function selectMatchRegCard(key, value) {
  _matchRegData[key] = value;
  renderMatchRegStep();
  setTimeout(() => nextMatchRegStep(), 300);
}

function toggleMatchRegMulti(key, value) {
  if (!_matchRegData[key]) _matchRegData[key] = [];
  const arr = _matchRegData[key];
  const idx = arr.indexOf(value);
  if (idx === -1) arr.push(value); else arr.splice(idx, 1);
  renderMatchRegStep();
}

function nextMatchRegStep() {
  const steps = _getMatchSteps();
  const step = steps[_matchRegStep];
  const input = document.getElementById('match-reg-input');
  if (input) _matchRegData[step.key] = input.value.trim();
  if (step.required && !_matchRegData[step.key]) { if(input) input.style.borderColor='#e53e3e'; return; }
  if (_matchRegStep < steps.length - 1) { _matchRegStep++; renderMatchRegStep(); }
}

function prevMatchRegStep() {
  if (_matchRegStep > 0) { _matchRegStep--; renderMatchRegStep(); }
}

function skipMatchRegStep() {
  const steps = _getMatchSteps();
  _matchRegData[steps[_matchRegStep].key] = '';
  if (_matchRegStep < steps.length - 1) { _matchRegStep++; renderMatchRegStep(); }
  else finishMatchRegister();
}

function finishMatchRegister() {
  const steps = _getMatchSteps();
  const input = document.getElementById('match-reg-input');
  if (input) _matchRegData[steps[_matchRegStep].key] = input.value.trim();

  const user = AuthService.getCurrentUser();
  if (!user) return;

  if (_matchRegRole === 'walker') {
    handleRegisterMatchProfile('walker', {
      location:          _matchRegData.location,
      preferredTime:     _matchRegData.preferredTime,
      careerYears:       _matchRegData.careerYears || '',
      ownPetExp:         _matchRegData.ownPetExp || '',
      largeDogExp:       _matchRegData.largeDogExp || '',
      aggressionHandle:  _matchRegData.aggressionHandle || '',
      breedExp:          _matchRegData.breedExp || [],
      problemBehavior:   _matchRegData.problemBehavior || [],
      message:           _matchRegData.message || '',
      canWalkLarge:      _matchRegData.largeDogExp !== 'none',
      canWalkMultiple:   true
    });
  } else {
    handleRegisterMatchProfile('requester', {
      dogName:         _matchRegData.dogName,
      dogSize:         _matchRegData.dogSize,
      dogAggression:   _matchRegData.dogAggression || 'none',
      dogPersonality:  _matchRegData.dogPersonality || 'normal',
      walkDifficulty:  _matchRegData.walkDifficulty || 'easy',
      location:        _matchRegData.location,
      preferredTime:   _matchRegData.preferredTime,
      notes:           _matchRegData.notes || ''
    });
  }
  closeMatchRegisterFlow();
}

function renderMatchingRoleSelectStatic(role) { renderMatchingRoleSelect(role); }

/** 매칭 프로필 등록 핸들러 */
function handleRegisterMatchProfile(role, flowData) {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  const errEl = document.getElementById('match-register-error');
  let location, preferredTime, message, extra;

  if (flowData) {
    // 토스 스타일 플로우에서 전달받은 데이터
    location = flowData.location;
    preferredTime = flowData.preferredTime;
    message = flowData.message || '';
    if (role === 'walker') {
      extra = { experience: flowData.experience || '', canWalkLarge: flowData.canWalkLarge || false, canWalkMultiple: flowData.canWalkMultiple || false };
    } else {
      extra = { dogName: flowData.dogName, dogSize: flowData.dogSize, notes: flowData.notes || '' };
    }
  } else {
    // DOM에서 직접 읽기
    location = document.getElementById('match-location')?.value;
    preferredTime = document.getElementById('match-time')?.value;
    message = document.getElementById('match-message')?.value || '';

    if (!location?.trim()) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-error">활동 지역을 입력해주세요.</div>'; return;
    }
    if (!preferredTime) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-error">시간대를 선택해주세요.</div>'; return;
    }

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
      const dogId = document.getElementById('match-dog-select')?.value;
      if (!dogId) {
        if (errEl) errEl.innerHTML = '<div class="alert alert-error">함께할 반려견을 선택해주세요.</div>'; return;
      }
      const selectedDog = (user.dogs || []).find(d => d.id === dogId);
      extra = {
        dogId,
        dogName: selectedDog?.name || '',
        dogSize: selectedDog?.size || '',
        dogBreed: selectedDog?.breed || '',
        notes: document.getElementById('match-notes')?.value || ''
      };
    }
  }

  MatchingService.registerProfile(user.id, { role, location: location.trim(), preferredTime, message: message.trim(), isAvailable: true, ...extra });

  // 도우미로 등록 시 walkers.json에도 추가 (브로드캐스트 대상에 포함되도록)
  if (role === 'walker') {
    fetch('/api/walkers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        name: user.name || user.nickname,
        nickname: user.nickname || user.name,
        location: location.trim(),
        preferredTime: preferredTime,
        experience: extra.experience || '',
        message: message.trim(),
        price: 0,
        acceptedSizes: extra.acceptedSizes || ['small','medium','large'],
      })
    }).then(() => MatchingService.refreshFromServer()).catch(() => {});
  }

  refreshDrawer();
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
  notif.style.cursor = 'pointer';
  notif.onclick = () => {
    notif.style.display = 'none';
    const section = document.getElementById('walker-broadcast-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  notif.innerHTML = `
    <span style="font-size:1.4rem;">🔔</span>
    <div style="flex:1;">
      <div style="font-weight:700;">산책 요청이 들어왔어요!</div>
      <div style="font-size:0.78rem;opacity:0.8;margin-top:2px;">새 요청 ${count}건 · 탭해서 확인하세요 →</div>
    </div>
    <span style="font-size:1.1rem;opacity:0.6;">›</span>`;
  notif.style.display = 'flex';
  clearTimeout(notif._hideTimer);
  notif._hideTimer = setTimeout(() => { if (notif) notif.style.display = 'none'; }, 8000);
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
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
        <button class="btn btn-secondary btn-sm" onclick="handleSwitchRole()">🔄 역할 변경</button>
        <button class="btn btn-ghost btn-sm" onclick="handleRemoveMatchProfile()" style="font-size:0.75rem;color:var(--color-text-muted);">등록 해제</button>
      </div>
    </div>
  `;

  const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' };
  const pendingCount = receivedRequests.filter(r => r.status === 'pending').length;

  const receivedHtml = receivedRequests.length > 0
    ? receivedRequests.map(r => {
        const fromName = MatchingService.getUserName(r.fromUserId);
        const rd = r.requestData || {};
        const isPending = r.status === 'pending';
        const dogSizeText = rd.dogSize ? sizeLabel[rd.dogSize] || rd.dogSize : '';

        return `
          <div class="match-request-card ${isPending ? 'match-request-card--pending' : r.status === 'accepted' ? 'match-request-card--accepted' : ''}">
            ${isPending ? '<div class="match-request-card__new-badge">🔔 새 요청</div>' : ''}
            <div class="match-request-card__header">
              <div class="match-request-card__avatar">${fromName.charAt(0)}</div>
              <div>
                <div class="match-request-card__from">${fromName}</div>
                <div style="font-size:0.78rem;color:var(--color-text-muted);">${new Date(r.createdAt).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              ${r.status === 'accepted' ? '<span class="badge badge-success" style="margin-left:auto;">✓ 수락됨</span>' : ''}
              ${r.status !== 'pending' && r.status !== 'accepted' ? '<span class="badge" style="margin-left:auto;">처리됨</span>' : ''}
            </div>

            <div class="match-request-card__body">
              ${rd.dogName || dogSizeText ? `
                <div class="match-request-card__dog">
                  <span style="font-size:1.3rem;">🐕</span>
                  <div>
                    <div style="font-weight:700;">${rd.dogName || '반려견'}${dogSizeText ? ` <span class="dw-size-tag">${dogSizeText}</span>` : ''}</div>
                    ${rd.dogBreed ? `<div style="font-size:0.8rem;color:var(--color-text-muted);">${rd.dogBreed}</div>` : ''}
                  </div>
                </div>` : ''}
              <div class="match-request-card__info-grid">
                ${rd.location ? `<div class="match-request-card__info-item"><span>📍</span> ${rd.location}</div>` : ''}
                ${rd.desiredTime ? `<div class="match-request-card__info-item"><span>⏰</span> ${rd.desiredTime}</div>` : ''}
              </div>
              ${rd.notes ? `<div class="match-request-card__notes">"${rd.notes}"</div>` : ''}
            </div>

            ${isPending ? `
              <div class="match-request-card__actions">
                <button class="btn btn-primary" onclick="handleAcceptBroadcastRequest('${r.id}')" style="flex:1;">✅ 수락하기</button>
                <button class="btn btn-secondary" onclick="handleRejectMatchRequest('${r.id}')" style="flex:1;">거절하기</button>
              </div>` : ''}
          </div>`;
      }).join('')
    : `<div class="empty-state"><div class="empty-icon">📭</div><p>아직 받은 산책 요청이 없어요.<br>ON 상태를 유지하면 요청이 들어와요.</p></div>`;

  const scheduledHtml = scheduledWalks.map(s => {
    const pid = s.participants.find(id => id !== user.id) || s.participants[0];
    const pName = MatchingService.getUserName(pid);
    const date = new Date(s.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return `
      <div class="match-walk-card match-walk-card--scheduled">
        <div class="match-walk-card__left">
          <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
          <div class="match-walk-card__info">
            <div class="match-walk-card__name">${pName}</div>
            <div style="font-size:0.8rem;color:var(--color-text-muted);">📅 ${date}</div>
            <span class="badge badge-info" style="margin-top:4px;">예정됨</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('/walk-tracking')" style="display:flex;align-items:center;gap:4px;">🗺️ 산책 시작</button>
          <button class="btn btn-ghost btn-sm" onclick="handleCompleteWalk('${s.id}')" style="font-size:0.75rem;color:var(--color-text-muted);">산책 완료 처리</button>
        </div>
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

    <!-- 산책 요청 목록 -->
    <div class="match-section" id="walker-broadcast-section">
      <h2 class="match-section__title">🐾 산책 요청</h2>
      <div id="walker-new-requests-wrap"><div class="spinner" style="margin:20px auto;"></div></div>
    </div>

    ${scheduledWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">📅 예정된 산책</h2>${scheduledHtml}</div>` : ''}
    ${completedWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">✅ 완료된 산책</h2>${completedHtml}</div>` : ''}

    <div class="match-section" id="direct-history-section" style="display:none;">
      <h2 class="match-section__title">📋 산책 기록</h2>
      <div id="walker-history-wrap"><div class="spinner" style="margin:20px auto;"></div></div>
    </div>
    <div id="review-form-container"></div>
  `);

  // 직접 요청 목록 비동기 로드
  renderWalkerRequestsList(user.id).then(({ html, requests }) => {
    const el = document.getElementById('walker-new-requests-wrap');
    if (el) {
      el.innerHTML = html;
      setTimeout(() => initWalkerNavMaps(requests), 100);
    }
  });

  // 직접 요청 산책 기록 비동기 로드
  renderDirectWalkHistory(user.id, 'walker').then(({ html, hasRecords }) => {
    const section = document.getElementById('direct-history-section');
    const wrap    = document.getElementById('walker-history-wrap');
    if (section && wrap) {
      if (hasRecords) { wrap.innerHTML = html; section.style.display = ''; }
      else section.style.display = 'none';
    }
  });

  // 폴링 시작 — 5초마다 새 요청 확인
  startWalkerPolling(user.id);
}

/**
 * AI 매칭 점수 계산 (0~100)
 * 강아지 특성 vs 도우미 역량을 비교해 적합도 산출
 */
function calcAiMatchScore(walker, requesterProfile, walkHistory) {
  let score = 50; // 기본 점수

  const dogSize       = requesterProfile.dogSize || 'small';
  const aggression    = requesterProfile.dogAggression || 'none';
  const difficulty    = requesterProfile.walkDifficulty || 'easy';

  // 1. 공격성 대응 능력 (최대 +25점)
  if (aggression === 'high') {
    if (walker.aggressionHandle === 'yes')  score += 25;
    else if (walker.aggressionHandle === 'some') score += 10;
    else score -= 20;
  } else if (aggression === 'medium') {
    if (walker.aggressionHandle === 'yes')  score += 15;
    else if (walker.aggressionHandle === 'some') score += 10;
    else score -= 5;
  } else {
    score += 5; // 온순한 강아지는 누구나 OK
  }

  // 2. 대형견 경험 (최대 +20점)
  if (dogSize === 'large') {
    if (walker.largeDogExp === 'lots')      score += 20;
    else if (walker.largeDogExp === 'some') score += 10;
    else score -= 15;
  } else if (dogSize === 'medium') {
    if (walker.largeDogExp === 'lots')      score += 8;
    else if (walker.largeDogExp === 'some') score += 5;
  } else {
    score += 5;
  }

  // 3. 산책 경력 (최대 +15점)
  const careerScore = { over3y: 15, '1y3y': 10, '6m1y': 5, under6m: 2 };
  score += careerScore[walker.careerYears] || 3;

  // 4. 반려견 직접 키운 경험 (+5점)
  if (walker.ownPetExp === 'current') score += 5;
  else if (walker.ownPetExp === 'past') score += 3;

  // 5. 문제 행동 대응 경험 (최대 +10점)
  if (difficulty === 'hard') {
    const problems = walker.problemBehavior || [];
    score += Math.min(problems.length * 2, 10);
  }

  // 6. 산책 기록 데이터 반영 (최대 +10점) — 완료된 산책이 많을수록 신뢰도 UP
  const completedCount = (walkHistory || []).filter(w => w.walkerId === walker.userId).length;
  score += Math.min(completedCount * 2, 10);

  // 7. 평점 반영 (+0~5점)
  if (walker.rating) score += Math.round((walker.rating - 3) * 2.5);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** 산책 요청자 대시보드 */
async function renderRequesterDashboard(user, myProfile) {
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
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
        <button class="btn btn-secondary btn-sm" onclick="handleSwitchRole()">🔄 역할 변경</button>
        <button class="btn btn-ghost btn-sm" onclick="handleRemoveMatchProfile()" style="font-size:0.75rem;color:var(--color-text-muted);">등록 해제</button>
      </div>
    </div>
  `;

  // 산책 기록 가져오기 (AI 점수 계산용)
  let walkHistory = [];
  try {
    const whRes = await fetch('/api/walks');
    if (whRes.ok) { const whData = await whRes.json(); walkHistory = whData.walks || []; }
  } catch(e) {}

  // AI 점수 계산 후 정렬
  const scoredWalkers = availWalkers.map(w => ({
    ...w,
    aiScore: calcAiMatchScore(w, myProfile, walkHistory)
  })).sort((a, b) => b.aiScore - a.aiScore);

  const walkerListHtml = scoredWalkers.length > 0
    ? scoredWalkers.map((w, idx) => {
        const displayName = w.userName || w.name || '도우미';
        const stars = '★'.repeat(Math.round(w.rating || 5)) + '☆'.repeat(5 - Math.round(w.rating || 5));
        const scoreColor = w.aiScore >= 80 ? '#00AA76' : w.aiScore >= 60 ? '#F6A623' : '#999';
        const scoreLabel = w.aiScore >= 80 ? '최적' : w.aiScore >= 60 ? '적합' : '보통';
        return `
        <div class="dw-card" style="${idx === 0 ? 'border-color:#00AA76;' : ''}">
          <div class="dw-card__avatar" style="${idx === 0 ? 'background:#00AA76;' : ''}">${displayName.charAt(0)}</div>
          <div class="dw-card__body">
            <div class="dw-card__top">
              <div>
                <div class="dw-card__name">
                  <span class="dw-avail-dot dw-avail-dot--on"></span>${displayName}
                  ${idx === 0 ? '<span style="font-size:0.68rem;background:#00AA76;color:#fff;padding:2px 7px;border-radius:999px;margin-left:6px;font-weight:700;">AI 추천 1위</span>' : ''}
                </div>
                <div class="dw-card__rating"><span class="dw-stars">${stars}</span> ${(w.rating || 5).toFixed(1)} · 리뷰 ${w.reviewCount || 0}건</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.1rem;font-weight:800;color:${scoreColor};">${w.aiScore}점</div>
                <div style="font-size:0.68rem;color:${scoreColor};font-weight:600;">${scoreLabel}</div>
              </div>
            </div>
            <div class="dw-card__meta">📍 ${w.location || ''} · ⏰ ${w.preferredTime || ''}</div>
            <div class="dw-card__sizes">
              ${w.careerYears ? `<span class="dw-size-tag">${{under6m:'경력 6개월 미만','6m1y':'경력 ~1년','1y3y':'경력 1~3년',over3y:'경력 3년+'}[w.careerYears]||''}</span>` : ''}
              ${w.largeDogExp === 'lots' ? '<span class="dw-size-tag">대형견 숙련</span>' : w.largeDogExp === 'some' ? '<span class="dw-size-tag">대형견 가능</span>' : ''}
              ${w.aggressionHandle === 'yes' ? '<span class="dw-size-tag">공격성 대응 가능</span>' : ''}
            </div>
            ${w.message ? `<div class="dw-card__bio">"${w.message}"</div>` : ''}
          </div>
          <div class="dw-card__action">
            <button class="btn btn-primary btn-sm" onclick="handleSendMatchRequest('${w.userId}')">요청 보내기</button>
          </div>
        </div>`;
      })
      .join('')
    : `<div class="empty-state"><div class="empty-icon">🔍</div><p>현재 매칭 가능한 도우미가 없습니다.<br>잠시 후 다시 확인해 주세요.</p></div>`;

  const scheduledHtml = scheduledWalks.map(s => {
    const pid = s.participants.find(id => id !== user.id) || s.participants[0];
    const pName = MatchingService.getUserName(pid);
    const date = new Date(s.scheduledAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return `
      <div class="match-walk-card match-walk-card--scheduled">
        <div class="match-walk-card__left">
          <div class="match-walk-card__avatar">${pName.charAt(0)}</div>
          <div class="match-walk-card__info">
            <div class="match-walk-card__name">${pName}</div>
            <div style="font-size:0.8rem;color:var(--color-text-muted);">📅 ${date}</div>
            <span class="badge badge-info" style="margin-top:4px;">예정됨</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('/walk-tracking')" style="display:flex;align-items:center;gap:4px;">🗺️ 산책 시작</button>
          <button class="btn btn-ghost btn-sm" onclick="handleCompleteWalk('${s.id}')" style="font-size:0.75rem;color:var(--color-text-muted);">산책 완료 처리</button>
        </div>
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
      <h1 class="match-hero__title">주변 산책 도우미를<br>찾아보세요</h1>
      <p class="match-hero__sub">가장 빠른 매칭을 원하면 지금 바로를 눌러주세요</p>
    </div>

    <!-- 지금 바로 요청 버튼 (카카오 T 스타일) -->
    <div style="margin:0 0 20px;padding:20px;background:linear-gradient(135deg,#1a1a1a,#333);border-radius:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
      <div>
        <div style="font-size:1rem;font-weight:800;color:#fff;margin-bottom:4px;">지금 바로 도우미 요청</div>
        <div style="font-size:0.78rem;color:rgba(255,255,255,0.65);">주변 온라인 도우미 전체에게 알림 전송</div>
      </div>
      <button onclick="openBroadcastModal()" style="flex-shrink:0;padding:13px 24px;background:#00AA76;border:none;border-radius:999px;color:#fff;font-size:0.92rem;font-weight:800;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
        🐕 지금 바로
      </button>
    </div>

    <div id="matching-alert"></div>
    ${profileCard}

    <!-- GPS 지도 (메인) -->
    <div class="match-section">
      <div class="dw-section__header" style="margin-bottom:12px;">
        <h2 class="match-section__title" style="margin:0;">📍 내 근처 산책 도우미</h2>
        <div class="dw-map-controls">
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
        <div class="dw-map-hint" id="dw-map-hint">
          <div class="spinner" style="width:28px;height:28px;margin-bottom:12px;"></div>
          <div>GPS로 위치를 불러오는 중이에요...</div>
        </div>
      </div>
    </div>

    ${scheduledWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">📅 예정된 산책</h2>${scheduledHtml}</div>` : ''}
    ${completedWalks.length > 0 ? `<div class="match-section"><h2 class="match-section__title">✅ 완료된 산책</h2>${completedHtml}</div>` : ''}

    <div class="match-section" id="direct-history-section" style="display:none;">
      <h2 class="match-section__title">📋 산책 기록</h2>
      <div id="requester-history-wrap"><div class="spinner" style="margin:20px auto;"></div></div>
    </div>
    <div id="review-form-container"></div>
  `);

  // GPS 자동 로드
  setTimeout(() => loadDWDiscovery(), 300);

  renderDirectWalkHistory(user.id, 'requester').then(({ html, hasRecords }) => {
    const section = document.getElementById('direct-history-section');
    const wrap    = document.getElementById('requester-history-wrap');
    if (section && wrap) {
      if (hasRecords) { wrap.innerHTML = html; section.style.display = ''; }
      else section.style.display = 'none';
    }
  });
}

/** 매칭 프로필 등록 해제 */
function handleRemoveMatchProfile() {
  if (!confirm('매칭 등록을 해제하시겠어요?')) return;
  const user = AuthService.getCurrentUser();
  if (!user) return;
  MatchingService.removeProfile(user.id);
  refreshDrawer();
  renderMatchingPage();
}

function handleSwitchRole() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  const myProfile = MatchingService.getMyProfile(user.id);
  const currentRole = myProfile?.role === 'walker' ? '산책 도우미' : '산책 요청자';
  const nextRole    = myProfile?.role === 'walker' ? '산책 요청자' : '산책 도우미';
  if (!confirm(`현재 ${currentRole} 역할을 해제하고 ${nextRole}로 변경할까요?`)) return;
  MatchingService.removeProfile(user.id);
  refreshDrawer();
  renderMatchingRoleSelect(myProfile?.role === 'walker' ? 'requester' : 'walker');
}

/** 도우미 가용 상태 토글 */
async function _syncWalkerState(userId, wantOn, lat, lng) {
  try {
    const res = await fetch('/api/walkers');
    const walkers = await res.json();
    const serverWalker = walkers.find(w => w.userId === userId);
    const serverIsOn = serverWalker?.isAvailable ?? false;

    if (wantOn && !serverIsOn) {
      // OFF → ON: toggle (lat/lng 포함 가능)
      await fetch('/api/walkers/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...(lat && lng ? { lat, lng } : {}) })
      });
    } else if (wantOn && serverIsOn && lat && lng) {
      // 이미 ON, GPS만 업데이트
      await fetch(`/api/walkers/${userId}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      }).catch(() => {});
    } else if (!wantOn && serverIsOn) {
      // ON → OFF: toggle
      await fetch('/api/walkers/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    }

    await MatchingService.refreshFromServer();
  } catch(e) { console.warn('워커 상태 동기화 실패:', e); }
}

async function handleToggleMatcherAvailability() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const currentProfile = MatchingService.getMyProfile(user.id);
  const turningOn = !(currentProfile?.isAvailable);

  if (turningOn) {
    // ON 전환: GPS 먼저 받은 뒤 lat/lng 포함해서 토글
    const statusEl = document.getElementById('dw-avail-status');
    if (statusEl) statusEl.textContent = '📡 위치 감지 중...';

    if (!navigator.geolocation) {
      alert('이 브라우저는 GPS를 지원하지 않아요.');
      if (statusEl) statusEl.textContent = '⭕ 매칭 OFF';
      // 체크박스 원복
      const cb = document.getElementById('match-avail-toggle');
      if (cb) cb.checked = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      MatchingService.setAvailability(user.id, true, lat, lng);
      await _syncWalkerState(user.id, true, lat, lng);
      renderMatchingPage();
    }, async () => {
      MatchingService.setAvailability(user.id, true, null, null);
      await _syncWalkerState(user.id, true, null, null);
      renderMatchingPage();
    }, { timeout: 6000, enableHighAccuracy: false });

  } else {
    MatchingService.setAvailability(user.id, false, null, null);
    await _syncWalkerState(user.id, false, null, null);
    renderMatchingPage();
  }
}

// 요청자 매칭 대기 폴링
let _requesterPollInterval = null;
let _broadcastTargetCount  = 0;

function startRequesterPolling(userId) {
  stopRequesterPolling();
  _requesterPollInterval = setInterval(async () => {
    try {
      const res  = await fetch(`/api/matching/schedules?userId=${userId}`);
      const data = await res.json();
      const newMatch = (data.schedules || []).find(s => s.status === 'scheduled');
      if (newMatch) {
        stopRequesterPolling();
        const alertEl = document.getElementById('matching-alert');
        if (alertEl) {
          alertEl.innerHTML = `
            <div class="match-pending-banner match-pending-banner--success">
              <div class="match-pending-banner__icon">🎉</div>
              <div class="match-pending-banner__text">
                <div class="match-pending-banner__title">매칭이 완료됐어요!</div>
                <div class="match-pending-banner__sub">산책 도우미가 요청을 수락했습니다. 아래에서 확인하세요.</div>
              </div>
            </div>`;
        }
        setTimeout(() => renderMatchingPage(), 1500);
      }
    } catch (e) {}
  }, 5000);
}

function stopRequesterPolling() {
  if (_requesterPollInterval) { clearInterval(_requesterPollInterval); _requesterPollInterval = null; }
}

/** 전체 브로드캐스트 요청 */
async function handleBroadcastWalkRequest() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  const myProfile = MatchingService.getMyProfile(user.id);
  if (!myProfile) return;

  const btn = document.querySelector('[onclick="handleBroadcastWalkRequest()"]');
  if (btn) { btn.disabled = true; btn.textContent = '전송 중...'; }

  const result = await MatchingService.broadcastWalkRequest(user.id, {
    dogName:     myProfile.dogName || '',
    dogSize:     myProfile.dogSize || '',
    location:    myProfile.location || '',
    desiredTime: myProfile.preferredTime || '',
    notes:       myProfile.notes || ''
  });

  if (btn) { btn.disabled = false; btn.textContent = '매칭 요청 보내기'; }

  const alertEl = document.getElementById('matching-alert');
  if (result.success) {
    _broadcastTargetCount = result.targetCount;
    if (alertEl) {
      alertEl.innerHTML = `
        <div class="match-pending-banner">
          <div class="match-pending-banner__icon">
            <div class="match-pending-spinner"></div>
          </div>
          <div class="match-pending-banner__text">
            <div class="match-pending-banner__title">도우미 ${result.targetCount}명에게 요청을 보냈어요</div>
            <div class="match-pending-banner__sub">수락 대기 중입니다. 도우미가 응답하면 바로 알려드려요.</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="stopRequesterPolling();document.getElementById('matching-alert').innerHTML='';" style="white-space:nowrap;font-size:0.75rem;">취소</button>
        </div>`;
    }
    startRequesterPolling(user.id);
  } else {
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-error">${result.error || '주변에 산책 가능한 도우미가 없습니다.'}</div>`;
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
          <p>반려견을 등록하면 맞춤 서비스를 받을 수 있어요</p>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%; padding:14px; font-size:1rem;" onclick="showLoginModal('프로필 설정, 반려견 등록, 닉네임 변경 등을 하려면 로그인이 필요해요!')">로그인하고 프로필 설정하기</button>
    `);
    return;
  }

  const sizeMap = { small: '소형', medium: '중형', large: '대형' };

  // localStorage에서 반려견 사진 로드
  if (user.dogs) {
    user.dogs.forEach(d => {
      const saved = localStorage.getItem('dogPhoto_' + d.id);
      if (saved) d.photo = saved;
    });
  }

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
              ${d.photo
                ? `<img src="${d.photo}" style="width:44px; height:44px; border-radius:50%; object-fit:cover;">`
                : `<div style="width:44px; height:44px; border-radius:50%; background:var(--color-primary-light); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700; color:var(--color-primary);">${d.name.charAt(0)}</div>`
              }
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
      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <div style="flex:1;">
          <label style="font-size:0.85rem; font-weight:600; margin-bottom:4px; display:block;">서류 종류</label>
          <select id="upload-type" class="form-select">
            <option value="vaccination">예방접종 기록</option>
            <option value="diagnosis">진단서</option>
            <option value="other">기타</option>
          </select>
        </div>
        <div style="flex:1;">
          <label style="font-size:0.85rem; font-weight:600; margin-bottom:4px; display:block;">파일 선택</label>
          <input type="file" id="upload-file" accept=".pdf,.jpg,.jpeg,.png" class="form-input" style="padding:8px;">
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="handleUploadFile()">업로드</button>
      <div id="uploaded-files" style="margin-top:16px;"></div>
    </div>

    <!-- 토스 스타일 반려견 등록 모달 -->
    <div id="dog-reg-modal" style="display:none; position:fixed; inset:0; z-index:5000; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);">
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div id="dog-reg-card" style="background:#fff; border-radius:20px; width:100%; max-width:420px; min-height:400px; padding:40px 32px; position:relative; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.15);">
          <button onclick="closeDogRegisterFlow()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.2rem; color:#999; cursor:pointer;">✕</button>
          <div id="dog-reg-progress" style="display:flex; gap:4px; margin-bottom:32px;"></div>
          <div id="dog-reg-content" style="flex:1; display:flex; flex-direction:column;"></div>
        </div>
      </div>
    </div>
  `);

  loadUploadedFiles(user.id);
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
    { value: 'small', label: '소형', desc: '~10kg' },
    { value: 'medium', label: '중형', desc: '10~25kg' },
    { value: 'large', label: '대형', desc: '25kg~' }
  ]},
  { key: 'weight', question: '체중이 어떻게 돼요?', sub: '정확하지 않아도 괜찮아요', type: 'number', placeholder: '예: 7.5', min: 0, max: 100, required: false, unit: 'kg' },
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
    inputHtml = `<div style="display:flex; align-items:center; gap:8px; margin-top:24px;"><input type="number" id="dog-reg-input" class="form-input" placeholder="${step.placeholder || ''}" value="${_dogRegData[step.key] || ''}" min="${step.min || 0}" max="${step.max || 100}" style="font-size:1.1rem; padding:14px 16px; border-radius:12px; flex:1;" autofocus onkeydown="if(event.key==='Enter')nextDogRegStep()"><span style="font-size:1rem; font-weight:600; color:var(--color-text-muted);">${step.unit || '살'}</span></div>`;
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

  const zoom = _dogRegData._cropZoom || 150;

  img.onload = () => {
    applyDogPhotoCropPosition();
  };

  if (img.complete) applyDogPhotoCropPosition();

  let dragging = false;
  let startX = 0, startY = 0, origX = 0, origY = 0;

  function onStart(x, y) {
    dragging = true;
    startX = x;
    startY = y;
    origX = _dogRegData._cropX || 0;
    origY = _dogRegData._cropY || 0;
    area.style.cursor = 'grabbing';
  }

  function onMove(x, y) {
    if (!dragging) return;
    _dogRegData._cropX = origX + (x - startX);
    _dogRegData._cropY = origY + (y - startY);
    applyDogPhotoCropPosition();
  }

  function onEnd() {
    dragging = false;
    area.style.cursor = 'grab';
    clampCropPosition();
    saveCroppedPhoto();
  }

  area.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(e.clientX, e.clientY); });
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onEnd);

  area.addEventListener('touchstart', (e) => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; onMove(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchend', onEnd);
}

function applyDogPhotoCropPosition() {
  const img = document.getElementById('dog-photo-crop-img');
  const area = document.getElementById('dog-photo-crop-area');
  if (!img || !area) return;

  const areaSize = 160;
  const zoom = (_dogRegData._cropZoom || 150) / 100;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  if (!imgW || !imgH) return;

  const ratio = imgW / imgH;
  let w, h;
  if (ratio > 1) {
    h = areaSize * zoom;
    w = h * ratio;
  } else {
    w = areaSize * zoom;
    h = w / ratio;
  }

  const cx = _dogRegData._cropX || 0;
  const cy = _dogRegData._cropY || 0;

  img.style.width = w + 'px';
  img.style.height = h + 'px';
  img.style.left = ((areaSize - w) / 2 + cx) + 'px';
  img.style.top = ((areaSize - h) / 2 + cy) + 'px';
}

function clampCropPosition() {
  const img = document.getElementById('dog-photo-crop-img');
  if (!img) return;

  const areaSize = 160;
  const zoom = (_dogRegData._cropZoom || 150) / 100;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  if (!imgW || !imgH) return;

  const ratio = imgW / imgH;
  let w, h;
  if (ratio > 1) { h = areaSize * zoom; w = h * ratio; } else { w = areaSize * zoom; h = w / ratio; }

  const maxX = Math.max(0, (w - areaSize) / 2);
  const maxY = Math.max(0, (h - areaSize) / 2);

  _dogRegData._cropX = Math.max(-maxX, Math.min(maxX, _dogRegData._cropX || 0));
  _dogRegData._cropY = Math.max(-maxY, Math.min(maxY, _dogRegData._cropY || 0));

  applyDogPhotoCropPosition();
}

function saveCroppedPhoto() {
  const img = document.getElementById('dog-photo-crop-img');
  if (!img || !img.naturalWidth) return;

  const areaSize = 160;
  const zoom = (_dogRegData._cropZoom || 150) / 100;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const ratio = imgW / imgH;
  let w, h;
  if (ratio > 1) { h = areaSize * zoom; w = h * ratio; } else { w = areaSize * zoom; h = w / ratio; }

  const cx = _dogRegData._cropX || 0;
  const cy = _dogRegData._cropY || 0;
  const drawX = (areaSize - w) / 2 + cx;
  const drawY = (areaSize - h) / 2 + cy;

  const canvas = document.createElement('canvas');
  const outputSize = 320;
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');

  const scale = outputSize / areaSize;
  ctx.drawImage(img, drawX * scale, drawY * scale, w * scale, h * scale);

  _dogRegData.photo = canvas.toDataURL('image/jpeg', 0.85);
}

function nextDogRegStep() {
  const step = _dogRegSteps[_dogRegStep];
  if (step.type !== 'photo') {
    const input = document.getElementById('dog-reg-input');
    if (input) _dogRegData[step.key] = input.value.trim();
  }
  if (step.required && !_dogRegData[step.key]) {
    const input = document.getElementById('dog-reg-input');
    if(input) input.style.borderColor='#e53e3e';
    return;
  }
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

  const user = AuthService.getCurrentUser();
  if (!user) return;

  const result = AuthService.registerDog(user.id, {
    name: _dogRegData.name,
    breed: _dogRegData.breed,
    age: Number(_dogRegData.age) || 0,
    size: _dogRegData.size || 'medium',
    gender: _dogRegData.gender || null,
    weight: _dogRegData.weight ? Number(_dogRegData.weight) : null,
    neutered: _dogRegData.neutered === 'yes' ? true : _dogRegData.neutered === 'no' ? false : null,
    personality: _dogRegData.personality || null,
    healthNote: _dogRegData.healthNote || null
  });

  if (result.success) {
    // 사진은 별도 localStorage에 저장
    if (_dogRegData.photo && result.dog) {
      localStorage.setItem('dogPhoto_' + result.dog.id, _dogRegData.photo);
    }
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
  const errEl = document.getElementById('upload-error');

  if (!fileInput?.files[0]) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">파일을 선택해주세요.</div>';
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('userId', user.id);
  formData.append('type', type);
  formData.append('dogId', user.dogs?.[0]?.name || 'default');

  try {
    if (errEl) errEl.innerHTML = '<div class="alert alert-success">업로드 중... 📤</div>';
    const resp = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await resp.json();
    if (data.success) {
      if (errEl) errEl.innerHTML = '<div class="alert alert-success">업로드 완료! ✅</div>';
      fileInput.value = '';
      loadUploadedFiles(user.id);
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

  try {
    const resp = await fetch(`/api/upload/list/${userId}`);
    const data = await resp.json();
    if (!data.success || data.files.length === 0) {
      container.innerHTML = '<p style="font-size:0.85rem; color:var(--color-text-muted);">업로드된 서류가 없습니다.</p>';
      return;
    }

    const typeLabel = { vaccination: '💉 예방접종 기록', diagnosis: '🏥 진단서', other: '📄 기타' };
    container.innerHTML = data.files.map(f => `
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
    <div style="text-align:center; margin-bottom:16px;">
      <div id="edit-dog-photo-preview-${idx}" style="width:80px; height:80px; border-radius:50%; margin:0 auto 10px; ${d.photo ? `background:url('${d.photo}') center/cover` : 'background:#f5f3f0; display:flex; align-items:center; justify-content:center; font-size:2rem;'} overflow:hidden; border:2px dashed #e5e3e0;">${d.photo ? '' : '📷'}</div>
      <label style="display:inline-block; padding:6px 16px; background:#1a1a1a; color:#fff; border-radius:10px; font-size:0.78rem; font-weight:700; cursor:pointer;">
        사진 변경
        <input type="file" id="edit-dog-photo-${idx}" accept="image/*" style="display:none;" onchange="handleEditDogPhoto(this, ${idx})">
      </label>
      ${d.photo ? `<button onclick="clearEditDogPhoto(${idx})" style="margin-left:6px; padding:6px 12px; background:#FFF0F0; color:#D32F2F; border:none; border-radius:10px; font-size:0.78rem; font-weight:600; cursor:pointer;">삭제</button>` : ''}
    </div>
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

let _editDogPhotoData = {};

function handleEditDogPhoto(input, idx) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 2 * 1024 * 1024) { alert('2MB 이하 사진만 업로드 가능해요.'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    _editDogPhotoData[idx] = e.target.result;
    const preview = document.getElementById(`edit-dog-photo-preview-${idx}`);
    if (preview) {
      preview.style.background = `url(${e.target.result}) center/cover`;
      preview.innerHTML = '';
    }
  };
  reader.readAsDataURL(file);
}

function clearEditDogPhoto(idx) {
  _editDogPhotoData[idx] = '';
  const preview = document.getElementById(`edit-dog-photo-preview-${idx}`);
  if (preview) {
    preview.style.background = '#f5f3f0';
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';
    preview.innerHTML = '📷';
  }
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

  // 사진은 별도 localStorage에 저장 (서버 동기화 문제 방지)
  if (_editDogPhotoData[idx] !== undefined) {
    const dogId = user.dogs[idx].id;
    if (_editDogPhotoData[idx]) {
      localStorage.setItem('dogPhoto_' + dogId, _editDogPhotoData[idx]);
    } else {
      localStorage.removeItem('dogPhoto_' + dogId);
    }
    delete _editDogPhotoData[idx];
  }

  // currentUser 기준으로 수정
  const currentDog = user.dogs[idx];
  currentDog.name = name;
  currentDog.breed = breed;
  currentDog.age = Number(age);
  currentDog.size = size;
  currentDog.gender = gender || null;
  currentDog.weight = weight ? Number(weight) : null;
  currentDog.neutered = neutered === 'yes' ? true : neutered === 'no' ? false : null;
  currentDog.personality = personality || null;
  currentDog.healthNote = healthNote || null;

  // 서버 캐시 업데이트
  const users = StorageService.get('users', []);
  const userIdx = users.findIndex(u => u.id === user.id);
  if (userIdx !== -1) {
    users[userIdx].dogs = user.dogs;
    StorageService.set('users', users);
  }

  StorageService.set('currentUser', user);
  renderProfilePage();
}

// --- 로그인 페이지 ---
function renderLoginPage() {
  renderPage(`
    <div class="auth-container">
      <div class="auth-card">
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
        <div style="display:flex; align-items:center; gap:12px; margin-top:16px;">
          <div style="flex:1; height:1px; background:var(--color-border);"></div>
          <span style="font-size:0.75rem; color:var(--color-text-muted); white-space:nowrap;">아직 계정이 없으신가요?</span>
          <div style="flex:1; height:1px; background:var(--color-border);"></div>
        </div>
        <a href="#/register" style="display:block; margin-top:12px; padding:13px 16px; background:#111; border-radius:var(--radius-full); font-size:0.88rem; font-weight:700; color:#fff; text-align:center; text-decoration:none; transition:opacity 0.15s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">회원가입</a>
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

/** 인라인 onclick 속성에서 문자열을 안전하게 사용하기 위한 단따옴표 이스케이프 */
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

  // 도그워커 마커 (ON + GPS 있는 것만 지도에 표시)
  const nearbyWalkers = MatchingService.getNearbyWalkers(userLat, userLng, radiusKm);
  const allWalkers    = MatchingService.getAllWalkers().filter(w => w.lat && w.lng && w.isAvailable);
  const noGpsWalkers  = MatchingService.getAllWalkers().filter(w => !w.lat && w.isAvailable);

  const currentUser = AuthService.getCurrentUser();

  // GPS 없는 ON 워커 안내
  if (noGpsWalkers.length > 0) {
    const hint = document.getElementById('dw-map-hint');
    const noGpsEl = document.createElement('div');
    noGpsEl.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.65);color:#fff;font-size:0.78rem;padding:6px 14px;border-radius:20px;z-index:999;white-space:nowrap;pointer-events:none;';
    noGpsEl.textContent = `📍 GPS 미등록 도우미 ${noGpsWalkers.length}명은 지도에 표시되지 않아요`;
    document.getElementById('dw-disc-map')?.parentElement?.style && (document.getElementById('dw-disc-map').parentElement.style.position = 'relative');
    document.getElementById('dw-disc-map')?.after(noGpsEl);
  }

  allWalkers.forEach(w => {
    const distObj = nearbyWalkers.find(n => n.userId === w.userId);
    const distTxt = distObj
      ? (distObj.distance < 1 ? `${(distObj.distance * 1000).toFixed(0)}m` : `${distObj.distance.toFixed(1)}km`)
      : '';

    const icon = L.divIcon({
      html: `<div class="dw-map-walker-pin">
        <div class="dw-map-walker-pin__avatar">${(w.userName || w.name || '?').charAt(0)}</div>
        <div class="dw-map-walker-pin__tail"></div>
      </div>`,
      className: '', iconSize: [44, 54], iconAnchor: [22, 54]
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

/** 네비 드로어에서 매칭 ON/OFF 토글 */
function toggleMatchAvail() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  const profile = MatchingService.getMyProfile(user.id);
  if (!profile) return;
  MatchingService.toggleAvailability(user.id);
  refreshDrawer();
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

  // 산책 요청자 프로필이 있으면 반려견 정보 포함해서 요청
  const myProfile = MatchingService.getMyProfile(user.id);
  if (myProfile && myProfile.role === 'requester') {
    _sendRequesterMapRequest(toUserId, user, myProfile);
  } else {
    MatchingService.sendRequest(user.id, toUserId);
    const btn = document.querySelector(`[data-walker-id="${toUserId}"] .btn-primary`);
    if (btn) { btn.textContent = '요청 완료 ✓'; btn.disabled = true; btn.style.opacity = '0.7'; }
  }
}

async function _sendRequesterMapRequest(toUserId, user, myProfile) {
  // GPS 좌표 확보 (이미 있으면 재사용, 없으면 새로 요청)
  let pickupLat = _dwUserLat;
  let pickupLng = _dwUserLng;
  if (!pickupLat && navigator.geolocation) {
    await new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => { pickupLat = pos.coords.latitude; pickupLng = pos.coords.longitude; resolve(); },
        () => resolve(),
        { timeout: 5000, enableHighAccuracy: true }
      );
    });
  }

  try {
    const res = await fetch('/api/walk-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId:        user.id,
        requesterName:      user.name || user.nickname,
        walkerId:           toUserId,
        dogName:            myProfile.dogName || '',
        dogSize:            myProfile.dogSize || '',
        dogBreed:           myProfile.dogBreed || '',
        requestMessage:     myProfile.notes || '',
        requestedStartTime: myProfile.preferredTime || '',
        pickupLatitude:     pickupLat || null,
        pickupLongitude:    pickupLng || null,
      })
    });
    const data = await res.json();
    if (data.success || data.request) {
      const requestId = data.request?.id;
      // 팝업 버튼 업데이트
      const popup = document.querySelector('.walker-card-popup');
      if (popup) {
        const btn = popup.querySelector('.wcp-btn--primary');
        if (btn) { btn.textContent = '✓ 요청 완료'; btn.disabled = true; btn.style.background = '#38a169'; }
      }
      // 대기 배너 표시
      const alertEl = document.getElementById('matching-alert');
      if (alertEl) {
        alertEl.innerHTML = `
          <div class="match-pending-banner">
            <div class="match-pending-banner__icon"><div class="match-pending-spinner"></div></div>
            <div class="match-pending-banner__text">
              <div class="match-pending-banner__title">도우미에게 요청을 보냈어요!</div>
              <div class="match-pending-banner__sub">도우미가 수락하면 바로 알려드려요.</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="cancelWalkRequest('${requestId}')" style="white-space:nowrap;font-size:0.75rem;">취소</button>
          </div>`;
      }
      // 수락 폴링 시작
      startWalkRequestPolling(user.id, requestId);
    } else {
      alert(data.error || '요청 전송에 실패했어요.');
    }
  } catch(e) {
    alert('요청 전송에 실패했어요. 다시 시도해주세요.');
  }
}

// 도우미 실시간 위치 전송 (수락 후 요청자에게 위치 공유)
let _walkerLocationBroadcastInterval = null;
function startWalkerLocationBroadcast(requestId) {
  if (_walkerLocationBroadcastInterval) clearInterval(_walkerLocationBroadcastInterval);
  if (!navigator.geolocation) return;

  const sendLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      fetch(`/api/walk-requests/${requestId}/walker-location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }).catch(() => {});
    }, () => {}, { enableHighAccuracy: true, timeout: 5000 });
  };

  sendLocation();
  _walkerLocationBroadcastInterval = setInterval(sendLocation, 5000);
}

function stopWalkerLocationBroadcast() {
  if (_walkerLocationBroadcastInterval) { clearInterval(_walkerLocationBroadcastInterval); _walkerLocationBroadcastInterval = null; }
}

// 요청 상태 폴링 (accepted/rejected 감지)
let _walkRequestPollInterval = null;
let _walkerMapMarker = null; // 요청자 지도의 도우미 마커

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
    html: `<div style="background:#4299E1;color:#fff;border-radius:50% 50% 50% 0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;border:2px solid #fff;box-shadow:0 2px 8px rgba(66,153,225,0.5);transform:rotate(-45deg)"><span style="transform:rotate(45deg)">🚶</span></div>`,
    className: '', iconSize: [36,36], iconAnchor: [18,36]
  });
  if (_walkerMapMarker) {
    _walkerMapMarker.setLatLng([lat, lng]);
  } else {
    _walkerMapMarker = L.marker([lat, lng], { icon })
      .bindPopup(`<b>${walkerName || '도우미'}</b><br>이동 중 🚶`)
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
        <div style="font-size:2.5rem;margin-bottom:8px;">🐾</div>
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
          ${req.walkerExperience ? `<span>📋 경력 ${req.walkerExperience}</span>` : ''}
          ${req.walkerPrice ? `<span>💰 ₩${Number(req.walkerPrice).toLocaleString()}/시간</span>` : ''}
          ${req.walkerRating ? `<span>⭐ ${Number(req.walkerRating).toFixed(1)}점</span>` : ''}
          ${req.walkerReviewCount ? `<span>💬 리뷰 ${req.walkerReviewCount}건</span>` : ''}
        </div>
        ${req.walkerPhone ? `<div style="margin-top:10px;padding:8px 12px;background:#EBF8FF;border-radius:8px;font-size:0.85rem;"><span style="font-weight:700;">📞 연락처:</span> ${req.walkerPhone}</div>` : ''}
      </div>

      <button class="btn btn-primary" style="width:100%;margin-bottom:10px;padding:14px;font-size:1rem;" onclick="startWalkSessionByRequester('${req.id}','${req.walkerId}')">
        🐕 도우미 도착! 산책 시작
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
        <div class="match-pending-banner__icon">🐕</div>
        <div class="match-pending-banner__text">
          <div class="match-pending-banner__title">산책 중이에요!</div>
          <div class="match-pending-banner__sub">GPS 트래킹으로 이동할게요.</div>
        </div>
      </div>`;
    setTimeout(() => Router.navigate('/walk-tracking'), 1500);
  }
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
  });

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

  const listHtml = listWalks.length > 0 ? listWalks.map(w => `
    <div class="walk-history-item" id="walk-item-${w.id}">
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
    </div>
  `).join('') : `<div style="text-align:center; padding:16px; color:var(--color-text-muted); font-size:0.82rem;">${_walkCalSelectedDate ? _walkCalSelectedDate + '일에 기록이 없습니다' : '이 달에 기록이 없습니다'}</div>`;

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

// --- 건강 분석 대시보드 페이지 ---
async function renderHealthDashboardPage() {
  const user = AuthService.getCurrentUser();
  if (!user) {
    renderPage(`
      <div class="page-header">
        <h1>❤️ 건강 분석 대시보드</h1>
        <p>AI 건강 분석 리포트를 확인해보세요</p>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
        <div class="card" style="padding:20px; text-align:center;">
          <div style="font-size:2rem;">🏃</div>
          <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:4px;">총 산책</div>
          <div style="font-size:1.3rem; font-weight:800;">- 회</div>
        </div>
        <div class="card" style="padding:20px; text-align:center;">
          <div style="font-size:2rem;">📏</div>
          <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:4px;">총 거리</div>
          <div style="font-size:1.3rem; font-weight:800;">- km</div>
        </div>
        <div class="card" style="padding:20px; text-align:center;">
          <div style="font-size:2rem;">⏱️</div>
          <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:4px;">총 시간</div>
          <div style="font-size:1.3rem; font-weight:800;">- 분</div>
        </div>
        <div class="card" style="padding:20px; text-align:center;">
          <div style="font-size:2rem;">🔥</div>
          <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:4px;">총 칼로리</div>
          <div style="font-size:1.3rem; font-weight:800;">- kcal</div>
        </div>
      </div>
      <div class="card" style="padding:20px; margin-bottom:16px;">
        <h3 style="margin-bottom:12px;">🤖 AI 건강 분석</h3>
        <p style="color:var(--color-text-muted); font-size:0.9rem;">산책 데이터를 기반으로 AI가 반려견의 건강 상태를 분석하고 맞춤 조언을 제공해요.</p>
        <div style="margin-top:16px; padding:20px; background:var(--color-bg-warm); border-radius:12px; text-align:center;">
          <p style="color:var(--color-text-muted);">아직 분석할 데이터가 없어요</p>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%; padding:14px; font-size:1rem;" onclick="showLoginModal('건강 분석을 이용하려면 로그인이 필요해요!\\n반려견의 산책 데이터를 기반으로 AI가 건강을 분석해드려요.')">🏃 산책 시작하고 데이터 모으기</button>
    `);
    return;
  }

  const dogs = user.dogs || [];
  const selectedDogId = StorageService.get('selectedDogId', '_all');
  const dog = selectedDogId !== '_all' ? dogs.find(d => d.name === selectedDogId) : null;
  const displayName = dog ? dog.name : '전체';

  renderPage(`
    <style>
      .health-page { max-width:600px; margin:0 auto; }
      .health-header { margin-bottom:28px; }
      .health-header__title { font-size:1.6rem; font-weight:700; letter-spacing:-0.5px; }
      .health-header__sub { font-size:0.85rem; color:var(--color-text-muted); margin-top:4px; }
      .health-dog-chips { display:flex; gap:8px; margin-bottom:28px; flex-wrap:wrap; }
      .health-dog-chip { padding:8px 18px; border:1.5px solid var(--color-border); border-radius:20px; font-size:0.82rem; font-weight:600; background:#fff; cursor:pointer; transition:all 0.15s; }
      .health-dog-chip.active { background:var(--color-text); color:#fff; border-color:var(--color-text); }
      .health-score-ring { width:140px; height:140px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-direction:column; margin:0 auto 24px; position:relative; }
      .health-score-ring__value { font-size:2.8rem; font-weight:700; letter-spacing:-2px; line-height:1; }
      .health-score-ring__label { font-size:0.72rem; color:var(--color-text-muted); margin-top:4px; text-transform:uppercase; letter-spacing:1px; }
      .health-summary-card { background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:16px; padding:24px; margin-bottom:16px; }
      .health-summary-card__title { font-size:0.72rem; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:600; margin-bottom:16px; }
      .health-stats-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
      .health-stat-card { background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:14px; padding:20px; }
      .health-stat-card__label { font-size:0.72rem; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:600; }
      .health-stat-card__value { font-size:1.8rem; font-weight:700; letter-spacing:-1px; margin-top:4px; line-height:1; }
      .health-stat-card__unit { font-size:0.75rem; color:var(--color-text-muted); font-weight:500; }
      .health-stat-card__sub { font-size:0.72rem; color:var(--color-text-muted); margin-top:6px; }
      .health-section { margin-bottom:24px; }
      .health-section__title { font-size:0.75rem; text-transform:uppercase; letter-spacing:1.5px; color:var(--color-text-muted); font-weight:600; margin-bottom:12px; }
      .health-insight { background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:14px; padding:18px 20px; margin-bottom:10px; }
      .health-insight__header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
      .health-insight__title { font-size:0.88rem; font-weight:700; }
      .health-insight__badge { font-size:0.68rem; font-weight:700; padding:3px 10px; border-radius:12px; }
      .health-insight__text { font-size:0.82rem; color:var(--color-text-light); line-height:1.6; }
      .health-detail-row { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--color-border-light); }
      .health-detail-row:last-child { border-bottom:none; }
      .health-detail-row__label { font-size:0.85rem; color:var(--color-text-light); }
      .health-detail-row__value { font-size:0.88rem; font-weight:700; }
      .health-action-btn { width:100%; padding:14px; border:1px solid var(--color-border); border-radius:12px; background:#fff; font-size:0.88rem; font-weight:600; text-align:center; cursor:pointer; transition:all 0.15s; margin-bottom:8px; }
      .health-action-btn:hover { border-color:var(--color-text); }
    </style>

    <div class="health-page">
      <div class="health-header">
        <div class="health-header__title">건강 분석</div>
        <div class="health-header__sub">${displayName === '전체' ? '전체 반려견' : dog.name + '의'} 건강 리포트</div>
      </div>

      ${dogs.length > 0 ? `
        <div class="health-dog-chips">
          <button class="health-dog-chip ${selectedDogId === '_all' ? 'active' : ''}" onclick="StorageService.set('selectedDogId','_all');renderHealthDashboardPage()">전체</button>
          ${dogs.map(d => `<button class="health-dog-chip ${selectedDogId === d.name ? 'active' : ''}" onclick="StorageService.set('selectedDogId','${d.name}');renderHealthDashboardPage()">${d.name}</button>`).join('')}
        </div>
      ` : ''}

      <div id="health-alert"></div>
      <div id="health-stats-section">
        <div style="text-align:center; padding:40px;"><div class="spinner"></div></div>
      </div>
      <div id="health-analysis-section"></div>

      <button class="health-action-btn" onclick="Router.navigate('/walk-tracking')">산책 시작하기</button>
      <button class="health-action-btn" onclick="Router.navigate('/ai')">AI 상담 받기</button>
    </div>
  `);

  await loadHealthDashboard(user);
}

function handleSelectHealthDog() {
  const sel = document.getElementById('health-dog-select');
  if (sel) {
    StorageService.set('selectedDogId', sel.value);
    renderHealthDashboardPage();
  }
}

async function loadHealthDashboard(user) {
  const statsSection = document.getElementById('health-stats-section');
  const analysisSection = document.getElementById('health-analysis-section');

  const dogs = user.dogs || [];
  const selectedDogId = StorageService.get('selectedDogId', '_all');
  const dog = selectedDogId !== '_all' ? dogs.find(d => d.name === selectedDogId) : null;
  const dogFilter = selectedDogId !== '_all' ? selectedDogId : null;

  // 선택된 반려견의 산책 통계 로드
  const stats = await GPSTrackingService.getWalkStats(user.id, dogFilter);
  const activityScore = HealthAnalysisService.calcActivityScore(stats);

  if (statsSection) {
    if (!stats || stats.total.count === 0) {
      statsSection.innerHTML = `
        <div style="text-align:center; padding:48px 20px;">
          <div class="health-score-ring" style="border:3px dashed var(--color-border);">
            <div class="health-score-ring__value" style="color:var(--color-text-muted);">--</div>
            <div class="health-score-ring__label">활동 점수</div>
          </div>
          <p style="font-size:0.9rem; font-weight:600; margin-bottom:6px;">아직 산책 데이터가 없어요</p>
          <p style="font-size:0.82rem; color:var(--color-text-muted);">산책을 시작하면 건강을 분석해드려요</p>
        </div>
      `;
    } else {
      const scoreColor = activityScore >= 70 ? '#38a169' : activityScore >= 40 ? '#d69e2e' : '#e53e3e';
      statsSection.innerHTML = `
        <div style="text-align:center; margin-bottom:24px;">
          <div class="health-score-ring" style="background:conic-gradient(${scoreColor} ${activityScore * 3.6}deg, var(--color-border-light) 0deg); padding:6px;">
            <div style="width:100%; height:100%; border-radius:50%; background:var(--color-bg); display:flex; align-items:center; justify-content:center; flex-direction:column;">
              <div class="health-score-ring__value" style="color:${scoreColor};">${activityScore}</div>
              <div class="health-score-ring__label">활동 점수</div>
            </div>
          </div>
        </div>

        <div class="health-stats-row">
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 산책</div>
            <div class="health-stat-card__value">${stats.weekly.count}<span class="health-stat-card__unit"> 회</span></div>
            <div class="health-stat-card__sub">총 ${stats.total.count}회</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 거리</div>
            <div class="health-stat-card__value">${stats.weekly.totalDistance}<span class="health-stat-card__unit"> km</span></div>
            <div class="health-stat-card__sub">총 ${stats.total.totalDistance}km</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 시간</div>
            <div class="health-stat-card__value">${stats.weekly.totalDuration}<span class="health-stat-card__unit"> 분</span></div>
            <div class="health-stat-card__sub">평균 ${stats.total.avgDuration}분/회</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 칼로리</div>
            <div class="health-stat-card__value">${stats.weekly.totalCalories}<span class="health-stat-card__unit"> kcal</span></div>
            <div class="health-stat-card__sub">평균 ${stats.total.avgDistance}km/회</div>
          </div>
        </div>
      `;
    }
  }

  // 캐시된 분석 결과 표시 (반려견별)
  const cached = HealthAnalysisService.getCachedAnalysis(user.id, selectedDogId);
  if (cached && analysisSection) {
    renderHealthAnalysisResult(cached.analysis, analysisSection, selectedDogId);
  } else if (analysisSection && stats && stats.total.count > 0) {
    // 캐시 없으면 자동 분석 실행
    handleRunHealthAnalysis();
  }
}

async function handleRunHealthAnalysis() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const dogs = user.dogs || [];
  const selectedDogId = StorageService.get('selectedDogId', '_all');
  const dog = selectedDogId !== '_all' ? dogs.find(d => d.name === selectedDogId) : null;
  const alertEl = document.getElementById('health-alert');
  const section = document.getElementById('health-analysis-section');

  if (section) {
    section.innerHTML = `
      <div class="card" style="padding:24px; text-align:center;">
        <div class="spinner"></div>
        <p style="margin-top:12px; color:var(--color-text-muted);">AI가 건강을 분석하고 있어요... 🔬</p>
      </div>
    `;
  }

  try {
    let dogInfo = {};
    if (dog) {
      dogInfo = {
        name: dog.name,
        breed: dog.breed,
        age: dog.age,
        weight: dog.weight || null,
        size: dog.size,
        gender: dog.gender || null,
        neutered: dog.neutered != null ? dog.neutered : null,
        personality: dog.personality || null,
        healthNote: dog.healthNote || null
      };
    } else if (dogs.length > 0) {
      // 전체 선택 시 모든 반려견 정보 전달
      dogInfo = {
        name: '전체 (' + dogs.map(d => d.name).join(', ') + ')',
        allDogs: dogs.map(d => ({
          name: d.name, breed: d.breed, age: d.age, weight: d.weight,
          size: d.size, gender: d.gender, neutered: d.neutered,
          personality: d.personality, healthNote: d.healthNote
        }))
      };
    }
    const analysis = await HealthAnalysisService.analyzeHealth(user.id, dogInfo, selectedDogId);

    if (section) renderHealthAnalysisResult(analysis, section, selectedDogId);
  } catch (e) {
    if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">분석 실패: ${e.message}</div>`;
    if (section) section.innerHTML = '';
  }
}

function renderHealthAnalysisResult(analysis, container, dogId) {
  if (!analysis || !container) return;

  const riskColor = {
    '낮음': 'var(--color-success)', '보통': 'var(--color-primary-dark)',
    '높음': '#FF6B6B', '매우높음': 'var(--color-error)'
  };

  // 캐시 시간 표시
  const cached = HealthAnalysisService.getCachedAnalysis(
    AuthService.getCurrentUser()?.id, dogId
  );
  const analyzedTime = cached?.analyzedAt ? new Date(cached.analyzedAt).toLocaleString('ko-KR') : '';

  container.innerHTML = `
    <div class="health-section">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="health-section__title">AI 분석 결과</div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${analyzedTime ? `<span style="font-size:0.68rem; color:var(--color-text-muted);">${analyzedTime}</span>` : ''}
          <button onclick="handleRunHealthAnalysis()" style="font-size:0.78rem; color:#fff; background:#1a1a1a; border:none; cursor:pointer; padding:7px 16px; border-radius:20px; font-weight:700; transition:all 0.2s;" onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'">새로 분석</button>
        </div>
      </div>

      ${analysis.overallScore !== undefined ? `
      <div class="health-insight">
        <div class="health-insight__header">
          <span class="health-insight__title">종합 건강 점수</span>
          <span class="health-insight__badge" style="background:${analysis.overallScore >= 70 ? '#f0fff4;color:#38a169' : analysis.overallScore >= 40 ? '#fffff0;color:#d69e2e' : '#fff5f5;color:#e53e3e'}">${analysis.overallScore}/100</span>
        </div>
        ${analysis.summary ? `<div class="health-insight__text">${analysis.summary}</div>` : ''}
      </div>` : ''}

      ${analysis.behaviorAnalysis ? `
      <div class="health-insight">
        <div class="health-insight__header">
          <span class="health-insight__title">행동 패턴</span>
          <span class="health-insight__badge" style="background:var(--color-bg-section); color:var(--color-text-light);">${analysis.behaviorAnalysis.consistency || '-'}</span>
        </div>
        <div class="health-insight__text">${analysis.behaviorAnalysis.pattern || ''}</div>
        ${analysis.behaviorAnalysis.recommendation ? `<div class="health-insight__text" style="margin-top:8px; padding-top:8px; border-top:1px solid var(--color-border-light);">${analysis.behaviorAnalysis.recommendation}</div>` : ''}
      </div>` : ''}

      ${analysis.obesityRisk ? `
      <div class="health-insight">
        <div class="health-insight__header">
          <span class="health-insight__title">비만 위험</span>
          <span class="health-insight__badge" style="background:${riskColor[analysis.obesityRisk.level] === 'var(--color-success)' ? '#f0fff4;color:#38a169' : '#fff5f5;color:#e53e3e'}">${analysis.obesityRisk.level || '-'}</span>
        </div>
        ${analysis.obesityRisk.factors ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">${analysis.obesityRisk.factors.map(f => '<span style="font-size:0.72rem; padding:2px 8px; background:var(--color-bg-section); border-radius:8px; color:var(--color-text-light);">' + f + '</span>').join('')}</div>` : ''}
        ${analysis.obesityRisk.recommendation ? `<div class="health-insight__text">${analysis.obesityRisk.recommendation}</div>` : ''}
      </div>` : ''}

      ${analysis.dietRecommendation ? `
      <div class="health-insight">
        <div class="health-insight__title" style="margin-bottom:10px;">식단 추천</div>
        ${analysis.dietRecommendation.dailyCalories ? `<div class="health-detail-row" style="flex-direction:column; align-items:flex-start; gap:4px;"><span class="health-detail-row__label">일일 권장 칼로리</span><span class="health-detail-row__value" style="font-size:0.85rem; line-height:1.5;">${typeof analysis.dietRecommendation.dailyCalories === 'number' ? analysis.dietRecommendation.dailyCalories + ' kcal' : analysis.dietRecommendation.dailyCalories}</span></div>` : ''}
        ${analysis.dietRecommendation.mealFrequency ? `<div class="health-detail-row"><span class="health-detail-row__label">급여 횟수</span><span class="health-detail-row__value">${analysis.dietRecommendation.mealFrequency}</span></div>` : ''}
        ${analysis.dietRecommendation.foods ? `<div style="margin-top:8px;"><span style="font-size:0.72rem; color:var(--color-text-muted);">추천 식품</span><div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">${analysis.dietRecommendation.foods.map(f => '<span style="font-size:0.75rem; padding:3px 10px; background:var(--color-bg-section); border-radius:10px;">' + f + '</span>').join('')}</div></div>` : ''}
        ${analysis.dietRecommendation.avoid ? `<div style="margin-top:8px;"><span style="font-size:0.72rem; color:var(--color-text-muted);">주의 식품</span><div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">${analysis.dietRecommendation.avoid.map(f => '<span style="font-size:0.75rem; padding:3px 10px; background:#fff5f5; border-radius:10px; color:#e53e3e;">' + f + '</span>').join('')}</div></div>` : ''}
      </div>` : ''}

      ${analysis.vaccinationSchedule && analysis.vaccinationSchedule.upcoming && analysis.vaccinationSchedule.upcoming.length > 0 ? `
      <div class="health-insight">
        <div class="health-insight__title" style="margin-bottom:10px;">예방접종 일정</div>
        ${analysis.vaccinationSchedule.upcoming.map(v => `
          <div class="health-detail-row">
            <span class="health-detail-row__label">${v.name}</span>
            <span class="health-detail-row__value" style="font-size:0.82rem;">${v.dueDate || ''}</span>
          </div>
        `).join('')}
        ${analysis.vaccinationSchedule.note ? `<div class="health-insight__text" style="margin-top:8px;">${analysis.vaccinationSchedule.note}</div>` : ''}
      </div>` : ''}
    </div>
  `;
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

  // 1단계: 도우미 수락 → 이동 중 오버레이 표시
  RealtimeService.on('walk-started', (data) => {
    _activeSessionId = data.sessionId;
    showLiveTrackingOverlay(data.sessionId, data.walkerId);
  });

  // 2단계: 도우미 도착
  RealtimeService.on('walker-arrived', (data) => {
    const statusEl = document.getElementById('lt-status');
    if (statusEl) statusEl.textContent = '도우미가 도착했어요! 반려견을 전달해주세요 🐕';
    const phaseEl = document.getElementById('lt-phase');
    if (phaseEl) {
      phaseEl.textContent = '도착';
      phaseEl.style.background = '#F6A623';
    }
    showToast('📍 도우미가 도착했습니다!', 'success');
  });

  // 3단계: 산책 실제 시작 → 오버레이 지도를 경로 트래킹 모드로 전환
  RealtimeService.on('walk-tracking-started', (data) => {
    const statusEl = document.getElementById('lt-status');
    if (statusEl) statusEl.textContent = '반려견 산책 중 · 실시간 위치를 확인하세요';
    const phaseEl = document.getElementById('lt-phase');
    if (phaseEl) {
      phaseEl.textContent = '산책 중';
      phaseEl.style.background = '#00AA76';
    }
    showToast('🐕 산책이 시작됐어요!', 'success');
  });

  // 4단계: 산책 종료
  RealtimeService.on('walk-ended', (data) => {
    stopWalkRouteWatcher();
    const overlay = document.getElementById('live-tracking-overlay');
    if (overlay) {
      const statusEl = document.getElementById('lt-status');
      if (statusEl) statusEl.textContent = `산책 완료 · 총 ${data.totalDistanceKm}km`;
      const endBanner = document.getElementById('lt-end-banner');
      if (endBanner) endBanner.style.display = 'flex';
      setTimeout(() => { overlay.remove(); }, 4000);
    }
    showToast(`🏁 산책 완료! 총 ${data.totalDistanceKm}km`, 'success');
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

  // ── 브로드캐스트 매칭 이벤트 ──────────────────────────────

  // 도우미: 브로드캐스트 요청 수신 → 알림 팝업
  RealtimeService.on('broadcast-walk-request', (data) => {
    showBroadcastNotification(data);
  });

  // 도우미: 다른 도우미가 수락해서 취소됨
  RealtimeService.on('broadcast-cancelled', (data) => {
    const notif = document.getElementById('broadcast-notif');
    if (notif) {
      clearInterval(notif._cdTimer);
      notif.remove();
      if (data.reason !== '요청자가 취소했습니다.') {
        showToast('다른 도우미가 먼저 수락했어요.', 'info');
      }
    }
  });

  // 요청자: 매칭 성공
  RealtimeService.on('broadcast-matched', (data) => {
    clearInterval(_broadcastTimer);
    document.getElementById('broadcast-waiting')?.remove();
    _broadcastRequestId = null;
    showToast(`🎉 ${data.walkerName}님이 수락했어요! 잠시 후 출발할 거예요.`, 'success');
    // 대기 화면 대신 매칭 성공 화면 표시
    showBroadcastMatchedScreen(data);
  });
}

// ============================================================
// 토스트 메시지
// ============================================================

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

      <div class="form-group" style="margin-bottom:14px;">
        <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:8px;">날짜 선택 *</label>
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;" id="wrm-date-btns"></div>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:8px;">시작 시간 *</label>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;" id="wrm-time-btns"></div>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:8px;">산책 시간</label>
        <div style="display:flex;gap:8px;" id="wrm-dur-btns">
          ${['30분','1시간','1시간 30분','2시간'].map((d,i) => `
            <button type="button" onclick="selectWrmDur(this,'${[30,60,90,120][i]}')"
              style="flex:1;padding:9px 4px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.15s;">${d}</button>
          `).join('')}
        </div>
      </div>

      <input type="hidden" id="wrm-start">
      <input type="hidden" id="wrm-end">

      <script>
      (function(){
        const SEL = 'background:#111;color:#fff;border-color:#111;';
        const UNSEL = 'background:#fff;color:#333;border-color:#e2e8f0;';
        let selDate='', selTime='', selDur=60;

        // 날짜 버튼 (오늘~6일)
        const dateCont = document.getElementById('wrm-date-btns');
        const labels = ['오늘','내일','모레'];
        for(let i=0;i<7;i++){
          const d = new Date(); d.setDate(d.getDate()+i);
          const val = d.toISOString().slice(0,10);
          const label = labels[i] || (d.getMonth()+1)+'/'+(d.getDate());
          const sub = (d.getMonth()+1)+'.'+(d.getDate());
          const btn = document.createElement('button');
          btn.type='button';
          btn.dataset.val=val;
          btn.innerHTML='<div style="font-weight:700;font-size:0.88rem">'+label+'</div><div style="font-size:0.72rem;opacity:0.6;margin-top:2px">'+sub+'</div>';
          btn.style.cssText='flex-shrink:0;width:64px;padding:10px 6px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;transition:all 0.15s;text-align:center;';
          btn.onclick=function(){
            dateCont.querySelectorAll('button').forEach(b=>b.style.cssText=b.style.cssText.replace(/background:[^;]+;color:[^;]+;border-color:[^;]+;/,'background:#fff;color:#333;border-color:#e2e8f0;'));
            this.style.cssText=this.style.cssText.replace('background:#fff;color:#333;border-color:#e2e8f0;',SEL);
            selDate=this.dataset.val; updateHidden();
          };
          dateCont.appendChild(btn);
        }

        // 시간 슬롯 (08:00 ~ 21:00, 30분 간격)
        const timeCont = document.getElementById('wrm-time-btns');
        for(let h=8;h<=21;h++){
          ['00','30'].forEach(m=>{
            if(h===21&&m==='30') return;
            const val=h+':'+m;
            const btn=document.createElement('button');
            btn.type='button'; btn.dataset.val=val; btn.textContent=val;
            btn.style.cssText='padding:9px 4px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:0.83rem;font-weight:600;cursor:pointer;transition:all 0.15s;';
            btn.onclick=function(){
              timeCont.querySelectorAll('button').forEach(b=>b.style.cssText=b.style.cssText.replace(/background:[^;]+;color:[^;]+;border-color:[^;]+;/,'background:#fff;color:#333;border-color:#e2e8f0;'));
              this.style.cssText=this.style.cssText.replace('background:#fff;color:#333;border-color:#e2e8f0;',SEL);
              selTime=this.dataset.val; updateHidden();
            };
            timeCont.appendChild(btn);
          });
        }

        window.selectWrmDur=function(btn,mins){
          document.querySelectorAll('#wrm-dur-btns button').forEach(b=>{b.style.background='#fff';b.style.color='#333';b.style.borderColor='#e2e8f0';});
          btn.style.background='#111'; btn.style.color='#fff'; btn.style.borderColor='#111';
          selDur=parseInt(mins); updateHidden();
        };

        function updateHidden(){
          if(!selDate||!selTime) return;
          const start=new Date(selDate+'T'+selTime+':00');
          document.getElementById('wrm-start').value=start.toISOString();
          const end=new Date(start.getTime()+selDur*60000);
          document.getElementById('wrm-end').value=end.toISOString();
        }
      })();
      </script>

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
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">날짜와 시작 시간을 선택해주세요.</div>';
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

    // 카드 내 버튼 즉시 제거 후 "이동 중" 상태로 변경
    const card = document.querySelector(`[onclick*="${requestId}"]`)?.closest('.match-request-card') ||
                 document.querySelector(`button[onclick*="${requestId}"]`)?.closest('div[style*="border"]');
    if (card) {
      const actions = card.querySelector('.match-request-card__actions');
      if (actions) {
        actions.innerHTML = `<div style="background:#EBF8FF;border-radius:8px;padding:10px 12px;font-size:0.82rem;color:#2C5282;width:100%;">🚶 요청자에게 이동 중이에요! 위치로 찾아가세요.</div>`;
      }
      // 상태 뱃지 업데이트
      const badge = card.querySelector('[style*="대기"]') || card.querySelector('span[style*="F6AD55"]');
      if (badge) badge.style.cssText = badge.style.cssText.replace(/background:[^;]+/, 'background:#4299E120').replace(/color:[^;]+/, 'color:#4299E1') + '; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700;';
    }

    document.getElementById('walker-req-notif')?.remove();
    showToast(`✅ ${requesterName}님 요청 수락! 출발 준비가 되면 대시보드에서 출발하기를 눌러주세요.`, 'success');

    // 매칭 페이지면 워커 요청 목록 새로고침
    setTimeout(() => {
      const user = AuthService.getCurrentUser();
      if (user) {
        renderWalkerRequestsList(user.id).then(({ html, requests }) => {
          const el = document.getElementById('walker-new-requests-wrap');
          if (el) { el.innerHTML = html; setTimeout(() => initWalkerNavMaps(requests), 100); }
        });
      }
    }, 500);

  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

async function rejectWalkRequestNotif(requestId) {
  try {
    await fetch(`/api/walk-requests/${requestId}/reject`, { method: 'PATCH' });
    // 카드 즉시 제거
    const card = document.querySelector(`button[onclick*="${requestId}"]`)?.closest('.match-request-card') ||
                 document.querySelector(`button[onclick*="${requestId}"]`)?.closest('div[style*="border"]');
    card?.remove();
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

/** 도우미: 픽업 장소 도착 */
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
    showToast('📍 도착 알림을 보냈어요! 반려견을 픽업해주세요.', 'success');
    renderWalkSessionPage(sessionId);
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

/** 도우미: 산책 실제 시작 (반려견 픽업 완료 후) */
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
    showToast('🐕 산책이 시작됐어요! 요청자에게 실시간 위치가 전송돼요.', 'success');
    renderWalkSessionPage(sessionId);
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

  const statusLabel = {
    heading:   '이동 중 · 픽업 장소로 이동하고 있어요',
    arrived:   '도착 · 반려견을 픽업 중이에요',
    walking:   '산책 중',
    completed: '산책 완료'
  }[session?.status] || '진행 중';

  // 도우미 단계별 액션 버튼
  let walkerActionBtn = '';
  if (isWalker) {
    if (session?.status === 'heading') {
      walkerActionBtn = `<button class="btn btn-primary" onclick="arriveAtPickup('${sid}')">📍 도착했어요</button>`;
    } else if (session?.status === 'arrived') {
      walkerActionBtn = `<button class="btn btn-primary" style="background:#00AA76;" onclick="startActualWalk('${sid}')">🐕 산책 시작</button>`;
    } else if (session?.status === 'walking') {
      walkerActionBtn = `<button class="btn btn-danger" onclick="endWalkSession('${sid}')">🏁 산책 종료</button>`;
    }
  }

  renderPage(`
    <div style="padding:0;">
      <div style="padding:20px 20px 12px;display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${session?.status==='completed'?'#aaa':'#00AA76'};display:inline-block;${session?.status!=='completed'?'animation:ltPulse 1.5s ease infinite':''}"></span>
            <h2 style="font-size:1rem;font-weight:700;">${statusLabel}</h2>
          </div>
          ${session ? `<p style="font-size:0.78rem;color:#718096;">
            🐕 ${session.dogName || '반려견'} · 시작: ${new Date(session.startedAt).toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit'})}
          </p>` : ''}
        </div>
        ${walkerActionBtn}
      </div>

      <div id="walk-session-map" style="height:55vh;width:100%;"></div>

      <div style="padding:14px 20px;">
        <div id="walk-route-stats" style="display:flex;gap:20px;font-size:0.85rem;color:#4A5568;">
          <span>📍 <b id="route-point-count">0</b> 포인트</span>
          <span>📏 <b id="route-distance">0.00</b> km</span>
        </div>
        ${session?.status === 'completed' ? `
          <button class="btn btn-secondary" style="margin-top:12px;" onclick="Router.navigate('/matching')">← 돌아가기</button>
        ` : ''}
      </div>
    </div>
    <style>@keyframes ltPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}</style>
  `);

  // 지도 초기화 — heading/arrived 는 실시간 위치만, walking 은 경로 트래킹
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
// 지금 바로 브로드캐스트 매칭
// ============================================================

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
        🚀 도우미 찾기
      </button>
      <button onclick="document.getElementById('broadcast-modal').remove()" style="width:100%;padding:12px;background:none;border:none;color:#999;font-size:0.88rem;cursor:pointer;margin-top:8px;">취소</button>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

async function submitBroadcastRequest() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const dogSel = document.getElementById('bc-dog');
  const notes  = document.getElementById('bc-notes')?.value?.trim();
  const dogs   = user.dogs || [];
  const dog    = dogs[parseInt(dogSel?.value)] || null;

  if (!dog) {
    showToast('반려견을 먼저 프로필에서 등록해주세요.', 'error');
    return;
  }

  document.getElementById('broadcast-modal')?.remove();

  // 위치 가져오기
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
        requesterId:    user.id,
        dogName:        dog.name,
        dogBreed:       dog.breed,
        dogSize:        dog.size,
        dogAggression:  dog.aggression || 'none',
        dogPersonality: dog.personality || 'normal',
        walkDifficulty: dog.walkDifficulty || 'easy',
        dogSpecialNotes: notes,
        pickupLatitude:  lat,
        pickupLongitude: lng
      })
    });
    const data = await resp.json();
    if (!data.success) { showToast(data.error || '요청 실패', 'error'); return; }

    _broadcastRequestId = data.request.id;
    showBroadcastWaitingScreen(data.request.id, data.sentCount);
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

let _broadcastRequestId = null;
let _broadcastTimer = null;

function showBroadcastWaitingScreen(requestId, sentCount) {
  document.getElementById('broadcast-waiting')?.remove();
  const el = document.createElement('div');
  el.id = 'broadcast-waiting';
  el.style.cssText = 'position:fixed;inset:0;z-index:8500;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;';

  el.innerHTML = `
    <style>
      @keyframes bwPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:0.7}}
      @keyframes bwSpin{to{transform:rotate(360deg)}}
    </style>
    <div style="width:80px;height:80px;border-radius:50%;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin-bottom:24px;animation:bwPulse 1.8s ease-in-out infinite;">🐕</div>
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

  // 5분 카운트다운
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

function showBroadcastMatchedScreen(data) {
  document.getElementById('broadcast-matched-screen')?.remove();
  const el = document.createElement('div');
  el.id = 'broadcast-matched-screen';
  el.style.cssText = 'position:fixed;inset:0;z-index:8500;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;animation:ltFadeIn 0.3s ease;';
  el.innerHTML = `
    <div style="width:80px;height:80px;border-radius:50%;background:#00AA76;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;margin-bottom:20px;">✓</div>
    <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:8px;text-align:center;">매칭 완료!</h2>
    <p style="font-size:0.95rem;color:#444;text-align:center;margin-bottom:6px;"><b>${data.walkerName}</b>님이 수락했어요</p>
    <p style="font-size:0.82rem;color:#718096;text-align:center;margin-bottom:32px;">도우미가 픽업하러 이동 중이에요 🚶</p>
    <button onclick="document.getElementById('broadcast-matched-screen').remove();Router.navigate('/matching')" style="padding:14px 40px;background:#1a1a1a;color:#fff;border:none;border-radius:999px;font-size:0.95rem;font-weight:700;cursor:pointer;">확인</button>
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
        <div style="color:#fff;font-weight:800;font-size:0.95rem;">🐕 산책 요청이 들어왔어요!</div>
        <div id="bc-countdown" style="background:#00AA76;color:#fff;font-size:0.85rem;font-weight:800;padding:4px 10px;border-radius:999px;">30</div>
      </div>
      <div style="padding:20px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <div style="width:44px;height:44px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">👤</div>
          <div>
            <div style="font-weight:700;">${data.requesterName}</div>
            <div style="font-size:0.78rem;color:#999;">산책 요청자</div>
          </div>
        </div>
        <div style="background:#f8f8f6;border-radius:12px;padding:14px;margin-bottom:16px;">
          <div style="font-weight:700;margin-bottom:8px;">🐕 ${data.dogName || '반려견'}</div>
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

  // 30초 카운트다운
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
    showToast('✅ 수락했어요! 출발 준비가 되면 출발하기를 눌러주세요.', 'success');
    // 도우미 대시보드 새로고침
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

  // 도우미 이름 조회
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
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:9000; background:#fff;
    display:flex; flex-direction:column;
    animation: ltFadeIn 0.3s ease;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes ltFadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes ltPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
      .lt-dot { width:12px;height:12px;border-radius:50%;background:#00AA76;display:inline-block;animation:ltPulse 1.5s ease infinite; }
    </style>

    <!-- 헤더 -->
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
      <button onclick="document.getElementById('live-tracking-overlay').style.display='none'" style="background:#f5f5f5;border:none;border-radius:8px;padding:8px 14px;font-size:0.8rem;font-weight:600;cursor:pointer;">최소화</button>
    </div>

    <!-- 지도 -->
    <div id="lt-map" style="flex:1;min-height:0;"></div>

    <!-- 하단 정보 -->
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

    <!-- 완료 배너 -->
    <div id="lt-end-banner" style="display:none;background:#00AA76;color:#fff;padding:16px 20px;text-align:center;font-weight:700;font-size:0.95rem;flex-shrink:0;">
      🏁 산책이 완료되었습니다! 잠시 후 화면이 닫힙니다.
    </div>
  `;

  document.body.appendChild(overlay);

  // 지도 초기화
  setTimeout(async () => {
    const mapEl = document.getElementById('lt-map');
    if (!mapEl || typeof L === 'undefined') return;

    const ltMap = L.map('lt-map').setView([37.5665, 126.9780], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(ltMap);

    let ltPolyline = null;
    let ltMarker = null;
    let ltPoints = [];

    // 기존 경로 로드
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

    // 실시간 위치 수신
    const posHandler = (data) => {
      if (data.sessionId !== sessionId) return;
      const latlng = [data.latitude, data.longitude];
      ltPoints.push(latlng);

      if (!ltPolyline) {
        ltPolyline = L.polyline([latlng], { color:'#00AA76', weight:4 }).addTo(ltMap);
      } else {
        ltPolyline.addLatLng(latlng);
      }

      const icon = L.divIcon({
        html: `<div style="width:40px;height:40px;border-radius:50%;background:#00AA76;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🦮</div>`,
        className: '', iconSize:[40,40], iconAnchor:[20,20]
      });
      if (ltMarker) ltMarker.remove();
      ltMarker = L.marker(latlng, { icon }).addTo(ltMap);
      ltMap.panTo(latlng);

      // 거리 계산 (하버사인)
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

// ============================================================
// 도우미 대시보드: 수락된 요청에 산책 시작 버튼 추가
// ============================================================

async function renderWalkerRequestsList(userId) {
  let requests = [];
  try {
    const res = await fetch(`/api/walk-requests?walkerId=${userId}`);
    const data = await res.json();
    requests = (data.requests || []).filter(r => ['pending', 'accepted', 'heading', 'arrived', 'walking'].includes(r.status));
  } catch(e) {}

  if (requests.length === 0) return { html: '<p style="color:#718096;font-size:0.88rem;">현재 받은 요청이 없습니다.</p>', requests: [] };

  const users = StorageService.get('users', []);

  const html = requests.map(r => {
    const requester = users.find(u => u.id === r.requesterId);
    const requesterName = requester ? (requester.nickname || requester.name) : (r.requesterName || '요청자');
    const statusLabel = { pending: '⏳ 대기 중', accepted: '🚶 이동 중', walking: '🐕 산책 중' };
    const statusColor = { pending: '#F6AD55', accepted: '#4299E1', walking: '#48BB78' };

    return `
      <div class="match-request-card ${r.status === 'pending' ? 'match-request-card--pending' : ''}">
        <div class="match-request-card__header">
          <div class="match-request-card__avatar">${requesterName.charAt(0)}</div>
          <div>
            <div class="match-request-card__from">${requesterName}</div>
            <div style="font-size:0.75rem;color:var(--color-text-muted);">${new Date(r.createdAt).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
          <span style="margin-left:auto;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;background:${statusColor[r.status]}20;color:${statusColor[r.status]};">${statusLabel[r.status]||r.status}</span>
        </div>
        <div class="match-request-card__body">
          <div class="match-request-card__dog">
            <span style="font-size:1.2rem;">🐕</span>
            <div>
              <div style="font-weight:700;">${r.dogName || '반려견'}${r.dogSize ? ` <span class="dw-size-tag">${{small:'소형견',medium:'중형견',large:'대형견'}[r.dogSize]||r.dogSize}</span>` : ''}</div>
              ${r.dogBreed ? `<div style="font-size:0.78rem;color:var(--color-text-muted);">${r.dogBreed}</div>` : ''}
            </div>
          </div>
          ${r.requestMessage ? `<div class="match-request-card__notes">"${r.requestMessage}"</div>` : ''}
        </div>
        ${r.status === 'pending' ? `
          <div class="match-request-card__actions">
            <button class="btn btn-primary" onclick="acceptWalkRequestNotif('${r.id}','${escapeQ(requesterName)}')">✅ 수락하기</button>
            <button class="btn btn-secondary" onclick="rejectWalkRequestNotif('${r.id}')">거절</button>
          </div>
        ` : ''}
        ${r.status === 'accepted' ? `
          <div style="background:#F0FDF4;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #86EFAC;">
            <div style="font-weight:700;font-size:0.9rem;color:#166534;margin-bottom:6px;">✅ 수락 완료 · 출발 준비 중</div>
            <div style="font-size:0.8rem;color:#4A5568;margin-bottom:12px;">출발 준비가 되면 아래 버튼을 눌러주세요. 요청자에게 이동 중 알림이 전송됩니다.</div>
            <button class="btn btn-primary" style="width:100%;padding:13px;" onclick="startWalkSession('${r.id}','${r.requesterId}','${escapeQ(r.dogName||'')}')">
              🚶 출발하기
            </button>
          </div>
          ${r.pickupLatitude && r.pickupLongitude ? `
            <div style="display:flex;gap:8px;margin-top:4px;">
              <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="openNavMap('${r.pickupLatitude}','${r.pickupLongitude}')">🗺️ 카카오맵</button>
              <button class="btn btn-secondary btn-sm" onclick="openNavMapNaver('${r.pickupLatitude}','${r.pickupLongitude}')">N 네이버</button>
            </div>
          ` : ''}
        ` : ''}
        ${r.status === 'heading' ? `
          <div style="background:#EFF6FF;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #93C5FD;">
            <div style="font-weight:700;font-size:0.9rem;color:#1E40AF;margin-bottom:6px;">🚶 이동 중 · 요청자 위치로 향하는 중</div>
            <div style="font-size:0.8rem;color:#4A5568;margin-bottom:12px;">요청자 위치에 도착하면 아래 버튼을 눌러주세요.</div>
            <button class="btn btn-primary" style="width:100%;padding:13px;" onclick="arriveAtPickup('${_activeSessionId||r.sessionId||''}')">
              📍 도착했어요
            </button>
          </div>
        ` : ''}
        ${r.status === 'arrived' ? `
          <div style="background:#FFFBEB;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #FCD34D;">
            <div style="font-weight:700;font-size:0.9rem;color:#92400E;margin-bottom:6px;">📍 도착 · 반려견 픽업 중</div>
            <div style="font-size:0.8rem;color:#4A5568;margin-bottom:12px;">반려견을 인계받으면 산책을 시작해주세요.</div>
            <button class="btn btn-primary" style="width:100%;padding:13px;background:#00AA76;" onclick="startActualWalk('${_activeSessionId||r.sessionId||''}')">
              🐕 산책 시작
            </button>
          </div>
        ` : ''}
        ${r.status === 'walking' ? `
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" style="flex:1;" onclick="Router.navigate('/walk-session')">📍 트래킹 보기</button>
            <button class="btn btn-danger btn-sm" onclick="endWalkSession('${_activeSessionId||''}')">🏁 산책 종료</button>
          </div>
        ` : ''}
      </div>`;
  }).join('');

  return { html, requests };
}

function initWalkerNavMaps(requests) {
  requests.filter(r => r.status === 'accepted' && r.pickupLatitude && r.pickupLongitude).forEach(r => {
    const container = document.getElementById(`walker-nav-map-${r.id}`);
    if (!container || container._mapInit) return;
    container._mapInit = true;
    const map = L.map(container).setView([r.pickupLatitude, r.pickupLongitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const icon = L.divIcon({ html: '<div style="background:#e53e3e;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:1rem;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">📍</div>', className: '', iconSize: [32,32], iconAnchor: [16,16] });
    L.marker([r.pickupLatitude, r.pickupLongitude], { icon }).bindPopup(`<b>${r.requesterName}</b><br>요청자 위치`).openPopup().addTo(map);
  });
}

function openNavMap(lat, lng) {
  window.open(`https://map.kakao.com/link/to/요청자위치,${lat},${lng}`, '_blank');
}

function openNavMapNaver(lat, lng) {
  window.open(`https://map.naver.com/v5/directions/-/-/-/walk?c=${lng},${lat},15,0,0,0,dh`, '_blank');
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
