// Pawsitive - Home Page
// --- 홈 페이지 ---
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
      /* 서비스 소개 버블 */
      .service-intro { display:flex; justify-content:center; align-items:center; padding:56px 24px; background:#fafaf8; }
      .service-bubble { position:relative; display:inline-flex; align-items:center; gap:6px; padding:18px 36px; background:#fff; border:none; border-radius:999px; box-shadow:0 6px 32px rgba(0,0,0,0.1); cursor:pointer; font-size:1rem; font-weight:600; color:#222; letter-spacing:-0.3px; transition:all 0.25s cubic-bezier(0.16,1,0.3,1); }
      .service-bubble:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,0.14); }
      .service-bubble::after { content:''; position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); border:6px solid transparent; border-top-color:#fff; filter:drop-shadow(0 3px 3px rgba(0,0,0,0.06)); }
      .service-bubble__logo { height:56px; width:auto; margin-right:0; margin-left:-19px; object-fit:contain; }
      /* 서비스 패널 */
      .service-panel { position:fixed; top:0; right:-480px; width:min(480px,100vw); height:100vh; background:#fff; z-index:2100; box-shadow:-8px 0 48px rgba(0,0,0,0.12); transition:right 0.45s cubic-bezier(0.16,1,0.3,1); overflow-y:auto; display:flex; flex-direction:column; }
      .service-panel.open { right:0; }
      .service-panel__head { padding:32px 32px 0; display:flex; align-items:center; justify-content:space-between; }
      .service-panel__logo { height:28px; width:auto; margin-left:-8px; }
      .service-panel__close { width:36px; height:36px; border:none; background:#f4f4f2; border-radius:50%; cursor:pointer; font-size:1.1rem; color:#666; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
      .service-panel__close:hover { background:#eee; }
      .service-panel__body { padding:28px 32px 48px; flex:1; }
      .service-panel__tag { display:inline-block; padding:4px 12px; border-radius:999px; background:#f0f0ec; font-size:0.72rem; font-weight:700; color:#888; letter-spacing:1px; text-transform:uppercase; margin-bottom:16px; }
      .service-panel__title { font-size:1.4rem; font-weight:700; letter-spacing:-0.5px; line-height:1.35; margin-bottom:24px; }
      .service-panel__item { display:flex; gap:16px; padding:20px 0; border-bottom:1px solid #f0f0ee; }
      .service-panel__item:last-child { border-bottom:none; }
      .service-panel__item-icon { width:44px; height:44px; border-radius:12px; background:#f8f8f6; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; }
      .service-panel__item-text h4 { font-size:0.92rem; font-weight:700; margin:0 0 4px; }
      .service-panel__item-text p { font-size:0.82rem; color:#888; line-height:1.6; margin:0; }
      .service-panel-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.28); z-index:2099; opacity:0; pointer-events:none; transition:opacity 0.3s; backdrop-filter:blur(2px); }
      .service-panel-overlay.open { opacity:1; pointer-events:all; }
    </style>
    <div class="hero-banner">
      <div class="hero-banner__bg"></div>
      <div class="hero-banner__overlay"></div>
      <div class="hero-banner__content">
        <h1 class="hero-banner__title">반려견과<br>함께하는<br><span>더 나은 일상.</span></h1>
        <p class="hero-banner__sub">AI 건강 상담부터 산책 매칭까지,<br>당신과 반려견을 위한 공간.</p>
        ${!user
          ? `<button class="hero-banner__btn" onclick="Router.navigate('/register')">시작하기 →</button>`
          : `<button class="hero-banner__btn" onclick="Router.navigate('/dog-walker')">도그워커 찾기 →</button>`
        }
      </div>
      <div class="hero-banner__scroll">
        <span>scroll to explore</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 8 10 14 16 8"/>
        </svg>
      </div>
    </div>
    <div class="service-intro">
      <button class="service-bubble" onclick="openServicePanel()">
        <img src="/pawsitive_logo_transparent.png" class="service-bubble__logo" alt="Pawsitive">
        는 어떤 서비스일까요?
      </button>
    </div>

    <div id="service-panel" class="service-panel">
      <div class="service-panel__head">
        <img src="/pawsitive_logo_transparent.png" class="service-panel__logo" alt="Pawsitive">
        <button class="service-panel__close" onclick="closeServicePanel()">✕</button>
      </div>
      <div class="service-panel__body">
        <span class="service-panel__tag">서비스 소개</span>
        <h2 class="service-panel__title">반려견과 함께하는<br>더 나은 일상을 만들어요</h2>
        <div class="service-panel__item">
          <div class="service-panel__item-icon">🦮</div>
          <div class="service-panel__item-text">
            <h4>산책 도우미 매칭</h4>
            <p>추후 서비스 설명을 입력해주세요.</p>
          </div>
        </div>
        <div class="service-panel__item">
          <div class="service-panel__item-icon">🩺</div>
          <div class="service-panel__item-text">
            <h4>AI 건강 진단</h4>
            <p>추후 서비스 설명을 입력해주세요.</p>
          </div>
        </div>
        <div class="service-panel__item">
          <div class="service-panel__item-icon">💬</div>
          <div class="service-panel__item-text">
            <h4>AI 반려견 상담</h4>
            <p>추후 서비스 설명을 입력해주세요.</p>
          </div>
        </div>
        <div class="service-panel__item">
          <div class="service-panel__item-icon">🐕</div>
          <div class="service-panel__item-text">
            <h4>품종 정보 & 교육 센터</h4>
            <p>추후 서비스 설명을 입력해주세요.</p>
          </div>
        </div>
      </div>
    </div>
    <div id="service-panel-overlay" class="service-panel-overlay" onclick="closeServicePanel()"></div>

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
        <span class="modern-footer-item">© 2026 Pawsitive</span>
        <span class="modern-footer-item">Seoul, Korea</span>
      </div>
    </div>
  `;
  setTimeout(() => BreedImageService.loadAll(), 100);
}


