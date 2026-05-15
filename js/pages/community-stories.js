// Pawsitive - Community Stories
// 24시간 스토리 + 보관함 기능

function getStories() {
  return StorageService.get('stories', []);
}

function saveStories(stories) {
  StorageService.set('stories', stories);
}

function getActiveStories() {
  const now = Date.now();
  return getStories().filter(s => s.expiresAt > now);
}

function getArchivedStories(userId) {
  const now = Date.now();
  return getStories().filter(s => s.authorId === userId && s.expiresAt <= now)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createStory(data) {
  const stories = getStories();
  const now = Date.now();
  const story = {
    id: 'story-' + now + '-' + Math.random().toString(36).slice(2, 7),
    authorId: data.authorId,
    authorName: data.authorName,
    authorProfileImage: data.authorProfileImage || '',
    imageData: data.imageData || '',
    text: data.text || '',
    createdAt: new Date().toISOString(),
    expiresAt: now + 24 * 60 * 60 * 1000,
    viewedBy: [],
    reactions: {},
    comments: []
  };
  stories.push(story);
  saveStories(stories);
  return story;
}

function markStoryViewed(storyId, userId) {
  if (!userId) return;
  const stories = getStories();
  const story = stories.find(s => s.id === storyId);
  if (story && !story.viewedBy.includes(userId)) {
    story.viewedBy.push(userId);
    saveStories(stories);
  }
}

// 활성 스토리를 작성자별로 묶기
function getStoryGroups() {
  const active = getActiveStories();
  const map = {};
  active.forEach(s => {
    if (!map[s.authorId]) {
      map[s.authorId] = {
        authorId: s.authorId,
        authorName: s.authorName,
        authorProfileImage: s.authorProfileImage,
        stories: []
      };
    }
    map[s.authorId].stories.push(s);
  });
  return Object.values(map);
}

// ─── 스토리 바 렌더링 (홈 탭 상단) ───

function renderStoryBar(user) {
  // 비로그인 시 스토리 전체 숨김 (게시물은 볼 수 있음)
  if (!user) return '';

  const groups = getStoryGroups();
  const uid = user.id;

  // 팔로우한 사람 목록 조회
  const storedUsers = StorageService.get('users', []);
  const me = storedUsers.find(u => u.id === uid);
  const following = (me && me.following) || [];

  const myGroup = groups.find(g => g.authorId === uid);
  // 내 스토리 + 팔로우한 사람의 스토리만 표시 (탈퇴한 회원 제외)
  const others = groups.filter(g => {
    if (g.authorId === uid) return false;
    if (!following.includes(g.authorId)) return false;
    // 탈퇴한 회원이면 제외
    if (!g.authorId.startsWith('sample-') && !storedUsers.find(u => u.id === g.authorId)) return false;
    return true;
  });
  const allGroups = myGroup ? [myGroup, ...others] : others;

  if (allGroups.length === 0) return '';

  return `
    <div class="story-bar">
      ${user ? `
        <div class="story-item" onclick="openStoryCreate()">
          <div class="story-ring story-ring--add">
            ${renderCommunityAvatar(user.profileImage, 'story-avatar')}
            <div class="story-add-icon">+</div>
          </div>
          <span class="story-name">내 스토리</span>
        </div>
      ` : ''}
      ${allGroups.map(group => {
        const hasUnviewed = uid && group.stories.some(s => !s.viewedBy.includes(uid));
        const ringClass = hasUnviewed ? 'story-ring story-ring--active' : 'story-ring story-ring--viewed';
        return `
          <div class="story-item" onclick="openStoryViewer('${group.authorId}')">
            <div class="${ringClass}">
              ${renderCommunityAvatar(group.authorProfileImage, 'story-avatar')}
            </div>
            <span class="story-name">${group.authorName.split(' ')[0].slice(0, 6)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ─── 스토리 만들기 모달 ───

let _storyImageData = null;

function openStoryCreate() {
  const user = AuthService.getCurrentUser();
  if (!user) { showLoginModal('스토리는 로그인 후 이용할 수 있어요.'); return; }

  _storyImageData = null;
  const modalId = 'story-create-modal';
  document.getElementById(modalId)?.remove();
  const modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'story-modal';
  modal.innerHTML = `
    <div class="story-create-card">
      <div class="story-create-header">
        <button onclick="document.getElementById('${modalId}').remove()" class="story-close-btn">×</button>
        <span>새 스토리</span>
        <button id="story-post-btn" class="btn btn-primary btn-sm" onclick="submitStory('${modalId}')" disabled>공유</button>
      </div>
      <div class="story-create-preview" id="story-preview-area">
        <label for="story-image-input" class="story-create-placeholder">
          <div class="story-create-placeholder-icon">${icon('image', 32)}</div>
          <span>사진을 선택하세요</span>
        </label>
      </div>
      <input type="file" id="story-image-input" accept="image/*" style="display:none;" onchange="handleStoryImageSelect(this, '${modalId}')">
      <div class="story-create-footer">
        <input type="text" id="story-text-input" placeholder="스토리에 텍스트 추가... (최대 60자)" maxlength="60"
          oninput="document.getElementById('story-post-btn').disabled = !_storyImageData && !this.value.trim()">
        <label for="story-image-input" class="story-add-photo-btn" title="사진 변경">${icon('image', 18)}</label>
      </div>
      <p style="font-size:0.75rem;color:var(--color-text-muted);margin:8px 0 0;text-align:center;">24시간 후 자동으로 보관함에 저장돼요</p>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function handleStoryImageSelect(input, modalId) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 10 * 1024 * 1024) { alert('10MB 이하 사진만 올릴 수 있어요.'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    _storyImageData = e.target.result;
    const area = document.getElementById('story-preview-area');
    if (area) {
      area.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
    }
    const btn = document.getElementById('story-post-btn');
    if (btn) btn.disabled = false;
  };
  reader.readAsDataURL(file);
}

function submitStory(modalId) {
  const user = AuthService.getCurrentUser();
  if (!user) return;
  const textInput = document.getElementById('story-text-input');
  const text = textInput ? textInput.value.trim() : '';

  if (!_storyImageData && !text) {
    showToast('사진이나 텍스트를 추가해주세요.', 'error');
    return;
  }

  createStory({
    authorId: user.id,
    authorName: user.nickname || user.name,
    authorProfileImage: user.profileImage || '',
    imageData: _storyImageData || '',
    text
  });

  _storyImageData = null;
  document.getElementById(modalId)?.remove();
  showToast('스토리가 공유됐어요! 24시간 후 보관함으로 이동돼요.', 'success');
  renderCommunityPage();
}

// ─── 스토리 뷰어 ───

let _storyViewerTimer = null;
let _storyHashHandler = null;

function openStoryViewer(authorId) {
  const groups = getStoryGroups();
  const idx = groups.findIndex(g => g.authorId === authorId);
  if (idx === -1) return;
  renderStoryViewer(groups, idx, 0);
}

// 스토리 반응 추가/토글
function addStoryReaction(storyId, emoji) {
  const user = AuthService.getCurrentUser();
  if (!user) { showLoginModal('반응은 로그인 후 이용할 수 있어요.'); return; }
  const stories = getStories();
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  if (!story.reactions) story.reactions = {};
  const wasReacted = story.reactions[user.id] === emoji;
  if (wasReacted) {
    delete story.reactions[user.id];
  } else {
    story.reactions[user.id] = emoji;
    if (story.authorId !== user.id) {
      const myName = user.nickname || user.name;
      addNotificationForUser(story.authorId, `${myName}님이 스토리에 ${emoji} 반응했어요`, 'like', { type: 'story', id: storyId });
    }
  }
  saveStories(stories);
  const myReaction = story.reactions[user.id];
  const reactionCounts = {};
  Object.values(story.reactions).forEach(e => { reactionCounts[e] = (reactionCounts[e] || 0) + 1; });
  const container = document.getElementById('story-reactions-' + storyId);
  if (container) {
    container.querySelectorAll('.story-reaction-btn').forEach(btn => {
      const e = btn.dataset.emoji;
      const cnt = reactionCounts[e] || 0;
      btn.innerHTML = e + (cnt > 0 ? ` <span>${cnt}</span>` : '');
      btn.classList.toggle('active', myReaction === e);
    });
  }
}

// 스토리 댓글 달기
function addStoryComment(storyId) {
  const user = AuthService.getCurrentUser();
  if (!user) { showLoginModal('댓글은 로그인 후 이용할 수 있어요.'); return; }
  const input = document.getElementById('story-comment-input');
  if (!input || !input.value.trim()) return;
  const stories = getStories();
  const story = stories.find(s => s.id === storyId);
  if (!story) return;
  if (!story.comments) story.comments = [];
  const commentText = input.value.trim();
  story.comments.push({
    id: 'sc-' + Date.now(),
    authorId: user.id,
    authorName: user.nickname || user.name,
    text: commentText,
    createdAt: new Date().toISOString()
  });
  saveStories(stories);
  if (story.authorId !== user.id) {
    const myName = user.nickname || user.name;
    addNotificationForUser(story.authorId, `${myName}님이 스토리에 댓글을 달았어요 💬 "${commentText.slice(0, 20)}"`, 'comment', { type: 'story', id: storyId });
  }
  input.value = '';
  showToast('댓글을 달았어요! 💬', 'success');
}

// 스토리에서 특정 유저 프로필로 이동 (뷰어 패널 + 스토리 뷰어 모두 닫고)
function navigateToUserFromStory(userId) {
  _closeViewersPanel();
  closeStoryViewer();
  window._communityViewUserId = userId;
  if (window.location.hash === '#/community') {
    renderCommunityPage();
  } else {
    Router.navigate('/community');
  }
}

// 스토리에서 작성자 프로필로 이동
function openStoryAuthorProfile(authorId) {
  closeStoryViewer();
  window._communityViewUserId = authorId;
  if (window.location.hash === '#/community') {
    renderCommunityPage();
  } else {
    Router.navigate('/community');
  }
}

// 유저 아이템 렌더링 (아바타 + 이름, 클릭 시 피드 이동)
function _renderViewerUserItem(u, suffix) {
  const avatarHtml = u.profileImage
    ? `<img src="${u.profileImage}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
    : `<div style="width:36px;height:36px;border-radius:50%;background:var(--color-border);display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;color:var(--color-text-muted);flex-shrink:0;">${(u.name||'?').slice(0,1)}</div>`;
  return `
    <div onclick="navigateToUserFromStory('${u.id}')"
         style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--color-border);cursor:pointer;transition:background 0.12s;"
         onmouseover="this.style.background='var(--color-surface-2,#f5f5f5)'"
         onmouseout="this.style.background='transparent'">
      ${avatarHtml}
      <span style="font-size:0.88rem;font-weight:600;flex:1;">${u.name}</span>
      ${suffix || ''}
    </div>
  `;
}

// 스토리 본 사람 + 공감 + 댓글 — 우측 슬라이드 패널
function showStoryViewers(storyId) {
  const story = getStories().find(s => s.id === storyId);
  if (!story) return;
  const currentUser = AuthService.getCurrentUser();
  if (!currentUser || currentUser.id !== story.authorId) return;
  const allUsers = StorageService.get('users', []);

  const resolveUser = uid => {
    const u = allUsers.find(u => u.id === uid);
    return { id: uid, name: u ? (u.nickname || u.name || u.email || '알 수 없음') : '알 수 없음', profileImage: u ? (u.profileImage || '') : '' };
  };

  const viewers = (story.viewedBy || []).map(resolveUser);
  const reactions = Object.entries(story.reactions || {}).map(([uid, emoji]) => ({ ...resolveUser(uid), emoji }));
  const comments = story.comments || [];

  const panelId = 'story-viewers-panel';
  document.getElementById(panelId)?.remove();
  document.getElementById('story-viewers-backdrop')?.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'story-viewers-backdrop';
  backdrop.className = 'story-viewers-backdrop';
  backdrop.onclick = () => { document.getElementById(panelId)?.remove(); backdrop.remove(); };
  document.body.appendChild(backdrop);

  const emptyMsg = '<p style="color:var(--color-text-muted);font-size:0.85rem;text-align:center;padding:16px 0;">아직 아무도 없어요.</p>';

  const panel = document.createElement('div');
  panel.id = panelId;
  panel.className = 'story-viewers-panel';
  panel.innerHTML = `
    <div class="story-viewers-panel__header">
      <strong>👁️ 본 사람 (${viewers.length}명)</strong>
      <button onclick="document.getElementById('${panelId}').remove();document.getElementById('story-viewers-backdrop')?.remove()"
        style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--color-text-muted);line-height:1;padding:4px;">×</button>
    </div>
    <div class="story-viewers-panel__body">

      <!-- 본 사람 목록 -->
      <div style="margin-bottom:20px;">
        ${viewers.length === 0 ? emptyMsg : viewers.map(v => _renderViewerUserItem(v, '')).join('')}
      </div>

      <!-- 공감한 사람 -->
      ${reactions.length > 0 ? `
        <div style="margin-bottom:20px;">
          <strong style="font-size:0.82rem;color:var(--color-text-muted);display:block;margin-bottom:4px;">공감 (${reactions.length})</strong>
          ${reactions.map(r => _renderViewerUserItem(r, `<span style="font-size:1.1rem;">${r.emoji}</span>`)).join('')}
        </div>
      ` : ''}

      <!-- 댓글 -->
      ${comments.length > 0 ? `
        <div>
          <strong style="font-size:0.82rem;color:var(--color-text-muted);display:block;margin-bottom:4px;">💬 댓글 (${comments.length})</strong>
          ${comments.map(c => {
            const cu = resolveUser(c.authorId);
            const avatarHtml = cu.profileImage
              ? `<img src="${cu.profileImage}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
              : `<div style="width:30px;height:30px;border-radius:50%;background:var(--color-border);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:var(--color-text-muted);flex-shrink:0;">${(cu.name||'?').slice(0,1)}</div>`;
            return `
              <div onclick="navigateToUserFromStory('${c.authorId}')"
                   style="display:flex;align-items:flex-start;gap:8px;padding:9px 0;border-bottom:1px solid var(--color-border);cursor:pointer;"
                   onmouseover="this.style.background='var(--color-surface-2,#f5f5f5)'"
                   onmouseout="this.style.background='transparent'">
                ${avatarHtml}
                <div style="flex:1;min-width:0;">
                  <span style="font-weight:700;font-size:0.82rem;">${cu.name}</span>
                  <span style="font-size:0.82rem;margin-left:5px;color:var(--color-text);">${c.text}</span>
                  <div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:2px;">${formatTimeAgo(c.createdAt)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

    </div>
  `;
  document.body.appendChild(panel);
}

function renderStoryViewer(groups, groupIdx, storyIdx) {
  const user = AuthService.getCurrentUser();
  const group = groups[groupIdx];
  if (!group) return;
  const story = group.stories[storyIdx];
  if (!story) return;

  if (user) markStoryViewed(story.id, user.id);

  if (_storyViewerTimer) { clearTimeout(_storyViewerTimer); _storyViewerTimer = null; }
  if (_storyHashHandler) { window.removeEventListener('hashchange', _storyHashHandler); _storyHashHandler = null; }
  _closeViewersPanel();

  const modalId = 'story-viewer-modal';
  document.getElementById(modalId)?.remove();

  const total = group.stories.length;
  const progressBars = Array.from({ length: total }, (_, i) =>
    `<div class="story-progress-bar"><div class="story-progress-fill${i < storyIdx ? ' done' : i === storyIdx ? ' active' : ''}"></div></div>`
  ).join('');

  const myReaction = user ? ((story.reactions || {})[user.id]) : null;
  const reactionCounts = {};
  Object.values(story.reactions || {}).forEach(e => { reactionCounts[e] = (reactionCounts[e] || 0) + 1; });
  const reactionEmojis = ['❤️', '😍', '😂', '👏'];
  const viewerCount = (story.viewedBy || []).length;

  const modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'story-viewer-modal';
  modal.innerHTML = `
    <div class="story-viewer">
      <div class="story-viewer-bg" style="${story.imageData ? `background-image:url('${story.imageData}')` : 'background:#1a1a2e'}"></div>
      <div class="story-viewer-top-fade"></div>
      <div class="story-viewer-bottom-fade"></div>
      <div class="story-viewer-ui">
        <div class="story-progress-track">${progressBars}</div>
        <div class="story-viewer-header">
          <div style="flex:1;display:flex;align-items:center;cursor:pointer;" onclick="openStoryAuthorProfile('${group.authorId}')">
            ${renderCommunityAvatar(group.authorProfileImage, 'story-avatar')}
            <div style="margin-left:10px;">
              <strong class="story-header-name">${group.authorName}</strong>
              <span class="story-header-time">${formatTimeAgo(story.createdAt)}</span>
            </div>
          </div>
          <button onclick="closeStoryViewer()" class="story-close-x">×</button>
        </div>
        <div style="flex:1;"></div>
        ${story.text ? `<div class="story-text-overlay">${story.text}</div>` : ''}
        <div class="story-interaction-bar" onclick="event.stopPropagation()">
          <div id="story-reactions-${story.id}" class="story-reactions">
            ${reactionEmojis.map(emoji => `
              <button class="story-reaction-btn${myReaction === emoji ? ' active' : ''}"
                      data-emoji="${emoji}"
                      onclick="addStoryReaction('${story.id}', '${emoji}')">
                ${emoji}${(reactionCounts[emoji] || 0) > 0 ? ` <span>${reactionCounts[emoji]}</span>` : ''}
              </button>
            `).join('')}
          </div>
          <div class="story-comment-row">
            <input id="story-comment-input" type="text" class="story-comment-input"
              placeholder="댓글 달기..." maxlength="100"
              onkeydown="if(event.key==='Enter') addStoryComment('${story.id}')">
            <button class="story-send-btn" onclick="addStoryComment('${story.id}')">➤</button>
            ${user && user.id === group.authorId ? `
            <button class="story-viewers-btn" onclick="showStoryViewers('${story.id}')">
              👁️ ${viewerCount}
            </button>` : ''}
          </div>
        </div>
        <div class="story-viewer-nav">
          <div class="story-nav-half" onclick="navigateStory('${group.authorId}', ${groupIdx}, ${storyIdx - 1}, ${total})"></div>
          <div class="story-nav-half" onclick="navigateStory('${group.authorId}', ${groupIdx}, ${storyIdx + 1}, ${total})"></div>
        </div>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) closeStoryViewer(); });
  document.body.appendChild(modal);

  // 프로그레스 바 애니메이션 (재시작 가능하도록 함수로 분리)
  const startProgress = () => {
    const fill = modal.querySelector('.story-progress-fill.active');
    if (!fill) return;
    fill.style.transition = 'none';
    fill.style.width = '0';
    requestAnimationFrame(() => {
      fill.style.transition = 'width 7s linear';
      fill.style.width = '100%';
    });
  };
  requestAnimationFrame(startProgress);

  // 7초 후 자동 넘기기
  _storyViewerTimer = setTimeout(() => {
    navigateStory(group.authorId, groupIdx, storyIdx + 1, total);
  }, 7000);

  // 페이지 이동 시 타이머 일시정지, 돌아오면 재시작
  _storyHashHandler = () => {
    if (_storyViewerTimer) { clearTimeout(_storyViewerTimer); _storyViewerTimer = null; }
    requestAnimationFrame(() => {
      const still = document.getElementById('story-viewer-modal');
      if (still) {
        startProgress();
        _storyViewerTimer = setTimeout(() => {
          navigateStory(group.authorId, groupIdx, storyIdx + 1, total);
        }, 7000);
      }
    });
  };
  window.addEventListener('hashchange', _storyHashHandler);
}

function _closeViewersPanel() {
  document.getElementById('story-viewers-panel')?.remove();
  document.getElementById('story-viewers-backdrop')?.remove();
}

function closeStoryViewer() {
  if (_storyHashHandler) { window.removeEventListener('hashchange', _storyHashHandler); _storyHashHandler = null; }
  if (_storyViewerTimer) { clearTimeout(_storyViewerTimer); _storyViewerTimer = null; }
  document.getElementById('story-viewer-modal')?.remove();
  _closeViewersPanel();
}

function navigateStory(authorId, groupIdx, storyIdx, total) {
  if (_storyViewerTimer) { clearTimeout(_storyViewerTimer); _storyViewerTimer = null; }
  const groups = getStoryGroups();

  if (storyIdx < 0) {
    if (groupIdx > 0) {
      const prev = groups[groupIdx - 1];
      renderStoryViewer(groups, groupIdx - 1, prev.stories.length - 1);
    } else {
      closeStoryViewer();
    }
    return;
  }
  if (storyIdx >= total) {
    if (groupIdx < groups.length - 1) {
      renderStoryViewer(groups, groupIdx + 1, 0);
    } else {
      closeStoryViewer();
    }
    return;
  }
  renderStoryViewer(groups, groupIdx, storyIdx);
}

// ─── 보관함 (만료된 내 스토리) ───

function renderStoryArchive(user) {
  if (!user) return '<div class="community-empty"><p style="font-size:0.9rem;">로그인 후 이용할 수 있어요.</p></div>';

  const archived = getArchivedStories(user.id);
  if (archived.length === 0) {
    return `
      <div class="community-empty" style="padding:40px 20px;">
        <div style="font-size:2rem;margin-bottom:8px;">📦</div>
        <p style="font-size:0.9rem;">보관된 스토리가 없어요.<br>24시간이 지난 스토리가 자동으로 보관돼요.</p>
      </div>
    `;
  }

  return `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:4px;">
      ${archived.map(s => `
        <div class="story-archive-item" onclick="openArchivedStory('${s.id}')">
          ${s.imageData
            ? `<img src="${s.imageData}" alt="">`
            : `<div class="story-archive-placeholder">${icon('image', 22)}</div>`
          }
          ${s.text ? `<div class="story-archive-text-badge">${s.text.slice(0, 12)}${s.text.length > 12 ? '…' : ''}</div>` : ''}
          <div class="story-archive-time">${formatTimeAgo(s.createdAt)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function openArchivedStory(storyId) {
  const story = getStories().find(s => s.id === storyId);
  if (!story) return;

  const modalId = 'story-archive-viewer';
  document.getElementById(modalId)?.remove();
  const modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'story-viewer-modal';
  modal.innerHTML = `
    <div class="story-viewer">
      <div class="story-viewer-bg" style="${story.imageData ? `background-image:url('${story.imageData}')` : 'background:#1a1a2e'}"></div>
      <div class="story-viewer-top-fade"></div>
      <div class="story-viewer-ui">
        <div class="story-viewer-header">
          <div style="flex:1;">
            <strong class="story-header-name">보관된 스토리</strong>
            <span class="story-header-time">${new Date(story.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
          </div>
          <button onclick="document.getElementById('${modalId}').remove()" class="story-close-x">×</button>
        </div>
        ${story.text ? `<div class="story-text-overlay">${story.text}</div>` : ''}
      </div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}
