// Pawsitive - Health Dashboard Page
// --- 건강 분석 대시보드 페이지 ---
async function renderHealthDashboardPage() {
  const user = AuthService.getCurrentUser();
  if (!user) {
    renderPage(`
      <div class="page-header">
        <h1>AI 건강 분석</h1>
        <p>반려견의 건강 리포트</p>
      </div>

      <div style="width:140px; height:140px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-direction:column; margin:0 auto 24px; border:8px solid #e5e3e0;">
        <div style="font-size:2rem; font-weight:800; color:#ccc;">-</div>
        <div style="font-size:0.72rem; color:var(--color-text-muted);">활동 점수</div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
        <div class="card" style="padding:20px;">
          <div style="font-size:0.8rem; color:var(--color-text-muted);">이번 주 산책</div>
          <div style="font-size:1.5rem; font-weight:800; margin-top:4px;">0<span style="font-size:0.9rem;font-weight:500;">회</span></div>
          <div style="font-size:0.72rem; color:var(--color-text-muted); margin-top:4px;">총 0회</div>
        </div>
        <div class="card" style="padding:20px;">
          <div style="font-size:0.8rem; color:var(--color-text-muted);">이번 주 거리</div>
          <div style="font-size:1.5rem; font-weight:800; margin-top:4px;">0<span style="font-size:0.9rem;font-weight:500;">km</span></div>
          <div style="font-size:0.72rem; color:var(--color-text-muted); margin-top:4px;">총 0km</div>
        </div>
        <div class="card" style="padding:20px;">
          <div style="font-size:0.8rem; color:var(--color-text-muted);">이번 주 시간</div>
          <div style="font-size:1.5rem; font-weight:800; margin-top:4px;">0<span style="font-size:0.9rem;font-weight:500;">분</span></div>
          <div style="font-size:0.72rem; color:var(--color-text-muted); margin-top:4px;">평균 0분/회</div>
        </div>
        <div class="card" style="padding:20px;">
          <div style="font-size:0.8rem; color:var(--color-text-muted);">이번 주 칼로리</div>
          <div style="font-size:1.5rem; font-weight:800; margin-top:4px;">0<span style="font-size:0.9rem;font-weight:500;">kcal</span></div>
          <div style="font-size:0.72rem; color:var(--color-text-muted); margin-top:4px;">평균 0km/회</div>
        </div>
      </div>

      <div class="card" style="padding:20px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="margin:0;">AI 분석 결과</h3>
        </div>
        <div style="padding:24px; text-align:center; color:var(--color-text-muted);">
          <p>로그인하면 AI 건강 분석을 이용할 수 있어요</p>
        </div>
      </div>

      <button class="btn btn-primary" style="width:100%; padding:14px; font-size:1rem;" onclick="Router.navigate('/login')">로그인하고 건강 분석 시작하기</button>
    `);
    return;
  }

  const dogs = user.dogs || [];
  const selectedDogId = StorageService.get('selectedDogId', dogs.length > 0 ? dogs[0].name : '_all');
  const dog = dogs.find(d => d.name === selectedDogId) || dogs[0] || null;
  const displayName = dog ? dog.name : '반려견';

  renderPage(`
    <style>
      .health-page { max-width:740px; margin:0 auto; padding-bottom:40px; }
      .health-hero {
        position:relative;
        overflow:hidden;
        min-height:306px;
        margin:0 0 28px;
        padding:38px 32px 30px;
        border:1px solid #DDE6F0;
        border-radius:8px;
        background-image:
          linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.93) 46%, rgba(255,255,255,.66) 72%, rgba(255,255,255,.24) 100%),
          url('/images/generated/health-analysis-hero.png');
        background-size:cover, cover;
        background-position:center, 44% center;
        background-repeat:no-repeat;
        box-shadow:0 18px 44px rgba(15,23,42,.065);
      }
      .health-hero > * { position:relative; z-index:1; }
      .health-hero__content { max-width:520px; }
      .health-hero__eyebrow { display:inline-flex; align-items:center; gap:7px; padding:6px 11px; border:1px solid rgba(15,118,110,.16); border-radius:999px; background:#F4FBF8; color:#0F766E; font-size:.72rem; font-weight:900; margin-bottom:14px; box-shadow:0 8px 18px rgba(15,118,110,.06); }
      .health-hero__title { max-width:500px; margin:0 0 11px; color:#0B1220; font-size:clamp(1.75rem, 4vw, 2.35rem); font-weight:950; line-height:1.18; letter-spacing:0; }
      .health-hero__sub { max-width:500px; margin:0; color:#52637A; font-size:.92rem; line-height:1.68; }
      .health-hero__aside { position:absolute; right:28px; bottom:28px; width:184px; padding:14px 15px; border:1px solid #DDE6F0; border-radius:8px; background:rgba(255,255,255,.9); box-shadow:0 14px 34px rgba(15,23,42,.07); backdrop-filter:blur(10px); }
      .health-hero__aside span { display:block; color:#8290A3; font-size:.68rem; font-weight:900; margin-bottom:4px; }
      .health-hero__aside strong { display:block; color:#0B1220; font-size:1.02rem; font-weight:950; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .health-hero__aside small { display:block; margin-top:5px; color:#64748B; font-size:.7rem; font-weight:750; }
      .health-dog-chips { display:flex; gap:8px; margin:20px 0 14px; flex-wrap:wrap; }
      .health-dog-chip { padding:8px 18px; border:1px solid rgba(203,213,225,.9); border-radius:999px; font-size:0.82rem; font-weight:800; background:rgba(255,255,255,.9); cursor:pointer; transition:all 0.15s; box-shadow:0 8px 18px rgba(15,23,42,.04); }
      .health-dog-chip.active { background:#0B1220; color:#fff; border-color:#0B1220; }
      .health-score-ring { width:140px; height:140px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-direction:column; margin:0 auto 24px; position:relative; }
      .health-score-ring__value { font-size:2.8rem; font-weight:700; letter-spacing:-2px; line-height:1; }
      .health-score-ring__label { font-size:0.72rem; color:var(--color-text-muted); margin-top:4px; letter-spacing:0; }
      .health-summary-card { background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:8px; padding:24px; margin-bottom:16px; }
      .health-summary-card__title { font-size:0.72rem; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:600; margin-bottom:16px; }
      .health-stats-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
      .health-stat-card { background:rgba(255,255,255,.96); border:1px solid #DDE6F0; border-radius:8px; padding:20px; box-shadow:0 12px 30px rgba(15,23,42,.045); }
      .health-stat-card__label { font-size:0.72rem; color:#8290A3; font-weight:850; letter-spacing:0; }
      .health-stat-card__value { font-size:1.8rem; font-weight:900; letter-spacing:0; margin-top:6px; line-height:1; color:#0B1220; }
      .health-stat-card__unit { font-size:0.75rem; color:var(--color-text-muted); font-weight:500; }
      .health-stat-card__sub { font-size:0.72rem; color:var(--color-text-muted); margin-top:6px; }
      .health-section { margin-bottom:24px; }
      .health-section__title { font-size:0.75rem; color:var(--color-text-muted); font-weight:850; margin-bottom:12px; }
      .health-insight { background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:8px; padding:18px 20px; margin-bottom:10px; }
      .health-insight__header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
      .health-insight__title { font-size:0.88rem; font-weight:700; }
      .health-insight__badge { font-size:0.68rem; font-weight:700; padding:3px 10px; border-radius:12px; }
      .health-insight__text { font-size:0.82rem; color:var(--color-text-light); line-height:1.6; }
      .health-detail-row { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--color-border-light); }
      .health-detail-row:last-child { border-bottom:none; }
      .health-detail-row__label { font-size:0.85rem; color:var(--color-text-light); }
      .health-detail-row__value { font-size:0.88rem; font-weight:700; }
      .health-action-btn { width:100%; padding:14px; border:1px solid rgba(203,213,225,.95); border-radius:8px; background:rgba(255,255,255,.92); font-size:0.88rem; font-weight:850; text-align:center; cursor:pointer; transition:all 0.15s; margin-bottom:8px; box-shadow:0 10px 22px rgba(15,23,42,.045); }
      .health-action-btn:hover { border-color:#0B1220; transform:translateY(-1px); }
      .health-quick-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0; max-width:460px; }
      .health-quick-actions .health-action-btn { margin-bottom:0; min-height:52px; }
      .health-score-ring--animated { --health-score-deg:0deg; background:conic-gradient(var(--health-score-color) var(--health-score-deg), var(--color-border-light) 0deg); padding:6px; }
      .health-score-ring__inner { width:100%; height:100%; border-radius:50%; background:var(--color-bg); display:flex; align-items:center; justify-content:center; flex-direction:column; }
      .health-animated-number { display:inline-block; min-width:0.75em; }
      @media (max-width:640px) {
        .health-page { max-width:100%; }
        .health-hero { min-height:0; padding:28px 22px; background-image:linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.92) 62%, rgba(255,255,255,.7) 100%), url('/images/generated/health-analysis-hero.png'); background-position:center, 40% center; }
        .health-hero__aside { position:relative; right:auto; bottom:auto; width:100%; margin-top:16px; }
        .health-quick-actions { grid-template-columns:1fr; }
        .health-stats-row { gap:10px; }
      }
      @media (max-width:480px) {
        .health-stats-row { grid-template-columns:1fr; }
      }
    </style>

    <div class="health-page">
      <section class="health-hero">
        <div class="health-hero__content">
          <div class="health-hero__eyebrow">AI 건강 분석</div>
          <h1 class="health-hero__title">산책 리듬으로 건강 신호를 한눈에 살펴봐요</h1>
          <p class="health-hero__sub">활동량, 거리, 시간, 칼로리 흐름을 모아 ${displayName}의 컨디션 변화를 더 편하게 확인할 수 있어요.</p>

          ${dogs.length > 0 ? `
            <div class="health-dog-chips">
              ${dogs.map(d => `<button class="health-dog-chip ${selectedDogId === d.name ? 'active' : ''}" onclick="StorageService.set('selectedDogId','${d.name}');renderHealthDashboardPage()">${d.name}</button>`).join('')}
            </div>
          ` : ''}

          ${!user ? `
            <div style="text-align:center; margin-bottom:24px; padding:16px; border:1px dashed var(--color-border); border-radius:8px;">
              <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:8px;">로그인하면 산책 데이터를 기반으로 건강 리포트를 확인할 수 있어요</p>
              <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/login')">로그인하기</button>
            </div>
          ` : ''}

          <div id="health-alert"></div>
          <div class="health-quick-actions">
            <button class="health-action-btn" onclick="${user ? "Router.navigate('/walk-tracking')" : "showLoginModal('건강 분석을 이용하려면 로그인이 필요해요!\\n반려견의 산책 데이터를 기반으로 AI가 건강을 분석해드려요.')"}">산책 시작하기</button>
            <button class="health-action-btn" onclick="${user ? "Router.navigate('/ai')" : "showLoginModal('AI 반려견 상담을 이용하려면 로그인이 필요해요!')"}">AI 반려견 상담받기</button>
          </div>
        </div>
        <div class="health-hero__aside">
          <span>이번 리포트</span>
          <strong>${displayName}</strong>
          <small>산책 데이터 기반 케어</small>
        </div>
      </section>

      <div id="health-stats-section">
        <div style="text-align:center; padding:40px;"><div class="spinner"></div></div>
      </div>
      <div id="health-analysis-section"></div>
    </div>
  `);

  if (user) {
    await loadHealthDashboard(user);
  } else {
    renderHealthLoginRequiredState();
  }
}

function renderHealthLoginRequiredState() {
  const statsSection = document.getElementById('health-stats-section');
  const analysisSection = document.getElementById('health-analysis-section');

  if (statsSection) {
    statsSection.innerHTML = `
      <div style="text-align:center; padding:48px 20px;">
        <div class="health-score-ring" style="border:3px dashed var(--color-border);">
          <div class="health-score-ring__value" style="color:var(--color-text-muted);">--</div>
          <div class="health-score-ring__label">활동 점수</div>
        </div>
        <p style="font-size:0.9rem; font-weight:600; margin-bottom:6px;">로그인이 필요해요</p>
        <p style="font-size:0.82rem; color:var(--color-text-muted);">산책 기록과 건강 분석은 로그인 후 사용할 수 있어요</p>
      </div>
    `;
  }

  if (analysisSection) analysisSection.innerHTML = '';
}

function getHealthMetricDecimals(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num === 0) return 0;
  return Number.isInteger(num) ? 0 : 1;
}

function renderHealthAnimatedNumber(value, decimals = 0) {
  const target = Number(value || 0);
  return `<span class="health-animated-number" data-health-count="true" data-health-target="${target}" data-health-decimals="${decimals}">0</span>`;
}

function formatHealthAnimatedValue(value, decimals = 0) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const fixed = decimals > 0 ? safeValue.toFixed(decimals) : String(Math.round(safeValue));
  const [integer, decimal] = fixed.split('.');
  const formattedInteger = Number(integer || 0).toLocaleString('ko-KR');
  return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
}

function setHealthAnimationProgress(container, progress) {
  const eased = 1 - Math.pow(1 - progress, 3);
  container.querySelectorAll('[data-health-count]').forEach(el => {
    const target = Number(el.dataset.healthTarget || 0);
    const decimals = Number(el.dataset.healthDecimals || 0);
    el.textContent = formatHealthAnimatedValue(target * eased, decimals);
  });
  container.querySelectorAll('[data-health-ring]').forEach(el => {
    const targetDeg = Number(el.dataset.healthDeg || 0);
    el.style.setProperty('--health-score-deg', `${targetDeg * eased}deg`);
  });
}

function animateHealthMetricCounters(container) {
  if (!container) return;
  const shouldReduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (shouldReduceMotion) {
    setHealthAnimationProgress(container, 1);
    return;
  }
  const duration = 950;
  const startedAt = performance.now();
  const tick = now => {
    const progress = Math.min((now - startedAt) / duration, 1);
    setHealthAnimationProgress(container, progress);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function handleSelectHealthDog() {
  const sel = document.getElementById('health-dog-select');
  if (sel) {
    StorageService.set('selectedDogId', sel.value);
    renderHealthDashboardPage();
  }
}

async function loadHealthDashboard(user) {
  const statsSection = document.getElementById('health-stats-section');
  const analysisSection = document.getElementById('health-analysis-section');

  const dogs = user.dogs || [];
  const selectedDogId = StorageService.get('selectedDogId', dogs.length > 0 ? dogs[0].name : '_all');
  const dog = dogs.find(d => d.name === selectedDogId) || dogs[0] || null;
  const dogFilter = dog ? dog.id : null;

  // 선택된 반려견의 산책 통계 로드
  const stats = await GPSTrackingService.getWalkStats(user.id, dogFilter);
  const activityScore = HealthAnalysisService.calcActivityScore(stats);

  if (statsSection) {
    if (!stats || stats.total.count === 0) {
      statsSection.innerHTML = `
        <div style="text-align:center; padding:48px 20px;">
          <div class="health-score-ring" style="border:3px dashed var(--color-border);">
            <div class="health-score-ring__value" style="color:var(--color-text-muted);">--</div>
            <div class="health-score-ring__label">활동 점수</div>
          </div>
          <p style="font-size:0.9rem; font-weight:600; margin-bottom:6px;">아직 산책 데이터가 없어요</p>
          <p style="font-size:0.82rem; color:var(--color-text-muted);">산책을 시작하면 건강을 분석해드려요</p>
        </div>
      `;
    } else {
      const scoreColor = activityScore >= 70 ? '#38a169' : activityScore >= 40 ? '#d69e2e' : '#e53e3e';
      const weeklyDistanceDecimals = getHealthMetricDecimals(stats.weekly.totalDistance);
      statsSection.innerHTML = `
        <div style="text-align:center; margin-bottom:24px;">
          <div class="health-score-ring health-score-ring--animated" data-health-ring="true" data-health-deg="${activityScore * 3.6}" style="--health-score-color:${scoreColor};">
            <div class="health-score-ring__inner">
              <div class="health-score-ring__value" data-health-count="true" data-health-target="${activityScore}" data-health-decimals="0" style="color:${scoreColor};">0</div>
              <div class="health-score-ring__label">활동 점수</div>
            </div>
          </div>
        </div>

        <div class="health-stats-row">
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 산책</div>
            <div class="health-stat-card__value">${renderHealthAnimatedNumber(stats.weekly.count)}<span class="health-stat-card__unit"> 회</span></div>
            <div class="health-stat-card__sub">총 ${stats.total.count}회</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 거리</div>
            <div class="health-stat-card__value">${renderHealthAnimatedNumber(stats.weekly.totalDistance, weeklyDistanceDecimals)}<span class="health-stat-card__unit"> km</span></div>
            <div class="health-stat-card__sub">총 ${stats.total.totalDistance}km</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 시간</div>
            <div class="health-stat-card__value">${renderHealthAnimatedNumber(stats.weekly.totalDuration)}<span class="health-stat-card__unit"> 분</span></div>
            <div class="health-stat-card__sub">평균 ${stats.total.avgDuration}분/회</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 칼로리</div>
            <div class="health-stat-card__value">${renderHealthAnimatedNumber(stats.weekly.totalCalories)}<span class="health-stat-card__unit"> kcal</span></div>
            <div class="health-stat-card__sub">평균 ${stats.total.avgDistance}km/회</div>
          </div>
        </div>
      `;
      animateHealthMetricCounters(statsSection);
    }
  }

  // 캐시된 분석 결과 표시 (반려견별)
  const cached = HealthAnalysisService.getCachedAnalysis(user.id, selectedDogId);
  if (cached && analysisSection) {
    renderHealthAnalysisResult(cached.analysis, analysisSection, selectedDogId);
  } else if (analysisSection && stats && stats.total.count > 0) {
    // 캐시 없으면 자동 분석 실행
    handleRunHealthAnalysis();
  }
}

async function handleRunHealthAnalysis() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const dogs = user.dogs || [];
  const selectedDogId = StorageService.get('selectedDogId', dogs.length > 0 ? dogs[0].name : '_all');
  const dog = dogs.find(d => d.name === selectedDogId) || dogs[0] || null;
  const alertEl = document.getElementById('health-alert');
  const section = document.getElementById('health-analysis-section');

  if (section) {
    section.innerHTML = `
      <div class="card" style="padding:24px; text-align:center;">
        <div class="spinner"></div>
        <p style="margin-top:12px; color:var(--color-text-muted);">AI가 건강을 분석하고 있어요... 🔬</p>
      </div>
    `;
  }

  try {
    const analysis = await HealthAnalysisService.analyzeHealth(user.id, dog ? {
      name: dog.name,
      breed: dog.breed,
      age: dog.age,
      weight: dog.weight || null,
      size: dog.size,
      gender: dog.gender || null,
      neutered: dog.neutered != null ? dog.neutered : null,
      personality: dog.personality || null,
      healthNote: dog.healthNote || null
    } : {}, selectedDogId);

    if (section) renderHealthAnalysisResult(analysis, section, selectedDogId);
  } catch (e) {
    if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">분석 실패: ${e.message}</div>`;
    if (section) section.innerHTML = '';
  }
}

function renderHealthAnalysisResult(analysis, container, dogId) {
  if (!analysis || !container) return;

  const riskColor = {
    '낮음': 'var(--color-success)', '보통': 'var(--color-primary-dark)',
    '높음': '#FF6B6B', '매우높음': 'var(--color-error)'
  };

  // 캐시 시간 표시
  const cached = HealthAnalysisService.getCachedAnalysis(
    AuthService.getCurrentUser()?.id, dogId
  );
  const analyzedTime = cached?.analyzedAt ? new Date(cached.analyzedAt).toLocaleString('ko-KR') : '';

  container.innerHTML = `
    <div class="health-section">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="health-section__title">AI 분석 결과</div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${analyzedTime ? `<span style="font-size:0.68rem; color:var(--color-text-muted);">${analyzedTime}</span>` : ''}
          <button onclick="handleRunHealthAnalysis()" style="font-size:0.78rem; color:#fff; background:#1a1a1a; border:none; cursor:pointer; padding:7px 16px; border-radius:20px; font-weight:700; transition:all 0.2s;" onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'">분석 갱신</button>
        </div>
      </div>

      ${analysis.overallScore !== undefined ? `
      <div class="health-insight">
        <div class="health-insight__header">
          <span class="health-insight__title">종합 건강 점수</span>
          <span class="health-insight__badge" style="background:${analysis.overallScore >= 70 ? '#f0fff4;color:#38a169' : analysis.overallScore >= 40 ? '#fffff0;color:#d69e2e' : '#fff5f5;color:#e53e3e'}">${analysis.overallScore}/100</span>
        </div>
        ${analysis.summaryKeywords && analysis.summaryKeywords.length > 0 ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">${analysis.summaryKeywords.map(k => '<span style="font-size:0.72rem; padding:2px 8px; background:var(--color-bg-section); border-radius:8px; color:var(--color-text-light);">' + k + '</span>').join('')}</div>` : ''}
        ${analysis.summary ? `<div class="health-insight__text">${analysis.summary}</div>` : ''}
      </div>` : ''}

      ${analysis.behaviorAnalysis ? `
      <div class="health-insight">
        <div class="health-insight__header">
          <span class="health-insight__title">행동 패턴</span>
          <span class="health-insight__badge" style="background:var(--color-bg-section); color:var(--color-text-light);">${({'상':'매우 규칙적','중':'규칙적','하':'불규칙'})[analysis.behaviorAnalysis.consistency] || analysis.behaviorAnalysis.consistency || '-'}</span>
        </div>
        ${analysis.behaviorAnalysis.keywords && analysis.behaviorAnalysis.keywords.length > 0 ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">${analysis.behaviorAnalysis.keywords.map(k => '<span style="font-size:0.72rem; padding:2px 8px; background:var(--color-bg-section); border-radius:8px; color:var(--color-text-light);">' + k + '</span>').join('')}</div>` : ''}
        ${analysis.behaviorAnalysis.pattern ? `<div class="health-insight__text">${analysis.behaviorAnalysis.pattern}</div>` : ''}
        ${analysis.behaviorAnalysis.recommendation ? `<div class="health-insight__text" style="margin-top:8px; padding-top:8px; border-top:1px solid var(--color-border-light);">${analysis.behaviorAnalysis.recommendation}</div>` : ''}
      </div>` : ''}

      ${analysis.obesityRisk ? `
      <div class="health-insight">
        <div class="health-insight__header">
          <span class="health-insight__title">비만 위험</span>
          <span class="health-insight__badge" style="background:${riskColor[analysis.obesityRisk.level] === 'var(--color-success)' ? '#f0fff4;color:#38a169' : '#fff5f5;color:#e53e3e'}">${analysis.obesityRisk.level || '-'}</span>
        </div>
        ${analysis.obesityRisk.factors ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">${analysis.obesityRisk.factors.map(f => '<span style="font-size:0.72rem; padding:2px 8px; background:var(--color-bg-section); border-radius:8px; color:var(--color-text-light);">' + f + '</span>').join('')}</div>` : ''}
        ${analysis.obesityRisk.recommendation ? `<div class="health-insight__text">${analysis.obesityRisk.recommendation}</div>` : ''}
      </div>` : ''}

      ${analysis.dietRecommendation ? `
      <div class="health-insight">
        <div class="health-insight__title" style="margin-bottom:10px;">식단 추천</div>
        ${analysis.dietRecommendation.dailyCalories ? `<div class="health-detail-row"><span class="health-detail-row__label">일일 권장 칼로리</span><span class="health-detail-row__value">${analysis.dietRecommendation.dailyCalories} kcal</span></div>` : ''}
        ${analysis.dietRecommendation.mealFrequency ? `<div class="health-detail-row"><span class="health-detail-row__label">급여 횟수</span><span class="health-detail-row__value">${analysis.dietRecommendation.mealFrequency}</span></div>` : ''}
        ${analysis.dietRecommendation.foods ? `<div style="margin-top:8px;"><span style="font-size:0.72rem; color:var(--color-text-muted);">추천 식품</span><div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">${analysis.dietRecommendation.foods.map(f => '<span style="font-size:0.75rem; padding:3px 10px; background:var(--color-bg-section); border-radius:10px;">' + f + '</span>').join('')}</div></div>` : ''}
        ${analysis.dietRecommendation.avoid ? `<div style="margin-top:8px;"><span style="font-size:0.72rem; color:var(--color-text-muted);">주의 식품</span><div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">${analysis.dietRecommendation.avoid.map(f => '<span style="font-size:0.75rem; padding:3px 10px; background:#fff5f5; border-radius:10px; color:#e53e3e;">' + f + '</span>').join('')}</div></div>` : ''}
      </div>` : ''}

      ${analysis.vaccinationSchedule && analysis.vaccinationSchedule.upcoming && analysis.vaccinationSchedule.upcoming.length > 0 ? `
      <div class="health-insight">
        <div class="health-insight__title" style="margin-bottom:10px;">예방접종 일정</div>
        ${analysis.vaccinationSchedule.upcoming.map(v => `
          <div class="health-detail-row">
            <span class="health-detail-row__label">${v.name}</span>
            <span class="health-detail-row__value" style="font-size:0.82rem;">${v.dueDate || ''}</span>
          </div>
        `).join('')}
        ${analysis.vaccinationSchedule.note ? `<div class="health-insight__text" style="margin-top:8px;">${analysis.vaccinationSchedule.note}</div>` : ''}
      </div>` : ''}
    </div>
  `;
}

// --- 404 페이지 ---
