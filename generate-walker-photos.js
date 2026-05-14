/**
 * DALL-E 3로 한국인 도우미 프로필 사진 생성
 *
 * 사용법:
 *   node generate-walker-photos.js sk-xxxxxxxx
 *
 * 결과:
 *   - images/walkers/ 폴더에 실사 사진 저장
 *   - server/data/walkers.json profilePhoto 경로 자동 업데이트
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.argv[2];

if (!OPENAI_API_KEY || !OPENAI_API_KEY.startsWith('sk-')) {
  console.error('❌  OpenAI API 키를 인수로 전달해주세요.');
  console.error('    사용법: node generate-walker-photos.js sk-xxxxxxxx');
  process.exit(1);
}

// 생성할 더미 도우미 정보
const WALKERS = [
  { id: 'dummy-walker-001', name: '김지은', gender: 'female', age: 'late 20s'    },
  { id: 'dummy-walker-002', name: '박서준', gender: 'male',   age: 'mid 30s'     },
  { id: 'dummy-walker-003', name: '이하은', gender: 'female', age: 'mid 20s'     },
  { id: 'dummy-walker-004', name: '최민준', gender: 'male',   age: 'early 30s'   },
  { id: 'dummy-walker-005', name: '정유진', gender: 'female', age: 'late 20s'    },
  { id: 'dummy-walker-006', name: '한승우', gender: 'male',   age: 'late 30s'    },
  { id: 'dummy-walker-007', name: '윤아린', gender: 'female', age: 'early 20s'   },
];

// DALL-E 3 프롬프트 생성
function buildPrompt(walker) {
  const gender = walker.gender === 'female' ? 'Korean woman' : 'Korean man';
  return (
    `A professional close-up portrait headshot of a ${gender} in their ${walker.age}. ` +
    `East Asian features, natural friendly smile, clean plain light gray or white background, ` +
    `realistic photograph, soft studio lighting, sharp focus on face, no text, no watermark. ` +
    `High quality professional headshot photography.`
  );
}

// OpenAI 이미지 생성 API 호출
async function generateImage(walker) {
  const body = JSON.stringify({
    model:   'gpt-image-1',
    prompt:  buildPrompt(walker),
    n:       1,
    size:    '1024x1024',
    quality: 'medium',
  });


  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path:     '/v1/images/generations',
      method:   'POST',
      headers:  {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (res.statusCode !== 200) {
            reject(new Error(`API 오류 ${res.statusCode}: ${json.error?.message || raw}`));
          } else {
            const item = json.data[0];
            // gpt-image-1은 b64_json, dall-e-3은 url
            resolve(item.b64_json ? { type: 'base64', data: item.b64_json } : { type: 'url', data: item.url });
          }
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// 이미지 URL → 파일로 다운로드
function downloadImage(imageUrl, destPath) {
  return new Promise((resolve, reject) => {
    const proto = imageUrl.startsWith('https') ? https : http;
    const file  = fs.createWriteStream(destPath);
    proto.get(imageUrl, res => {
      // openai는 301/302 리다이렉트 없음, 직접 연결됨
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// 메인
async function main() {
  const outDir      = path.join(__dirname, 'images', 'walkers');
  const walkersPath = path.join(__dirname, 'server', 'data', 'walkers.json');

  // 출력 디렉터리 생성
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
    console.log('📁  images/walkers/ 폴더 생성');
  }

  // 현재 walkers.json 읽기
  let walkersData = [];
  try {
    let raw = fs.readFileSync(walkersPath, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    walkersData = JSON.parse(raw);
  } catch(e) {
    console.error('⚠️  walkers.json 읽기 실패:', e.message);
  }

  let success = 0;
  let failed  = 0;

  for (const walker of WALKERS) {
    const filename = `${walker.id}.png`;
    const destPath = path.join(outDir, filename);
    const webPath  = `/images/walkers/${filename}`;

    console.log(`\n[${WALKERS.indexOf(walker)+1}/${WALKERS.length}] ${walker.name} (${walker.gender}, ${walker.age}) 생성 중...`);

    try {
      // 이미 존재하면 스킵
      if (fs.existsSync(destPath)) {
        console.log(`  ⏩ 이미 존재함 — 스킵 (${filename})`);
        const idx = walkersData.findIndex(w => w.userId === walker.id);
        if (idx !== -1) walkersData[idx].profilePhoto = webPath;
        success++;
        continue;
      }

      const result = await generateImage(walker);
      if (result.type === 'base64') {
        console.log(`  ✅ 이미지(base64) 수신 — 저장 중...`);
        fs.writeFileSync(destPath, Buffer.from(result.data, 'base64'));
      } else {
        console.log(`  ✅ 이미지 URL 수신 — 다운로드 중...`);
        await downloadImage(result.data, destPath);
      }
      console.log(`  💾 저장 완료: ${filename}`);

      // walkers.json 업데이트
      const idx = walkersData.findIndex(w => w.userId === walker.id);
      if (idx !== -1) {
        walkersData[idx].profilePhoto = webPath;
        console.log(`  📝 walkers.json 경로 업데이트`);
      } else {
        console.log(`  ⚠️  walkers.json에서 ${walker.id}를 찾지 못함`);
      }
      success++;
    } catch(e) {
      console.error(`  ❌ 실패: ${e.message}`);
      failed++;
    }

    // Rate limit 방지: 요청 간 2.5초 대기
    if (WALKERS.indexOf(walker) < WALKERS.length - 1) {
      process.stdout.write('  ⏳ 2.5초 대기...');
      await new Promise(r => setTimeout(r, 2500));
      process.stdout.write(' 완료\n');
    }
  }

  // walkers.json 저장 (BOM 없이)
  fs.writeFileSync(walkersPath, JSON.stringify(walkersData, null, 2), 'utf8');
  console.log('\n─────────────────────────────────');
  console.log(`✅ 완료: 성공 ${success}명 / 실패 ${failed}명`);
  console.log('📄 server/data/walkers.json 업데이트 완료');
  if (success > 0) {
    console.log('🔄 서버 재시작 후 확인해주세요!');
  }
}

main().catch(e => {
  console.error('\n❌ 예상치 못한 오류:', e);
  process.exit(1);
});
