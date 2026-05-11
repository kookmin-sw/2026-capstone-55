/**
 * 임베딩 생성 스크립트 (1회 실행용)
 * 실행: node server/scripts/generateEmbeddings.js
 *
 * knowledge.json의 모든 항목에 대해 Gemini text-embedding-004 벡터를 생성하고
 * server/data/knowledge-embeddings.json에 저장합니다.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const KNOWLEDGE_PATH = path.join(__dirname, '../data/knowledge.json');
const OUTPUT_PATH = path.join(__dirname, '../data/knowledge-embeddings.json');
const BATCH_SAVE_INTERVAL = 100; // 100개마다 중간 저장
const DELAY_MS = 80; // API 레이트 리밋 방지 (1500 req/min → 40ms면 충분, 여유 있게 80ms)

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateEmbeddings() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('여기에')) {
    console.error('GEMINI_API_KEY가 .env에 설정되어 있지 않습니다.');
    process.exit(1);
  }

  const knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
  console.log(`총 ${knowledge.length}개 항목에 대한 임베딩 생성 시작...`);
  console.log(`예상 시간: 약 ${Math.ceil(knowledge.length * DELAY_MS / 1000 / 60)}분`);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });

  // 이미 생성된 임베딩이 있으면 이어서 진행
  let embeddings = [];
  const existingIds = new Set();
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      embeddings = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
      embeddings.forEach(e => existingIds.add(e.id));
      console.log(`기존 임베딩 ${embeddings.length}개 발견 → 이어서 진행합니다.`);
    } catch {
      embeddings = [];
    }
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < knowledge.length; i++) {
    const item = knowledge[i];

    // 이미 임베딩이 있으면 스킵
    if (existingIds.has(item.id)) {
      successCount++;
      continue;
    }

    // 임베딩할 텍스트: 제목 + 내용 (검색 품질 최대화)
    const text = `${item.title} ${item.content}`;

    try {
      const result = await model.embedContent(text);
      embeddings.push({
        id: item.id,
        embedding: result.embedding.values
      });
      existingIds.add(item.id);
      successCount++;

      // 진행 상황 출력
      if ((i + 1) % 50 === 0 || i === knowledge.length - 1) {
        const pct = Math.round((i + 1) / knowledge.length * 100);
        console.log(`[${pct}%] ${i + 1}/${knowledge.length} 완료 (오류: ${errorCount}개)`);
      }

      // 중간 저장
      if (successCount % BATCH_SAVE_INTERVAL === 0) {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(embeddings, null, 2), 'utf8');
        console.log(`  → 중간 저장 완료 (${embeddings.length}개)`);
      }

      await sleep(DELAY_MS);
    } catch (e) {
      console.error(`  오류 [${item.id}]: ${e.message}`);
      errorCount++;
      await sleep(500); // 오류 시 더 길게 대기
    }
  }

  // 최종 저장
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(embeddings, null, 2), 'utf8');
  console.log(`\n완료! 총 ${embeddings.length}개 임베딩 저장 → ${OUTPUT_PATH}`);
  if (errorCount > 0) {
    console.log(`오류 발생 항목: ${errorCount}개 (스크립트 재실행 시 자동으로 이어서 진행)`);
  }
}

generateEmbeddings().catch(err => {
  console.error('치명적 오류:', err);
  process.exit(1);
});
