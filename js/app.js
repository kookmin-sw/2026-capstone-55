// Pawsitive - Main Application
// 앱 초기화, 라우트 등록, 결제 리다이렉트 처리

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
    Router.register('/experts', renderExpertsPage);
    Router.register('/matching', renderMatchingPage);
    Router.register('/health', renderHealthDashboardPage);
    Router.register('/walk-tracking', renderWalkTrackingPage);
    Router.register('/walk-session', () => renderWalkSessionPage());
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

  StorageService.syncFromServer().then(() => {
    ensureAdminAccount();
    renderNavbar();
    registerRoutes();
    Router.init();
    _handlePaymentRedirect();
    getNotifications(); updateBellBadge(); loadServerNotices();
    console.log('[Pawsitive] 앱이 초기화되었습니다.');
  }).catch(e => {
    console.error('[Pawsitive] 서버 동기화 실패, 로컬 모드로 시작:', e);
    ensureAdminAccount();
    renderNavbar();
    registerRoutes();
    Router.init();
    _handlePaymentRedirect();
  });
}

/** 결제 성공 redirect 후 자동 매칭 요청 처리 */
function _handlePaymentRedirect() {
  const hash = window.location.hash || '';
  if (!hash.includes('paymentSuccess=true')) return;

  const cleanHash = hash.split('?')[0];
  history.replaceState(null, '', cleanHash || '#/matching');

  const raw = localStorage.getItem('pawsitive_pending_payment');
  if (!raw) { showToast('결제 정보를 찾을 수 없어요.', 'error'); return; }
  localStorage.removeItem('pawsitive_pending_payment');

  let payment;
  try { payment = JSON.parse(raw); } catch(e) { return; }

  if (Date.now() - payment.timestamp > 5 * 60 * 1000) return;

  showToast('결제 완료! 매칭 요청을 보내는 중...', 'success');

  const user = AuthService.getCurrentUser();
  if (!user) return;

  if (payment.requestType === 'broadcast') {
    _executeBroadcastAfterPayment(user, payment);
  } else if (payment.requestType === 'map') {
    _executeMapRequestAfterPayment(user, payment);
  } else {
    if (payment.walkerId) {
      _sendMatchRequestAfterPayment(payment.walkerId, payment);
    }
  }
}

async function _executeBroadcastAfterPayment(user, payment) {
  let lat = null, lng = null;
  try {
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
    lat = pos.coords.latitude; lng = pos.coords.longitude;
  } catch(e) {}

  const dog = (user.dogs || [])[0] || {};
  try {
    const resp = await fetch('/api/walk-requests/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: user.id,
        dogName: dog.name || '',
        dogBreed: dog.breed || '',
        dogSize: dog.size || 'small',
        dogAggression: dog.aggression || 'none',
        dogPersonality: dog.personality || 'normal',
        walkDifficulty: dog.walkDifficulty || 'easy',
        pickupLatitude: lat,
        pickupLongitude: lng,
        paymentOrderId: payment.orderId,
        paymentAmount: payment.amount,
        duration: payment.duration
      })
    });
    const data = await resp.json();
    if (data.success && data.sentCount > 0) {
      showBroadcastWaitingScreen(data.request.id, data.sentCount);
    } else {
      showToast(data.error || '도우미를 찾지 못했어요.', 'error');
    }
  } catch(e) {
    showToast('요청 전송에 실패했어요.', 'error');
  }
}

async function _executeMapRequestAfterPayment(user, payment) {
  if (!payment.walkerId) return;
  let lat = null, lng = null;
  try {
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
    lat = pos.coords.latitude; lng = pos.coords.longitude;
  } catch(e) {}

  const dog = (user.dogs || [])[0] || {};
  try {
    const res = await fetch('/api/walk-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: user.id,
        walkerId: payment.walkerId,
        dogName: dog.name || '',
        dogBreed: dog.breed || '',
        dogSize: dog.size || '',
        duration: payment.duration,
        totalPrice: payment.amount,
        requestedStartTime: new Date().toISOString(),
        pickupLatitude: lat,
        pickupLongitude: lng,
        paymentOrderId: payment.orderId
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast('매칭 요청을 보냈습니다!', 'success');
      renderMatchingPage();
    } else {
      showToast(result.error || '요청 실패', 'error');
    }
  } catch(e) {
    showToast('요청 전송에 실패했어요.', 'error');
  }
}

// DOM 로드 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  initRealtimeListeners();
});
