// Pawsitive - Not Found Page
function renderNotFoundPage() {
  renderPage(`
    <div class="not-found">
      <div class="nf-icon">🐾</div>
      <h2>페이지를 찾을 수 없습니다</h2>
      <p>요청하신 페이지가 존재하지 않습니다.</p>
      <button class="btn btn-primary" onclick="Router.navigate('/')">홈으로 돌아가기</button>
    </div>
  `);
}

// ============================================================
// 라우트 등록 및 앱 초기화
// ============================================================

