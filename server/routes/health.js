/**
 * 건강 분석 라우트 - AI 기반 반려견 건강 분석
 * Gemini API를 사용하여 산책 데이터 기반 건강 분석 제공
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const WALKS_FILE = path.join(__dirname, '..', 'data', 'walks.json');
const HEALTH_FILE = path.join(__dirname, '..', 'data', 'health_profiles.json');

function loadWalks() {
  try {
    if (fs.existsSync(WALKS_FILE)) return JSON.parse(fs.readFileSync(WALKS_FILE, 'utf8'));
  } catch (e) {}
  return [];
}

function loadHealthProfiles() {
  try {
    if (fs.existsSync(HEALTH_FILE)) return JSON.parse(fs.readFileSync(HEALTH_FILE, 'utf8'));
  } catch (e) {}
  return [];
}

function saveHealthProfiles(profiles) {
  const dir = path.dirname(HEALTH_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(HEALTH_FILE, JSON.stringify(profiles, null, 2), 'utf8');
}

// Gemini 설정
const { GoogleGenerativeAI } = require('@google/generative-ai');
function getGemini() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('여기에')) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// 종합 건강 분석 (행동 패턴 + 비만 위험 + 식단 + 예방접종)
router.post('/analyze', async (req, res) => {
  try {
    const { userId, dogInfo } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId 필요' });

    // dogInfo.name 기준으로 산책 데이터 필터링
    let walks = loadWalks().filter(w => w.userId === userId);
    if (dogInfo?.name && !dogInfo?.allDogs) {
      walks = walks.filter(w => w.dogName === dogInfo.name || w.dogId === dogInfo.name);
    }
    const model = getGemini();
    if (!model) return res.status(500).json({ error: 'AI 서비스 미설정' });

    // 업로드된 서류 정보 로드
    let uploadedDocs = [];
    try {
      const metaFile = path.join(__dirname, '..', 'uploads', 'metadata.json');
      if (fs.existsSync(metaFile)) {
        const allDocs = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        uploadedDocs = allDocs.filter(d => d.userId === userId);
        // 특정 반려견 선택 시 해당 반려견 서류만 필터
        if (dogInfo?.name && !dogInfo?.allDogs && dogInfo?.healthDocuments) {
          const dogId = uploadedDocs.length > 0 ? uploadedDocs[0]?.dogId : null;
          if (dogInfo.healthDocuments.length > 0) {
            // 프론트에서 전달된 dogId 기반 필터링
            const frontDogIds = dogInfo.healthDocuments.map(d => d.dogId).filter(Boolean);
            if (frontDogIds.length > 0) {
              uploadedDocs = uploadedDocs.filter(d => frontDogIds.includes(d.dogId));
            }
          }
        }
      }
    } catch(e) {}

    const vaccinationDocs = uploadedDocs.filter(d => d.type === 'vaccination');
    const checkupDocs = uploadedDocs.filter(d => d.type === 'checkup');
    const treatmentDocs = uploadedDocs.filter(d => d.type === 'treatment');
    const surgeryDocs = uploadedDocs.filter(d => d.type === 'surgery');
    const allergyDocs = uploadedDocs.filter(d => d.type === 'allergy');
    const medicationDocs = uploadedDocs.filter(d => d.type === 'medication');
    const diagnosisDocs = uploadedDocs.filter(d => d.type === 'diagnosis');

    // 산책 데이터 요약
    const recentWalks = walks.slice(-30);
    const walkSummary = recentWalks.map(w => ({
      date: w.createdAt?.split('T')[0],
      distance: w.distance,
      duration: w.duration,
      avgPace: w.avgPace,
      calories: w.calories
    }));

    const totalDistance = recentWalks.reduce((s, w) => s + (w.distance || 0), 0);
    const totalDuration = recentWalks.reduce((s, w) => s + (w.duration || 0), 0);
    const avgDaily = recentWalks.length ? totalDistance / Math.min(recentWalks.length, 30) : 0;

    const prompt = `당신은 반려견 건강 전문 AI 수의사입니다. 다음 데이터를 분석하여 JSON 형식으로 응답하세요.

## 반려견 정보
${dogInfo?.allDogs ? dogInfo.allDogs.map((d, i) => `### 반려견 ${i+1}: ${d.name}
- 견종: ${d.breed || '미등록'}
- 나이: ${d.age || '미등록'}
- 체중: ${d.weight || '미등록'}kg
- 크기: ${d.size || '미등록'}
- 성별: ${d.gender === 'male' ? '수컷' : d.gender === 'female' ? '암컷' : '미등록'}
- 중성화: ${d.neutered === true ? '완료' : d.neutered === false ? '미완료' : '미등록'}
- 성향: ${d.personality || '미등록'}
- 건강 특이사항: ${d.healthNote || '없음'}`).join('\n') : `- 이름: ${dogInfo?.name || '미등록'}
- 견종: ${dogInfo?.breed || '미등록'}
- 나이: ${dogInfo?.age || '미등록'}
- 체중: ${dogInfo?.weight || '미등록'}kg
- 크기: ${dogInfo?.size || '미등록'}
- 성별: ${dogInfo?.gender === 'male' ? '수컷' : dogInfo?.gender === 'female' ? '암컷' : '미등록'}
- 중성화: ${dogInfo?.neutered === true ? '완료' : dogInfo?.neutered === false ? '미완료' : '미등록'}
- 성향: ${dogInfo?.personality || '미등록'}
- 건강 특이사항: ${dogInfo?.healthNote || '없음'}`}

## 건강 서류 현황
- 예방접종 증명서: ${vaccinationDocs.length > 0 ? vaccinationDocs.map(d => d.originalName + ' (' + new Date(d.uploadedAt).toLocaleDateString('ko-KR') + ')').join(', ') : '미등록'}
- 건강검진 결과지: ${checkupDocs.length > 0 ? checkupDocs.map(d => d.originalName + ' (' + new Date(d.uploadedAt).toLocaleDateString('ko-KR') + ')').join(', ') : '미등록'}
- 진료 기록 / 처방전: ${treatmentDocs.length > 0 ? treatmentDocs.map(d => d.originalName + ' (' + new Date(d.uploadedAt).toLocaleDateString('ko-KR') + ')').join(', ') : '미등록'}
- 수술 / 시술 기록: ${surgeryDocs.length > 0 ? surgeryDocs.map(d => d.originalName + ' (' + new Date(d.uploadedAt).toLocaleDateString('ko-KR') + ')').join(', ') : '미등록'}
- 알러지 / 질병 진단서: ${allergyDocs.length > 0 ? allergyDocs.map(d => d.originalName + ' (' + new Date(d.uploadedAt).toLocaleDateString('ko-KR') + ')').join(', ') : '미등록'}
- 복용 약 / 투약 기록: ${medicationDocs.length > 0 ? medicationDocs.map(d => d.originalName + ' (' + new Date(d.uploadedAt).toLocaleDateString('ko-KR') + ')').join(', ') : '미등록'}
- 진단서(기타): ${diagnosisDocs.length > 0 ? diagnosisDocs.map(d => d.originalName + ' (' + new Date(d.uploadedAt).toLocaleDateString('ko-KR') + ')').join(', ') : '미등록'}

## 최근 산책 데이터 (최대 30일)
- 총 산책 횟수: ${recentWalks.length}회
- 총 거리: ${totalDistance.toFixed(2)}km
- 총 시간: ${totalDuration}분
- 일평균 거리: ${avgDaily.toFixed(2)}km
- 상세 기록: ${JSON.stringify(walkSummary.slice(-10))}

## 분석 요청
다음 JSON 형식으로 응답하세요 (반드시 JSON만 출력):
{
  "behaviorAnalysis": {
    "pattern": "활동 패턴 설명",
    "consistency": "규칙성 평가 (상/중/하)",
    "recommendation": "행동 패턴 개선 제안"
  },
  "obesityRisk": {
    "level": "위험도 (낮음/보통/높음/매우높음)",
    "score": 0-100 숫자,
    "factors": ["위험 요인들"],
    "recommendation": "비만 예방 제안"
  },
  "dietRecommendation": {
    "dailyCalories": 권장 일일 칼로리(숫자),
    "mealFrequency": "급여 횟수 추천",
    "foods": ["추천 식품들"],
    "avoid": ["피해야 할 식품들"],
    "supplements": ["추천 영양제"]
  },
  "vaccinationSchedule": {
    "upcoming": [{"name": "접종명", "dueDate": "예정일", "importance": "중요도"}],
    "overdue": [{"name": "접종명", "recommendation": "권고사항"}],
    "note": "예방접종 관련 참고사항"
  },
  "overallScore": 0-100 숫자,
  "summary": "종합 건강 평가 요약 (2-3문장)"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSON 파싱
    let analysis;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch (e) {
      analysis = { summary: text, overallScore: 50 };
    }

    // 건강 프로필 저장
    const profiles = loadHealthProfiles();
    const existing = profiles.findIndex(p => p.userId === userId);
    const profile = {
      userId,
      dogInfo,
      lastAnalysis: analysis,
      analyzedAt: new Date().toISOString(),
      walkCount: recentWalks.length,
      totalDistance: totalDistance.toFixed(2)
    };

    if (existing >= 0) profiles[existing] = profile;
    else profiles.push(profile);
    saveHealthProfiles(profiles);

    res.json({ success: true, analysis });
  } catch (e) {
    console.error('[Health] 분석 실패:', e);
    res.status(500).json({ error: 'AI 건강 분석 실패: ' + e.message });
  }
});

// 건강 프로필 조회
router.get('/profile/:userId', (req, res) => {
  const profiles = loadHealthProfiles();
  const profile = profiles.find(p => p.userId === req.params.userId);
  res.json({ success: true, profile: profile || null });
});

module.exports = router;
