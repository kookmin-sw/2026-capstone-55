// Pawsitive - Community Page
// --- 커뮤니티 페이지 ---
function renderCommunityPage() {
  const user = AuthService.getCurrentUser();

  const posts = CommunityService.getFeed(1);

  let createFormHtml = '';
  if (user) {
    createFormHtml = `
      <div class="card" style="padding:16px; margin-bottom:20px;">
        <div style="display:flex; gap:10px; align-items:flex-start;">
          <div class="post-card__avatar">${user.name.charAt(0)}</div>
          <div style="flex:1;">
            <textarea id="new-post-text" class="form-input" placeholder="산책 이야기를 공유해보세요..." style="min-height:60px;"></textarea>
            <div id="post-create-error" style="margin-top:4px;"></div>
            <div style="text-align:right; margin-top:8px;">
              <button class="btn btn-primary btn-sm" onclick="handleCreatePost()">게시하기</button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    createFormHtml = `
      <div class="card" style="padding:20px; margin-bottom:20px; text-align:center; background:var(--color-bg-warm);">
        <p style="margin:0; font-size:0.95rem;">✏️ 게시물을 작성하려면 <a href="#/login" style="color:var(--color-primary, #7C4DFF); font-weight:700;">로그인</a>이 필요해요!</p>
      </div>
    `;
  }

  renderPage(`
    <div class="page-header">
      <h1>💬 커뮤니티</h1>
      <p>반려인들과 우리 아이 이야기를 나눠봐요~ 🐶</p>
    </div>
    ${createFormHtml}
    <div id="community-feed">
      ${renderPostCards(posts, user)}
    </div>
  `);
}

/**
 * 게시물 카드 목록 렌더링
 * @param {Post[]} posts
 * @param {User|null} user
 * @returns {string}
 */
function renderPostCards(posts, user) {
  if (posts.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>아직 게시물이 없습니다. 첫 번째 게시물을 작성해보세요!</p>
      </div>
    `;
  }

  return posts.map(post => {
    const isLiked = user && post.likedBy.includes(user.id);
    const heartIcon = isLiked ? '❤️' : '🤍';
    const likedClass = isLiked ? ' liked' : '';
    const timeAgo = formatTimeAgo(post.createdAt);

    const commentsHtml = post.comments.length > 0
      ? `<div class="comment-list">
          ${post.comments.map(c => `
            <div class="comment-item">
              <div class="comment-item__avatar">${c.authorName.charAt(0)}</div>
              <div class="comment-item__content">
                <span class="comment-item__author">${c.authorName}</span>
                <div class="comment-item__text">${c.text}</div>
              </div>
            </div>
          `).join('')}
        </div>`
      : '';

    const commentFormHtml = user
      ? `<div class="comment-form">
          <input type="text" id="comment-input-${post.id}" placeholder="댓글을 입력하세요..." onkeydown="if(event.key==='Enter')handleAddComment('${post.id}')">
          <button onclick="handleAddComment('${post.id}')">게시</button>
        </div>`
      : '';

    return `
      <div class="post-card">
        <div class="post-card__header">
          <div class="post-card__avatar">${post.authorName.charAt(0)}</div>
          <div>
            <div class="post-card__author">${post.authorName}</div>
            <div class="post-card__time">${timeAgo}</div>
          </div>
        </div>
        <div class="post-card__body">${post.text}</div>
        <div class="post-card__actions">
          <button class="post-action-btn${likedClass}" onclick="handleToggleLike('${post.id}')">
            ${heartIcon} <span>${post.likes}</span>
          </button>
          <button class="post-action-btn">
            💬 <span>${post.comments.length}</span>
          </button>
        </div>
        ${commentsHtml}
        ${commentFormHtml}
      </div>
    `;
  }).join('');
}

/**
 * 시간 경과 포맷팅
 * @param {string} dateStr - ISO 날짜 문자열
 * @returns {string}
 */
function formatTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

/**
 * 게시물 작성 핸들러
 */
function handleCreatePost() {
  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('게시물을 작성하려면 로그인이 필요해요!');
    return;
  }

  const textEl = document.getElementById('new-post-text');
  const text = textEl ? textEl.value : '';
  const errEl = document.getElementById('post-create-error');

  try {
    CommunityService.createPost({
      authorId: user.id,
      authorName: user.name,
      text: text
    });
    renderCommunityPage();
  } catch (e) {
    if (errEl) errEl.innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

/**
 * 좋아요 토글 핸들러
 * @param {string} postId
 */
function handleToggleLike(postId) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('좋아요를 누르려면 로그인이 필요해요!');
    return;
  }

  try {
    CommunityService.toggleLike(postId, user.id);
    renderCommunityPage();
  } catch (e) {
    console.error('[Pawsitive] 좋아요 오류:', e.message);
  }
}

/**
 * 댓글 추가 핸들러
 * @param {string} postId
 */
function handleAddComment(postId) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('댓글을 작성하려면 로그인이 필요해요!');
    return;
  }

  const inputEl = document.getElementById('comment-input-' + postId);
  const text = inputEl ? inputEl.value : '';

  try {
    CommunityService.addComment(postId, {
      authorId: user.id,
      authorName: user.name,
      text: text
    });
    renderCommunityPage();
  } catch (e) {
    console.error('[Pawsitive] 댓글 오류:', e.message);
  }
}

// --- 지갑 페이지 ---
