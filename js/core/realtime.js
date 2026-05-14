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
    addNotification('새 산책 요청이 도착했어요!', 'walk');
  });

  // 요청 수락됨 (요청자용)
  RealtimeService.on('walk-request-accepted', (data) => {
    showWalkerAcceptedModal(data);
    addNotification(`${data.walkerName || '도우미'}님이 산책 요청을 수락했습니다!`, 'success');
  });

  // 요청 거절됨 (요청자용)
  RealtimeService.on('walk-request-rejected', () => {
    showToast('산책 도우미가 요청을 거절했습니다.', 'error');
    addNotification('산책 도우미가 요청을 거절했습니다.', 'error');
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
    if (window._requesterLiveMapPoll) { clearInterval(window._requesterLiveMapPoll); window._requesterLiveMapPoll = null; }
    window._activeWalkRequestId = null;
    _activeSessionId = null;
    setTimeout(() => {
      const user = AuthService.getCurrentUser();
      if (user) {
        const profile = MatchingService.getMyProfile(user.id);
        if (profile && profile.role === 'walker') renderWalkerDashboard(user, profile);
        else renderMatchingPage();
      }
    }, 500);
  });

  function refreshRequesterMatchingPage() {
    document.getElementById('live-tracking-overlay')?.remove();
    const curUser = AuthService.getCurrentUser();
    const profile = curUser ? MatchingService.getMyProfile(curUser.id) : null;
    if (profile && profile.role === 'requester') {
      renderMatchingPage();
    }
  }

  function refreshWalkerActivePage(sessionId) {
    const curUser = AuthService.getCurrentUser();
    const profile = curUser ? MatchingService.getMyProfile(curUser.id) : null;
    if (!profile || profile.role !== 'walker') return;
    if (Router.getPath && Router.getPath() === '/walk-session') {
      renderWalkSessionPage(sessionId);
    } else {
      renderWalkerDashboard(curUser, profile);
    }
  }

  // 1단계: 도우미 출발 → 요청자 매칭 화면에서 현재 세션 추적
  RealtimeService.on('walk-started', (data) => {
    _activeSessionId = data.sessionId;
    refreshRequesterMatchingPage();
    addNotification('도우미가 이동을 시작했어요!', 'walk');
  });

  // 2단계: 도우미 도착
  RealtimeService.on('walker-arrived', (data) => {
    showToast('도우미가 도착했습니다! 반려견을 전달해주세요.', 'success');
    addNotification('도우미가 도착했습니다! 반려견을 전달해주세요.', 'success');
    refreshRequesterMatchingPage();
  });

  // 3단계: 산책 실제 시작
  RealtimeService.on('walk-tracking-started', (data) => {
    showToast('산책이 시작되었어요! 실시간 경로를 확인하세요.', 'success');
    addNotification('산책이 시작됐어요! 실시간 경로를 확인하세요.', 'walk');
    refreshRequesterMatchingPage();
  });

  RealtimeService.on('handoff-confirmed', (data) => {
    showToast('반려견 인계가 확인됐어요. 산책을 시작해주세요.', 'success');
    refreshWalkerActivePage(data?.sessionId);
  });

  RealtimeService.on('walker-returning', () => {
    refreshRequesterMatchingPage();
  });

  RealtimeService.on('walker-returned', () => {
    refreshRequesterMatchingPage();
  });

  // 4단계: 산책 종료
  RealtimeService.on('walk-ended', (data) => {
    stopWalkRouteWatcher();
    hideChatButton();
    _pushNotify('🐾 산책 완료!', `총 ${data.totalDistanceKm ?? 0} km 산책했어요. 리뷰를 남겨보세요.`, '/#/walk-session');
    document.getElementById('live-tracking-overlay')?.remove();
    _activeSessionId = data.sessionId;
    Router.navigate('/walk-session');
    setTimeout(() => showRequesterReviewPrompt(data.sessionId, data.walkerId, data.totalDistanceKm), 400);
    showToast(`🎉 산책 완료! 총 ${data.totalDistanceKm ?? 0}km`, 'success');
    addNotification(`산책이 완료됐어요! 총 ${data.totalDistanceKm ?? 0}km`, 'success');
  });

  // 도우미 상태/위치 변경 → 탐색 지도 자동 갱신
  function refreshDiscoveryMap() {
    if (_dwDiscMap && _dwUserLat && _dwUserLng) {
      const radius = Number(document.getElementById('dw-radius-sel')?.value || 5);
      _renderDiscMap(_dwUserLat, _dwUserLng, radius);
    }
  }
  RealtimeService.on('walker-status-changed', refreshDiscoveryMap);
  RealtimeService.on('walker-location-updated', refreshDiscoveryMap);

  // 도우미: 브로드캐스트 요청 수신 → 알림 팝업
  RealtimeService.on('broadcast-walk-request', (data) => {
    showBroadcastNotification(data);
    addNotification('새 브로드캐스트 산책 요청이 도착했어요!', 'walk');
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
    showToast(` ${data.walkerName}님이 수락했어요! 잠시 후 출발할 거예요.`, 'success');
    addNotification(`${data.walkerName}님이 산책을 수락했어요!`, 'success');
    showBroadcastMatchedScreen(data);
  });

  // 관리자 공지사항 수신
  RealtimeService.on('admin-notice', (data) => {
    addNotification('[공지] ' + (data.text || '새 공지사항이 등록됐어요'), 'info');
    showToast('새 공지사항이 등록됐어요!', 'info');
  });
}
