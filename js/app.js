// Pawsitive - Main Application
// Initialization, realtime listeners, walk sessions, payment utilities

/**
 * Pawsitive - 반려견 산책 매칭 웹 애플리케이션
 * 메인 애플리케이션 로직, 라우팅, 네비게이션
 */


// ============================================================
// 산책 가격 계산 유틸
// ============================================================
const WALK_PRICING = {
  small:  10000,  // 소형견 (7kg 미만) 1회 40분
  medium: 15000,  // 중형견 (7~15kg)
  large:  20000,  // 대형견 (15kg 이상)
  platformFeeRate: 0.05  // 플랫폼 수수료 5%
};

// ============================================================
// 워커 프로필 Label 매핑 (한국어)
// ============================================================
const WALKER_LABELS = {
  careerYears: { under6m: '6개월 미만', '6m1y': '6개월~1년', '1y3y': '1~3년', over3y: '3년 이상' },
  largeDogExp: { lots: '많음', some: '조금', none: '없음' },
  aggressionHandle: { yes: '가능', some: '어느 정도', no: '불가' },
  ownPetExp: { current: '현재 양육 중', past: '과거 양육', none: '없음' },
  dogSize: { small: '소형견', medium: '중형견', large: '대형견' },
  timeSlots: {
    'morning-early': '오전 (7-9시)',
    morning: '오전 (9-11시)',
    afternoon: '오후 (2-4시)',
    evening: '오후 (5-7시)',
    night: '저녁 (7-9시)',
    anytime: '상시 가능'
  }
};

/**
 * 워커 프로필 필드의 한국어 라벨 반환
 * @param {string} field - WALKER_LABELS의 키 (예: 'careerYears')
 * @param {string} value - 해당 필드의 값 (예: 'over3y')
 * @returns {string} 한국어 라벨 또는 '알 수 없음'
 */
function getWalkerLabel(field, value) {
  const fieldMap = WALKER_LABELS[field];
  if (!fieldMap) return '알 수 없음';
  return fieldMap[value] || '알 수 없음';
}

/**
 * 산책 요금 계산
 * @param {Array|string} dogSizes - 'small'|'medium'|'large' 또는 배열 (다견)
 * @returns {{ total: number, fee: number, walkerPayout: number, breakdown: Array }}
 */
function calculateWalkPrice(dogSizes) {
  const sizes = Array.isArray(dogSizes) ? dogSizes : [dogSizes || 'small'];
  const breakdown = sizes.map(size => ({
    size,
    label: { small: '소형견', medium: '중형견', large: '대형견' }[size] || '소형견',
    price: WALK_PRICING[size] || WALK_PRICING.small
  }));
  const total = breakdown.reduce((sum, b) => sum + b.price, 0);
  const fee = Math.round(total * WALK_PRICING.platformFeeRate);
  const walkerPayout = total - fee;
  return { total, fee, walkerPayout, breakdown };
}

/**
 * 토스페이먼츠 결제 요청
 * @param {{ amount: number, orderId: string, orderName: string, customerName: string }} opts
 */
async function requestTossPayment({ amount, orderId, orderName, customerName }) {
  const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
  try {
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);
    const payment = tossPayments.payment({ customerKey: orderId });
    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: amount },
      orderId,
      orderName,
      customerName: customerName || '요청자',
      successUrl: window.location.origin + '/#/matching?paymentSuccess=true&orderId=' + orderId,
      failUrl: window.location.origin + '/#/matching?paymentFail=true'
    });
  } catch (e) {
    if (e.code === 'USER_CANCEL') {
      showToast('결제가 취소되었어요.', 'info');
    } else {
      showToast('결제 중 오류가 발생했어요: ' + (e.message || ''), 'error');
     }
}

/**
 * 공통 결제 확인 모달 — Promise 반환
 * 반려견 선택 → 산책 시간 선택 → 가격 동적 계산 → 결제
 * @param {{ dogSize: string, dogName: string, duration?: number }} opts (기본값, 모달에서 변경 가능)
 */
function showPaymentConfirmModal({ dogSize, dogName, duration = 40 }) {
  const user = AuthService.getCurrentUser();
  const dogs = user?.dogs || [];

  return new Promise((resolve, reject) => {
    const modalId = 'payment-confirm-modal-' + Date.now();
    const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' };

    // 반려견 체크박스 HTML
    const dogCheckboxes = dogs.length > 0
      ? dogs.map((d, i) => `
        <label style="display:flex;align-items:center;gap:10px;padding:12px;border:1.5px solid var(--color-border);border-radius:10px;cursor:pointer;transition:all 0.15s;margin-bottom:6px;" class="pay-dog-label">
          <input type="checkbox" class="pay-dog-cb" value="${i}" data-size="${d.size || 'small'}" data-name="${d.name}" ${i === 0 ? 'checked' : ''} style="width:18px;height:18px;accent-color:#1a1a1a;">
          <span style="font-size:1.1rem;">🐕</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.88rem;">${d.name}</div>
            <div style="font-size:0.72rem;color:var(--color-text-muted);">${sizeLabel[d.size] || '소형견'} · ${(WALK_PRICING[d.size] || WALK_PRICING.small).toLocaleString()}원/40분</div>
          </div>
        </label>`).join('')
      : `<div style="padding:12px;text-align:center;color:var(--color-text-muted);font-size:0.85rem;">등록된 반려견이 없어요</div>`;

    const modalHtml = `
    <div id="${modalId}" style="position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);">
    <div style="background:#fff;border-radius:20px;padding:28px 24px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);max-height:90vh;overflow-y:auto;">
    <div style="text-align:center;margin-bottom:20px;">
    <div style="font-size:2rem;margin-bottom:8px;">💳</div>
    <div style="font-size:1.1rem;font-weight:800;">산책 결제</div>
    </div>

    <div style="margin-bottom:16px;">
    <div style="font-size:0.82rem;font-weight:700;margin-bottom:8px;">함께할 반려견 선택</div>
    ${dogCheckboxes}
    </div>

    <div style="margin-bottom:16px;">
    <div style="font-size:0.82rem;font-weight:700;margin-bottom:8px;">산책 시간</div>
    <div style="display:flex;gap:8px;" id="${modalId}-dur">
    <button type="button" data-dur="40" class="pay-dur-btn pay-dur-btn--active" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid #1a1a1a;background:#1a1a1a;color:#fff;font-size:0.82rem;font-weight:700;cursor:pointer;">40분</button>
    <button type="button" data-dur="80" class="pay-dur-btn" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#333;font-size:0.82rem;font-weight:700;cursor:pointer;">1시간 20분</button>
    <button type="button" data-dur="120" class="pay-dur-btn" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#333;font-size:0.82rem;font-weight:700;cursor:pointer;">2시간</button>
    </div>
    </div>

    <div id="${modalId}-summary" style="background:#fafaf8;border-radius:12px;padding:16px;margin-bottom:16px;"></div>

    <div style="font-size:0.72rem;color:var(--color-text-muted);line-height:1.5;margin-bottom:20px;">
    • 매칭 실패 시 전액 환불돼요<br>• 산책 완료 후 도우미에게 정산됩니다 (수수료 5%)
    </div>

    <div style="display:flex;gap:10px;">
    <button id="${modalId}-cancel" style="flex:1;padding:14px;border:1.5px solid #e0e0e0;border-radius:12px;background:#fff;font-size:0.9rem;font-weight:700;cursor:pointer;">취소</button>
    <button id="${modalId}-pay" style="flex:2;padding:14px;border:none;border-radius:12px;background:#1a1a1a;color:#fff;font-size:0.9rem;font-weight:700;cursor:pointer;">결제하기</button>
    </div>
    </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById(modalId);
    let selectedDuration = 40;

    // 가격 요약 업데이트
    function updateSummary() {
      const checked = Array.from(modal.querySelectorAll('.pay-dog-cb:checked'));
      const units = Math.ceil(selectedDuration / 40);
      let breakdown = '';
      let total = 0;
      checked.forEach(cb => {
        const size = cb.dataset.size || 'small';
        const name = cb.dataset.name || '반려견';
        const price = (WALK_PRICING[size] || WALK_PRICING.small) * units;
        total += price;
        breakdown += `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.82rem;">
          <span>${name} (${sizeLabel[size] || '소형견'} × ${units}회)</span><span style="font-weight:700;">${price.toLocaleString()}원</span>
        </div>`;
      });
      if (checked.length === 0) {
        breakdown = '<div style="text-align:center;color:#b91c1c;font-size:0.82rem;padding:8px 0;">반려견을 최소 1마리 선택해주세요</div>';
      }
      const fee = Math.round(total * WALK_PRICING.platformFeeRate);
      const walkerPayout = total - fee;
      const summaryEl = document.getElementById(`${modalId}-summary`);
      if (summaryEl) {
        summaryEl.innerHTML = `
          ${breakdown}
          ${total > 0 ? `
          <div style="border-top:2px solid #1a1a1a;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;">
          <span style="font-weight:800;">총 결제 금액</span>
          <span style="font-weight:800;font-size:1.1rem;">${total.toLocaleString()}원</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--color-text-muted);margin-top:4px;">
          <span>도우미 수령액</span><span>${walkerPayout.toLocaleString()}원</span>
          </div>` : ''}
        `;
      }
      const payBtn = document.getElementById(`${modalId}-pay`);
      if (payBtn) {
        if (total > 0) {
          payBtn.textContent = `${total.toLocaleString()}원 결제하기`;
          payBtn.disabled = false;
          payBtn.style.opacity = '1';
        } else {
          payBtn.textContent = '반려견을 선택해주세요';
          payBtn.disabled = true;
          payBtn.style.opacity = '0.5';
        }
      }
    }  // end updateSummary

    // 이벤트 바인딩
    modal.querySelectorAll('.pay-dog-cb').forEach(cb => cb.addEventListener('change', updateSummary));
    modal.querySelectorAll('.pay-dur-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.pay-dur-btn').forEach(b => { b.style.background='#fff'; b.style.color='#333'; b.style.borderColor='#e2e8f0'; });
        btn.style.background = '#1a1a1a'; btn.style.color = '#fff'; btn.style.borderColor = '#1a1a1a';
        selectedDuration = parseInt(btn.dataset.dur);
        updateSummary();
      });
    });

    updateSummary(); // 초기 표시

    document.getElementById(`${modalId}-cancel`).onclick = () => { modal.remove(); reject('cancelled'); };
    document.getElementById(`${modalId}-pay`).onclick = async () => {
      const checked = Array.from(modal.querySelectorAll('.pay-dog-cb:checked'));
      if (checked.length === 0) { showToast('반려견을 선택해주세요.', 'error'); return; }
      const units = Math.ceil(selectedDuration / 40);
      let total = 0;
      const selectedDogs = checked.map(cb => {
        const size = cb.dataset.size || 'small';
        const price = (WALK_PRICING[size] || WALK_PRICING.small) * units;
        total += price;
        return { name: cb.dataset.name, size, price };
      });

      const btn = document.getElementById(`${modalId}-pay`);
      btn.disabled = true; btn.textContent = '결제 처리 중...';
      const orderId = 'walk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

      // 결제 정보를 localStorage에 저장 (redirect 후 복원용)
      const pendingPayment = {
        orderId,
        amount: total,
        duration: selectedDuration,
        dogs: selectedDogs,
        walkerId: window._pendingPaymentWalkerId || null,
        requestType: window._pendingPaymentType || 'direct', // 'direct' | 'broadcast' | 'map'
        timestamp: Date.now()
      };
      localStorage.setItem('pawsitive_pending_payment', JSON.stringify(pendingPayment));

      // 서버에 결제 기록 먼저 생성 (리다이렉트 중 유실 방지)
      let lat = null, lng = null;
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 1000, maximumAge: 30000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch(e) {}

      try {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            orderId,
            amount: total,
            duration: selectedDuration,
            dogs: selectedDogs,
            walkerId: window._pendingPaymentWalkerId || null,
            requestType: window._pendingPaymentType || 'direct',
            lat, lng
          })
        });
      } catch(e) {
        // 서버 기록 실패해도 localStorage 백업이 있으므로 계속 진행
        console.warn('[Payment] 서버 결제 기록 실패, localStorage 백업으로 진행:', e.message);
      }

      try {
        const dogNames = selectedDogs.map(d => d.name).join(', ');
        await requestTossPayment({ amount: total, orderId, orderName: `산책 서비스 (${dogNames})`, customerName: user?.name || '요청자' });
        // redirect 방식이라 여기 도달 안 함 (성공 시 successUrl로 이동)
        modal.remove();
        resolve({ orderId, amount: total, duration: selectedDuration, dogs: selectedDogs });
      } catch(e) {
        localStorage.removeItem('pawsitive_pending_payment');
        // 결제 취소/실패 시 서버 기록도 환불 처리
        try {
          const payments = await fetch(`/api/payments/by-order/${orderId}`).then(r => r.json());
          if (payments.success && payments.payment) {
            await fetch(`/api/payments/${payments.payment.id}/refund`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: '결제 취소/실패' })
            });
          }
        } catch(_) {}
        modal.remove();
        reject('payment_failed');
      }
    };
  });
}


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

 // 서버에서 공유 데이터 로드 후 앱 시작
 StorageService.syncFromServer().then(() => {
 ensureAdminAccount();
 renderNavbar();
 registerRoutes();
 _handlePaymentRedirect(); // 결제 성공 redirect 처리 (Router.init() 전에 오버레이 표시)
 Router.init();
 console.log('[Pawsitive] 앱이 초기화되었습니다. ');
 }).catch(e => {
 console.error('[Pawsitive] 서버 동기화 실패, 로컬 모드로 시작:', e);
 ensureAdminAccount();
 renderNavbar();
 registerRoutes();
 _handlePaymentRedirect();
 Router.init();
 });
}

/** 결제 성공 redirect 후 자동 매칭 요청 처리 */
function _handlePaymentRedirect() {
 const hash = window.location.hash || '';
 if (!hash.includes('paymentSuccess=true')) return;

 // URL에서 파라미터 제거
 const cleanHash = hash.split('?')[0];
 history.replaceState(null, '', cleanHash || '#/matching');

 // localStorage에서 결제 정보 복원
 const raw = localStorage.getItem('pawsitive_pending_payment');
 if (!raw) {
   // localStorage에 없으면 서버에서 미처리 결제 확인 (다른 기기/크래시 복구)
   const user = AuthService.getCurrentUser();
   if (user) _recoverPendingPaymentFromServer(user);
   else showToast('결제 정보를 찾을 수 없어요.', 'error');
   return;
 }
 localStorage.removeItem('pawsitive_pending_payment');

 let payment;
 try { payment = JSON.parse(raw); } catch(e) { return; }

 // 5분 이상 지난 결제 정보는 무시
 if (Date.now() - payment.timestamp > 5 * 60 * 1000) return;

 // ── 결제 감지 즉시 오버레이 표시 (Router.init()보다 먼저 실행) ──
 // 라우터가 대시보드를 렌더링하기 전에 오버레이를 body에 붙임
 showWalkerWaitingOverlay('__pending__', 0);
 // requestId는 실제 요청 후 업데이트됨 (cancel 버튼 비활성화)
 const cancelBtn = document.querySelector('#broadcast-waiting button');
 if (cancelBtn) cancelBtn.style.display = 'none';

 const user = AuthService.getCurrentUser();
 if (!user) return;

 if (payment.requestType === 'broadcast') {
   // 브로드캐스트 요청 이어서 실행
   _executeBroadcastAfterPayment(user, payment);
 } else if (payment.requestType === 'map') {
   // GPS 지도 요청 이어서 실행
   _executeMapRequestAfterPayment(user, payment);
 } else {
   // 직접 요청 (AI 추천 카드)
   if (payment.walkerId) {
     _sendMatchRequestAfterPayment(payment.walkerId, payment);
   }
 }
}

/** 브로드캐스트 결제 후 실행 */
async function _executeBroadcastAfterPayment(user, payment) {
 // GPS: 1초 안에 못 받으면 저장된 좌표 사용 (지연 최소화)
 let lat = payment.lat || null, lng = payment.lng || null;
 try {
   const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 1000, maximumAge: 30000 }));
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
   if (data.success && data.request) {
     // 서버에 결제 완료 처리
     _markPaymentCompleted(payment.orderId, data.request.id);
     // 이미 오버레이가 표시 중이면 requestId와 sentCount만 업데이트
     const existingOverlay = document.getElementById('broadcast-waiting');
     if (existingOverlay) {
       // 취소 버튼에 실제 requestId 반영
       const cancelBtn = existingOverlay.querySelector('button');
       if (cancelBtn) {
         cancelBtn.style.display = 'block';
         cancelBtn.onclick = () => cancelBroadcastRequest(data.request.id);
       }
       const sentEl = existingOverlay.querySelector('p:last-of-type');
       if (sentEl && data.sentCount > 0) {
         sentEl.innerHTML = `주변 <b style="color:#00AA76">${data.sentCount}명</b>의 도우미에게 알림이 전달됐어요`;
       }
     } else {
       showBroadcastWaitingScreen(data.request.id, data.sentCount || 0);
     }
   } else {
     document.getElementById('broadcast-waiting')?.remove();
     clearInterval(_broadcastTimer); _broadcastTimer = null;
     // 요청 실패 시 재시도 기록
     _markPaymentRetry(payment.orderId, data.error || '요청 생성 실패');
     showToast(data.error || '도우미를 찾지 못했어요.', 'error');
   }
 } catch(e) {
   _markPaymentRetry(payment.orderId, e.message || '네트워크 오류');
   showToast('요청 전송에 실패했어요.', 'error');
 }
}

/** GPS 지도 요청 결제 후 실행 */
async function _executeMapRequestAfterPayment(user, payment) {
 if (!payment.walkerId) return;
 let lat = payment.lat || null, lng = payment.lng || null;
 try {
   const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 1000, maximumAge: 30000 }));
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
     // 서버에 결제 완료 처리
     _markPaymentCompleted(payment.orderId, result.request?.id || null);
     showToast('매칭 요청을 보냈습니다!', 'success');
     renderMatchingPage();
   } else {
     _markPaymentRetry(payment.orderId, result.error || '요청 생성 실패');
     showToast(result.error || '요청 실패', 'error');
   }
 } catch(e) {
   _markPaymentRetry(payment.orderId, e.message || '네트워크 오류');
   showToast('요청 전송에 실패했어요.', 'error');
 }
}

// ── 브라우저 푸시 알림 ────────────────────────────────────────

// ── 결제 상태 관리 헬퍼 ─────────────────────────────────────
/**
 * 서버에 결제 완료 처리 (요청 전송 성공 시)
 */
async function _markPaymentCompleted(orderId, requestId) {
  try {
    const resp = await fetch(`/api/payments/by-order/${orderId}`);
    const data = await resp.json();
    if (data.success && data.payment) {
      await fetch(`/api/payments/${data.payment.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
    }
  } catch(e) {
    console.warn('[Payment] 결제 완료 처리 실패:', e.message);
  }
}

/**
 * 요청 생성 실패 시 결제를 환불 상태로 전환
 */
async function _markPaymentRetry(orderId, error) {
  try {
    const resp = await fetch(`/api/payments/by-order/${orderId}`);
    const data = await resp.json();
    if (data.success && data.payment) {
      await fetch(`/api/payments/${data.payment.id}/refund`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: `요청 생성 실패: ${error || '알 수 없는 오류'}` })
      });
    }
  } catch(e) {
    console.warn('[Payment] 환불 처리 실패:', e.message);
  }
}

/**
 * 서버에서 미처리 결제 복구 (localStorage 유실 시 fallback)
 * 앱 시작 시 또는 결제 redirect 후 localStorage가 비어있을 때 호출
 */
async function _recoverPendingPaymentFromServer(user) {
  try {
    const resp = await fetch(`/api/payments/pending?userId=${user.id}`);
    const data = await resp.json();
    if (!data.success || !data.payments || data.payments.length === 0) {
      return; // 미처리 결제 없음
    }

    // 가장 최근 미처리 결제를 처리
    const payment = data.payments[0];
    console.log('[Payment] 서버에서 미처리 결제 복구:', payment.orderId);

    // 오버레이 표시
    showWalkerWaitingOverlay('__pending__', 0);
    const cancelBtn = document.querySelector('#broadcast-waiting button');
    if (cancelBtn) cancelBtn.style.display = 'none';

    if (payment.requestType === 'broadcast') {
      _executeBroadcastAfterPayment(user, payment);
    } else if (payment.requestType === 'map') {
      _executeMapRequestAfterPayment(user, payment);
    } else {
      if (payment.walkerId) {
        _sendMatchRequestAfterPayment(payment.walkerId, payment);
      }
    }
  } catch(e) {
    console.warn('[Payment] 서버 미처리 결제 복구 실패:', e.message);
  }
}

/**
 * 앱 시작 시 미처리 결제 자동 확인 (결제 redirect 없이도 복구)
 * 예: 결제 후 앱이 크래시되었다가 재시작된 경우
 */
async function _checkPendingPaymentsOnStartup() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  // 이미 결제 redirect 처리 중이면 스킵
  const hash = window.location.hash || '';
  if (hash.includes('paymentSuccess=true')) return;

  // localStorage에 미처리 결제가 있으면 스킵 (정상 플로우)
  if (localStorage.getItem('pawsitive_pending_payment')) return;

  try {
    const resp = await fetch(`/api/payments/pending?userId=${user.id}`);
    const data = await resp.json();
    if (data.success && data.payments && data.payments.length > 0) {
      const payment = data.payments[0];
      const elapsed = Date.now() - new Date(payment.createdAt).getTime();
      // 2분 이내의 미처리 결제만 자동 복구 시도
      if (elapsed < 2 * 60 * 1000) {
        showToast('이전 결제를 처리하고 있어요...', 'info');
        _recoverPendingPaymentFromServer(user);
      }
    }
  } catch(e) {
    // 조용히 실패
  }
}

// ── 브라우저 푸시 알림 (원래 위치) ───────────────────────────
async function _initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch(e) { return; }
}

/** 브라우저 네이티브 알림 표시 (앱이 백그라운드/다른 탭일 때도 동작) */
function _pushNotify(title, body, url) {
  if (!('Notification' in window)) return;
  const doShow = () => {
    try {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body, icon: '/pawsitive_logo_transparent.png',
          badge: '/pawsitive_logo_transparent.png',
          tag: 'pawsitive-' + Date.now(),
          data: url || '/', vibrate: [200, 100, 200]
        });
      }).catch(() => new Notification(title, { body, icon: '/pawsitive_logo_transparent.png' }));
    } catch(e) { try { new Notification(title, { body }); } catch(_) {} }
  };

  if (Notification.permission === 'granted') {
    doShow();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => { if (p === 'granted') doShow(); });
  }
}

function _preloadHintVideo() {
  // 힌트 영상 프리로드 (있는 경우)
}

// DOM 로드 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
 _preloadHintVideo();
 _initPushNotifications();
 initApp();
 initRealtimeListeners();
 getNotifications(); updateBellBadge();
 // 앱 시작 시 미처리 결제 자동 복구 확인
 setTimeout(() => _checkPendingPaymentsOnStartup(), 2000);
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
   const _u = AuthService.getCurrentUser();
   const _p = _u ? MatchingService.getMyProfile(_u.id) : null;
   if (_p?.role !== 'walker') return;
   showWalkRequestNotification(data);
 });

 // 요청 수락됨 (요청자용)
RealtimeService.on('walk-request-accepted', (data) => {
  if (_broadcastTimer) { clearInterval(_broadcastTimer); _broadcastTimer = null; }
  document.getElementById('broadcast-waiting')?.remove();
  _broadcastRequestId = null;
   _pushNotify('✅ 매칭 성공!', `${data.walkerName || '도우미'}님이 요청을 수락했어요.`, '/#/matching');
   showWalkerAcceptedModal(data);
 });

 // 요청 거절됨 (요청자용)
RealtimeService.on('walk-request-rejected', () => {
 if (_broadcastTimer) { clearInterval(_broadcastTimer); _broadcastTimer = null; }
 document.getElementById('broadcast-waiting')?.remove();
 _broadcastRequestId = null;
 showToast('산책 도우미가 요청을 거절했습니다.', 'error');
 _pushNotify('산책 요청 거절', '도우미가 요청을 거절했어요. 다른 도우미에게 요청해보세요.', '/#/matching');
 });

 // 요청 취소됨 (도우미용 — 요청자가 취소했을 때)
 RealtimeService.on('walk-request-cancelled', (data) => {
 _stopWalkerLocationSharing();
 const cancelledBy = data?.cancelledBy || 'unknown';
 if (cancelledBy === 'requester') {
   showToast('요청자가 산책을 취소했어요.', 'info');
 } else if (cancelledBy === 'walker') {
   showToast('도우미가 산책을 취소했어요.', 'info');
 } else {
   showToast('산책이 취소되었어요.', 'info');
 }
 // 폴링 정리
 if (window._requesterLiveMapPoll) { clearInterval(window._requesterLiveMapPoll); window._requesterLiveMapPoll = null; }
 window._activeWalkRequestId = null;
 _activeSessionId = null;
 // 매칭 페이지로 이동
 setTimeout(() => {
   const user = AuthService.getCurrentUser();
   if (user) {
     const profile = MatchingService.getMyProfile(user.id);
     if (profile && profile.role === 'walker') renderWalkerDashboard(user, profile);
     else renderMatchingPage();
   }
 }, 500);
 });

 // 요청자 전용 헬퍼: 현재 페이지 무관하게 walk-session으로 이동
 const _requesterGoToSession = (sessionId, requestId) => {
   const curUser = AuthService.getCurrentUser();
   const profile = curUser ? MatchingService.getMyProfile(curUser.id) : null;
   if (!curUser || profile?.role !== 'requester') return;
   if (sessionId) _activeSessionId = sessionId;
   if (requestId) window._activeWalkRequestId = requestId;
   // /walk-session에 이미 있으면 지도만 갱신
   const curPath = Router.getPath ? Router.getPath() : '';
   if (curPath === '/walk-session') {
     renderWalkSessionPage();
   } else {
     Router.navigate('/walk-session');
   }
 };

 // 1단계: 도우미 출발 → 요청자 즉시 walk-session 이동
 RealtimeService.on('walk-started', (data) => {
   _activeSessionId = data.sessionId;
   window._activeWalkRequestId = data.requestId || window._activeWalkRequestId;
   showToast('도우미가 출발했어요! 이동 상황을 확인하세요.', 'success');
   _pushNotify('🐾 도우미 출발!', '도우미가 픽업 장소로 이동 중이에요.', '/#/walk-session');
   _requesterGoToSession(data.sessionId, data.requestId);
 });

 // 2단계: 도우미 도착
 RealtimeService.on('walker-arrived', (data) => {
   showToast('도우미가 도착했습니다! 반려견을 전달해주세요.', 'success');
   _pushNotify('🐾 도우미 도착!', '도우미가 도착했어요. 반려견을 전달해주세요.', '/#/walk-session');
   _requesterGoToSession(data.sessionId, null);
 });

 // 3단계: 산책 실제 시작 → 요청자 walk-session 갱신 (경로 그리기 시작)
 // 도우미: 요청자가 전달 완료를 눌렀을 때 → 산책 시작 버튼 활성화
 RealtimeService.on('handoff-confirmed', (data) => {
   showToast('요청자가 반려견 전달을 확인했어요! 산책을 시작해주세요.', 'success');
   _pushNotify('🐾 전달 완료!', '요청자가 확인했어요. 산책을 시작해주세요.', '/#/walk-session');
  if (data?.sessionId) _activeSessionId = data.sessionId;
  const curPath = Router.getPath ? Router.getPath() : '';
  if (curPath === '/walk-session') renderWalkSessionPage(data?.sessionId);
 });

 RealtimeService.on('walk-tracking-started', (data) => {
   showToast('산책이 시작되었어요! 실시간 경로를 확인하세요.', 'success');
   _requesterGoToSession(data.sessionId, null);
 });

 // 4단계: 산책 종료
RealtimeService.on('walk-ended', (data) => {
   stopWalkRouteWatcher();
   _stopWalkerLocationSharing();
   hideChatButton();
   _pushNotify('🐾 산책 완료!', `총 ${data.totalDistanceKm ?? 0} km 산책했어요. 리뷰를 남겨보세요.`, '/#/matching');
   const overlay = document.getElementById('live-tracking-overlay');
   if (overlay) {
     const statusEl = document.getElementById('lt-status');
     if (statusEl) statusEl.textContent = `산책 완료 · 총 ${data.totalDistanceKm}km`;
     const endBanner = document.getElementById('lt-end-banner');
     if (endBanner) endBanner.style.display = 'flex';
     setTimeout(() => {
       overlay.remove();
       // 요청자: 산책 종료 후 리뷰 프롬프트
       showRequesterReviewPrompt(data.sessionId, data.walkerId, data.totalDistanceKm);
     }, 2000);
   } else {
     // 오버레이 없어도 리뷰 프롬프트
     showRequesterReviewPrompt(data.sessionId, data.walkerId, data.totalDistanceKm);
   }
   showToast(`산책 완료! 총 ${data.totalDistanceKm}km`, 'success');
 });

 // 지도의 도우미 상태/위치 변경 → 지도 자동 갱신 (공유 핸들러)
 function refreshDiscoveryMap() {
 if (_dwDiscMap && _dwUserLat && _dwUserLng) {
 const radius = Number(document.getElementById('dw-radius-sel')?.value || 5);
 _renderDiscMap(_dwUserLat, _dwUserLng, radius);
 }
 }
 // 상태 변경(ON/OFF 토글)은 지도 전체 재렌더링 (마커 추가/제거 필요)
 RealtimeService.on('walker-status-changed', refreshDiscoveryMap);
 // 위치 업데이트는 지도 재렌더링하지 않음 (6초마다 깜빡임 방지)
 // 대신 다음 수동 새로고침이나 페이지 진입 시 반영됨
 // RealtimeService.on('walker-location-updated', refreshDiscoveryMap);

 // ── 브로드캐스트 매칭 이벤트 ──────────────────────────────

 // 도우미: 브로드캐스트 요청 수신 → 알림 팝업 + 푸시
 RealtimeService.on('broadcast-walk-request', (data) => {
   const _u = AuthService.getCurrentUser();
   const _p = _u ? MatchingService.getMyProfile(_u.id) : null;
   if (_p?.role !== 'walker') return;
   _pushNotify('🐾 새 산책 요청!', `${data.requesterName || '요청자'}님이 산책을 요청했어요.`, '/#/matching');
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
 clearInterval(_broadcastTimer); _broadcastTimer = null;
 document.getElementById('broadcast-waiting')?.remove();
 _broadcastRequestId = null;
 showToast(` ${data.walkerName}님이 수락했어요! 잠시 후 출발할 거예요.`, 'success');
 // 대기 화면 대신 매칭 성공 화면 표시
 showBroadcastMatchedScreen(data);
 });
}

// ============================================================
// 토스트 메시지
// ============================================================


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
 <h3 style="font-size:1.1rem;font-weight:700;">${walkerName}님께 산책 요청</h3>
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
 <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:8px;">산책 시간 *</label>
 <div style="display:flex;gap:8px;" id="wrm-dur-btns"></div>
 <div id="wrm-price-display" style="margin-top:8px;font-size:0.82rem;color:var(--color-text-muted);"></div>
 </div>

 <input type="hidden" id="wrm-duration" value="40">

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

 // 모달 삽입 후 JS 초기화 (innerHTML <script>는 실행 안 되므로 직접 실행)
 _initWalkRequestModal(user);
}

/** 도그워커 요청 모달 초기화 (산책시간 버튼 + 가격 표시) */
function _initWalkRequestModal(user) {
 let selDur = 40;

 // 반려견 크기 기반 가격 계산
 function getSelectedDogSize() {
   const dogSel = document.getElementById('wrm-dog');
   if (!dogSel) return 'small';
   const dogId = dogSel.value;
   const dog = (user.dogs || []).find(d => d.id === dogId);
   return dog?.size || 'small';
 }

 function updatePriceDisplay() {
   const size = getSelectedDogSize();
   const units = Math.ceil(selDur / 40);
   const basePrice = WALK_PRICING[size] || WALK_PRICING.small;
   const total = basePrice * units;
   const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' }[size] || '소형견';
   const priceEl = document.getElementById('wrm-price-display');
   if (priceEl) {
     priceEl.innerHTML = `🔥 <strong>${sizeLabel}</strong> × ${units}회(${selDur}분) = <strong style="color:#1a1a1a;">${total.toLocaleString()}원</strong>`;
   }
 }

 // 산책 시간 버튼 (40분 단위)
 const durCont = document.getElementById('wrm-dur-btns');
 if (durCont) {
   const durations = [
     { min: 40, label: '40분' },
     { min: 80, label: '1시간 20분' },
     { min: 120, label: '2시간' }
   ];
   durations.forEach((d, i) => {
     const btn = document.createElement('button');
     btn.type = 'button';
     btn.textContent = d.label;
     btn.style.cssText = `flex:1;padding:9px 4px;border-radius:10px;border:1.5px solid ${i === 0 ? '#111' : '#e2e8f0'};background:${i === 0 ? '#111' : '#fff'};color:${i === 0 ? '#fff' : '#333'};font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.15s;`;
     btn.onclick = function() {
       durCont.querySelectorAll('button').forEach(b => { b.style.background='#fff'; b.style.color='#333'; b.style.borderColor='#e2e8f0'; });
       this.style.background = '#111'; this.style.color = '#fff'; this.style.borderColor = '#111';
       selDur = d.min;
       document.getElementById('wrm-duration').value = selDur;
       updatePriceDisplay();
     };
     durCont.appendChild(btn);
   });
   // 기본 40분 선택 상태로 가격 표시
   updatePriceDisplay();
 }

 // 반려견 변경 시 가격 갱신
 const dogSel = document.getElementById('wrm-dog');
 if (dogSel) dogSel.addEventListener('change', updatePriceDisplay);
}

async function submitWalkRequest(walkerId) {
 const user = AuthService.getCurrentUser();
 if (!user) return;

 const dogSel = document.getElementById('wrm-dog');
 const notes = document.getElementById('wrm-notes')?.value?.trim();
 const duration = parseInt(document.getElementById('wrm-duration')?.value || '40', 10);
 const msg = document.getElementById('wrm-msg')?.value?.trim();
 const errEl = document.getElementById('walk-req-error');

 if (!dogSel?.value) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">반려견을 선택해주세요. 없으면 프로필에서 먼저 등록해주세요.</div>';
 return;
 }

 const selectedOption = dogSel.options[dogSel.selectedIndex];
 const dogName = selectedOption?.dataset?.name || dogSel.options[dogSel.selectedIndex]?.text;
 const dogBreed = selectedOption?.dataset?.breed || '';
 const dogSize = selectedOption?.dataset?.size || '';

 // 가격 계산
 const units = Math.ceil(duration / 40);
 const basePrice = WALK_PRICING[dogSize] || WALK_PRICING.small;
 const totalPrice = basePrice * units;

 // 결제 확인
 document.getElementById('walk-req-modal')?.remove();
 window._pendingPaymentWalkerId = walkerId;
 window._pendingPaymentType = 'map';
 try {
 await showPaymentConfirmModal({ dogSize: dogSize || 'small', dogName, duration });
 } catch(e) {
 if (e === 'cancelled') showToast('결제가 취소되었어요.', 'info');
 return;
 }

 // GPS 좌표 (실시간 매칭이므로 현재 위치)
 let pickupLat = null, pickupLng = null;
 try {
 const pos = await new Promise((resolve, reject) => {
 navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, maximumAge: 60000 });
 });
 pickupLat = pos.coords.latitude;
 pickupLng = pos.coords.longitude;
 } catch(e) { /* GPS 실패해도 진행 */ }

 try {
 const res = await fetch('/api/walk-requests', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 requesterId: user.id,
 walkerId,
 dogName,
 dogBreed,
 dogSize,
 dogSpecialNotes: notes,
 requestMessage: msg,
 duration,
 totalPrice,
 requestedStartTime: new Date().toISOString(),
 requestedEndTime: new Date(Date.now() + duration * 60000).toISOString(),
 pickupLatitude: pickupLat,
 pickupLongitude: pickupLng
 })
 });
 const result = await res.json();
 if (!result.success) {
 if (errEl) errEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
 return;
 }
 document.getElementById('walk-req-modal')?.remove();
 showToast(`산책 요청을 보냈습니다! (${duration}분 · ${totalPrice.toLocaleString()}원)`, 'success');
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
 <div style="font-size:2rem;"></div>
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
 ${request.dogSpecialNotes ? `<div style="margin-top:10px;font-size:0.83rem;color:#4A5568;">특이사항: ${request.dogSpecialNotes}</div>` : ''}
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
 actions.innerHTML = `<div style="background:#EBF8FF;border-radius:8px;padding:10px 12px;font-size:0.82rem;color:#2C5282;width:100%;">요청자에게 이동 중이에요! 위치로 찾아가세요.</div>`;
 }
 // 상태 뱃지 업데이트
 const badge = card.querySelector('[style*="대기"]') || card.querySelector('span[style*="F6AD55"]');
 if (badge) badge.style.cssText = badge.style.cssText.replace(/background:[^;]+/, 'background:#4299E120').replace(/color:[^;]+/, 'color:#4299E1') + '; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700;';
 }

 document.getElementById('walker-req-notif')?.remove();
 showToast(`${requesterName}님 요청 수락! 요청자에게 이동 중이에요.`, 'success');
 showChatButton(requestId);
 window._activeWalkRequestId = requestId;

 // 수락 즉시 도우미 위치를 요청자에게 전송 시작
 _startWalkerLocationSharing(requestId);

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


let _activeSessionId = null;
let _walkRouteMap = null;
let _walkPolyline = null;
let _walkLiveMarker = null;
let _walkRoutePoints = [];
let _walkPositionHandler = null;
let _walkNavWatchId = null;      // 도우미 GPS watchPosition ID
let _walkNavLine = null;         // 도우미→픽업 방향선
let _walkNavMyMarker = null;     // 도우미 본인 실시간 마커
let _walkSessionPollTimer = null; // 요청자 도우미 마커 폴링 타이머
let _walkElapsedTimer = null;    // 경과 시간 타이머
let _walkStartMs = 0;
let _walkTestGpsTimer = null;
let _walkTestGpsStep = 0;

function isWalkTestGpsEnabled() {
 return localStorage.getItem('pawsitive_walk_test_gps') === 'on';
}

function toggleWalkTestGps() {
 const next = isWalkTestGpsEnabled() ? 'off' : 'on';
 localStorage.setItem('pawsitive_walk_test_gps', next);
 showToast(next === 'on' ? '테스트 GPS 이동을 켰어요.' : '테스트 GPS 이동을 껐어요.', 'info');
 renderWalkSessionPage(_activeSessionId);
}

/** 도우미: 산책 시작 (heading) — 중복 호출 방지 */
let _startWalkSessionInProgress = false;
async function startWalkSession(requestId, requesterId, dogName) {
 if (_startWalkSessionInProgress) return;
 const user = AuthService.getCurrentUser();
 if (!user) return;
 _startWalkSessionInProgress = true;
 try {
   const res = await fetch('/api/walk-sessions', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ requestId, walkerId: user.id, requesterId, dogName })
   });
   const result = await res.json();
   if (!result.success) { showToast(result.error || '산책 시작에 실패했습니다.', 'error'); return; }
   _activeSessionId = result.session.id;
   window._activeWalkRequestId = requestId;
   // 출발 단계(heading)에서는 경로 기록 안 함 — 산책 시작(walking) 시 startActualWalk에서 시작
   _startWalkerLocationSharing(requestId);
   showToast('출발! 픽업 장소로 이동해주세요.', 'success');
   Router.navigate('/walk-session');
 } catch(e) {
   showToast('오류가 발생했습니다.', 'error');
 } finally {
   setTimeout(() => { _startWalkSessionInProgress = false; }, 3000);
 }
}

/** 도우미 위치를 요청자에게 주기적으로 전송 */
let _walkerLocationInterval = null;
function _startWalkerLocationSharing(requestId) {
 _stopWalkerLocationSharing();
 if (!navigator.geolocation) return;

 function sendLocation() {
   navigator.geolocation.getCurrentPosition(pos => {
     fetch(`/api/walk-requests/${requestId}/walker-location`, {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
     }).catch(() => {});
   }, () => {}, { enableHighAccuracy: true, timeout: 5000, maximumAge: 3000 });
 }

 sendLocation(); // 즉시 1회
 _walkerLocationInterval = setInterval(sendLocation, 5000);
 _walkerLocationInterval = setInterval(sendLocation, 5000);
}

function _stopWalkerLocationSharing() {
 if (_walkerLocationInterval) { clearInterval(_walkerLocationInterval); _walkerLocationInterval = null; }
 if (_walkTestGpsTimer) { clearInterval(_walkTestGpsTimer); _walkTestGpsTimer = null; }
 _walkTestGpsStep = 0;
}

/** 도우미: 수락 후 취소 (heading/arrived/handoff 상태) */
async function cancelWalkSession(sessionId) {
 const reason = prompt('취소 사유를 입력해주세요 (요청자에게 전달됩니다):');
 if (reason === null) return; // 취소 버튼
 if (!confirm('정말 취소하시겠습니까? 요청자에게 알림이 전달됩니다.')) return;
 try {
   const res = await fetch(`/api/walk-sessions/${sessionId}/cancel`, {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ reason: reason.trim() || '도우미 사정으로 취소' })
   });
   const result = await res.json();
   if (!result.success) { showToast(result.error || '취소 실패', 'error'); return; }
   RealtimeService.stopRouteTracking();
   _stopWalkerLocationSharing();
   _activeSessionId = null;
   window._activeWalkRequestId = null;
   showToast('취소 처리됐습니다. 요청자에게 알림이 전달됐어요.', 'info');
   const user = AuthService.getCurrentUser();
   const profile = user ? MatchingService.getMyProfile(user.id) : null;
   if (profile) renderWalkerDashboard(user, profile);
   else renderMatchingPage();
 } catch(e) { showToast('오류가 발생했습니다.', 'error'); }
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
 showToast('도착 알림을 보냈어요! 반려견을 픽업해주세요.', 'success');
 renderWalkSessionPage(sessionId);
 } catch(e) {
 showToast('오류가 발생했습니다.', 'error');
 }
}

/** 요청자: 반려견 전달 완료 확인 (arrived → handoff) */
async function confirmHandoff(sessionId) {
 if (!confirm('반려견을 도우미에게 전달하셨나요?')) return;
 try {
   const res = await fetch(`/api/walk-sessions/${sessionId}/confirm-handoff`, {
     method: 'PATCH', headers: { 'Content-Type': 'application/json' }
   });
   const result = await res.json();
   if (!result.success) { showToast(result.error || '오류가 발생했습니다.', 'error'); return; }
   showToast('전달 완료! 도우미가 곧 산책을 시작해요.', 'success');
   renderWalkSessionPage(sessionId);
 } catch(e) { showToast('오류가 발생했습니다.', 'error'); }
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
 if (!isWalkTestGpsEnabled()) RealtimeService.startRouteTracking(sessionId);
 if ('wakeLock' in navigator) navigator.wakeLock.request('screen').catch(()=>{});
 showToast('산책 중 화면을 꺼지 마세요 ? 위치 공유가 유지됩니다.', 'info');
 renderWalkSessionPage(sessionId);
 } catch(e) {
 showToast('오류가 발생했습니다.', 'error');
      }
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
    _stopWalkerLocationSharing();
    _activeSessionId = null;
    showWalkCompletionScreen(result.session, result.totalDistanceKm);
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}

function showWalkCompletionScreen(session, distKm) {
  document.getElementById('walk-completion-screen')?.remove();
  const user = AuthService.getCurrentUser();
  const el = document.createElement('div');
  el.id = 'walk-completion-screen';
  el.style.cssText = 'position:fixed;inset:0;z-index:9500;background:#fff;display:flex;flex-direction:column;overflow-y:auto;animation:ltFadeIn 0.3s ease;';

  let durationText = '-';
  if (session?.walkStartedAt && session?.endedAt) {
    const mins = Math.round((new Date(session.endedAt) - new Date(session.walkStartedAt)) / 60000);
    durationText = mins >= 60 ? `${Math.floor(mins/60)}시간 ${mins%60}분` : `${mins}분`;
  }

  const requestId = session?.requestId || '';

  el.innerHTML = `
    <div style="flex:1;padding:32px 24px 0;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:64px;height:64px;border-radius:50%;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 12px;">${icon('flag',28,'#00AA76')}</div>
        <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:4px;">산책 완료!</h2>
        <p style="font-size:0.85rem;color:#718096;">수고하셨어요. 오늘도 행복한 산책이었나요?</p>
      </div>

      <!-- 산책 요약 -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:#f0f0ee;border-radius:14px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#fff;padding:16px;text-align:center;">
          <div style="font-size:1.4rem;font-weight:800;">${distKm ?? '?'}</div>
          <div style="font-size:0.7rem;color:#aaa;margin-top:3px;">km</div>
        </div>
        <div style="background:#fff;padding:16px;text-align:center;">
          <div style="font-size:1.4rem;font-weight:800;">${durationText}</div>
          <div style="font-size:0.7rem;color:#aaa;margin-top:3px;">산책 시간</div>
        </div>
        <div style="background:#fff;padding:16px;text-align:center;">
          <div style="font-size:1.4rem;font-weight:800;">${session?.dogName || '?'}</div>
          <div style="font-size:0.7rem;color:#aaa;margin-top:3px;">반려견</div>
        </div>
      </div>

    </div>

    <div style="padding:16px 24px 32px;display:flex;flex-direction:column;gap:10px;">
      ${session?.id ? `
      <button onclick="showWalkRouteModal('${session.id}','도우미','${distKm ?? '?'} km','')"
        style="width:100%;padding:13px;background:#f0fdf4;color:#00AA76;border:2px solid #00AA76;border-radius:14px;font-size:0.9rem;font-weight:700;cursor:pointer;">
        ${icon('map',16,'#00AA76')} 산책 경로 확인하기
      </button>` : ''}
      <button onclick="document.getElementById('walk-completion-screen').remove();Router.navigate('/matching')"
        style="width:100%;padding:14px;background:#1a1a1a;color:#fff;border:none;border-radius:14px;font-size:0.95rem;font-weight:700;cursor:pointer;">
        확인
      </button>
    </div>
  `;
  document.body.appendChild(el);
}

// 요청자: 산책 종료 후 리뷰 팝업 (도우미를 리뷰)
async function showRequesterReviewPrompt(sessionId, walkerId, distKm) {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  // 이미 리뷰 썼는지 확인
  try {
    const chk = await fetch(`/api/walk-review/check/${sessionId}/${user.id}`);
    const chkData = await chk.json();
    if (chkData.reviewed) return; // 이미 작성
  } catch(e) {}

  // 도우미 이름 조회
  let walkerName = '도우미';
  try {
    const sRes = await fetch(`/api/walk-sessions?userId=${user.id}`);
    const sData = await sRes.json();
    const session = (sData.sessions || []).find(s => s.id === sessionId);
    if (session) walkerName = session.walkerName || walkerName;
  } catch(e) {}

  document.getElementById('requester-review-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'requester-review-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,0.45);display:flex;align-items:flex-end;';

  modal.innerHTML = `
    <div style="background:#fff;border-radius:24px 24px 0 0;width:100%;padding:28px 24px 40px;animation:slideUp 0.3s ease;">
      <div style="width:40px;height:4px;background:#e0e0e0;border-radius:2px;margin:0 auto 20px;"></div>
      <h3 style="font-size:1rem;font-weight:800;margin-bottom:4px;">${walkerName}님 산책 어떠셨나요?</h3>
      <p style="font-size:0.8rem;color:#aaa;margin-bottom:20px;">솔직한 리뷰가 더 좋은 서비스를 만들어요</p>

      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:12px;" id="req-review-stars">
        ${[1,2,3,4,5].map(n => `<button onclick="selectReviewStar(${n},'req')" data-star="${n}" style="background:none;border:none;cursor:pointer;padding:4px;">${icon('star',36,'#E0E0E0')}</button>`).join('')}
      </div>
      <div id="req-review-label" style="text-align:center;font-size:0.82rem;color:#aaa;margin-bottom:14px;">별점을 선택해주세요</div>
      <textarea id="req-review-comment" placeholder="도우미에 대한 후기를 남겨주세요 (선택)" rows="3"
        style="width:100%;border:1.5px solid #e8e8e6;border-radius:12px;padding:12px;font-size:0.85rem;resize:none;font-family:inherit;margin-bottom:14px;"></textarea>

      <button id="req-review-submit" onclick="submitWalkReview('${sessionId}','${walkerId}')"
        style="width:100%;padding:14px;background:#1a1a1a;color:#fff;border:none;border-radius:14px;font-size:0.92rem;font-weight:700;cursor:pointer;margin-bottom:8px;">
        리뷰 남기기
      </button>
      <button onclick="document.getElementById('requester-review-modal').remove();Router.navigate('/matching')"
        style="width:100%;padding:10px;background:none;border:none;color:#aaa;font-size:0.85rem;cursor:pointer;">
        건너뛰기
      </button>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

let _reviewSelectedStar = 0;
function selectReviewStar(n, context) {
  _reviewSelectedStar = n;
  const labels = ['','별로였어요','조금 아쉬워요','보통이에요','좋았어요','최고예요!'];
  const prefix = context === 'req' ? 'req-' : '';
  const labelEl = document.getElementById(`${prefix}review-label`);
  if (labelEl) labelEl.textContent = labels[n];
  const starsEl = document.getElementById(`${prefix}review-stars`);
  if (starsEl) starsEl.querySelectorAll('button').forEach((btn, i) => {
    btn.innerHTML = icon('star', context === 'req' ? 36 : 32, i < n ? '#F6A623' : '#E0E0E0');
  });
}

// 구버전 호환용 (단일 인자 호출 시)
// selectReviewStar(n, context) 위에 정의됨

async function submitWalkReview(requestId, walkerId) {
  const user = AuthService.getCurrentUser();
  if (!user || !_reviewSelectedStar) {
    showToast('별점을 선택해주세요.', 'error'); return;
  }
  // 요청자 리뷰 폼 또는 구버전 폼에서 코멘트 읽기
  const comment = (document.getElementById('req-review-comment') || document.getElementById('review-comment'))?.value?.trim();
  const btn = document.getElementById('req-review-submit') || document.getElementById('review-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = '제출 중...'; }

  try {
    const res = await fetch('/api/walk-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        reviewerId: user.id,  // 요청자 ID
        walkerId,              // 도우미 ID (리뷰 대상)
        rating: _reviewSelectedStar,
        comment
      })
    });
    const data = await res.json();
    if (data.success) showToast('리뷰가 등록됐어요. 감사합니다!', 'success');
    else showToast(data.error || '이미 리뷰를 작성했어요.', 'info');
  } catch(e) {}

  document.getElementById('requester-review-modal')?.remove();
  document.getElementById('walk-completion-screen')?.remove();
  _reviewSelectedStar = 0;
  Router.navigate('/matching');
}

/** 산책 세션 페이지 렌더링 (실시간 경로 지도) */
async function renderWalkSessionPage(sessionId) {
 let sid = sessionId || _activeSessionId;
 const user = AuthService.getCurrentUser();
 if (!user) { Router.navigate('/login'); return; }

 if (!sid) {
   try {
     const res = await fetch(`/api/walk-sessions?userId=${user.id}`);
     const data = await res.json();
     const active = (data.sessions || []).filter(s => ['heading','arrived','handoff','walking'].includes(s.status));
     if (active.length > 0) { sid = active[0].id; _activeSessionId = sid; window._activeWalkRequestId = active[0].requestId; }
   } catch(e) {}
 }

 if (!sid) {
   renderPage(`<div style="padding:80px 20px;text-align:center;">
     <div style="font-size:3.5rem;margin-bottom:16px;">🐾</div>
     <p style="color:#94A3B8;font-size:0.95rem;margin-bottom:24px;">진행 중인 산책이 없습니다.</p>
     <button class="btn btn-primary" onclick="Router.navigate('/matching')">매칭 페이지로</button>
   </div>`);
   return;
 }

 let sessions = [];
 try {
   const res = await fetch(`/api/walk-sessions?userId=${user.id}`);
   const data = await res.json();
   sessions = data.sessions || [];
 } catch(e) {}

 const session = sessions.find(s => s.id === sid);
 const isWalker = !!(session && session.walkerId === user.id);
 const st = session?.status || 'heading';

 const STATUS_CFG = {
   heading:   { dot:'#3B82F6', label:'픽업 장소로 이동 중',  sub:'도우미가 이동하고 있어요' },
   arrived:   { dot:'#F59E0B', label:'픽업 장소 도착',       sub:'반려견을 전달해주세요' },
   handoff:   { dot:'#8B5CF6', label:'반려견 인계 완료',      sub:'산책을 시작해주세요' },
   walking:   { dot:'#10B981', label:'산책 중',              sub:'실시간 경로를 추적 중이에요' },
   completed: { dot:'#94A3B8', label:'산책 완료',            sub:'산책이 완료되었습니다' },
 };
 const cfg = STATUS_CFG[st] || STATUS_CFG.heading;
 const pulse = st !== 'completed';
 const dogLabel = session ? `${session.dogName || '반려견'} · ${new Date(session.startedAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 시작` : cfg.sub;

 // 액션 버튼
 let actionBtn = '';
 if (isWalker) {
   const cancelBtn = `<button class="wsp-cancel-btn" onclick="cancelWalkSession('${sid}')">취소</button>`;
   if (st === 'heading')   actionBtn = `<div class="wsp-btn-row">${cancelBtn}<button class="wsp-btn wsp-btn--blue" onclick="arriveAtPickup('${sid}')">📍 도착했어요</button></div>`;
   else if (st === 'arrived') actionBtn = `<div class="wsp-btn-row">${cancelBtn}<span class="wsp-waiting">전달 확인 대기 중…</span></div>`;
   else if (st === 'handoff')  actionBtn = `<button class="wsp-btn wsp-btn--green" onclick="startActualWalk('${sid}')">🐾 산책 시작</button>`;
  else if (st === 'walking')  actionBtn = `<div class="wsp-btn-row"><button class="wsp-cancel-btn" onclick="toggleWalkTestGps()">${isWalkTestGpsEnabled() ? '테스트 이동 끄기' : '테스트 이동'}</button><button class="wsp-btn wsp-btn--red" onclick="endWalkSession('${sid}')">🏁 산책 종료</button></div>`;
 } else {
   if (st === 'arrived') actionBtn = `<button class="wsp-btn wsp-btn--amber" onclick="confirmHandoff('${sid}')">🐕 반려견 전달 완료</button>`;
 }

 const showStats = st === 'walking' || st === 'completed';

 renderPage(`
 <div class="wsp-root">
   <div class="wsp-header">
     <div class="wsp-header-left">
       <span class="wsp-dot${pulse?' wsp-dot--pulse':''}" style="background:${cfg.dot}"></span>
       <div class="wsp-header-text">
         <div class="wsp-title">${cfg.label}</div>
         <div class="wsp-sub">${dogLabel}</div>
       </div>
     </div>
     <div class="wsp-header-right">${actionBtn}</div>
   </div>

   <div class="wsp-map-wrap">
     <div id="walk-session-map" class="wsp-map"></div>
     <div id="wsp-banner" class="wsp-banner" style="display:none"></div>
   </div>

   <div class="wsp-stats${showStats?'':' wsp-hidden'}">
     <div class="wsp-stat">
       <div class="wsp-stat-val" id="route-elapsed">00:00</div>
       <div class="wsp-stat-key">시간</div>
     </div>
     <div class="wsp-stat-sep"></div>
     <div class="wsp-stat">
       <div class="wsp-stat-val"><span id="route-distance">0.00</span><small> km</small></div>
       <div class="wsp-stat-key">거리</div>
     </div>
     <div class="wsp-stat-sep"></div>
     <div class="wsp-stat">
       <div class="wsp-stat-val" id="route-pace">—</div>
       <div class="wsp-stat-key">평균속도</div>
     </div>
   </div>

   ${st === 'completed' ? `<div class="wsp-footer">
     <button class="wsp-btn wsp-btn--gray" onclick="Router.navigate('/matching')">← 돌아가기</button>
   </div>` : ''}
 </div>

 <style>
 .wsp-root{display:flex;flex-direction:column;background:#F8FAFC;}
 .wsp-header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 16px;background:#fff;border-bottom:1px solid #EEF2F7;min-height:62px;}
 .wsp-header-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
 .wsp-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
 .wsp-dot--pulse{animation:wspDotPulse 2s ease infinite;}
 @keyframes wspDotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.6}}
 .wsp-header-text{min-width:0;}
 .wsp-title{font-size:0.92rem;font-weight:700;color:#0F172A;line-height:1.3;}
 .wsp-sub{font-size:0.73rem;color:#94A3B8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
 .wsp-header-right{flex-shrink:0;}
 .wsp-btn-row{display:flex;align-items:center;gap:7px;}
 .wsp-cancel-btn{background:none;border:1px solid #FDA4AF;color:#F43F5E;font-size:0.73rem;font-weight:600;padding:6px 10px;border-radius:8px;cursor:pointer;}
 .wsp-waiting{font-size:0.75rem;color:#94A3B8;font-weight:600;background:#F1F5F9;padding:7px 11px;border-radius:8px;}
 .wsp-btn{display:inline-flex;align-items:center;gap:5px;padding:9px 15px;border-radius:10px;font-size:0.84rem;font-weight:700;border:none;cursor:pointer;white-space:nowrap;}
 .wsp-btn--blue{background:#3B82F6;color:#fff;}
 .wsp-btn--green{background:#10B981;color:#fff;}
 .wsp-btn--red{background:#EF4444;color:#fff;}
 .wsp-btn--amber{background:#F59E0B;color:#fff;}
 .wsp-btn--gray{background:#F1F5F9;color:#374151;font-weight:600;}
 .wsp-map-wrap{position:relative;}
 .wsp-map{height:56vh;width:100%;}
 .wsp-banner{position:absolute;top:14px;left:50%;transform:translateX(-50%);z-index:900;background:rgba(15,23,42,.85);backdrop-filter:blur(6px);color:#fff;padding:8px 18px;border-radius:20px;font-size:0.8rem;font-weight:600;pointer-events:none;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.25);}
 .wsp-stats{display:flex;align-items:center;justify-content:space-around;padding:14px 20px;background:#fff;border-top:1px solid #EEF2F7;}
 .wsp-hidden{display:none!important;}
 .wsp-stat{text-align:center;}
 .wsp-stat-val{font-size:1.18rem;font-weight:800;color:#0F172A;letter-spacing:-.5px;line-height:1.2;}
 .wsp-stat-val small{font-size:.68rem;font-weight:600;color:#94A3B8;}
 .wsp-stat-key{font-size:.68rem;color:#94A3B8;margin-top:3px;font-weight:500;}
 .wsp-stat-sep{width:1px;height:30px;background:#E2E8F0;}
 .wsp-footer{padding:12px 16px;background:#fff;border-top:1px solid #EEF2F7;}
 /* 마커 */
 .wsm-me{width:16px;height:16px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,.45);}
 .wsm-walker{width:38px;height:38px;background:#F59E0B;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;box-shadow:0 3px 14px rgba(245,158,11,.5);}
 .wsm-walker--pulse{animation:wsmWalkerPulse 2s ease infinite;}
 @keyframes wsmWalkerPulse{0%,100%{box-shadow:0 3px 14px rgba(245,158,11,.5)}50%{box-shadow:0 3px 22px rgba(245,158,11,.85),0 0 0 10px rgba(245,158,11,.1)}}
 .wsm-pickup{width:34px;height:34px;background:#EF4444;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 3px 12px rgba(239,68,68,.45);}
 </style>
 `);

 const resolvedReqId = window._activeWalkRequestId || session?.requestId;
 if (resolvedReqId) window._activeWalkRequestId = resolvedReqId;

 setTimeout(() => _initWalkSessionMap(sid, { isWalker, sessionStatus: st, requestId: resolvedReqId }), 80);

 if (showStats) {
   const startAt = session?.walkStartedAt || session?.startedAt;
   _walkStartMs = startAt ? new Date(startAt).getTime() : Date.now();
   _startElapsedTimer(startAt);
 }

 if (resolvedReqId) showChatButton(resolvedReqId);
}

async function _initWalkSessionMap(sessionId, opts = {}) {
 const { isWalker = false, sessionStatus = '', requestId = null } = opts;
 const container = document.getElementById('walk-session-map');
 if (!container) return;

 // ── 기존 리소스 정리 ──
 if (_walkNavWatchId !== null) { navigator.geolocation.clearWatch(_walkNavWatchId); _walkNavWatchId = null; }
 if (_walkSessionPollTimer) { clearInterval(_walkSessionPollTimer); _walkSessionPollTimer = null; }
 if (_walkTestGpsTimer) { clearInterval(_walkTestGpsTimer); _walkTestGpsTimer = null; }
 if (_walkElapsedTimer) { clearInterval(_walkElapsedTimer); _walkElapsedTimer = null; }
 if (_walkPositionHandler) { RealtimeService.off('walker-position', _walkPositionHandler); _walkPositionHandler = null; }
 if (_walkRouteMap) { try { _walkRouteMap.remove(); } catch(e) {} _walkRouteMap = null; }
 _walkPolyline = null; _walkLiveMarker = null; _walkNavLine = null; _walkNavMyMarker = null; _walkRoutePoints = [];

 // ── 헬퍼 ──
 const _hav = (la1,lo1,la2,lo2) => {
   const R=6371000,r=Math.PI/180,dLa=(la2-la1)*r,dLo=(lo2-lo1)*r;
 const a=Math.sin(dLa/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2;
 return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
};
 const _moveMarkerSmooth = (marker, nextLatLng, duration = 900) => {
   if (!marker || !nextLatLng) return;
   const cur = marker.getLatLng();
   const fromLat = cur.lat, fromLng = cur.lng;
   const toLat = Array.isArray(nextLatLng) ? nextLatLng[0] : nextLatLng.lat;
   const toLng = Array.isArray(nextLatLng) ? nextLatLng[1] : nextLatLng.lng;
   if (!Number.isFinite(toLat) || !Number.isFinite(toLng)) return;
   if (marker._smoothAnim) cancelAnimationFrame(marker._smoothAnim);
   const start = performance.now();
   const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
   const step = now => {
     const t = Math.min(1, (now - start) / duration);
     const e = ease(t);
     marker.setLatLng([fromLat + (toLat - fromLat) * e, fromLng + (toLng - fromLng) * e]);
     if (t < 1) marker._smoothAnim = requestAnimationFrame(step);
   };
   marker._smoothAnim = requestAnimationFrame(step);
 };
 const _banner = document.getElementById('wsp-banner');
 const _showBanner = t => { if (_banner) { _banner.textContent=t; _banner.style.display=''; } };
 const _hideBanner = () => { if (_banner) _banner.style.display='none'; };
 const _etaText = sec => sec < 60 ? `${sec}초` : `약 ${Math.ceil(sec/60)}분`;
 const _distText = m => m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`;

 // ── 프로필 사진 기반 원형 아이콘 팩토리 ──
 const _makeSessionIcon = (photoUrl, fallback, color, size, pulse) => {
   const inner = photoUrl
     ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;">`
     : `<div style="width:100%;height:100%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:${Math.round(size*0.32)}px;">${fallback}</div>`;
   return L.divIcon({
     html:`<div style="width:${size}px;height:${size}px;border-radius:50%;border:3px solid #fff;outline:2.5px solid ${color};overflow:hidden;box-shadow:0 3px 14px rgba(0,0,0,0.3);background:${color};${pulse?'animation:wsmWalkerPulse 2s ease infinite;':''}">${inner}</div>`,
     className:'', iconSize:[size,size], iconAnchor:[size/2,size/2]
   });
 };

 // 현재 사용자 프로필 사진 가져오기
 const _curUser = AuthService.getCurrentUser();
 const _myProfile = _curUser ? MatchingService.getMyProfile(_curUser.id) : null;
 let _myPhoto = _curUser?.profileImage || _myProfile?.profilePhoto || '';
 const _myName  = _curUser ? (_curUser.nickname || _curUser.name || '나') : '나';

 if (isWalker && !_myPhoto && _curUser?.id) {
   try {
     const walkerData = await (await fetch('/api/walkers')).json();
     const self = Array.isArray(walkerData) ? walkerData.find(w => w.userId === _curUser.id || w.id === _curUser.id) : null;
     _myPhoto = self?.profilePhoto || self?.profileImage || '';
   } catch(e) {}
 }

 // 아이콘 팩토리 (사진 우선, 없으면 기존 스타일)
 const _iconMe = (photo, name) => _makeSessionIcon(
   photo || _myPhoto, (name||_myName).charAt(0), '#3B82F6', 38, false
 );
 const _iconWalker = (pulse=false, photo, name) => _makeSessionIcon(
   photo || '', (name||'도').charAt(0), '#F59E0B', 44, pulse
 );
 const _iconPickup = () => L.divIcon({
   html:`<div class="wsm-pickup">📍</div>`,
   className:'',iconSize:[34,34],iconAnchor:[17,17]
 });

 // ── 내 GPS 위치: 캐시(30s) 우선 → 실패 시 정밀 재시도 ──
 let myLat=null, myLng=null;
 try {
   // 1단계: 캐시된 위치 즉시 수신 (빠름)
   const pos = await new Promise((res,rej) =>
     navigator.geolocation.getCurrentPosition(res,rej,{timeout:3000,enableHighAccuracy:false,maximumAge:30000})
   );
   myLat=pos.coords.latitude; myLng=pos.coords.longitude;
 } catch(e) {
   try {
     // 2단계: 캐시 없으면 정밀 GPS 재시도
     const pos = await new Promise((res,rej) =>
       navigator.geolocation.getCurrentPosition(res,rej,{timeout:10000,enableHighAccuracy:true,maximumAge:0})
     );
     myLat=pos.coords.latitude; myLng=pos.coords.longitude;
   } catch(e2) {}
 }

 const _hasGps = myLat !== null;
 const _initLat = myLat ?? 37.5665, _initLng = myLng ?? 126.9780;
 const _initZoom = _hasGps ? 17 : 14;

 // ── 지도 생성 ──
 _walkRouteMap = L.map('walk-session-map',{zoomControl:true,attributionControl:true}).setView([_initLat,_initLng],_initZoom);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(_walkRouteMap);

 // ── 픽업 위치 조회 ──
 let pickupLat=null, pickupLng=null, pickupName='요청자';
 try {
   const url = isWalker
     ? `/api/walk-requests?walkerId=${AuthService.getCurrentUser()?.id}`
     : (requestId ? `/api/walk-requests/${requestId}` : null);
   if (url) {
     const d = await (await fetch(url)).json();
     const req = isWalker
       ? (d.requests||[]).find(r=>r.id===requestId||['heading','arrived','handoff','walking'].includes(r.status))
       : (d.request||null);
     if (req?.pickupLatitude) { pickupLat=req.pickupLatitude; pickupLng=req.pickupLongitude; pickupName=req.requesterName||'요청자'; }
   }
 } catch(e) {}

 // 요청자/도우미 사진 로드 (매칭 프로필에서)
 let _partnerPhoto = '';
 try {
   if (isWalker) {
     // 도우미 → 요청자 사진은 walk-requests에서 requesterPhoto 또는 별도 조회
     const reqData = requestId ? await (await fetch(`/api/walk-requests/${requestId}`)).json() : null;
    _partnerPhoto = reqData?.request?.requesterPhoto || reqData?.request?.requesterProfileImage || '';
   } else {
     // 요청자 → 도우미 사진은 walkers API에서
     const walkerSession = await (await fetch(`/api/walk-sessions?userId=${_curUser?.id}`)).json();
     const sess = (walkerSession.sessions||[]).find(s=>s.id===sessionId);
     if (sess?.walkerId) {
       const walkerData = await (await fetch('/api/walkers')).json();
      const walker = walkerData.find(w=>w.userId===sess.walkerId);
      _partnerPhoto = walker?.profilePhoto || walker?.profileImage || '';
     }
   }
 } catch(e) {}

 // ════════════════════════════════════════════════════════
 // 도우미 뷰
 // ════════════════════════════════════════════════════════
 if (isWalker) {

   // ── 단계 1/2: 이동 중 / 도착 (픽업 네비게이션) ──
   if (sessionStatus==='heading' || sessionStatus==='arrived') {
     // 도우미 본인 마커 (도우미 사진)
     if (_hasGps) {
       _walkNavMyMarker = L.marker([myLat,myLng],{icon:_iconWalker(true, _myPhoto, _myName)}).bindPopup('내 위치').addTo(_walkRouteMap);
     }

     if (pickupLat && pickupLng) {
       // 픽업 마커 → 요청자 사진 사용
       L.marker([pickupLat,pickupLng],{icon:_makeSessionIcon(_partnerPhoto, pickupName.charAt(0), '#EF4444', 40, false)}).bindPopup(`<b>${pickupName}</b><br>픽업 장소`).addTo(_walkRouteMap);
       if (_hasGps) {
         _walkNavLine = L.polyline([[myLat,myLng],[pickupLat,pickupLng]],{color:'#3B82F6',weight:3,dashArray:'8 5',opacity:.8}).addTo(_walkRouteMap);
         _walkRouteMap.fitBounds([[myLat,myLng],[pickupLat,pickupLng]],{padding:[60,60],maxZoom:17});
         const d0=_hav(myLat,myLng,pickupLat,pickupLng);
         _showBanner(`📍 픽업까지 ${_distText(d0)} · ${_etaText(Math.ceil(d0/1.3))}`);
       } else {
         _walkRouteMap.setView([pickupLat,pickupLng],16);
         _showBanner('📍 GPS 신호 확인 중…');
       }
     } else if (_hasGps) {
       _walkRouteMap.setView([myLat,myLng],16);
     }

     // GPS 실시간 추적 (maximumAge:0 → 항상 새 위치)
     if (navigator.geolocation) {
       _walkNavWatchId = navigator.geolocation.watchPosition(pos => {
         const la=pos.coords.latitude, lo=pos.coords.longitude;
         // 마커 최초 생성 또는 이동
         if (!_walkNavMyMarker) {
          _walkNavMyMarker = L.marker([la,lo],{icon:_iconWalker(true, _myPhoto, _myName)}).bindPopup('내 위치').addTo(_walkRouteMap);
         } else {
           _moveMarkerSmooth(_walkNavMyMarker, [la,lo]);
         }
         if (!_walkNavLine && pickupLat) {
           _walkNavLine = L.polyline([[la,lo],[pickupLat,pickupLng]],{color:'#3B82F6',weight:3,dashArray:'8 5',opacity:.8}).addTo(_walkRouteMap);
         } else if (_walkNavLine && pickupLat) {
           _walkNavLine.setLatLngs([[la,lo],[pickupLat,pickupLng]]);
         }
         if (pickupLat) {
           const m=_hav(la,lo,pickupLat,pickupLng);
           _showBanner(`📍 픽업까지 ${_distText(m)} · ${_etaText(Math.ceil(m/1.3))}`);
         }
         if (requestId) fetch(`/api/walk-requests/${requestId}/walker-location`,{
           method:'PATCH',headers:{'Content-Type':'application/json'},
           body:JSON.stringify({lat:la,lng:lo})
         }).catch(()=>{});
         if (_walkRouteMap) _walkRouteMap.panTo([la,lo],{animate:true,duration:.4});
       }, null, {enableHighAccuracy:true,timeout:15000,maximumAge:0});
     }

   // ── 단계 3: 산책 중 / 완료 (본인 경로 표시) ──
    if (sessionStatus === 'arrived') {
      _walkSessionPollTimer = setInterval(async () => {
        try {
          const d = await (await fetch(`/api/walk-sessions?userId=${_curUser?.id}`)).json();
          const latest = (d.sessions || []).find(s => s.id === sessionId);
          if (latest && latest.status !== sessionStatus) {
            _activeSessionId = sessionId;
            renderWalkSessionPage(sessionId);
          }
        } catch(e) {}
      }, 3000);
    }

  } else if (sessionStatus==='walking' || sessionStatus==='completed') {
     _hideBanner();

     // 저장된 경로 로드
     let lastPt = null;
     try {
       const d = await (await fetch(`/api/walk-sessions/${sessionId}/route`)).json();
       if (d.points?.length > 0) {
         _walkRoutePoints = d.points.map(p=>[p.latitude,p.longitude]);
         _walkPolyline = L.polyline(_walkRoutePoints,{color:'#F59E0B',weight:5,opacity:.9}).addTo(_walkRouteMap);
         lastPt = _walkRoutePoints[_walkRoutePoints.length-1];
         _walkLiveMarker = L.marker(lastPt,{icon:_iconWalker(sessionStatus==='walking', _myPhoto, _myName)}).addTo(_walkRouteMap);
         _updateRouteStats(d.points.length, d.totalDistanceKm);
         if (sessionStatus==='completed') {
           _walkRouteMap.fitBounds(_walkPolyline.getBounds(),{padding:[50,50],maxZoom:17});
         } else {
           _walkRouteMap.setView(lastPt,17);
         }
       }
     } catch(e) {}

     if (!lastPt) {
       if (_hasGps) {
         // 캐시 GPS로 즉시 위치 설정 (watchPosition이 정확한 위치로 갱신)
         _walkRouteMap.setView([myLat,myLng],17);
       }
       if (sessionStatus==='walking') _showBanner('📡 GPS 위치 확인 중…');
     }

     // 산책 중: watchPosition으로 경로 그리기
     if (sessionStatus==='walking') {
      if (isWalkTestGpsEnabled()) {
        RealtimeService.stopRouteTracking();
        _hideBanner();
        const baseLat = lastPt?.[0] ?? myLat ?? pickupLat ?? 37.5665;
        const baseLng = lastPt?.[1] ?? myLng ?? pickupLng ?? 126.9780;
        const pushTestPoint = async () => {
          _walkTestGpsStep += 1;
          const lat = baseLat + (_walkTestGpsStep * 0.000055);
          const lng = baseLng + Math.sin(_walkTestGpsStep / 3) * 0.000045 + (_walkTestGpsStep * 0.000018);
          const latlng = [lat, lng];
          if (_walkLiveMarker) _moveMarkerSmooth(_walkLiveMarker, latlng);
          else _walkLiveMarker = L.marker(latlng,{icon:_iconWalker(true, _myPhoto, _myName)}).addTo(_walkRouteMap);
          if (!_walkPolyline) _walkPolyline = L.polyline([latlng],{color:'#F59E0B',weight:5,opacity:.9}).addTo(_walkRouteMap);
          else _walkPolyline.addLatLng(latlng);
          _walkRoutePoints.push(latlng);
          _walkRouteMap?.setView(latlng,_walkRouteMap.getZoom()>=16?_walkRouteMap.getZoom():17,{animate:true,duration:.4});
          _updateRouteStatsDelta();
          try {
            await fetch(`/api/walk-sessions/${sessionId}/route`, {
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify({latitude:lat, longitude:lng})
            });
          } catch(e) {}
        };
        pushTestPoint();
        _walkTestGpsTimer = setInterval(pushTestPoint, 2500);
      } else {
      RealtimeService.startRouteTracking(sessionId);
       if (navigator.geolocation) {
         let _prevLat=null, _prevLng=null;
         _walkNavWatchId = navigator.geolocation.watchPosition(pos => {
           const la=pos.coords.latitude, lo=pos.coords.longitude;
           const acc = pos.coords.accuracy;

           // 첫 위치: 정확도 관계없이 무조건 마커 표시 + 지도 이동
           const isFirst = _prevLat === null;
           if (!isFirst) {
             // 이전 포인트와 3m 미만이면 무시 (GPS 미세 떨림)
             if (_hav(_prevLat,_prevLng,la,lo) < 3) return;
           }
           _prevLat=la; _prevLng=lo;
           const latlng=[la,lo];
           _hideBanner();

           // 마커는 항상 표시 (정확도 무관)
           if (_walkLiveMarker) _moveMarkerSmooth(_walkLiveMarker, latlng);
           else _walkLiveMarker = L.marker(latlng,{icon:_iconWalker(true, _myPhoto, _myName)}).addTo(_walkRouteMap);
           _walkRouteMap?.setView(latlng,_walkRouteMap.getZoom()>=16?_walkRouteMap.getZoom():17,{animate:true,duration:.4});

           // 경로 폴리라인: 정확도 150m 이내만 기록
           if (acc <= 150) {
             _walkRoutePoints.push(latlng);
             if (!_walkPolyline) {
               _walkPolyline = L.polyline([latlng],{color:'#F59E0B',weight:5,opacity:.9}).addTo(_walkRouteMap);
             } else {
               _walkPolyline.addLatLng(latlng);
             }
             _updateRouteStatsDelta();
           }
         }, err => {
           // GPS 에러 시 배너 유지
           _showBanner('📡 GPS 신호를 기다리는 중…');
         }, {enableHighAccuracy:true,timeout:15000,maximumAge:0});
       }
     }
   }

 // ════════════════════════════════════════════════════════
 // 요청자 뷰
 // ════════════════════════════════════════════════════════
 } else {
   // 내 위치 (요청자 사진 마커) - GPS 성공 시에만 표시
   const myMarker = _hasGps ? L.marker([myLat,myLng],{icon:_iconMe(_myPhoto,_myName)}).bindPopup('내 위치').addTo(_walkRouteMap) : null;

   let walkerMarker = null;
   const _updateWalkerMarker = (lat,lng,panTo=true) => {
     if (!_walkRouteMap) return;
     if (!walkerMarker) {
       walkerMarker = L.marker([lat,lng],{icon:_iconWalker(true,_partnerPhoto,'도우미')}).bindPopup('도우미').addTo(_walkRouteMap);
     } else {
       _moveMarkerSmooth(walkerMarker, [lat,lng]);
     }
     if (!panTo) return;
     if (!_hasGps) {
       _walkRouteMap.setView([lat,lng],16,{animate:true,duration:.4});
       return;
     }
     const dist = _hav(myLat,myLng,lat,lng);
     if (dist > 300) {
       // 멀 때: 두 마커 모두 보이게 (최대 zoom 17)
       _walkRouteMap.fitBounds([[myLat,myLng],[lat,lng]],{padding:[55,55],maxZoom:17,animate:true});
     } else {
       // 가까울 때: 도우미 중심, zoom 17
       _walkRouteMap.setView([lat,lng],17,{animate:true,duration:.4});
     }
   };

   // ── 단계 1/2: 이동 중 / 도착 / 인계 (도우미 위치 추적) ──
   if (sessionStatus==='heading' || sessionStatus==='arrived' || sessionStatus==='handoff') {
     if (_hasGps) _walkRouteMap.setView([myLat,myLng],15);
     else if (pickupLat) _walkRouteMap.setView([pickupLat,pickupLng],15);
     _showBanner('🐾 도우미가 오고 있어요');

     const _fetchWalkerPos = async () => {
       if (!requestId) return;
       try {
         const d = await (await fetch(`/api/walk-requests/${requestId}/walker-location`)).json();
         if (d.lat && d.lng) _updateWalkerMarker(d.lat, d.lng);
       } catch(e) {}
     };
     _fetchWalkerPos();
     _walkSessionPollTimer = setInterval(_fetchWalkerPos, 3000);

     RealtimeService.on('walker-location-update', d => {
       if (d.lat && d.lng) { _updateWalkerMarker(d.lat, d.lng); }
     });

   // ── 단계 3: 산책 중 / 완료 (도우미 동선 실시간 확인) ──
   } else if (sessionStatus==='walking' || sessionStatus==='completed') {
     _hideBanner();

     // 저장된 경로 로드
     let lastPt = null;
     try {
       const d = await (await fetch(`/api/walk-sessions/${sessionId}/route`)).json();
       if (d.points?.length > 0) {
         _walkRoutePoints = d.points.map(p=>[p.latitude,p.longitude]);
         _walkPolyline = L.polyline(_walkRoutePoints,{color:'#F59E0B',weight:5,opacity:.9}).addTo(_walkRouteMap);
         lastPt = _walkRoutePoints[_walkRoutePoints.length-1];
         walkerMarker = L.marker(lastPt,{icon:_iconWalker(sessionStatus==='walking')}).addTo(_walkRouteMap);
         _updateRouteStats(d.points.length, d.totalDistanceKm);
         if (sessionStatus==='completed') {
           _walkRouteMap.fitBounds(_walkPolyline.getBounds(),{padding:[50,50],maxZoom:17});
         } else {
           _walkRouteMap.setView(lastPt,16);
         }
       }
     } catch(e) {}

     if (!lastPt) { if (_hasGps) _walkRouteMap.setView([myLat,myLng],15); }

     if (sessionStatus==='walking') {
       // 폴링 (소켓 보조)
       _walkSessionPollTimer = setInterval(async () => {
         if (!requestId) return;
         try {
           const d = await (await fetch(`/api/walk-requests/${requestId}/walker-location`)).json();
           if (d.lat&&d.lng && walkerMarker) _moveMarkerSmooth(walkerMarker, [d.lat,d.lng]);
         } catch(e) {}
       }, 5000);

       // walker-position: 경로 실시간 연장
       _walkPositionHandler = data => {
         if (data.sessionId !== sessionId) return;
         const latlng=[data.latitude,data.longitude];
         _walkRoutePoints.push(latlng);
         if (!_walkPolyline) {
           _walkPolyline = L.polyline([latlng],{color:'#F59E0B',weight:5,opacity:.9}).addTo(_walkRouteMap);
         } else {
           _walkPolyline.addLatLng(latlng);
         }
         if (walkerMarker) _moveMarkerSmooth(walkerMarker, latlng);
         else walkerMarker = L.marker(latlng,{icon:_iconWalker(true)}).addTo(_walkRouteMap);
         // 도우미 따라가기 (zoom 유지, 너무 넓어지지 않도록 setView)
         _walkRouteMap?.setView(latlng,_walkRouteMap.getZoom()>10?_walkRouteMap.getZoom():16,{animate:true,duration:.4});
         _updateRouteStatsDelta();
       };
       RealtimeService.on('walker-position', _walkPositionHandler);
     }
   }
 }
} // end requester walking block
} // end _initWalkSessionMap

function _updateRouteStats(pointCount, distKm) {
 const pcEl = document.getElementById('route-point-count');
 const distEl = document.getElementById('route-distance');
 if (pcEl) pcEl.textContent = pointCount;
 if (distEl && distKm !== null) distEl.textContent = distKm.toFixed(2);
 _updatePaceDisplay(distKm);
}

function _updateRouteStatsDelta() {
 if (_walkRoutePoints.length < 2) return;
 const distEl = document.getElementById('route-distance');
 if (!distEl) return;
 const pts = _walkRoutePoints;
 const [la1,lo1] = pts[pts.length-2];
 const [la2,lo2] = pts[pts.length-1];
 const R=6371000,r=Math.PI/180,dLa=(la2-la1)*r,dLo=(lo2-lo1)*r;
 const a=Math.sin(dLa/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLo/2)**2;
 const addM = R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
 const newKm = (parseFloat(distEl.textContent)||0) + addM/1000;
 distEl.textContent = newKm.toFixed(2);
 _updatePaceDisplay(newKm);
}

function _updatePaceDisplay(distKm) {
 const paceEl = document.getElementById('route-pace');
 if (!paceEl || !distKm || distKm <= 0 || !_walkStartMs) return;
 const elapsedHr = (Date.now() - _walkStartMs) / 3600000;
 if (elapsedHr <= 0) return;
 const kmh = distKm / elapsedHr;
 paceEl.textContent = kmh.toFixed(1) + ' km/h';
}

function _startElapsedTimer(startedAt) {
 if (_walkElapsedTimer) clearInterval(_walkElapsedTimer);
 const startMs = startedAt ? new Date(startedAt).getTime() : Date.now();
 const tick = () => {
   const el = document.getElementById('route-elapsed');
   if (!el) { clearInterval(_walkElapsedTimer); return; }
   const s = Math.floor((Date.now() - startMs) / 1000);
   const mm = String(Math.floor(s / 60)).padStart(2, '0');
   const ss = String(s % 60).padStart(2, '0');
   el.textContent = `${mm}:${ss}`;
 };
 tick();
 _walkElapsedTimer = setInterval(tick, 1000);
}

function updateLiveWalkerMarker(lat, lng) {
 if (!_walkRouteMap) return;
 const latlng = [lat, lng];
 if (_walkLiveMarker) _moveMarkerSmooth(_walkLiveMarker, latlng);
}

function stopWalkRouteWatcher() {
 if (_walkPositionHandler) {
 RealtimeService.off('walker-position', _walkPositionHandler);
 _walkPositionHandler = null;
 }
 if (_walkNavWatchId !== null) {
   navigator.geolocation.clearWatch(_walkNavWatchId);
   _walkNavWatchId = null;
 }
 if (_walkSessionPollTimer) {
   clearInterval(_walkSessionPollTimer);
   _walkSessionPollTimer = null;
 }
 if (_walkElapsedTimer) {
   clearInterval(_walkElapsedTimer);
   _walkElapsedTimer = null;
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
 ${icon('navigation',13)} 도우미 찾기
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
 const notes = document.getElementById('bc-notes')?.value?.trim();
 const dogs = user.dogs || [];
 const dog = dogs[parseInt(dogSel?.value)] || null;

 if (!dog) {
 showToast('반려견을 먼저 프로필에서 등록해주세요.', 'error');
 return;
 }

 document.getElementById('broadcast-modal')?.remove();

 // 결제 확인
 window._pendingPaymentWalkerId = null;
 window._pendingPaymentType = 'broadcast';
 try {
 await showPaymentConfirmModal({ dogSize: dog.size || 'small', dogName: dog.name, duration: 40 });
 } catch(e) {
 if (e === 'cancelled') showToast('결제가 취소되었어요.', 'info');
 return;
 }

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

let _broadcastRequestId = null;
let _broadcastTimer = null;

function showBroadcastWaitingScreen(requestId, sentCount) {
 showWalkerWaitingOverlay(requestId, sentCount);
}

/** 도우미 응답 대기 블러 오버레이 (브로드캐스트 + 직접 요청 공용) */
function showWalkerWaitingOverlay(requestId, sentCount) {
 // 기존 타이머 + 오버레이 반드시 정리 (중복 방지)
 if (_broadcastTimer) { clearInterval(_broadcastTimer); _broadcastTimer = null; }
 document.getElementById('broadcast-waiting')?.remove();

 const el = document.createElement('div');
 el.id = 'broadcast-waiting';
 el.style.cssText = [
   'position:fixed;inset:0;z-index:8500',
   'background:rgba(0,0,0,0.45)',
   'backdrop-filter:blur(12px)',
   '-webkit-backdrop-filter:blur(12px)',
   'display:flex;flex-direction:column;align-items:center;justify-content:center',
   'padding:32px;animation:ltFadeIn 0.4s ease'
 ].join(';');

 el.innerHTML = `
 <style>
   @keyframes pawBounce {
     0%,100%{transform:translateY(0) scale(1);opacity:1}
     40%{transform:translateY(-14px) scale(1.12);opacity:0.9}
   }
   @keyframes dot1{0%,80%,100%{opacity:0.2}40%{opacity:1}}
   @keyframes dot2{0%,20%,80%,100%{opacity:0.2}60%{opacity:1}}
   @keyframes dot3{0%,40%,80%,100%{opacity:0.2}80%{opacity:1}}
 </style>

 <div style="background:rgba(255,255,255,0.97);border-radius:28px;padding:40px 32px;max-width:340px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.22);">

   <!-- 발바닥 애니메이션 -->
   <div style="font-size:3.2rem;margin-bottom:20px;display:inline-block;animation:pawBounce 1.6s ease-in-out infinite;">🐾</div>

   <h2 style="font-size:1.25rem;font-weight:800;color:#1a1a1a;margin-bottom:10px;line-height:1.4;">
     조금만 기다려주세요!
   </h2>
   <p style="font-size:0.9rem;color:#4A5568;margin-bottom:6px;font-weight:600;">
     도우미분의 응답을 기다리고 있어요
   </p>
   <p style="font-size:0.8rem;color:#A0AEC0;margin-bottom:20px;">
     ${sentCount > 0 ? `주변 <b style="color:#00AA76">${sentCount}명</b>의 도우미에게 알림이 전달됐어요` : '근처 도우미들이 알림을 확인하면 연결돼요'}
   </p>

   <!-- 로딩 점 -->
   <div style="display:flex;justify-content:center;gap:8px;margin-bottom:24px;">
     <span style="width:10px;height:10px;background:#00AA76;border-radius:50%;animation:dot1 1.4s ease infinite;"></span>
     <span style="width:10px;height:10px;background:#00AA76;border-radius:50%;animation:dot2 1.4s ease infinite;"></span>
     <span style="width:10px;height:10px;background:#00AA76;border-radius:50%;animation:dot3 1.4s ease infinite;"></span>
   </div>

   <!-- 타이머 -->
   <div style="font-size:0.8rem;color:#A0AEC0;margin-bottom:6px;">요청 만료까지</div>
   <div style="font-size:2rem;font-weight:800;color:#00AA76;margin-bottom:16px;" id="bw-timer">5:00</div>
   <div style="width:100%;height:5px;background:#f0f0ee;border-radius:3px;overflow:hidden;margin-bottom:24px;">
     <div id="bw-progress" style="height:100%;background:linear-gradient(90deg,#00AA76,#34D399);border-radius:3px;width:100%;transition:width 1s linear;"></div>
   </div>

   <button onclick="cancelBroadcastRequest('${requestId}')"
     style="width:100%;padding:12px;background:none;border:1.5px solid #e0e0e0;border-radius:999px;color:#A0AEC0;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;"
     onmouseover="this.style.borderColor='#b91c1c';this.style.color='#b91c1c'"
     onmouseout="this.style.borderColor='#e0e0e0';this.style.color='#A0AEC0'">
     요청 취소
   </button>
 </div>`;

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

// ============================================================
// 실시간 채팅 (요청자 ↔ 도우미)
// ============================================================

let _chatRequestId = null;
let _chatUnread = 0;

function showChatButton(requestId) {
  if (!requestId) return;
  _chatRequestId = requestId;
  document.getElementById('chat-float-btn')?.remove();
  const btn = document.createElement('button');
  btn.id = 'chat-float-btn';
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:8900;width:52px;height:52px;border-radius:50%;background:#1a1a1a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:transform 0.15s;';
  btn.innerHTML = `${icon('message-circle',22,'#fff')}<span id="chat-badge" style="display:none;position:absolute;top:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:#FF385C;color:#fff;font-size:0.65rem;font-weight:800;align-items:center;justify-content:center;">0</span>`;
  btn.onmouseover = () => { btn.style.transform = 'scale(1.08)'; };
  btn.onmouseout  = () => { btn.style.transform = 'scale(1)'; };
  btn.onclick = () => openChatModal(requestId);
  document.body.appendChild(btn);

  // 새 메시지 소켓 수신
  RealtimeService.on('walk-chat-message', (msg) => {
    if (msg.requestId !== requestId) return;
    const modal = document.getElementById('chat-modal');
    if (modal) {
      appendChatMessage(msg, AuthService.getCurrentUser()?.id);
    } else {
      _chatUnread++;
      const badge = document.getElementById('chat-badge');
      if (badge) { badge.style.display = 'flex'; badge.textContent = _chatUnread; }
    }
  });
}

function hideChatButton() {
  document.getElementById('chat-float-btn')?.remove();
  document.getElementById('chat-modal')?.remove();
  _chatRequestId = null;
}

async function openChatModal(requestId) {
  _chatUnread = 0;
  const badge = document.getElementById('chat-badge');
  if (badge) badge.style.display = 'none';

  document.getElementById('chat-modal')?.remove();
  const user = AuthService.getCurrentUser();
  const modal = document.createElement('div');
  modal.id = 'chat-modal';
  modal.style.cssText = 'position:fixed;bottom:88px;right:16px;z-index:8900;width:320px;max-width:calc(100vw - 32px);height:440px;background:#fff;border-radius:20px;box-shadow:0 8px 40px rgba(0,0,0,0.18);display:flex;flex-direction:column;animation:slideUp 0.25s ease;';

  modal.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid #f0f0ee;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <div style="font-size:0.9rem;font-weight:700;">${(() => { const profile = user ? MatchingService.getMyProfile(user.id) : null; return profile?.role === 'walker' ? '요청자와 채팅' : '도우미와 채팅'; })()}</div>
      <button onclick="document.getElementById('chat-modal').remove()" style="background:none;border:none;cursor:pointer;color:#aaa;font-size:1.2rem;line-height:1;">×</button>
    </div>
    <div id="chat-messages" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;">
      <div style="text-align:center;font-size:0.75rem;color:#ccc;padding:8px 0;">산책 관련 소통은 여기서 하세요</div>
    </div>
    <div style="padding:10px;border-top:1px solid #f0f0ee;display:flex;gap:8px;flex-shrink:0;">
      <input id="chat-input" type="text" placeholder="메시지 입력..." maxlength="200"
        style="flex:1;border:1.5px solid #e0e0e0;border-radius:10px;padding:8px 12px;font-size:0.85rem;outline:none;"
        onkeydown="if(event.key==='Enter')sendChatMessage()">
      <button onclick="sendChatMessage()" style="padding:8px 14px;background:#1a1a1a;color:#fff;border:none;border-radius:10px;font-size:0.82rem;font-weight:700;cursor:pointer;">전송</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 기존 메시지 로드
  try {
    const res = await fetch(`/api/walk-chat/${requestId}`);
    const data = await res.json();
    (data.messages || []).forEach(m => appendChatMessage(m, user?.id));
  } catch(e) {}

  document.getElementById('chat-input')?.focus();
  const msgEl = document.getElementById('chat-messages');
  if (msgEl) msgEl.scrollTop = msgEl.scrollHeight;
}

function appendChatMessage(msg, myId) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const isMe = msg.senderId === myId;
  const div = document.createElement('div');
  div.style.cssText = `display:flex;flex-direction:column;align-items:${isMe ? 'flex-end' : 'flex-start'};`;
  div.innerHTML = `
    ${!isMe ? `<span style="font-size:0.7rem;color:#aaa;margin-bottom:2px;">${msg.senderName}</span>` : ''}
    <div style="max-width:75%;padding:8px 12px;border-radius:${isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};background:${isMe ? '#1a1a1a' : '#f0f0ee'};color:${isMe ? '#fff' : '#1a1a1a'};font-size:0.85rem;line-height:1.4;">
      ${msg.content}
    </div>
    <span style="font-size:0.65rem;color:#ccc;margin-top:2px;">${new Date(msg.createdAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const user = AuthService.getCurrentUser();
  const input = document.getElementById('chat-input');
  const content = input?.value?.trim();
  if (!user || !content || !_chatRequestId) return;
  input.value = '';

  const msg = {
    requestId:   _chatRequestId,
    senderId:    user.id,
    senderName:  user.nickname || user.name,
    content,
    createdAt:   new Date().toISOString()
  };
  // 즉시 UI에 표시
  appendChatMessage(msg, user.id);

  try {
    await fetch(`/api/walk-chat/${_chatRequestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
  } catch(e) { showToast('메시지 전송 실패', 'error'); }
}

function showBroadcastMatchedScreen(data) {
 document.getElementById('broadcast-matched-screen')?.remove();
 const el = document.createElement('div');
 el.id = 'broadcast-matched-screen';
 el.style.cssText = 'position:fixed;inset:0;z-index:8500;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;animation:ltFadeIn 0.3s ease;';
 el.innerHTML = `
 <div style="width:80px;height:80px;border-radius:50%;background:#00AA76;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;margin-bottom:20px;">?</div>
 <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:8px;text-align:center;">매칭 완료!</h2>
 <p style="font-size:0.95rem;color:#444;text-align:center;margin-bottom:6px;"><b>${data.walkerName}</b>님이 수락했어요</p>
 <p style="font-size:0.82rem;color:#718096;text-align:center;margin-bottom:32px;">도우미가 픽업하러 이동 중이에요 </p>
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
 <button onclick="acceptBroadcast('${data.requestId}')" style="flex:2;padding:13px;background:#1a1a1a;color:#fff;border:none;border-radius:12px;font-weight:800;font-size:0.95rem;cursor:pointer;">수락하기 ?</button>
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
 showToast('수락했어요! 요청자에게 이동 중이에요.', 'success');
 showChatButton(requestId);
 window._activeWalkRequestId = requestId;

 // 수락 즉시 도우미 위치를 요청자에게 전송 시작
 _startWalkerLocationSharing(requestId);

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
 <button onclick="document.getElementById('live-tracking-overlay').remove();renderMatchingPage();" style="background:#f5f5f5;border:none;border-radius:8px;padding:8px 14px;font-size:0.8rem;font-weight:600;cursor:pointer;">최소화</button>
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
 산책이 완료되었습니다! 잠시 후 화면이 닫힙니다.
 </div>
 `;

 document.body.appendChild(overlay);

 // 지도 초기화
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
 html: `<div style="width:40px;height:40px;border-radius:50%;background:#00AA76;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:1.1rem;"></div>`,
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
 const statusLabel = { pending: '? 대기 중', accepted: '이동 중', walking: '산책 중' };
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
 <button class="btn btn-primary" style="flex:2;padding:13px;" onclick="arriveAtPickup('${_activeSessionId||r.sessionId||''}')">
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
 <div style="font-size:0.8rem;color:#4A5568;margin-bottom:12px;">반려견을 인계받으면 산책을 시작해주세요.</div>
 <button class="btn btn-primary" style="width:100%;padding:13px;background:#00AA76;" onclick="startActualWalk('${_activeSessionId||r.sessionId||''}')">
 산책 시작
 </button>
 </div>
 ` : ''}
 ${r.status === 'walking' ? `
 <div style="display:flex;gap:8px;">
 <button class="btn btn-primary btn-sm" style="flex:1;" onclick="Router.navigate('/walk-session')">트래킹 보기</button>
 <button class="btn btn-danger btn-sm" onclick="endWalkSession('${_activeSessionId||''}')">산책 종료</button>
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
 const icon = L.divIcon({ html: '<div style="background:#e53e3e;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:1rem;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>', className: '', iconSize: [32,32], iconAnchor: [16,16] });
 L.marker([r.pickupLatitude, r.pickupLongitude], { icon }).bindPopup(`<b>${r.requesterName}</b><br>요청자 위치`).openPopup().addTo(map);
 });
}

function openNavMap(lat, lng) {
 window.open(`https://map.kakao.com/link/to/요청자위치,${lat},${lng}`, '_blank');
}

function openNavMapNaver(lat, lng) {
 window.open(`https://map.naver.com/v5/directions/-/-/-/walk?c=${lng},${lat},15,0,0,0,dh`, '_blank');
}

/** 산책 경로 모달 표시 */
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

 // 경로 데이터 로드
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

   // 시작/끝 마커
   const startIcon = L.divIcon({ html: '<div style="width:14px;height:14px;background:#3B82F6;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(59,130,246,0.5);"></div>', className: '', iconSize: [14,14], iconAnchor: [7,7] });
   const endIcon = L.divIcon({ html: '<div style="width:14px;height:14px;background:#EF4444;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(239,68,68,0.5);"></div>', className: '', iconSize: [14,14], iconAnchor: [7,7] });
   L.marker(points[0], { icon: startIcon }).bindPopup('출발').addTo(map);
   if (points.length > 1) {
     L.marker(points[points.length - 1], { icon: endIcon }).bindPopup('도착').addTo(map);
   }

   // 경로 폴리라인 (주황색)
   if (points.length >= 2) {
     const polyline = L.polyline(points, { color: '#F59E0B', weight: 5, opacity: 0.85 }).addTo(map);
     map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 17 });
   } else {
     // 포인트 1개: 마커만 표시
     map.setView(points[0], 16);
     const statsEl2 = document.getElementById('walk-route-modal-stats');
     if (statsEl2) {
       statsEl2.innerHTML = '<div style="text-align:center;color:#94A3B8;font-size:0.82rem;padding:6px 0;">이동 경로가 기록되지 않았어요.<br><span style="font-size:0.75rem;">고정 위치 테스트이거나 GPS 신호가 약했어요.</span></div>';
       return;
     }
   }

   // 통계
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

/**
 * 직접 요청 산책 기록 렌더링
 * @param {string} userId
 * @param {'walker'|'requester'} role
 * @returns {Promise<{html: string, hasRecords: boolean}>}
 */
async function renderDirectWalkHistory(userId, role) {
 const STATUS_LABEL = {
 accepted: '수락됨',
 walking: '산책 중',
 completed:'완료됨'
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

 // 세션 데이터 (거리 표시용) ? 실패해도 괜찮음
 let sessions = [];
 try {
 const res = await fetch(`/api/walk-sessions?userId=${userId}`);
 const data = await res.json();
 sessions = data.sessions || [];
 } catch (e) { /* 거리 정보 없이 표시 */ }

 const html = requests.map(r => {
 const partnerName = role === 'walker' ? (r.requesterName || r.requesterId) : (r.walkerName || r.walkerId);
 const session = sessions.find(s => s.requestId === r.id);
 const distText = session && session.totalDistanceKm != null ? `${session.totalDistanceKm} km` : '';
 const dateText = new Date(r.updatedAt || r.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
 const startFmt = r.requestedStartTime
 ? new Date(r.requestedStartTime).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
 : '시간 미정';
 const sessionId = session?.id || '';
 const hasRoute = session && session.totalDistanceKm != null;

 return `
 <div class="match-walk-card ${r.status === 'completed' ? 'match-walk-card--completed' : ''}" style="cursor:${hasRoute ? 'pointer' : 'default'};transition:background 0.15s;" ${hasRoute ? `onclick="showWalkRouteModal('${sessionId}','${partnerName}','${distText}','${dateText}')"` : ''}>
 <div class="match-walk-card__avatar">${partnerName.charAt(0)}</div>
 <div class="match-walk-card__info" style="flex:1;">
 <div class="match-walk-card__name">${partnerName}</div>
 <div style="font-size:0.82rem;color:#718096;margin-top:2px;">
 ${r.dogName || '-'} · ${startFmt}
 </div>
 <div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap;">
 <span class="badge ${r.status === 'completed' ? 'badge-success' : 'badge-info'}">${STATUS_LABEL[r.status] || r.status}</span>
 ${distText ? `<span style="font-size:0.82rem;color:#4A5568;">📍 ${distText}</span>` : ''}
 <span style="font-size:0.78rem;color:#A0AEC0;">${dateText}</span>
 ${hasRoute ? `<span style="font-size:0.72rem;color:#00AA76;font-weight:600;">경로 보기 →</span>` : ''}
 </div>
 </div>
 </div>`;
 }).join('');

 return { html, hasRecords: true };
}

// ============================================================
// 알림 시스템
// ============================================================


let _notifications = [];

function getNotifications() {
  const user = AuthService.getCurrentUser();
  if (!user) return [];
  const stored = localStorage.getItem('pawsitive_notifications_' + user.id);
  if (stored) {
    try { _notifications = JSON.parse(stored); } catch(e) { _notifications = []; }
  }
  return _notifications;
}

function saveNotifications() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  localStorage.setItem('pawsitive_notifications_' + user.id, JSON.stringify(_notifications));
}

function addNotification(message, type = 'info') {
  _notifications.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  });
  if (_notifications.length > 50) _notifications = _notifications.slice(0, 50);
  saveNotifications();
  updateBellBadge();
}

function updateBellBadge() {
  const badge = document.getElementById('nav-bell-badge');
  if (!badge) return;
  const unread = _notifications.filter(n => !n.read).length;
  if (unread > 0) {
    badge.textContent = unread > 99 ? '99+' : unread;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function toggleNotificationPanel() {
  let panel = document.getElementById('notification-panel');
  if (panel) {
    panel.remove();
    return;
  }

  getNotifications();

  const html = _notifications.length === 0
    ? '<div style="padding:32px 16px;text-align:center;color:var(--color-text-muted);font-size:0.85rem;">알림이 없어요</div>'
    : _notifications.map(n => `
      <div class="notif-item ${n.read ? '' : 'notif-item--unread'}" onclick="markNotifRead('${n.id}')">
        <div class="notif-item__dot" style="background:${n.read ? 'transparent' : '#FF6B35'};"></div>
        <div class="notif-item__content">
          <div class="notif-item__msg">${n.message}</div>
          <div class="notif-item__time">${formatRelativeTime(n.createdAt)}</div>
        </div>
      </div>
    `).join('');

  const panelHtml = `
    <div id="notification-panel" class="notification-panel">
      <div class="notification-panel__header">
        <span style="font-weight:800;font-size:1rem;">알림</span>
        <button onclick="clearAllNotifications()" style="background:none;border:none;color:var(--color-text-muted);font-size:0.78rem;cursor:pointer;">모두 읽음</button>
      </div>
      <div class="notification-panel__list">${html}</div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', panelHtml);

  setTimeout(() => {
    document.addEventListener('click', closeNotifPanelOutside);
  }, 100);
}

function closeNotifPanelOutside(e) {
  const panel = document.getElementById('notification-panel');
  const bellBtn = document.querySelector('.nav-bell-btn');
  if (panel && !panel.contains(e.target) && !bellBtn?.contains(e.target)) {
    panel.remove();
    document.removeEventListener('click', closeNotifPanelOutside);
  }
}

function markNotifRead(id) {
  const n = _notifications.find(x => x.id === id);
  if (n) { n.read = true; saveNotifications(); updateBellBadge(); }
  const panel = document.getElementById('notification-panel');
  if (panel) { panel.remove(); toggleNotificationPanel(); }
}

function clearAllNotifications() {
  _notifications.forEach(n => n.read = true);
  saveNotifications();
  updateBellBadge();
  const panel = document.getElementById('notification-panel');
  if (panel) { panel.remove(); toggleNotificationPanel(); }
}
