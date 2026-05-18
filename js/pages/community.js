// Pawsitive - Community Page
// Community feed, posts, comments, and expert consultation

// 탈퇴한 사용자 여부 확인 (sample- 접두사 ID는 제외)
function _isDeletedUser(userId) {
  if (!userId || userId.startsWith('sample-')) return false;
  const users = StorageService.get('users', []);
  return !users.find(u => u.id === userId);
}

function renderCommunityAvatar(imageData, className = 'community-avatar') {
 return `
 <div class="${className}">
 ${imageData ? `<img src="${imageData}" alt="">` : icon('user', 19)}
 </div>
 `;
}

function _communityPostDomId(postId) {
 return 'community-post-' + String(postId || '').replace(/[^a-zA-Z0-9_-]/g, '-');
}

function _focusCommunityNotificationTargets() {
 const postId = window._communityFocusPostId;
 const storyId = window._communityOpenStoryId;

 if (postId) {
 setTimeout(() => {
   const el = document.getElementById(_communityPostDomId(postId));
   if (el) {
     el.scrollIntoView({ behavior: 'smooth', block: 'center' });
     el.classList.add('community-post--focus');
     setTimeout(() => el.classList.remove('community-post--focus'), 2200);
   }
   if (window._communityOpenPostId === postId) {
     window._communityOpenPostId = null;
     showPostDetail(postId);
   }
   window._communityFocusPostId = null;
 }, 180);
 }

 if (storyId) {
 setTimeout(() => {
   const story = typeof getStories === 'function'
     ? getStories().find(s => s.id === storyId)
     : null;
   if (story && typeof openStoryViewer === 'function') openStoryViewer(story.authorId);
   window._communityOpenStoryId = null;
 }, 220);
 }
}

function initCommunityPetDog() {
 const dogEl = document.getElementById('community-pet-dog');
 if (!dogEl) return;
 if (window._communityPetRaf) { cancelAnimationFrame(window._communityPetRaf); window._communityPetRaf = null; }

 const fa       = dogEl.querySelector('.cpdog-fa');
 const fb       = dogEl.querySelector('.cpdog-fb');
 const sitImg   = dogEl.querySelector('.cpdog-sit-mid');
 const houseDog = document.querySelector('.cpkennel-dog-inside');

 // CSS 애니메이션 비활성화 (JS가 직접 제어)
 [fa, fb, sitImg].forEach(el => { if (el) { el.style.animation = 'none'; el.style.opacity = '0'; } });
 if (houseDog) { houseDog.style.animation = 'none'; houseDog.style.opacity = '0'; houseDog.style.transition = 'opacity 0.5s'; }

 function getHouseX() {
   const k = document.getElementById('community-pet-kennel');
   if (!k) return window.innerWidth * 0.82;
   const r = k.getBoundingClientRect();
   return r.left + r.width * 0.42 - 46;
 }

 let x = window.innerWidth * 0.04;
 let facing = 1;
 let mode = 'run';           // 'run' | 'sit' | 'in_house'
 let speed = 80 + Math.random() * 40;
 let runTarget = null;
 let restTimer = 0, restDur = 0;
 let frameTimer = 0, curFrame = 'a';
 let lastTs = null;
 const FRAME_DUR = 0.22;

 function pickTarget() {
   const hx = getHouseX();
   if (facing === 1) {
     const dist = hx - x;
     // 40% 확률로 중간에 멈춤, 60% 확률로 집까지 직행
     runTarget = (dist > 80 && Math.random() < 0.4)
       ? x + dist * (0.2 + Math.random() * 0.55)
       : hx;
   } else {
     runTarget = window.innerWidth * (0.02 + Math.random() * 0.05);
   }
 }

 function showRun() {
   if (fa) fa.style.opacity = curFrame === 'a' ? '1' : '0';
   if (fb) fb.style.opacity = curFrame === 'b' ? '1' : '0';
   if (sitImg) sitImg.style.opacity = '0';
 }
 function showSit() {
   if (fa) fa.style.opacity = '0';
   if (fb) fb.style.opacity = '0';
   if (sitImg) sitImg.style.opacity = '1';
 }
 function showNone() {
   if (fa) fa.style.opacity = '0';
   if (fb) fb.style.opacity = '0';
   if (sitImg) sitImg.style.opacity = '0';
 }

 function tick(ts) {
   if (!document.getElementById('community-pet-dog')) return;
   const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0.016;
   lastTs = ts;

   if (mode === 'run') {
     if (runTarget === null) pickTarget();
     const dir = runTarget > x ? 1 : -1;
     if (dir !== facing) facing = dir;
     x += speed * dir * dt;

     frameTimer += dt;
     if (frameTimer >= FRAME_DUR) { frameTimer = 0; curFrame = curFrame === 'a' ? 'b' : 'a'; }
     showRun();

     const reached = dir === 1 ? x >= runTarget : x <= runTarget;
     if (reached) {
       x = runTarget;
       const atHouse = facing === 1 && Math.abs(x - getHouseX()) < 60;
       if (atHouse) {
         mode = 'in_house';
         restDur = 4 + Math.random() * 8;
         restTimer = 0;
         showNone();
         if (houseDog) houseDog.style.opacity = '1';
       } else if (facing === 1 && Math.random() < 0.6) {
         // 자기 마음에 따라 중간에 앉아 쉬기
         mode = 'sit';
         restDur = 2 + Math.random() * 6;
         restTimer = 0;
         showSit();
       } else if (facing === -1) {
         // 출발점 복귀 후 방향 전환
         facing = 1;
         speed = 70 + Math.random() * 55;
         runTarget = null;
       } else {
         runTarget = null; // 그냥 계속 달리기
       }
     }

   } else if (mode === 'sit') {
     showSit();
     restTimer += dt;
     if (restTimer >= restDur) {
       mode = 'run';
       speed = 70 + Math.random() * 55;
       facing = x < window.innerWidth * 0.5 ? 1 : (Math.random() < 0.25 ? -1 : 1);
       runTarget = null;
     }

   } else if (mode === 'in_house') {
     showNone();
     restTimer += dt;
     if (restTimer >= restDur) {
       mode = 'run';
       facing = -1;
       speed = 60 + Math.random() * 45;
       runTarget = window.innerWidth * (0.02 + Math.random() * 0.05);
       if (houseDog) houseDog.style.opacity = '0';
     }
   }

   dogEl.style.left = Math.max(0, Math.min(x, window.innerWidth - 92)) + 'px';
   dogEl.style.transform = `scaleX(${facing})`;
   window._communityPetRaf = requestAnimationFrame(tick);
 }

 window._communityPetRaf = requestAnimationFrame(tick);
}

function renderCommunityPetWidget() {
 document.body.classList.remove('community-bg-active');
 if (window._communityBgObserver) { window._communityBgObserver.disconnect(); window._communityBgObserver = null; }

 const existing = document.getElementById('community-pet-css');
 if (existing) existing.remove();
 const s = document.createElement('style');
 s.id = 'community-pet-css';
 s.textContent = `
   #community-pet-dog{position:fixed;width:92px;height:92px;bottom:10%;z-index:50;pointer-events:none;user-select:none;left:4%;}
   #community-pet-dog img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;opacity:0;}
   .cpdog-run-wrap{position:absolute;inset:0;}
   .cpdog-sit-mid{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;}
   #community-pet-kennel{position:fixed;right:6%;bottom:7%;z-index:49;pointer-events:none;user-select:none;}
   .cpkennel-dog-inside{position:absolute;bottom:19px;left:50%;transform:translateX(-50%);width:48px;height:54px;object-fit:contain;opacity:0;}
 `;
 document.head.appendChild(s);

 setTimeout(initCommunityPetDog, 80);

 return `
   <div id="community-pet-kennel"><div style="position:relative;display:inline-block;">
     <svg viewBox="0 0 140 158" width="140" height="158" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <linearGradient id="kWood" x1="0" y1="0" x2="1" y2="0">
           <stop offset="0%" stop-color="#d4894a"/>
           <stop offset="65%" stop-color="#c07838"/>
           <stop offset="100%" stop-color="#946020"/>
         </linearGradient>
         <linearGradient id="kRoof" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0%" stop-color="#3a2210"/>
           <stop offset="100%" stop-color="#5c3a1c"/>
         </linearGradient>
         <linearGradient id="kFoot" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0%" stop-color="#6e4218"/>
           <stop offset="100%" stop-color="#4c2e0e"/>
         </linearGradient>
         <filter id="kDrop">
           <feDropShadow dx="2" dy="4" stdDeviation="5" flood-color="#00000055"/>
         </filter>
       </defs>
       <!-- Ground shadow -->
       <ellipse cx="70" cy="156" rx="56" ry="5" fill="rgba(0,0,0,0.13)"/>
       <g filter="url(#kDrop)">
         <!-- Feet -->
         <rect x="14" y="130" width="24" height="18" rx="3" fill="url(#kFoot)"/>
         <line x1="14" y1="139" x2="38" y2="139" stroke="#3a2208" stroke-width="1.2" opacity="0.6"/>
         <rect x="102" y="130" width="24" height="18" rx="3" fill="url(#kFoot)"/>
         <line x1="102" y1="139" x2="126" y2="139" stroke="#3a2208" stroke-width="1.2" opacity="0.6"/>
         <!-- Body -->
         <rect x="8" y="78" width="124" height="56" rx="4" fill="url(#kWood)"/>
         <!-- Plank lines -->
         <line x1="8"  y1="92"  x2="132" y2="92"  stroke="#8a5020" stroke-width="1.4" opacity="0.65"/>
         <line x1="8"  y1="106" x2="132" y2="106" stroke="#8a5020" stroke-width="1.4" opacity="0.65"/>
         <line x1="8"  y1="120" x2="132" y2="120" stroke="#8a5020" stroke-width="1.4" opacity="0.65"/>
         <!-- Body right-side shadow -->
         <rect x="114" y="78" width="18" height="56" rx="0 4 4 0" fill="rgba(0,0,0,0.13)"/>
         <!-- Body top highlight -->
         <rect x="8" y="78" width="124" height="5" rx="4 4 0 0" fill="rgba(255,255,255,0.07)"/>
         <!-- Arch entrance -->
         <path d="M44,134 L44,102 A26,26 0 0,1 96,102 L96,134 Z" fill="#110705"/>
         <path d="M50,134 L50,106 A20,20 0 0,1 90,106 L90,134 Z" fill="#1c0c05"/>
         <!-- Arch frame -->
         <path d="M42,134 L42,102 A28,28 0 0,1 98,102 L98,134" fill="none" stroke="#7a4620" stroke-width="3.5" stroke-linecap="round"/>
         <!-- Fascia board -->
         <polygon points="4,80 136,80 126,66 14,66" fill="#7c4e26"/>
         <line x1="4"  y1="80" x2="136" y2="80" stroke="#5a3416" stroke-width="1.5"/>
         <line x1="14" y1="66" x2="126" y2="66" stroke="#5a3416" stroke-width="1.2"/>
         <!-- Roof main -->
         <polygon points="14,66 126,66 70,12" fill="url(#kRoof)"/>
         <!-- Shingle rows -->
         <polygon points="28,56 112,56 70,12" fill="#46281a"/>
         <polygon points="42,44 98,44 70,12"  fill="#3c2014"/>
         <polygon points="54,32 86,32 70,12"  fill="#321a0e"/>
         <!-- Shingle lines -->
         <line x1="22"  y1="56" x2="118" y2="56" stroke="#281408" stroke-width="1.2" opacity="0.9"/>
         <line x1="36"  y1="44" x2="104" y2="44" stroke="#281408" stroke-width="1.2" opacity="0.9"/>
         <line x1="50"  y1="32" x2="90"  y2="32" stroke="#281408" stroke-width="1.1" opacity="0.9"/>
         <!-- Roof ridge -->
         <line x1="70" y1="12" x2="70" y2="66" stroke="#201008" stroke-width="2.5" stroke-linecap="round"/>
         <!-- Roof left highlight -->
         <polygon points="14,66 70,12 68,14 14,67" fill="rgba(255,255,255,0.05)"/>
       </g>
     </svg>
     <img class="cpkennel-dog-inside" src="/images/education-dog-sit-front-ui.png" alt="">
   </div></div>
   <div id="community-pet-dog">
     <div class="cpdog-run-wrap">
       <img class="cpdog-fa" src="/images/education-runner-dog-ui.png" alt="">
       <img class="cpdog-fb" src="/images/education-runner-dog-run-b-ui.png" alt="">
     </div>
     <img class="cpdog-sit-mid" src="/images/education-dog-sit-ui.png" alt="">
   </div>
 `;
}

function renderCommunityPage(options = {}) {
 const previousScrollY = window.scrollY || window.pageYOffset || 0;
 const user = AuthService.getCurrentUser();

 if (window._communityViewUserId) {
   renderCommunityUserProfile(window._communityViewUserId);
   return;
 }

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
 const storedPosts = StorageService.get('communityPosts', []);
 let sampleUpdated = false;
 storedPosts.forEach(post => {
 if (post.authorId && post.authorId.indexOf('sample-') === 0 && !post.imageData && sampleImages[post.authorName]) {
 post.imageData = sampleImages[post.authorName];
 sampleUpdated = true;
 }
 });
 if (sampleUpdated) StorageService.set('communityPosts', storedPosts);

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
 <textarea id="new-post-text" class="community-composer__textarea" placeholder="사진이나 동영상과 함께 오늘의 순간을 남겨보세요" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"></textarea>
 <div id="post-image-preview" class="community-preview" style="display:none;"></div>
 <div id="post-video-preview" class="community-preview" style="display:none;"></div>
 <div id="post-walk-preview" class="community-preview" style="display:none;"></div>
 <div id="post-create-error"></div>
 <div class="community-composer__footer">
 <div class="community-composer__tools">
 <label class="community-tool">
 사진
 <input type="file" id="post-image-input" accept="image/*" style="display:none;" onchange="handlePostImageSelect(this)">
 </label>
 <label class="community-tool">
 동영상
 <input type="file" id="post-video-input" accept="video/*" style="display:none;" onchange="handlePostVideoSelect(this)">
 </label>
 <select id="post-walk-select" class="community-tool" onchange="handlePostWalkSelect(this)">
 <option value="">경로 없음</option>
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
 <p>반응하기, 댓글, 글 작성을 할 수 있어요.</p>
 </div>
 <button class="btn btn-primary btn-sm" onclick="Router.navigate('/login')">로그인</button>
 </div>
 `;
 }

 // 오늘의 팁 리스트
 const dailyTips = [
 '강아지 이빨은 매일 닦아주는 게 이상적이에요. 처음엔 손가락 칫솔부터 시작하면 거부감이 덜해요.',
 '산책 후엔 발바닥을 꼭 확인하세요. 날카로운 것이 박히거나 계속 핥는다면 상처나 알레르기 신호예요.',
 '노령견은 체중을 주기적으로 체크하세요. 급격한 체중 감소는 건강 이상 신호로 바로 수의사를 찾아야 해요.',
 '강아지가 풀을 뜯어먹는 건 구역질을 유도해 소화를 돕는 자연 행동이에요. 너무 많이 먹으면 독성 식물이 아닌지 확인해요.',
 '집에서 하루 10분 트릭 훈련만으로도 충분한 정신적 자극이 돼요. 코 냄새 찾기 게임은 산책만큼 효과적이에요.',
 '강아지 체형은 갈비뼈를 손으로 만져 확인하세요. 쉽게 만져지면 정상, 잡히지 않으면 비만 신호예요.',
 '강아지도 충분한 수면이 필요해요. 하루 12~14시간이 정상이에요. 무리한 활동 후엔 충분히 쉬게 해주세요.',
 '새 사료로 바꿀 때는 3~5일에 걸쳐 서서히 교체해야 소화 문제나 거부 반응을 줄일 수 있어요.',
 '목욕 후엔 완전히 건조시켜야 해요. 귓속 습기가 남으면 피부 진균 감염 위험이 높아져요.',
 '갑자기 한쪽 다리를 들고 걸으면 바로 수의사를 방문하세요. 무시하면 관절에 추가 무리가 갈 수 있어요.',
 '이갈이 중인 강아지가 자꾸 뭔가를 씹으면 냉동 장난감을 1~2분 씹게 해주세요.',
 '귀에 갈색 왁스나 냄새가 나면 귓병 신호예요. 이상한 행동이 보이면 방치하지 말고 병원을 찾아주세요.',
 '뺑뺑이 도는 반복 행동은 강박 장애일 수 있어요. 충분한 운동과 정신적 자극으로 해소하거나 전문가와 상담하세요.',
 '목줄 대신 하네스는 호흡기 문제를 줄여줘요. 목이 짧거나 기관지가 약한 견종은 하네스를 권장해요.',
 '분리불안이 있는 강아지를 두고 외출할 때 TV나 라디오를 틀어두면 조금 도움이 될 수 있어요.',
 '강아지가 자꾸 발을 핥으면 알레르기 신호일 수 있어요. 사료를 바꿔보고 개선되는지 확인해보세요.',
 '노령견의 관절 건강을 위해 계단보다 경사로를 이용해주세요. 미끄러운 바닥엔 매트를 깔아주는 것도 도움이 돼요.',
 '물그릇은 매일 씻어주세요. 그냥 두면 세균과 조류가 빠르게 번식해요.',
 '포도, 건포도, 양파, 초콜릿은 강아지에게 독성이 있어요. 특히 포도는 소량도 신장 기능에 영향을 줄 수 있어요.',
 '강아지가 계속 귀를 긁거나 고개를 흔들면 귓병이나 귀 진드기일 수 있어요. 조기 발견이 중요해요.',
 '사회화 황금기는 생후 3~12주예요. 이 시기에 다양한 자극, 소리, 환경을 접하면 균형 잡힌 성격이 만들어져요.',
 '강아지 유치 교체 시기는 4~6개월이에요. 젖니가 빠지지 않으면 이중 치아로 구강 건강에 문제가 생겨요.',
 '발톱이 바닥에 닿아 소리 나면 너무 긴 신호예요. 발톱이 길면 보행 자세가 변해 관절에도 영향을 줘요.',
 '강아지의 갈비뼈가 손으로 만져지지 않으면 비만이에요. 불필요한 간식을 줄이고 다이어트 식단을 추천받으세요.',
 '엉덩이를 바닥에 밀며 다니면 항문낭 문제나 기생충 감염 신호예요. 수의사에게 항문낭 점검을 받아보세요.',
 '하얀 털이나 분홍 코를 가진 견종은 자외선에 민감해요. 야외 활동 시 강아지 전용 자외선 차단제를 고려해보세요.',
 '음식 알레르기 의심 시 단일 단백질 식이요법을 시도해볼 수 있어요. 수의사와 상담 후 원인 성분을 찾아보세요.',
 '강아지가 배를 보여주며 눕는 건 신뢰와 편안함의 표시예요. 배 마사지로 긍정적인 교감을 나눠보세요.',
 '수술 후 넥카라 대신 부드러운 리커버리 옷을 활용하면 스트레스를 줄이고 움직임도 자연스러워요.',
 '매일 15분 이상 강아지와 1:1 교감 시간을 가져보세요. 함께 있는 것만으로도 보호자와 반려견 모두에게 옥시토신이 분비돼요.',
 '밥 먹고 바로 격렬한 운동은 위 비틀림 위험이 있어요. 식후 최소 1시간은 가벼운 활동으로 마무리하세요.',
 '강아지가 자꾸 하품하거나 귀를 뒤로 젖히면 스트레스 신호예요. 원인을 파악하고 편안한 환경을 만들어주세요.',
 '발톱 손질이 겁나는 강아지엔 발을 만지고 간식을 주는 것부터 천천히 시작해보세요. 적응에 며칠이 걸려도 괜찮아요.',
 '겨울철엔 쿠션감 있는 침구로 체온 유지를 도와주세요. 차가운 바닥은 관절에 좋지 않아요.',
 '가족 모두가 같은 명령어를 써야 훈련 효과가 높아요. 일관된 규칙과 신호로 강아지의 혼란을 줄여주세요.',
 ];
 const todayTip = dailyTips[new Date().getDate() % dailyTips.length];

 // 팔로잉 필터
 let followingIds = [];
 let myFollowerCount = 0;
 if (user) {
 const storedUsers = StorageService.get('users', []);
 const me = storedUsers.find(u => u.id === user.id);
 followingIds = (me && me.following) || [];
 myFollowerCount = storedUsers.filter(u => (u.following || []).includes(user.id)).length;
 }
 if (_communityTab === 'following' && user) {
 displayPosts = allPosts.filter(p => followingIds.includes(p.authorId));
 }

 // 추천 데이터 (탐색탭 + 검색어 없을 때 계산)
 const recommendedPosts = (_communityTab === 'search' && !searchQuery) ? getRecommendedPosts(user, allPosts) : [];
 const userInterestTags = user ? Object.entries(getUserInterests(user.id).tags).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t) : [];
 const recentSearches = user ? (getUserInterests(user.id).searches || []).slice(0, 5) : [];

 renderPage(`
 <div class="paw-community">

 <!-- 상단 탭/네비게이션 -->
 <div class="paw-tab-bar">
 <div class="paw-tab-bar__tabs">
 <button class="paw-tab ${_communityTab==='main'?'active':''}" onclick="window._communityTab='main';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()">
 ${icon('home', 15)} <span>홈</span>
 </button>
 <button class="paw-tab ${_communityTab==='search'?'active':''}" onclick="window._communityTab='search';window._communityHashFilter='';renderCommunityPage()">
 ${icon('search', 15)} <span>탐색</span>
 </button>
 <button class="paw-tab ${_communityTab==='following'?'active':''}" onclick="window._communityTab='following';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()">
 ${icon('users', 15)} <span>팔로잉</span>
 </button>
 ${user ? `<button class="paw-tab ${_communityTab==='mine'?'active':''}" onclick="window._communityTab='mine';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()">
 ${icon('user', 15)} <span>내 글</span>
 </button>` : ''}
 <button class="paw-tab ${_communityTab==='record'?'active':''}" onclick="window._communityTab='record';window._communityHashFilter='';window._communitySearch='';renderCommunityPage()">
 ${icon('calendar', 15)} <span>기록</span>
 </button>
 </div>
 <button class="paw-compose-btn" onclick="${user ? 'document.getElementById(\'community-composer-section\')?.scrollIntoView({behavior:\'smooth\'})' : 'showLoginModal(\'글쓰기는 로그인 후 이용할 수 있어요.\')'}">
 ${icon('edit-3', 15)} <span>글쓰기</span>
 </button>
 </div>

 <!-- 태그 슬라이더 -->
 ${topTags.length > 0 ? `
 <div class="paw-tag-scroll">
 ${topTags.map(([tag]) => `<button class="community-tag ${hashFilter===tag?'active':''}" onclick="setCommunityHashFilter('${tag}')">#${tag}</button>`).join('')}
 </div>
 ` : ''}

 <!-- 스토리 바 (홈 탭) -->
 ${_communityTab === 'main' ? renderStoryBar(user) : ''}

 <!-- 강아지 야드 (홈 탭) -->
 ${_communityTab === 'main' ? renderCommunityPetWidget() : ''}

 <!-- 메인 레이아웃: 피드 + 사이드바 -->
 <div class="paw-plaza-layout">
 <div class="paw-plaza-feed">

 <!-- 검색창 (탐색탭일 때 표시) -->
 ${_communityTab === 'search' ? `
 <div class="paw-search-wrap">
 <input type="text" id="community-search-input" placeholder="탐색" value="${searchQuery}" oninput="handleCommunitySearchSuggest(this.value)" onkeydown="if(event.key==='Enter')handleCommunitySearchCommit(this.value)" onblur="setTimeout(()=>{const el=document.getElementById('search-suggest'); if(el) el.style.display='none'},200)" autofocus>
 <div id="search-suggest" class="community-suggest" style="display:none;"></div>
 </div>
 ${!searchQuery ? renderExploreGrid(recommendedPosts.map(r => r.post)) : ''}
 ` : ''}

 ${hashFilter ? `<div class="community-filter"><span>#${hashFilter}</span><button onclick="window._communityHashFilter='';renderCommunityPage()">제거</button></div>` : ''}

 <!-- 내 글 탭 프로필 영역 -->
 ${_communityTab === 'mine' && user ? (() => {
   const mineSubTab = window._mineSubTab || 'posts';
   return `
   <div class="community-post" style="padding:16px;margin-bottom:0;border-radius:16px 16px 0 0;">
     <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
       ${renderCommunityAvatar(user.profileImage, 'community-avatar')}
       <div>
         <strong style="font-size:0.95rem;">${user.name || user.email}</strong><br>
         <span style="font-size:0.78rem;color:var(--color-text-muted);">${allPosts.filter(p => p.authorId === user.id).length} 게시물&nbsp;·&nbsp;<span onclick="showFollowListPanel('followers','${user.id}')" style="cursor:pointer;color:var(--color-text);">${myFollowerCount} 팔로워</span>&nbsp;·&nbsp;<span onclick="showFollowListPanel('following','${user.id}')" style="cursor:pointer;color:var(--color-text);">${followingIds.length} 팔로잉</span></span>
       </div>
     </div>
     <div style="display:flex;border-top:1px solid var(--color-border);margin:0 -16px -16px;">
       <button onclick="window._mineSubTab='posts';renderCommunityPage()" style="flex:1;padding:10px;background:none;border:none;border-bottom:2px solid ${mineSubTab==='posts'?'var(--color-text)':'transparent'};cursor:pointer;font-size:0.85rem;font-weight:${mineSubTab==='posts'?'700':'400'};">게시물</button>
       <button onclick="window._mineSubTab='saved';renderCommunityPage()" style="flex:1;padding:10px;background:none;border:none;border-bottom:2px solid ${mineSubTab==='saved'?'var(--color-text)':'transparent'};cursor:pointer;font-size:0.85rem;font-weight:${mineSubTab==='saved'?'700':'400'};">저장됨</button>
       <button onclick="window._mineSubTab='archive';renderCommunityPage()" style="flex:1;padding:10px;background:none;border:none;border-bottom:2px solid ${mineSubTab==='archive'?'var(--color-text)':'transparent'};cursor:pointer;font-size:0.85rem;font-weight:${mineSubTab==='archive'?'700':'400'};">보관함</button>
     </div>
   </div>`;
 })() : _communityTab === 'main' ? `<div style="font-size:0.82rem;color:var(--color-text-muted);margin-bottom:12px;">오늘의 광장</div>` : ''}

 <!-- 기록 탭 산책 기록 -->
 ${_communityTab === 'record' ? `
 <div id="community-record-section">
 ${user ? `
 <div style="margin-bottom:16px;">
 <h3 style="font-size:1rem;font-weight:700;margin-bottom:4px;">산책 기록</h3>
 <p style="font-size:0.82rem;color:var(--color-text-muted);">내 GPS 산책 기록을 확인해보세요.</p>
 </div>
 <div id="record-walk-list">
 <div class="community-empty"><p style="font-size:0.9rem;">산책 기록을 불러오는 중...</p></div>
 </div>
 ` : `
 <div class="community-login-card">
 <div><strong>로그인하고 산책 기록을 확인해보세요</strong><p>GPS 산책 기록도 함께 보여요.</p></div>
 <button class="btn btn-primary btn-sm" onclick="Router.navigate('/login')">로그인</button>
 </div>
 `}
 </div>
 ` : ''}

 <!-- 글쓰기 폼 (기록·탐색 탭 제외) -->
 ${_communityTab !== 'record' && _communityTab !== 'search' ? `
 <div id="community-composer-section">
 ${createFormHtml}
 </div>
 ` : ''}

 <!-- 피드 (기록·탐색(검색어없음) 탭 제외) -->
 ${_communityTab !== 'record' && !(_communityTab === 'search' && !searchQuery) ? `
 <div id="community-feed" class="community-feed">
 ${(() => {
   if (_communityTab === 'following' && (!user || followingIds.length === 0)) {
     return `<div class="community-empty"><p style="font-size:0.9rem;">팔로우한 계정이 없어요.<br>게시물의 <strong>+ 팔로우</strong> 버튼으로 팔로우해보세요.</p></div>`;
   }
   if (_communityTab === 'mine' && (window._mineSubTab || 'posts') === 'saved') {
     const savedIds = user ? getSavedPostIds(user) : [];
     const savedPosts = allPosts.filter(p => savedIds.includes(p.id));
     if (savedPosts.length === 0) return `<div class="community-empty"><p style="font-size:0.9rem;">저장된 게시물이 없어요.<br>게시물의 북마크 아이콘을 눌러 저장해보세요.</p></div>`;
     return renderPostCards(savedPosts, user, followingIds);
   }
   if (_communityTab === 'mine' && (window._mineSubTab || 'posts') === 'archive') {
     return renderStoryArchive(user);
   }
   if (_communityTab === 'mine') {
     return renderExploreGrid(displayPosts);
   }
   return renderPostCards(displayPosts, user, followingIds);
 })()}
 </div>
 ` : ''}
 </div>

 <!-- 오른쪽 사이드바 -->
 <aside class="paw-plaza-sidebar">
 <div class="paw-widget">
 <div class="paw-widget__header">${icon('tag', 14)} 인기 태그</div>
 <div class="paw-tag-list">
 ${topTags.length > 0
 ? topTags.map(([tag, count]) => `<button class="paw-tag-item ${hashFilter===tag?'active':''}" onclick="setCommunityHashFilter('${tag}')">#${tag} <span>${count}</span></button>`).join('')
 : '<p style="font-size:0.8rem;color:var(--color-text-muted);margin:0;">아직 태그가 없어요.</p>'
 }
 </div>
 </div>
 <div class="paw-widget">
 <div class="paw-widget__header">${icon('zap', 14)} 오늘의 팁</div>
 <div class="paw-tip-emoji">🐾</div>
 <p class="paw-tip-text">${todayTip}</p>
 </div>
 </aside>
 </div>
 </div>
 `);
 _focusCommunityNotificationTargets();
 if (options.preserveScroll) {
 setTimeout(() => window.scrollTo(0, previousScrollY), 0);
 }
 if (_communityTab === 'search') {
 setTimeout(() => document.getElementById('community-search-input')?.focus(), 0);
 }

 // 기록 탭 산책 기록 불러오기
 if (_communityTab === 'record' && user) {
 fetch('/api/walks/history/' + user.id)
 .then(r => r.json())
 .then(data => {
 const el = document.getElementById('record-walk-list');
 if (!el) return;
 const walks = (data.success && data.walks) ? data.walks : [];
 if (walks.length === 0) {
 el.innerHTML = `<div class="community-empty"><p style="font-size:0.9rem;">아직 산책 기록이 없어요.<br>GPS 산책을 시작해보세요!</p><button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="Router.navigate('/walk-tracking')">산책 시작</button></div>`;
 return;
 }
 window._walkRecords = walks;
 el.innerHTML = walks.map(w => `
 <div class="community-post" style="padding:14px;margin-bottom:12px;cursor:pointer;" onclick="showWalkDetail('${w.id}')">
 <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
   <strong style="font-size:0.9rem;">${w.dogName || '산책'}</strong>
   <div style="display:flex;align-items:center;gap:8px;">
     <span style="font-size:0.75rem;color:var(--color-text-muted);">${new Date(w.createdAt).toLocaleDateString('ko-KR')}</span>
     <button class="btn btn-primary btn-sm" style="font-size:0.72rem;padding:3px 10px;" onclick="event.stopPropagation();shareWalkToFeed('${w.id}')">공유</button>
   </div>
 </div>
 <div style="display:flex;gap:16px;font-size:0.82rem;color:var(--color-text-muted);">
 <span>${icon('map-pin',13)} ${(w.distance||0).toFixed(2)}km</span>
 <span>${icon('clock',13)} ${w.duration||0}분</span>
 ${w.distance > 0 ? `<span>${icon('zap',13)} ${Math.round((w.distance||0)*65)} kcal</span>` : ''}
 </div>
 ${w.coordinates && w.coordinates.length > 1 ? `<div id="rec-map-${w.id}" style="height:140px;border-radius:10px;margin-top:10px;overflow:hidden;"></div>` : ''}
 </div>
 `).join('');
 // 지도 렌더링
 setTimeout(() => {
 walks.forEach(w => {
 if (w.coordinates && w.coordinates.length > 1) {
 const mapEl = document.getElementById('rec-map-' + w.id);
 if (mapEl && !mapEl._mapInit) {
 mapEl._mapInit = true;
 const coords = w.coordinates.map(c => [c.lat, c.lng]);
 const map = L.map(mapEl, { zoomControl: false, attributionControl: false }).fitBounds(coords, { padding: [10, 10] });
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
 L.polyline(coords, { color: '#F59E0B', weight: 4, opacity: 0.9 }).addTo(map);
 }
 }
 });
 }, 200);
 })
 .catch(() => {
 const el = document.getElementById('record-walk-list');
 if (el) el.innerHTML = `<div class="community-empty"><p style="font-size:0.9rem;">기록을 불러오지 못했어요.</p></div>`;
 });
 }

 // 산책 기록 불러오기
 if (user && !window._recentWalks) {
 fetch('/api/walks/history/' + user.id).then(r => r.json()).then(data => {
 if (data.success) { window._recentWalks = data.walks.slice(0, 10); }
 }).catch(() => {});
 }

 // 동영상 로딩 (IndexedDB → blob URL)
 setTimeout(() => {
 document.querySelectorAll('[id^="post-video-"]').forEach(el => {
   if (el._videoInit) return;
   el._videoInit = true;
   const postId = el.id.replace('post-video-', '');
   const post = allPosts.find(p => p.id === postId);
   if (post && post.videoId) {
     VideoDB.load(post.videoId).then(blob => {
       if (blob) el.src = URL.createObjectURL(blob);
     });
   }
 });
 }, 300);

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

// IndexedDB 동영상 저장소
const VideoDB = (() => {
 let _db = null;
 function open() {
   if (_db) return Promise.resolve(_db);
   return new Promise((resolve, reject) => {
     const req = indexedDB.open('pawsitive_videos', 1);
     req.onupgradeneeded = e => e.target.result.createObjectStore('videos');
     req.onsuccess = e => { _db = e.target.result; resolve(_db); };
     req.onerror = () => reject(req.error);
   });
 }
 return {
   save(id, blob) {
     return open().then(db => new Promise((resolve, reject) => {
       const tx = db.transaction('videos', 'readwrite');
       tx.objectStore('videos').put(blob, id);
       tx.oncomplete = resolve;
       tx.onerror = () => reject(tx.error);
     }));
   },
   load(id) {
     return open().then(db => new Promise(resolve => {
       const tx = db.transaction('videos', 'readonly');
       const req = tx.objectStore('videos').get(id);
       req.onsuccess = () => resolve(req.result || null);
       req.onerror = () => resolve(null);
     }));
   }
 };
})();

// 게시물 이미지 선택
let _postImageData = null;
function handlePostImageSelect(input) {
 if (!input.files || !input.files[0]) return;
 const file = input.files[0];
 if (file.size > 5 * 1024 * 1024) { alert('5MB 이하만 올려주세요.'); return; }
 const reader = new FileReader();
 reader.onload = (e) => {
 _postImageData = e.target.result;
 const preview = document.getElementById('post-image-preview');
 if (preview) {
 preview.style.display = 'block';
 preview.innerHTML = `<div style="position:relative; display:inline-block;"><img src="${e.target.result}" style="max-height:150px; border-radius:10px;"><button onclick="_postImageData=null;document.getElementById('post-image-preview').style.display='none';document.getElementById('post-image-preview').innerHTML=''" style="position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:#333;color:#fff;border:none;font-size:0.6rem;cursor:pointer;">×</button></div>`;
 }
 };
 reader.readAsDataURL(file);
}

// 게시물 동영상 선택
let _postVideoId = null;
function handlePostVideoSelect(input) {
 if (!input.files || !input.files[0]) return;
 const file = input.files[0];
 if (file.size > 50 * 1024 * 1024) { alert('50MB 이하 동영상만 올려주세요.'); input.value = ''; return; }
 const videoId = 'vid_' + Date.now().toString(36);
 VideoDB.save(videoId, file).then(() => {
   _postVideoId = videoId;
   const url = URL.createObjectURL(file);
   const preview = document.getElementById('post-video-preview');
   if (preview) {
     preview.style.display = 'block';
     preview.innerHTML = `<div style="position:relative;display:inline-block;">
       <video src="${url}" style="max-height:150px;border-radius:10px;" controls muted playsinline></video>
       <button onclick="_postVideoId=null;document.getElementById('post-video-preview').style.display='none';document.getElementById('post-video-preview').innerHTML='';document.getElementById('post-video-input').value=''" style="position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:#333;color:#fff;border:none;font-size:0.6rem;cursor:pointer;line-height:1;">×</button>
     </div>`;
   }
 }).catch(() => alert('동영상 저장 중 오류가 발생했어요.'));
}

// 산책 경로 선택
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
 preview.innerHTML = `<div class="community-walk-preview"><strong>${walk.dogName || '산책'}</strong> · ${(walk.distance||0).toFixed(2)}km · ${walk.duration||0}분 <button onclick="_postWalkData=null;document.getElementById('post-walk-select').value='';document.getElementById('post-walk-preview').style.display='none'">×</button></div>`;
 }
}

// 검색 자동완성 (유저 닉네임 + 해시태그)
function handleCommunitySearchSuggest(value) {
 const suggest = document.getElementById('search-suggest');
 if (!suggest) return;
 if (!value || value.length < 1) { suggest.style.display = 'none'; return; }

 const q = value.toLowerCase();
 const allPosts = CommunityService.getFeed(1);
 const storedUsers = StorageService.get('users', []);

 // 유저 매칭: 등록 유저 + 게시물 작성자(샘플 포함) 합산
 const userMap = {};
 storedUsers.forEach(u => {
   const name = u.nickname || u.name || '';
   if (name.toLowerCase().includes(q)) userMap[u.id] = { id: u.id, name, profileImage: u.profileImage || '', postCount: 0 };
 });
 allPosts.forEach(p => {
   if (!userMap[p.authorId] && (p.authorName || '').toLowerCase().includes(q)) {
     // 탈퇴한 회원은 검색 자동완성에서 제외
     if (!p.authorId.startsWith('sample-') && !storedUsers.find(u => u.id === p.authorId)) return;
     userMap[p.authorId] = { id: p.authorId, name: p.authorName, profileImage: p.authorProfileImage || '', postCount: 0 };
   }
   if (userMap[p.authorId]) userMap[p.authorId].postCount++;
 });
 const matchedUsers = Object.values(userMap).sort((a, b) => b.postCount - a.postCount).slice(0, 3);

 // 해시태그 매칭 (#으로 시작하면 태그 전용)
 const tagCounts = {};
 const isTagSearch = value.startsWith('#');
 const tagQ = value.replace(/^#/, '').toLowerCase();
 allPosts.forEach(p => {
   const tags = (p.text || '').match(/#([\wㄱ-ㅎㅏ-ㅣ가-힣]+)/g);
   if (tags) tags.forEach(t => { const tag = t.slice(1); tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
 });
 const matchedTags = Object.entries(tagCounts)
   .filter(([tag]) => tag.toLowerCase().includes(tagQ))
   .sort((a, b) => b[1] - a[1])
   .slice(0, isTagSearch ? 6 : 3);

 if (matchedUsers.length === 0 && matchedTags.length === 0) { suggest.style.display = 'none'; return; }

 const userHtml = matchedUsers.map(u => {
   const avatarHtml = u.profileImage
     ? `<img src="${u.profileImage}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
     : `<div style="width:32px;height:32px;border-radius:50%;background:var(--color-border);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;flex-shrink:0;">${(u.name||'?').slice(0,1)}</div>`;
   return `<button class="community-suggest__item" onclick="handleCommunityUserClick('${u.id}');document.getElementById('search-suggest').style.display='none'">
     ${avatarHtml}
     <span style="font-weight:600;">${u.name}</span>
     <small style="margin-left:auto;">${u.postCount}개 게시물</small>
   </button>`;
 }).join('');

 const tagHtml = matchedTags.map(([tag, count]) =>
   `<button class="community-suggest__item" onclick="window._communityHashFilter='${tag}';window._communitySearch='';renderCommunityPage()">
     <span style="color:var(--color-primary);font-weight:600;">#${tag}</span>
     <small style="margin-left:auto;">${count}개 게시물</small>
   </button>`
 ).join('');

 const divider = (matchedUsers.length > 0 && matchedTags.length > 0)
   ? `<div style="height:1px;background:var(--color-border-light);margin:4px 0;"></div>` : '';

 suggest.style.display = 'block';
 suggest.innerHTML = userHtml + divider + tagHtml;
}

/**
 * 게시물 카드 리스트 렌더링
 * @param {Post[]} posts
 * @param {User|null} user
 * @returns {string}
 */
function renderExploreGrid(posts) {
 if (!posts || posts.length === 0) {
   return '<div class="community-empty"><p style="font-size:0.9rem;">아직 게시물이 없어요.</p></div>';
 }
 const cells = posts.map(post => {
   let thumb = '';
   if (post.imageData) {
     thumb = `<img src="${post.imageData}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
   } else if (post.videoId) {
     thumb = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;color:#fff;font-size:1.8rem;">▶</div>`;
   } else {
     const preview = (post.text || '').replace(/#\S+/g, '').replace(/<[^>]*>/g, '').trim().slice(0, 40);
     thumb = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:8px;font-size:0.72rem;color:var(--color-text-muted);text-align:center;word-break:break-all;">${preview || '...'}</div>`;
   }
   const likeCount = post.likes || 0;
   const commentCount = (post.comments || []).length;
   return `
     <div class="community-explore-cell" onclick="showPostDetail('${post.id}')">
       ${thumb}
       <div class="community-explore-cell__overlay">
         <span>♥ ${likeCount}</span>
         <span>💬 ${commentCount}</span>
       </div>
     </div>
   `;
 }).join('');
 return `<div class="community-explore-grid">${cells}</div>`;
}

function showPostDetail(postId) {
 document.getElementById('post-detail-backdrop')?.remove();
 const post = CommunityService.getPostById(postId) || CommunityService.getFeed(1).find(p => p.id === postId);
 if (!post) return;
 const user = AuthService.getCurrentUser();
 const followingIds = user ? ((StorageService.get('users', []).find(u => u.id === user.id) || {}).following || []) : [];

 const backdrop = document.createElement('div');
 backdrop.id = 'post-detail-backdrop';
 backdrop.className = 'post-detail-backdrop';
 backdrop.onclick = e => { if (e.target === backdrop) backdrop.remove(); };

 const modal = document.createElement('div');
 modal.className = 'post-detail-modal';
 modal.innerHTML = `
   <button onclick="document.getElementById('post-detail-backdrop').remove()"
     style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--color-text-muted);z-index:1;line-height:1;">×</button>
   ${renderPostCards([post], user, followingIds)}
 `;

 // 모달 내 댓글 input ID 중복 방지 — 피드와 동일 ID가 있으면 getElementById가 피드 input을 반환함
 const feedInput = modal.querySelector(`#comment-input-${post.id}`);
 if (feedInput) {
   const modalInputId = `modal-comment-input-${post.id}`;
   feedInput.id = modalInputId;
   feedInput.onkeydown = e => {
     if (e.key === 'Enter') _addCommentFromModal(post.id, feedInput);
   };
 }

 backdrop.appendChild(modal);
 document.body.appendChild(backdrop);
 // 모달 열리면 댓글 입력창으로 포커스 이동 편의
 modal.querySelector(`#modal-comment-input-${post.id}`)?.focus?.();
}

function _addCommentFromModal(postId, inputEl) {
 const user = AuthService.getCurrentUser();
 if (!user) { showLoginModal('댓글을 작성하려면 로그인이 필요해요!'); return; }
 const text = inputEl ? inputEl.value.trim() : '';
 if (!text) return;
 try {
   const targetPost = CommunityService.getPostById(postId) || CommunityService.getFeed(1).find(p => p.id === postId);
   CommunityService.addComment(postId, {
     authorId: user.id,
     authorName: user.nickname || user.name,
     authorProfileImage: user.profileImage || '',
     text
   });
   if (targetPost && targetPost.authorId && targetPost.authorId !== user.id) {
     const myName = user.nickname || user.name;
     addNotificationForUser(targetPost.authorId, `${myName}님이 댓글을 달았어요 💬 "${text.slice(0, 20)}"`, 'comment', { type: 'post', id: postId });
   }
   renderCommunityPage({ preserveScroll: true });
   showPostDetail(postId);
 } catch (e) {
   console.error('[Pawsitive] 댓글 오류:', e.message);
 }
}

function renderPostCards(posts, user, followingIds) {
 followingIds = followingIds || [];
 if (posts.length === 0) {
 return `
 <div class="community-empty">
 <p style="font-size:0.9rem;">아직 게시물이 없어요. 첫 포스팅을 해볼까요!</p>
 </div>
 `;
 }

 return posts.map(post => {
 const isLiked = user && post.likedBy && post.likedBy.includes(user.id);
 const likedClass = isLiked ? ' liked' : '';
 const timeAgo = formatTimeAgo(post.createdAt);
 const storedUsers = StorageService.get('users', []);
 const author = storedUsers.find(u => u.id === post.authorId);
 const isAuthorDeleted = _isDeletedUser(post.authorId);
 const authorProfileImage = isAuthorDeleted ? '' : (post.authorProfileImage || (author && author.profileImage) || '');
 const displayAuthorName = isAuthorDeleted ? '알 수 없음' : (post.authorName || '알 수 없음');

 // 해시태그 링크 변환
 let bodyHtml = (post.text || '').replace(/\n/g, '<br>');
 bodyHtml = bodyHtml.replace(/#([\wㄱ-ㅎㅏ-ㅣ가-힣]+)/g, '<a class="community-inline-tag" onclick="setCommunityHashFilter(\'$1\')">#$1</a>');

 // 이미지 / 동영상
 const imageHtml = post.imageData ? `<div class="community-post__image"><img src="${post.imageData}" alt=""></div>` : '';
 const videoHtml = post.videoId ? `<div class="community-post__video"><video id="post-video-${post.id}" controls playsinline preload="none"></video></div>` : '';

 // 산책 경로
 let walkHtml = '';
 if (post.walkData && post.walkData.coordinates && post.walkData.coordinates.length > 1) {
 walkHtml = `<div class="community-walk-card">
 <div class="community-walk-card__title">${post.walkData.dogName || '산책'} · ${(post.walkData.distance||0).toFixed(2)}km · ${post.walkData.duration||0}분</div>
 <div id="post-map-${post.id}" class="community-post__map"></div>
 </div>`;
 } else if (post.walkData) {
 walkHtml = `<div class="community-walk-pill">
 <strong>${post.walkData.dogName || '산책'}</strong> · ${(post.walkData.distance||0).toFixed(2)}km · ${post.walkData.duration||0}분 </div>`;
 }

 const commentsHtml = post.comments && post.comments.length > 0
 ? `<div class="community-comments">
 ${post.comments.slice(-2).map(c => {
   const isCDeleted = _isDeletedUser(c.authorId);
   const cName = isCDeleted ? '알 수 없음' : (c.authorName || '알 수 없음');
   const cImg = isCDeleted ? '' : (c.authorProfileImage || '');
   const cClick = isCDeleted ? '' : `onclick="handleCommunityUserClick('${c.authorId}')" style="cursor:pointer;"`;
   const cNameClick = isCDeleted ? '' : `onclick="handleCommunityUserClick('${c.authorId}')" style="cursor:pointer;"`;
   return `
 <div class="community-comment">
 <span ${cClick}>${renderCommunityAvatar(cImg, 'community-comment__avatar')}</span>
 <div class="community-comment__text">
 <strong ${cNameClick}>${cName}</strong>
 <span>${c.text}</span>
 </div>
 </div>
 `;
 }).join('')}
 </div>`
 : '';

 const commentFormHtml = user
 ? `<div class="community-comment-form">
 <input type="text" id="comment-input-${post.id}" placeholder="댓글을 남기고 Enter" onkeydown="if(event.key==='Enter')handleAddComment('${post.id}')">
 </div>`
 : '';

 return `
 <article id="${_communityPostDomId(post.id)}" class="community-post" data-post-id="${post.id}">
 <div class="community-post__header">
 <span ${isAuthorDeleted ? '' : `onclick="handleCommunityUserClick('${post.authorId}')" style="cursor:pointer;"`}>${renderCommunityAvatar(authorProfileImage)}</span>
 <div class="community-post__meta">
 <div class="community-post__author" ${isAuthorDeleted ? '' : `onclick="handleCommunityUserClick('${post.authorId}')" style="cursor:pointer;"`}>${displayAuthorName}</div>
 <div class="community-post__time">${timeAgo}</div>
 </div>
 ${user && post.authorId !== user.id && !isAuthorDeleted ? `<button class="community-follow-btn${followingIds.includes(post.authorId) ? ' community-follow-btn--following' : ''}" onclick="handleCommunityFollow('${post.authorId}', this)">${followingIds.includes(post.authorId) ? '팔로잉' : '+ 팔로우'}</button>` : ''}
 <button class="community-post__more">···</button>
 </div>
 ${imageHtml}
 ${videoHtml}
 ${walkHtml}
 <div class="community-post__actions">
 <button class="community-action${likedClass}" onclick="handleToggleLike('${post.id}')" aria-label="좋아요" aria-pressed="${isLiked ? 'true' : 'false'}">${icon('heart', 24)}</button>
 <button class="community-action community-action--comment" onclick="focusPostComment('${post.id}')" aria-label="댓글">${icon('message-circle', 25)}</button>
 <button class="community-action community-action--share" onclick="handleSharePost('${post.id}')" aria-label="공유">${icon('navigation', 23)}</button>
 <button class="community-action community-action--save${user && isSaved(post.id, user) ? ' saved' : ''}" onclick="handleToggleSave('${post.id}')" aria-label="저장" style="margin-left:auto;">${icon('bookmark', 23)}</button>
 </div>
 <div class="community-post__likes" ${(post.likes || 0) > 0 ? `onclick="showLikesModal('${post.id}')" style="cursor:pointer;"` : ''}>좋아요 ${post.likes || 0}개</div>
 <div class="community-post__body"><strong>${displayAuthorName}</strong> ${bodyHtml}</div>
 ${(post.comments||[]).length > 0 ? `<div class="community-post__comment-count" onclick="handleShowAllComments('${post.id}')" style="cursor:pointer;">댓글 ${(post.comments||[]).length}개 모두 보기</div>` : ''}
 ${commentsHtml}
 ${commentFormHtml}
 </article>
 `;
 }).join('');
}

/**
 * 시간 경과 표시
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

// ─── 산책 기록 상세 / 공유 ───

function showWalkDetail(walkId) {
  document.getElementById('walk-detail-backdrop')?.remove();
  const w = (window._walkRecords || []).find(r => r.id === walkId);
  if (!w) return;

  const pace = w.distance > 0 ? (w.duration / w.distance).toFixed(1) : '--';
  const kcal = Math.round((w.distance || 0) * 65);
  const hasCoords = w.coordinates && w.coordinates.length > 1;

  const backdrop = document.createElement('div');
  backdrop.id = 'walk-detail-backdrop';
  backdrop.className = 'post-detail-backdrop';
  backdrop.onclick = e => { if (e.target === backdrop) backdrop.remove(); };

  const modal = document.createElement('div');
  modal.className = 'post-detail-modal';
  modal.style.cssText = 'padding:0;overflow:hidden;max-width:420px;';
  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--color-border);">
      <div>
        <strong style="font-size:1rem;">${w.dogName || '산책'}</strong>
        <div style="font-size:0.78rem;color:var(--color-text-muted);margin-top:2px;">${new Date(w.createdAt).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'})}</div>
      </div>
      <button onclick="document.getElementById('walk-detail-backdrop').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--color-text-muted);line-height:1;">×</button>
    </div>
    ${hasCoords ? `<div id="walk-detail-map" style="height:220px;background:#e5e7eb;"></div>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;border-bottom:1px solid var(--color-border);">
      <div style="text-align:center;padding:16px 6px;border-right:1px solid var(--color-border);">
        <div style="font-size:1.25rem;font-weight:800;color:var(--color-primary);">${(w.distance||0).toFixed(2)}</div>
        <div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:3px;">km</div>
      </div>
      <div style="text-align:center;padding:16px 6px;border-right:1px solid var(--color-border);">
        <div style="font-size:1.25rem;font-weight:800;">${w.duration||0}</div>
        <div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:3px;">분</div>
      </div>
      <div style="text-align:center;padding:16px 6px;border-right:1px solid var(--color-border);">
        <div style="font-size:1.25rem;font-weight:800;">${pace}</div>
        <div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:3px;">분/km</div>
      </div>
      <div style="text-align:center;padding:16px 6px;">
        <div style="font-size:1.25rem;font-weight:800;">${kcal}</div>
        <div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:3px;">kcal</div>
      </div>
    </div>
    <div style="padding:16px 20px;">
      <button class="btn btn-primary" style="width:100%;padding:12px;font-size:0.95rem;" onclick="shareWalkToFeed('${w.id}')">
        커뮤니티에 공유하기
      </button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  if (hasCoords) {
    setTimeout(() => {
      const mapEl = document.getElementById('walk-detail-map');
      if (!mapEl || mapEl._mapInit) return;
      mapEl._mapInit = true;
      const coords = w.coordinates.map(c => [c.lat, c.lng]);
      const map = L.map(mapEl, { zoomControl: true, attributionControl: false }).fitBounds(coords, { padding: [20, 20] });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.polyline(coords, { color: '#F59E0B', weight: 5, opacity: 0.9 }).addTo(map);
      const mkStart = L.divIcon({ className: '', html: '<div style="width:12px;height:12px;background:#22C55E;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>', iconSize: [12,12], iconAnchor: [6,6] });
      const mkEnd   = L.divIcon({ className: '', html: '<div style="width:12px;height:12px;background:#EF4444;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>', iconSize: [12,12], iconAnchor: [6,6] });
      L.marker(coords[0], { icon: mkStart }).addTo(map);
      L.marker(coords[coords.length - 1], { icon: mkEnd }).addTo(map);
    }, 100);
  }
}

function shareWalkToFeed(walkId) {
  document.getElementById('walk-detail-backdrop')?.remove();
  const w = (window._walkRecords || []).find(r => r.id === walkId);
  if (!w) return;

  window._communityTab = 'main';
  window._communityHashFilter = '';
  window._communitySearch = '';
  _postWalkData = { dogName: w.dogName, distance: w.distance, duration: w.duration, coordinates: w.coordinates || [] };
  renderCommunityPage();

  setTimeout(() => {
    const preview = document.getElementById('post-walk-preview');
    if (preview) {
      preview.style.display = 'block';
      preview.innerHTML = `<div class="community-walk-pill"><strong>${w.dogName || '산책'}</strong> · ${(w.distance||0).toFixed(2)}km · ${w.duration||0}분</div>`;
    }
    const textarea = document.getElementById('new-post-text');
    if (textarea) textarea.focus();
    document.getElementById('community-composer-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 200);
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

 if (!text.trim() && !_postImageData && !_postWalkData && !_postVideoId) {
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
 if (_postVideoId) postData.videoId = _postVideoId;

 CommunityService.createPost(postData);
 _postImageData = null;
 _postWalkData = null;
 _postVideoId = null;
 showToast('게시물이 등록됐어요!', 'success');
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
 const targetPost = CommunityService.getPostById(postId) || CommunityService.getFeed(1).find(p => p.id === postId);
 const wasLiked = targetPost && (targetPost.likedBy || []).includes(user.id);
 CommunityService.toggleLike(postId, user.id);
 if (!wasLiked && targetPost) {
   const tags = (targetPost.text || '').match(/#([\wㄱ-ㅎㅏ-ㅣ가-힣]+)/g) || [];
   if (tags.length) trackCommunityInterest(user.id, tags.map(t => t.slice(1)));
   if (targetPost.authorId && targetPost.authorId !== user.id) {
     const myName = user.nickname || user.name;
     const preview = (targetPost.text || '').slice(0, 20) || '게시물';
     addNotificationForUser(targetPost.authorId, `${myName}님이 게시물을 좋아해요 ❤️ "${preview}"`, 'like', { type: 'post', id: postId });
   }
 }
 renderCommunityPage({ preserveScroll: true });
 if (document.getElementById('post-detail-backdrop')) showPostDetail(postId);
 } catch (e) {
 console.error('[Pawsitive] 좋아요 오류:', e.message);
 }
}

function focusPostComment(postId) {
 const user = AuthService.getCurrentUser();
 if (!user) { showLoginModal('댓글을 작성하려면 로그인이 필요해요!'); return; }
 const inputEl = document.getElementById('comment-input-' + postId);
 if (inputEl) inputEl.focus();
}

function _renderCommentAvatar(profileImg, name, size) {
 return profileImg
   ? `<img src="${profileImg}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
   : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--color-border);display:flex;align-items:center;justify-content:center;font-size:${size*0.4}px;font-weight:700;flex-shrink:0;">${(name||'?').slice(0,1)}</div>`;
}

function _renderRepliesHtml(replies, postId, commentId) {
 return (replies || []).map(r => {
   const isRDeleted = _isDeletedUser(r.authorId);
   const rName = isRDeleted ? '알 수 없음' : (r.authorName || '알 수 없음');
   const rImg = isRDeleted ? '' : (r.authorProfileImage || '');
   const rClick = isRDeleted ? 'style="flex-shrink:0;"' : `onclick="closeCommunityCommentsPanel();handleCommunityUserClick('${r.authorId}')" style="cursor:pointer;flex-shrink:0;"`;
   const rNameClick = isRDeleted ? `style="font-size:0.8rem;"` : `onclick="closeCommunityCommentsPanel();handleCommunityUserClick('${r.authorId}')" style="font-size:0.8rem;cursor:pointer;"`;
   return `
   <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;">
     <span ${rClick}>${_renderCommentAvatar(rImg, rName, 28)}</span>
     <div style="flex:1;min-width:0;">
       <strong ${rNameClick}>${rName}</strong>
       <span style="font-size:0.8rem;color:var(--color-text);margin-left:5px;">${r.text}</span>
       <div style="display:flex;align-items:center;gap:10px;margin-top:2px;">
         <span style="font-size:0.7rem;color:var(--color-text-muted);">${formatTimeAgo(r.createdAt)}</span>
         ${!isRDeleted ? `<button onclick="toggleReplyInput('${commentId}','@${rName} ','${r.authorId}')" style="background:none;border:none;font-size:0.72rem;font-weight:600;color:var(--color-text-muted);cursor:pointer;padding:0;">답글 달기</button>` : ''}
       </div>
     </div>
   </div>
 `;
 }).join('');
}

function handleShowAllComments(postId) {
 const user = AuthService.getCurrentUser();
 if (!user) { showLoginModal('댓글을 보려면 로그인이 필요해요!'); return; }

 const post = CommunityService.getPostById(postId) || CommunityService.getFeed(1).find(p => p.id === postId);
 if (!post) return;

 document.getElementById('community-comments-panel')?.remove();
 document.getElementById('community-comments-backdrop')?.remove();

 const comments = post.comments || [];
 const storedUsers = StorageService.get('users', []);

 const itemsHtml = comments.length === 0
   ? '<div style="padding:32px 16px;text-align:center;color:var(--color-text-muted);font-size:0.85rem;">아직 댓글이 없어요</div>'
   : comments.map(c => {
       const author = storedUsers.find(u => u.id === c.authorId);
       const isCDeleted = _isDeletedUser(c.authorId);
       const cName = isCDeleted ? '알 수 없음' : (c.authorName || '알 수 없음');
       const profileImg = isCDeleted ? '' : (c.authorProfileImage || (author && author.profileImage) || '');
       const repliesHtml = _renderRepliesHtml(c.replies, postId, c.id);
       const cClick = isCDeleted ? 'style="cursor:default;flex-shrink:0;"' : `onclick="closeCommunityCommentsPanel();handleCommunityUserClick('${c.authorId}')" style="cursor:pointer;flex-shrink:0;"`;
       const cNameClick = isCDeleted ? 'style="font-size:0.85rem;"' : `onclick="closeCommunityCommentsPanel();handleCommunityUserClick('${c.authorId}')" style="font-size:0.85rem;cursor:pointer;"`;
       return `
         <div style="padding:12px 16px;border-bottom:1px solid var(--color-border-light);">
           <div style="display:flex;align-items:flex-start;gap:10px;">
             <span ${cClick}>${_renderCommentAvatar(profileImg, cName, 38)}</span>
             <div style="flex:1;min-width:0;">
               <strong ${cNameClick}>${cName}</strong>
               <span style="font-size:0.85rem;color:var(--color-text);margin-left:6px;">${c.text}</span>
               <div style="display:flex;align-items:center;gap:12px;margin-top:4px;">
                 <span style="font-size:0.72rem;color:var(--color-text-muted);">${formatTimeAgo(c.createdAt)}</span>
                 ${!isCDeleted ? `<button onclick="toggleReplyInput('${c.id}','@${cName} ','${c.authorId}')" style="background:none;border:none;font-size:0.75rem;font-weight:600;color:var(--color-text-muted);cursor:pointer;padding:0;">답글 달기</button>` : ''}
               </div>
             </div>
           </div>
           <div id="reply-input-${c.id}" style="display:none;padding-top:8px;padding-left:48px;">
             <div style="display:flex;gap:6px;">
               <input id="reply-text-${c.id}" type="text" placeholder="답글 입력..."
                 style="flex:1;border:1px solid var(--color-border);border-radius:20px;padding:6px 12px;font-size:0.82rem;outline:none;background:var(--color-bg-section);"
                 onkeydown="if(event.key==='Enter')handleAddReply('${postId}','${c.id}')">
               <button onclick="handleAddReply('${postId}','${c.id}')"
                 style="background:var(--color-primary);color:#fff;border:none;border-radius:20px;padding:6px 12px;font-size:0.8rem;cursor:pointer;white-space:nowrap;">전송</button>
             </div>
           </div>
           ${repliesHtml ? `<div id="replies-list-${c.id}" style="padding-left:48px;padding-top:4px;">${repliesHtml}</div>` : `<div id="replies-list-${c.id}" style="padding-left:48px;"></div>`}
         </div>
       `;
     }).join('');

 const backdrop = document.createElement('div');
 backdrop.id = 'community-comments-backdrop';
 backdrop.onclick = closeCommunityCommentsPanel;
 document.body.appendChild(backdrop);

 const panel = document.createElement('div');
 panel.id = 'community-comments-panel';
 panel.className = 'community-comments-panel';
 panel.innerHTML = `
   <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--color-border-light);flex-shrink:0;">
     <span style="font-weight:800;font-size:1rem;">댓글 ${comments.length}개</span>
     <button onclick="closeCommunityCommentsPanel()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--color-text-muted);line-height:1;">×</button>
   </div>
   <div style="overflow-y:auto;flex:1;">${itemsHtml}</div>
 `;
 document.body.appendChild(panel);
}

function closeCommunityCommentsPanel() {
 document.getElementById('community-comments-panel')?.remove();
 document.getElementById('community-comments-backdrop')?.remove();
}

function toggleReplyInput(commentId, mention, targetAuthorId) {
 const el = document.getElementById('reply-input-' + commentId);
 if (!el) return;
 el.style.display = 'block';
 const input = document.getElementById('reply-text-' + commentId);
 if (input) {
   const me = AuthService.getCurrentUser();
   const useMention = mention && (!me || me.id !== targetAuthorId);
   input.value = useMention ? mention : '';
   setTimeout(() => { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 50);
 }
}

function handleAddReply(postId, commentId) {
 const user = AuthService.getCurrentUser();
 if (!user) return;
 const input = document.getElementById('reply-text-' + commentId);
 const text = input ? input.value.trim() : '';
 if (!text) return;

 try {
   const reply = CommunityService.addReply(postId, commentId, {
     authorId: user.id,
     authorName: user.nickname || user.name,
     authorProfileImage: user.profileImage || '',
     text
   });
   // 댓글 작성자에게 알림
   const post = CommunityService.getPostById(postId) || CommunityService.getFeed(1).find(p => p.id === postId);
   const comment = post && (post.comments || []).find(c => c.id === commentId);
   if (comment && comment.authorId !== user.id) {
     addNotificationForUser(comment.authorId, `${user.nickname || user.name}님이 답글을 달았어요 💬 "${text.slice(0,20)}"`, 'comment', { type: 'post', id: postId });
   }
   // UI 업데이트 (패널 재렌더 없이 해당 대댓글 목록만 갱신)
   if (input) input.value = '';
   document.getElementById('reply-input-' + commentId).style.display = 'none';
   const listEl = document.getElementById('replies-list-' + commentId);
   if (listEl) {
     const updatedPost = CommunityService.getPostById(postId) || CommunityService.getFeed(1).find(p => p.id === postId);
     const updatedComment = updatedPost && (updatedPost.comments || []).find(c => c.id === commentId);
     listEl.innerHTML = _renderRepliesHtml(updatedComment ? updatedComment.replies : [], postId, commentId);
   }
 } catch(e) {
   console.error('[Pawsitive] 답글 오류:', e.message);
 }
}

function handleSharePost(postId) {
  const user = AuthService.getCurrentUser();
  if (!user) { showLoginModal('공유하려면 로그인이 필요해요!'); return; }
  showShareSheet(postId);
}

function showShareSheet(postId) {
  document.getElementById('share-sheet-backdrop')?.remove();

  const post = CommunityService.getFeed(1).find(p => p.id === postId);
  const rawText = (post && post.text || '').trim();
  const shareText = post
    ? `🐾 Pawsitive | ${post.authorName}의 게시물\n${rawText.slice(0, 80)}${rawText.length > 80 ? '...' : ''}`
    : '🐾 Pawsitive - 반려동물 커뮤니티';
  const shareUrl = window.location.origin + window.location.pathname + '#/community';
  window._shareData = { text: shareText, url: shareUrl };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  const twUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const hasNativeShare = !!navigator.share;

  const backdrop = document.createElement('div');
  backdrop.id = 'share-sheet-backdrop';
  backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:flex-end;justify-content:center;';
  backdrop.onclick = e => { if (e.target === backdrop) backdrop.remove(); };

  const sheet = document.createElement('div');
  sheet.style.cssText = 'background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:480px;padding:20px 20px 32px;animation:shareSheetUp 0.25s cubic-bezier(0.34,1.2,0.64,1);';
  sheet.innerHTML = `
    <style>
      @keyframes shareSheetUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
      .ss-icon-btn { display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:none;cursor:pointer;padding:0;text-decoration:none; }
      .ss-icon-circle { width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center; }
      .ss-icon-label { font-size:0.73rem;color:#374151;font-weight:500;white-space:nowrap; }
      .ss-row-btn { width:100%;padding:14px;border-radius:12px;font-size:0.9rem;font-weight:600;cursor:pointer;display:block;text-align:center;box-sizing:border-box; }
    </style>
    <div style="width:40px;height:4px;background:#e5e7eb;border-radius:2px;margin:0 auto 20px;"></div>
    <div style="font-weight:700;font-size:1rem;margin-bottom:20px;text-align:center;">공유하기</div>
    <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;margin-bottom:20px;padding:0 8px;">
      <button class="ss-icon-btn" id="ss-kakao">
        <div class="ss-icon-circle" style="background:#FEE500;">
          <svg viewBox="0 0 36 36" width="30" height="30"><path d="M18 3C9.72 3 3 8.37 3 15.03c0 4.28 2.66 8.03 6.66 10.2l-1.7 6.27c-.08.3.24.55.51.38L16.3 27.5c.56.05 1.13.08 1.7.08 8.28 0 15-5.37 15-12.03C33 8.37 26.28 3 18 3z" fill="#3C1E1E"/></svg>
        </div>
        <span class="ss-icon-label">카카오톡</span>
      </button>
      <a class="ss-icon-btn" href="${twUrl}" target="_blank" rel="noopener" onclick="document.getElementById('share-sheet-backdrop')?.remove()">
        <div class="ss-icon-circle" style="background:#000;">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </div>
        <span class="ss-icon-label">Twitter / X</span>
      </a>
      <a class="ss-icon-btn" href="${fbUrl}" target="_blank" rel="noopener" onclick="document.getElementById('share-sheet-backdrop')?.remove()">
        <div class="ss-icon-circle" style="background:#1877F2;">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </div>
        <span class="ss-icon-label">Facebook</span>
      </a>
      <button class="ss-icon-btn" id="ss-insta">
        <div class="ss-icon-circle" style="background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
        </div>
        <span class="ss-icon-label">Instagram</span>
      </button>
      <button class="ss-icon-btn" id="ss-copy">
        <div class="ss-icon-circle" style="background:#f3f4f6;">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
        <span class="ss-icon-label">링크 복사</span>
      </button>
    </div>
    ${hasNativeShare ? `<button class="ss-row-btn" id="ss-native" style="border:1.5px solid #e5e7eb;background:#fff;color:#374151;margin-bottom:10px;">더 많은 앱으로 공유</button>` : ''}
    <button class="ss-row-btn" id="ss-cancel" style="border:none;background:#f3f4f6;color:#374151;">취소</button>
  `;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);

  sheet.querySelector('#ss-kakao').onclick = _shareKakao;
  sheet.querySelector('#ss-insta').onclick = _shareInstagram;
  sheet.querySelector('#ss-copy').onclick = _shareCopyLink;
  if (hasNativeShare) sheet.querySelector('#ss-native').onclick = _shareNative;
  sheet.querySelector('#ss-cancel').onclick = () => backdrop.remove();
}

async function _shareKakao() {
  const { text, url } = window._shareData || {};
  if (!url) return;
  const isLocalhost = /^localhost$|^127\.|^0\.0\.0\.0$/.test(window.location.hostname);
  if (!isLocalhost && window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: 'Pawsitive',
        description: (text || '').split('\n').slice(1).join(' ').trim(),
        link: { mobileWebUrl: url, webUrl: url }
      }
    });
    return;
  }
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) {
    const kakaoUri = 'kakaotalk://msg/send?text=' + encodeURIComponent((text || '') + '\n' + url);
    const t0 = Date.now();
    window.location.href = kakaoUri;
    setTimeout(() => {
      if (Date.now() - t0 < 2000) {
        _shareCopyLink(true);
        showToast('카카오톡 앱을 찾을 수 없어요. 링크를 복사했어요!', 'info');
      }
    }, 1500);
  } else {
    await _shareCopyLink(true);
    showToast('링크를 복사했어요. 카카오톡에 붙여넣기해서 공유하세요!', 'info');
  }
}

async function _shareInstagram() {
  const { text, url } = window._shareData || {};
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile && navigator.share) {
    try {
      await navigator.share({ title: 'Pawsitive', text, url });
      document.getElementById('share-sheet-backdrop')?.remove();
    } catch(e) {
      if (e.name !== 'AbortError') showToast('공유 중 오류가 발생했어요.', 'error');
    }
  } else {
    await _shareCopyLink(true);
    showToast('Instagram은 앱에서만 공유할 수 있어요. 링크를 복사했어요!', 'info');
  }
}

async function _shareCopyLink(silent) {
  const url = (window._shareData || {}).url || window.location.href;
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    } else {
      const el = document.createElement('textarea');
      el.value = url;
      el.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    if (!silent) showToast('링크를 복사했어요!', 'success');
    document.getElementById('share-sheet-backdrop')?.remove();
  } catch(e) {
    showToast('복사에 실패했어요.', 'error');
  }
}

async function _shareNative() {
  const { text, url } = window._shareData || {};
  try {
    await navigator.share({ title: 'Pawsitive', text, url });
    document.getElementById('share-sheet-backdrop')?.remove();
  } catch(e) {
    if (e.name !== 'AbortError') showToast('공유 중 오류가 발생했어요.', 'error');
  }
}

function getSavedPostIds(user) {
 if (!user) return [];
 const saved = StorageService.get('savedPosts', {});
 return saved[user.id] || [];
}

function isSaved(postId, user) {
 return getSavedPostIds(user).includes(postId);
}

function handleToggleSave(postId) {
 const user = AuthService.getCurrentUser();
 if (!user) { showLoginModal('저장 기능은 로그인 후 이용할 수 있어요.'); return; }
 const saved = StorageService.get('savedPosts', {});
 const ids = saved[user.id] || [];
 const idx = ids.indexOf(postId);
 if (idx === -1) {
   ids.push(postId);
   showToast('게시물을 저장했어요.', 'success');
 } else {
   ids.splice(idx, 1);
   showToast('저장을 취소했어요.', 'info');
 }
 saved[user.id] = ids;
 StorageService.set('savedPosts', saved);
 renderCommunityPage({ preserveScroll: true });
}

function showLikesModal(postId) {
 const post = CommunityService.getFeed(1).find(p => p.id === postId);
 if (!post || !post.likedBy || post.likedBy.length === 0) return;

 const storedUsers = StorageService.get('users', []);
 const likedUsers = post.likedBy.map(uid => {
   const u = storedUsers.find(u => u.id === uid);
   return {
     id: uid,
     name: u ? (u.nickname || u.name || u.email) : '알 수 없는 사용자',
     profileImage: u ? (u.profileImage || '') : ''
   };
 });

 const modalId = 'likes-modal';
 document.getElementById(modalId)?.remove();
 const modal = document.createElement('div');
 modal.id = modalId;
 modal.className = 'expert-modal';
 modal.innerHTML = `
   <div class="expert-modal__card" style="max-width:360px;padding:0;border-radius:16px;overflow:hidden;">
     <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--color-border);">
       <strong style="font-size:0.95rem;">좋아요 ${likedUsers.length}개</strong>
       <button onclick="document.getElementById('${modalId}').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--color-text-muted);line-height:1;">×</button>
     </div>
     <div style="max-height:320px;overflow-y:auto;">
       ${likedUsers.map(u => `
         <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;"
           onclick="document.getElementById('${modalId}').remove();handleCommunityUserClick('${u.id}')">
           ${renderCommunityAvatar(u.profileImage, 'community-avatar')}
           <span style="font-size:0.9rem;font-weight:500;">${u.name}</span>
         </div>
       `).join('')}
     </div>
   </div>
 `;
 modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
 document.body.appendChild(modal);
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
 const targetPost = CommunityService.getPostById(postId) || CommunityService.getFeed(1).find(p => p.id === postId);
 CommunityService.addComment(postId, {
 authorId: user.id,
 authorName: user.nickname || user.name,
 authorProfileImage: user.profileImage || '',
 text: text
 });
 if (text.trim() && targetPost && targetPost.authorId && targetPost.authorId !== user.id) {
 const myName = user.nickname || user.name;
 addNotificationForUser(targetPost.authorId, `${myName}님이 댓글을 달았어요 💬 "${text.trim().slice(0, 20)}"`, 'comment', { type: 'post', id: postId });
 }
 renderCommunityPage({ preserveScroll: true });
 if (document.getElementById('post-detail-backdrop')) showPostDetail(postId);
 } catch (e) {
 console.error('[Pawsitive] 댓글 오류:', e.message);
 }
}

// --- 전문가 상담 ---

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
