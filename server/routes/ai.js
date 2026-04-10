/**
 * AI 라우트 - Gemini API 연동
 * 반려견 질병 분석, AI 상담
 */

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Gemini 초기화
function getModel() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('여기에')) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// 시스템 프롬프트
const SYSTEM_PROMPTS = {
  symptom: `당신은 반려견 건강 전문 AI 수의사입니다. 
사용자가 반려견의 증상을 설명하면:
1. 가능한 질병/원인을 2~3가지 분석해주세요
2. 각 질병의 심각도를 (낮음/보통/높음)으로 표시해주세요
3. 응급 조치 방법을 알려주세요
4. 병원 방문이 필요한지 판단해주세요
항상 친절하고 이해하기 쉬운 한국어로 답변하세요.
마지막에 "⚠️ AI 분석 결과는 참고용이며, 정확한 진단은 수의사와 상담해주세요."를 꼭 포함하세요.`,

  consult: `당신은 반려견 행동 전문 훈련사 AI입니다.
사용자가 반려견의 문제 행동이나 고민을 이야기하면:
1. 문제의 원인을 분석해주세요
2. 구체적인 훈련 방법을 단계별로 알려주세요
3. 주의사항도 함께 알려주세요
항상 따뜻하고 공감하는 톤으로 한국어로 답변하세요. 이모지를 적절히 사용해주세요.`
};

/**
 * POST /api/ai/symptom - 증상 분석
 */
router.post('/symptom', async (req, res) => {
  const model = getModel();
  if (!model) {
    return res.status(503).json({ success: false, error: 'AI가 아직 설정되지 않았습니다.' });
  }

  const { symptoms, breed, age } = req.body;
  if (!symptoms) {
    return res.status(400).json({ success: false, error: '증상을 입력해주세요.' });
  }

  try {
    const prompt = `${SYSTEM_PROMPTS.symptom}\n\n[반려견 정보]\n품종: ${breed || '미상'}\n나이: ${age || '미상'}\n\n[증상]\n${symptoms}`;
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ success: true, analysis: response });
  } catch (e) {
    console.error('[AI 증상 분석 오류]', e.message);
    if (e.message && e.message.includes('429')) {
      res.status(429).json({ success: false, error: '요청이 너무 빨라요. 잠시 후 다시 시도해주세요~ (무료 티어 분당 제한)' });
    } else {
      res.status(500).json({ success: false, error: 'AI 분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요~' });
    }
  }
});

/**
 * POST /api/ai/consult - AI 상담
 */
router.post('/consult', async (req, res) => {
  const model = getModel();
  if (!model) {
    return res.status(503).json({ success: false, error: 'AI가 아직 설정되지 않았습니다.' });
  }

  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: '메시지를 입력해주세요.' });
  }

  try {
    let prompt = SYSTEM_PROMPTS.consult + '\n\n';
    // 이전 대화 내역 포함
    if (history && history.length > 0) {
      prompt += '[이전 대화]\n';
      history.slice(-6).forEach(h => {
        prompt += `${h.role === 'user' ? '사용자' : 'AI'}: ${h.text}\n`;
      });
      prompt += '\n';
    }
    prompt += `사용자: ${message}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ success: true, reply: response });

  } catch (e) {
    console.error('[AI 상담 오류]', e.message);
    if (e.message && e.message.includes('429')) {
      res.status(429).json({ success: false, error: '요청이 너무 빨라요. 잠시 후 다시 시도해주세요~ (무료 티어 분당 제한)' });
    } else {
      res.status(500).json({ success: false, error: 'AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요~' });
    }
  }
});

module.exports = router;
