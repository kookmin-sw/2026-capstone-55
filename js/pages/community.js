// Pawsitive - Community Page
// Community feed, posts, comments, and expert consultation

function renderCommunityAvatar(imageData, className = 'community-avatar') {
 return `
 <div class="${className}">
 ${imageData ? `<img src="${imageData}" alt="">` : icon('user', 19)}
 </div>
 `;
}

function getCommunityAuthor(authorId, fallbackName = '') {
 const storedUsers = StorageService.get('users', []);
 const author = storedUsers.find(u => u.id === authorId);
 return {
 id: authorId,
 name: (author && (author.nickname || author.name)) || fallbackName || '알 수 없음',
 profileImage: (author && author.profileImage) || ''
 };
}

function openCommunityAuthorFeed(authorId) {
 if (!authorId) return;
 window._communityTab = 'profile';
 window._communityAuthorId = authorId;
 window._communityHashFilter = '';
 window._communitySearch = '';
 renderCommunityPage();
}

function clearCommunityAuthorFeed() {
 window._communityTab = 'main';
 window._communityAuthorId = '';
 renderCommunityPage();
}

// ===== 팔로우 시스템 =====
function getFollows() { return StorageService.get('follows', []); }

function isFollowing(targetId) {
 const user = AuthService.getCurrentUser();
 if (!user || !targetId || targetId === user.id) return false;
 return getFollows().some(f => f.followerId === user.id && f.followeeId === targetId);
}

function handleToggleFollow(targetId, targetName) {
 const user = AuthService.getCurrentUser();
 if (!user) { showLoginModal('팔로우하려면 로그인이 필요해요!'); return; }
 if (targetId === user.id) return;
 const follows = getFollows();
 const idx = follows.findIndex(f => f.followerId === user.id && f.followeeId === targetId);
 const wasFollowing = idx >= 0;
 if (wasFollowing) follows.splice(idx, 1);
 else follows.push({ followerId: user.id, followeeId: targetId, createdAt: StorageService.now() });
 StorageService.set('follows', follows);
 showToast(wasFollowing ? `${targetName} 팔로우를 취소했어요.` : `${targetName}님을 팔로우했어요!`, wasFollowing ? 'info' : 'success');
 renderCommunityPage({ preserveScroll: true });
}

function getFollowerCount(userId) { return getFollows().filter(f => f.followeeId === userId).length; }
function getFollowingCount(userId) { return getFollows().filter(f => f.followerId === userId).length; }

function getFollowingFeed(userId) {
 const ids = getFollows().filter(f => f.followerId === userId).map(f => f.followeeId);
 if (ids.length === 0) return [];
 return CommunityService.getFeed(1).filter(p => ids.includes(p.authorId));
}

let _oneSecondClipData = null;
let _oneSecondCalYear = new Date().getFullYear();
let _oneSecondCalMonth = new Date().getMonth();
let _oneSecondSelectedDate = new Date().toISOString().slice(0, 10);
let _oneSecondPlaying = [];
let _oneSecondPlayingIndex = 0;
let _oneSecondMergedUrl = '';

function getOneSecondDateKey(dateValue) {
 const date = dateValue ? new Date(dateValue) : new Date();
 if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
 return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getOneSecondEntries(userId) {
 return StorageService.get('oneSecondMoments', [])
 .filter(entry => !userId || entry.userId === userId)
 .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function saveOneSecondEntries(entries) {
 StorageService.set('oneSecondMoments', entries);
}

function ensureOneSecondSamples(user) {
 if (!user) return;
 const allEntries = StorageService.get('oneSecondMoments', []);
 const hasUserEntries = allEntries.some(entry => entry.userId === user.id);
 if (hasUserEntries) return;

 const today = new Date();
 const sampleVideos = ['/pawsitive_loading.mp4', '/pawsitive_background.mp4'];
 const sampleTitles = ['첫 산책 준비', '오늘의 꼬리 흔들림', '함께 걷는 시간'];
 const sampleEntries = [2, 1, 0].map((daysAgo, index) => {
 const date = new Date(today);
 date.setDate(today.getDate() - daysAgo);
 return {
 id: StorageService.generateId(),
 userId: user.id,
 userName: user.nickname || user.name,
 userProfileImage: user.profileImage || '',
 date: getOneSecondDateKey(date),
 title: sampleTitles[index],
 videoData: sampleVideos[index % sampleVideos.length],
 createdAt: StorageService.now(),
 updatedAt: StorageService.now(),
 isSample: true
 };
 });
 saveOneSecondEntries(allEntries.concat(sampleEntries));
}

function renderOneSecondCommunity(user) {
 if (!user) {
 return `
 <div class="community-login-card">
 <div>
 <strong>로그인하고 하루 1초를 기록해보세요</strong>
 <p>매일의 산책, 표정, 훈련 순간을 캘린더에 쌓을 수 있어요.</p>
 </div>
 <button class="btn btn-primary btn-sm" onclick="Router.navigate('/login')">로그인</button>
 </div>
 `;
 }

 ensureOneSecondSamples(user);
 const entries = getOneSecondEntries(user.id);
 const year = _oneSecondCalYear;
 const month = _oneSecondCalMonth;
 const now = new Date();
 const todayKey = getOneSecondDateKey(now);
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const firstDay = new Date(year, month, 1).getDay();
 const entriesByDate = {};
 entries.forEach(entry => { entriesByDate[entry.date] = entry; });
 const monthEntries = entries.filter(entry => {
 const d = new Date(entry.date);
 return d.getFullYear() === year && d.getMonth() === month;
 });
 const selectedEntry = entriesByDate[_oneSecondSelectedDate] || null;
 const sortedForMontage = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
 const monthLabel = `${year}년 ${month + 1}월`;
 const completion = Math.round((monthEntries.length / daysInMonth) * 100);

 let cells = '';
 for (let i = 0; i < firstDay; i++) cells += '<button class="one-second-cal__cell one-second-cal__cell--empty" disabled></button>';
 for (let d = 1; d <= daysInMonth; d++) {
 const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
 const entry = entriesByDate[dateKey];
 const hasEntry = !!entry;
 const isToday = dateKey === todayKey;
 const isSelected = dateKey === _oneSecondSelectedDate;
 cells += `<button class="one-second-cal__cell${hasEntry ? ' one-second-cal__cell--active' : ''}${isToday ? ' one-second-cal__cell--today' : ''}${isSelected ? ' one-second-cal__cell--selected' : ''}" onclick="selectOneSecondDate('${dateKey}')">${hasEntry ? `<video src="${entry.videoData}" muted playsinline preload="metadata"></video>` : ''}<span>${d}</span></button>`;
 }

 const recentHtml = entries.slice(0, 5).map(entry => `
 <button class="one-second-entry${entry.date === _oneSecondSelectedDate ? ' active' : ''}" onclick="selectOneSecondDate('${entry.date}')">
 <video src="${entry.videoData}" muted playsinline preload="metadata"></video>
 <span><strong>${new Date(entry.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</strong>${entry.title || '오늘의 1초'}</span>
 </button>
 `).join('');

 return `
 <section class="one-second-board">
 <div class="one-second-board__head">
 <div>
 <h2>하루 1초 기록</h2>
 <p>반려견과 보낸 순간을 날짜별로 모아 커뮤니티에 공유해요.</p>
 </div>
 <button class="btn btn-secondary btn-sm" onclick="buildOneSecondMontage()">${icon('sparkles', 16)} 영상 보기</button>
 </div>

 <div class="one-second-composer">
 <div class="one-second-composer__fields">
 <input type="date" id="one-second-date" value="${_oneSecondSelectedDate || todayKey}">
 <input type="text" id="one-second-title" maxlength="32" placeholder="오늘의 한 줄" value="${selectedEntry ? selectedEntry.title || '' : ''}">
 </div>
 <label class="one-second-upload">
 ${icon('image', 18)}
 <span>${selectedEntry ? '영상 바꾸기' : '1초 영상 선택'}</span>
 <input type="file" accept="video/*" onchange="handleOneSecondClipSelect(this)">
 </label>
 <div id="one-second-preview" class="one-second-preview">${selectedEntry ? `<video src="${selectedEntry.videoData}" controls playsinline></video>` : ''}</div>
 <div class="one-second-composer__actions">
 <button class="btn btn-primary btn-sm" onclick="saveOneSecondMoment()">기록 저장</button>
 ${selectedEntry ? `<button class="btn btn-secondary btn-sm" onclick="deleteOneSecondMoment('${selectedEntry.id}')">삭제</button>` : ''}
 </div>
 </div>

 <div class="one-second-stats">
 <div><strong>${entries.length}</strong><span>전체 기록</span></div>
 <div><strong>${monthEntries.length}</strong><span>이번 달</span></div>
 <div><strong>${completion}%</strong><span>월간 완성도</span></div>
 </div>

 <div class="one-second-cal">
 <div class="one-second-cal__header">
 <button onclick="changeOneSecondMonth(-1)" aria-label="이전 달">&lt;</button>
 <strong>${monthLabel}</strong>
 <button onclick="changeOneSecondMonth(1)" aria-label="다음 달">&gt;</button>
 </div>
 <div class="one-second-cal__days"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
 <div class="one-second-cal__grid">${cells}</div>
 </div>

 <div class="one-second-list">
 <div class="one-second-list__title">최근 기록</div>
 ${recentHtml || '<p>아직 기록이 없어요. 오늘의 1초를 먼저 남겨보세요.</p>'}
 </div>

 <div class="one-second-share">
 <button class="btn btn-primary" onclick="shareOneSecondMontage()" ${sortedForMontage.length === 0 ? 'disabled' : ''}>커뮤니티에 공유</button>
 </div>
 </section>

 <div id="one-second-player-modal" class="one-second-modal" onclick="if(event.target===this)closeOneSecondMontage()">
 <div class="one-second-modal__panel">
 <button class="one-second-modal__close" onclick="closeOneSecondMontage()" aria-label="닫기">x</button>
 <video id="one-second-player" playsinline muted></video>
 <div id="one-second-player-caption" class="one-second-modal__caption">영상을 합치는 중...</div>
 </div>
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
 const profileAuthorId = _communityTab === 'profile' ? (window._communityAuthorId || '') : '';
 const profilePosts = profileAuthorId ? CommunityService.getUserFeed(profileAuthorId) : [];
 const profileAuthorSource = profilePosts[0] || {};
 const profileAuthor = profileAuthorId ? getCommunityAuthor(profileAuthorId, profileAuthorSource.authorName) : null;
 const hashFilter = window._communityHashFilter || '';
 const searchQuery = window._communitySearch || '';

 // 필터링
 let displayPosts = profileAuthorId ? profilePosts : allPosts;
 if (_communityTab === 'following' && user) {
 displayPosts = getFollowingFeed(user.id);
 } else if (_communityTab === 'mine' && user) {
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
 ${icon('image', 15)} 사진
 <input type="file" id="post-image-input" accept="image/*" style="display:none;" onchange="handlePostImageSelect(this)">
 </label>
 <label class="community-tool community-tool--select">
 ${icon('map-pin', 15)}
 <select id="post-walk-select" onchange="handlePostWalkSelect(this)">
 <option value="">경로 첨부</option>
 ${walkOptions}
 </select>
 </label>
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

 const healthTips = [
  {emoji:'☀️', text:'여름철 뜨거운 아스팔트에서 산책 시 발바닥 화상 주의! 아침 7시 이전이나 저녁 7시 이후에 산책하세요.'},
  {emoji:'💧', text:'산책 후 충분한 수분이 필요해요. 항상 물통을 챙겨 다니세요.'},
  {emoji:'🦟', text:'봄부터 심장사상충 예방이 중요해요. 매달 예방약을 꼬박꼬박 챙겨주세요.'},
  {emoji:'🐾', text:'산책 후 발바닥 청결과 보습을 챙겨주세요. 균열 방지에 효과적이에요.'},
  {emoji:'🎾', text:'하루 30분 산책은 비만과 관절 질환 예방에 효과적이에요.'},
 ];
 const tip = healthTips[new Date().getDate() % healthTips.length];

 renderPage(`
 <div class="paw-community">
  <div class="paw-tab-bar">
   <div class="paw-tab-bar__tabs">
    <button class="paw-tab ${_communityTab==='main'?'active':''}" onclick="window._communityTab='main';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()">${icon('home', 16)} <span>전체</span></button>
    <button class="paw-tab ${_communityTab==='search'?'active':''}" onclick="window._communityTab='search';window._communityHashFilter='';renderCommunityPage()">${icon('search', 16)} <span>검색</span></button>
    ${user ? `<button class="paw-tab ${_communityTab==='following'?'active':''}" onclick="window._communityTab='following';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()">${icon('users', 16)} <span>팔로잉</span></button>` : ''}
    <button class="paw-tab ${_communityTab==='mine'?'active':''}" onclick="window._communityTab='mine';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()">${icon('user', 16)} <span>내 글</span></button>
    <button class="paw-tab ${_communityTab==='moments'?'active':''}" onclick="window._communityTab='moments';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()">${icon('calendar', 16)} <span>기록</span></button>
   </div>
   ${user ? `<button class="paw-compose-btn" onclick="toggleCommunityComposer()">${icon('plus', 16)} <span>글쓰기</span></button>` : `<button class="btn btn-primary btn-sm" onclick="Router.navigate('/login')">로그인</button>`}
  </div>

  ${_communityTab === 'moments' && !profileAuthor ? renderOneSecondCommunity(user) : `
   ${_communityTab === 'search' ? `
   <div class="paw-search-wrap">
    <input type="text" id="community-search-input" placeholder="게시물, 해시태그 검색" value="${searchQuery}" oninput="handleCommunitySearchSuggest(this.value)" onkeydown="if(event.key==='Enter'){window._communitySearch=this.value;renderCommunityPage()}" onblur="setTimeout(()=>{const el=document.getElementById('search-suggest');if(el)el.style.display='none'},200)">
    <div id="search-suggest" class="community-suggest" style="display:none;"></div>
   </div>
   ` : ''}

   ${topTags.length > 0 ? `
   <div class="paw-tag-scroll">
    ${topTags.map(([tag]) => `<button class="community-tag ${hashFilter===tag?'active':''}" onclick="window._communityHashFilter='${tag}';window._communityTab='main';renderCommunityPage()">#${tag}</button>`).join('')}
   </div>
   ` : ''}

   ${hashFilter ? `<div class="community-filter"><span>#${hashFilter}</span><button onclick="window._communityHashFilter='';renderCommunityPage()">해제</button></div>` : ''}

   <div class="paw-plaza-layout">
    <div class="paw-plaza-feed">
     ${user ? `<div id="paw-composer-wrap" class="paw-composer-wrap">${createFormHtml}</div>` : createFormHtml}

     ${profileAuthor ? (() => {
      const _pFollowing = isFollowing(profileAuthorId);
      const _pFollowers = getFollowerCount(profileAuthorId);
      const _pFollowings = getFollowingCount(profileAuthorId);
      return `
     <section class="community-profile-feed">
      <button class="community-profile-feed__back" onclick="clearCommunityAuthorFeed()">${icon('chevron-left', 18)} 전체 피드</button>
      <div class="community-profile-feed__main">
       ${renderCommunityAvatar(profileAuthor.profileImage || profileAuthorSource.authorProfileImage, 'community-avatar community-profile-feed__avatar')}
       <div class="community-profile-feed__info">
        <h2>${profileAuthor.name}</h2>
        <div class="community-profile-stats">
         <span><strong>${profilePosts.length}</strong> 게시물</span>
         <span><strong>${_pFollowers}</strong> 팔로워</span>
         <span><strong>${_pFollowings}</strong> 팔로잉</span>
        </div>
       </div>
       ${user && user.id !== profileAuthorId ? `<button class="community-follow-btn ${_pFollowing ? 'community-follow-btn--following' : ''}" onclick="handleToggleFollow('${profileAuthorId}','${profileAuthor.name}')">${_pFollowing ? '팔로잉' : '팔로우'}</button>` : ''}
      </div>
     </section>`;
     })() : ''}

     <div id="community-feed" class="community-feed">
      ${_communityTab === 'following' && user && displayPosts.length === 0
       ? `<div class="community-following-empty">
           <div style="font-size:1.8rem; opacity:0.35; margin-bottom:10px;">🐾</div>
           <p>팔로우한 분들의 게시물이 아직 없어요.<br><strong>게시물 작성자를 팔로우</strong>하면 여기서 모아볼 수 있어요.</p>
          </div>`
       : renderPostCards(displayPosts, user)}
     </div>
    </div>

    <aside class="paw-plaza-sidebar">
     <div class="paw-widget">
      <div class="paw-widget__header">${icon('hash', 14)} 인기 태그</div>
      <div class="paw-tag-list">
       ${topTags.slice(0, 7).map(([tag, count]) => `<button class="paw-tag-item ${hashFilter===tag?'active':''}" onclick="window._communityHashFilter='${tag}';window._communityTab='main';renderCommunityPage()">#${tag} <span>${count}</span></button>`).join('')}
      </div>
     </div>
     <div class="paw-tip-memo">
      <span class="paw-tip-memo__label">오늘의 팁</span>
      <p class="paw-tip-memo__text">${tip.text}</p>
     </div>
    </aside>
   </div>
  `}
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

function handleOneSecondClipSelect(input) {
 if (!input.files || !input.files[0]) return;
 const file = input.files[0];
 if (!file.type.startsWith('video/')) { alert('영상 파일만 선택할 수 있어요.'); return; }
 if (file.size > 12 * 1024 * 1024) { alert('12MB 이하 영상만 저장할 수 있어요.'); return; }
 const reader = new FileReader();
 reader.onload = (e) => {
 _oneSecondClipData = e.target.result;
 const preview = document.getElementById('one-second-preview');
 if (preview) preview.innerHTML = `<video src="${_oneSecondClipData}" controls playsinline></video>`;
 };
 reader.readAsDataURL(file);
}

function selectOneSecondDate(dateKey) {
 _oneSecondSelectedDate = dateKey;
 const d = new Date(dateKey);
 if (!Number.isNaN(d.getTime())) {
 _oneSecondCalYear = d.getFullYear();
 _oneSecondCalMonth = d.getMonth();
 }
 _oneSecondClipData = null;
 renderCommunityPage({ preserveScroll: true });
}

function changeOneSecondMonth(delta) {
 _oneSecondCalMonth += delta;
 if (_oneSecondCalMonth > 11) { _oneSecondCalMonth = 0; _oneSecondCalYear++; }
 if (_oneSecondCalMonth < 0) { _oneSecondCalMonth = 11; _oneSecondCalYear--; }
 renderCommunityPage({ preserveScroll: true });
}

function saveOneSecondMoment() {
 const user = AuthService.getCurrentUser();
 if (!user) {
 showLoginModal('1초 기록을 저장하려면 로그인이 필요해요!');
 return;
 }
 const dateEl = document.getElementById('one-second-date');
 const titleEl = document.getElementById('one-second-title');
 const dateKey = dateEl && dateEl.value ? dateEl.value : getOneSecondDateKey();
 const title = titleEl ? titleEl.value.trim() : '';
 const allEntries = StorageService.get('oneSecondMoments', []);
 const existingIndex = allEntries.findIndex(entry => entry.userId === user.id && entry.date === dateKey);
 const existing = existingIndex >= 0 ? allEntries[existingIndex] : null;
 if (!_oneSecondClipData && !existing) {
 showToast('저장할 영상을 먼저 선택해주세요.', 'info');
 return;
 }
 const entry = {
 id: existing ? existing.id : StorageService.generateId(),
 userId: user.id,
 userName: user.nickname || user.name,
 userProfileImage: user.profileImage || '',
 date: dateKey,
 title,
 videoData: _oneSecondClipData || existing.videoData,
 createdAt: existing ? existing.createdAt : StorageService.now(),
 updatedAt: StorageService.now()
 };
 if (existingIndex >= 0) allEntries[existingIndex] = entry;
 else allEntries.push(entry);
 saveOneSecondEntries(allEntries);
 _oneSecondSelectedDate = dateKey;
 _oneSecondClipData = null;
 showToast('오늘의 1초를 저장했어요.', 'success');
 renderCommunityPage({ preserveScroll: true });
}

function deleteOneSecondMoment(entryId) {
 const user = AuthService.getCurrentUser();
 if (!user || !entryId) return;
 if (!confirm('이 1초 기록을 삭제할까요?')) return;
 const entries = StorageService.get('oneSecondMoments', []).filter(entry => !(entry.id === entryId && entry.userId === user.id));
 saveOneSecondEntries(entries);
 _oneSecondClipData = null;
 showToast('1초 기록을 삭제했어요.', 'success');
 renderCommunityPage({ preserveScroll: true });
}

async function buildOneSecondMontage() {
 const user = AuthService.getCurrentUser();
 if (!user) {
 showLoginModal('1초 영상을 보려면 로그인이 필요해요!');
 return;
 }
 _oneSecondPlaying = getOneSecondEntries(user.id).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
 if (_oneSecondPlaying.length === 0) {
 showToast('재생할 1초 기록이 아직 없어요.', 'info');
 return;
 }
 const modal = document.getElementById('one-second-player-modal');
 if (modal) modal.classList.add('open');
 const caption = document.getElementById('one-second-player-caption');
 const player = document.getElementById('one-second-player');
 if (caption) caption.textContent = '영상을 합치는 중...';
 if (player) {
 player.removeAttribute('src');
 player.removeAttribute('controls');
 player.load();
 }

 try {
 const videoUrl = await createOneSecondMergedVideo(_oneSecondPlaying, (current, total) => {
 if (caption) caption.textContent = `영상을 합치는 중... ${current}/${total}`;
 });
 if (!videoUrl) throw new Error('영상 생성 실패');
 _oneSecondMergedUrl = videoUrl;
 if (player) {
 player.src = videoUrl;
 player.controls = true;
 player.currentTime = 0;
 player.play().catch(() => {});
 }
 if (caption) caption.textContent = `하루 1초 통합 영상 · ${_oneSecondPlaying.length}일`;
 } catch (e) {
 console.error('[Pawsitive] 1초 영상 합성 오류:', e);
 if (caption) caption.textContent = '영상 합성에 실패했어요. 브라우저가 영상 인코딩을 지원하지 않을 수 있어요.';
 }
}

function createVideoElement(src) {
 return new Promise((resolve, reject) => {
 const video = document.createElement('video');
 video.crossOrigin = 'anonymous';
 video.muted = true;
 video.playsInline = true;
 video.preload = 'auto';
 video.src = src;
 video.onloadedmetadata = () => resolve(video);
 video.onerror = () => reject(new Error('영상을 불러오지 못했습니다.'));
 });
}

function seekVideo(video, seconds) {
 return new Promise((resolve) => {
 const done = () => {
 video.removeEventListener('seeked', done);
 resolve();
 };
 video.addEventListener('seeked', done, { once: true });
 video.currentTime = Math.min(seconds, Math.max(0, (video.duration || 1) - 0.05));
 });
}

function drawVideoCover(ctx, video, width, height) {
 const sourceWidth = video.videoWidth || width;
 const sourceHeight = video.videoHeight || height;
 const scale = Math.max(width / sourceWidth, height / sourceHeight);
 const drawWidth = sourceWidth * scale;
 const drawHeight = sourceHeight * scale;
 const drawX = (width - drawWidth) / 2;
 const drawY = (height - drawHeight) / 2;
 ctx.fillStyle = '#111';
 ctx.fillRect(0, 0, width, height);
 ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
}

async function createOneSecondMergedVideo(entries, onProgress) {
 if (!window.MediaRecorder) throw new Error('MediaRecorder 미지원');
 const width = 720;
 const height = 1280;
 const fps = 30;
 const canvas = document.createElement('canvas');
 canvas.width = width;
 canvas.height = height;
 const ctx = canvas.getContext('2d');
 const stream = canvas.captureStream(fps);
 const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
 ? 'video/webm;codecs=vp9'
 : 'video/webm';
 const recorder = new MediaRecorder(stream, { mimeType });
 const chunks = [];

 recorder.ondataavailable = (event) => {
 if (event.data && event.data.size > 0) chunks.push(event.data);
 };

 const stopPromise = new Promise(resolve => {
 recorder.onstop = () => resolve(URL.createObjectURL(new Blob(chunks, { type: mimeType })));
 });

 recorder.start();
 for (let i = 0; i < entries.length; i++) {
 const entry = entries[i];
 if (onProgress) onProgress(i + 1, entries.length);
 const video = await createVideoElement(entry.videoData);
 await seekVideo(video, 0);
 await video.play().catch(() => {});
 const startedAt = performance.now();
 while (performance.now() - startedAt < 1000) {
 drawVideoCover(ctx, video, width, height);
 await new Promise(resolve => requestAnimationFrame(resolve));
 }
 video.pause();
 video.removeAttribute('src');
 video.load();
 }
 recorder.stop();
 return stopPromise;
}

function closeOneSecondMontage() {
 const player = document.getElementById('one-second-player');
 if (player) {
 player.pause();
 player.removeAttribute('src');
 player.removeAttribute('controls');
 player.load();
 }
 if (_oneSecondMergedUrl) {
 URL.revokeObjectURL(_oneSecondMergedUrl);
 _oneSecondMergedUrl = '';
 }
 const modal = document.getElementById('one-second-player-modal');
 if (modal) modal.classList.remove('open');
 _oneSecondPlaying = [];
 _oneSecondPlayingIndex = 0;
}

function shareOneSecondMontage() {
 const user = AuthService.getCurrentUser();
 if (!user) {
 showLoginModal('1초 기록을 공유하려면 로그인이 필요해요!');
 return;
 }
 const entries = getOneSecondEntries(user.id).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
 if (entries.length === 0) {
 showToast('공유할 1초 기록이 아직 없어요.', 'info');
 return;
 }
 const first = entries[0];
 const last = entries[entries.length - 1];
 CommunityService.createPost({
 authorId: user.id,
 authorName: user.nickname || user.name,
 authorProfileImage: user.profileImage || '',
 text: `하루 1초 기록 ${entries.length}일치를 공유해요.\n\n#하루1초 #반려견일상 #Pawsitive`,
 oneSecondData: {
 entryIds: entries.map(entry => entry.id),
 count: entries.length,
 from: first.date,
 to: last.date,
 coverVideoData: last.videoData,
 title: last.title || '오늘의 1초'
 }
 });
 window._communityTab = 'main';
 showToast('1초 기록을 커뮤니티에 공유했어요.', 'success');
 renderCommunityPage();
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
  <div class="community-empty__icon">🐾</div>
  <p>아직 올라온 게시물이 없어요.</p>
  <p class="community-empty__sub">첫 번째 이야기를 들려주실래요?</p>
 </div>
 `;
 }

 return posts.map(post => {
 const isLiked = user && post.likedBy && post.likedBy.includes(user.id);
 const likedClass = isLiked ? ' liked' : '';
 const timeAgo = formatTimeAgo(post.createdAt);
 const author = getCommunityAuthor(post.authorId, post.authorName);
 const authorName = author.name || post.authorName;
 const authorProfileImage = post.authorProfileImage || author.profileImage || '';

 // 해시태그 링크 변환
 let bodyHtml = (post.text || '').replace(/\n/g, '<br>');
 bodyHtml = bodyHtml.replace(/#([\wㄱ-ㅎㅏ-ㅣ가-힣]+)/g, '<a class="community-inline-tag" onclick="window._communityHashFilter=\'$1\';renderCommunityPage()">#$1</a>');

 // 이미지
 const imageHtml = post.imageData ? `<div class="community-post__image"><img src="${post.imageData}" alt=""></div>` : '';

 const oneSecondHtml = post.oneSecondData ? `
 <div class="community-one-second-card">
 <video src="${post.oneSecondData.coverVideoData}" controls playsinline preload="metadata"></video>
 <div>
 <strong>하루 1초 기록</strong>
 <span>${post.oneSecondData.count || 0}일 · ${post.oneSecondData.from || ''} ~ ${post.oneSecondData.to || ''}</span>
 </div>
 </div>
 ` : '';

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
 <button class="community-author-button" onclick="openCommunityAuthorFeed('${post.authorId}')" aria-label="${authorName} 피드 보기">
 ${renderCommunityAvatar(authorProfileImage)}
 </button>
 <div class="community-post__meta">
 <button class="community-post__author" onclick="openCommunityAuthorFeed('${post.authorId}')">${authorName}</button>
 <div class="community-post__time">${timeAgo}</div>
 </div>
 ${user && user.id !== post.authorId
  ? `<button class="community-post-follow ${isFollowing(post.authorId) ? 'following' : ''}" onclick="event.stopPropagation();handleToggleFollow('${post.authorId}','${authorName}')">${isFollowing(post.authorId) ? '팔로잉' : '+ 팔로우'}</button>`
  : `<button class="community-post__more">•••</button>`
 }
 </div>
 ${imageHtml}
 ${oneSecondHtml}
 ${walkHtml}
 <div class="community-post__actions">
 <button class="community-action${likedClass}" onclick="handleToggleLike('${post.id}')" aria-label="좋아요" aria-pressed="${isLiked ? 'true' : 'false'}">${icon('heart', 24)}</button>
 <button class="community-action community-action--comment" onclick="focusPostComment('${post.id}')" aria-label="댓글">${icon('message-circle', 25)}</button>
 <button class="community-action community-action--share" onclick="handleSharePost('${post.id}')" aria-label="공유">${icon('navigation', 23)}</button>
 </div>
 <div class="community-post__likes">좋아요 ${post.likes || 0}개</div>
 <div class="community-post__body"><strong>${authorName}</strong> ${bodyHtml}</div>
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
 const post = CommunityService.getPostById(postId);
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

function toggleCommunityComposer() {
 const w = document.getElementById('paw-composer-wrap');
 if (!w) return;
 w.classList.toggle('open');
 if (w.classList.contains('open')) {
 setTimeout(() => document.getElementById('new-post-text')?.focus(), 50);
 }
}
