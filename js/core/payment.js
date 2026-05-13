// ============================================================
// 산책 가격 계산 유틸 + 결제 처리
// ============================================================

const WALK_PRICING = {
  small:  10000,  // 소형견 (7kg 미만) 1회 40분
  medium: 15000,  // 중형견 (7~15kg)
  large:  20000,  // 대형견 (15kg 이상)
  platformFeeRate: 0.05  // 플랫폼 수수료 5%
};

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

function getWalkerLabel(field, value) {
  const fieldMap = WALKER_LABELS[field];
  if (!fieldMap) return '알 수 없음';
  return fieldMap[value] || '알 수 없음';
}

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

async function requestTossPayment({ amount, orderId, orderName, customerName, successHash, failHash }) {
  const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
  try {
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);
    const payment = tossPayments.payment({ customerKey: orderId });
    const successUrl = successHash
      ? window.location.origin + '/' + successHash + (successHash.includes('?') ? '&' : '?') + 'paymentSuccess=true&orderId=' + orderId
      : window.location.origin + '/#/matching?paymentSuccess=true&orderId=' + orderId;
    const failUrl = failHash
      ? window.location.origin + '/' + failHash + (failHash.includes('?') ? '&' : '?') + 'paymentFail=true'
      : window.location.origin + '/#/matching?paymentFail=true';
    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: amount },
      orderId,
      orderName,
      customerName: customerName || '요청자',
      successUrl,
      failUrl
    });
  } catch (e) {
    if (e.code === 'USER_CANCEL') {
      showToast('결제가 취소되었어요.', 'info');
    } else {
      showToast('결제 중 오류가 발생했어요: ' + (e.message || ''), 'error');
    }
    throw e;
  }
}

function showPaymentConfirmModal({ dogSize, dogName, duration = 40 }) {
  const user = AuthService.getCurrentUser();
  const dogs = user?.dogs || [];

  return new Promise((resolve, reject) => {
    const modalId = 'payment-confirm-modal-' + Date.now();
    const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' };

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
    }

    modal.querySelectorAll('.pay-dog-cb').forEach(cb => cb.addEventListener('change', updateSummary));
    modal.querySelectorAll('.pay-dur-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.pay-dur-btn').forEach(b => { b.style.background='#fff'; b.style.color='#333'; b.style.borderColor='#e2e8f0'; });
        btn.style.background = '#1a1a1a'; btn.style.color = '#fff'; btn.style.borderColor = '#1a1a1a';
        selectedDuration = parseInt(btn.dataset.dur);
        updateSummary();
      });
    });

    updateSummary();

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

      const pendingPayment = {
        orderId,
        amount: total,
        duration: selectedDuration,
        dogs: selectedDogs,
        walkerId: window._pendingPaymentWalkerId || null,
        requestType: window._pendingPaymentType || 'direct',
        timestamp: Date.now()
      };
      localStorage.setItem('pawsitive_pending_payment', JSON.stringify(pendingPayment));

      try {
        const dogNames = selectedDogs.map(d => d.name).join(', ');
        await requestTossPayment({ amount: total, orderId, orderName: `산책 서비스 (${dogNames})`, customerName: user?.name || '요청자' });
        modal.remove();
        resolve({ orderId, amount: total, duration: selectedDuration, dogs: selectedDogs });
      } catch(e) {
        localStorage.removeItem('pawsitive_pending_payment');
        modal.remove();
        reject('payment_failed');
      }
    };
  });
}
