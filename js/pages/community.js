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

// --- 지갑 페이지 ---

// Expert consultation section
const EXPERT_CATEGORIES = [
 { key: 'all', label: '전체' },
 { key: 'vet', label: '수의사' },
 { key: 'trainer', label: '훈련사' },
 { key: 'nutrition', label: '영양사' },
 { key: 'groomer', label: '미용사' }
];

const EXPERT_PROFILES = [
 {
 id: 'vet-01',
 category: 'vet',
 categoryLabel: '수의사',
 name: '김하린',
 title: '소동물 내과 수의사',
 avatar: '김',
 rating: 4.9,
 reviews: 184,
 price: 39000,
 responseTime: '평균 8분',
 experience: '9년 경력',
 location: '서울 강남',
 tags: ['피부/알러지', '소화기', '건강검진'],
 intro: '반복되는 구토, 피부 가려움, 식욕 저하처럼 병원 방문 전 판단이 필요한 상황을 차분히 정리해드려요.',
 nextSlot: '오늘 19:30'
 },
 {
 id: 'trainer-01',
 category: 'trainer',
 categoryLabel: '훈련사',
 name: '박도윤',
 title: '문제행동 교정 훈련사',
 avatar: '박',
 rating: 4.8,
 reviews: 126,
 price: 33000,
 responseTime: '평균 12분',
 experience: '7년 경력',
 location: '서울 마포',
 tags: ['짖음', '분리불안', '줄 당김'],
 intro: '보호자 루틴과 산책 환경을 함께 보고 집에서 바로 시도할 수 있는 단계별 훈련안을 제안합니다.',
 nextSlot: '오늘 21:00'
 },
 {
 id: 'nutrition-01',
 category: 'nutrition',
 categoryLabel: '영양사',
 name: '이서아',
 title: '반려동물 영양 상담사',
 avatar: '이',
 rating: 4.9,
 reviews: 98,
 price: 29000,
 responseTime: '평균 15분',
 experience: '6년 경력',
 location: '온라인',
 tags: ['다이어트', '알러지 식단', '노령견'],
 intro: '체중, 활동량, 기호성, 알러지 이력을 바탕으로 급여량과 간식 비율을 현실적으로 조정해드려요.',
 nextSlot: '내일 10:00'
 },
 {
 id: 'groomer-01',
 category: 'groomer',
 categoryLabel: '미용사',
 name: '정유민',
 title: '스트레스 케어 미용사',
 avatar: '정',
 rating: 4.7,
 reviews: 142,
 price: 25000,
 responseTime: '평균 10분',
 experience: '8년 경력',
 location: '경기 성남',
 tags: ['엉킴 관리', '발톱/발바닥', '미용 공포'],
 intro: '미용을 무서워하는 아이도 무리하지 않도록 홈케어 순서와 살롱 방문 전 준비를 알려드려요.',
 nextSlot: '오늘 18:00'
 },
 {
 id: 'vet-02',
 category: 'vet',
 categoryLabel: '수의사',
 name: '최민준',
 title: '응급/외과 상담 수의사',
 avatar: '최',
 rating: 4.8,
 reviews: 211,
 price: 45000,
 responseTime: '평균 5분',
 experience: '11년 경력',
 location: '부산 해운대',
 tags: ['응급 판단', '수술 후 관리', '통증 신호'],
 intro: '지금 바로 병원에 가야 하는지, 집에서 관찰해도 되는지 보호자가 놓치기 쉬운 신호를 같이 확인합니다.',
 nextSlot: '오늘 22:30'
 },
 {
 id: 'trainer-02',
 category: 'trainer',
 categoryLabel: '훈련사',
 name: '한지우',
 title: '퍼피 사회화 전문 훈련사',
 avatar: '한',
 rating: 4.9,
 reviews: 77,
 price: 31000,
 responseTime: '평균 18분',
 experience: '5년 경력',
 location: '인천 송도',
 tags: ['퍼피 교육', '배변', '사회화'],
 intro: '어린 강아지의 생활 습관, 배변 실수, 보호자 물기 같은 초기 행동을 부드럽게 잡아드려요.',
 nextSlot: '내일 13:30'
 }
];

let _expertCategory = 'all';
let _activeExpertSessionId = null;
let _expertPendingAttachments = {};

function escapeHtml(value) {
 return String(value || '').replace(/[&<>"']/g, ch => ({
 '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
 }[ch]));
}

function getExpertSessions() {
 try {
 return JSON.parse(localStorage.getItem('pawsitive_expert_sessions') || '[]');
 } catch(e) {
 return [];
 }
}

function saveExpertSessions(sessions) {
 localStorage.setItem('pawsitive_expert_sessions', JSON.stringify(sessions));
}

function getExpertById(expertId) {
 return EXPERT_PROFILES.find(expert => expert.id === expertId);
}

function getExistingExpertSession(expertId, userId) {
 return getExpertSessions().find(session => session.userId === userId && session.expertId === expertId);
}

function getUniqueExpertSessions(sessions) {
 const seen = new Set();
 return sessions.filter(session => {
 if (seen.has(session.expertId)) return false;
 seen.add(session.expertId);
 return true;
 });
}

function renderExpertsPage() {
 const user = AuthService.getCurrentUser();
 const sessions = user ? getExpertSessions().filter(s => s.userId === user.id) : [];
 const visibleSessions = getUniqueExpertSessions(sessions);
 const activeSession = _activeExpertSessionId ? sessions.find(s => s.id === _activeExpertSessionId) : null;
 const activeExpert = activeSession ? getExpertById(activeSession.expertId) : null;
 const visibleExperts = _expertCategory === 'all'
 ? EXPERT_PROFILES
 : EXPERT_PROFILES.filter(expert => expert.category === _expertCategory);
 const activeCategory = EXPERT_CATEGORIES.find(cat => cat.key === _expertCategory) || EXPERT_CATEGORIES[0];

 renderPage(`
 <div class="experts-page">
 <div class="experts-hero">
 <div class="experts-hero__content">
 <span class="experts-hero__eyebrow">Expert Care</span>
 <h1 class="experts-hero__title">우리 아이에게 맞는<br>전문가를 찾아보세요</h1>
 <p class="experts-hero__sub">수의사, 훈련사, 영양사, 미용사와 결제 후 바로 상담을 시작할 수 있어요.</p>
 <div class="experts-hero__stats">
 <span class="dw-stat"><strong>${EXPERT_PROFILES.length}</strong>명 전문가</span>
 <span class="dw-stat-divider">·</span>
 <span class="dw-stat"><strong>4.8</strong> 평균 평점</span>
 <span class="dw-stat-divider">·</span>
 <span class="dw-stat"><strong>15분</strong> 내 응답</span>
 </div>
 </div>
 </div>

 ${visibleSessions.length ? `
 <section class="expert-session-strip">
 <div class="expert-section-head">
 <h2>진행 중인 상담</h2>
 <span>${visibleSessions.length}건</span>
 </div>
 <div class="expert-session-list">
 ${visibleSessions.map(session => {
 const expert = getExpertById(session.expertId);
 if (!expert) return '';
 return `
 <button class="expert-session-chip" onclick="openExpertChat('${session.id}')">
 <span class="expert-session-chip__avatar">${expert.avatar}</span>
 <span><strong>${expert.name}</strong><small>${expert.categoryLabel} 상담</small></span>
 </button>`;
 }).join('')}
 </div>
 </section>` : ''}

 ${activeSession && activeExpert ? renderExpertChat(activeSession, activeExpert) : ''}

 <div class="dw-section__header">
 <h2 class="dw-section__title">추천 전문가 <span class="dw-count">${visibleExperts.length}</span></h2>
 <div class="dw-map-controls">
 <select class="form-select expert-category-select" onchange="setExpertCategory(this.value)">
 ${EXPERT_CATEGORIES.map(cat => `<option value="${cat.key}" ${_expertCategory === cat.key ? 'selected' : ''}>${cat.label}</option>`).join('')}
 </select>
 </div>
 </div>

 <div class="expert-tabs">
 ${EXPERT_CATEGORIES.map(cat => `
 <button class="expert-tab ${_expertCategory === cat.key ? 'active' : ''}" onclick="setExpertCategory('${cat.key}')">${cat.label}</button>
 `).join('')}
 </div>

 <div class="dw-list expert-list" aria-label="${activeCategory.label} 전문가 목록">
 ${visibleExperts.map((expert, idx) => renderExpertCard(expert, idx)).join('')}
 </div>
 </div>
 `);
}

function renderExpertCard(expert, idx = 0) {
 const user = AuthService.getCurrentUser();
 const existingSession = user ? getExistingExpertSession(expert.id, user.id) : null;
 const stars = '★'.repeat(Math.round(expert.rating || 5)) + '☆'.repeat(5 - Math.round(expert.rating || 5));
 const score = Math.min(99, Math.round((expert.rating * 18) + Math.min(expert.reviews, 220) / 18));
 const scoreColor = score >= 90 ? '#00AA76' : score >= 82 ? '#F6A623' : '#999';
 const scoreLabel = score >= 90 ? '강력 추천' : score >= 82 ? '추천' : '적합';
 return `
 <article class="dw-card expert-card" style="${idx === 0 ? 'border-color:#00AA76;' : ''}">
 <div class="dw-card__avatar expert-avatar expert-avatar--${expert.category}" style="${idx === 0 ? 'background:#00AA76;color:#fff;' : ''}">${expert.avatar}</div>
 <div class="dw-card__body">
 <div class="dw-card__top">
 <div>
 <div class="dw-card__name">
 <span class="dw-avail-dot dw-avail-dot--on"></span>${expert.name}
 <span class="expert-card__category">${expert.categoryLabel}</span>
 ${idx === 0 ? '<span class="walker-card__rank-badge expert-rank-badge">추천 1위</span>' : ''}
 </div>
 <div class="dw-card__rating"><span class="dw-stars">${stars}</span> ${expert.rating.toFixed(1)} · 리뷰 ${expert.reviews}건</div>
 </div>
 <div class="walker-card__score-wrap expert-score-wrap">
 <div class="walker-card__score" style="color:${scoreColor};">${score}점</div>
 <div class="walker-card__score-label" style="color:${scoreColor};">${scoreLabel}</div>
 </div>
 </div>
 <div class="walker-card__ai-reason expert-reason">${icon('sparkles',11,'#F6A623')} ${expert.title} · ${expert.responseTime} 응답</div>
 <div class="dw-card__meta">${icon('map-pin',13)} ${expert.location} · ${icon('clock',13)} ${expert.nextSlot} 가능 · ${expert.experience}</div>
 <div class="dw-card__sizes">
 ${expert.tags.map(tag => `<span class="dw-size-tag">${tag}</span>`).join('')}
 </div>
 <div class="dw-card__bio">"${expert.intro}"</div>
 <div class="expert-price-row">
 <span>1회 채팅 상담</span>
 <strong>${expert.price.toLocaleString()}원</strong>
 </div>
 </div>
 <div class="dw-card__action expert-card__action">
 <button class="btn ${existingSession ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="${existingSession ? `openExpertChat('${existingSession.id}')` : `startExpertCheckout('${expert.id}')`}">${existingSession ? '상담 이어가기' : `${expert.price.toLocaleString()}원 · 상담`}</button>
 </div>
 </article>`;
}

function setExpertCategory(category) {
 _expertCategory = category;
 renderExpertsPage();
}

function startExpertCheckout(expertId) {
 const user = AuthService.getCurrentUser();
 if (!user) {
 showLoginModal('전문가 상담을 결제하고 대화를 시작하려면 로그인이 필요해요.');
 return;
 }

 const expert = getExpertById(expertId);
 if (!expert) return;
 const existingSession = getExistingExpertSession(expertId, user.id);
 if (existingSession) {
 showToast('이미 진행 중인 상담이 있어요. 기존 상담방을 열게요.', 'info');
 openExpertChat(existingSession.id);
 return;
 }

 const modalId = 'expert-payment-modal';
 document.getElementById(modalId)?.remove();
 const modal = document.createElement('div');
 modal.id = modalId;
 modal.className = 'expert-modal';
 modal.innerHTML = `
 <div class="expert-modal__card">
 <button class="expert-modal__close" onclick="document.getElementById('${modalId}').remove()" aria-label="닫기">×</button>
 <div class="expert-modal__head">
 <div class="expert-avatar expert-avatar--${expert.category}">${expert.avatar}</div>
 <div>
 <span class="expert-card__category">${expert.categoryLabel}</span>
 <h3>${expert.name} 전문가 상담</h3>
 <p>${expert.title}</p>
 </div>
 </div>
 <div class="expert-pay-summary">
 <div><span>상담권</span><strong>1회 채팅 상담</strong></div>
 <div><span>예상 응답</span><strong>${expert.responseTime}</strong></div>
 <div><span>결제 금액</span><strong>${expert.price.toLocaleString()}원</strong></div>
 </div>
 <label class="expert-modal__label" for="expert-first-message">처음 남길 메시지</label>
 <textarea id="expert-first-message" class="form-input" rows="4" placeholder="아이 나이, 증상이나 고민, 이미 해본 조치를 적어주세요."></textarea>
 <div class="expert-modal__notice">현재는 데모용 예시 결제입니다. 완료하면 상담방이 바로 열려요.</div>
 <button class="btn btn-primary expert-modal__pay" onclick="completeExpertPayment('${expert.id}')">${expert.price.toLocaleString()}원 결제하고 상담 시작</button>
 </div>`;
 modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
 document.body.appendChild(modal);
 document.getElementById('expert-first-message')?.focus();
}

function completeExpertPayment(expertId) {
 const user = AuthService.getCurrentUser();
 const expert = getExpertById(expertId);
 if (!user || !expert) return;

 const sessions = getExpertSessions();
 const existingSession = sessions.find(session => session.userId === user.id && session.expertId === expertId);
 if (existingSession) {
 document.getElementById('expert-payment-modal')?.remove();
 showToast('이미 진행 중인 상담이 있어요. 기존 상담방을 열게요.', 'info');
 openExpertChat(existingSession.id);
 return;
 }

 const firstMessage = document.getElementById('expert-first-message')?.value.trim() || '상담을 시작하고 싶어요.';
 const session = {
 id: 'expert_' + Date.now().toString(36),
 userId: user.id,
 expertId,
 paidAt: new Date().toISOString(),
 amount: expert.price,
 messages: [
 { from: 'system', text: `${expert.name} ${expert.categoryLabel}와 상담이 연결됐어요.`, createdAt: new Date().toISOString() },
 { from: 'user', text: firstMessage, createdAt: new Date().toISOString() },
 { from: 'expert', text: getExpertAutoReply(expert), createdAt: new Date().toISOString() }
 ]
 };

 sessions.unshift(session);
 saveExpertSessions(sessions);
 document.getElementById('expert-payment-modal')?.remove();
 showToast('결제가 완료됐어요. 상담방을 열게요.', 'success');
 openExpertChat(session.id);
}

function getExpertAutoReply(expert) {
 const replies = {
 vet: '안녕하세요. 먼저 아이의 나이, 체중, 증상이 시작된 시점, 식욕과 활력 변화를 알려주세요. 응급 신호가 있는지도 함께 확인해볼게요.',
 trainer: '안녕하세요. 문제 행동이 주로 언제, 어디서, 어떤 자극 뒤에 나타나는지부터 보면 좋아요. 최근 산책 루틴도 같이 알려주세요.',
 nutrition: '안녕하세요. 현재 먹는 사료명, 하루 급여량, 간식 종류, 체중 변화를 알려주시면 급여 구조부터 점검해드릴게요.',
 groomer: '안녕하세요. 아이가 특히 싫어하는 미용 단계와 털 엉킴 정도를 알려주세요. 집에서 부담 없이 시작할 수 있는 순서로 안내드릴게요.'
 };
 return replies[expert.category] || '안녕하세요. 상황을 조금 더 자세히 알려주시면 바로 도와드릴게요.';
}

function openExpertChat(sessionId) {
 const sessions = getExpertSessions();
 const session = sessions.find(s => s.id === sessionId);
 if (!session) return;
 const expert = getExpertById(session.expertId);
 if (!expert) return;

 _activeExpertSessionId = sessionId;
 renderExpertsPage();
 setTimeout(() => {
 const panel = document.getElementById('expert-chat-panel');
 if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
 const messagesEl = document.getElementById('expert-chat-messages');
 if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
 document.getElementById('expert-chat-input')?.focus();
 }, 0);
}

function closeExpertChat() {
 _activeExpertSessionId = null;
 renderExpertsPage();
}

function renderExpertChat(session, expert) {
 return `
 <section class="expert-chat-panel" id="expert-chat-panel">
 <div class="expert-chat">
 <div class="expert-chat__head">
 <div class="expert-avatar expert-avatar--${expert.category}">${expert.avatar}</div>
 <div>
 <h3>${expert.name}</h3>
 <p>${expert.categoryLabel} · 결제 완료 상담</p>
 </div>
 <button onclick="closeExpertChat()" aria-label="닫기">×</button>
 </div>
 <div class="expert-chat__messages" id="expert-chat-messages">
 ${session.messages.map(renderExpertMessage).join('')}
 </div>
 <div class="expert-chat__composer">
 <div class="expert-chat__attachments" id="expert-chat-attachments">${renderExpertAttachmentPreview(session.id)}</div>
 <div class="expert-chat__input">
 <label class="expert-chat__attach" for="expert-chat-file" aria-label="사진 첨부">${icon('image',18)}</label>
 <input id="expert-chat-file" type="file" accept="image/*" multiple onchange="handleExpertChatFile('${session.id}', this)">
 <input id="expert-chat-input" type="text" maxlength="240" placeholder="메시지 입력 또는 사진 붙여넣기..." onpaste="handleExpertChatPaste(event, '${session.id}')" onkeydown="if(event.key==='Enter') sendExpertMessage('${session.id}')">
 <button class="btn btn-primary btn-sm" onclick="sendExpertMessage('${session.id}')">전송</button>
 </div>
 </div>
 </div>
 </section>`;
}

function renderExpertMessage(message) {
 if (message.from === 'system') {
 return `<div class="expert-chat__system">${escapeHtml(message.text)}</div>`;
 }
 return `
 <div class="expert-chat__row expert-chat__row--${message.from}">
 <div class="expert-chat__bubble">
 ${(message.images || []).map(src => `<img class="expert-chat__image" src="${escapeHtml(src)}" alt="첨부 사진">`).join('')}
 ${message.text ? `<div>${escapeHtml(message.text)}</div>` : ''}
 </div>
 </div>`;
}

function getExpertPendingAttachments(sessionId) {
 return _expertPendingAttachments[sessionId] || [];
}

function renderExpertAttachmentPreview(sessionId) {
 const attachments = getExpertPendingAttachments(sessionId);
 if (!attachments.length) return '';
 return attachments.map((src, idx) => `
 <div class="expert-chat__attachment">
 <img src="${escapeHtml(src)}" alt="첨부 예정 사진">
 <button onclick="removeExpertChatAttachment('${sessionId}', ${idx})" aria-label="첨부 사진 삭제">×</button>
 </div>
 `).join('');
}

function refreshExpertAttachmentPreview(sessionId) {
 const el = document.getElementById('expert-chat-attachments');
 if (el) el.innerHTML = renderExpertAttachmentPreview(sessionId);
}

function removeExpertChatAttachment(sessionId, index) {
 const attachments = getExpertPendingAttachments(sessionId);
 attachments.splice(index, 1);
 _expertPendingAttachments[sessionId] = attachments;
 refreshExpertAttachmentPreview(sessionId);
}

function handleExpertChatPaste(event, sessionId) {
 const items = Array.from(event.clipboardData?.items || []);
 const imageItems = items.filter(item => item.type && item.type.startsWith('image/'));
 if (!imageItems.length) return;
 event.preventDefault();
 imageItems.forEach(item => addExpertChatImage(sessionId, item.getAsFile()));
}

function handleExpertChatFile(sessionId, input) {
 Array.from(input.files || []).forEach(file => addExpertChatImage(sessionId, file));
 input.value = '';
}

function addExpertChatImage(sessionId, file) {
 if (!file || !file.type.startsWith('image/')) return;
 if (file.size > 4 * 1024 * 1024) {
 showToast('4MB 이하 사진만 첨부할 수 있어요.', 'error');
 return;
 }
 const reader = new FileReader();
 reader.onload = (e) => {
 const attachments = getExpertPendingAttachments(sessionId);
 attachments.push(e.target.result);
 _expertPendingAttachments[sessionId] = attachments.slice(0, 4);
 refreshExpertAttachmentPreview(sessionId);
 document.getElementById('expert-chat-input')?.focus();
 };
 reader.readAsDataURL(file);
}

function sendExpertMessage(sessionId) {
 const input = document.getElementById('expert-chat-input');
 const text = input?.value.trim();
 const images = getExpertPendingAttachments(sessionId);
 if (!text && !images.length) return;

 const sessions = getExpertSessions();
 const session = sessions.find(s => s.id === sessionId);
 const expert = session ? getExpertById(session.expertId) : null;
 if (!session || !expert) return;

 session.messages.push({
 from: 'user',
 text: text || (images.length ? '사진을 첨부했어요.' : ''),
 images: images.slice(),
 createdAt: new Date().toISOString()
 });
 session.messages.push({
 from: 'expert',
 text: images.length
 ? `${expert.name}입니다. 첨부해주신 사진과 메시지를 같이 보고 우선순위를 정리해볼게요. 사진에서 보이는 변화가 언제부터 있었는지도 알려주세요.`
 : `${expert.name}입니다. 말씀해주신 내용을 기준으로 우선순위를 정리해볼게요. 추가로 사진, 최근 식사/산책 변화, 반복 빈도를 알려주시면 더 정확히 안내드릴 수 있어요.`,
 createdAt: new Date().toISOString()
 });
 saveExpertSessions(sessions);
 input.value = '';
 _expertPendingAttachments[sessionId] = [];
 openExpertChat(sessionId);
}

// --- 매칭 페이지 ---
/* ===================================================
 산책 매칭 페이지 ? 실시간 매칭 중심 UI
 =================================================== */

