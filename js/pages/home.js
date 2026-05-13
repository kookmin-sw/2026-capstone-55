// Pawsitive - Home Page

function renderHomePage() {
 _cleanupMaps();
 window.scrollTo(0, 0);
 const user = AuthService.getCurrentUser();
 const app = document.getElementById('app');
 if (!app) return;

 app.innerHTML = `
 <style>
 .hero-banner { position:relative; overflow:hidden; height:calc(100vh - 64px); min-height:520px; width:100%; }
 .hero-banner__bg { position:absolute; inset:0; background:url('/background_pawsitive.png') center/cover no-repeat; animation:heroBgSlideUp 1.2s cubic-bezier(0.16,1,0.3,1) both; }
 .hero-banner__overlay { position:absolute; inset:0; background:linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 60%, transparent 100%); }
 .hero-banner__content { position:absolute; top:50%; left:0; transform:translateY(-50%); z-index:1; padding:0 60px; max-width:540px; animation:heroContentUp 0.9s 0.25s cubic-bezier(0.16,1,0.3,1) both; }
 .hero-banner__title { font-size:clamp(2rem,4.5vw,3.2rem); font-weight:700; color:#fff; letter-spacing:-1px; line-height:1.2; margin:0 0 16px; }
 .hero-banner__title span { color:rgba(255,255,255,0.72); }
 .hero-banner__sub { font-size:0.95rem; color:rgba(255,255,255,0.82); line-height:1.7; margin-bottom:32px; }
 .hero-banner__btn { display:inline-flex; align-items:center; padding:12px 28px; border-radius:999px; background:#fff; color:#222; font-weight:700; font-size:0.9rem; border:none; cursor:pointer; transition:all 0.2s; }
 .hero-banner__btn:hover { background:#f0f0f0; transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.15); }
 .hero-banner__scroll { position:absolute; bottom:36px; left:50%; transform:translateX(-50%); z-index:2; display:flex; flex-direction:column; align-items:center; gap:8px; animation:heroScrollFloat 2.4s ease-in-out infinite; }
 .hero-banner__scroll span { font-size:0.65rem; color:rgba(255,255,255,0.7); letter-spacing:2.5px; text-transform:uppercase; font-weight:500; }
 .hero-banner__scroll svg { opacity:0.7; }
 @keyframes heroBgSlideUp { 0%{transform:translateY(60px);opacity:0.5} 100%{transform:translateY(0);opacity:1} }
 @keyframes heroContentUp { 0%{opacity:0;transform:translateY(-40%) } 100%{opacity:1;transform:translateY(-50%)} }
 @keyframes heroScrollFloat { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-10px)} }
 @media(max-width:600px){ .hero-banner{height:calc(100vh - 64px);} .hero-banner__content{padding:0 24px;} }
 .modern-footer { display:flex; justify-content:space-between; align-items:center; padding:24px 0; margin-top:60px; border-top:1px solid var(--color-border); }
 .modern-footer-item { font-size:0.72rem; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; }
 </style>
 <div class="hero-banner">
 <div class="hero-banner__bg"></div>
 <div class="hero-banner__overlay"></div>
 <div class="hero-banner__content">
 <h1 class="hero-banner__title">반려견과<br>함께하는<br><span>더 나은 일상.</span></h1>
 <p class="hero-banner__sub">AI 건강 상담부터 산책 매칭까지,<br>당신과 반려견을 위한 공간.</p>
 ${!user
 ? `<button class="hero-banner__btn" onclick="Router.navigate('/register')">시작하기 →</button>`
 : `<button class="hero-banner__btn" onclick="Router.navigate('/matching')">산책 매칭 →</button>`
 }
 </div>
 <div class="hero-banner__scroll">
 <span>scroll to explore</span>
 <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
 <polyline points="4 8 10 14 16 8"/>
 </svg>
 </div>
 </div>

 <section class="svc-section">
 <style>
 .svc-section { padding:80px 24px 96px; background:#f7f6f3; }
 .svc-header { text-align:center; margin-bottom:56px; }
 .svc-header__eyebrow { display:inline-block; font-size:0.72rem; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#7c6ff7; margin-bottom:14px; }
 .svc-header__title { font-size:clamp(1.6rem,3vw,2.2rem); font-weight:800; letter-spacing:-1px; color:#111; line-height:1.25; }
 .svc-header__title span { color:#7c6ff7; }
 .svc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; max-width:1080px; margin:0 auto; }
 .svc-grid--bottom { grid-template-columns:repeat(2,1fr); max-width:720px; margin:20px auto 0; }
 .svc-card { background:#fff; border-radius:20px; padding:32px 28px 0; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.06); transition:transform 0.25s cubic-bezier(0.16,1,0.3,1),box-shadow 0.25s; cursor:pointer; display:flex; flex-direction:column; min-height:300px; }
 .svc-card:hover { transform:translateY(-6px); box-shadow:0 12px 40px rgba(0,0,0,0.1); }
 .svc-card__tag { display:inline-block; padding:4px 12px; border-radius:999px; font-size:0.72rem; font-weight:700; letter-spacing:0.5px; margin-bottom:14px; }
 .svc-card__title { font-size:1.12rem; font-weight:800; letter-spacing:-0.5px; line-height:1.35; color:#111; margin-bottom:10px; }
 .svc-card__title em { font-style:normal; }
 .svc-card__desc { font-size:0.82rem; color:#888; line-height:1.7; margin-bottom:24px; flex:1; }
 .svc-card__illust { margin:0 -28px; height:130px; position:relative; overflow:hidden; border-radius:0 0 20px 20px; }

 /* 카드별 컬러 테마 */
 .svc-card--match .svc-card__tag { background:#ede9ff; color:#6c47ff; }
 .svc-card--match .svc-card__title em { color:#6c47ff; }
 .svc-card--match .svc-card__illust { background:linear-gradient(135deg,#ede9ff 0%,#d4caff 100%); }

 .svc-card--gps .svc-card__tag { background:#e0f2fe; color:#0284c7; }
 .svc-card--gps .svc-card__title em { color:#0284c7; }
 .svc-card--gps .svc-card__illust { background:linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%); }

 .svc-card--ai .svc-card__tag { background:#fce7f3; color:#be185d; }
 .svc-card--ai .svc-card__title em { color:#be185d; }
 .svc-card--ai .svc-card__illust { background:linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%); }

 .svc-card--edu .svc-card__tag { background:#fef3c7; color:#b45309; }
 .svc-card--edu .svc-card__title em { color:#b45309; }
 .svc-card--edu .svc-card__illust { background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%); }

 .svc-card--breed .svc-card__tag { background:#dcfce7; color:#15803d; }
 .svc-card--breed .svc-card__title em { color:#15803d; }
 .svc-card--breed .svc-card__illust { background:linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%); }

 /* 일러스트: 매칭 카드 */
 .illust-match { position:absolute; bottom:0; left:50%; transform:translateX(-50%); display:flex; gap:10px; align-items:flex-end; padding-bottom:0; }
 .illust-match__card { background:#fff; border-radius:12px 12px 0 0; padding:10px 14px; box-shadow:0 4px 16px rgba(108,71,255,0.15); display:flex; flex-direction:column; align-items:center; gap:6px; width:80px; }
 .illust-match__card:nth-child(2) { transform:translateY(-12px); box-shadow:0 8px 24px rgba(108,71,255,0.25); }
 .illust-match__avatar { width:40px; height:40px; border-radius:50%; object-fit:cover; object-position:top; border:2px solid #ede9ff; }
 .illust-match__score { font-size:0.6rem; font-weight:700; color:#6c47ff; background:#ede9ff; padding:2px 7px; border-radius:999px; }
 .illust-match__name { font-size:0.6rem; font-weight:600; color:#555; }

 /* 일러스트: GPS 카드 */
 .illust-gps { position:absolute; inset:0; }
 .illust-gps__grid { position:absolute; inset:0; background-image:linear-gradient(rgba(2,132,199,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(2,132,199,0.08) 1px,transparent 1px); background-size:24px 24px; }
 .illust-gps__route { position:absolute; bottom:16px; left:50%; transform:translateX(-50%); }
 .illust-gps__badge { position:absolute; top:16px; right:20px; background:#0284c7; color:#fff; font-size:0.62rem; font-weight:700; padding:5px 10px; border-radius:999px; white-space:nowrap; box-shadow:0 3px 10px rgba(2,132,199,0.35); animation:gpsPulse 2s ease-in-out infinite; }
 @keyframes gpsPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }

 /* 일러스트: AI 상담 카드 */
 .illust-ai { position:absolute; bottom:12px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; gap:7px; width:220px; }
 .illust-ai__bubble { padding:8px 14px; border-radius:12px; font-size:0.68rem; font-weight:500; line-height:1.4; max-width:180px; }
 .illust-ai__bubble--user { background:#fce7f3; color:#be185d; align-self:flex-end; border-radius:12px 12px 4px 12px; }
 .illust-ai__bubble--ai { background:#fff; color:#555; align-self:flex-start; border-radius:12px 12px 12px 4px; box-shadow:0 2px 8px rgba(0,0,0,0.08); }

 /* 일러스트: 교육 카드 */
 .illust-edu { position:absolute; bottom:14px; left:50%; transform:translateX(-50%); display:flex; flex-wrap:wrap; gap:6px; justify-content:center; width:260px; }
 .illust-edu__chip { padding:5px 12px; border-radius:999px; font-size:0.65rem; font-weight:700; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.07); white-space:nowrap; }

 /* 일러스트: 품종 카드 */
 .illust-breed { position:absolute; bottom:0; left:50%; transform:translateX(-50%); background:#fff; border-radius:14px 14px 0 0; width:220px; padding:14px 16px 0; box-shadow:0 4px 20px rgba(21,128,61,0.15); }
 .illust-breed__bar { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
 .illust-breed__label { font-size:0.62rem; font-weight:600; color:#555; width:48px; }
 .illust-breed__track { flex:1; height:7px; background:#f0fdf4; border-radius:999px; overflow:hidden; }
 .illust-breed__fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#4ade80,#15803d); }
 .illust-breed__val { font-size:0.62rem; font-weight:700; color:#15803d; width:26px; text-align:right; }

 @media(max-width:768px) {
 .svc-grid { grid-template-columns:1fr; }
 .svc-grid--bottom { grid-template-columns:1fr; max-width:100%; }
 .svc-card { min-height:260px; }
 }
 </style>

 <div class="svc-header">
 <span class="svc-header__eyebrow">Pawsitive Services</span>
 <h2 class="svc-header__title">반려견과의 일상을<br><span>더 특별하게</span> 만드는 5가지</h2>
 </div>

 <div class="svc-grid">

 <!-- 카드 1: AI 매칭 -->
 <div class="svc-card svc-card--match" onclick="Router.navigate('/matching')">
 <span class="svc-card__tag">${icon('handshake', 13, '#6c47ff')} 산책 매칭</span>
 <h3 class="svc-card__title"><em>AI가 골라주는</em><br>딱 맞는 산책 도우미</h3>
 <p class="svc-card__desc">반려견 크기·성격·선호 시간대를 분석해<br>가장 잘 맞는 도우미를 추천해드려요</p>
 <div class="svc-card__illust">
 <div class="illust-match">
 <div class="illust-match__card">
 <img class="illust-match__avatar" src="/images/cards/avatar-minser.png" alt="김민서">
 <div class="illust-match__score">${icon('star', 10, '#6c47ff')} 88점</div>
 <div class="illust-match__name">김민서</div>
 </div>
 <div class="illust-match__card">
 <img class="illust-match__avatar" src="/images/cards/avatar-suyeon.png" alt="이수연">
 <div class="illust-match__score">${icon('star', 10, '#6c47ff')} 96점</div>
 <div class="illust-match__name">이수연</div>
 </div>
 <div class="illust-match__card">
 <img class="illust-match__avatar" src="/images/cards/avatar-jihun.png" alt="박지훈">
 <div class="illust-match__score">${icon('star', 10, '#6c47ff')} 91점</div>
 <div class="illust-match__name">박지훈</div>
 </div>
 </div>
 </div>
 </div>

 <!-- 카드 2: GPS -->
 <div class="svc-card svc-card--gps" onclick="Router.navigate('/walk-tracking')">
 <span class="svc-card__tag">${icon('map-pin', 13, '#0284c7')} GPS 추적</span>
 <h3 class="svc-card__title"><em>실시간 위치</em>로<br>안심하고 맡기세요</h3>
 <p class="svc-card__desc">산책 중 도우미 위치를 지도에서 확인하고<br>완료 후 이동 경로와 기록을 저장해요</p>
 <div class="svc-card__illust">
 <div class="illust-gps">
 <div class="illust-gps__grid"></div>
 <div class="illust-gps__badge">${icon('navigation', 11, '#fff')} 실시간 추적 중</div>
 <div class="illust-gps__route">
 <svg width="220" height="70" viewBox="0 0 220 70" fill="none">
 <path d="M10 60 Q40 20 70 35 Q100 50 130 25 Q160 5 200 20" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="5 3" stroke-linecap="round" fill="none" opacity="0.5"/>
 <path d="M10 60 Q40 20 70 35 Q100 50 130 25 Q160 5 190 18" stroke="#0284c7" stroke-width="3" stroke-linecap="round" fill="none"/>
 <circle cx="10" cy="60" r="5" fill="#0284c7" opacity="0.4"/>
 <circle cx="190" cy="18" r="7" fill="#0284c7"/>
 <circle cx="190" cy="18" r="13" fill="#0284c7" opacity="0.2"/>
 </svg>
 </div>
 </div>
 </div>
 </div>

 <!-- 카드 3: AI 건강 상담 -->
 <div class="svc-card svc-card--ai" onclick="Router.navigate('/ai')">
 <span class="svc-card__tag">${icon('activity', 13, '#be185d')} AI 건강 상담</span>
 <h3 class="svc-card__title"><em>증상을 말하면</em><br>AI가 바로 분석해요</h3>
 <p class="svc-card__desc">사진·텍스트로 증상을 올리면 AI가<br>원인을 분석하고 대처법을 알려드려요</p>
 <div class="svc-card__illust">
 <div class="illust-ai">
 <div class="illust-ai__bubble illust-ai__bubble--user">${icon('paw-print', 12, '#be185d')} 우리 강아지가 자꾸 긁어요</div>
 <div class="illust-ai__bubble illust-ai__bubble--ai">${icon('bot', 12, '#888')} 피부 알레르기 가능성이 있어요. 식단과 환경 체크가 필요해요</div>
 </div>
 </div>
 </div>

 </div><!-- /svc-grid -->

 <div class="svc-grid svc-grid--bottom">

 <!-- 카드 4: 교육 센터 -->
 <div class="svc-card svc-card--edu" onclick="Router.navigate('/education')">
 <span class="svc-card__tag">${icon('book-open', 13, '#b45309')} 교육 센터</span>
 <h3 class="svc-card__title"><em>44가지</em> 반려견<br>교육 콘텐츠</h3>
 <p class="svc-card__desc">기본상식부터 훈련, 건강관리, 영양까지<br>10개 카테고리로 배워볼 수 있어요</p>
 <div class="svc-card__illust">
 <div class="illust-edu">
 <span class="illust-edu__chip" style="color:#b45309;">${icon('paw-print', 11, '#b45309')} 기본상식</span>
 <span class="illust-edu__chip" style="color:#7c3aed;">${icon('activity', 11, '#7c3aed')} 훈련</span>
 <span class="illust-edu__chip" style="color:#be185d;">${icon('heart', 11, '#be185d')} 건강관리</span>
 <span class="illust-edu__chip" style="color:#0369a1;">${icon('utensils', 11, '#0369a1')} 영양/식이</span>
 <span class="illust-edu__chip" style="color:#15803d;">${icon('wand-2', 11, '#15803d')} 미용/관리</span>
 <span class="illust-edu__chip" style="color:#b45309;">${icon('shield-check', 11, '#b45309')} 안전</span>
 <span class="illust-edu__chip" style="color:#6b7280;">${icon('glasses', 11, '#6b7280')} 노견케어</span>
 </div>
 </div>
 </div>

 <!-- 카드 5: 품종 정보 -->
 <div class="svc-card svc-card--breed" onclick="Router.navigate('/breeds')">
 <span class="svc-card__tag">${icon('paw-print', 13, '#15803d')} 품종 정보</span>
 <h3 class="svc-card__title"><em>200여 품종</em> 백과사전<br>+ AI 맞춤 추천</h3>
 <p class="svc-card__desc">생활환경과 선호도를 입력하면 AI가<br>나에게 딱 맞는 품종을 추천해드려요</p>
 <div class="svc-card__illust">
 <div class="illust-breed">
 <div class="illust-breed__bar">
 <span class="illust-breed__label">${icon('activity', 10, '#15803d')} 활동성</span>
 <div class="illust-breed__track"><div class="illust-breed__fill" style="width:85%"></div></div>
 <span class="illust-breed__val">85%</span>
 </div>
 <div class="illust-breed__bar">
 <span class="illust-breed__label">${icon('heart', 10, '#15803d')} 친화성</span>
 <div class="illust-breed__track"><div class="illust-breed__fill" style="width:92%"></div></div>
 <span class="illust-breed__val">92%</span>
 </div>
 <div class="illust-breed__bar">
 <span class="illust-breed__label">${icon('star', 10, '#15803d')} 훈련성</span>
 <div class="illust-breed__track"><div class="illust-breed__fill" style="width:70%"></div></div>
 <span class="illust-breed__val">70%</span>
 </div>
 </div>
 </div>
 </div>

 </div><!-- /svc-grid--bottom -->
 </section>

 <!-- 산책 절차 섹션 -->
 <section class="walk-flow-section">
 <style>
 .walk-flow-section { padding:96px 24px 100px; background:linear-gradient(160deg,#0f0c29 0%,#1a1060 50%,#24243e 100%); position:relative; overflow:hidden; }
 .walk-flow-section::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(108,71,255,0.18) 0%, transparent 70%); pointer-events:none; }
 .walk-flow__eyebrow { text-align:center; font-size:0.72rem; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:rgba(180,160,255,0.8); margin-bottom:14px; }
 .walk-flow__title { text-align:center; font-size:clamp(1.6rem,3.5vw,2.4rem); font-weight:800; color:#fff; letter-spacing:-1px; margin-bottom:12px; line-height:1.2; }
 .walk-flow__title span { background:linear-gradient(90deg,#a78bfa,#60a5fa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
 .walk-flow__sub { text-align:center; font-size:0.88rem; color:rgba(255,255,255,0.5); margin-bottom:64px; line-height:1.7; }
 .walk-flow__track { display:flex; align-items:flex-start; justify-content:center; gap:0; max-width:960px; margin:0 auto 56px; position:relative; }
 .walk-flow__step { display:flex; flex-direction:column; align-items:center; flex:1; position:relative; z-index:1; }
 .walk-flow__connector { flex:1; height:2px; background:linear-gradient(90deg,rgba(108,71,255,0.6),rgba(96,165,250,0.6)); margin-top:32px; position:relative; }
 .walk-flow__connector::after { content:'▶'; position:absolute; right:-6px; top:50%; transform:translateY(-50%); font-size:10px; color:rgba(96,165,250,0.7); }
 .walk-flow__icon-wrap { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:16px; position:relative; transition:transform 0.3s; }
 .walk-flow__icon-wrap::before { content:''; position:absolute; inset:-3px; border-radius:50%; background:linear-gradient(135deg,#a78bfa,#60a5fa); opacity:0.35; }
 .walk-flow__step:hover .walk-flow__icon-wrap { transform:translateY(-6px) scale(1.08); }
 .walk-flow__num { position:absolute; top:-6px; right:-4px; width:20px; height:20px; border-radius:50%; background:linear-gradient(135deg,#7c3aed,#2563eb); color:#fff; font-size:0.6rem; font-weight:800; display:flex; align-items:center; justify-content:center; z-index:2; }
 .walk-flow__label { font-size:0.82rem; font-weight:700; color:#fff; margin-bottom:6px; text-align:center; white-space:nowrap; }
 .walk-flow__desc { font-size:0.72rem; color:rgba(255,255,255,0.45); text-align:center; line-height:1.55; max-width:100px; }
 .walk-flow__cta { display:flex; justify-content:center; }
 .walk-flow__cta-btn { display:inline-flex; align-items:center; gap:10px; padding:16px 36px; border-radius:999px; background:linear-gradient(135deg,#7c3aed,#2563eb); color:#fff; font-weight:700; font-size:0.92rem; border:none; cursor:pointer; transition:all 0.25s; box-shadow:0 8px 30px rgba(124,58,237,0.35); }
 .walk-flow__cta-btn:hover { transform:translateY(-3px); box-shadow:0 14px 40px rgba(124,58,237,0.45); }
 @media(max-width:640px) {
   .walk-flow__track { flex-direction:column; align-items:center; gap:0; }
   .walk-flow__connector { width:2px; height:32px; flex:none; margin:0; background:linear-gradient(180deg,rgba(108,71,255,0.6),rgba(96,165,250,0.6)); }
   .walk-flow__connector::after { content:'▼'; right:auto; left:50%; top:auto; bottom:-8px; transform:translateX(-50%); }
   .walk-flow__step { flex-direction:row; gap:16px; align-items:center; width:100%; max-width:320px; }
   .walk-flow__icon-wrap { flex-shrink:0; margin-bottom:0; }
   .walk-flow__desc { max-width:none; text-align:left; }
   .walk-flow__label { text-align:left; }
 }
 </style>

 <p class="walk-flow__eyebrow">How it works</p>
 <h2 class="walk-flow__title">Pawsitive <span>산책 매칭</span> 절차</h2>
 <p class="walk-flow__sub">신청부터 귀가까지 — 5단계로 안전하고 간편하게</p>

 <div class="walk-flow__track">

   <div class="walk-flow__step">
     <div class="walk-flow__icon-wrap" style="background:rgba(124,58,237,0.2);">
       ${icon('calendar', 28, '#a78bfa')}
       <span class="walk-flow__num">1</span>
     </div>
     <div class="walk-flow__label">산책 요청</div>
     <div class="walk-flow__desc">반려견 정보·시간·지역 선택 후 원클릭 요청</div>
   </div>

   <div class="walk-flow__connector"></div>

   <div class="walk-flow__step">
     <div class="walk-flow__icon-wrap" style="background:rgba(37,99,235,0.2);">
       ${icon('sparkles', 28, '#60a5fa')}
       <span class="walk-flow__num">2</span>
     </div>
     <div class="walk-flow__label">AI 매칭</div>
     <div class="walk-flow__desc">성격·지역·시간대 분석 후 최적 도우미 추천</div>
   </div>

   <div class="walk-flow__connector"></div>

   <div class="walk-flow__step">
     <div class="walk-flow__icon-wrap" style="background:rgba(2,132,199,0.2);">
       ${icon('map-pin', 28, '#38bdf8')}
       <span class="walk-flow__num">3</span>
     </div>
     <div class="walk-flow__label">도우미 픽업</div>
     <div class="walk-flow__desc">약속 장소에서 도우미가 반려견 직접 픽업</div>
   </div>

   <div class="walk-flow__connector"></div>

   <div class="walk-flow__step">
     <div class="walk-flow__icon-wrap" style="background:rgba(16,185,129,0.2);">
       ${icon('navigation', 28, '#34d399')}
       <span class="walk-flow__num">4</span>
     </div>
     <div class="walk-flow__label">GPS 실시간 산책</div>
     <div class="walk-flow__desc">앱에서 도우미 위치·경로를 실시간 확인</div>
   </div>

   <div class="walk-flow__connector"></div>

   <div class="walk-flow__step">
     <div class="walk-flow__icon-wrap" style="background:rgba(245,158,11,0.2);">
       ${icon('home', 28, '#fbbf24')}
       <span class="walk-flow__num">5</span>
     </div>
     <div class="walk-flow__label">안전 귀가</div>
     <div class="walk-flow__desc">산책 완료 후 경로·사진 리포트 자동 발송</div>
   </div>

 </div>

 <div class="walk-flow__cta">
   <button class="walk-flow__cta-btn" onclick="Router.navigate('/matching')">
     지금 산책 도우미 찾기 →
   </button>
 </div>
 </section>

 <div class="page-content">
 <div class="home-section">
 <div class="home-section__hd">
 <span class="home-section__title">품종 정보</span>
 <button class="home-section__more" onclick="Router.navigate('/breeds')">전체보기 →</button>
 </div>
 <div class="grid-3" id="home-breed-grid">${renderBreedCards(BreedService.getAll().slice(0, 6))}</div>
 </div>
 <div class="home-section">
 <div class="home-section__hd">
 <span class="home-section__title">교육 센터</span>
 <button class="home-section__more" onclick="Router.navigate('/education')">전체보기 →</button>
 </div>
 <div class="grid-3">${renderEducationCards(EducationService.getByCategory('all').slice(0, 6), user ? EducationService.getProgress(user.id).completedIds : [])}</div>
 </div>
 <div class="modern-footer">
 <span class="modern-footer-item">ⓒ 2026 Pawsitive</span>
 <span class="modern-footer-item">Seoul, Korea</span>
 </div>
 </div>
 `;
 setTimeout(() => BreedImageService.loadAll(), 100);
}


// --- 품종 목록 페이지 (탭: 백과사전 / AI 추천) ---
