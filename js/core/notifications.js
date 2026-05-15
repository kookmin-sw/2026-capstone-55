// ============================================================
// Notification system: bell badge, grouped panel, and navigation
// ============================================================

let _notifications = [];
let _notificationActiveCategory = 'community';

const NOTIFICATION_CATEGORIES = [
  { key: 'notice', label: '공지(관리자)' },
  { key: 'community', label: '커뮤니티' },
  { key: 'matching', label: '매칭' }
];

function _escapeNotificationText(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function _inferNotificationCategory(n) {
  if (n?.category && ['notice', 'community', 'matching'].includes(n.category)) return n.category;

  const source = String(n?.source || '').toLowerCase();
  const refType = String(n?.refType || '').toLowerCase();
  const type = String(n?.type || '').toLowerCase();
  const message = String(n?.message || '');

  if (source === 'admin' || type === 'notice' || n?.id?.startsWith('notice_') || message.startsWith('[공지]')) {
    return 'notice';
  }
  if (source === 'community' || ['post', 'story', 'user'].includes(refType) || ['comment', 'like', 'follow', 'reply', 'story'].includes(type)) {
    return 'community';
  }
  if (
    ['walk', 'match', 'matching', 'expert'].includes(type) ||
    /산책|도우미|요청|매칭|상담|전문가|리뷰/.test(message)
  ) {
    return 'matching';
  }
  return 'notice';
}

function _defaultTargetForNotification(n) {
  const category = _inferNotificationCategory(n);
  if (n?.targetRoute) return n.targetRoute;
  if (category === 'community') return '/community';
  if (n?.sessionId || /출발|도착|시작|완료|경로|픽업|전달/.test(n?.message || '')) return '/walk-session';
  if (category === 'matching') return n?.type === 'expert' ? '/experts' : '/matching';
  return '';
}

function _normalizeNotification(entry, refData = {}) {
  const data = refData || {};
  const normalized = {
    id: entry.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
    message: entry.message || '',
    type: entry.type || data.type || 'info',
    source: entry.source || data.source || '',
    read: entry.read === true,
    createdAt: entry.createdAt || new Date().toISOString()
  };

  const ref = data.refType || data.type;
  if (entry.refType || ref) normalized.refType = entry.refType || ref;
  if (entry.refId || data.refId || data.id) normalized.refId = entry.refId || data.refId || data.id;
  if (entry.requestId || data.requestId) normalized.requestId = entry.requestId || data.requestId;
  if (entry.sessionId || data.sessionId) normalized.sessionId = entry.sessionId || data.sessionId;
  if (entry.targetRoute || data.targetRoute) normalized.targetRoute = entry.targetRoute || data.targetRoute;
  if (entry.noticeText || data.noticeText) normalized.noticeText = entry.noticeText || data.noticeText;

  normalized.category = entry.category || data.category || _inferNotificationCategory(normalized);
  normalized.targetRoute = _defaultTargetForNotification(normalized);
  return normalized;
}

function _pushNotify(title, body, url) {
  const targetRoute = (url || '').replace(/^\/?#/, '').replace(/^\/?/, '/');
  addNotification(`${title} ${body}`, 'info', { targetRoute: targetRoute === '/' ? undefined : targetRoute });
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, { body, icon: '/favicon.ico' });
    if (url) n.onclick = () => { window.focus(); Router.navigate(targetRoute || '/'); };
  }
}

function getNotifications() {
  const user = AuthService.getCurrentUser();
  if (!user) return [];
  const stored = localStorage.getItem('pawsitive_notifications_' + user.id);
  if (stored) {
    try {
      _notifications = JSON.parse(stored).map(n => _normalizeNotification(n));
    } catch(e) {
      _notifications = [];
    }
  }
  return _notifications;
}

// 서버에서 공지사항을 불러와 알림에 추가
async function loadServerNotices() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  try {
    const res = await fetch('/api/data/notices');
    const notices = await res.json();
    if (!Array.isArray(notices) || notices.length === 0) return;
    getNotifications();
    const readKey = 'pawsitive_read_notices_' + user.id;
    const readIds = JSON.parse(localStorage.getItem(readKey) || '[]');
    let added = false;
    notices.forEach(n => {
      if (!readIds.includes(n.id) && !_notifications.find(x => x.id === 'notice_' + n.id)) {
        _notifications.unshift(_normalizeNotification({
          id: 'notice_' + n.id,
          message: '[공지] ' + n.text,
          type: 'notice',
          source: 'admin',
          category: 'notice',
          read: false,
          createdAt: n.createdAt,
          noticeText: n.text
        }));
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

function _refreshOpenNotificationPanel() {
  const panel = document.getElementById('notification-panel');
  if (panel) {
    panel.remove();
    toggleNotificationPanel(_notificationActiveCategory);
  }
}

function receiveNotification(entry) {
  if (!entry) return;
  getNotifications();
  const normalized = _normalizeNotification(entry);
  if (_notifications.some(n => n.id === normalized.id)) return;
  _notifications.unshift(normalized);
  if (_notifications.length > 80) _notifications = _notifications.slice(0, 80);
  saveNotifications();
  updateBellBadge();
  _refreshOpenNotificationPanel();
  if (normalized.message && typeof showToast === 'function') {
    showToast(normalized.message.replace(/<[^>]+>/g, '').slice(0, 80), 'info');
  }
}

function addNotification(message, type = 'info', refData = {}) {
  const entry = _normalizeNotification({ message, type }, refData);
  getNotifications();
  _notifications.unshift(entry);
  if (_notifications.length > 80) _notifications = _notifications.slice(0, 80);
  saveNotifications();
  updateBellBadge();
  _refreshOpenNotificationPanel();
  return entry;
}

function addNotificationForUser(toUserId, message, type, refData) {
  if (!toUserId) return;
  const data = refData || {};
  const entry = _normalizeNotification({
    message,
    type: type || 'info',
    source: data.source || 'community',
    category: data.category || 'community',
    read: false
  }, data);

  const key = 'pawsitive_notifications_' + toUserId;
  let list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { list = []; }
  if (!list.some(n => n.id === entry.id)) {
    list.unshift(entry);
    if (list.length > 80) list = list.slice(0, 80);
    localStorage.setItem(key, JSON.stringify(list));
  }

  const current = AuthService.getCurrentUser();
  if (current && current.id === toUserId) {
    _notifications = list.map(n => _normalizeNotification(n));
    updateBellBadge();
    _refreshOpenNotificationPanel();
  }

  fetch('/api/data/notify-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toUserId, notification: entry })
  }).catch(() => {});

  return entry;
}

function updateBellBadge() {
  const badge = document.getElementById('nav-bell-badge');
  if (!badge) return;
  getNotifications();
  const unread = _notifications.filter(n => !n.read).length;
  if (unread > 0) {
    badge.textContent = unread > 99 ? '99+' : unread;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function _renderNotificationItem(n) {
  const message = _escapeNotificationText(n.message);
  return `
    <div class="notif-item ${n.read ? '' : 'notif-item--unread'}" onclick="handleNotificationClick('${n.id}')">
      <div class="notif-item__dot" style="background:${n.read ? 'transparent' : '#FF6B35'};"></div>
      <div class="notif-item__content">
        <div class="notif-item__msg">${message}</div>
        <div class="notif-item__time">${formatRelativeTime(n.createdAt)}</div>
      </div>
      <button onclick="event.stopPropagation(); deleteNotification('${n.id}')" class="notif-item__delete" title="삭제">&times;</button>
    </div>
  `;
}

function _renderNotificationTabs(sorted) {
  return `
    <div class="notification-panel__tabs">
      ${NOTIFICATION_CATEGORIES.map(cat => {
        const items = sorted.filter(n => _inferNotificationCategory(n) === cat.key);
        const unread = items.filter(n => !n.read).length;
        return `
          <button class="notification-tab ${_notificationActiveCategory === cat.key ? 'active' : ''}"
            onclick="event.stopPropagation(); setNotificationCategory('${cat.key}')">
            <span>${cat.label}</span>
            ${unread ? `<b>${unread > 9 ? '9+' : unread}</b>` : ''}
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function toggleNotificationPanel(category) {
  let panel = document.getElementById('notification-panel');
  if (panel) {
    panel.remove();
    document.removeEventListener('click', closeNotifPanelOutside);
    return;
  }

  getNotifications();
  if (category) _notificationActiveCategory = category;

  const sorted = [..._notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (!sorted.some(n => _inferNotificationCategory(n) === _notificationActiveCategory)) {
    const firstWithItems = NOTIFICATION_CATEGORIES.find(cat => sorted.some(n => _inferNotificationCategory(n) === cat.key));
    _notificationActiveCategory = firstWithItems ? firstWithItems.key : 'community';
  }

  const activeItems = sorted.filter(n => _inferNotificationCategory(n) === _notificationActiveCategory);
  const html = activeItems.length === 0
    ? '<div class="notification-empty">알림이 없어요</div>'
    : activeItems.map(_renderNotificationItem).join('');

  const panelHtml = `
    <div id="notification-panel" class="notification-panel">
      <div class="notification-panel__header">
        <span class="notification-panel__title">알림</span>
        <div class="notification-panel__actions">
          <button onclick="clearAllNotifications()">모두 읽음</button>
          <button onclick="deleteAllNotifications()">지우기</button>
        </div>
      </div>
      ${_renderNotificationTabs(sorted)}
      <div class="notification-panel__list">${html}</div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', panelHtml);

  setTimeout(() => {
    document.addEventListener('click', closeNotifPanelOutside);
  }, 100);
}

function setNotificationCategory(category) {
  _notificationActiveCategory = category;
  const panel = document.getElementById('notification-panel');
  if (panel) {
    panel.remove();
    toggleNotificationPanel(category);
  }
}

function closeNotifPanelOutside(e) {
  const panel = document.getElementById('notification-panel');
  const bellBtn = document.querySelector('.nav-bell-btn');
  if (panel && !panel.contains(e.target) && !bellBtn?.contains(e.target)) {
    panel.remove();
    document.removeEventListener('click', closeNotifPanelOutside);
  }
}

function _routeToCommunityNotification(n) {
  const go = () => {
    if (n.refType === 'user' && n.refId) {
      window._communityPendingViewUserId = n.refId;
      window._communityViewUserId = n.refId;
    } else {
      window._communityViewUserId = null;
      window._communityTab = 'main';
      window._communityHashFilter = '';
      window._communitySearch = '';
      if (n.refType === 'post' && n.refId) {
        window._communityFocusPostId = n.refId;
        window._communityOpenPostId = n.refId;
      }
      if (n.refType === 'story' && n.refId) {
        window._communityOpenStoryId = n.refId;
      }
    }

    if (Router.getPath && Router.getPath() === '/community') {
      window._communityPendingViewUserId = null;
      renderCommunityPage();
    } else {
      Router.navigate('/community');
    }
  };

  if (StorageService?.syncFromServer) {
    StorageService.syncFromServer().finally(go);
  } else {
    go();
  }
}

function _showNoticeNotification(n) {
  const existing = document.getElementById('notice-notification-modal');
  if (existing) existing.remove();
  const text = _escapeNotificationText(n.noticeText || n.message.replace(/^\[공지\]\s*/, ''));
  const overlay = document.createElement('div');
  overlay.id = 'notice-notification-modal';
  overlay.className = 'notice-notification-modal';
  overlay.innerHTML = `
    <div class="notice-notification-card">
      <button class="notice-notification-close" onclick="document.getElementById('notice-notification-modal')?.remove()">×</button>
      <div class="notice-notification-kicker">관리자 공지</div>
      <h3>공지사항</h3>
      <p>${text}</p>
      <button class="btn btn-primary btn-sm" onclick="document.getElementById('notice-notification-modal')?.remove()">확인</button>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function _navigateFromNotification(n) {
  const category = _inferNotificationCategory(n);
  if (category === 'community') {
    _routeToCommunityNotification(n);
    return;
  }

  if (category === 'notice') {
    const user = AuthService.getCurrentUser();
    if (user?.isAdmin && n.targetRoute === '/admin') {
      Router.navigate('/admin');
    } else {
      _showNoticeNotification(n);
    }
    return;
  }

  if (n.sessionId) window._activeSessionId = n.sessionId;
  Router.navigate(n.targetRoute || '/matching');
}

function handleNotificationClick(id) {
  getNotifications();
  const n = _notifications.find(x => x.id === id);
  if (!n) return;
  n.read = true;
  saveNotifications();
  updateBellBadge();
  document.getElementById('notification-panel')?.remove();
  document.removeEventListener('click', closeNotifPanelOutside);
  _navigateFromNotification(n);
}

function markNotifRead(id) {
  const n = _notifications.find(x => x.id === id);
  if (n) { n.read = true; saveNotifications(); updateBellBadge(); }
  const panel = document.getElementById('notification-panel');
  if (panel) { panel.remove(); toggleNotificationPanel(_notificationActiveCategory); }
}

function clearAllNotifications() {
  _notifications.forEach(n => n.read = true);
  saveNotifications();
  updateBellBadge();
  const panel = document.getElementById('notification-panel');
  if (panel) { panel.remove(); toggleNotificationPanel(_notificationActiveCategory); }
}

function deleteAllNotifications() {
  _notifications = [];
  saveNotifications();
  updateBellBadge();
  const panel = document.getElementById('notification-panel');
  if (panel) { panel.remove(); toggleNotificationPanel(_notificationActiveCategory); }
}

function deleteNotification(id) {
  _notifications = _notifications.filter(n => n.id !== id);
  saveNotifications();
  updateBellBadge();
  const panel = document.getElementById('notification-panel');
  if (panel) { panel.remove(); toggleNotificationPanel(_notificationActiveCategory); }
}
