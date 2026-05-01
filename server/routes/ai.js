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
 * 동의어 사전 - 일상 표현 ↔ 전문 용어 매핑
 */
const SYNONYM_MAP = {
  // 증상 관련
  '밥': ['식욕', '사료', '급여', '식이', '음식', '먹이'],
  '안먹': ['식욕부진', '식욕감소', '거식', '식욕'],
  '먹어': ['식욕', '급여', '사료'],
  '토하': ['구토', '역류', '위장염'],
  '토해': ['구토', '역류', '위장염'],
  '설사': ['연변', '묽은변', '소화불량', '위장염', '장염'],
  '변비': ['배변곤란', '변이안나'],
  '기침': ['켄넬코프', '기관허탈', '호흡기', '기관지'],
  '콧물': ['비염', '호흡기', '감기'],
  '재채기': ['역재채기', '비염', '알레르기'],
  '절뚝': ['파행', '슬개골', '관절', '골절', '인대'],
  '절어': ['파행', '슬개골', '관절', '골절'],
  '다리를들': ['슬개골', '관절', '인대파열'],
  '긁어': ['가려움', '알레르기', '피부염', '아토피', '벼룩'],
  '긁기': ['가려움', '알레르기', '피부염', '아토피'],
  '가려': ['가려움', '알레르기', '피부염', '아토피', '진드기'],
  '빠져': ['탈모', '털빠짐', '알로페시아', '피부'],
  '털이': ['탈모', '털빠짐', '미용', '브러싱', '그루밍'],
  '피가': ['출혈', '혈변', '혈뇨', '잇몸출혈'],
  '피나': ['출혈', '혈변', '혈뇨'],
  '부어': ['부종', '염증', '알레르기', '종양'],
  '덩어리': ['종양', '혹', '낭종', '지방종', '비만세포종'],
  '혹이': ['종양', '덩어리', '낭종', '지방종'],
  '냄새': ['구취', '치주질환', '귀감염', '피부감염', '항문낭'],
  '입냄새': ['구취', '치주질환', '치석', '잇몸'],
  '눈곱': ['결막염', '눈질환', '안구건조', '눈물'],
  '눈물': ['눈물착색', '유루증', '눈질환', '안구건조'],
  '귀냄새': ['외이염', '귀감염', '귀청소'],
  '머리흔': ['외이염', '귀감염', '귀가려움'],
  '살쪘': ['비만', '과체중', '다이어트', '체중관리'],
  '뚱뚱': ['비만', '과체중', '다이어트'],
  '말랐': ['저체중', '영양부족', '기생충'],
  '떨어': ['무기력', '기력저하', '질병'],
  '기운이없': ['무기력', '기력저하', '질병', '통증'],
  '축처': ['무기력', '기력저하', '우울', '통증'],
  '물많이': ['다음', '다뇨', '당뇨', '신부전', '쿠싱'],
  '오줌많': ['다뇨', '당뇨', '신부전', '방광염'],
  '소변자주': ['빈뇨', '방광염', '요로감염'],
  '피오줌': ['혈뇨', '방광염', '요로결석'],
  '경련': ['발작', '간질', '경기', '중독'],
  '발작': ['간질', '경련', '경기', '뇌질환'],
  '떨림': ['떨림', '저혈당', '공포', '추위', '통증'],
  '코골': ['단두종', '기도', '호흡기', '비만'],
  '숨소리': ['호흡곤란', '기도', '단두종', '심장'],
  // 행동 관련
  '물어': ['입질', '물기', '공격성', '이갈이'],
  '짖어': ['짖음', '경계', '분리불안', '요구성'],
  '짖는': ['짖음', '경계', '분리불안', '요구성'],
  '으르렁': ['공격성', '자원보호', '경고', '공포'],
  '무서워': ['공포', '불안', '사회화', '둔감화'],
  '겁이많': ['공포', '불안', '사회화부족', '둔감화'],
  '도망': ['공포', '탈출', '불안'],
  '안와': ['리콜', '이리와', '복종', '독립적'],
  '말안들': ['복종', '훈련', '고집', '독립적'],
  '뛰어올': ['점프', '뛰어오르기', '흥분', '인사'],
  '올라타': ['마운팅', '흥분', '지배', '스트레스'],
  '파괴': ['파괴행동', '분리불안', '지루함', '에너지과잉'],
  '씹어': ['파괴', '이갈이', '지루함', '분리불안'],
  '부셔': ['파괴행동', '분리불안', '지루함'],
  '실수': ['배변실수', '배변훈련', '마킹', '분리불안'],
  '오줌싸': ['배변실수', '마킹', '배변훈련', '방광염'],
  '대소변': ['배변', '배변훈련', '배변실수'],
  '혼자못': ['분리불안', '독립심', '켄넬훈련'],
  '따라다': ['분리불안', '애착', '독립심'],
  '안자': ['수면문제', '불안', '에너지과잉', '치매'],
  '밤에깨': ['수면문제', '노견', '치매', '인지기능'],
  '산책안': ['산책거부', '공포', '사회화', '통증'],
  '끌어': ['리드줄당김', '산책훈련', '리드줄'],
  '당겨': ['리드줄당김', '산책훈련', '리드줄'],
  '주워먹': ['줍기', '이물질', '안돼훈련', '산책'],
  '먹으려': ['줍기', '이물질', '안돼훈련'],
  // 관리 관련
  '목욕': ['목욕', '샴푸', '그루밍', '미용'],
  '미용': ['미용', '그루밍', '브러싱', '털관리'],
  '발톱': ['발톱깎기', '네일', '그루밍'],
  '양치': ['치아관리', '양치', '치석', '치주질환'],
  '예방접종': ['백신', '접종', '예방접종스케줄'],
  '중성화': ['중성화', '수술', '불임', '거세'],
  '보험': ['반려동물보험', '의료비', '보장'],
};

/**
 * 동의어 확장 검색 - 일상 표현을 전문 용어로 확장
 * 한국어 조사(을/를/이/가/에/도 등) 처리 포함
 */
function expandWithSynonyms(words) {
  const expanded = new Set(words);

  // 한국어 조사/어미 제거 버전도 추가
  const stripped = words.map(w => {
    let s = w;
    // 어미 제거: ~해요, ~어요, ~아요, ~세요, ~네요, ~나요, ~ㄹ까요
    s = s.replace(/(해요|어요|아요|세요|네요|나요|ㄹ까요|할까요|인가요|은가요|던가요)$/g, '');
    // 조사 제거: 을/를/이/가/은/는/에/에서/도/로/의/와/과/만/까지/부터
    s = s.replace(/(을|를|이|가|은|는|에서|에|도|로|의|와|과|만|까지|부터|마저|조차|한테|에게|께서)$/g, '');
    return s;
  });
  stripped.forEach(s => { if (s.length >= 1) expanded.add(s); });

  // 동의어 확장
  const allWords = [...expanded];
  allWords.forEach(word => {
    // 정확한 매칭
    if (SYNONYM_MAP[word]) {
      SYNONYM_MAP[word].forEach(syn => expanded.add(syn));
    }
    // 키가 단어에 포함 (밥을 → 밥 키 매칭)
    Object.entries(SYNONYM_MAP).forEach(([key, syns]) => {
      if (key.length >= 2 && word.length >= 2) {
        if (word.includes(key) || key.includes(word)) {
          syns.forEach(syn => expanded.add(syn));
        }
      }
    });
  });
  return [...expanded];
}

/**
 * 개선된 RAG 검색 - 동의어 확장 + 카테고리 가중치
 */
function searchKnowledge(query, maxResults = 5) {
  if (knowledgeBase.length === 0) return [];

  const rawWords = query.toLowerCase().replace(/[?!.,~\-()]/g, '').split(/\s+/).filter(w => w.length >= 2);
  const expandedWords = expandWithSynonyms(rawWords);

  const scored = knowledgeBase.map(item => {
    const text = (item.title + ' ' + item.content + ' ' + item.category).toLowerCase();
    let score = 0;

    // 원본 키워드 매칭 (가중치 2)
    rawWords.forEach(word => {
      if (text.includes(word)) score += 2;
    });

    // 동의어 매칭 (가중치 1)
    expandedWords.forEach(word => {
      if (!rawWords.includes(word) && text.includes(word)) score += 1;
    });

    // 제목 매칭 보너스 (가중치 3)
    const titleText = item.title.toLowerCase();
    rawWords.forEach(word => {
      if (titleText.includes(word)) score += 3;
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
async function consultWithClaude(message, history, systemPrompt) {
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
    system: systemPrompt || SYSTEM_PROMPTS.consult,
    messages: [{ role: 'user', content: userContent }]
  });
  return response.content[0].text;
}

// ===== Gemini: 통합 AI 상담 (모드별 프롬프트 + RAG) =====
router.post('/consult', async (req, res) => {
  const { message, history, mode, aiName } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: '메시지를 입력해주세요.' });
  }

  // 모드에 따라 시스템 프롬프트 선택 + AI 이름 반영
  let systemPrompt = (mode === 'health') ? SYSTEM_PROMPTS.symptom : SYSTEM_PROMPTS.consult;
  if (aiName) {
    systemPrompt = `당신의 이름은 "${aiName}"입니다. 사용자가 설정한 이름이니 자연스럽게 사용하세요.\n\n` + systemPrompt;
  }

  // 1차: Gemini 시도
  const model = getGeminiModel();
  if (model) {
    try {
      let prompt = systemPrompt + '\n\n';

      // RAG: 모드에 따라 검색 범위 조정
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
    }
  }

  // 2차: Claude 폴백
  try {
    console.log('[AI 상담] Claude 폴백 시도...');
    const reply = await consultWithClaude(message, history, systemPrompt);
    if (reply) {
      return res.json({ success: true, reply });
    }
    return res.status(503).json({ success: false, error: 'AI 서비스가 일시적으로 불안정해요. 잠시 후 다시 시도해주세요~' });
  } catch (e2) {
    console.error('[AI 상담] Claude 폴백도 실패:', e2.message?.substring(0, 100));
    if (e2.message && e2.message.includes('credit balance')) {
      return res.status(503).json({ success: false, error: 'AI 크레딧이 부족해요. 관리자에게 문의해주세요.' });
    }
    return res.status(500).json({ success: false, error: 'AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요~' });
  }
});

// ===== 이미지 포함 AI 상담 =====
router.post('/consult-with-image', async (req, res) => {
  const { message, imageBase64, mimeType, history, mode, aiName } = req.body;
  if (!message && !imageBase64) {
    return res.status(400).json({ success: false, error: '메시지 또는 이미지를 입력해주세요.' });
  }

  let systemPrompt = (mode === 'health') ? SYSTEM_PROMPTS.symptom : SYSTEM_PROMPTS.consult;
  if (aiName) {
    systemPrompt = `당신의 이름은 "${aiName}"입니다. 사용자가 설정한 이름이니 자연스럽게 사용하세요.\n\n` + systemPrompt;
  }

  // Gemini 멀티모달 시도
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('여기에')) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // 프롬프트 구성
      let textPrompt = systemPrompt + '\n\n';

      const ragResults = searchKnowledge(message || '');
      if (ragResults.length > 0) {
        textPrompt += '[참고 자료]\n';
        ragResults.forEach(r => { textPrompt += `- ${r.title}: ${r.content}\n`; });
        textPrompt += '\n';
      }

      if (history && history.length > 0) {
        textPrompt += '[이전 대화]\n';
        history.slice(-6).forEach(h => {
          textPrompt += `${h.role === 'user' ? '사용자' : 'AI'}: ${h.text}\n`;
        });
        textPrompt += '\n';
      }

      textPrompt += `사용자: ${message || '이 이미지를 분석해주세요.'}`;
      if (imageBase64) {
        textPrompt += '\n\n[사용자가 첨부한 이미지를 함께 분석해주세요. 이미지에 보이는 반려견의 상태, 증상, 행동 등을 관찰하여 답변에 반영해주세요.]';
      }

      // 멀티모달 요청 구성
      const parts = [{ text: textPrompt }];
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64
          }
        });
      }

      const result = await model.generateContent(parts);
      const response = result.response.text();
      return res.json({ success: true, reply: response });
    } catch (e) {
      console.error('[AI 이미지] Gemini 실패:', e.message?.substring(0, 100));
    }
  }

  // Claude 폴백 (이미지 포함)
  try {
    const client = getClaudeClient();
    if (!client) {
      return res.status(503).json({ success: false, error: 'AI 서비스를 사용할 수 없습니다.' });
    }

    const content = [];
    if (imageBase64) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: imageBase64 }
      });
    }
    content.push({ type: 'text', text: message || '이 이미지를 분석해주세요.' });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content }]
    });
    return res.json({ success: true, reply: response.content[0].text });
  } catch (e2) {
    console.error('[AI 이미지] Claude 폴백도 실패:', e2.message?.substring(0, 100));
    return res.status(500).json({ success: false, error: 'AI 이미지 분석에 실패했어요. 잠시 후 다시 시도해주세요.' });
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

// ===== AI 맞춤 품종 추천 =====
router.post('/recommend-breed', async (req, res) => {
  try {
    const { preferences, count } = req.body;
    if (!preferences) {
      return res.status(400).json({ success: false, error: '선호 조건을 입력해주세요.' });
    }

    const recommendCount = Math.max(parseInt(count) || 3, 1);

    // breeds.js 데이터 로드
    let breedsData = [];
    try {
      const breedsPath = path.join(__dirname, '..', '..', 'js', 'data', 'breeds.js');
      const breedsContent = fs.readFileSync(breedsPath, 'utf8');
      // BREEDS_DATA 배열 추출
      const match = breedsContent.match(/const\s+BREEDS_DATA\s*=\s*(\[[\s\S]*\]);?\s*$/m);
      if (match) {
        breedsData = JSON.parse(match[1]);
      }
    } catch (e) {
      console.error('[품종추천] breeds.js 로드 실패:', e.message);
    }

    if (breedsData.length === 0) {
      return res.status(500).json({ success: false, error: '품종 데이터를 불러올 수 없습니다.' });
    }

    // 1단계: 사용자 조건으로 후보 필터링
    let candidates = [...breedsData];
    const p = preferences;

    if (p.size && p.size !== 'any') {
      candidates = candidates.filter(b => b.size === p.size);
    }
    if (p.exerciseLevel && p.exerciseLevel !== 'any') {
      candidates = candidates.filter(b => b.exerciseLevel === p.exerciseLevel);
    }
    if (p.groomingLevel && p.groomingLevel !== 'any') {
      candidates = candidates.filter(b => b.groomingLevel === p.groomingLevel);
    }
    if (p.childFriendly === true) {
      candidates = candidates.filter(b => b.childFriendly === true);
    }
    if (p.apartmentFriendly === true) {
      candidates = candidates.filter(b => b.apartmentFriendly === true);
    }
    if (p.trainability && p.trainability !== 'any') {
      candidates = candidates.filter(b => b.trainability === p.trainability);
    }
    if (p.barkingLevel && p.barkingLevel !== 'any') {
      candidates = candidates.filter(b => b.barkingLevel === p.barkingLevel);
    }

    // 필터 결과가 너무 적으면 조건 완화 (크기만 유지)
    if (candidates.length < recommendCount) {
      candidates = [...breedsData];
      if (p.size && p.size !== 'any') {
        candidates = candidates.filter(b => b.size === p.size);
      }
    }

    // === 데이터 기반 매칭 점수 계산 ===
    function calcMatchScore(breed) {
      let score = 0;
      let maxScore = 0;

      // 크기 매칭 (25점)
      if (p.size && p.size !== 'any') {
        maxScore += 25;
        if (breed.size === p.size) score += 25;
      }
      // 운동량 매칭 (20점)
      if (p.exerciseLevel && p.exerciseLevel !== 'any') {
        maxScore += 20;
        if (breed.exerciseLevel === p.exerciseLevel) score += 20;
        else if (Math.abs(['low','medium','high'].indexOf(breed.exerciseLevel) - ['low','medium','high'].indexOf(p.exerciseLevel)) === 1) score += 10;
      }
      // 미용 관리 매칭 (10점)
      if (p.groomingLevel && p.groomingLevel !== 'any') {
        maxScore += 10;
        const bg = breed.groomingLevel || 'medium';
        if (bg === p.groomingLevel) score += 10;
        else if (Math.abs(['low','medium','high'].indexOf(bg) - ['low','medium','high'].indexOf(p.groomingLevel)) === 1) score += 5;
      }
      // 훈련 용이성 매칭 (15점)
      if (p.trainability && p.trainability !== 'any') {
        maxScore += 15;
        const bt = breed.trainability || 'medium';
        if (bt === p.trainability) score += 15;
        else if (Math.abs(['low','medium','high'].indexOf(bt) - ['low','medium','high'].indexOf(p.trainability)) === 1) score += 7;
      }
      // 짖음 매칭 (10점)
      if (p.barkingLevel && p.barkingLevel !== 'any') {
        maxScore += 10;
        const bb = breed.barkingLevel || 'medium';
        if (bb === p.barkingLevel) score += 10;
        else if (Math.abs(['low','medium','high'].indexOf(bb) - ['low','medium','high'].indexOf(p.barkingLevel)) === 1) score += 5;
      }
      // 아이 친화 (10점)
      if (p.childFriendly) {
        maxScore += 10;
        if (breed.childFriendly) score += 10;
      }
      // 아파트 적합 (10점)
      if (p.apartmentFriendly) {
        maxScore += 10;
        if (breed.apartmentFriendly) score += 10;
      }

      // 조건을 아무것도 선택 안 했으면 기본 50점
      if (maxScore === 0) return 50;
      return Math.round((score / maxScore) * 100);
    }

    // 점수 계산 후 정렬
    candidates = candidates.map(b => ({ ...b, _matchScore: calcMatchScore(b) }));
    candidates.sort((a, b) => b._matchScore - a._matchScore);

    // 점수 순으로 정렬 후 상위 후보를 AI에게 전달 (추천 수의 3배, 최소 30)
    const candidateLimit = Math.max(recommendCount * 3, 30);
    const candidateSummaries = candidates.slice(0, candidateLimit).map(b => ({
      id: b.id,
      name: b.name,
      nameEn: b.nameEn,
      size: b.size,
      group: b.group || '',
      personality: b.personality,
      exerciseLevel: b.exerciseLevel,
      groomingLevel: b.groomingLevel || 'medium',
      trainability: b.trainability || 'medium',
      barkingLevel: b.barkingLevel || 'medium',
      childFriendly: b.childFriendly,
      apartmentFriendly: b.apartmentFriendly,
      lifespan: b.lifespan || '',
      weight: b.weight || '',
      dataMatchScore: b._matchScore
    }));

    // 사용자 자유 입력 텍스트
    const freeText = p.freeText || '';

    const prompt = `당신은 반려견 품종 전문 상담사입니다.
사용자의 생활 환경과 선호도를 분석하여 가장 적합한 반려견 품종을 추천해주세요.

[사용자 조건]
- 선호 크기: ${p.size === 'any' ? '상관없음' : p.size === 'small' ? '소형' : p.size === 'medium' ? '중형' : '대형'}
- 운동량: ${p.exerciseLevel === 'any' ? '상관없음' : p.exerciseLevel === 'low' ? '적음' : p.exerciseLevel === 'medium' ? '보통' : '많음'}
- 미용 관리: ${p.groomingLevel === 'any' ? '상관없음' : p.groomingLevel === 'low' ? '적음' : p.groomingLevel === 'medium' ? '보통' : '많음'}
- 훈련 용이성: ${p.trainability === 'any' ? '상관없음' : p.trainability === 'low' ? '낮음' : p.trainability === 'medium' ? '보통' : '높음'}
- 짖음 정도: ${p.barkingLevel === 'any' ? '상관없음' : p.barkingLevel === 'low' ? '적음' : p.barkingLevel === 'medium' ? '보통' : '많음'}
- 아이 친화: ${p.childFriendly ? '필요' : '상관없음'}
- 아파트 적합: ${p.apartmentFriendly ? '필요' : '상관없음'}
${freeText ? `- 추가 요청: ${freeText}` : ''}

[추천 마릿수]: ${recommendCount}마리

[후보 품종 목록]
${JSON.stringify(candidateSummaries, null, 0)}

위 후보 중에서 사용자 조건에 가장 적합한 ${recommendCount}마리를 선택하여 추천해주세요.
각 품종의 dataMatchScore는 사용자 조건과의 데이터 기반 매칭 점수(100점 만점)입니다.
이 점수를 참고하되, 성격/생활패턴 적합성도 종합적으로 고려하여 matchScore를 산출해주세요.
matchScore는 dataMatchScore를 기반으로 하되, 성격 적합성을 반영하여 ±10점 범위에서 조정 가능합니다.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "recommendations": [
    {
      "id": "품종 ID",
      "name": "품종 한글명",
      "nameEn": "품종 영문명",
      "matchScore": 95,
      "reason": "이 품종을 추천하는 이유 (2~3문장, 사용자 조건과 연결하여 설명)",
      "pros": ["장점1", "장점2", "장점3"],
      "cons": ["주의점1", "주의점2"],
      "tip": "이 품종을 키울 때 한 가지 꿀팁"
    }
  ],
  "summary": "전체 추천 요약 (1~2문장)"
}`;

    // Gemini로 추천 생성
    const model = getGeminiModel();
    let aiReply = null;

    if (model) {
      try {
        const result = await model.generateContent(prompt);
        aiReply = result.response?.text?.() || result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (e) {
        console.log('[품종추천] Gemini 실패:', e.message);
      }
    }

    // Gemini 실패 시 Claude 폴백
    if (!aiReply) {
      const client = getClaudeClient();
      if (client) {
        try {
          const claudeRes = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          });
          aiReply = claudeRes.content?.[0]?.text;
        } catch (e) {
          console.log('[품종추천] Claude 폴백도 실패:', e.message);
        }
      }
    }

    if (!aiReply) {
      return res.status(500).json({ success: false, error: 'AI 서비스에 일시적으로 연결할 수 없습니다.' });
    }

    // JSON 파싱
    try {
      // ```json ... ``` 블록 제거
      let cleaned = aiReply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.json({ success: true, ...parsed, totalCandidates: candidates.length });
    } catch (e) {
      console.log('[품종추천] JSON 파싱 실패, 원본 반환');
      return res.json({ success: true, rawReply: aiReply, totalCandidates: candidates.length });
    }

  } catch (err) {
    console.error('[품종추천] 오류:', err);
    res.status(500).json({ success: false, error: '품종 추천 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
