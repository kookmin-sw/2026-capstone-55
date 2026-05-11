// Pawsitive - Education Page
// Dog training education content and quizzes

function renderEducationPage() {
 const user = AuthService.getCurrentUser();
 const progress = user ? EducationService.getProgress(user.id) : { total: EDUCATION_DATA.length, completed: 0, ratio: 0, completedIds: [] };
 const pct = Math.round(progress.ratio * 100);

 const categories = [
 { key: 'all', label: '전체', color: '#1a1a1a' },
 { key: 'basics', label: '기본상식', color: '#6366f1' },
 { key: 'body-language', label: '바디랭귀지', color: '#8b5cf6' },
 { key: 'training', label: '훈련', color: '#ec4899' },
 { key: 'health', label: '건강관리', color: '#ef4444' },
 { key: 'nutrition', label: '영양/식이', color: '#f59e0b' },
 { key: 'grooming', label: '미용/관리', color: '#10b981' },
 { key: 'safety', label: '안전', color: '#3b82f6' },
 { key: 'puppy', label: '퍼피케어', color: '#f472b6' },
 { key: 'senior', label: '노견케어', color: '#78716c' },
 { key: 'law', label: '법률/에티켓', color: '#64748b' }
 ];

 renderPage(`
 <div class="page-header">
 <h1>반려견 교육 센터</h1>
 <p>반려견과 행복하게 살기 위한 모든 지식을 배워봐요~ </p>
 </div>
 <div class="progress-section" style="margin-bottom:20px;">
 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
 <span style="font-weight:600; font-size:0.9rem;">학습 진행률</span>
 <span style="font-size:0.85rem; color:var(--color-text-light);">${progress.completed} / ${progress.total} 완료 (${pct}%)</span>
 </div>
 <div style="width:100%; height:12px; background:var(--color-border, #F5E6EA); border-radius:6px; overflow:hidden;">
 <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, var(--color-primary-light), var(--color-primary)); border-radius:6px; transition:width 0.3s;"></div>
 </div>
 </div>
 <div class="tabs" style="flex-wrap:wrap; gap:4px;">
 ${categories.map(c => `<button class="tab${c.key === 'all' ? ' active' : ''}" onclick="filterEducation('${c.key}', this)" style="font-size:0.82rem; padding:8px 12px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${c.color}; margin-right:5px; vertical-align:middle;"></span>${c.label}</button>`).join('')}
 </div>
 <div class="grid-2" id="education-list">
 ${renderEducationCards(EducationService.getByCategory('all'), progress.completedIds)}
 </div>
 `);
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
    basics: '🐾 기본상식', 'body-language': '🐕 바디랭귀지', training: '🎓 훈련',
    health: '🏥 건강관리', nutrition: '🥗 영양/식이', grooming: '✂️ 미용/관리',
    safety: '🛡️ 안전', puppy: '🍼 퍼피케어', senior: '🐕‍🦺 노견케어', law: '⚖️ 법률/에티켓',
    posture: '🧍 자세', leash: '🦮 리드줄'
  };
  const levelMap = { beginner: { label: '입문', color: '#e0f2fe', text: '#0369a1' }, intermediate: { label: '중급', color: '#fef9c3', text: '#854d0e' }, advanced: { label: '심화', color: '#fce7f3', text: '#9d174d' } };
  return items.map(item => {
    const isCompleted = completedIds.includes(item.id);
    const lv = item.level ? levelMap[item.level] : null;
    return `
    <div class="card" onclick="Router.navigate('/education/${item.id}')" style="cursor:pointer;${isCompleted ? ' border-left:3px solid var(--color-primary, #FF8FAB);' : ''}">
      <div class="card__body">
        <div class="card__subtitle" style="display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
          <span class="badge badge-primary">${catMap[item.category]}</span>
          ${lv ? `<span class="badge" style="background:${lv.color}; color:${lv.text};">${lv.label}</span>` : ''}
          ${isCompleted ? '<span class="badge" style="background:#d1fae5; color:#065f46;">✅ 수료</span>' : ''}
        </div>
        <div class="card__title" style="margin-top:8px;">${item.title}</div>
        <div class="card__text" style="margin-top:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${item.body.substring(0, 80)}...
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function filterEducation(category, btn) {
 document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
 if (btn) btn.classList.add('active');
 const filtered = EducationService.getByCategory(category);
 const user = AuthService.getCurrentUser();
 const progress = user ? EducationService.getProgress(user.id) : { completedIds: [] };
 const list = document.getElementById('education-list');
 if (list) list.innerHTML = renderEducationCards(filtered, progress.completedIds);
}

// --- 교육 상세 페이지 ---
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
 health: '건강관리', nutrition: '🍖 영양/식이', grooming: '✂️ 미용/관리',
 safety: '안전', puppy: '퍼피케어', senior: '🐕 노견케어', law: '법률/에티켓',
 posture: '자세', leash: '리드줄'
 };
 const user = AuthService.getCurrentUser();
 const progress = user ? EducationService.getProgress(user.id) : { completedIds: [] };
 const isCompleted = progress.completedIds.includes(content.id);

 let completeButtonHtml = '';
 const hasQuiz = content.quiz && content.quiz.length > 0;

  if (isCompleted) {
    completeButtonHtml = `
      <div style="margin-top:24px; padding:16px; background:#d1fae5; border-radius:var(--radius-md, 8px); text-align:center;">
        <span style="font-size:1.2rem;">✅</span>
        <span style="font-weight:600; color:#065f46; margin-left:8px;">이미 완료한 콘텐츠입니다</span>
      </div>`;
  } else if (hasQuiz) {
    completeButtonHtml = `
      <div id="edu-quiz-section" style="margin-top:24px;">
        <div class="card" style="padding:24px;">
          <h3 style="margin-bottom:4px;">📝 학습 확인 퀴즈</h3>
          <p style="color:var(--color-text-muted); font-size:0.85rem; margin-bottom:20px;">5문제 중 3문제 이상 맞추면 수료!</p>
          ${content.quiz.map((q, qi) => `
            <div class="quiz-question" style="margin-bottom:20px; padding:16px; background:var(--color-bg-warm); border-radius:12px;">
              <p style="font-weight:700; margin-bottom:10px;">Q${qi + 1}. ${q.question}</p>
              <div style="display:grid; gap:8px;">
                ${q.options.map((opt, oi) => `
                  <label class="quiz-option" id="quiz-opt-${qi}-${oi}" style="display:flex; align-items:center; gap:10px; padding:10px 14px; background:#fff; border:2px solid var(--color-border, #e5e5e5); border-radius:10px; cursor:pointer; transition:all 0.2s; font-size:0.9rem;" onclick="selectQuizOption(${qi}, ${oi})">
                    <input type="radio" name="quiz-${qi}" value="${oi}" style="display:none;">
                    <span class="quiz-radio" style="width:20px; height:20px; border:2px solid #ccc; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s;"></span>
                    <span>${opt}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <div id="quiz-result" style="display:none; margin-bottom:16px;"></div>
          <button class="btn btn-primary" id="quiz-submit-btn" onclick="submitEducationQuiz('${content.id}')" style="width:100%; padding:14px; font-size:1rem;">
            🎯 정답 확인하기
          </button>
        </div>
      </div>`;
  } else {
    // 퀴즈 없는 콘텐츠 (기존 완료 버튼)
    if (user) {
      completeButtonHtml = `
        <div style="margin-top:24px; text-align:center;">
          <button class="btn btn-primary" id="complete-btn" onclick="handleCompleteEducation('${content.id}')" style="padding:12px 32px; font-size:1rem;">✅ 완료</button>
        </div>`;
    } else {
      completeButtonHtml = `
        <div style="margin-top:24px; text-align:center;">
          <button class="btn btn-primary" onclick="showLoginModal('학습 완료를 기록하려면 로그인이 필요해요!')" style="padding:12px 32px; font-size:1rem;">✅ 완료</button>
        </div>`;
    }
  }

  const lvMap2 = { beginner: { label: '입문', color: '#e0f2fe', text: '#0369a1' }, intermediate: { label: '중급', color: '#fef9c3', text: '#854d0e' }, advanced: { label: '심화', color: '#fce7f3', text: '#9d174d' } };
  const lvInfo = content.level ? lvMap2[content.level] : null;
  renderPage(`
    <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/education')" style="margin-bottom:16px;">← 목록으로</button>
    <div class="detail-header">
      <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:8px;">
        <span class="badge badge-primary">${catMap[content.category]}</span>
        ${lvInfo ? `<span class="badge" style="background:${lvInfo.color}; color:${lvInfo.text};">${lvInfo.label}</span>` : ''}
      </div>
      <h1 style="margin-top:4px;">${content.title}</h1>
    </div>
    <div class="detail-section">
      <div style="white-space:pre-line; line-height:1.8; font-size:0.95rem;">${content.body}</div>
    </div>
    ${completeButtonHtml}
  `);
}

/**
 * 퀴즈 옵션 선택
 */
function selectQuizOption(questionIdx, optionIdx) {
 // 해당 문제의 모든 옵션 초기화
 document.querySelectorAll(`[id^="quiz-opt-${questionIdx}-"]`).forEach(el => {
 el.style.borderColor = 'var(--color-border, #e5e5e5)';
 el.style.background = '#fff';
 const radio = el.querySelector('.quiz-radio');
 if (radio) { radio.style.borderColor = '#ccc'; radio.innerHTML = ''; }
 });
 // 선택된 옵션 하이라이트
 const selected = document.getElementById(`quiz-opt-${questionIdx}-${optionIdx}`);
 if (selected) {
 selected.style.borderColor = 'var(--color-primary, #7C4DFF)';
 selected.style.background = 'rgba(124, 77, 255, 0.05)';
 const radio = selected.querySelector('.quiz-radio');
 if (radio) {
 radio.style.borderColor = 'var(--color-primary, #7C4DFF)';
 radio.style.background = 'var(--color-primary, #7C4DFF)';
 radio.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="white"/></svg>';
 }
 const input = selected.querySelector('input');
 if (input) input.checked = true;
 }
}

/**
 * 퀴즈 제출 및 채점
 */
function submitEducationQuiz(contentId) {
 const content = EducationService.getById(contentId);
 if (!content || !content.quiz) return;

 const user = AuthService.getCurrentUser();
 if (!user) {
 showLoginModal('퀴즈 결과를 저장하려면 로그인이 필요해요!\n학습 진행률을 추적할 수 있어요.');
 return;
 }

 const quiz = content.quiz;
 let correct = 0;
 let allAnswered = true;

 quiz.forEach((q, qi) => {
 const selected = document.querySelector(`input[name="quiz-${qi}"]:checked`);
 if (!selected) { allAnswered = false; return; }
 const userAnswer = parseInt(selected.value);
 const isCorrect = userAnswer === q.answer;
 if (isCorrect) correct++;

 // 정답/오답 표시
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
      resultEl.innerHTML = `
        <div style="text-align:center; padding:20px; background:#d1fae5; border-radius:12px;">
          <div style="font-size:2rem; margin-bottom:8px;">🎉</div>
          <div style="font-weight:800; color:#065f46; font-size:1.1rem;">${correct}/${quiz.length} 정답 — 통과!</div>
          <p style="color:#065f46; font-size:0.85rem; margin-top:4px;">학습 완료로 기록되었습니다.</p>
        </div>`;
      // 학습 완료 처리
      EducationService.markComplete(user.id, contentId);
      if (btn) btn.style.display = 'none';
    } else {
      resultEl.innerHTML = `
        <div style="text-align:center; padding:20px; background:#fff3e0; border-radius:12px;">
          <div style="font-size:2rem; margin-bottom:8px;">😅</div>
          <div style="font-weight:800; color:#e65100; font-size:1.1rem;">${correct}/${quiz.length} 정답 — 아쉬워요!</div>
          <p style="color:#e65100; font-size:0.85rem; margin-top:4px;">3문제 이상 맞춰야 수료예요. 내용을 다시 읽고 도전해보세요!</p>
        </div>`;
      if (btn) {
        btn.textContent = '🔄 다시 도전하기';
        btn.onclick = () => Router.navigate('/education/' + contentId);
      }
    }
  }
}

/**
 * 교육 콘텐츠 완료 핸들러 (퀴즈 없는 콘텐츠용)
 * @param {string} contentId - 콘텐츠 ID
 */
function handleCompleteEducation(contentId) {
 const user = AuthService.getCurrentUser();
 if (!user) {
 showLoginModal('학습 완료를 기록하려면 로그인이 필요해요!');
 return;
 }

 EducationService.markComplete(user.id, contentId);

 // WalletService가 존재하면 5 Paw 코인 적립
 if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
 WalletService.earnCoins(user.id, 5, '교육 콘텐츠 완료');
 }

 // 상세 페이지 다시 렌더링하여 완료 상태 반영
 renderEducationDetailPage({ id: contentId });
}

// --- 통합 AI 상담 페이지 ---
