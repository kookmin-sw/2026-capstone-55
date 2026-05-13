// Pawsitive - Health Dashboard Page
// --- 건강 분석 대시보드 페이지 ---
async function renderHealthDashboardPage() {
  const user = AuthService.getCurrentUser();
  const dogs = user ? (user.dogs || []) : [];
  const selectedDogId = StorageService.get('selectedDogId', '_all');
  const dog = selectedDogId !== '_all' ? dogs.find(d => d.name === selectedDogId) : null;
  const displayName = dog ? dog.name : '전체';

  renderPage(`
    <style>
      .health-page { max-width:600px; margin:0 auto; }
      .health-header { margin-bottom:28px; }
      .health-header__title { font-size:1.6rem; font-weight:700; letter-spacing:-0.5px; }
      .health-header__sub { font-size:0.85rem; color:var(--color-text-muted); margin-top:4px; }
      .health-dog-chips { display:flex; gap:8px; margin-bottom:28px; flex-wrap:wrap; }
      .health-dog-chip { padding:8px 18px; border:1.5px solid var(--color-border); border-radius:20px; font-size:0.82rem; font-weight:600; background:#fff; cursor:pointer; transition:all 0.15s; }
      .health-dog-chip.active { background:var(--color-text); color:#fff; border-color:var(--color-text); }
      .health-score-ring { width:140px; height:140px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-direction:column; margin:0 auto 24px; position:relative; }
      .health-score-ring__value { font-size:2.8rem; font-weight:700; letter-spacing:-2px; line-height:1; }
      .health-score-ring__label { font-size:0.72rem; color:var(--color-text-muted); margin-top:4px; text-transform:uppercase; letter-spacing:1px; }
      .health-summary-card { background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:16px; padding:24px; margin-bottom:16px; }
      .health-summary-card__title { font-size:0.72rem; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:600; margin-bottom:16px; }
      .health-stats-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
      .health-stat-card { background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:14px; padding:20px; }
      .health-stat-card__label { font-size:0.72rem; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.5px; font-weight:600; }
      .health-stat-card__value { font-size:1.8rem; font-weight:700; letter-spacing:-1px; margin-top:4px; line-height:1; }
      .health-stat-card__unit { font-size:0.75rem; color:var(--color-text-muted); font-weight:500; }
      .health-stat-card__sub { font-size:0.72rem; color:var(--color-text-muted); margin-top:6px; }
      .health-section { margin-bottom:24px; }
      .health-section__title { font-size:0.75rem; text-transform:uppercase; letter-spacing:1.5px; color:var(--color-text-muted); font-weight:600; margin-bottom:12px; }
      .health-insight { background:var(--color-bg-card); border:1px solid var(--color-border); border-radius:14px; padding:18px 20px; margin-bottom:10px; }
      .health-insight__header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
      .health-insight__title { font-size:0.88rem; font-weight:700; }
      .health-insight__badge { font-size:0.68rem; font-weight:700; padding:3px 10px; border-radius:12px; }
      .health-insight__text { font-size:0.82rem; color:var(--color-text-light); line-height:1.6; }
      .health-detail-row { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--color-border-light); }
      .health-detail-row:last-child { border-bottom:none; }
      .health-detail-row__label { font-size:0.85rem; color:var(--color-text-light); }
      .health-detail-row__value { font-size:0.88rem; font-weight:700; }
      .health-action-btn { width:100%; padding:14px; border:1px solid var(--color-border); border-radius:12px; background:#fff; font-size:0.88rem; font-weight:600; text-align:center; cursor:pointer; transition:all 0.15s; margin-bottom:8px; }
      .health-action-btn:hover { border-color:var(--color-text); }
    </style>

    <div class="health-page">
      <div class="health-header">
        <div class="health-header__title">건강 분석</div>
        <div class="health-header__sub">${displayName === '전체' ? '전체 반려견' : dog.name + '의'} 건강 리포트</div>
      </div>

      ${dogs.length > 0 ? `
        <div class="health-dog-chips">
          <button class="health-dog-chip ${selectedDogId === '_all' ? 'active' : ''}" onclick="StorageService.set('selectedDogId','_all');renderHealthDashboardPage()">전체</button>
          ${dogs.map(d => `<button class="health-dog-chip ${selectedDogId === d.name ? 'active' : ''}" onclick="StorageService.set('selectedDogId','${d.name}');renderHealthDashboardPage()">${d.name}</button>`).join('')}
        </div>
      ` : ''}

      ${!user ? `
        <div style="text-align:center; margin-bottom:24px; padding:16px; border:1px dashed var(--color-border); border-radius:12px;">
          <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:8px;">로그인하면 산책 데이터를 기반으로 건강 리포트를 확인할 수 있어요</p>
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/login')">로그인하기</button>
        </div>
      ` : ''}

      <div id="health-alert"></div>
      <div id="health-stats-section">
        <div style="text-align:center; padding:40px;"><div class="spinner"></div></div>
      </div>
      <div id="health-analysis-section"></div>

      <button class="health-action-btn" onclick="${user ? "Router.navigate('/walk-tracking')" : "showLoginModal('건강 분석을 이용하려면 로그인이 필요해요!\\n반려견의 산책 데이터를 기반으로 AI가 건강을 분석해드려요.')"}">산책 시작하기</button>
      <button class="health-action-btn" onclick="${user ? "Router.navigate('/ai')" : "showLoginModal('AI 상담을 이용하려면 로그인이 필요해요!')"}">AI 상담 받기</button>
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
  const selectedDogId = StorageService.get('selectedDogId', '_all');
  const dog = selectedDogId !== '_all' ? dogs.find(d => d.name === selectedDogId) : null;
  const dogFilter = selectedDogId !== '_all' ? selectedDogId : null;

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
      statsSection.innerHTML = `
        <div style="text-align:center; margin-bottom:24px;">
          <div class="health-score-ring" style="background:conic-gradient(${scoreColor} ${activityScore * 3.6}deg, var(--color-border-light) 0deg); padding:6px;">
            <div style="width:100%; height:100%; border-radius:50%; background:var(--color-bg); display:flex; align-items:center; justify-content:center; flex-direction:column;">
              <div class="health-score-ring__value" style="color:${scoreColor};">${activityScore}</div>
              <div class="health-score-ring__label">활동 점수</div>
            </div>
          </div>
        </div>

        <div class="health-stats-row">
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 산책</div>
            <div class="health-stat-card__value">${stats.weekly.count}<span class="health-stat-card__unit"> 회</span></div>
            <div class="health-stat-card__sub">총 ${stats.total.count}회</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 거리</div>
            <div class="health-stat-card__value">${stats.weekly.totalDistance}<span class="health-stat-card__unit"> km</span></div>
            <div class="health-stat-card__sub">총 ${stats.total.totalDistance}km</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 시간</div>
            <div class="health-stat-card__value">${stats.weekly.totalDuration}<span class="health-stat-card__unit"> 분</span></div>
            <div class="health-stat-card__sub">평균 ${stats.total.avgDuration}분/회</div>
          </div>
          <div class="health-stat-card">
            <div class="health-stat-card__label">이번 주 칼로리</div>
            <div class="health-stat-card__value">${stats.weekly.totalCalories}<span class="health-stat-card__unit"> kcal</span></div>
            <div class="health-stat-card__sub">평균 ${stats.total.avgDistance}km/회</div>
          </div>
        </div>
      `;
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
  const selectedDogId = StorageService.get('selectedDogId', '_all');
  const dog = selectedDogId !== '_all' ? dogs.find(d => d.name === selectedDogId) : null;
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
          <button onclick="handleRunHealthAnalysis()" style="font-size:0.72rem; color:var(--color-text-muted); background:none; border:none; cursor:pointer; text-decoration:underline;">새로 분석</button>
        </div>
      </div>

      ${analysis.overallScore !== undefined ? `
      <div class="health-insight">
        <div class="health-insight__header">
          <span class="health-insight__title">종합 건강 점수</span>
          <span class="health-insight__badge" style="background:${analysis.overallScore >= 70 ? '#f0fff4;color:#38a169' : analysis.overallScore >= 40 ? '#fffff0;color:#d69e2e' : '#fff5f5;color:#e53e3e'}">${analysis.overallScore}/100</span>
        </div>
        ${analysis.summary ? `<div class="health-insight__text">${analysis.summary}</div>` : ''}
      </div>` : ''}

      ${analysis.behaviorAnalysis ? `
      <div class="health-insight">
        <div class="health-insight__header">
          <span class="health-insight__title">행동 패턴</span>
          <span class="health-insight__badge" style="background:var(--color-bg-section); color:var(--color-text-light);">${analysis.behaviorAnalysis.consistency || '-'}</span>
        </div>
        <div class="health-insight__text">${analysis.behaviorAnalysis.pattern || ''}</div>
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
