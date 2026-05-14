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

    <div class="card" style="padding:24px; margin-bottom:24px;">
      <h3 style="margin-bottom:16px;">전문가 등록 심사</h3>
      <p style="font-size:0.84rem;color:var(--color-text-muted);line-height:1.6;margin-bottom:16px;">
        수의사 면허, 반려동물행동지도사/KKC/KKF 자격, 미용 포트폴리오를 확인한 뒤 승인 또는 불합격 처리합니다.
      </p>
      <div id="admin-expert-applications">
        <div style="padding:24px;text-align:center;"><div class="spinner"></div></div>
      </div>
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

  loadAdminExpertApplications();
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

let _adminExpertApplicationsCache = [];

function adminEscapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

async function loadAdminExpertApplications() {
  const container = document.getElementById('admin-expert-applications');
  if (!container) return;
  try {
    const res = await fetch('/api/experts/applications');
    const data = await res.json();
    _adminExpertApplicationsCache = data.applications || [];
    const apps = _adminExpertApplicationsCache;
    if (!apps.length) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--color-text-muted);font-size:0.84rem;">전문가 등록 신청이 없습니다.</div>';
      return;
    }
    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:2px solid var(--color-border);text-align:left;">
              <th style="padding:10px 8px;font-size:0.8rem;">분야</th>
              <th style="padding:10px 8px;font-size:0.8rem;">신청자</th>
              <th style="padding:10px 8px;font-size:0.8rem;">자격</th>
              <th style="padding:10px 8px;font-size:0.8rem;">서류</th>
              <th style="padding:10px 8px;font-size:0.8rem;">상태</th>
              <th style="padding:10px 8px;font-size:0.8rem;">관리</th>
            </tr>
          </thead>
          <tbody>
            ${apps.map(renderAdminExpertApplicationRow).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:#D32F2F;font-size:0.84rem;">전문가 신청 목록을 불러오지 못했어요.</div>';
  }
}

function renderAdminExpertApplicationRow(app) {
  const docs = app.documents || [];
  const statusColor = app.status === 'approved' ? '#047857' : app.status === 'rejected' ? '#B91C1C' : '#C2410C';
  return `
    <tr style="border-bottom:1px solid var(--color-border);vertical-align:top;">
      <td style="padding:12px 8px;font-size:0.82rem;font-weight:800;">${adminEscapeHtml(app.categoryLabel)}</td>
      <td style="padding:12px 8px;font-size:0.82rem;">
        <strong>${adminEscapeHtml(app.displayName)}</strong><br>
        <span style="color:var(--color-text-muted);">${adminEscapeHtml(app.applicantEmail || app.applicantName || '-')}</span>
      </td>
      <td style="padding:12px 8px;font-size:0.82rem;">
        <strong>${adminEscapeHtml(app.licenseName)}</strong> ${app.licenseGrade ? `(${adminEscapeHtml(app.licenseGrade)})` : ''}<br>
        <span style="color:var(--color-text-muted);">${adminEscapeHtml(app.licenseIssuer || '-')} · ${adminEscapeHtml(app.licenseNumber || '-')}</span>
      </td>
      <td style="padding:12px 8px;font-size:0.82rem;">
        ${docs.length ? docs.map((doc, idx) => `<button class="btn btn-sm btn-secondary" style="margin:0 4px 4px 0;" onclick="adminOpenExpertDocument('${app.id}', ${idx})">${adminEscapeHtml(doc.name || '서류')}</button>`).join('') : '-'}
      </td>
      <td style="padding:12px 8px;font-size:0.82rem;">
        <span style="display:inline-flex;padding:5px 9px;border-radius:999px;background:#F8FAFC;color:${statusColor};font-weight:800;">${adminEscapeHtml(app.status)}</span>
        ${app.rejectionReason ? `<div style="margin-top:6px;color:#B91C1C;font-size:0.76rem;">${adminEscapeHtml(app.rejectionReason)}</div>` : ''}
      </td>
      <td style="padding:12px 8px;">
        ${app.status === 'pending' ? `
          <button class="btn btn-sm btn-primary" onclick="adminReviewExpertApplication('${app.id}', 'approved')">합격</button>
          <button class="btn btn-sm btn-danger" onclick="adminReviewExpertApplication('${app.id}', 'rejected')">불합격</button>
        ` : '<span style="font-size:0.78rem;color:var(--color-text-muted);font-weight:700;">심사 완료</span>'}
      </td>
    </tr>`;
}

function adminOpenExpertDocument(appId, index) {
  const app = _adminExpertApplicationsCache.find(a => a.id === appId);
  const doc = app?.documents?.[index];
  if (!doc?.data) {
    alert('서류 파일을 열 수 없습니다.');
    return;
  }
  const win = window.open('', '_blank');
  if (!win) return;
  const safeName = adminEscapeHtml(doc.name || '전문가 서류');
  if ((doc.type || '').includes('pdf')) {
    win.document.write(`<title>${safeName}</title><iframe src="${doc.data}" style="border:0;width:100vw;height:100vh;"></iframe>`);
  } else {
    win.document.write(`<title>${safeName}</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${doc.data}" style="max-width:96vw;max-height:96vh;"></body>`);
  }
}

async function adminReviewExpertApplication(appId, decision) {
  const current = AuthService.getCurrentUser();
  let reason = '';
  if (decision === 'rejected') {
    reason = prompt('불합격 사유를 입력하세요:', '서류 식별 정보가 부족합니다.') || '서류 확인이 필요합니다.';
  } else if (!confirm('이 전문가 신청을 합격 처리할까요? 승인 후 전문가 목록에 노출됩니다.')) {
    return;
  }
  try {
    const res = await fetch(`/api/experts/applications/${appId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reason, adminId: current?.id || 'admin' })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '심사 처리 실패');
    alert(decision === 'approved' ? '전문가 신청을 승인했습니다.' : '전문가 신청을 불합격 처리했습니다.');
    loadAdminExpertApplications();
  } catch (e) {
    alert(e.message || '심사 처리에 실패했습니다.');
  }
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
  document.getElementById('admin-notice').value = '';
}
