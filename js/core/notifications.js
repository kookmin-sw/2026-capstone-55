// ============================================================
// 알림 시스템 (벨 아이콘 + 알림 패널)
// ============================================================

let _notifications = [];

function _pushNotify(title, body, url) {
  addNotification(`${title} ${body}`);
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

// 서버에서 공지사항을 불러와 알림에 추가
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

  // 최신순 정렬
  const sorted = [..._notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const html = sorted.length === 0
    ? '<div style="padding:32px 16px;text-align:center;color:var(--color-text-muted);font-size:0.85rem;">알림이 없어요</div>'
    : sorted.map(n => `
      <div class="notif-item ${n.read ? '' : 'notif-item--unread'}" onclick="markNotifRead('${n.id}')">
        <div class="notif-item__dot" style="background:${n.read ? 'transparent' : '#FF6B35'};"></div>
        <div class="notif-item__content">
          <div class="notif-item__msg">${n.message}</div>
          <div class="notif-item__time">${formatRelativeTime(n.createdAt)}</div>
        </div>
        <button onclick="event.stopPropagation(); deleteNotification('${n.id}')" style="background:none;border:none;color:#ccc;font-size:1rem;cursor:pointer;padding:4px 8px;line-height:1;flex-shrink:0;" title="삭제">&times;</button>
      </div>
    `).join('');

  const panelHtml = `
    <div id="notification-panel" class="notification-panel">
      <div class="notification-panel__header">
        <span style="font-weight:800;font-size:1rem;">알림</span>
        <div style="display:flex;gap:12px;">
          <button onclick="clearAllNotifications()" style="background:none;border:none;color:var(--color-text-muted);font-size:0.78rem;cursor:pointer;">모두 읽음</button>
          <button onclick="deleteAllNotifications()" style="background:none;border:none;color:#D32F2F;font-size:0.78rem;cursor:pointer;">지우기</button>
        </div>
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

function deleteAllNotifications() {
  _notifications = [];
  saveNotifications();
  updateBellBadge();
  const panel = document.getElementById('notification-panel');
  if (panel) { panel.remove(); toggleNotificationPanel(); }
}

function deleteNotification(id) {
  _notifications = _notifications.filter(n => n.id !== id);
  saveNotifications();
  updateBellBadge();
  const panel = document.getElementById('notification-panel');
  if (panel) { panel.remove(); toggleNotificationPanel(); }
}
