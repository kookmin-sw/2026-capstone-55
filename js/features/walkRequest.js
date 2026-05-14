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
