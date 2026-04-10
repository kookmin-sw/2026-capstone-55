/**
 * AI 라우트 - Claude API 연동
 * POST /api/ai/recommend-walker  → 도그워커 궁합 추천 (claude-sonnet-4-6)
 * POST /api/ai/pet-consult       → 반려견 행동 AI 상담 (claude-haiku-4-5, SSE 스트리밍)
 */

const express  = require('express');
const router   = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY가 .env에 설정되지 않았습니다.');
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ── 도그워커 AI 추천 ──────────────────────────────────────────
router.post('/recommend-walker', async (req, res) => {
  try {
    const { dogProfile, walkers } = req.body;

    if (!dogProfile || !walkers || walkers.length === 0) {
      return res.status(400).json({ error: '강아지 정보 또는 도그워커 목록이 필요합니다.' });
    }

    const sizeMap = { small: '소형견(~10kg)', medium: '중형견(10~25kg)', large: '대형견(25kg~)' };
    const expMap  = { '없음': '경력 없음', '1년 미만': '1년 미만', '1-3년': '1~3년', '3년 이상': '3년 이상' };

    const walkerList = walkers.map((w, i) => [
      `[워커 ${i + 1}] 이름: ${w.userName}`,
      `  경력: ${expMap[w.experience] || w.experience || '없음'}`,
      `  특기/자격: ${w.specialty || '없음'}`,
      `  가능 견종 크기: ${(w.acceptedSizes || []).map(s => sizeMap[s] || s).join(', ')}`,
      `  자기소개: ${w.message || '없음'}`,
      `  평점: ${(w.rating || 5).toFixed(1)}점 / 리뷰 ${w.reviewCount || 0}건`,
      `  시간당 요금: ${w.price ? `${Number(w.price).toLocaleString()}원` : '미설정'}`,
      `  활동 지역: ${w.location}`,
      `  가능 시간대: ${w.preferredTime}`,
    ].join('\n')).join('\n\n');

    const prompt = `당신은 반려견 산책 플랫폼의 AI 매칭 전문가입니다.

[반려견 정보]
이름: ${dogProfile.name}
품종: ${dogProfile.breed}
나이: ${dogProfile.age}살
크기: ${sizeMap[dogProfile.size] || dogProfile.size}
${dogProfile.notes ? `특이사항: ${dogProfile.notes}` : ''}

[도그워커 후보]
${walkerList}

위 반려견에게 가장 잘 맞는 도그워커 상위 3명을 분석하세요.

추천 기준:
1. 견종 크기 매칭 (가능 견종 크기에 이 강아지가 포함되는지)
2. 품종 특성(에너지, 훈련 필요성 등)에 맞는 경력/특기
3. 자기소개에서 드러나는 성격과 강아지 궁합
4. 평점과 신뢰도

반드시 아래 JSON 형식으로만 응답 (다른 텍스트 없이):
{
  "recommendations": [
    {
      "walkerName": "도그워커 이름",
      "score": 95,
      "matchReason": "${dogProfile.name}에게 이 도그워커를 추천하는 구체적 이유 (2~3문장)",
      "highlight": "핵심 장점 한 줄"
    }
  ]
}`;

    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 응답 파싱 실패');

    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('[AI] 도그워커 추천 오류:', err.message);
    const msg = err.message.includes('credit balance') ? '💳 API 크레딧 부족 — console.anthropic.com에서 충전해주세요.'
              : err.message.includes('ANTHROPIC_API_KEY') ? 'API 키가 설정되지 않았습니다.'
              : 'AI 추천 중 오류가 발생했습니다.';
    res.status(500).json({ error: msg });
  }
});

// ── 반려견 행동 AI 상담 (SSE 스트리밍) ───────────────────────
router.post('/pet-consult', async (req, res) => {
  try {
    const { messages, dogProfile } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    const sizeMap = { small: '소형견', medium: '중형견', large: '대형견' };
    const dogContext = dogProfile
      ? `\n\n사용자의 반려견 정보:\n- 이름: ${dogProfile.name}\n- 품종: ${dogProfile.breed}\n- 나이: ${dogProfile.age}살\n- 크기: ${sizeMap[dogProfile.size] || dogProfile.size}${dogProfile.notes ? `\n- 특이사항: ${dogProfile.notes}` : ''}`
      : '';

    const systemPrompt = `당신은 반려견 전문 AI 상담사 "포피(Pawpy)"입니다. 친근하고 따뜻하며 전문적인 말투로 반려견 행동·훈련·건강·산책에 관한 질문에 답변하세요.${dogContext}

답변 지침:
- 반려견의 품종과 특성을 고려한 맞춤 답변 제공
- 실용적이고 구체적인 조언 위주로 작성
- 심각한 건강 문제는 반드시 수의사 상담 권유
- 공감하는 따뜻한 말투, 적절한 이모지 사용
- 한국어로 답변`;

    // SSE 헤더
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client = getClient();
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[AI] 반려견 상담 오류:', err.message);
    const msg = err.message.includes('credit balance') ? '💳 API 크레딧 부족 — console.anthropic.com에서 충전해주세요.'
              : err.message.includes('ANTHROPIC_API_KEY') ? 'API 키가 설정되지 않았습니다.'
              : 'AI 상담 중 오류가 발생했습니다.';
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    }
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

module.exports = router;
