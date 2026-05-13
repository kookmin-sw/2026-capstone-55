// Pawsitive - Education Page
// Dog training education content and quizzes

let _currentQuiz = null;
let _currentCategory = 'all';

function _shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _shuffleQuiz(questions) {
  return _shuffleArray(questions).map(q => {
    const indices = _shuffleArray(q.options.map((_, i) => i));
    return { ...q, options: indices.map(i => q.options[i]), answer: indices.indexOf(q.answer) };
  });
}

function _goToCategoryPage(category) {
  renderEducationPage();
  if (category && category !== 'all') {
    const tabBtn = document.querySelector(`.tab[onclick*="'${category}'"]`);
    filterEducation(category, tabBtn);
  }
}

const EDUCATION_DOG_ASSETS = {
  runA: 'images/education-runner-dog-ui.png',
  runB: 'images/education-runner-dog-run-b-ui.png',
  sit: 'images/education-dog-sit-front-ui.png',
  crown: 'images/education-dog-crown-front-ui.png'
};

function _animateEducationProgress(pct) {
  const track = document.getElementById('education-progress-track');
  const fill = document.getElementById('education-progress-fill');
  const runner = document.getElementById('education-progress-runner');
  const dog = document.getElementById('education-progress-dog');
  if (!track || !fill || !runner || !dog) return;

  const clampedPct = Math.max(0, Math.min(100, pct));
  const durationMs = 3200;
  const startLeft = 18;
  const endLeft = () => {
    const usableWidth = Math.max(track.clientWidth - 36, 0);
    return startLeft + usableWidth * (clampedPct / 100);
  };
  const setState = (state, src) => {
    runner.classList.remove('is-idle', 'is-running', 'is-resting', 'is-finished');
    runner.classList.add(state);
    dog.src = src;
  };

  if (runner._educationProgressTimer) {
    clearTimeout(runner._educationProgressTimer);
    runner._educationProgressTimer = null;
  }
  if (runner._educationFrameTimer) {
    clearInterval(runner._educationFrameTimer);
    runner._educationFrameTimer = null;
  }

  fill.style.transitionDuration = `${durationMs}ms`;
  runner.style.transitionDuration = `${durationMs}ms`;
  fill.style.width = '0%';
  runner.style.left = `${startLeft}px`;

  if (clampedPct === 0) {
    setState('is-idle', EDUCATION_DOG_ASSETS.sit);
    return;
  }

  if (clampedPct >= 100) {
    fill.style.width = '100%';
    runner.style.left = `${endLeft()}px`;
    setState('is-finished', EDUCATION_DOG_ASSETS.crown);
    return;
  }

  let currentFrame = 0;
  setState('is-running', EDUCATION_DOG_ASSETS.runA);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fill.style.width = `${clampedPct}%`;
      runner.style.left = `${endLeft()}px`;
    });
  });

  runner._educationFrameTimer = setInterval(() => {
    currentFrame = currentFrame ? 0 : 1;
    dog.src = currentFrame ? EDUCATION_DOG_ASSETS.runB : EDUCATION_DOG_ASSETS.runA;
  }, 220);

  runner._educationProgressTimer = setTimeout(() => {
    if (runner._educationFrameTimer) {
      clearInterval(runner._educationFrameTimer);
      runner._educationFrameTimer = null;
    }
    setState('is-resting', EDUCATION_DOG_ASSETS.sit);
  }, durationMs);
}

function renderEducationPage() {
  const user = AuthService.getCurrentUser();
  const progress = user ? EducationService.getProgress(user.id) : { total: EDUCATION_DATA.length, completed: 0, ratio: 0, completedIds: [] };
  const pct = Math.round(progress.ratio * 100);
  const catPassed = user ? EducationService.getCategoryCompleted(user.id) : [];

  const categories = [
    { key: 'all',          label: '전체',      color: '#1a1a1a' },
    { key: 'basics',       label: '기본상식',   color: '#6366f1' },
    { key: 'body-language',label: '바디랭귀지', color: '#8b5cf6' },
    { key: 'training',     label: '훈련',      color: '#ec4899' },
    { key: 'health',       label: '건강관리',   color: '#ef4444' },
    { key: 'nutrition',    label: '영양/식이',  color: '#f59e0b' },
    { key: 'grooming',     label: '미용/관리',  color: '#10b981' },
    { key: 'safety',       label: '안전',      color: '#3b82f6' },
    { key: 'puppy',        label: '퍼피케어',   color: '#f472b6' },
    { key: 'senior',       label: '노견케어',   color: '#78716c' },
    { key: 'law',          label: '법률/에티켓',color: '#64748b' }
  ];

  const tabsHtml = categories.map(c => {
    const passed = c.key !== 'all' && catPassed.includes(c.key);
    const isActive = c.key === 'all';
    return `<button class="tab${isActive ? ' active' : ''}" onclick="filterEducation('${c.key}', this)"
      data-cat-color="${c.color}"
      style="font-size:0.81rem;padding:7px 14px;border-radius:20px;border:1.5px solid ${isActive ? c.color : 'var(--color-border-light)'};background:${isActive ? c.color : '#fff'};color:${isActive ? '#fff' : 'var(--color-text-light)'};font-weight:${isActive ? '700' : '500'};white-space:nowrap;flex-shrink:0;transition:all 0.15s;cursor:pointer;display:inline-flex;align-items:center;gap:4px;"
    >${c.label}${passed ? '<span style="font-size:0.7rem;">🎓</span>' : ''}</button>`;
  }).join('');

  const categoryOptionsHtml = categories.map(c => {
    const badge = c.key !== 'all' && catPassed.includes(c.key) ? ' 🎓' : '';
    return `<option value="${c.key}">${c.label}${badge}</option>`;
  }).join('');

  const remaining = progress.total - progress.completed;

  renderPage(`
    <div style="background:linear-gradient(135deg,var(--color-primary-pale) 0%,#fff 60%);border-radius:20px;padding:24px 22px;margin-bottom:20px;border:1px solid #c6f0e0;position:relative;overflow:hidden;">
      <div style="position:absolute;right:-15px;top:-15px;width:120px;height:120px;border-radius:50%;background:rgba(0,170,118,0.07);pointer-events:none;"></div>
      <div style="position:relative;">
        <h1 style="font-size:1.5rem;font-weight:800;color:var(--color-text);margin:0 0 5px;">🐾 반려견 교육 센터</h1>
        <p style="font-size:0.84rem;color:var(--color-text-light);margin:0 0 18px;">반려견과 행복하게 살기 위한 모든 지식을 배워봐요</p>
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <div style="background:#fff;border-radius:12px;padding:10px 12px;flex:1;border:1px solid #d4f0e6;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:var(--color-primary);">${progress.completed}</div>
            <div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:1px;">완료</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:10px 12px;flex:1;border:1px solid #d4f0e6;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:var(--color-text-light);">${remaining}</div>
            <div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:1px;">남은 학습</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:10px 12px;flex:1;border:1px solid #d4f0e6;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:var(--color-accent);">${pct}%</div>
            <div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:1px;">달성률</div>
          </div>
        </div>
        <div class="education-progress">
          <div class="education-progress__track" id="education-progress-track">
            <div class="education-progress__fill" id="education-progress-fill"></div>
            <div class="education-progress__runner" id="education-progress-runner" aria-hidden="true">
              <img class="education-progress__dog" id="education-progress-dog" src="${EDUCATION_DOG_ASSETS.sit}" alt="">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px;margin-bottom:12px;scrollbar-width:none;">
      <div style="display:flex;gap:6px;min-width:max-content;">
        ${tabsHtml}
      </div>
    </div>

    <div style="display:flex;gap:8px;margin:0 0 16px;flex-wrap:wrap;">
      <div style="position:relative;flex:1;min-width:140px;">
        <select id="category-select" onchange="filterByCategoryDropdown(this)" style="width:100%;padding:9px 34px 9px 14px;border-radius:10px;border:1.5px solid var(--color-border-light);font-size:0.86rem;background:#fff;cursor:pointer;appearance:none;-webkit-appearance:none;color:var(--color-text);font-weight:500;">
          ${categoryOptionsHtml}
        </select>
        <span style="position:absolute;right:11px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--color-text-muted);font-size:0.65rem;">▼</span>
      </div>
      <div style="position:relative;flex:1;min-width:130px;">
        <select id="level-select" onchange="filterByLevel(this)" style="width:100%;padding:9px 34px 9px 14px;border-radius:10px;border:1.5px solid var(--color-border-light);font-size:0.86rem;background:#fff;cursor:pointer;appearance:none;-webkit-appearance:none;color:var(--color-text);font-weight:500;">
          <option value="">전체 난이도</option>
          <option value="beginner">🟢 입문</option>
          <option value="intermediate">🟡 중급</option>
          <option value="advanced">🔴 심화</option>
        </select>
        <span style="position:absolute;right:11px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--color-text-muted);font-size:0.65rem;">▼</span>
      </div>
    </div>

    <div class="grid-2" id="education-list">
      ${renderEducationCards(EducationService.getByCategory('all'), progress.completedIds)}
    </div>
  `);

  _animateEducationProgress(pct);
}

function renderEducationCards(items, completedIds) {
  if (items.length === 0) {
    return `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-icon">📭</div>
      <p>콘텐츠가 없습니다</p>
    </div>`;
  }
  completedIds = completedIds || [];
  const catMap = {
    basics: { icon: '🐾', label: '기본상식' }, 'body-language': { icon: '🐕', label: '바디랭귀지' },
    training: { icon: '🎓', label: '훈련' }, health: { icon: '🏥', label: '건강관리' },
    nutrition: { icon: '🥗', label: '영양/식이' }, grooming: { icon: '✂️', label: '미용/관리' },
    safety: { icon: '🛡️', label: '안전' }, puppy: { icon: '🍼', label: '퍼피케어' },
    senior: { icon: '🐕‍🦺', label: '노견케어' }, law: { icon: '⚖️', label: '법률/에티켓' },
    posture: { icon: '🧍', label: '자세' }, leash: { icon: '🦮', label: '리드줄' }
  };
  const levelMap = {
    beginner:     { label: '입문', bg: '#dbeafe', text: '#1e40af' },
    intermediate: { label: '중급', bg: '#fef9c3', text: '#854d0e' },
    advanced:     { label: '심화', bg: '#fce7f3', text: '#9d174d' }
  };
  return items.map(item => {
    const isCompleted = completedIds.includes(item.id);
    const lv = item.level ? levelMap[item.level] : null;
    const cat = catMap[item.category] || { icon: '📚', label: item.category };
    const readMin = Math.ceil(item.body.length / 350);
    const preview = item.body.split('\n\n')[0].replace(/\n/g, ' ').substring(0, 88);
    return `
    <div onclick="Router.navigate('/education/${item.id}')"
      style="background:#fff;border-radius:16px;border:1.5px solid ${isCompleted ? '#86efac' : 'var(--color-border-light)'};cursor:pointer;transition:transform 0.18s,box-shadow 0.18s;overflow:hidden;display:flex;flex-direction:column;"
      onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.09)'"
      onmouseleave="this.style.transform='';this.style.boxShadow=''">
      <div style="height:4px;background:${isCompleted ? 'linear-gradient(90deg,#4ade80,#22c55e)' : 'linear-gradient(90deg,var(--color-primary-pale),var(--color-primary))'}; opacity:${isCompleted ? '1' : '0.5'};"></div>
      <div style="padding:15px 15px 13px;flex:1;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px;gap:6px;">
          <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;flex:1;">
            <span style="display:inline-flex;align-items:center;gap:3px;padding:3px 9px;background:var(--color-primary-pale);color:var(--color-primary-dark);border-radius:20px;font-size:0.73rem;font-weight:600;">${cat.icon} ${cat.label}</span>
            ${lv ? `<span style="padding:3px 8px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${lv.bg};color:${lv.text};">${lv.label}</span>` : ''}
          </div>
          ${isCompleted ? '<span style="font-size:1rem;flex-shrink:0;" title="수료 완료">✅</span>' : ''}
        </div>
        <div style="font-size:0.93rem;font-weight:700;color:var(--color-text);line-height:1.4;margin-bottom:8px;flex:1;">${item.title}</div>
        <div style="font-size:0.8rem;color:var(--color-text-light);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:11px;">${preview}...</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:0.73rem;color:var(--color-text-muted);">
          <span>📖</span><span>약 ${readMin}분</span>
          ${isCompleted ? '<span style="margin-left:auto;color:#15803d;font-weight:600;font-size:0.72rem;">수료 완료</span>' : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterEducation(category, btn) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
    t.style.background = '#fff';
    t.style.color = 'var(--color-text-light)';
    t.style.borderColor = 'var(--color-border-light)';
    t.style.fontWeight = '500';
  });
  if (btn) {
    btn.classList.add('active');
    const color = btn.dataset.catColor || 'var(--color-primary)';
    btn.style.background = color;
    btn.style.color = '#fff';
    btn.style.borderColor = color;
    btn.style.fontWeight = '700';
  }
  _currentCategory = category;

  const catSel = document.getElementById('category-select');
  if (catSel) catSel.value = category;

  const lvSel = document.getElementById('level-select');
  if (lvSel) lvSel.value = '';

  _applyEducationFilter(category, '');
}

function filterByCategoryDropdown(selectEl) {
  const category = selectEl.value;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
    t.style.background = '#fff';
    t.style.color = 'var(--color-text-light)';
    t.style.borderColor = 'var(--color-border-light)';
    t.style.fontWeight = '500';
  });
  const tabBtn = document.querySelector(`.tab[onclick*="'${category}'"]`);
  if (tabBtn) {
    tabBtn.classList.add('active');
    const color = tabBtn.dataset.catColor || 'var(--color-primary)';
    tabBtn.style.background = color;
    tabBtn.style.color = '#fff';
    tabBtn.style.borderColor = color;
    tabBtn.style.fontWeight = '700';
  }
  _currentCategory = category;

  const lvSel = document.getElementById('level-select');
  if (lvSel) lvSel.value = '';

  _applyEducationFilter(category, '');
}

function filterByLevel(selectEl) {
  _applyEducationFilter(_currentCategory, selectEl.value);
}

function _applyEducationFilter(category, level) {
  const allInCategory = EducationService.getByCategory(category);
  const filtered = level ? allInCategory.filter(item => item.level === level) : allInCategory;

  const user = AuthService.getCurrentUser();
  const progress = user ? EducationService.getProgress(user.id) : { completedIds: [] };
  const list = document.getElementById('education-list');
  if (!list) return;

  let bannerHtml = '';
  if (category !== 'all' && user && allInCategory.length > 0 && !level) {
    const allDone = allInCategory.every(item => progress.completedIds.includes(item.id));
    const hasQuizItems = allInCategory.some(item => item.quiz && item.quiz.length > 0);
    if (allDone && hasQuizItems) {
      const catPassed = EducationService.getCategoryCompleted(user.id).includes(category);
      const catNames = {
        basics: '기본상식', 'body-language': '바디랭귀지', training: '훈련',
        health: '건강관리', nutrition: '영양/식이', grooming: '미용/관리',
        safety: '안전', puppy: '퍼피케어', senior: '노견케어', law: '법률/에티켓'
      };
      const catName = catNames[category] || category;
      if (catPassed) {
        bannerHtml = `<div style="grid-column:1/-1;padding:24px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:20px;text-align:center;margin-bottom:12px;border:1.5px solid #86efac;">
          <div style="font-size:2.8rem;margin-bottom:8px;">🎓</div>
          <div style="font-weight:800;color:#15803d;font-size:1.1rem;margin-bottom:4px;">완벽 수료 달성!</div>
          <p style="color:#166534;font-size:0.84rem;">${catName} 카테고리를 완벽하게 수료했습니다!</p>
        </div>`;
      } else {
        bannerHtml = `<div style="grid-column:1/-1;padding:24px;background:linear-gradient(135deg,var(--color-primary-pale),#fff);border-radius:20px;text-align:center;margin-bottom:12px;border:1.5px solid var(--color-primary);">
          <div style="font-size:2.8rem;margin-bottom:8px;">🏆</div>
          <div style="font-weight:800;color:var(--color-primary-dark);font-size:1.1rem;margin-bottom:4px;">카테고리 완주!</div>
          <p style="font-size:0.84rem;color:var(--color-text-light);margin-bottom:16px;">모든 콘텐츠를 완료했어요.<br>최종 퀴즈를 통과하면 <strong>완벽 수료 🎓</strong> 뱃지를 받을 수 있어요!</p>
          <button class="btn btn-primary" onclick="startCategoryQuiz('${category}')" style="padding:12px 28px;border-radius:12px;">
            🎯 ${catName} 최종 퀴즈 도전
          </button>
        </div>`;
      }
    }
  }

  list.innerHTML = bannerHtml + renderEducationCards(filtered, progress.completedIds);
}

// --- 교육 상세 페이지 ---

function _parseBodyToHtml(body) {
  const THEME = {
    danger:  { bg: '#fff5f5', border: '#fca5a5', head: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#fcd34d', head: '#b45309' },
    info:    { bg: '#eff6ff', border: '#93c5fd', head: '#1d4ed8' },
    success: { bg: '#f0fdf4', border: '#86efac', head: '#15803d' },
    primary: { bg: 'var(--color-primary-pale)', border: 'var(--color-primary-light)', head: 'var(--color-primary-dark)' },
  };
  const EMOJI_THEME = {
    '🚫': 'danger', '❌': 'danger', '⛔': 'danger', '🆘': 'danger',
    '⚠️': 'warning', '⚡': 'warning',
    '💡': 'info', 'ℹ️': 'info', '💬': 'info',
    '✅': 'success', '🎉': 'success', '🏆': 'success', '🎓': 'success',
  };

  function getTheme(emoji) {
    return THEME[EMOJI_THEME[emoji] || 'primary'];
  }

  function parseLines(lines) {
    let html = '';
    let bullets = [];
    let steps = [];

    const flushBullets = () => {
      if (!bullets.length) return;
      html += `<ul style="margin:8px 0 4px;padding:0;list-style:none;">` +
        bullets.map(t => `<li style="display:flex;gap:8px;align-items:flex-start;padding:4px 0;">
          <span style="color:var(--color-primary);font-weight:700;flex-shrink:0;line-height:1.5;">•</span>
          <span style="font-size:0.87rem;line-height:1.65;color:var(--color-text);">${t}</span>
        </li>`).join('') + `</ul>`;
      bullets = [];
    };
    const flushSteps = (startNum) => {
      if (!steps.length) return;
      html += `<ol style="margin:8px 0 4px;padding:0;list-style:none;">` +
        steps.map((t, i) => `<li style="display:flex;gap:10px;align-items:flex-start;padding:5px 0;">
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;background:var(--color-primary);color:#fff;border-radius:50%;font-size:0.72rem;font-weight:700;flex-shrink:0;margin-top:1px;">${startNum + i}</span>
          <span style="font-size:0.87rem;line-height:1.65;color:var(--color-text);">${t}</span>
        </li>`).join('') + `</ol>`;
      steps = [];
    };

    let stepStart = 1;
    for (const line of lines) {
      if (!line.trim()) continue;
      const bulletMatch = line.match(/^[•·]\s*(.*)/);
      const stepMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (bulletMatch) {
        flushSteps(stepStart); stepStart = 1;
        bullets.push(bulletMatch[1]);
      } else if (stepMatch && parseInt(stepMatch[1]) <= 30) {
        flushBullets();
        if (steps.length === 0) stepStart = parseInt(stepMatch[1]);
        steps.push(stepMatch[2]);
      } else {
        flushBullets(); flushSteps(stepStart); stepStart = 1;
        html += `<p style="font-size:0.85rem;color:var(--color-text-light);margin:5px 0;line-height:1.6;">${line}</p>`;
      }
    }
    flushBullets(); flushSteps(stepStart);
    return html;
  }

  const EMOJI_RE = /^([\u{1F300}-\u{1FAF6}][️]?|[\u{2600}-\u{27BF}][️]?|⚠️|🆘|✅|🎓|🍼|🐕‍🦺|📅|📊|📋|📆|💉|🔄|💡|ℹ️|💬|🏠|🛒|🚫|⚡|❌|⛔)\s+(.*)/u;

  return body.split('\n\n').map((block, bi) => {
    if (!block.trim()) return '';
    const lines = block.split('\n');
    const m = lines[0].trim().match(EMOJI_RE);

    if (m) {
      const emoji = m[1];
      const heading = m[2];
      const t = getTheme(emoji);
      const contentHtml = parseLines(lines.slice(1));
      return `<div style="background:${t.bg};border-left:4px solid ${t.border};border-radius:0 12px 12px 0;padding:14px 18px;margin:12px 0;">
        <div style="font-weight:700;color:${t.head};font-size:0.9rem;margin-bottom:${contentHtml ? '10px' : '0'};">${emoji} ${heading}</div>
        ${contentHtml}
      </div>`;
    }

    const rest = parseLines(lines.slice(1));
    if (bi === 0) {
      return `<p style="font-size:1rem;line-height:1.85;color:var(--color-text);margin:0 0 16px;font-weight:500;">${lines[0]}</p>${rest}`;
    }
    return `<p style="font-size:0.92rem;line-height:1.8;color:var(--color-text);margin:8px 0;">${lines[0]}</p>${rest}`;
  }).join('');
}

function renderEducationDetailPage(params) {
  const content = EducationService.getById(params.id);
  if (!content) {
    renderPage(`
      <div class="not-found">
        <div class="nf-icon">📭</div>
        <h2>콘텐츠를 찾을 수 없습니다</h2>
        <p>요청하신 교육 콘텐츠가 존재하지 않습니다.</p>
        <button class="btn btn-primary" onclick="Router.navigate('/education')">교육 목록으로</button>
      </div>
    `);
    return;
  }

  const catMap = {
    basics: '기본상식', 'body-language': '바디랭귀지', training: '훈련',
    health: '건강관리', nutrition: '영양/식이', grooming: '미용/관리',
    safety: '안전', puppy: '퍼피케어', senior: '노견케어', law: '법률/에티켓',
    posture: '자세', leash: '리드줄'
  };
  const catIconMap = {
    basics: '🐾', 'body-language': '🐕', training: '🎓',
    health: '🏥', nutrition: '🥗', grooming: '✂️',
    safety: '🛡️', puppy: '🍼', senior: '🐕‍🦺', law: '⚖️',
    posture: '🧍', leash: '🦮'
  };

  const user = AuthService.getCurrentUser();
  const progress = user ? EducationService.getProgress(user.id) : { completedIds: [] };
  const isCompleted = progress.completedIds.includes(content.id);
  const hasQuiz = content.quiz && content.quiz.length > 0;

  const lvMap = {
    beginner:     { label: '입문', bg: '#dbeafe', text: '#1e40af' },
    intermediate: { label: '중급', bg: '#fef9c3', text: '#854d0e' },
    advanced:     { label: '심화', bg: '#fce7f3', text: '#9d174d' }
  };
  const lvInfo = content.level ? lvMap[content.level] : null;
  const readMin = Math.ceil(content.body.length / 350);
  const catIcon = catIconMap[content.category] || '📚';
  const catLabel = catMap[content.category] || content.category;

  let bottomHtml = '';
  if (isCompleted) {
    bottomHtml = `
      <div style="margin-top:24px;padding:18px 22px;background:#f0fdf4;border-radius:16px;border:1.5px solid #86efac;display:flex;align-items:center;gap:16px;">
        <div style="font-size:2rem;line-height:1;">✅</div>
        <div>
          <div style="font-weight:700;color:#15803d;font-size:0.93rem;">학습 완료</div>
          <div style="font-size:0.8rem;color:#166534;margin-top:2px;">이 콘텐츠를 이미 수료했습니다!</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/education')" style="margin-left:auto;white-space:nowrap;">목록으로</button>
      </div>`;
  } else if (hasQuiz) {
    bottomHtml = `
      <div style="margin-top:24px;border-radius:16px;overflow:hidden;border:1.5px solid var(--color-primary);">
        <div style="background:linear-gradient(135deg,var(--color-primary) 0%,var(--color-primary-dark) 100%);padding:18px 22px;display:flex;align-items:center;gap:14px;">
          <span style="font-size:1.8rem;">📝</span>
          <div>
            <div style="font-weight:800;font-size:0.97rem;color:#fff;">학습 확인 퀴즈</div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.82);margin-top:2px;">5문제 · 3개 이상 정답 시 수료 인증</div>
          </div>
        </div>
        <div style="background:#fff;padding:16px 22px;">
          <button class="btn btn-primary" onclick="startEducationQuiz('${content.id}')" style="width:100%;padding:13px;font-size:0.95rem;border-radius:10px;">
            🎯 퀴즈 시작하기
          </button>
        </div>
      </div>`;
  } else {
    const onclickAttr = user
      ? `onclick="handleCompleteEducation('${content.id}')"`
      : `onclick="showLoginModal('학습 완료를 기록하려면 로그인이 필요해요!')"`;
    bottomHtml = `
      <div style="margin-top:24px;">
        <button class="btn btn-primary" id="complete-btn" ${onclickAttr} style="width:100%;padding:13px;font-size:0.95rem;border-radius:12px;">✅ 학습 완료</button>
      </div>`;
  }

  renderPage(`
    <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/education')" style="margin-bottom:20px;">← 목록으로</button>

    <div style="background:linear-gradient(135deg,var(--color-primary-pale) 0%,#fff 65%);border-radius:20px;padding:24px 22px 20px;margin-bottom:18px;border:1px solid #c6f0e0;">
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:12px;">
        <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--color-primary-pale);color:var(--color-primary-dark);border-radius:20px;font-size:0.79rem;font-weight:600;border:1px solid #b6e8d4;">
          ${catIcon} ${catLabel}
        </span>
        ${lvInfo ? `<span style="padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;background:${lvInfo.bg};color:${lvInfo.text};">${lvInfo.label}</span>` : ''}
        ${isCompleted ? '<span style="padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;background:#dcfce7;color:#15803d;">✅ 수료</span>' : ''}
      </div>
      <h1 style="font-size:1.5rem;font-weight:800;line-height:1.35;letter-spacing:-0.5px;color:var(--color-text);margin:0 0 14px;">${content.title}</h1>
      <div style="display:flex;align-items:center;gap:10px;font-size:0.77rem;color:var(--color-text-muted);">
        <span>📖 약 ${readMin}분</span>
        <span style="width:3px;height:3px;background:var(--color-border);border-radius:50%;display:inline-block;"></span>
        <span>${catIcon} ${catLabel}</span>
      </div>
    </div>

    <div style="background:#fff;border-radius:20px;padding:22px 20px;border:1px solid var(--color-border-light);">
      ${_parseBodyToHtml(content.body)}
    </div>

    ${bottomHtml}
  `);
}

function _buildQuizHtml(quiz) {
  return quiz.map((q, qi) => `
    <div style="margin-bottom:16px;padding:18px 18px 14px;background:#fff;border:1.5px solid var(--color-border-light);border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
      <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:14px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;background:var(--color-primary);color:#fff;border-radius:8px;font-size:0.75rem;font-weight:700;flex-shrink:0;margin-top:1px;">Q${qi + 1}</span>
        <p style="font-weight:700;font-size:0.92rem;line-height:1.5;margin:0;color:var(--color-text);">${q.question}</p>
      </div>
      <div style="display:grid;gap:7px;">
        ${q.options.map((opt, oi) => `
          <label id="quiz-opt-${qi}-${oi}" style="display:flex;align-items:center;gap:10px;padding:10px 13px;background:#f8fafc;border:1.5px solid var(--color-border-light);border-radius:10px;cursor:pointer;transition:all 0.15s;font-size:0.86rem;" onclick="selectQuizOption(${qi}, ${oi})">
            <input type="radio" name="quiz-${qi}" value="${oi}" style="display:none;">
            <span class="quiz-radio" style="width:18px;height:18px;border:2px solid #cbd5e1;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;background:transparent;"></span>
            <span style="line-height:1.45;">${opt}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function selectQuizOption(questionIdx, optionIdx) {
  document.querySelectorAll(`[id^="quiz-opt-${questionIdx}-"]`).forEach(el => {
    el.style.borderColor = 'var(--color-border-light)';
    el.style.background = '#f8fafc';
    const radio = el.querySelector('.quiz-radio');
    if (radio) {
      radio.style.borderColor = '#cbd5e1';
      radio.style.background = 'transparent';
      radio.innerHTML = '';
    }
  });
  const selected = document.getElementById(`quiz-opt-${questionIdx}-${optionIdx}`);
  if (selected) {
    selected.style.borderColor = 'var(--color-primary)';
    selected.style.background = 'var(--color-primary-pale)';
    const radio = selected.querySelector('.quiz-radio');
    if (radio) {
      radio.style.borderColor = 'var(--color-primary)';
      radio.style.background = 'var(--color-primary)';
      radio.innerHTML = '<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="white"/></svg>';
    }
    const input = selected.querySelector('input');
    if (input) input.checked = true;
  }
}

function startEducationQuiz(contentId) {
  const content = EducationService.getById(contentId);
  if (!content || !content.quiz) return;

  _currentQuiz = _shuffleQuiz(content.quiz).slice(0, Math.min(5, content.quiz.length));

  renderPage(`
    <div style="max-width:600px;margin:0 auto;">
      <button class="btn btn-secondary btn-sm" onclick="renderEducationDetailPage({ id: '${contentId}' })" style="margin-bottom:20px;">← 내용으로 돌아가기</button>

      <div style="text-align:center;padding:20px 0 24px;border-bottom:1px solid var(--color-border-light);margin-bottom:22px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;background:var(--color-primary-pale);border-radius:14px;font-size:1.7rem;margin-bottom:12px;">📝</div>
        <div style="font-size:1.15rem;font-weight:800;color:var(--color-text);margin-bottom:6px;">${content.title}</div>
        <div style="font-size:0.82rem;color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;gap:8px;">
          <span>총 ${_currentQuiz.length}문제</span><span>·</span><span>3문제 이상 정답 시 수료</span>
        </div>
      </div>

      <div id="edu-quiz-questions">
        ${_buildQuizHtml(_currentQuiz)}
      </div>
      <div id="quiz-result" style="display:none;margin-bottom:16px;"></div>
      <button class="btn btn-primary" id="quiz-submit-btn" onclick="submitEducationQuiz('${contentId}')" style="width:100%;padding:14px;font-size:1rem;border-radius:12px;margin-top:4px;">
        🎯 정답 확인하기
      </button>
    </div>
  `);
}

function submitEducationQuiz(contentId) {
  const content = EducationService.getById(contentId);
  if (!content || !content.quiz) return;

  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('퀴즈 결과를 저장하려면 로그인이 필요해요!\n학습 진행률을 추적할 수 있어요.');
    return;
  }

  const quiz = _currentQuiz || content.quiz;
  let correct = 0;
  let allAnswered = true;

  quiz.forEach((q, qi) => {
    const selected = document.querySelector(`input[name="quiz-${qi}"]:checked`);
    if (!selected) { allAnswered = false; return; }
    const userAnswer = parseInt(selected.value);
    const isCorrect = userAnswer === q.answer;
    if (isCorrect) correct++;

    q.options.forEach((_, oi) => {
      const optEl = document.getElementById(`quiz-opt-${qi}-${oi}`);
      if (!optEl) return;
      optEl.style.cursor = 'default';
      optEl.onclick = null;
      if (oi === q.answer) {
        optEl.style.borderColor = '#4CAF50';
        optEl.style.background = '#e8f5e9';
      } else if (oi === userAnswer && !isCorrect) {
        optEl.style.borderColor = '#f44336';
        optEl.style.background = '#ffebee';
      }
    });
  });

  if (!allAnswered) {
    const resultEl = document.getElementById('quiz-result');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = '<div class="alert alert-error" style="text-align:center;">모든 문제에 답해주세요!</div>';
    }
    return;
  }

  const passed = correct >= 3;
  const resultEl = document.getElementById('quiz-result');
  const btn = document.getElementById('quiz-submit-btn');

  if (resultEl) {
    resultEl.style.display = 'block';
    if (passed) {
      EducationService.markComplete(user.id, contentId);
      resultEl.innerHTML = `
        <div style="padding:22px;background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-radius:16px;border:1.5px solid #86efac;text-align:center;">
          <div style="font-size:2.8rem;margin-bottom:8px;">🎉</div>
          <div style="font-weight:800;color:#15803d;font-size:1.1rem;margin-bottom:4px;">${correct}/${quiz.length} 정답 — 통과!</div>
          <div style="font-size:0.84rem;color:#166534;">수료 인증이 기록되었습니다</div>
        </div>`;
      if (btn) {
        btn.textContent = '📋 목록으로 돌아가기';
        btn.onclick = () => _goToCategoryPage(content.category);
      }
    } else {
      resultEl.innerHTML = `
        <div style="padding:22px;background:linear-gradient(135deg,#fffbeb 0%,#fef9c3 100%);border-radius:16px;border:1.5px solid #fcd34d;text-align:center;">
          <div style="font-size:2.8rem;margin-bottom:8px;">😅</div>
          <div style="font-weight:800;color:#b45309;font-size:1.1rem;margin-bottom:4px;">${correct}/${quiz.length} 정답 — 아쉬워요!</div>
          <div style="font-size:0.84rem;color:#92400e;">3문제 이상 맞춰야 수료예요. 내용을 다시 읽고 도전해보세요!</div>
        </div>`;
      if (btn) {
        btn.textContent = '🔄 다시 도전하기';
        btn.onclick = () => startEducationQuiz(contentId);
      }
    }
  }
}

function startCategoryQuiz(category) {
  const items = EducationService.getByCategory(category);
  const pool = [];
  items.forEach(item => {
    if (item.quiz && item.quiz.length > 0) {
      item.quiz.forEach(q => pool.push(q));
    }
  });

  if (pool.length === 0) {
    showToast('이 카테고리에는 퀴즈 문제가 없어요.', 'error');
    return;
  }

  const questionCount = Math.min(10, pool.length);
  _currentQuiz = _shuffleQuiz(pool).slice(0, questionCount);

  const catNames = {
    basics: '기본상식', 'body-language': '바디랭귀지', training: '훈련',
    health: '건강관리', nutrition: '영양/식이', grooming: '미용/관리',
    safety: '안전', puppy: '퍼피케어', senior: '노견케어', law: '법률/에티켓'
  };
  const catName = catNames[category] || category;
  const passCount = Math.ceil(_currentQuiz.length * 0.7);

  renderPage(`
    <div style="max-width:600px;margin:0 auto;">
      <button class="btn btn-secondary btn-sm" onclick="_goToCategoryPage('${category}')" style="margin-bottom:20px;">← 목록으로 돌아가기</button>

      <div style="text-align:center;padding:20px 0 24px;border-bottom:1px solid var(--color-border-light);margin-bottom:22px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;background:#fef9c3;border-radius:14px;font-size:1.8rem;margin-bottom:12px;">🏆</div>
        <div style="font-size:1.15rem;font-weight:800;color:var(--color-text);margin-bottom:6px;">${catName} 카테고리 최종 퀴즈</div>
        <div style="font-size:0.82rem;color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;gap:8px;">
          <span>총 ${_currentQuiz.length}문제</span><span>·</span><span>${passCount}문제 이상 정답 시 완벽 수료</span>
        </div>
      </div>

      <div id="edu-quiz-questions">
        ${_buildQuizHtml(_currentQuiz)}
      </div>
      <div id="quiz-result" style="display:none;margin-bottom:16px;"></div>
      <button class="btn btn-primary" id="quiz-submit-btn" onclick="submitCategoryQuiz('${category}')" style="width:100%;padding:14px;font-size:1rem;border-radius:12px;margin-top:4px;">
        🎯 정답 확인하기
      </button>
    </div>
  `);
}

function submitCategoryQuiz(category) {
  const user = AuthService.getCurrentUser();
  if (!user) { showLoginModal('로그인이 필요해요!'); return; }

  const quiz = _currentQuiz;
  if (!quiz || quiz.length === 0) return;

  let correct = 0;
  let allAnswered = true;

  quiz.forEach((q, qi) => {
    const selected = document.querySelector(`input[name="quiz-${qi}"]:checked`);
    if (!selected) { allAnswered = false; return; }
    const userAnswer = parseInt(selected.value);
    const isCorrect = userAnswer === q.answer;
    if (isCorrect) correct++;

    q.options.forEach((_, oi) => {
      const optEl = document.getElementById(`quiz-opt-${qi}-${oi}`);
      if (!optEl) return;
      optEl.style.cursor = 'default';
      optEl.onclick = null;
      if (oi === q.answer) {
        optEl.style.borderColor = '#4CAF50';
        optEl.style.background = '#e8f5e9';
      } else if (oi === userAnswer && !isCorrect) {
        optEl.style.borderColor = '#f44336';
        optEl.style.background = '#ffebee';
      }
    });
  });

  if (!allAnswered) {
    const resultEl = document.getElementById('quiz-result');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = '<div class="alert alert-error" style="text-align:center;">모든 문제에 답해주세요!</div>';
    }
    return;
  }

  const passCount = Math.ceil(quiz.length * 0.7);
  const passed = correct >= passCount;
  const resultEl = document.getElementById('quiz-result');
  const btn = document.getElementById('quiz-submit-btn');

  if (!resultEl) return;
  resultEl.style.display = 'block';

  if (passed) {
    EducationService.markCategoryComplete(user.id, category);
    resultEl.innerHTML = `
      <div style="padding:24px;background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-radius:16px;border:1.5px solid #86efac;text-align:center;">
        <div style="font-size:3rem;margin-bottom:10px;">🎓</div>
        <div style="font-weight:800;color:#15803d;font-size:1.15rem;margin-bottom:4px;">${correct}/${quiz.length} 정답 — 완벽 수료!</div>
        <div style="font-size:0.84rem;color:#166534;">이 카테고리를 완벽하게 수료했습니다!</div>
      </div>`;
    if (btn) {
      btn.textContent = '🏠 목록으로 돌아가기';
      btn.onclick = () => _goToCategoryPage(category);
    }
  } else {
    const catNames = {
      basics: '기본상식', 'body-language': '바디랭귀지', training: '훈련',
      health: '건강관리', nutrition: '영양/식이', grooming: '미용/관리',
      safety: '안전', puppy: '퍼피케어', senior: '노견케어', law: '법률/에티켓'
    };
    resultEl.innerHTML = `
      <div style="padding:22px;background:linear-gradient(135deg,#fffbeb 0%,#fef9c3 100%);border-radius:16px;border:1.5px solid #fcd34d;text-align:center;">
        <div style="font-size:2.8rem;margin-bottom:8px;">😅</div>
        <div style="font-weight:800;color:#b45309;font-size:1.1rem;margin-bottom:4px;">${correct}/${quiz.length} 정답 — 아쉬워요!</div>
        <div style="font-size:0.84rem;color:#92400e;">${passCount}문제 이상 맞춰야 완벽 수료예요. 콘텐츠를 복습하고 다시 도전해보세요!</div>
      </div>`;
    if (btn) {
      btn.textContent = '🔄 다시 도전하기';
      btn.onclick = () => startCategoryQuiz(category);
    }
  }
}

function handleCompleteEducation(contentId) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    showLoginModal('학습 완료를 기록하려면 로그인이 필요해요!');
    return;
  }

  EducationService.markComplete(user.id, contentId);

  if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
    WalletService.earnCoins(user.id, 5, '교육 콘텐츠 완료');
  }

  renderEducationDetailPage({ id: contentId });
}
