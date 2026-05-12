// Pawsitive - Community Page
// Community feed, posts, comments, and expert consultation

function renderCommunityAvatar(imageData, className = 'community-avatar') {
 return `
 <div class="${className}">
 ${imageData ? `<img src="${imageData}" alt="">` : icon('user', 19)}
 </div>
 `;
}

function renderCommunityPage(options = {}) {
 const previousScrollY = window.scrollY || window.pageYOffset || 0;
 const user = AuthService.getCurrentUser();

 // 샘플 데이터 초기화 (한 번만)
 if (!window._communityInitialized) {
 window._communityInitialized = true;
 const existing = CommunityService.getFeed(1);
 if (existing.length < 3) {
 const samples = [
 { authorId: 'sample-1', authorName: '초코맘', text: '오늘 초코랑 한강 산책. 바람이 좋아서 한 시간 넘게 걷고 왔어요.\n\n#한강산책 #포메라니안 #산책일기', imageData: '/photos/01_interior.png', walkData: { dogName: '초코', distance: 2.3, duration: 58, coordinates: [] } },
 { authorId: 'sample-2', authorName: '뽀삐아빠', text: '드디어 앉아 성공. 간식보다 칭찬에 더 신나하는 타입.\n\n#훈련성공 #말티즈 #기본훈련', imageData: '/images/dog_owner.png', walkData: null },
 { authorId: 'sample-3', authorName: '해피누나', text: '비 오는 날 산책은 레인코트가 다 했다. 발 씻기는 아직 어렵지만.\n\n#골든리트리버 #비오는날 #산책', imageData: '/photos/02_display.png', walkData: { dogName: '해피', distance: 1.5, duration: 35, coordinates: [] } },
 { authorId: 'sample-4', authorName: '시바집사', text: '병원 다녀온 뒤 주차장에서 열린 짧고 강렬한 하울링 콘서트.\n\n#시바이누 #시바스크림 #동물병원', imageData: '/images/dog_walker.png', walkData: null },
 { authorId: 'sample-5', authorName: '댕댕이네', text: '주말에 가기 좋은 놀이터 찾음. 넓고 조용해서 다시 갈 예정.\n\n#반려견놀이터 #마포구 #추천장소', imageData: '/photos/03_customers.png', walkData: null },
 { authorId: 'sample-6', authorName: '비숑프리제', text: '오늘 미용 끝. 테디베어컷은 볼 때마다 기분 좋아지는 치트키.\n\n#비숑프리제 #미용 #테디베어컷', imageData: '/pawsitive_logo_transparent.png', walkData: null }
 ];
 samples.forEach(s => {
 try { CommunityService.createPost(s); } catch(e) {}
 });
 }
 }
 const sampleImages = {
 '초코맘': '/photos/01_interior.png',
 '뽀삐아빠': '/images/dog_owner.png',
 '골든러버': '/photos/02_display.png',
 '해피누나': '/photos/02_display.png',
 '시바집사': '/images/dog_walker.png',
 '댕댕이네': '/photos/03_customers.png',
 '비숑프리제': '/pawsitive_logo_transparent.png'
 };
 const storedPosts = StorageService.get('posts', []);
 let sampleUpdated = false;
 storedPosts.forEach(post => {
 if (post.authorId && post.authorId.indexOf('sample-') === 0 && !post.imageData && sampleImages[post.authorName]) {
 post.imageData = sampleImages[post.authorName];
 sampleUpdated = true;
 }
 });
 if (sampleUpdated) StorageService.set('posts', storedPosts);

 const allPosts = CommunityService.getFeed(1);
 const _communityTab = (window._communityTab === 'all') ? 'main' : (window._communityTab || 'main');
 const hashFilter = window._communityHashFilter || '';
 const searchQuery = window._communitySearch || '';

 // 필터링
 let displayPosts = allPosts;
 if (_communityTab === 'mine' && user) {
 displayPosts = displayPosts.filter(p => p.authorId === user.id);
 }
 if (hashFilter) {
 displayPosts = displayPosts.filter(p => p.text && p.text.includes('#' + hashFilter));
 }
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 displayPosts = displayPosts.filter(p => (p.text && p.text.toLowerCase().includes(q)) || (p.authorName && p.authorName.toLowerCase().includes(q)));
 }

 // 인기 해시태그 추출
 const tagCounts = {};
 allPosts.forEach(p => {
 const tags = (p.text || '').match(/#([\wㄱ-ㅎㅏ-ㅣ가-힣]+)/g);
 if (tags) tags.forEach(t => { const tag = t.slice(1); tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
 });
 const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

 let createFormHtml = '';
 if (user) {
 const walkOptions = (window._recentWalks || []).map(w =>
 `<option value="${w.id}">${new Date(w.createdAt).toLocaleDateString('ko-KR')} ${w.dogName || '산책'} (${(w.distance||0).toFixed(1)}km)</option>`
 ).join('');

 createFormHtml = `
 <section class="community-composer">
 <div class="community-composer__row">
 ${renderCommunityAvatar(user.profileImage, 'community-avatar community-avatar--dark')}
 <div class="community-composer__body">
 <textarea id="new-post-text" class="community-composer__textarea" placeholder="사진과 함께 오늘의 순간을 남겨보세요" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"></textarea>
 <div id="post-image-preview" class="community-preview" style="display:none;"></div>
 <div id="post-walk-preview" class="community-preview" style="display:none;"></div>
 <div id="post-create-error"></div>
 <div class="community-composer__footer">
 <div class="community-composer__tools">
 <label class="community-tool">
 사진
 <input type="file" id="post-image-input" accept="image/*" style="display:none;" onchange="handlePostImageSelect(this)">
 </label>
 <select id="post-walk-select" class="community-tool" onchange="handlePostWalkSelect(this)">
 <option value="">경로 첨부</option>
 ${walkOptions}
 </select>
 </div>
 <button class="btn btn-primary btn-sm" onclick="handleCreatePost()">게시</button>
 </div>
 </div>
 </div>
 </section>
 `;
 } else {
 createFormHtml = `
 <div class="community-login-card">
 <div>
 <strong>로그인하고 사진을 공유해보세요</strong>
 <p>좋아요, 댓글, 새 게시물 작성이 가능해요.</p>
 </div>
 <button class="btn btn-primary btn-sm" onclick="Router.navigate('/login')">로그인</button>
 </div>
 `;
 }

 renderPage(`
 <div class="community-page">
 <div class="insta-layout">
 <aside class="insta-sidebar">
 <button class="insta-side-tab ${_communityTab==='main'?'active':''}" onclick="window._communityTab='main';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()" aria-label="메인">${icon('home', 21)}</button>
 <button class="insta-side-tab ${_communityTab==='search'?'active':''}" onclick="window._communityTab='search';window._communityHashFilter='';renderCommunityPage()" aria-label="검색">${icon('search', 21)}</button>
 <button class="insta-side-tab ${_communityTab==='mine'?'active':''}" onclick="window._communityTab='mine';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()" aria-label="내 피드">${icon('user', 21)}</button>
 </aside>

 <main class="insta-shell">
 <div class="insta-search${_communityTab === 'search' ? ' active' : ''}">
 <input type="text" id="community-search-input" placeholder="검색" value="${searchQuery}" oninput="handleCommunitySearchSuggest(this.value)" onkeydown="if(event.key==='Enter'){window._communitySearch=this.value;renderCommunityPage()}" onblur="setTimeout(()=>{const el=document.getElementById('search-suggest'); if(el) el.style.display='none'},200)">
 <div id="search-suggest" class="community-suggest" style="display:none;"></div>
 </div>

 ${topTags.length > 0 ? `
 <div class="tag-strip">
 ${topTags.map(([tag]) => `<button class="community-tag ${hashFilter===tag?'active':''}" onclick="window._communityHashFilter='${tag}';window._communityTab='main';renderCommunityPage()">#${tag}</button>`).join('')}
 </div>
 ` : ''}

 ${hashFilter ? `<div class="community-filter"><span>#${hashFilter}</span><button onclick="window._communityHashFilter='';renderCommunityPage()">해제</button></div>` : ''}

 ${createFormHtml}

 <div id="community-feed" class="community-feed">
 ${renderPostCards(displayPosts, user)}
 </div>
 </main>
 </div>
 `);
 if (options.preserveScroll) {
 setTimeout(() => window.scrollTo(0, previousScrollY), 0);
 }
 if (_communityTab === 'search') {
 setTimeout(() => document.getElementById('community-search-input')?.focus(), 0);
 }

 // 산책 기록 로드
 if (user && !window._recentWalks) {
 fetch('/api/walks/history/' + user.id).then(r => r.json()).then(data => {
 if (data.success) { window._recentWalks = data.walks.slice(0, 10); }
 }).catch(() => {});
 }

 // 산책 경로 지도 렌더링
 setTimeout(() => {
 displayPosts.forEach(p => {
 if (p.walkData && p.walkData.coordinates && p.walkData.coordinates.length > 1) {
 const el = document.getElementById('post-map-' + p.id);
 if (el && !el._mapInit) {
 el._mapInit = true;
 const coords = p.walkData.coordinates.map(c => [c.lat, c.lng]);
 const map = L.map(el, { zoomControl: false, attributionControl: false }).fitBounds(coords, { padding: [15, 15] });
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
 L.polyline(coords, { color: '#F59E0B', weight: 5, opacity: 0.9 }).addTo(map);
 const startIcon = L.divIcon({ className: '', html: '<div style="width:10px;height:10px;background:#22C55E;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>', iconSize: [10, 10], iconAnchor: [5, 5] });
 const endIcon = L.divIcon({ className: '', html: '<div style="width:10px;height:10px;background:#EF4444;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>', iconSize: [10, 10], iconAnchor: [5, 5] });
 L.marker(coords[0], { icon: startIcon }).addTo(map);
 L.marker(coords[coords.length - 1], { icon: endIcon }).addTo(map);
 }
 }
 });
 }, 300);
}

// 게시물 이미지 첨부
let _postImageData = null;
function handlePostImageSelect(input) {
 if (!input.files || !input.files[0]) return;
 const file = input.files[0];
 if (file.size > 5 * 1024 * 1024) { alert('5MB 이하만 가능해요.'); return; }
 const reader = new FileReader();
 reader.onload = (e) => {
 _postImageData = e.target.result;
 const preview = document.getElementById('post-image-preview');
 if (preview) {
 preview.style.display = 'block';
 preview.innerHTML = `<div style="position:relative; display:inline-block;"><img src="${e.target.result}" style="max-height:150px; border-radius:10px;"><button onclick="_postImageData=null;document.getElementById('post-image-preview').style.display='none';document.getElementById('post-image-preview').innerHTML=''" style="position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:#333;color:#fff;border:none;font-size:0.6rem;cursor:pointer;">✕</button></div>`;
 }
 };
 reader.readAsDataURL(file);
}

// 산책 경로 첨부
let _postWalkData = null;
function handlePostWalkSelect(select) {
 const walkId = select.value;
 if (!walkId) { _postWalkData = null; document.getElementById('post-walk-preview').style.display = 'none'; return; }
 const walk = (window._recentWalks || []).find(w => w.id === walkId);
 if (!walk) return;
 _postWalkData = walk;
 const preview = document.getElementById('post-walk-preview');
 if (preview) {
 preview.style.display = 'block';
 preview.innerHTML = `<div class="community-walk-preview"><strong>${walk.dogName || '산책'}</strong> · ${(walk.distance||0).toFixed(2)}km · ${walk.duration||0}분<button onclick="_postWalkData=null;document.getElementById('post-walk-select').value='';document.getElementById('post-walk-preview').style.display='none'">✕</button></div>`;
 }
}

// 검색 자동완성 (해시태그 제안)
function handleCommunitySearchSuggest(value) {
 const suggest = document.getElementById('search-suggest');
 if (!suggest) return;
 if (!value || value.length < 1) { suggest.style.display = 'none'; return; }

 const allPosts = CommunityService.getFeed(1);
 const tagCounts = {};
 allPosts.forEach(p => {
 const tags = (p.text || '').match(/#([\wㄱ-ㅎㅏ-ㅣ가-힣]+)/g);
 if (tags) tags.forEach(t => { const tag = t.slice(1); tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
 });

 const q = value.replace(/^#/, '').toLowerCase();
 const matched = Object.entries(tagCounts)
 .filter(([tag]) => tag.toLowerCase().includes(q))
 .sort((a, b) => b[1] - a[1])
 .slice(0, 6);

 if (matched.length === 0) { suggest.style.display = 'none'; return; }

 suggest.style.display = 'block';
 suggest.innerHTML = matched.map(([tag, count]) =>
 `<button class="community-suggest__item" onclick="window._communityHashFilter='${tag}';window._communitySearch='';renderCommunityPage()"><span>#${tag}</span><small>${count}개 게시물</small></button>`
 ).join('');
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
 <div class="community-empty">
 <p style="font-size:0.9rem;">아직 게시물이 없어요. 첫 번째 이야기를 공유해보세요!</p>
 </div>
 `;
 }

 return posts.map(post => {
 const isLiked = user && post.likedBy && post.likedBy.includes(user.id);
 const likedClass = isLiked ? ' liked' : '';
 const timeAgo = formatTimeAgo(post.createdAt);
 const storedUsers = StorageService.get('users', []);
 const author = storedUsers.find(u => u.id === post.authorId);
 const authorProfileImage = post.authorProfileImage || (author && author.profileImage) || '';

 // 해시태그 링크 변환
 let bodyHtml = (post.text || '').replace(/\n/g, '<br>');
 bodyHtml = bodyHtml.replace(/#([\wㄱ-ㅎㅏ-ㅣ가-힣]+)/g, '<a class="community-inline-tag" onclick="window._communityHashFilter=\'$1\';renderCommunityPage()">#$1</a>');

 // 이미지
 const imageHtml = post.imageData ? `<div class="community-post__image"><img src="${post.imageData}" alt=""></div>` : '';

 // 산책 경로
 let walkHtml = '';
 if (post.walkData && post.walkData.coordinates && post.walkData.coordinates.length > 1) {
 walkHtml = `<div class="community-walk-card">
 <div class="community-walk-card__title">${post.walkData.dogName || '산책'} · ${(post.walkData.distance||0).toFixed(2)}km · ${post.walkData.duration||0}분</div>
 <div id="post-map-${post.id}" class="community-post__map"></div>
 </div>`;
 } else if (post.walkData) {
 walkHtml = `<div class="community-walk-pill">
 <strong>${post.walkData.dogName || '산책'}</strong> · ${(post.walkData.distance||0).toFixed(2)}km · ${post.walkData.duration||0}분
 </div>`;
 }

 const commentsHtml = post.comments && post.comments.length > 0
 ? `<div class="community-comments">
 ${post.comments.map(c => `
 <div class="community-comment">
 ${renderCommunityAvatar(c.authorProfileImage, 'community-comment__avatar')}
 <div class="community-comment__text"><strong>${c.authorName}</strong><span>${c.text}</span></div>
 </div>
 `).join('')}
 </div>`
 : '';

 const commentFormHtml = user
 ? `<div class="community-comment-form">
 <input type="text" id="comment-input-${post.id}" placeholder="댓글을 입력하고 Enter" onkeydown="if(event.key==='Enter')handleAddComment('${post.id}')">
 </div>`
 : '';

 return `
 <article class="community-post">
 <div class="community-post__header">
 ${renderCommunityAvatar(authorProfileImage)}
 <div class="community-post__meta">
 <div class="community-post__author">${post.authorName}</div>
 <div class="community-post__time">${timeAgo}</div>
 </div>
 <button class="community-post__more">•••</button>
 </div>
 ${imageHtml}
 ${walkHtml}
 <div class="community-post__actions">
 <button class="community-action${likedClass}" onclick="handleToggleLike('${post.id}')" aria-label="좋아요" aria-pressed="${isLiked ? 'true' : 'false'}">${icon('heart', 24)}</button>
 <button class="community-action community-action--comment" onclick="focusPostComment('${post.id}')" aria-label="댓글">${icon('message-circle', 25)}</button>
 <button class="community-action community-action--share" onclick="handleSharePost('${post.id}')" aria-label="공유">${icon('navigation', 23)}</button>
 </div>
 <div class="community-post__likes">좋아요 ${post.likes || 0}개</div>
 <div class="community-post__body"><strong>${post.authorName}</strong> ${bodyHtml}</div>
 ${(post.comments||[]).length > 0 ? `<div class="community-post__comment-count">댓글 ${(post.comments||[]).length}개 모두 보기</div>` : ''}
 ${commentsHtml}
 ${commentFormHtml}
 </article>
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

 if (!text.trim() && !_postImageData && !_postWalkData) {
 if (errEl) errEl.innerHTML = '<div class="alert alert-error">내용을 입력해주세요.</div>';
 return;
 }

 try {
 const postData = {
 authorId: user.id,
 authorName: user.nickname || user.name,
 authorProfileImage: user.profileImage || '',
 text: text
 };
 if (_postImageData) postData.imageData = _postImageData;
 if (_postWalkData) postData.walkData = _postWalkData;

 CommunityService.createPost(postData);
 _postImageData = null;
 _postWalkData = null;
 showToast('게시물이 등록되었어요!', 'success');
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
 renderCommunityPage({ preserveScroll: true });
 } catch (e) {
 console.error('[Pawsitive] 좋아요 오류:', e.message);
 }
}

function focusPostComment(postId) {
 const inputEl = document.getElementById('comment-input-' + postId);
 if (inputEl) {
 inputEl.focus();
 }
}

async function handleSharePost(postId) {
 const post = CommunityService.getFeed(1).find(p => p.id === postId);
 const shareText = post ? `${post.authorName}: ${(post.text || '').replace(/\s+/g, ' ').trim()}` : 'Pawsitive 게시물';
 const shareUrl = window.location.origin + window.location.pathname + '#/community';

 try {
 if (navigator.share) {
 await navigator.share({
 title: 'Pawsitive',
 text: shareText,
 url: shareUrl
 });
 return;
 }
 if (navigator.clipboard) {
 await navigator.clipboard.writeText(shareUrl);
 showToast('링크를 복사했어요.', 'success');
 return;
 }
 showToast('공유를 지원하지 않는 브라우저예요.', 'info');
 } catch (e) {
 if (e && e.name !== 'AbortError') {
 showToast('공유 중 오류가 발생했어요.', 'error');
 }
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
 authorName: user.nickname || user.name,
 authorProfileImage: user.profileImage || '',
 text: text
 });
 renderCommunityPage({ preserveScroll: true });
 } catch (e) {
 console.error('[Pawsitive] 댓글 오류:', e.message);
 }
}

