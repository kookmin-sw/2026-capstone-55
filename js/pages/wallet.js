// Pawsitive - Wallet Page
// Paw coins wallet and transaction history

function renderWalletPage() {
 const user = AuthService.getCurrentUser();

 if (!user) {
 renderPage(`
 <div class="page-header">
 <h1>Paw 지갑</h1>
 <p>활동으로 포인트를 모으고 사용해봐요~</p>
 </div>
 <div class="wallet-balance">
 <div class="balance-label">보유 PAW 포인트</div>
 <div class="balance-amount">0</div>
 <div class="balance-unit">포인트</div>
 </div>
 <div class="page-header" style="margin-top:8px;">
 <h1 style="font-size:1.1rem;">거래 내역</h1>
 </div>
 <div class="card" style="padding:20px;">
 <div class="empty-state">
 <div class="empty-icon"></div>
 <p>거래 내역이 없습니다</p>
 </div>
 </div>
 <div style="margin-top:16px; text-align:center;">
 <button class="btn btn-primary" onclick="showLoginModal('PAW 포인트를 적립하고 사용하려면 로그인이 필요해요!\\n산책, 커뮤니티 활동으로 포인트를 모을 수 있어요.')">${icon("wallet",16)} 포인트 적립 시작하기</button>
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
 <div class="empty-icon"></div>
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
 <div class="tx-amount ${amountClass}">${sign}${tx.amount} P</div>
 </div>
 `;
 }).join('')}
 </div>
 `;
 }

 renderPage(`
 <div class="page-header">
 <h1>Paw 지갑</h1>
 <p>활동으로 포인트를 모으고 사용해봐요~</p>
 </div>
 <div class="wallet-balance">
 <div class="balance-label">보유 PAW 포인트</div>
 <div class="balance-amount">${balance}</div>
 <div class="balance-unit">포인트</div>
 </div>
 <div class="page-header" style="margin-top:8px;">
 <h1 style="font-size:1.1rem;">거래 내역</h1>
 </div>
 ${transactionListHtml}
 `);
}

// --- 전문가 매칭 페이지 ---
