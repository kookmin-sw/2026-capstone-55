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

  // 사용자 목록 HTML
  const usersHtml = allUsers.map((u, i) => `
    <tr style="border-bottom:1px solid var(--color-border);">
      <td style="padding:10px 8px; font-size:0.82rem;">${i + 1}</td>
      <td style="padding:10px 8px; font-size:0.82rem; font-weight:700;">${u.nickname || u.name || '미설정'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.name || '-'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.email || '-'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.provider || '이메일'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.pawCoins || 0} PAW</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${u.referralCode || '-'}</td>
      <td style="padding:10px 8px; font-size:0.82rem;">${new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
      <td style="padding:10px 8px;">
        ${u.isAdmin ? '<span style="font-size:0.8rem; color:var(--color-text-muted); font-weight:700;">총관리자</span>' : `
        <button class="btn btn-sm btn-secondary" onclick="adminGiveCoins('${u.id}')">코인지급</button>
        <button class="btn btn-sm" style="background:var(--color-accent); color:#fff;" onclick="adminTakeCoins('${u.id}')">코인회수</button>
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
        <div style="font-size:0.82rem; color:var(--color-text-light);">총 발행 코인</div>
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
              <th style="padding:10px 8px; font-size:0.8rem;">코인</th>
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

// 관리자: 코인 지급
function adminGiveCoins(userId) {
  const amount = prompt('지급할 코인 수량을 입력하세요:');
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  const reason = prompt('지급 사유를 입력하세요:') || '관리자 지급';

  if (typeof WalletService !== 'undefined' && WalletService.earnCoins) {
    WalletService.earnCoins(userId, Number(amount), reason);
    alert(Number(amount) + ' PAW 코인이 지급되었습니다.');
    renderAdminPage();
  }
}

// 관리자: 코인 회수
function adminTakeCoins(userId) {
  const amount = prompt('회수할 코인 수량을 입력하세요:');
  if (!amount || isNaN(amount) || Number(amount) <= 0) return;

  const reason = prompt('회수 사유를 입력하세요:') || '관리자 회수';

  if (typeof WalletService !== 'undefined' && WalletService.spendCoins) {
    const result = WalletService.spendCoins(userId, Number(amount), reason);
    if (result) {
      alert(Number(amount) + ' PAW 코인이 회수되었습니다.');
    } else {
      alert('코인이 부족하여 회수할 수 없습니다.');
    }
    renderAdminPage();
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
function adminSendNotice() {
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

  alert('공지사항이 등록되었습니다!');
  document.getElementById('admin-notice').value = '';
}

