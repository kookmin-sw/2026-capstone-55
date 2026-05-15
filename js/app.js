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
    Router.register('/community', () => {
      if (window._communityPendingViewUserId) {
        window._communityViewUserId = window._communityPendingViewUserId;
        window._communityPendingViewUserId = null;
      } else {
        window._communityViewUserId = null;
      }
      renderCommunityPage();
    });
    Router.register('/wallet', renderWalletPage);
    Router.register('/experts', renderExpertsPage);
    Router.register('/matching', renderMatchingPage);
    Router.register('/health', renderHealthDashboardPage);
    Router.register('/walk-tracking', renderWalkTrackingPage);
    Router.register('/walk-session', () => renderWalkSessionPage());
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
    if (typeof initDM === 'function') initDM();
    console.log('[Pawsitive] 앱이 초기화되었습니다.');
  }).catch(e => {
    console.error('[Pawsitive] 서버 동기화 실패, 로컬 모드로 시작:', e);
    ensureAdminAccount();
    renderNavbar();
    registerRoutes();
    Router.init();
    _handlePaymentRedirect();
    if (typeof initDM === 'function') initDM();
  });
}

function _extractPaymentRedirectParams() {
  const hash = window.location.hash || '';
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const hashParams = new URLSearchParams(hashQuery);
  const searchParams = new URLSearchParams(window.location.search || '');
  ['paymentSuccess', 'orderId', 'paymentKey', 'amount'].forEach(key => {
    if (!hashParams.has(key) && searchParams.has(key)) hashParams.set(key, searchParams.get(key));
  });
  return {
    params: hashParams,
    cleanHash: hash.split('?')[0] || '#/matching',
    hasPaymentReturn: hash.includes('paymentSuccess=true') || searchParams.has('paymentKey') || searchParams.has('orderId')
  };
}

async function _findExistingPaymentRequest(userId, orderId) {
  if (!userId || !orderId) return null;
  try {
    const data = await (await fetch(`/api/walk-requests?requesterId=${userId}`)).json();
    return (data.requests || []).find(r => r.paymentOrderId === orderId) || null;
  } catch(e) {
    return null;
  }
}

/** 결제 성공 redirect 후 자동 매칭 요청 처리 */
async function _handlePaymentRedirect() {
  const hash = window.location.hash || '';
  const redirect = _extractPaymentRedirectParams();
  if (!redirect.hasPaymentReturn) return;

  history.replaceState(null, '', redirect.cleanHash || '#/matching');
  const orderId = redirect.params.get('orderId');
  const isPaymentRoute = /^#\/(matching|experts)(\b|\/|\?)/.test(redirect.cleanHash || '');

  const raw = localStorage.getItem('pawsitive_pending_payment');
  const user = AuthService.getCurrentUser();
  if (!raw) {
    const existing = await _findExistingPaymentRequest(user?.id, orderId);
    if (existing) {
      renderMatchingPage();
      return;
    }
    if (isPaymentRoute) showToast('결제 정보를 찾을 수 없어요.', 'error');
    return;
  }

  let payment;
  try { payment = JSON.parse(raw); } catch(e) { return; }
  if (orderId && payment.orderId && orderId !== payment.orderId) return;
  localStorage.removeItem('pawsitive_pending_payment');

  if (Date.now() - payment.timestamp > 5 * 60 * 1000) return;

  if (!user) return;

  const existing = await _findExistingPaymentRequest(user.id, payment.orderId);
  if (existing) {
    renderMatchingPage();
    return;
  }

  if (payment.requestType === 'broadcast') {
    showToast('결제 완료! 매칭 요청을 보내는 중...', 'success');
    _executeBroadcastAfterPayment(user, payment);
  } else if (payment.requestType === 'map') {
    showToast('결제 완료! 매칭 요청을 보내는 중...', 'success');
    _executeMapRequestAfterPayment(user, payment);
  } else if (payment.requestType === 'expert') {
    showToast('결제가 완료됐어요. 상담방을 열게요.', 'success');
    completeExpertPayment(payment.expertId, payment);
  } else {
    if (payment.walkerId) {
      showToast('결제 완료! 매칭 요청을 보내는 중...', 'success');
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
  let lat = payment.pickupLatitude || null;
  let lng = payment.pickupLongitude || null;
  try {
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
    lat = pos.coords.latitude; lng = pos.coords.longitude;
  } catch(e) {}
  if ((!lat || !lng) && payment.walkerId) {
    try {
      const walkers = await (await fetch('/api/walkers')).json();
      const walker = walkers.find(w => w.userId === payment.walkerId);
      if (walker?.lat && walker?.lng) { lat = walker.lat; lng = walker.lng; }
    } catch(e) {}
  }

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
