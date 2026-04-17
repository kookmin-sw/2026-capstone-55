/**
 * HealthAnalysisService - AI 기반 반려견 건강 분석 서비스
 * 산책 데이터를 기반으로 행동 패턴, 비만 위험, 식단, 예방접종 분석
 */
const HealthAnalysisService = (() => {

  // AI 건강 분석 요청
  async function analyzeHealth(userId, dogInfo) {
    try {
      const resp = await fetch('/api/health/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, dogInfo })
      });
      const data = await resp.json();
      if (data.success) {
        // 로컬 캐시
        StorageService.set(`healthAnalysis_${userId}`, {
          analysis: data.analysis,
          analyzedAt: new Date().toISOString()
        });
        return data.analysis;
      }
      throw new Error(data.error || '분석 실패');
    } catch (e) {
      console.error('[Health] 분석 요청 실패:', e);
      throw e;
    }
  }

  // 캐시된 분석 결과 조회
  function getCachedAnalysis(userId) {
    return StorageService.get(`healthAnalysis_${userId}`, null);
  }

  // 건강 프로필 조회
  async function getHealthProfile(userId) {
    try {
      const resp = await fetch(`/api/health/profile/${userId}`);
      const data = await resp.json();
      return data.success ? data.profile : null;
    } catch (e) {
      return null;
    }
  }

  // 활동 점수 계산 (로컬)
  function calcActivityScore(stats) {
    if (!stats) return 0;
    const { weekly } = stats;
    if (!weekly || weekly.count === 0) return 0;

    let score = 0;
    score += Math.min(weekly.count / 7 * 40, 40);           // 매일 산책 = 40점
    score += Math.min(weekly.totalDistance / 14 * 30, 30);   // 주 14km = 30점
    score += Math.min(weekly.avgDuration / 30 * 30, 30);    // 평균 30분 = 30점
    return Math.round(score);
  }

  return {
    analyzeHealth,
    getCachedAnalysis,
    getHealthProfile,
    calcActivityScore
  };
})();
