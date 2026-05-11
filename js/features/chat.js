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
  appendChatMessage(msg, user.id);

  try {
    await fetch(`/api/walk-chat/${_chatRequestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
  } catch(e) { showToast('메시지 전송 실패', 'error'); }
}
