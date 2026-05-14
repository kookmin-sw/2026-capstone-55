// Pawsitive - AI Consultation Page
// --- 통합 AI 상담 페이지 ---
let _aiChatMode = 'training';
let _aiCurrentSession = null; // { id, title, mode, messages:[] }
let _aiSessionList = [];

function escapeAiHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function renderAiPage() {
  const user = AuthService.getCurrentUser();
  _aiChatMode = 'training';
  _aiCurrentSession = { id: StorageService.generateId(), title: '새 대화', mode: 'training', messages: [] };

  // 풀스크린 ChatGPT 스타일 레이아웃 (page-content 패딩 오버라이드)
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
    <style>
      .ai-layout { display:flex; height:calc(100vh - 64px); overflow:hidden; background:#F7FAFC; color:#0B1220; }
      .ai-sidebar { width:274px; background:#FFFFFF; border-right:1px solid #E2E8F0; display:flex; flex-direction:column; flex-shrink:0; }
      .ai-sidebar__header { padding:18px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #EEF2F7; }
      .ai-sidebar__new { padding:11px 14px; border:1px solid #DDE6F0; border-radius:8px; font-size:0.84rem; font-weight:900; background:#0B1220; color:#fff; width:100%; text-align:left; transition:transform 0.15s, box-shadow 0.15s; box-shadow:0 10px 22px rgba(15,23,42,.12); }
      .ai-sidebar__new:hover { transform:translateY(-1px); box-shadow:0 14px 28px rgba(15,23,42,.16); }
      .ai-sidebar__list { flex:1; overflow-y:auto; padding:10px; }
      .ai-sidebar__list::-webkit-scrollbar { width:3px; }
      .ai-sidebar__list::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:2px; }
      .ai-sidebar__item { padding:11px 12px; border-radius:8px; font-size:0.82rem; color:#64748B; cursor:pointer; transition:background 0.15s, color 0.15s; margin-bottom:3px; display:flex; justify-content:space-between; align-items:center; }
      .ai-sidebar__item:hover { background:#F1F5F9; color:#0F172A; }
      .ai-sidebar__item.active { background:#E8F4FF; color:#0B1220; font-weight:800; }
      .ai-sidebar__item-title { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .ai-sidebar__item-del { opacity:0; font-size:0.75rem; color:#999; background:none; border:none; padding:2px 4px; transition:opacity 0.15s; }
      .ai-sidebar__item:hover .ai-sidebar__item-del { opacity:1; }
      .ai-sidebar__item-del:hover { color:#e53e3e; }
      .ai-sidebar__footer { padding:14px 16px; border-top:1px solid #EEF2F7; }
      .ai-main { position:relative; flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }
      .ai-main::before { content:''; position:absolute; inset:0; background:
        linear-gradient(90deg, rgba(255,255,255,.96) 0%, rgba(255,255,255,.86) 45%, rgba(255,255,255,.72) 100%),
        url('/AI반려견상담탭배경.png') center / cover no-repeat; opacity:.78; pointer-events:none; }
      .ai-main__header { position:relative; z-index:1; padding:14px 26px; border-bottom:1px solid rgba(226,232,240,.86); display:flex; justify-content:flex-start; align-items:center; gap:14px; flex-shrink:0; backdrop-filter:blur(12px); background:rgba(255,255,255,.72); }
      .ai-main__brand { display:flex; align-items:center; gap:10px; min-width:0; }
      .ai-main__mark { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#E8F4FF; color:#2563EB; font-weight:950; }
      .ai-main__brand strong { display:block; font-size:.92rem; font-weight:950; }
      .ai-main__brand span { display:block; margin-top:2px; color:#64748B; font-size:.72rem; font-weight:800; }
      .ai-main__tabs { display:inline-flex; flex-shrink:0; background:#F1F5F9; border:1px solid #E2E8F0; border-radius:999px; padding:3px; }
      .ai-main__tab { min-width:92px; padding:8px 15px; border-radius:999px; font-size:0.78rem; font-weight:900; color:#64748B; background:none; border:none; transition:all 0.2s; cursor:pointer; }
      .ai-main__tab:hover { color:#0B1220; }
      .ai-main__tab.active { color:#fff; background:#0B1220; box-shadow:0 8px 18px rgba(15,23,42,.14); }
      .ai-chat-area { position:relative; z-index:1; flex:1; overflow-y:auto; display:flex; flex-direction:column; }
      .ai-chat-area::-webkit-scrollbar { width:4px; }
      .ai-chat-area::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:2px; }
      .ai-chat-center { max-width:860px; width:100%; margin:0 auto; padding:28px 26px; flex:1; display:flex; flex-direction:column; }
      .ai-welcome-shell { display:grid; grid-template-columns:minmax(0,1.1fr) 240px; gap:18px; align-items:stretch; margin:auto 0; }
      .ai-welcome-center { min-width:0; padding:34px; border:1px solid rgba(221,230,240,.9); border-radius:8px; background:rgba(255,255,255,.86); box-shadow:0 24px 58px rgba(15,23,42,.09); backdrop-filter:blur(16px); }
      .ai-welcome-kicker { display:inline-flex; align-items:center; gap:7px; padding:6px 10px; border-radius:999px; background:#E8F4FF; color:#175CD3; font-size:.72rem; font-weight:950; margin-bottom:14px; }
      .ai-welcome-center h2 { font-size:2rem; line-height:1.18; font-weight:950; color:#0B1220; letter-spacing:0; margin:0 0 10px; }
      .ai-welcome-center p { font-size:0.92rem; color:#52637A; line-height:1.7; margin:0; max-width:560px; }
      .ai-mode-grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:10px; margin-top:22px; }
      .ai-mode-card { padding:17px; border:1px solid #DDE6F0; border-radius:8px; background:#fff; cursor:pointer; transition:transform .15s, border-color .15s, box-shadow .15s, background .15s; text-align:left; }
      .ai-mode-card:hover { transform:translateY(-1px); border-color:#94A3B8; box-shadow:0 12px 24px rgba(15,23,42,.07); }
      .ai-mode-card.selected { border-color:#0B1220; background:#F8FAFC; }
      .ai-mode-card__title { display:flex; align-items:center; gap:8px; font-size:.95rem; font-weight:950; color:#0B1220; margin-bottom:7px; }
      .ai-mode-card__desc { color:#64748B; font-size:.78rem; line-height:1.55; }
      .ai-quick-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:16px; }
      .ai-quick-chip { border:1px solid #DDE6F0; border-radius:8px; background:#fff; padding:10px 12px; color:#334155; font-size:.78rem; font-weight:900; text-align:left; cursor:pointer; }
      .ai-quick-chip:hover { border-color:#0B1220; color:#0B1220; }
      .ai-side-photo { position:relative; overflow:hidden; min-height:360px; border-radius:8px; border:1px solid rgba(221,230,240,.9); background:url('/Ai상담채팅내부용서브이미지.png') center / cover no-repeat; box-shadow:0 24px 58px rgba(15,23,42,.1); }
      .ai-side-photo::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(11,18,32,.05), rgba(11,18,32,.52)); }
      .ai-side-photo__copy { position:absolute; left:16px; right:16px; bottom:16px; z-index:1; color:#fff; }
      .ai-side-photo__copy strong { display:block; font-size:1rem; font-weight:950; margin-bottom:4px; }
      .ai-side-photo__copy span { display:block; font-size:.78rem; line-height:1.5; opacity:.9; }
      .ai-disclaimer { margin-top:14px; padding:11px 12px; border-radius:8px; background:#F8FAFC; border:1px solid #E2E8F0; color:#64748B; font-size:.74rem; line-height:1.55; font-weight:750; }
      .ai-input-area { position:relative; z-index:1; padding:16px 26px 24px; flex-shrink:0; background:linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.92) 30%, rgba(255,255,255,.98)); }
      .ai-input-box { max-width:860px; margin:0 auto; display:flex; gap:10px; align-items:flex-end; border:1.5px solid #DDE6F0; border-radius:8px; padding:12px 14px; background:#fff; transition:border-color 0.15s, box-shadow .15s; box-shadow:0 16px 38px rgba(15,23,42,0.08); }
      .ai-input-box:focus-within { border-color:#0B1220; box-shadow:0 18px 46px rgba(15,23,42,0.12); }
      .ai-input-box input { flex:1; border:none; background:transparent; font-size:0.94rem; outline:none; padding:6px 0; font-family:inherit; color:#0B1220; }
      .ai-input-box input::placeholder { color:#94A3B8; }
      .ai-send-circle { width:36px; height:36px; border-radius:8px; background:#0B1220; color:#fff; border:none; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:opacity 0.15s, transform .15s; }
      .ai-send-circle:hover { transform:translateY(-1px); }
      .ai-send-circle:hover { opacity:0.8; }
      .ai-send-circle:disabled { opacity:0.2; }
      .ai-attach-btn { width:36px; height:36px; border-radius:8px; background:#F8FAFC; border:1px solid #E2E8F0; font-size:1.1rem; padding:0; color:#64748B; flex-shrink:0; transition:color 0.15s, background .15s; }
      .ai-attach-btn:hover { color:#0B1220; background:#F1F5F9; }
      .ai-msg-row { max-width:860px; width:100%; margin:0 auto; padding:14px 26px; }
      .ai-msg-row--user { text-align:right; }
      .ai-msg-row--ai { }
      .ai-msg-label { font-size:0.72rem; font-weight:950; color:#64748B; margin-bottom:6px; }
      .ai-msg-row--user .ai-msg-label { color:#94A3B8; }
      .ai-msg-text { display:inline-block; max-width:min(720px, 88%); font-size:0.92rem; line-height:1.75; text-align:left; border-radius:8px; padding:14px 16px; box-shadow:0 12px 28px rgba(15,23,42,.06); }
      .ai-msg-row--user .ai-msg-text { background:#0B1220; color:#fff; }
      .ai-msg-row--ai .ai-msg-text { background:rgba(255,255,255,.92); border:1px solid #E2E8F0; color:#253044; }
      .ai-msg-text img { max-width:100%; max-height:240px; border-radius:8px; margin:8px 0; }
      .ai-health-bar { position:relative; z-index:2; max-width:860px; margin:0 auto; padding:0 26px 12px; }
      .ai-health-bar__inner { display:flex; gap:8px; padding-top:12px; }
      .ai-health-bar .form-input { background:rgba(255,255,255,.92); border-color:#DDE6F0; }
      @media (max-width:768px) {
        .ai-sidebar { display:none; }
        .ai-main__header { padding:12px 16px; align-items:flex-start; flex-direction:column; }
        .ai-main__tabs { width:100%; }
        .ai-main__tab { flex:1; min-width:0; }
        .ai-chat-center, .ai-msg-row, .ai-health-bar { padding-left:16px; padding-right:16px; }
        .ai-welcome-shell { grid-template-columns:1fr; }
        .ai-side-photo { display:none; }
        .ai-welcome-center { padding:24px 18px; }
        .ai-welcome-center h2 { font-size:1.5rem; }
        .ai-mode-grid, .ai-quick-grid { grid-template-columns:1fr; }
        .ai-input-area { padding:12px 16px 16px; }
      }
    </style>

    <div class="ai-layout">
      <!-- 사이드바 -->
      <div class="ai-sidebar">
        <div class="ai-sidebar__header">
          <button class="ai-sidebar__new" onclick="startNewAiSession()">+ 새 대화</button>
        </div>
        <div class="ai-sidebar__list" id="ai-sidebar-list"></div>
      </div>

      <!-- 메인 채팅 -->
      <div class="ai-main">
        <div class="ai-main__header">
          <div class="ai-main__brand">
            <div class="ai-main__mark">${icon('sparkles', 17, '#2563EB')}</div>
            <div>
              <strong>반려견 상담</strong>
              <span>사진, 증상, 행동 고민을 한 곳에서 정리해요</span>
            </div>
          </div>
          <div class="ai-main__tabs">
            <button id="ai-tab-training" class="ai-main__tab active" onclick="switchAiMode('training')">훈련/행동</button>
            <button id="ai-tab-health" class="ai-main__tab" onclick="switchAiMode('health')">건강/증상</button>
          </div>
        </div>

        <div id="ai-health-fields" style="display:none;">
          <div class="ai-health-bar">
            <div class="ai-health-bar__inner" style="padding-top:12px;">
              <div style="position:relative; flex:1;">
                <input type="text" id="ai-breed" class="form-input" placeholder="품종 검색..." autocomplete="off" style="font-size:0.82rem; padding:6px 10px; border-radius:8px; width:100%;" oninput="filterBreedDropdown(this.value)" onfocus="showBreedDropdown()" onblur="setTimeout(()=>hideBreedDropdown(),200)">
                <div id="ai-breed-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:180px; overflow-y:auto; background:#fff; border:1px solid #e5e3e0; border-radius:8px; margin-top:4px; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                </div>
              </div>
              <input type="text" id="ai-age" class="form-input" placeholder="나이" style="font-size:0.82rem; padding:6px 10px; border-radius:8px; width:80px;">
            </div>
          </div>
        </div>

        <div class="ai-chat-area" id="ai-chat"></div>

        <div class="ai-input-area">
            <div class="ai-input-box" id="ai-input-wrap" ondragover="event.preventDefault();this.style.borderColor='#0B1220'" ondragleave="this.style.borderColor='#DDE6F0'" ondrop="event.preventDefault();this.style.borderColor='#DDE6F0';handleAiDrop(event)">
            <button class="ai-attach-btn" onclick="document.getElementById('ai-file').click()" title="사진 첨부">+</button>
            <input type="file" id="ai-file" accept="image/*,video/*" style="display:none;" onchange="handleAiFileSelect(this)">
            <div style="flex:1; min-width:0;">
              <div id="ai-file-preview" style="display:none; margin-bottom:6px;"></div>
              <input type="text" id="ai-input" placeholder="무엇이든 물어보세요" onkeydown="if(event.key==='Enter')handleAiChat()" onpaste="handleAiPaste(event)">
            </div>
            <button class="ai-send-circle" onclick="handleAiChat()" id="ai-send-btn">&#x2191;</button>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  updateAiModeDesc();
  restoreAiChat();
  _renderAiSidebar();

  // 세션 목록 로드
  if (user) loadAiSessionList(user.id);
}

// 세션 목록 로드
async function loadAiSessionList(userId) {
  try {
    const res = await fetch('/api/chat/' + userId + '/sessions');
    if (res.ok) _aiSessionList = await res.json();
  } catch(e) { _aiSessionList = []; }
  _renderAiSidebar();
}

// 세션 목록 패널 토글
function toggleAiSessions() {
  _renderAiSidebar();
}

function _renderAiSidebar() {
  const list = document.getElementById('ai-sidebar-list');
  if (!list) return;

  if (_aiSessionList.length === 0) {
    list.innerHTML = '<div style="padding:16px; text-align:center; font-size:0.78rem; color:#999;">이전 대화가 없어요</div>';
    return;
  }

  list.innerHTML = _aiSessionList.map(s => {
    const isActive = _aiCurrentSession && _aiCurrentSession.id === s.id;
    return '<div class="ai-sidebar__item' + (isActive ? ' active' : '') + '" onclick="loadAiSession(\'' + s.id + '\')">' +
      '<span class="ai-sidebar__item-title">' + s.title + '</span>' +
      '<button class="ai-sidebar__item-del" onclick="event.stopPropagation();deleteAiSession(\'' + s.id + '\')" title="삭제">✕</button>' +
    '</div>';
  }).join('');
}

function renderAiSessionList() {
  const panel = document.getElementById('ai-sessions-panel');
  if (!panel) return;

  if (_aiSessionList.length === 0) {
    panel.innerHTML = '<div class="card" style="padding:16px;text-align:center;color:var(--color-text-muted);font-size:0.85rem;">이전 대화가 없어요.</div>';
    return;
  }

  const modeIcon = { training: '🐾', health: '🩺' };
  const items = _aiSessionList.map(s => {
    const date = new Date(s.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const isActive = _aiCurrentSession && _aiCurrentSession.id === s.id;
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--color-border);' + (isActive ? 'background:var(--color-bg-warm);' : '') + '"><span onclick="loadAiSession(\'' + s.id + '\')" style="cursor:pointer;">' + (modeIcon[s.mode] || '💬') + '</span><div style="flex:1;min-width:0;cursor:pointer;" onclick="loadAiSession(\'' + s.id + '\')"><div id="session-title-' + s.id + '" style="font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + s.title + '</div><div style="font-size:0.75rem;color:var(--color-text-muted);">' + date + ' · ' + s.messageCount + '개 메시지</div></div><button onclick="event.stopPropagation();editSessionTitle(\'' + s.id + '\')" style="background:none;border:none;cursor:pointer;font-size:0.8rem;color:var(--color-text-muted);" title="제목 수정">✏️</button><button onclick="event.stopPropagation();deleteAiSession(\'' + s.id + '\')" style="background:none;border:none;cursor:pointer;font-size:0.9rem;color:var(--color-text-muted);" title="삭제">🗑️</button></div>';
  }).join('');

  panel.innerHTML = '<div class="card" style="padding:0;max-height:300px;overflow-y:auto;">' + items + '</div>';
}

// 세션 제목 수정
function editSessionTitle(sessionId) {
  const titleEl = document.getElementById('session-title-' + sessionId);
  if (!titleEl) return;
  const currentTitle = titleEl.textContent;
  titleEl.innerHTML = '<div style="display:flex;gap:4px;"><input type="text" id="edit-title-input-' + sessionId + '" class="form-input" value="' + currentTitle.replace(/"/g, '&quot;') + '" maxlength="30" style="font-size:0.82rem;padding:4px 8px;height:28px;" onkeydown="if(event.key===\'Enter\')confirmEditTitle(\'' + sessionId + '\');if(event.key===\'Escape\')renderAiSessionList();"><button onclick="confirmEditTitle(\'' + sessionId + '\')" style="background:var(--color-primary);color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:0.75rem;cursor:pointer;">✓</button></div>';
  const input = document.getElementById('edit-title-input-' + sessionId);
  if (input) { input.focus(); input.select(); }
}

async function confirmEditTitle(sessionId) {
  const input = document.getElementById('edit-title-input-' + sessionId);
  if (!input) return;
  const newTitle = input.value.trim();
  if (!newTitle) return;

  const user = AuthService.getCurrentUser();
  if (!user) return;

  // 서버에 저장
  try {
    // 세션 데이터 가져와서 제목만 변경
    const res = await fetch('/api/chat/' + user.id + '/session/' + sessionId);
    if (res.ok) {
      const session = await res.json();
      session.title = newTitle;
      await fetch('/api/chat/' + user.id + '/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, title: newTitle, mode: session.mode, messages: session.messages })
      });
    }
  } catch(e) {}

  // 로컬 목록 업데이트
  const s = _aiSessionList.find(x => x.id === sessionId);
  if (s) s.title = newTitle;
  if (_aiCurrentSession && _aiCurrentSession.id === sessionId) _aiCurrentSession.title = newTitle;

  renderAiSessionList();
}

// 새 대화 시작
function startNewAiSession() {
  // 현재 세션 저장
  saveCurrentSession();
  // 새 세션
  _aiCurrentSession = { id: StorageService.generateId(), title: '새 대화', mode: _aiChatMode, messages: [] };
  restoreAiChat();
  const sessionsPanel = document.getElementById('ai-sessions-panel');
  if (sessionsPanel) sessionsPanel.style.display = 'none';
}

// 이전 세션 로드
async function loadAiSession(sessionId) {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  // 현재 세션 먼저 저장
  saveCurrentSession();

  try {
    const res = await fetch('/api/chat/' + user.id + '/session/' + sessionId);
    if (res.ok) {
      const session = await res.json();
      _aiCurrentSession = session;
      _aiChatMode = session.mode || 'training';

      // 탭 상태 업데이트
      document.getElementById('ai-tab-training')?.classList.toggle('active', _aiChatMode === 'training');
      document.getElementById('ai-tab-health')?.classList.toggle('active', _aiChatMode === 'health');
      const healthFields = document.getElementById('ai-health-fields');
      if (healthFields) healthFields.style.display = _aiChatMode === 'health' ? 'block' : 'none';
      updateAiModeDesc();
      restoreAiChat();
      const sessionsPanel = document.getElementById('ai-sessions-panel');
      if (sessionsPanel) sessionsPanel.style.display = 'none';
    }
  } catch(e) { console.warn('세션 로드 실패:', e); }
}

// 세션 삭제
async function deleteAiSession(sessionId) {
  if (!confirm('이 대화를 삭제할까요?')) return;
  const user = AuthService.getCurrentUser();
  if (!user) return;

  try {
    await fetch('/api/chat/' + user.id + '/session/' + sessionId, { method: 'DELETE' });
    _aiSessionList = _aiSessionList.filter(s => s.id !== sessionId);
    renderAiSessionList();
    // 현재 세션이 삭제된 경우 새 대화 시작
    if (_aiCurrentSession && _aiCurrentSession.id === sessionId) {
      startNewAiSession();
    }
  } catch(e) {}
}

// 현재 세션 서버에 저장
async function saveCurrentSession() {
  const user = AuthService.getCurrentUser();
  if (!user || !_aiCurrentSession || _aiCurrentSession.messages.length === 0) return;

  // 첫 사용자 메시지로 제목 자동 생성
  if (_aiCurrentSession.title === '새 대화') {
    const firstMsg = _aiCurrentSession.messages.find(m => m.role === 'user');
    if (firstMsg) {
      _aiCurrentSession.title = firstMsg.text.substring(0, 30) + (firstMsg.text.length > 30 ? '...' : '');
    }
  }

  try {
    await fetch('/api/chat/' + user.id + '/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: _aiCurrentSession.id,
        title: _aiCurrentSession.title,
        mode: _aiCurrentSession.mode || _aiChatMode,
        messages: _aiCurrentSession.messages
      })
    });
    // 세션 목록 갱신
    await loadAiSessionList(user.id);
  } catch(e) {}
}

function updateAiModeDesc() {
  // ChatGPT 스타일에서는 모드 설명을 별도로 표시하지 않음
}

function restoreAiChat() {
  const chatEl = document.getElementById('ai-chat');
  if (!chatEl) return;
  const messages = (_aiCurrentSession && _aiCurrentSession.messages) || [];

  if (messages.length === 0) {
    chatEl.innerHTML = `
    <div class="ai-chat-center">
      <div class="ai-welcome-shell">
        <div class="ai-welcome-center">
          <div class="ai-welcome-kicker">${icon('message-circle', 14, '#175CD3')} AI CARE ROOM</div>
          <h2>오늘 아이에게 어떤 신호가 있었나요?</h2>
          <p>행동 고민부터 건강 증상, 사진 상담까지 한 화면에서 정리해요. 답변은 보호자의 판단을 돕는 참고 정보이며, 응급 상황은 병원 진료를 우선해요.</p>
          <div class="ai-mode-grid">
            <div onclick="selectAiModeCard('training')" class="ai-mode-card selected" id="ai-mode-card-training">
              <div class="ai-mode-card__title">${icon('activity', 15, '#0F766E')} 훈련 / 행동</div>
              <div class="ai-mode-card__desc">짖음, 분리불안, 산책 매너, 사회화 루틴을 단계별로 정리해요.</div>
            </div>
            <div onclick="selectAiModeCard('health')" class="ai-mode-card" id="ai-mode-card-health">
              <div class="ai-mode-card__title">${icon('stethoscope', 15, '#2563EB')} 건강 / 증상</div>
              <div class="ai-mode-card__desc">구토, 피부, 눈, 귀, 식욕 변화처럼 병원 방문 전 확인할 점을 정리해요.</div>
            </div>
          </div>
          <div class="ai-quick-grid">
            <button class="ai-quick-chip" onclick="prefillAiPrompt('산책 중 줄을 너무 당겨요. 어떻게 훈련하면 좋을까요?', 'training')">줄 당김 훈련</button>
            <button class="ai-quick-chip" onclick="prefillAiPrompt('혼자 있을 때 계속 짖고 불안해해요. 분리불안일까요?', 'training')">분리불안</button>
            <button class="ai-quick-chip" onclick="prefillAiPrompt('오늘 갑자기 토했어요. 어떤 점을 확인해야 하나요?', 'health')">구토 증상</button>
            <button class="ai-quick-chip" onclick="prefillAiPrompt('피부를 계속 긁는데 사진을 첨부해서 봐줄 수 있나요?', 'health')">사진 상담</button>
          </div>
          <div id="ai-mode-detail" class="ai-disclaimer">
            훈련/행동 모드가 선택되어 있어요. 생활 환경, 산책 루틴, 반복되는 상황을 함께 적으면 더 구체적으로 답해요.
          </div>
        </div>
        <div class="ai-side-photo">
          <div class="ai-side-photo__copy">
            <strong>사진도 함께 볼 수 있어요</strong>
            <span>피부, 눈, 귀처럼 시각 정보가 중요한 상담은 이미지를 첨부해 주세요.</span>
          </div>
        </div>
      </div>
    </div>`;
    return;
  }

  let html = '<div class="ai-chat-center">';
  messages.forEach(msg => {
    if (msg.role === 'user') {
      let imgHtml = '';
      if (msg.imageData) imgHtml = '<img src="' + msg.imageData + '">';
      html += '<div class="ai-msg-row ai-msg-row--user"><div class="ai-msg-label">나</div><div class="ai-msg-text">' + imgHtml + msg.text + '</div></div>';
    } else {
      const formatted = msg.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html += '<div class="ai-msg-row ai-msg-row--ai"><div class="ai-msg-label">Pawsitive AI</div><div class="ai-msg-text">' + formatted + '</div></div>';
    }
  });
  html += '</div>';
  chatEl.innerHTML = html;
  chatEl.scrollTop = chatEl.scrollHeight;
}

function switchAiMode(mode) {
  _aiChatMode = mode;
  if (_aiCurrentSession) _aiCurrentSession.mode = mode;

  const tabT = document.getElementById('ai-tab-training');
  const tabH = document.getElementById('ai-tab-health');
  if (tabT) tabT.classList.toggle('active', mode === 'training');
  if (tabH) tabH.classList.toggle('active', mode === 'health');

  const healthFields = document.getElementById('ai-health-fields');
  if (healthFields) healthFields.style.display = mode === 'health' ? 'block' : 'none';
  updateAiModeDesc();

  const input = document.getElementById('ai-input');
  if (input) input.placeholder = mode === 'training' ? '훈련/행동 관련 질문을 입력해주세요...' : '증상이나 건강 관련 질문을 입력해주세요...';
}

function selectAiModeCard(mode) {
  _aiChatMode = mode;
  if (_aiCurrentSession) _aiCurrentSession.mode = mode;

  // 카드 하이라이트
  const cards = document.querySelectorAll('.ai-mode-card');
  cards.forEach(c => { c.classList.remove('selected'); c.style.borderColor = ''; c.style.background = ''; });
  const selected = document.getElementById('ai-mode-card-' + mode);
  if (selected) {
    selected.classList.add('selected');
    selected.style.borderColor = '#0B1220';
    selected.style.background = '#F8FAFC';
  }

  // 상단 탭도 동기화
  const tabT = document.getElementById('ai-tab-training');
  const tabH = document.getElementById('ai-tab-health');
  if (tabT) tabT.classList.toggle('active', mode === 'training');
  if (tabH) tabH.classList.toggle('active', mode === 'health');

  const healthFields = document.getElementById('ai-health-fields');
  if (healthFields) healthFields.style.display = mode === 'health' ? 'block' : 'none';

  // 설명 표시
  const detail = document.getElementById('ai-mode-detail');
  if (detail) {
    if (mode === 'training') {
      detail.innerHTML = '훈련/행동 모드가 선택되어 있어요. 생활 환경, 산책 루틴, 반복되는 상황을 함께 적으면 더 구체적으로 답해요.';
    } else {
      detail.innerHTML = '건강/증상 모드가 선택되어 있어요. 품종, 나이, 증상 시작 시점, 식욕/활력 변화를 같이 적으면 좋아요.';
    }
  }

  // 입력창 포커스
  const input = document.getElementById('ai-input');
  if (input) {
    input.placeholder = mode === 'training' ? '훈련/행동 관련 질문을 입력해주세요...' : '증상이나 건강 관련 질문을 입력해주세요...';
    input.focus();
  }
}

function prefillAiPrompt(text, mode) {
  selectAiModeCard(mode || 'training');
  const input = document.getElementById('ai-input');
  if (input) {
    input.value = text;
    input.focus();
  }
}

function showBreedDropdown() {
  filterBreedDropdown(document.getElementById('ai-breed')?.value || '');
  document.getElementById('ai-breed-dropdown').style.display = 'block';
}

function hideBreedDropdown() {
  document.getElementById('ai-breed-dropdown').style.display = 'none';
}

function filterBreedDropdown(query) {
  const dropdown = document.getElementById('ai-breed-dropdown');
  if (!dropdown || typeof BREEDS_DATA === 'undefined') return;

  const q = query.toLowerCase().trim();
  const filtered = q ? BREEDS_DATA.filter(b => b.name.toLowerCase().includes(q) || (b.nameEn && b.nameEn.toLowerCase().includes(q))).slice(0, 20) : BREEDS_DATA.slice(0, 20);

  if (filtered.length === 0) {
    dropdown.innerHTML = '<div style="padding:10px 12px; font-size:0.78rem; color:#999;">검색 결과가 없어요</div>';
    dropdown.style.display = 'block';
    return;
  }

  const sizeLabel = { small: '소형', medium: '중형', large: '대형' };
  dropdown.innerHTML = filtered.map(b =>
    '<div onclick="selectBreed(\'' + b.name.replace(/'/g, "\\'") + '\')" style="padding:8px 12px; font-size:0.82rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:background 0.1s;" onmouseover="this.style.background=\'#f5f3f0\'" onmouseout="this.style.background=\'#fff\'">' +
      '<span>' + b.name + '</span>' +
      '<span style="font-size:0.7rem; color:#999;">' + (sizeLabel[b.size] || '') + '</span>' +
    '</div>'
  ).join('');
  dropdown.style.display = 'block';
}

function selectBreed(name) {
  const input = document.getElementById('ai-breed');
  if (input) input.value = name;
  hideBreedDropdown();
}

function clearAiChat() {
  if (!confirm('현재 대화를 초기화하고 새 대화를 시작할까요?')) return;
  startNewAiSession();
}

// AI 클립보드 붙여넣기 (Ctrl+V 스크린샷)
function handleAiPaste(event) {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault();
      const file = item.getAsFile();
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 크기는 10MB 이하만 가능해요.');
        return;
      }
      _processAiFile(file);
      return;
    }
  }
}

// AI 파일 첨부 관련
let _aiAttachedFile = null; // { base64, mimeType, name }

function handleAiFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하만 가능해요.');
    input.value = '';
    return;
  }
  _processAiFile(file);
  input.value = '';
}

function removeAiFile() {
  _aiAttachedFile = null;
  const preview = document.getElementById('ai-file-preview');
  if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
  const fileInput = document.getElementById('ai-file');
  if (fileInput) fileInput.value = '';
}

function handleAiDrop(event) {
  const file = event.dataTransfer.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    alert('이미지 또는 영상 파일만 첨부할 수 있어요.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하만 가능해요.');
    return;
  }
  _processAiFile(file);
}

function _processAiFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Full = e.target.result;
    const base64Data = base64Full.split(',')[1];
    _aiAttachedFile = { base64: base64Data, mimeType: file.type, name: file.name };
    const preview = document.getElementById('ai-file-preview');
    if (preview) {
      if (file.type.startsWith('image/')) {
        preview.innerHTML = '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;background:var(--color-bg-warm);border-radius:8px;position:relative;"><img src="' + base64Full + '" style="height:48px;max-width:120px;object-fit:cover;border-radius:6px;"><button onclick="removeAiFile()" style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:#333;color:#fff;border:none;font-size:0.6rem;display:flex;align-items:center;justify-content:center;cursor:pointer;">✕</button></div>';
      } else {
        preview.innerHTML = '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;background:var(--color-bg-warm);border-radius:8px;"><span style="font-size:1rem;">🎬</span><span style="font-size:0.78rem;font-weight:600;">' + file.name + '</span><button onclick="removeAiFile()" style="background:none;border:none;cursor:pointer;font-size:0.9rem;">✕</button></div>';
      }
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

async function handleAiChat() {
  const input = document.getElementById('ai-input');
  const chatEl = document.getElementById('ai-chat');
  const btn = document.getElementById('ai-send-btn');
  const message = input?.value?.trim();
  if (!message) return;

  // 비로그인 시 로그인 유도
  const user = AuthService.getCurrentUser();
  if (!user) {
    chatEl.innerHTML += `<div style="display:flex;margin-bottom:12px;"><div style="background:var(--color-bg-warm);padding:14px 18px;border-radius:16px 16px 16px 4px;max-width:85%;font-size:0.9rem;">
      🔒 AI 상담을 이용하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a> 또는 <a href="#/register" style="color:var(--color-primary, #7C4DFF); font-weight:700;">회원가입</a>이 필요해요!
    </div></div>`;
    chatEl.scrollTop = chatEl.scrollHeight;
    return;
  }

  input.value = '';

  // 첫 메시지면 환영 카드 제거
  if (_aiCurrentSession.messages.length === 0) chatEl.innerHTML = '';

  // 사용자 메시지 표시 (이미지 포함)
  let imgHtml = '';
  if (_aiAttachedFile && _aiAttachedFile.mimeType.startsWith('image/')) {
    imgHtml = '<img src="data:' + _aiAttachedFile.mimeType + ';base64,' + _aiAttachedFile.base64 + '">';
  }
  chatEl.innerHTML += '<div class="ai-msg-row ai-msg-row--user"><div class="ai-msg-label">나</div><div class="ai-msg-text">' + imgHtml + message + '</div></div>';

  // 로딩
  chatEl.innerHTML += '<div class="ai-msg-row ai-msg-row--ai" id="ai-loading"><div class="ai-msg-label">Pawsitive AI</div><div class="ai-msg-text"><div class="spinner" style="width:20px;height:20px;"></div></div></div>';
  chatEl.scrollTop = chatEl.scrollHeight;
  if (btn) btn.disabled = true;

  const msgObj = { role: 'user', text: message };
  if (_aiAttachedFile && _aiAttachedFile.mimeType.startsWith('image/')) {
    msgObj.imageData = 'data:' + _aiAttachedFile.mimeType + ';base64,' + _aiAttachedFile.base64;
  }
  _aiCurrentSession.messages.push(msgObj);

  try {
    let apiUrl, body;
    const hasFile = !!_aiAttachedFile;

    if (hasFile) {
      // 이미지 첨부 → 멀티모달 API
      apiUrl = '/api/ai/consult-with-image';
      body = JSON.stringify({
        message,
        imageBase64: _aiAttachedFile.base64,
        mimeType: _aiAttachedFile.mimeType,
        history: _aiCurrentSession.messages,
        mode: _aiChatMode,
        aiName: 'Pawsitive AI'
      });
      // 파일 첨부 초기화
      removeAiFile();
    } else if (_aiChatMode === 'health') {
      const breed = document.getElementById('ai-breed')?.value || '';
      const age = document.getElementById('ai-age')?.value || '';
      apiUrl = '/api/ai/consult';
      const healthPrefix = '[건강/질병 상담 모드] ';
      const breedInfo = breed ? '품종: ' + breed + '. ' : '';
      const ageInfo = age ? '나이: ' + age + '. ' : '';
      const user = AuthService.getCurrentUser();
      body = JSON.stringify({
        message: healthPrefix + breedInfo + ageInfo + message,
        history: _aiCurrentSession.messages,
        mode: 'health',
        aiName: 'Pawsitive AI',
        userId: user?.id || null
      });
    } else {
      apiUrl = '/api/ai/consult';
      const user = AuthService.getCurrentUser();
      body = JSON.stringify({
        message,
        history: _aiCurrentSession.messages,
        mode: 'training',
        aiName: 'Pawsitive AI',
        userId: user?.id || null
      });
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const data = await res.json();

    const loading = document.getElementById('ai-loading');
    if (loading) loading.remove();

    const reply = data.reply || data.analysis || data.error || '응답을 받지 못했어요.';
    const isSuccess = data.success !== false;

    if (isSuccess) {
      const formatted = reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      chatEl.innerHTML += '<div class="ai-msg-row ai-msg-row--ai"><div class="ai-msg-label">Pawsitive AI</div><div class="ai-msg-text">' + formatted + '</div></div>';
      _aiCurrentSession.messages.push({ role: 'ai', text: reply });
    } else {
      chatEl.innerHTML += '<div class="alert alert-error" style="margin-bottom:12px;">' + reply + '</div>';
    }

    // 메모리 저장
    const user = AuthService.getCurrentUser();
    if (user) saveCurrentSession();

  } catch (e) {
    const loading = document.getElementById('ai-loading');
    if (loading) loading.remove();
    chatEl.innerHTML += '<div class="alert alert-error" style="margin-bottom:12px;">서버 연결에 실패했습니다.</div>';
  }

  if (btn) btn.disabled = false;
  chatEl.scrollTop = chatEl.scrollHeight;
}


// --- AI 증상 분석 페이지 (레거시 - /ai-symptom 직접 접근 시) ---
function renderAiSymptomPage() {
  const user = AuthService.getCurrentUser();

  renderPage(`
    <div class="page-header">
      <h1>🩺 AI 질병 분석</h1>
      <p>우리 아이 증상을 입력하면 AI가 분석해줘요~ 🐾</p>
    </div>

    <div class="card" style="padding:24px; margin-bottom:20px;">
      <div class="form-group">
        <label for="symptom-breed">품종</label>
        <select id="symptom-breed" class="form-select">
          <option value="">선택해주세요 (선택)</option>
          ${typeof BREEDS_DATA !== 'undefined' ? BREEDS_DATA.map(b => `<option value="${b.name}">${b.name}</option>`).join('') : ''}
        </select>
      </div>
      <div class="form-group">
        <label for="symptom-age">나이</label>
        <input type="text" id="symptom-age" class="form-input" placeholder="예: 3살">
      </div>
      <div class="form-group">
        <label for="symptom-text">증상 설명</label>
        <textarea id="symptom-text" class="form-input" placeholder="우리 아이가 어떤 증상을 보이나요? 자세히 적어주세요~&#10;예: 어제부터 밥을 안 먹고, 구토를 2번 했어요. 기운이 없고 축 처져있어요." style="min-height:120px;"></textarea>
      </div>
      <button class="btn btn-primary" style="width:100%;" onclick="handleAiSymptom()" id="symptom-btn">🩺 AI 분석하기</button>
    </div>

    <div id="symptom-result"></div>
  `);
}

async function handleAiSymptom() {
  const symptoms = document.getElementById('symptom-text')?.value;
  const breed = document.getElementById('symptom-breed')?.value;
  const age = document.getElementById('symptom-age')?.value;
  const resultEl = document.getElementById('symptom-result');
  const btn = document.getElementById('symptom-btn');

  if (!AuthService.getCurrentUser()) {
    if (resultEl) resultEl.innerHTML = `<div class="card" style="padding:20px; text-align:center; background:var(--color-bg-warm);">🔒 AI 분석을 이용하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a>이 필요해요!</div>`;
    return;
  }

  if (!symptoms || !symptoms.trim()) {
    if (resultEl) resultEl.innerHTML = '<div class="alert alert-error">증상을 입력해주세요.</div>';
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = '분석 중... 🔍'; }
  if (resultEl) resultEl.innerHTML = '<div style="text-align:center; padding:32px;"><div class="spinner"></div><p style="margin-top:12px; color:var(--color-text-muted);">AI가 분석하고 있어요...</p></div>';

  try {
    const res = await fetch('/api/ai/symptom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, breed, age })
    });
    const data = await res.json();

    if (data.success) {
      const formatted = data.analysis.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      resultEl.innerHTML = `
        <div class="card" style="padding:24px;">
          <h3 style="margin-bottom:16px; font-weight:800;">🩺 AI 분석 결과</h3>
          <div style="line-height:1.8; font-size:0.92rem;">${formatted}</div>
        </div>
      `;
    } else {
      resultEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
    }
  } catch (e) {
    resultEl.innerHTML = '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
  }

  if (btn) { btn.disabled = false; btn.textContent = '🩺 AI 분석하기'; }
}

// --- AI 상담 페이지 ---
function renderAiConsultPage() {
  const user = AuthService.getCurrentUser();

  renderPage(`
    <div class="page-header">
      <h1>💭 AI 훈련사 상담</h1>
      <p>문제 행동이나 고민이 있으면 AI 훈련사에게 물어봐요~ 🐾</p>
    </div>

    <div id="consult-chat" style="margin-bottom:16px;">
      <div class="card" style="padding:20px; text-align:center; color:var(--color-text-light);">
        <div style="font-size:2.5rem; margin-bottom:8px;">🐕‍🦺</div>
        <p style="font-weight:700;">안녕하세요! AI 훈련사예요~</p>
        <p style="font-size:0.85rem; margin-top:4px;">반려견 행동 문제나 훈련 방법에 대해 물어봐주세요!</p>
      </div>
    </div>

    <div style="display:flex; gap:8px; position:sticky; bottom:16px;">
      <input type="text" id="consult-input" class="form-input" placeholder="고민을 입력해주세요..." style="flex:1;" onkeydown="if(event.key==='Enter')handleAiConsult()">
      <button class="btn btn-primary" onclick="handleAiConsult()" id="consult-btn">전송</button>
    </div>
  `);

  // 대화 내역 초기화
  window._consultHistory = [];
}

async function handleAiConsult() {
  const input = document.getElementById('consult-input');
  const chatEl = document.getElementById('consult-chat');
  const btn = document.getElementById('consult-btn');
  const message = input?.value?.trim();

  if (!message) return;

  if (!AuthService.getCurrentUser()) {
    chatEl.innerHTML += `<div style="display:flex;margin-bottom:12px;"><div style="background:var(--color-bg-warm);padding:14px 18px;border-radius:16px 16px 16px 4px;max-width:85%;font-size:0.9rem;">
      🔒 AI 상담을 이용하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a> 또는 <a href="#/register" style="color:var(--color-primary, #7C4DFF); font-weight:700;">회원가입</a>이 필요해요!
    </div></div>`;
    chatEl.scrollTop = chatEl.scrollHeight;
    return;
  }

  input.value = '';

  // 사용자 메시지 표시
  chatEl.innerHTML += `
    <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
      <div style="background:var(--color-primary); color:#fff; padding:12px 16px; border-radius:16px 16px 4px 16px; max-width:75%; font-size:0.9rem;">${message}</div>
    </div>
  `;

  // 로딩 표시
  chatEl.innerHTML += `
    <div id="consult-loading" style="display:flex; margin-bottom:12px;">
      <div style="background:var(--color-bg-warm); padding:12px 16px; border-radius:16px 16px 16px 4px; max-width:75%;"><div class="spinner" style="width:20px;height:20px;"></div></div>
    </div>
  `;
  chatEl.scrollTop = chatEl.scrollHeight;

  if (btn) { btn.disabled = true; }
  window._consultHistory.push({ role: 'user', text: message });

  try {
    const res = await fetch('/api/ai/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: window._consultHistory })
    });
    const data = await res.json();

    // 로딩 제거
    const loading = document.getElementById('consult-loading');
    if (loading) loading.remove();

    if (data.success) {
      const formatted = data.reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      chatEl.innerHTML += `
        <div style="display:flex; margin-bottom:12px;">
          <div style="background:var(--color-bg-warm); border:2px solid var(--color-border); padding:12px 16px; border-radius:16px 16px 16px 4px; max-width:75%; font-size:0.9rem; line-height:1.7;">${formatted}</div>
        </div>
      `;
      window._consultHistory.push({ role: 'ai', text: data.reply });
    } else {
      chatEl.innerHTML += `<div class="alert alert-error">${data.error}</div>`;
    }
  } catch (e) {
    const loading = document.getElementById('consult-loading');
    if (loading) loading.remove();
    chatEl.innerHTML += '<div class="alert alert-error">서버 연결에 실패했습니다.</div>';
  }

  if (btn) { btn.disabled = false; }
  chatEl.scrollTop = chatEl.scrollHeight;
}
