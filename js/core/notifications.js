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
