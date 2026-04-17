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

  // 단일 모델 호출 + 503/429 재시도 (최대 3회, 간격 2초)
  async function callWithRetry(modelName, prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        return await model.generateContent(prompt);
      } catch (e) {
        const msg = e.message || '';
        const isRetryable = msg.includes('503') || msg.includes('429') || msg.includes('overloaded');
        console.log(`[AI] ${modelName} 시도 ${attempt}/${maxRetries} 실패:`, msg.substring(0, 100));
        if (isRetryable && attempt < maxRetries) {
          const delay = attempt * 2000; // 2초, 4초
          console.log(`[AI] ${delay}ms 후 재시도...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw e;
        }
      }
    }
  }

  return {
    async generateContent(prompt) {
      // gemini-2.5-flash를 재시도 포함하여 호출
      try {
        return await callWithRetry('gemini-2.5-flash', prompt, 3);
      } catch (e) {
        console.log('[AI] gemini-2.5-flash 최종 실패, 폴백 시도...');
        // 폴백 모델들 시도
        const fallbacks = ['gemini-2.5-flash-preview-05-20', 'gemini-2.0-flash'];
        for (const name of fallbacks) {
          try {
            return await callWithRetry(name, prompt, 2);
          } catch (e2) {
            console.log(`[AI] ${name} 폴백도 실패`);
          }
        }
        throw e;
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

// ===== Gemini: 증상 분석 (Gemini 실패 시 Claude 폴백) =====
router.post('/symptom', async (req, res) => {
  const { symptoms, breed, age } = req.body;
  if (!symptoms) {
    return res.status(400).json({ success: false, error: '증상을 입력해주세요.' });
  }

  const ragResults = searchKnowledge(symptoms + ' ' + (breed || ''));
  let ragContext = '';
  if (ragResults.length > 0) {
    ragContext = '\n\n[참고 자료]\n' + ragResults.map(r => `- ${r.title}: ${r.content}`).join('\n');
  }
  const fullPrompt = `${SYSTEM_PROMPTS.symptom}\n\n[반려견 정보]\n품종: ${breed || '미상'}\n나이: ${age || '미상'}\n\n[증상]\n${symptoms}${ragContext}`;

  // 1차: Gemini
  const model = getGeminiModel();
  if (model) {
    try {
      const result = await model.generateContent(fullPrompt);
      const response = result.response.text();
      return res.json({ success: true, analysis: response });
    } catch (e) {
      console.error('[AI 증상] Gemini 실패:', e.message?.substring(0, 100));
    }
  }

  // 2차: Claude 폴백
  try {
    console.log('[AI 증상] Claude 폴백 시도...');
    const client = getClaudeClient();
    if (!client) {
      return res.status(503).json({ success: false, error: 'AI 서비스가 일시적으로 불안정해요.' });
    }
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPTS.symptom,
      messages: [{ role: 'user', content: `[반려견 정보]\n품종: ${breed || '미상'}\n나이: ${age || '미상'}\n\n[증상]\n${symptoms}${ragContext}` }]
    });
    return res.json({ success: true, analysis: response.content[0].text });
  } catch (e2) {
    console.error('[AI 증상] Claude 폴백도 실패:', e2.message?.substring(0, 100));
    return res.status(500).json({ success: false, error: 'AI 분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요~' });
  }
});

// ===== Claude 폴백 상담 함수 =====
async function consultWithClaude(message, history) {
  const client = getClaudeClient();
  if (!client) return null;

  let userContent = '';
  if (history && history.length > 0) {
    userContent += '[이전 대화]\n';
    history.slice(-6).forEach(h => {
      userContent += `${h.role === 'user' ? '사용자' : 'AI'}: ${h.text}\n`;
    });
    userContent += '\n';
  }
  userContent += message;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPTS.consult,
    messages: [{ role: 'user', content: userContent }]
  });
  return response.content[0].text;
}

// ===== Gemini: AI 상담 (Gemini 실패 시 Claude 폴백) =====
router.post('/consult', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: '메시지를 입력해주세요.' });
  }

  // 1차: Gemini 시도
  const model = getGeminiModel();
  if (model) {
    try {
      let prompt = SYSTEM_PROMPTS.consult + '\n\n';

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
      return res.json({ success: true, reply: response });
    } catch (e) {
      console.error('[AI 상담] Gemini 실패:', e.message?.substring(0, 100));
      // Gemini 실패 → Claude 폴백으로 진행
    }
  }

  // 2차: Claude 폴백
  try {
    console.log('[AI 상담] Claude 폴백 시도...');
    const reply = await consultWithClaude(message, history);
    if (reply) {
      return res.json({ success: true, reply });
    }
    // Claude도 없으면 에러
    return res.status(503).json({ success: false, error: 'AI 서비스가 일시적으로 불안정해요. 잠시 후 다시 시도해주세요~' });
  } catch (e2) {
    console.error('[AI 상담] Claude 폴백도 실패:', e2.message?.substring(0, 100));
    if (e2.message && e2.message.includes('credit balance')) {
      return res.status(503).json({ success: false, error: 'AI 크레딧이 부족해요. 관리자에게 문의해주세요.' });
    }
    return res.status(500).json({ success: false, error: 'AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요~' });
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
