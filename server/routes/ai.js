/**
 * AI 라우트 - Gemini + Claude API 연동
 * Gemini: 반려견 질병 분석, AI 상담
 * Claude: 도그워커 궁합 추천, 반려견 행동 AI 상담 (SSE 스트리밍)
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// ===== RAG: 지식 데이터 로드 =====
let knowledgeBase = [];
try {
  const dataPath = path.join(__dirname, '..', 'data', 'knowledge.json');
  knowledgeBase = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`[RAG] 지식 데이터 ${knowledgeBase.length}개 로드 완료`);
} catch (e) {
  console.warn('[RAG] 지식 데이터 로드 실패:', e.message);
}

/**
 * 간단한 키워드 기반 관련 지식 검색
 */
function searchKnowledge(query, maxResults = 3) {
  if (knowledgeBase.length === 0) return [];

  const queryWords = query.toLowerCase().replace(/[?!.,]/g, '').split(/\s+/);

  const scored = knowledgeBase.map(item => {
    const text = (item.title + ' ' + item.content + ' ' + item.category).toLowerCase();
    let score = 0;
    queryWords.forEach(word => {
      if (word.length >= 2 && text.includes(word)) score++;
    });
    return { ...item, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ===== Gemini 설정 =====
const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiModel() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('여기에')) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return {
    async generateContent(prompt) {
      // 먼저 gemini-2.5-flash 시도, 실패하면 gemini-2.0-flash-lite로 폴백
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        return await model.generateContent(prompt);
      } catch (e) {
        console.log('[AI] gemini-2.5-flash 실패, gemini-2.5-flash-lite로 시도...');
        const fallback = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        return await fallback.generateContent(prompt);
      }
    }
  };
}

// ===== Claude 설정 =====
let Anthropic;
try { Anthropic = require('@anthropic-ai/sdk'); } catch(e) { Anthropic = null; }

function getClaudeClient() {
  if (!Anthropic || !process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ===== Gemini 시스템 프롬프트 =====
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

// ===== Gemini: 증상 분석 =====
router.post('/symptom', async (req, res) => {
  const model = getGeminiModel();
  if (!model) {
    return res.status(503).json({ success: false, error: 'AI가 아직 설정되지 않았습니다.' });
  }

  const { symptoms, breed, age } = req.body;
  if (!symptoms) {
    return res.status(400).json({ success: false, error: '증상을 입력해주세요.' });
  }

  try {
    const ragResults = searchKnowledge(symptoms + ' ' + (breed || ''));
    let ragContext = '';
    if (ragResults.length > 0) {
      ragContext = '\n\n[참고 자료]\n' + ragResults.map(r => `- ${r.title}: ${r.content}`).join('\n');
    }

    const prompt = `${SYSTEM_PROMPTS.symptom}\n\n[반려견 정보]\n품종: ${breed || '미상'}\n나이: ${age || '미상'}\n\n[증상]\n${symptoms}${ragContext}`;
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    res.json({ success: true, analysis: response });
  } catch (e) {
    console.error('[AI 증상 분석 오류]', e.message);
    if (e.message && e.message.includes('429')) {
      res.status(429).json({ success: false, error: '요청이 너무 빨라요. 잠시 후 다시 시도해주세요~' });
    } else {
      res.status(500).json({ success: false, error: 'AI 분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요~' });
    }
  }
});

// ===== Gemini: AI 상담 =====
router.post('/consult', async (req, res) => {
  const model = getGeminiModel();
  if (!model) {
    return res.status(503).json({ success: false, error: 'AI가 아직 설정되지 않았습니다.' });
  }

  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: '메시지를 입력해주세요.' });
  }

  try {
    let prompt = SYSTEM_PROMPTS.consult + '\n\n';

    // RAG: 관련 지식 검색
    const ragResults = searchKnowledge(message);
    if (ragResults.length > 0) {
      prompt += '[참고 자료 - 이 내용을 바탕으로 답변해주세요]\n';
      ragResults.forEach(r => { prompt += `- ${r.title}: ${r.content}\n`; });
      prompt += '\n';
    }

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
      res.status(429).json({ success: false, error: '요청이 너무 빨라요. 잠시 후 다시 시도해주세요~' });
    } else {
      res.status(500).json({ success: false, error: 'AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요~' });
    }
  }
});

// ===== Claude: 도그워커 AI 추천 =====
router.post('/recommend-walker', async (req, res) => {
  try {
    const client = getClaudeClient();
    if (!client) {
      return res.status(503).json({ error: 'Claude AI가 설정되지 않았습니다.' });
    }

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

반드시 아래 JSON 형식으로만 응답:
{
  "recommendations": [
    {
      "walkerName": "도그워커 이름",
      "score": 95,
      "matchReason": "추천 이유 2~3문장",
      "highlight": "핵심 장점 한 줄"
    }
  ]
}`;

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
    const msg = err.message.includes('credit balance') ? 'API 크레딧 부족'
              : err.message.includes('ANTHROPIC_API_KEY') ? 'API 키가 설정되지 않았습니다.'
              : 'AI 추천 중 오류가 발생했습니다.';
    res.status(500).json({ error: msg });
  }
});

// ===== Claude: 반려견 행동 AI 상담 (SSE 스트리밍) =====
router.post('/pet-consult', async (req, res) => {
  try {
    const client = getClaudeClient();
    if (!client) {
      return res.status(503).json({ error: 'Claude AI가 설정되지 않았습니다.' });
    }

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

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

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
    const msg = err.message.includes('credit balance') ? 'API 크레딧 부족'
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
