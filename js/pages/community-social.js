// Pawsitive - Community Social & Recommendation
// 팔로우/프로필/추천 알고리즘 (community.js에서 분리)

// ─── 추천 알고리즘 ───

function setCommunityHashFilter(tag) {
 const user = AuthService.getCurrentUser();
 if (user) trackCommunityInterest(user.id, [tag]);
 window._communityHashFilter = tag;
 window._communityTab = 'main';
 renderCommunityPage();
}

function trackCommunityInterest(userId, tags) {
 if (!userId || !tags || !tags.length) return;
 const data = StorageService.get('communityInterests', {});
 if (!data[userId]) data[userId] = { tags: {}, searches: [] };
 tags.forEach(tag => {
   data[userId].tags[tag] = (data[userId].tags[tag] || 0) + 1;
 });
 StorageService.set('communityInterests', data);
}

function trackCommunitySearch(userId, query) {
 if (!userId || !query || !query.trim()) return;
 const data = StorageService.get('communityInterests', {});
 if (!data[userId]) data[userId] = { tags: {}, searches: [] };
 const searches = data[userId].searches || [];
 const q = query.trim();
 if (!searches.includes(q)) searches.unshift(q);
 data[userId].searches = searches.slice(0, 20);
 StorageService.set('communityInterests', data);
}

function getUserInterests(userId) {
 if (!userId) return { tags: {}, searches: [] };
 const data = StorageService.get('communityInterests', {});
 return data[userId] || { tags: {}, searches: [] };
}

function handleCommunitySearchCommit(query) {
 const user = AuthService.getCurrentUser();
 if (user && query.trim()) trackCommunitySearch(user.id, query.trim());
 window._communitySearch = query;
 renderCommunityPage();
}

function getRecommendedPosts(user, allPosts) {
 const interestTags = {};
 if (user) {
   const interests = getUserInterests(user.id);
   Object.assign(interestTags, interests.tags);
   // 등록된 반려견 품종을 관심 신호로 추가
   const userDogs = StorageService.get('dogs', []).filter(d => d.ownerId === user.id);
   userDogs.forEach(dog => {
     if (dog.breed) {
       const t = dog.breed.replace(/\s/g, '');
       interestTags[t] = (interestTags[t] || 0) + 3;
     }
   });
 }
 const hasInterests = Object.keys(interestTags).length > 0;
 const now = Date.now();
 return allPosts
   .filter(p => !user || p.authorId !== user.id)
   .map(post => {
     const tags = (post.text || '').match(/#([\wㄱ-ㅎㅏ-ㅣ가-힣]+)/g) || [];
     const tagNames = tags.map(t => t.slice(1));
     const tagScore = hasInterests ? tagNames.reduce((s, t) => s + (interestTags[t] || 0), 0) : 0;
     const engagementScore = (post.likes || 0) * 2 + (post.comments?.length || 0);
     const ageMs = now - new Date(post.createdAt).getTime();
     const recencyScore = Math.max(0, 10 - ageMs / 86400000 * 1.5);
     return { post, score: tagScore * 5 + engagementScore + recencyScore };
   })
   .sort((a, b) => b.score - a.score);
}

// ─── 팔로우 / 유저 프로필 ───

function handleCommunityFollow(targetUserId, btn) {
 const user = AuthService.getCurrentUser();
 if (!user) { showLoginModal('팔로우는 로그인 후 이용할 수 있어요.'); return; }
 const storedUsers = StorageService.get('users', []);
 const me = storedUsers.find(u => u.id === user.id);
 if (!me) return;
 if (!me.following) me.following = [];
 const idx = me.following.indexOf(targetUserId);
 if (idx === -1) {
   me.following.push(targetUserId);
   if (btn) { btn.textContent = '팔로잉'; btn.classList.add('community-follow-btn--following'); }
   const myName = user.nickname || user.name;
   addNotificationForUser(targetUserId, `${myName}님이 회원님을 팔로우하기 시작했어요 👤`, 'follow', { type: 'user', id: user.id });
 } else {
   me.following.splice(idx, 1);
   if (btn) { btn.textContent = '+ 팔로우'; btn.classList.remove('community-follow-btn--following'); }
 }
 StorageService.set('users', storedUsers);
}

function handleCommunityUserClick(userId) {
 window._communityViewUserId = userId;
 renderCommunityPage();
}

function handleCommunityFollowFromProfile(targetUserId) {
 handleCommunityFollow(targetUserId, null);
 renderCommunityUserProfile(targetUserId);
}

function showFollowListPanel(type, targetUserId) {
  document.getElementById('follow-list-panel')?.remove();
  document.getElementById('follow-list-backdrop')?.remove();

  const storedUsers = StorageService.get('users', []);
  const targetUser = storedUsers.find(u => u.id === targetUserId);
  const currentUser = AuthService.getCurrentUser();
  const myFollowingIds = currentUser ? ((storedUsers.find(u => u.id === currentUser.id) || {}).following || []) : [];

  let listUsers = [];
  if (type === 'followers') {
    listUsers = storedUsers.filter(u => (u.following || []).includes(targetUserId));
  } else {
    const followingIds = (targetUser?.following || []);
    listUsers = storedUsers.filter(u => followingIds.includes(u.id));
  }

  const title = type === 'followers' ? '팔로워' : '팔로잉';

  const backdrop = document.createElement('div');
  backdrop.id = 'follow-list-backdrop';
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:10038;background:rgba(0,0,0,0.3);';
  backdrop.onclick = () => { backdrop.remove(); document.getElementById('follow-list-panel')?.remove(); };

  const panel = document.createElement('div');
  panel.id = 'follow-list-panel';
  panel.className = 'community-comments-panel';

  const usersHtml = listUsers.length === 0
    ? `<div style="padding:32px 16px;text-align:center;color:var(--color-text-muted);font-size:0.9rem;">${type === 'followers' ? '아직 팔로워가 없어요.' : '팔로우한 계정이 없어요.'}</div>`
    : listUsers.map(u => {
        const name = u.nickname || u.name || u.email;
        const isMe = currentUser && currentUser.id === u.id;
        const isFollowing = myFollowingIds.includes(u.id);
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--color-border);">
            <div onclick="document.getElementById('follow-list-panel')?.remove();document.getElementById('follow-list-backdrop')?.remove();handleCommunityUserClick('${u.id}')"
                 style="display:flex;align-items:center;gap:12px;flex:1;cursor:pointer;">
              ${renderCommunityAvatar(u.profileImage, 'community-avatar')}
              <span style="font-size:0.9rem;font-weight:600;">${name}</span>
            </div>
            ${!isMe && currentUser ? `<button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm" style="font-size:0.78rem;padding:5px 12px;"
              onclick="handleCommunityFollow('${u.id}',this)">${isFollowing ? '팔로잉' : '팔로우'}</button>` : ''}
          </div>
        `;
      }).join('');

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--color-border);">
      <strong style="font-size:1rem;">${title}</strong>
      <button onclick="document.getElementById('follow-list-panel')?.remove();document.getElementById('follow-list-backdrop')?.remove();"
              style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--color-text-muted);">×</button>
    </div>
    <div style="overflow-y:auto;flex:1;">${usersHtml}</div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
}

function renderCommunityUserProfile(targetUserId) {
 const user = AuthService.getCurrentUser();
 const storedUsers = StorageService.get('users', []);
 const targetUser = storedUsers.find(u => u.id === targetUserId);

 // 탈퇴한 회원 처리
 if (!targetUser && !targetUserId.startsWith('sample-')) {
   renderPage(`
     <div class="paw-community">
       <div style="padding:16px;">
         <button onclick="window._communityViewUserId=null;renderCommunityPage()" style="display:inline-flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--color-text-muted);font-size:0.85rem;padding:6px 0;margin-bottom:16px;">
           ${icon('arrow-left', 16)} 커뮤니티로
         </button>
         <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 16px;gap:16px;">
           <div style="width:72px;height:72px;border-radius:50%;background:var(--color-border);display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--color-text-muted);">?</div>
           <strong style="font-size:1rem;">알 수 없음</strong>
           <p style="font-size:0.85rem;color:var(--color-text-muted);text-align:center;margin:0;">탈퇴한 회원이에요.</p>
         </div>
       </div>
     </div>
   `);
   return;
 }

 const allPosts = CommunityService.getFeed(1);
 const theirPosts = allPosts.filter(p => p.authorId === targetUserId);

 const displayName = targetUser
   ? (targetUser.nickname || targetUser.name || targetUser.email)
   : (theirPosts[0]?.authorName || '알 수 없는 사용자');
 const profileImage = targetUser?.profileImage || theirPosts[0]?.authorProfileImage || '';

 const followerCount = storedUsers.filter(u => (u.following || []).includes(targetUserId)).length;
 const followingCount = (targetUser?.following || []).length;

 let myFollowingIds = [];
 let isFollowing = false;
 if (user) {
   const me = storedUsers.find(u => u.id === user.id);
   myFollowingIds = (me && me.following) || [];
   isFollowing = myFollowingIds.includes(targetUserId);
 }

 const isMe = user && user.id === targetUserId;

 renderPage(`
   <div class="paw-community">
     <div style="padding:16px;">
       <button onclick="window._communityViewUserId=null;renderCommunityPage()" style="display:inline-flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--color-text-muted);font-size:0.85rem;padding:6px 0;margin-bottom:16px;">
         ${icon('arrow-left', 16)} 커뮤니티로
       </button>
       <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:16px;background:var(--color-surface,#fff);border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
         ${renderCommunityAvatar(profileImage, 'community-avatar')}
         <div style="flex:1;">
           <strong style="font-size:1rem;">${displayName}</strong>
           <div style="display:flex;gap:16px;font-size:0.8rem;color:var(--color-text-muted);margin-top:4px;">
             <span><strong style="color:var(--color-text);">${theirPosts.length}</strong> 게시물</span>
             <span onclick="showFollowListPanel('followers','${targetUserId}')" style="cursor:pointer;"><strong style="color:var(--color-text);">${followerCount}</strong> 팔로워</span>
             <span onclick="showFollowListPanel('following','${targetUserId}')" style="cursor:pointer;"><strong style="color:var(--color-text);">${followingCount}</strong> 팔로잉</span>
           </div>
         </div>
         ${!isMe && user ? `
           <div style="display:flex;gap:8px;">
             <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm"
               onclick="handleCommunityFollowFromProfile('${targetUserId}')">
               ${isFollowing ? '팔로잉' : '팔로우'}
             </button>
             <button class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:5px;"
               onclick="openDMChat('${targetUserId}','${displayName.replace(/'/g,"\\'")}','${profileImage}')">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
               메시지
             </button>
           </div>
         ` : ''}
       </div>
       <div>
         ${renderExploreGrid(theirPosts)}
       </div>
     </div>
   </div>
 `);
}
