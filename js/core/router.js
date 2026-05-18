// Pawsitive - Router
// Hash-based SPA router with parameter matching

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
