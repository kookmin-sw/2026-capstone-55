// Pawsitive - Wallet Page
function renderWalletPage() {
  const user = AuthService.getCurrentUser();

  if (!user) {
    renderPage(`
      <div class="page-header">
        <h1>🪙 Paw 지갑</h1>
        <p>활동으로 코인을 모으고 사용해봐요~ 💕</p>
      </div>
      <div class="wallet-balance">
        <div class="balance-label">보유 Paw 코인</div>
        <div class="balance-amount">0</div>
        <div class="balance-unit">🐾 PAW (0원)</div>
      </div>
      <div class="page-header" style="margin-top:8px;">
        <h1 style="font-size:1.1rem;">📋 거래 내역</h1>
      </div>
      <div class="card" style="padding:20px;">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>거래 내역이 없습니다</p>
        </div>
      </div>
      <div style="margin-top:16px; text-align:center;">
        <button class="btn btn-primary" onclick="showLoginModal('Paw 코인을 적립하고 사용하려면 로그인이 필요해요!\\n산책, 커뮤니티 활동으로 코인을 모을 수 있어요.')">💰 코인 적립 시작하기</button>
      </div>
    `);
    return;
  }

  const balance = WalletService.getBalance(user.id);
  const transactions = WalletService.getTransactions(user.id);

  let transactionListHtml = '';
  if (transactions.length === 0) {
    transactionListHtml = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>거래 내역이 없습니다</p>
      </div>
    `;
  } else {
    transactionListHtml = `
      <div class="card">
        ${transactions.map(tx => {
          const isEarn = tx.type === 'earn';
          const sign = isEarn ? '+' : '-';
          const amountClass = isEarn ? 'earn' : 'spend';
          const date = new Date(tx.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric'
          });
          return `
            <div class="transaction-item">
              <div class="tx-info">
                <div class="tx-reason">${tx.reason}</div>
                <div class="tx-date">${date}</div>
              </div>
              <div class="tx-amount ${amountClass}">${sign}${tx.amount} PAW</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderPage(`
    <div class="page-header">
      <h1>🪙 Paw 지갑</h1>
      <p>활동으로 코인을 모으고 사용해봐요~ 💕</p>
    </div>
    <div class="wallet-balance">
      <div class="balance-label">보유 Paw 코인</div>
      <div class="balance-amount">${balance}</div>
      <div class="balance-unit">🐾 PAW (${balance}원)</div>
    </div>
    <div class="page-header" style="margin-top:8px;">
      <h1 style="font-size:1.1rem;">📋 거래 내역</h1>
    </div>
    ${transactionListHtml}
  `);
}

// --- 매칭 페이지 ---
/* ===================================================
   산책 매칭 페이지 — 실시간 매칭 중심 UI
   =================================================== */

