// ============================================================
// Socket.IO 실시간 이벤트 핸들러 초기화
// ============================================================

function initRealtimeListeners() {
  const user = AuthService.getCurrentUser();
  if (user && typeof RealtimeService !== 'undefined') {
    RealtimeService.connect(user.id);
  }

  if (typeof RealtimeService === 'undefined') return;

  RealtimeService.on('user-notification', (data) => {
    receiveNotification(data?.notification || data);
  });

  // 산책 요청 수신 (도우미용)
  RealtimeService.on('walk-request', (data) => {
    showWalkRequestNotification(data);
    addNotification('새 산책 요청이 도착했어요!', 'walk', {
      category: 'matching',
      targetRoute: '/matching',
      requestId: data?.requestId || data?.id
    });
  });

  // 요청 수락됨 (요청자용)
  RealtimeService.on('walk-request-accepted', (data) => {
    showWalkerAcceptedModal(data);
    addNotification(`${data.walkerName || '도우미'}님이 산책 요청을 수락했습니다!`, 'success', {
      category: 'matching',
      targetRoute: '/matching',
      requestId: data?.requestId || data?.id
    });
  });

  // 요청 거절됨 (요청자용)
  RealtimeService.on('walk-request-rejected', () => {
    showToast('산책 도우미가 요청을 거절했습니다.', 'error');
    addNotification('산책 도우미가 요청을 거절했습니다.', 'error', {
      category: 'matching',
      targetRoute: '/matching'
    });
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
    addNotification('도우미가 이동을 시작했어요!', 'walk', {
      category: 'matching',
      targetRoute: '/walk-session',
      sessionId: data?.sessionId,
      requestId: data?.requestId
    });
  });

  // 2단계: 도우미 도착
  RealtimeService.on('walker-arrived', (data) => {
    showToast('도우미가 도착했습니다! 반려견을 전달해주세요.', 'success');
    addNotification('도우미가 도착했습니다! 반려견을 전달해주세요.', 'success', {
      category: 'matching',
      targetRoute: '/walk-session',
      sessionId: data?.sessionId,
      requestId: data?.requestId
    });
    refreshRequesterMatchingPage();
  });

  // 3단계: 산책 실제 시작
  RealtimeService.on('walk-tracking-started', (data) => {
    showToast('산책이 시작되었어요! 실시간 경로를 확인하세요.', 'success');
    addNotification('산책이 시작됐어요! 실시간 경로를 확인하세요.', 'walk', {
      category: 'matching',
      targetRoute: '/walk-session',
      sessionId: data?.sessionId,
      requestId: data?.requestId
    });
    refreshRequesterMatchingPage();
  });

  RealtimeService.on('handoff-confirmed', (data) => {
    showToast('반려견 전달이 확인됐어요. 산책이 시작됩니다.', 'success');
    refreshWalkerActivePage(data?.sessionId);
  });

  RealtimeService.on('walker-returning', () => {
    refreshRequesterMatchingPage();
  });

  RealtimeService.on('walker-returned', () => {
    refreshRequesterMatchingPage();
  });

  RealtimeService.on('return-handoff-updated', (data) => {
    refreshRequesterMatchingPage();
    refreshWalkerActivePage(data?.sessionId);
  });

  // 4단계: 산책 종료
  RealtimeService.on('walk-ended', (data) => {
    stopWalkRouteWatcher();
    hideChatButton();
    _pushNotify('🐾 산책 완료!', `총 ${data.totalDistanceKm ?? 0} km 산책했어요. 리뷰를 남겨보세요.`, '/#/walk-session');
    document.getElementById('live-tracking-overlay')?.remove();
    _activeSessionId = data.sessionId;
    Router.navigate('/walk-session');
    const curUser = AuthService.getCurrentUser();
    setTimeout(() => {
      if (typeof renderWalkSessionPage === 'function') renderWalkSessionPage(data.sessionId);
    }, 120);
    if (curUser && data.requesterId === curUser.id) {
      setTimeout(() => showRequesterReviewPrompt(data.sessionId, data.walkerId, data.totalDistanceKm), 400);
    }
    showToast(`🎉 산책 완료! 총 ${data.totalDistanceKm ?? 0}km`, 'success');
    addNotification(`산책이 완료됐어요! 총 ${data.totalDistanceKm ?? 0}km`, 'success', {
      category: 'matching',
      targetRoute: '/walk-session',
      sessionId: data?.sessionId,
      requestId: data?.requestId
    });
  });

  // 도우미 상태/위치 변경 → 탐색 지도 자동 갱신
  function refreshDiscoveryMap() {
    if (document.getElementById('dw-disc-map') && typeof loadDWDiscovery === 'function') {
      clearTimeout(window._dwDiscoveryRefreshTimer);
      window._dwDiscoveryRefreshTimer = setTimeout(() => loadDWDiscovery(), 300);
    }
  }
  RealtimeService.on('walker-status-changed', refreshDiscoveryMap);
  RealtimeService.on('walker-location-updated', refreshDiscoveryMap);

  // 도우미: 브로드캐스트 요청 수신 → 알림 팝업
  RealtimeService.on('broadcast-walk-request', (data) => {
    showBroadcastNotification(data);
    addNotification('새 브로드캐스트 산책 요청이 도착했어요!', 'walk', {
      category: 'matching',
      targetRoute: '/matching',
      requestId: data?.requestId || data?.id
    });
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
    addNotification(`${data.walkerName}님이 산책을 수락했어요!`, 'success', {
      category: 'matching',
      targetRoute: '/matching',
      requestId: data?.requestId || data?.id
    });
    showBroadcastMatchedScreen(data);
  });

  // 관리자 공지사항 수신
  RealtimeService.on('admin-notice', (data) => {
    addNotification('[공지] ' + (data.text || '새 공지사항이 등록됐어요'), 'notice', {
      category: 'notice',
      source: 'admin',
      targetRoute: '/admin',
      noticeText: data?.text || '새 공지사항이 등록됐어요'
    });
    showToast('새 공지사항이 등록됐어요!', 'info');
  });

  // 전문가 등록 심사 결과
  RealtimeService.on('expert-application-reviewed', (data) => {
    const approved = data?.application?.status === 'approved';
    addNotification(approved ? '전문가 등록 심사가 승인됐어요!' : '전문가 등록 심사가 반려됐어요.', approved ? 'success' : 'error', {
      category: 'matching',
      targetRoute: '/experts'
    });
    showToast(approved ? '전문가 등록이 승인됐어요.' : '전문가 등록이 반려됐어요.', approved ? 'success' : 'error');
    if (Router.getPath && Router.getPath() === '/experts' && typeof renderExpertsPage === 'function') {
      renderExpertsPage();
    }
  });

  // 전문가 계정: 새 상담 요청 수신
  RealtimeService.on('expert-consultation-requested', (data) => {
    const c = data?.consultation || {};
    addNotification(`${c.requesterName || '보호자'}님이 ${c.categoryLabel || '전문가'} 상담을 신청했어요.`, 'expert', {
      category: 'matching',
      targetRoute: '/experts'
    });
    showToast('새 전문가 상담 요청이 도착했어요.', 'success');
    if (Router.getPath && Router.getPath() === '/experts' && typeof renderExpertsPage === 'function') {
      renderExpertsPage();
    }
  });

  RealtimeService.on('expert-consultation-updated', (data) => {
    if (Router.getPath && Router.getPath() === '/experts' && typeof renderExpertsPage === 'function') {
      const c = data?.consultation || {};
      if (typeof handleExpertConsultationRealtime === 'function' && handleExpertConsultationRealtime(c)) return;
      renderExpertsPage();
    }
  });

  RealtimeService.on('expert-consultation-message', (data) => {
    const c = data?.consultation || {};
    addNotification(`${c.expertName || c.requesterName || '상담방'}에서 새 메시지가 도착했어요.`, 'expert', {
      category: 'matching',
      targetRoute: '/experts'
    });
    if (Router.getPath && Router.getPath() === '/experts' && typeof renderExpertsPage === 'function') {
      if (typeof handleExpertConsultationRealtime === 'function' && handleExpertConsultationRealtime(c)) return;
      renderExpertsPage();
    }
  });
}
