// ============================================================
// DM (다이렉트 메시지) — 1:1 실시간 채팅
// ============================================================

let _dmUnread = 0;

// ── 초기화: 로그인 후 한 번 호출 ──────────────────────────────
function initDM() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  _refreshDMBadge();
  RealtimeService.on('dm-message', (msg) => {
    _dmUnread++;
    _updateDMBadge(_dmUnread);
    // DM 패널이 해당 대화를 열고 있으면 바로 메시지 추가
    const chatPanel = document.getElementById('dm-chat-panel');
    if (chatPanel && chatPanel.dataset.otherId === msg.fromId) {
      _appendDMMessage(msg, user.id);
      _markDMRead(msg.convId, user.id);
    } else {
      showToast(`💬 새 메시지가 도착했어요`, 'info');
    }
  });
}

async function _refreshDMBadge() {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  try {
    const res  = await fetch(`/api/dm/unread/${user.id}`);
    const data = await res.json();
    _dmUnread = data.unread || 0;
    _updateDMBadge(_dmUnread);
  } catch(e) {}
}

function _updateDMBadge(count) {
  const badge = document.getElementById('dm-nav-badge');
  if (!badge) return;
  badge.style.display = count > 0 ? 'flex' : 'none';
  badge.textContent   = count > 9 ? '9+' : count;
}

async function _markDMRead(convId, userId) {
  try { await fetch(`/api/dm/conv/${userId}/${convId.replace(`${userId}_`, '').replace(`_${userId}`, '')}`); } catch(e) {}
}

// ── DM 인박스 패널 열기 ────────────────────────────────────────
async function openDMInbox() {
  const user = AuthService.getCurrentUser();
  if (!user) { showLoginModal('DM을 보내려면 로그인이 필요해요!'); return; }

  document.getElementById('dm-inbox-overlay')?.remove();
  document.getElementById('dm-chat-panel')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'dm-inbox-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;display:flex;justify-content:flex-end;';

  const backdrop = document.createElement('div');
  backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.35);';
  backdrop.onclick = closeDMInbox;

  const panel = document.createElement('div');
  panel.style.cssText = `
    position:relative;width:360px;max-width:100vw;height:100%;
    background:#fff;display:flex;flex-direction:column;
    box-shadow:-4px 0 24px rgba(0,0,0,0.12);
    animation:dmSlideIn 0.25s cubic-bezier(0.34,1.1,0.64,1);
  `;
  panel.innerHTML = `
    <style>
      @keyframes dmSlideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
      .dm-conv-item { display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;border-bottom:1px solid #f3f4f6;transition:background 0.12s; }
      .dm-conv-item:hover { background:#fafafa; }
      .dm-avatar { width:46px;height:46px;border-radius:50%;object-fit:cover;background:#e5e7eb;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.2rem; }
      .dm-conv-name { font-weight:700;font-size:0.9rem;color:#111; }
      .dm-conv-preview { font-size:0.8rem;color:#9ca3af;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px; }
      .dm-unread-dot { width:9px;height:9px;border-radius:50%;background:var(--color-primary,#F59E0B);flex-shrink:0; }
    </style>
    <div style="padding:18px 18px 14px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:1.05rem;font-weight:800;">다이렉트 메시지</div>
      <button onclick="closeDMInbox()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#9ca3af;line-height:1;">×</button>
    </div>
    <div id="dm-conv-list" style="flex:1;overflow-y:auto;">
      <div style="text-align:center;padding:40px 0;color:#d1d5db;font-size:0.9rem;">불러오는 중...</div>
    </div>
  `;

  overlay.appendChild(backdrop);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // 대화 목록 로드
  try {
    const res  = await fetch(`/api/dm/list/${user.id}`);
    const data = await res.json();
    const list = document.getElementById('dm-conv-list');
    if (!list) return;
    if (!data.conversations?.length) {
      list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#9ca3af;">
        <div style="font-size:2.5rem;margin-bottom:12px;">💬</div>
        <div style="font-weight:600;margin-bottom:6px;">아직 대화가 없어요</div>
        <div style="font-size:0.83rem;">다른 사람 프로필에서 DM을 시작해보세요!</div>
      </div>`;
      return;
    }
    list.innerHTML = data.conversations.map(conv => `
      <div class="dm-conv-item" onclick="openDMChat('${conv.otherId}','${conv.otherName}','${conv.otherAvatar}')">
        ${_avatarEl(conv.otherAvatar, conv.otherName)}
        <div style="flex:1;min-width:0;">
          <div class="dm-conv-name">${conv.otherName}</div>
          <div class="dm-conv-preview">${conv.lastMessage || '대화를 시작해보세요'}</div>
        </div>
        ${conv.unread > 0 ? `<div class="dm-unread-dot"></div>` : ''}
      </div>
    `).join('');
  } catch(e) {
    const list = document.getElementById('dm-conv-list');
    if (list) list.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;">불러오기 실패</div>`;
  }
}

function closeDMInbox() {
  document.getElementById('dm-inbox-overlay')?.remove();
  document.getElementById('dm-chat-panel')?.remove();
}

// ── 개인 채팅창 열기 ──────────────────────────────────────────
async function openDMChat(otherId, otherName, otherAvatar) {
  const user = AuthService.getCurrentUser();
  if (!user) { showLoginModal('DM을 보내려면 로그인이 필요해요!'); return; }
  if (otherId === user.id) { showToast('자신에게는 DM을 보낼 수 없어요.', 'info'); return; }

  // 인박스 패널이 없으면 backdrop만 만들기
  if (!document.getElementById('dm-inbox-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'dm-inbox-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;display:flex;justify-content:flex-end;';
    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.35);';
    backdrop.onclick = closeDMInbox;
    overlay.appendChild(backdrop);
    document.body.appendChild(overlay);
  }

  document.getElementById('dm-chat-panel')?.remove();

  const panel = document.createElement('div');
  panel.id = 'dm-chat-panel';
  panel.dataset.otherId = otherId;
  panel.style.cssText = `
    position:fixed;top:0;right:0;width:360px;max-width:100vw;height:100%;
    background:#fff;display:flex;flex-direction:column;z-index:8001;
    box-shadow:-4px 0 24px rgba(0,0,0,0.15);
    animation:dmSlideIn 0.22s cubic-bezier(0.34,1.1,0.64,1);
  `;
  panel.innerHTML = `
    <style>
      @keyframes dmSlideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
      .dm-bubble-me   { align-self:flex-end;background:#1a1a1a;color:#fff;border-radius:18px 18px 4px 18px; }
      .dm-bubble-them { align-self:flex-start;background:#f3f4f6;color:#111;border-radius:18px 18px 18px 4px; }
      .dm-media-img   { max-width:220px;max-height:280px;border-radius:12px;display:block;cursor:zoom-in;object-fit:cover; }
      .dm-media-video { max-width:220px;border-radius:12px;display:block; }
      #dm-paste-preview { display:none;padding:8px 12px;border-top:1px solid #f0f0f0;background:#fafafa;align-items:center;gap:8px;flex-shrink:0; }
      #dm-paste-preview.active { display:flex; }
    </style>
    <div style="padding:14px 16px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px;flex-shrink:0;">
      <button onclick="document.getElementById('dm-chat-panel').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:#9ca3af;line-height:1;padding:0 4px;">‹</button>
      ${_avatarEl(otherAvatar, otherName, 38)}
      <div style="font-weight:700;font-size:0.95rem;">${otherName}</div>
      <button onclick="closeDMInbox()" style="margin-left:auto;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#9ca3af;line-height:1;">×</button>
    </div>
    <div id="dm-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;"></div>
    <div id="dm-paste-preview">
      <img id="dm-paste-thumb" src="" style="width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;">
      <span id="dm-paste-name" style="font-size:0.8rem;color:#374151;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
      <button onclick="_dmCancelPaste()" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:#9ca3af;">×</button>
    </div>
    <div style="padding:10px 12px;border-top:1px solid #f0f0f0;display:flex;gap:8px;align-items:center;flex-shrink:0;">
      <label title="사진/동영상 첨부" style="cursor:pointer;color:#9ca3af;display:flex;align-items:center;flex-shrink:0;padding:4px;">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        <input id="dm-file-input" type="file" accept="image/*,video/*" style="display:none;" onchange="_dmHandleFileSelect(this,'${otherId}','${otherName.replace(/'/g,"\\'")}','${otherAvatar}')">
      </label>
      <input id="dm-input" type="text" placeholder="메시지 입력..." maxlength="300"
        style="flex:1;border:1.5px solid #e5e7eb;border-radius:22px;padding:9px 16px;font-size:0.88rem;outline:none;transition:border-color 0.15s;"
        onfocus="this.style.borderColor='#1a1a1a'" onblur="this.style.borderColor='#e5e7eb'"
        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendDMMessage('${otherId}','${otherName.replace(/'/g,"\\'")}','${otherAvatar}');}">
      <button onclick="sendDMMessage('${otherId}','${otherName.replace(/'/g,"\\'")}','${otherAvatar}')"
        style="width:40px;height:40px;border-radius:50%;background:#1a1a1a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(panel);

  // 메시지 로드
  try {
    const res  = await fetch(`/api/dm/conv/${user.id}/${otherId}`);
    const data = await res.json();
    const msgs = data.messages || [];
    const container = document.getElementById('dm-messages');
    if (!container) return;
    if (!msgs.length) {
      container.innerHTML = `<div data-placeholder style="text-align:center;color:#d1d5db;font-size:0.82rem;margin:auto;">${otherName}님과 첫 대화를 시작해보세요 👋</div>`;
    } else {
      msgs.forEach(m => _appendDMMessage(m, user.id));
    }
    container.scrollTop = container.scrollHeight;
    // 읽음 처리 (뱃지 갱신)
    _dmUnread = Math.max(0, _dmUnread - 1);
    _updateDMBadge(_dmUnread);
    _refreshDMBadge();
  } catch(e) {}

  const input = document.getElementById('dm-input');
  if (input) {
    input.focus();
    // 붙여넣기(이미지) 이벤트
    input.addEventListener('paste', (e) => _dmHandlePaste(e, otherId, otherName, otherAvatar));
  }
}

// ── 파일 선택 핸들러 ──────────────────────────────────────────
let _dmPendingFile = null;

function _dmHandleFileSelect(input, otherId, otherName, otherAvatar) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  _dmShowPastePreview(file);
  _dmPendingFile = { file, otherId, otherName, otherAvatar };
  document.getElementById('dm-input')?.focus();
}

function _dmHandlePaste(e, otherId, otherName, otherAvatar) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) return;
      _dmShowPastePreview(file);
      _dmPendingFile = { file, otherId, otherName, otherAvatar };
      document.getElementById('dm-input')?.focus();
      return;
    }
  }
}

function _dmShowPastePreview(file) {
  const preview = document.getElementById('dm-paste-preview');
  const thumb   = document.getElementById('dm-paste-thumb');
  const name    = document.getElementById('dm-paste-name');
  if (!preview) return;
  preview.classList.add('active');
  if (name) name.textContent = file.name || '첨부 파일';
  if (thumb && file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    thumb.src = url;
    thumb.style.display = 'block';
  } else if (thumb) {
    thumb.style.display = 'none';
  }
}

function _dmCancelPaste() {
  _dmPendingFile = null;
  const preview = document.getElementById('dm-paste-preview');
  if (preview) preview.classList.remove('active');
}

async function _uploadDMMedia(file) {
  const form = new FormData();
  form.append('file', file, file.name || 'paste.png');
  const res  = await fetch('/api/dm/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!data.success) throw new Error('업로드 실패');
  return { mediaUrl: data.url, mediaType: data.mediaType };
}

// ── 메시지 전송 ────────────────────────────────────────────────
async function sendDMMessage(otherId, otherName, otherAvatar) {
  const user  = AuthService.getCurrentUser();
  const input = document.getElementById('dm-input');
  const content = input?.value?.trim() || '';
  const pendingFile = _dmPendingFile;

  if (!user || (!content && !pendingFile)) return;
  if (input) input.value = '';
  _dmPendingFile = null;
  _dmCancelPaste();

  // 낙관적 UI (텍스트)
  const tempMsg = {
    id: 'temp_' + Date.now(),
    senderId: user.id,
    senderName: user.nickname || user.name,
    content,
    createdAt: new Date().toISOString()
  };

  let mediaUrl = null, mediaType = null;

  if (pendingFile) {
    // 업로드 중 임시 미리보기
    const objUrl = URL.createObjectURL(pendingFile.file);
    tempMsg.mediaUrl  = objUrl;
    tempMsg.mediaType = pendingFile.file.type.startsWith('video/') ? 'video' : 'image';
    tempMsg._isTemp   = true;
  }

  _appendDMMessage(tempMsg, user.id);
  const container = document.getElementById('dm-messages');
  const placeholder = container?.querySelector('[data-placeholder]');
  if (placeholder) placeholder.remove();

  try {
    const users = StorageService.get('users', []);
    const otherUser = users.find(u => u.id === otherId);
    const body = {
      content,
      senderName:   user.nickname  || user.name,
      senderAvatar: user.profileImage || '',
      otherName:    otherName || otherUser?.nickname || otherUser?.name || '사용자',
      otherAvatar:  otherAvatar || otherUser?.profileImage || ''
    };

    if (pendingFile) {
      const uploaded = await _uploadDMMedia(pendingFile.file);
      mediaUrl  = uploaded.mediaUrl;
      mediaType = uploaded.mediaType;
      body.mediaUrl  = mediaUrl;
      body.mediaType = mediaType;
      // 임시 blob URL 교체
      const tempEl = document.getElementById(tempMsg.id);
      if (tempEl) {
        const img = tempEl.querySelector('img');
        const vid = tempEl.querySelector('video source');
        if (img)  img.src = mediaUrl;
        if (vid) { vid.src = mediaUrl; vid.parentElement.load(); }
      }
    }

    await fetch(`/api/dm/conv/${user.id}/${otherId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch(e) {
    showToast('전송 실패', 'error');
  }
}

// ── 메시지 말풍선 렌더 ─────────────────────────────────────────
function _appendDMMessage(msg, myId) {
  const container = document.getElementById('dm-messages');
  if (!container) return;

  const placeholder = container.querySelector('[data-placeholder]');
  if (placeholder) placeholder.remove();

  const isMe = msg.senderId === myId;
  const div  = document.createElement('div');
  div.id = msg.id || '';
  div.style.cssText = `display:flex;flex-direction:column;align-items:${isMe ? 'flex-end' : 'flex-start'};max-width:100%;`;

  let bubbleInner = '';
  if (msg.mediaUrl) {
    if (msg.mediaType === 'video') {
      bubbleInner = `<video class="dm-media-video" controls playsinline preload="metadata" style="max-width:220px;border-radius:12px;">
        <source src="${msg.mediaUrl}">
      </video>`;
    } else {
      bubbleInner = `<img class="dm-media-img" src="${msg.mediaUrl}" loading="lazy"
        onclick="window.open(this.src,'_blank')"
        onerror="this.style.display='none'">`;
    }
    if (msg.content) {
      bubbleInner += `<div class="${isMe ? 'dm-bubble-me' : 'dm-bubble-them'}" style="padding:8px 12px;font-size:0.875rem;line-height:1.5;max-width:220px;word-break:break-word;margin-top:4px;">${msg.content}</div>`;
    }
  } else {
    bubbleInner = `<div class="${isMe ? 'dm-bubble-me' : 'dm-bubble-them'}" style="padding:10px 14px;font-size:0.875rem;line-height:1.5;max-width:78%;word-break:break-word;">${msg.content}</div>`;
  }

  div.innerHTML = `
    ${bubbleInner}
    <span style="font-size:0.65rem;color:#9ca3af;margin-top:3px;">${new Date(msg.createdAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ── 아바타 헬퍼 ───────────────────────────────────────────────
function _avatarEl(src, name, size = 46) {
  if (src) {
    return `<img src="${src}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.outerHTML=\`<div style='width:${size}px;height:${size}px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.4)}px;flex-shrink:0;'>${(name||'?')[0].toUpperCase()}</div>\`">`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.4)}px;flex-shrink:0;">${(name||'?')[0].toUpperCase()}</div>`;
}
