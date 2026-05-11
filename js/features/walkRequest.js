// ============================================================
// 산책 요청 모달 (요청자 → 특정 도우미) + 도우미 알림 수락/거절
// ============================================================

function openWalkRequestModal(walkerId, walkerName) {
  const user = AuthService.getCurrentUser();
  if (!user) { Router.navigate('/login'); return; }

  const dogs = user.dogs || [];
  const dogOptions = dogs.length > 0
    ? dogs.map(d => `<option value="${d.id}" data-name="${d.name}" data-breed="${d.breed || ''}" data-size="${d.size || 'small'}">${d.name} (${d.breed || '견종 미등록'})</option>`).join('')
    : '<option value="">반려견을 먼저 프로필에 등록해주세요</option>';

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
  _initWalkRequestModal(user);
}

function _initWalkRequestModal(user) {
  let selDur = 40;

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
    updatePriceDisplay();
  }

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

  const units = Math.ceil(duration / 40);
  const basePrice = WALK_PRICING[dogSize] || WALK_PRICING.small;
  const totalPrice = basePrice * units;

  document.getElementById('walk-req-modal')?.remove();
  window._pendingPaymentWalkerId = walkerId;
  window._pendingPaymentType = 'map';
  try {
    await showPaymentConfirmModal({ dogSize: dogSize || 'small', dogName, duration });
  } catch(e) {
    if (e === 'cancelled') showToast('결제가 취소되었어요.', 'info');
    return;
  }

  let pickupLat = null, pickupLng = null;
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, maximumAge: 60000 });
    });
    pickupLat = pos.coords.latitude;
    pickupLng = pos.coords.longitude;
  } catch(e) {}

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

    const card = document.querySelector(`[onclick*="${requestId}"]`)?.closest('.match-request-card') ||
      document.querySelector(`button[onclick*="${requestId}"]`)?.closest('div[style*="border"]');
    if (card) {
      const actions = card.querySelector('.match-request-card__actions');
      if (actions) {
        actions.innerHTML = `<div style="background:#EBF8FF;border-radius:8px;padding:10px 12px;font-size:0.82rem;color:#2C5282;width:100%;">요청자에게 이동 중이에요! 위치로 찾아가세요.</div>`;
      }
      const badge = card.querySelector('[style*="대기"]') || card.querySelector('span[style*="F6AD55"]');
      if (badge) badge.style.cssText = badge.style.cssText.replace(/background:[^;]+/, 'background:#4299E120').replace(/color:[^;]+/, 'color:#4299E1') + '; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700;';
    }

    document.getElementById('walker-req-notif')?.remove();
    showToast(`${requesterName}님 요청 수락! 요청자에게 이동 중이에요.`, 'success');
    showChatButton(requestId);
    window._activeWalkRequestId = requestId;
    _startWalkerLocationSharing(requestId);

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
    const card = document.querySelector(`button[onclick*="${requestId}"]`)?.closest('.match-request-card') ||
      document.querySelector(`button[onclick*="${requestId}"]`)?.closest('div[style*="border"]');
    card?.remove();
    document.getElementById('walker-req-notif')?.remove();
    showToast('요청을 거절했습니다.', 'info');
  } catch(e) {
    showToast('오류가 발생했습니다.', 'error');
  }
}
