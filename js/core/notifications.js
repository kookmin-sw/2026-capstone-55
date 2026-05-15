// ============================================================
// 알림 시스템 (커뮤니티 탭 | 공지사항 탭)
// ============================================================

let _notifications = [];

function _pushNotify(title, body, url) {
  addNotification(`${title} ${body}`, 'info', 'system');
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, { body, icon: '/favicon.ico' });
    if (url) n.onclick = () => { window.focus(); window.location.hash = url; };
  }
}

function getNotifications() {
  const user = AuthService.getCurrentUser();
  if (!user) return [];
  const stored = localStorage.getItem('pawsitive_notifications_' + user.id);
  if (stored) {
    try { _notifications = JSON.parse(stored); } catch(e) { _notifications = []; }
  }
  return _notifications;
}

// 서버 저장 사용자 알림 불러오기 + 잔액 최신화 (관리자 포인트 지급/회수 등)
async function loadServerUserNotifs() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  try {
    // 1) 서버 알림 수신
    const res = await fetch(`/api/users/${user.id}/server-notifs`);
    const data = await res.json();
    if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
      data.notifications.forEach(n => {
        if (!_notifications.find(x => x.id === n.id)) _notifications.unshift(n);
      });
      if (_notifications.length > 50) _notifications = _notifications.slice(0, 50);
      saveNotifications();
      updateBellBadge();
    }

    // 2) 서버에서 최신 pawCoins 조회 후 localStorage 갱신
    const userRes = await fetch(`/api/users/${user.id}`);
    const userData = await userRes.json();
    if (userData.success && userData.user && userData.user.pawCoins !== undefined) {
      const serverBalance = userData.user.pawCoins;
      const localBalance = user.pawCoins || 0;
      const users = StorageService.get('users', []);
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) { users[idx].pawCoins = serverBalance; StorageService.set('users', users); }
      user.pawCoins = serverBalance;
      StorageService.set('currentUser', user);

      // 잔액이 달라졌을 때만 현재 페이지 재렌더
      if (localBalance !== serverBalance) {
        const hash = window.location.hash;
        if (hash === '#/profile' && typeof renderProfilePage === 'function') renderProfilePage();
        else if (hash === '#/wallet' && typeof renderWalletPage === 'function') renderWalletPage();
      }
    }
  } catch(e) {}
}

// 서버 공지사항 불러오기 (source: 'system')
async function loadServerNotices() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  try {
    const res = await fetch('/api/data/notices');
    const notices = await res.json();
    if (!Array.isArray(notices) || notices.length === 0) return;
    const readKey = 'pawsitive_read_notices_' + user.id;
    const readIds = JSON.parse(localStorage.getItem(readKey) || '[]');
    let added = false;
    notices.forEach(n => {
      if (!readIds.includes(n.id) && !_notifications.find(x => x.id === 'notice_' + n.id)) {
        _notifications.unshift({
          id: 'notice_' + n.id,
          message: '[공지] ' + n.text,
          type: 'info',
          source: 'system',
          read: false,
          createdAt: n.createdAt
        });
        readIds.push(n.id);
        added = true;
      }
    });
    if (added) {
      localStorage.setItem(readKey, JSON.stringify(readIds));
      saveNotifications();
      updateBellBadge();
    }
  } catch(e) {}
}

function saveNotifications() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  localStorage.setItem('pawsitive_notifications_' + user.id, JSON.stringify(_notifications));
}

// 현재 사용자에게 알림 추가 (source 기본값: 'system')
function addNotification(message, type, source) {
  _notifications.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    message,
    type: type || 'info',
    source: source || 'system',
    read: false,
    createdAt: new Date().toISOString()
  });
  if (_notifications.length > 50) _notifications = _notifications.slice(0, 50);
  saveNotifications();
  updateBellBadge();
}

// 다른 사용자에게 커뮤니티 알림 추가
// refData: { type: 'post'|'user'|'story', id: string } — 클릭 시 이동 대상
function addNotificationForUser(toUserId, message, type, refData) {
  if (!toUserId) return;
  const key = 'pawsitive_notifications_' + toUserId;
  let list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { list = []; }
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    message,
    type: type || 'info',
    source: 'community',
    read: false,
    createdAt: new Date().toISOString()
  };
  if (refData?.type) { entry.refType = refData.type; entry.refId = refData.id; }
  list.unshift(entry);
  if (list.length > 50) list = list.slice(0, 50);
  localStorage.setItem(key, JSON.stringify(list));
  const cur = AuthService.getCurrentUser();
  if (cur && cur.id === toUserId) {
    _notifications = list;
    updateBellBadge();
  }
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

// ─── 패널 렌더링 (탭 분리) ───

let _notifTab = 'community';

function toggleNotificationPanel() {
  const panel = document.getElementById('notification-panel');
  if (panel) {
    panel.remove();
    document.removeEventListener('click', closeNotifPanelOutside);
    return;
  }
  getNotifications();
  renderNotificationPanel(_notifTab);
}

function renderNotificationPanel(tab) {
  document.getElementById('notification-panel')?.remove();
  _notifTab = tab;

  const community = [..._notifications]
    .filter(n => n.source === 'community')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const system = [..._notifications]
    .filter(n => n.source !== 'community')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const list = tab === 'community' ? community : system;

  const typeIcon = { like: '❤️', comment: '💬', follow: '👤', info: '📢' };

  const renderItems = (items) => items.length === 0
    ? '<div style="padding:32px 16px;text-align:center;color:var(--color-text-muted);font-size:0.85rem;">알림이 없어요</div>'
    : items.map(n => {
        const isNav = (n.source !== 'community') || (n.refType && n.refId);
        const chevron = isNav
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>`
          : '';
        return `
        <div class="notif-item ${n.read ? '' : 'notif-item--unread'}" onclick="markNotifRead('${n.id}')"
             style="cursor:${isNav ? 'pointer' : 'default'};">
          <div class="notif-item__dot" style="background:${n.read ? 'transparent' : '#FF6B35'};"></div>
          <div class="notif-item__content">
            <div class="notif-item__msg">${(typeIcon[n.type] || '') + ' ' + n.message}</div>
            <div class="notif-item__time">${formatRelativeTime(n.createdAt)}</div>
          </div>
          ${chevron}
          <button onclick="event.stopPropagation();deleteNotification('${n.id}')"
            style="background:none;border:none;color:#ccc;font-size:1rem;cursor:pointer;padding:4px 8px;line-height:1;flex-shrink:0;" title="삭제">×</button>
        </div>
      `;
      }).join('');

  const communityUnread = _notifications.filter(n => n.source === 'community' && !n.read).length;
  const systemUnread = _notifications.filter(n => n.source !== 'community' && !n.read).length;

  const panelHtml = `
    <div id="notification-panel" class="notification-panel">
      <div class="notification-panel__header">
        <span style="font-weight:800;font-size:1rem;">알림</span>
        <div style="display:flex;gap:12px;">
          <button onclick="clearAllNotifications()" style="background:none;border:none;color:var(--color-text-muted);font-size:0.78rem;cursor:pointer;">모두 읽음</button>
          <button onclick="deleteAllNotifications()" style="background:none;border:none;color:#D32F2F;font-size:0.78rem;cursor:pointer;">지우기</button>
        </div>
      </div>
      <div class="notification-panel__tabs">
        <button class="notif-tab${tab === 'community' ? ' active' : ''}" onclick="switchNotifTab('community')">
          커뮤니티${communityUnread > 0 ? `<span class="notif-tab-badge">${communityUnread}</span>` : ''}
        </button>
        <button class="notif-tab${tab === 'system' ? ' active' : ''}" onclick="switchNotifTab('system')">
          공지사항${systemUnread > 0 ? `<span class="notif-tab-badge">${systemUnread}</span>` : ''}
        </button>
      </div>
      <div class="notification-panel__list">${renderItems(list)}</div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', panelHtml);

  setTimeout(() => {
    document.addEventListener('click', closeNotifPanelOutside);
  }, 100);
}

function switchNotifTab(tab) {
  document.removeEventListener('click', closeNotifPanelOutside);
  renderNotificationPanel(tab);
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
  if (n) {
    n.read = true;
    saveNotifications();
    updateBellBadge();
    _handleNotifNav(n);
  } else {
    renderNotificationPanel(_notifTab);
  }
}

function _closeNotifPanel() {
  document.getElementById('notification-panel')?.remove();
  document.removeEventListener('click', closeNotifPanelOutside);
}

function _handleNotifNav(n) {
  // 공지사항(시스템) — 내용 모달 (detail 사유 포함)
  if (n.source !== 'community') {
    renderNotificationPanel(_notifTab);
    _showNoticeModal(n);
    return;
  }

  // 커뮤니티 알림 — refData 없으면 그냥 패널 재렌더
  if (!n.refType || !n.refId) {
    renderNotificationPanel(_notifTab);
    return;
  }

  _closeNotifPanel();

  const goToRef = () => {
    if (n.refType === 'post') {
      window._communityViewUserId = null;
      if (typeof renderCommunityPage === 'function') renderCommunityPage();
      setTimeout(() => { if (typeof showPostDetail === 'function') showPostDetail(n.refId); }, 150);
    } else if (n.refType === 'user') {
      // 탈퇴한 회원이면 토스트만 표시
      const users = StorageService.get('users', []);
      if (!users.find(u => u.id === n.refId)) {
        showToast('탈퇴한 회원이에요.', 'info');
        return;
      }
      if (typeof handleCommunityUserClick === 'function') handleCommunityUserClick(n.refId);
    } else if (n.refType === 'story') {
      window._communityViewUserId = null;
      if (typeof renderCommunityPage === 'function') renderCommunityPage();
    }
  };

  if (window.location.hash !== '#/community') {
    window.location.hash = '#/community';
    setTimeout(goToRef, 350);
  } else {
    goToRef();
  }
}

function _showNoticeModal(n) {
  document.getElementById('notice-detail-modal')?.remove();

  // n이 문자열이면 이전 호출 방식 호환
  const message = typeof n === 'string' ? n : (n.message || '');
  const detail  = typeof n === 'string' ? null : (n.detail || null);
  const date    = typeof n === 'string' ? null : (n.createdAt ? formatRelativeTime(n.createdAt) : null);

  const isPoint = detail && (message.includes('포인트를 지급') || message.includes('포인트를 회수'));
  const title = isPoint ? '💰 포인트 내역' : '📢 공지사항';
  const text  = message.replace(/^\[공지\]\s*/, '');

  const modal = document.createElement('div');
  modal.id = 'notice-detail-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:24px 22px;max-width:360px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.18);position:relative;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <strong style="font-size:1rem;">${title}</strong>
        <button onclick="document.getElementById('notice-detail-modal').remove()"
          style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#aaa;line-height:1;padding:0;">×</button>
      </div>
      <p style="font-size:0.92rem;color:#222;line-height:1.7;white-space:pre-wrap;word-break:break-word;margin:0 0 ${detail ? '14px' : '0'};">${text}</p>
      ${detail ? `
        <div style="background:#f5f5f5;border-radius:10px;padding:10px 14px;">
          <div style="font-size:0.75rem;color:#888;margin-bottom:3px;">사유</div>
          <div style="font-size:0.88rem;color:#333;font-weight:600;">${detail}</div>
        </div>` : ''}
      ${date ? `<div style="font-size:0.73rem;color:#bbb;margin-top:10px;text-align:right;">${date}</div>` : ''}
    </div>
  `;
  document.body.appendChild(modal);
}

function clearAllNotifications() {
  _notifications.forEach(n => {
    if (n.source === _notifTab || (_notifTab === 'system' && n.source !== 'community')) {
      n.read = true;
    }
  });
  saveNotifications();
  updateBellBadge();
  renderNotificationPanel(_notifTab);
}

function deleteAllNotifications() {
  if (_notifTab === 'community') {
    _notifications = _notifications.filter(n => n.source !== 'community');
  } else {
    _notifications = _notifications.filter(n => n.source === 'community');
  }
  saveNotifications();
  updateBellBadge();
  renderNotificationPanel(_notifTab);
}

function deleteNotification(id) {
  _notifications = _notifications.filter(n => n.id !== id);
  saveNotifications();
  updateBellBadge();
  renderNotificationPanel(_notifTab);
}
