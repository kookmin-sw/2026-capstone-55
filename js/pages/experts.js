// Pawsitive - Experts Page
// EXPERT_CATEGORIES, EXPERT_PROFILES는 community.js에서 정의 (로드 순서상 먼저 실행)

let _expertCategory = 'all';
let _activeExpertSessionId = null;
let _expertSessionTab = 'active';
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
 return getExpertSessions().find(session => session.userId === userId && session.expertId === expertId && isExpertSessionActive(session));
}

function isExpertSessionActive(session) {
 if (!session || session.status === 'ended') return false;
 if (!session.orderId) return false; // 결제 없이 생성된 mock 세션 → 만료 처리
 return true;
}

function formatExpertSessionDate(value) {
 if (!value) return '';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return '';
 return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
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
 const activeSessions = getUniqueExpertSessions(sessions.filter(isExpertSessionActive));
 const endedSessions = sessions.filter(session => !isExpertSessionActive(session));
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

 ${user && (activeSessions.length || endedSessions.length) ? renderExpertSessionTabs(activeSessions, endedSessions) : ''}

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

function renderExpertSessionTabs(activeSessions, endedSessions) {
 const visibleSessions = _expertSessionTab === 'history' ? endedSessions : activeSessions;
 const title = _expertSessionTab === 'history' ? '상담 기록' : '진행 중인 상담';
 return `
 <section class="expert-session-strip">
 <div class="expert-section-head">
 <h2>${title}</h2>
 <span>${visibleSessions.length}건</span>
 </div>
 <div class="expert-session-tabs">
 <button class="${_expertSessionTab === 'active' ? 'active' : ''}" onclick="setExpertSessionTab('active')">진행 중 <strong>${activeSessions.length}</strong></button>
 <button class="${_expertSessionTab === 'history' ? 'active' : ''}" onclick="setExpertSessionTab('history')">상담 기록 <strong>${endedSessions.length}</strong></button>
 </div>
 <div class="expert-session-list">
 ${visibleSessions.length ? visibleSessions.map(renderExpertSessionChip).join('') : `<div class="expert-session-empty">${_expertSessionTab === 'history' ? '아직 종료된 상담 기록이 없어요.' : '진행 중인 상담이 없어요.'}</div>`}
 </div>
 </section>`;
}

function renderExpertSessionChip(session) {
 const expert = getExpertById(session.expertId);
 if (!expert) return '';
 const isEnded = !isExpertSessionActive(session);
 const dateText = formatExpertSessionDate(isEnded ? session.endedAt : session.paidAt);
 return `
 <button class="expert-session-chip ${isEnded ? 'expert-session-chip--ended' : ''}" onclick="openExpertChat('${session.id}')">
 <span class="expert-session-chip__avatar">${expert.avatar}</span>
 <span>
 <strong>${expert.name}</strong>
 <small>${expert.categoryLabel} 상담${dateText ? ` · ${dateText}` : ''}</small>
 </span>
 </button>`;
}

function setExpertSessionTab(tab) {
 _expertSessionTab = tab === 'history' ? 'history' : 'active';
 renderExpertsPage();
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
 <div class="expert-modal__notice">결제가 완료되면 상담방이 바로 열려요.</div>
 <button class="btn btn-primary expert-modal__pay" onclick="requestExpertPayment('${expert.id}')">${expert.price.toLocaleString()}원 결제하고 상담 시작</button>
 </div>`;
 modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
 document.body.appendChild(modal);
 document.getElementById('expert-first-message')?.focus();
}

async function requestExpertPayment(expertId) {
 const user = AuthService.getCurrentUser();
 const expert = getExpertById(expertId);
 if (!user || !expert) return;

 const firstMessage = document.getElementById('expert-first-message')?.value.trim() || '상담을 시작하고 싶어요.';
 const orderId = 'expert_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
 const pendingPayment = {
 orderId,
 amount: expert.price,
 expertId,
 firstMessage,
 requestType: 'expert',
 timestamp: Date.now()
 };

 localStorage.setItem('pawsitive_pending_payment', JSON.stringify(pendingPayment));

 const btn = document.querySelector('.expert-modal__pay');
 if (btn) {
 btn.disabled = true;
 btn.textContent = '결제 처리 중...';
 }

 try {
 await requestTossPayment({
 amount: expert.price,
 orderId,
 orderName: `${expert.name} ${expert.categoryLabel} 상담`,
 customerName: user.name || user.nickname || '요청자',
 successHash: '#/experts',
 failHash: '#/experts'
 });
 } catch(e) {
 localStorage.removeItem('pawsitive_pending_payment');
 document.getElementById('expert-payment-modal')?.remove();
 }
}

function completeExpertPayment(expertId, payment = {}) {
 const user = AuthService.getCurrentUser();
 const expert = getExpertById(expertId);
 if (!user || !expert) return;

 const sessions = getExpertSessions();
 const existingSession = sessions.find(session => session.userId === user.id && session.expertId === expertId && isExpertSessionActive(session));
 if (existingSession) {
 document.getElementById('expert-payment-modal')?.remove();
 showToast('이미 진행 중인 상담이 있어요. 기존 상담방을 열게요.', 'info');
 openExpertChat(existingSession.id);
 return;
 }

 const firstMessage = payment.firstMessage || document.getElementById('expert-first-message')?.value.trim() || '상담을 시작하고 싶어요.';
 const session = {
 id: 'expert_' + Date.now().toString(36),
 userId: user.id,
 expertId,
 status: 'active',
 paidAt: new Date().toISOString(),
 amount: expert.price,
 paymentOrderId: payment.orderId || '',
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

function endExpertSession(sessionId) {
 if (!confirm('상담을 종료할까요? 종료 후에는 이 상담방에 메시지를 보낼 수 없어요.')) return;

 const sessions = getExpertSessions();
 const session = sessions.find(s => s.id === sessionId);
 if (!session || !isExpertSessionActive(session)) return;

 session.status = 'ended';
 session.endedAt = new Date().toISOString();
 session.messages.push({
 from: 'system',
 text: '상담이 종료됐어요. 같은 전문가와 새 상담이 필요하면 다시 결제 후 시작할 수 있어요.',
 createdAt: session.endedAt
 });
 _expertPendingAttachments[sessionId] = [];
 saveExpertSessions(sessions);
 _expertSessionTab = 'history';
 showToast('상담을 종료했어요.', 'success');
 openExpertChat(sessionId);
}

function renderExpertChat(session, expert) {
 const isEnded = !isExpertSessionActive(session);
 return `
 <section class="expert-chat-panel" id="expert-chat-panel">
 <div class="expert-chat">
 <div class="expert-chat__head">
 <div class="expert-avatar expert-avatar--${expert.category}">${expert.avatar}</div>
 <div>
 <h3>${expert.name}</h3>
 <p>${expert.categoryLabel} · ${isEnded ? '종료된 상담' : '결제 완료 상담'}</p>
 </div>
 <div class="expert-chat__actions">
 ${isEnded ? '' : `<button class="expert-chat__end" onclick="endExpertSession('${session.id}')" type="button">상담 종료</button>`}
 <button class="expert-chat__close" onclick="closeExpertChat()" aria-label="닫기" type="button">×</button>
 </div>
 </div>
 <div class="expert-chat__messages" id="expert-chat-messages">
 ${session.messages.map(renderExpertMessage).join('')}
 </div>
 ${isEnded ? `
 <div class="expert-chat__ended">
 <strong>상담이 종료됐어요.</strong>
 <span>대화 내용은 보관되며, 새 상담은 전문가 카드에서 다시 시작할 수 있어요.</span>
 </div>` : `
 <div class="expert-chat__composer">
 <div class="expert-chat__attachments" id="expert-chat-attachments">${renderExpertAttachmentPreview(session.id)}</div>
 <div class="expert-chat__input">
 <label class="expert-chat__attach" for="expert-chat-file" aria-label="사진 첨부">${icon('image',18)}</label>
 <input id="expert-chat-file" type="file" accept="image/*" multiple onchange="handleExpertChatFile('${session.id}', this)">
 <input id="expert-chat-input" type="text" maxlength="240" placeholder="메시지 입력 또는 사진 붙여넣기..." onpaste="handleExpertChatPaste(event, '${session.id}')" onkeydown="if(event.key==='Enter') sendExpertMessage('${session.id}')">
 <button class="btn btn-primary btn-sm" onclick="sendExpertMessage('${session.id}')">전송</button>
 </div>
 </div>
 `}
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
 if (!isExpertSessionActive(session)) {
 showToast('종료된 상담에는 메시지를 보낼 수 없어요.', 'info');
 return;
 }

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
