// Pawsitive - Admin Page
// --- 관리자 계정 자동 생성 ---
function ensureAdminAccount() {
  const adminEmail = 'pawsitivecompanyofficial@gmail.com';
  const users = StorageService.get('users', []);
  let admin = users.find(u => u.email === adminEmail);

  if (!admin) {
    admin = {
      id: StorageService.generateId(),
      email: adminEmail,
      name: 'Pawsitive 관리자',
      nickname: '관리자',
      passwordHash: AuthService.hashPassword('pawsitive2026!'),
      referralCode: 'PAW-ADMIN',
      isAdmin: true,
      dogs: [],
      pawCoins: 0,
      createdAt: StorageService.now()
    };
    users.push(admin);
    StorageService.set('users', users);
    console.log('[Pawsitive] 관리자 계정이 생성되었습니다.');
  } else if (!admin.isAdmin) {
    admin.isAdmin = true;
    StorageService.set('users', users);
  }
}

// --- 관리자 대시보드 ---
function renderAdminPage() {
  const user = AuthService.getCurrentUser();

  if (!user || !user.isAdmin) {
    renderPage(`
      <div class="not-found">
        <div class="nf-icon">🔒</div>
        <h2>접근 권한이 없습니다</h2>
        <p>관리자만 접근할 수 있는 페이지예요.</p>
        <button class="btn btn-primary" onclick="Router.navigate('/')">홈으로 돌아가기</button>
      </div>
    `);
    return;
  }

  // 전체 사용자 목록
  const allUsers = StorageService.get('users', []);
  const allPosts = StorageService.get('communityPosts', []);
  const allTransactions = StorageService.get('transactions', []);
  const totalCoins = allUsers.reduce((sum, u) => sum + (u.pawCoins || 0), 0);
  const allNotices = StorageService.get('notices', []);

  // 사용자 목록 HTML
  const usersHtml = allUsers.map((u, i) => `
    <tr style="border-bottom:1px solid var(--color-border);">
      <td style="padding:10px 8px; font-size:0.82rem;">${i + 1}</td>
      <td style="padding:10px 8px; font-size:0.82rem; font-weight:700;">${u.nickname || u.name || '미설정'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.name || '-'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.email || '-'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.provider || '이메일'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.pawCoins || 0} P</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.referralCode || '-'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
      <td style="padding:10px 8px;">
        ${u.isAdmin ? '<span style="font-size:0.8rem; color:var(--color-text-muted); font-weight:700;">총관리자</span>' : `
        <button class="btn btn-sm btn-secondary" onclick="adminGiveCoins('${u.id}')">포인트지급</button>
        <button class="btn btn-sm" style="background:var(--color-accent); color:#fff;" onclick="adminTakeCoins('${u.id}')">포인트회수</button>
        <button class="btn btn-sm btn-danger" onclick="adminDeleteUser('${u.id}', '${u.nickname || u.name}')">삭제</button>
        `}
      </td>
    </tr>
  `).join('');

  renderPage(`
    <div class="page-header">
      <h1>관리자 대시보드</h1>
      <p>Pawsitive 사이트 관리 페이지</p>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
      <div class="card" style="padding:20px; text-align:center;">
        <div style="font-size:2rem;">👥</div>
        <div style="font-size:1.5rem; font-weight:900; margin-top:8px;">${allUsers.length}</div>
        <div style="font-size:0.82rem; color:var(--color-text-light);">총 회원 수</div>
      </div>
      <div class="card" style="padding:20px; text-align:center;">
        <div style="font-size:2rem;">💬</div>
        <div style="font-size:1.5rem; font-weight:900; margin-top:8px;">${allPosts.length}</div>
        <div style="font-size:0.82rem; color:var(--color-text-light);">총 게시물</div>
      </div>
      <div class="card" style="padding:20px; text-align:center;">
        <div style="font-size:2rem;">🪙</div>
        <div style="font-size:1.5rem; font-weight:900; margin-top:8px;">${totalCoins.toLocaleString()}</div>
        <div style="font-size:0.82rem; color:var(--color-text-light);">총 발행 포인트</div>
      </div>
      <div class="card" style="padding:20px; text-align:center;">
        <div style="font-size:2rem;">📋</div>
        <div style="font-size:1.5rem; font-weight:900; margin-top:8px;">${allTransactions.length}</div>
        <div style="font-size:0.82rem; color:var(--color-text-light);">총 거래 수</div>
      </div>
    </div>

    <div class="card" style="padding:24px; margin-bottom:24px;">
      <h3 style="margin-bottom:16px;">공지사항 보내기</h3>
      <div class="form-group">
        <textarea id="admin-notice" class="form-input" placeholder="전체 사용자에게 보낼 공지사항을 입력하세요..." style="min-height:80px;"></textarea>
      </div>
      <button class="btn btn-primary" onclick="adminSendNotice()">공지 등록</button>

      ${allNotices.length > 0 ? `
      <div style="margin-top:24px;border-top:1px solid var(--color-border);padding-top:20px;">
        <h4 style="margin-bottom:12px;font-size:0.95rem;">이전 공지사항 (${allNotices.length}건)</h4>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${allNotices.map(n => {
            const preview = n.text.length > 40 ? n.text.slice(0, 40) + '…' : n.text;
            const safeText = n.text.replace(/'/g, "\\'").replace(/\n/g, '\\n');
            const safeDate = new Date(n.createdAt).toLocaleString('ko-KR');
            return `
            <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--color-bg-section,#f9f9f9);border-radius:10px;cursor:pointer;"
                 onclick="adminViewNotice('${safeText}','${safeDate}')">
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.88rem;color:var(--color-text);line-height:1.5;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${preview}</div>
                <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:2px;">${safeDate}</div>
              </div>
              <button onclick="event.stopPropagation();adminDeleteNotice('${n.id}')"
                style="background:none;border:none;color:#E53E3E;font-size:0.8rem;cursor:pointer;white-space:nowrap;padding:2px 6px;flex-shrink:0;">삭제</button>
            </div>
          `;}).join('')}
        </div>
      </div>` : ''}
    </div>

    <div class="card" style="padding:24px;">
      <h3 style="margin-bottom:16px;">회원 목록 (${allUsers.length}명)</h3>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:2px solid var(--color-border); text-align:left;">
              <th style="padding:10px 8px; font-size:0.8rem;">#</th>
              <th style="padding:10px 8px; font-size:0.8rem;">닉네임</th>
              <th style="padding:10px 8px; font-size:0.8rem;">이름</th>
              <th style="padding:10px 8px; font-size:0.8rem;">이메일</th>
              <th style="padding:10px 8px; font-size:0.8rem;">가입방식</th>
              <th style="padding:10px 8px; font-size:0.8rem;">포인트</th>
              <th style="padding:10px 8px; font-size:0.8rem;">추천코드</th>
              <th style="padding:10px 8px; font-size:0.8rem;">가입일</th>
              <th style="padding:10px 8px; font-size:0.8rem;">관리</th>
            </tr>
          </thead>
          <tbody>
            ${usersHtml || '<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--color-text-muted);">가입된 회원이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `);
}

// 관리자: 포인트 지급
async function adminGiveCoins(userId) {
  const amount = prompt('지급할 포인트 수량을 입력하세요:');
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;
  const reason = prompt('지급 사유를 입력하세요:') || '관리자 지급';

  try {
    const res = await fetch(`/api/users/${userId}/admin-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), reason, type: 'earn' })
    });
    const data = await res.json();
    if (!data.success) { alert(data.error || '지급 실패'); return; }

    // 로컬도 즉시 갱신
    if (typeof WalletService !== 'undefined') WalletService.earnCoins(userId, Number(amount), reason);
    alert(Number(amount).toLocaleString() + ' PAW 포인트가 지급되었습니다.');
    renderAdminPage();
  } catch(e) {
    alert('서버 오류: ' + e.message);
  }
}

// 관리자: 포인트 회수
async function adminTakeCoins(userId) {
  const amount = prompt('회수할 포인트 수량을 입력하세요:');
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;
  const reason = prompt('회수 사유를 입력하세요:') || '관리자 회수';

  try {
    const res = await fetch(`/api/users/${userId}/admin-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), reason, type: 'spend' })
    });
    const data = await res.json();
    if (!data.success) { alert(data.error || '회수 실패'); return; }

    // 로컬도 즉시 갱신
    if (typeof WalletService !== 'undefined') WalletService.spendCoins(userId, Number(amount), reason);
    alert(Number(amount).toLocaleString() + ' PAW 포인트가 회수되었습니다.');
    renderAdminPage();
  } catch(e) {
    alert('서버 오류: ' + e.message);
  }
}

// 관리자: 회원 삭제
function adminDeleteUser(userId, userName) {
  if (!confirm(userName + '님을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

  const users = StorageService.get('users', []);
  const filtered = users.filter(u => u.id !== userId);
  StorageService.set('users', filtered);

  alert(userName + '님이 삭제되었습니다.');
  renderAdminPage();
}

// 관리자: 공지사항 등록
async function adminSendNotice() {
  const notice = document.getElementById('admin-notice')?.value;
  if (!notice || !notice.trim()) {
    alert('공지사항 내용을 입력해주세요.');
    return;
  }

  const notices = StorageService.get('notices', []);
  notices.unshift({
    id: StorageService.generateId(),
    text: notice.trim(),
    createdAt: StorageService.now()
  });
  StorageService.set('notices', notices);

  // 서버를 통해 전체 사용자에게 공지 알림 브로드캐스트
  try {
    await fetch('/api/data/broadcast-notice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: notice.trim() })
    });
  } catch(e) {}

  addNotification('[공지] ' + notice.trim(), 'info');

  alert('공지사항이 등록되었습니다!');
  renderAdminPage();
}

// 관리자: 공지사항 삭제
function adminDeleteNotice(noticeId) {
  if (!confirm('이 공지사항을 삭제하시겠습니까?')) return;
  let notices = StorageService.get('notices', []);
  notices = notices.filter(n => n.id !== noticeId);
  StorageService.set('notices', notices);
  renderAdminPage();
}

// 관리자: 공지사항 상세 보기 모달
function adminViewNotice(text, date) {
  document.getElementById('admin-notice-modal')?.remove();
  const fullText = text.replace(/\\n/g, '\n');
  const modal = document.createElement('div');
  modal.id = 'admin-notice-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:24px 22px;max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <strong style="font-size:1rem;">📢 공지사항</strong>
        <button onclick="document.getElementById('admin-notice-modal').remove()"
          style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#aaa;line-height:1;padding:0;">×</button>
      </div>
      <div style="font-size:0.75rem;color:var(--color-text-muted);margin-bottom:14px;">${date}</div>
      <p style="font-size:0.9rem;color:#333;line-height:1.7;white-space:pre-wrap;word-break:break-word;margin:0;">${fullText}</p>
    </div>
  `;
  document.body.appendChild(modal);
}

