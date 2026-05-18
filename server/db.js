/**
 * JSON 파일 기반 간이 데이터베이스
 * 모든 데이터를 server/data/ 폴더에 JSON 파일로 저장
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// data 폴더 없으면 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 데이터 읽기
 */
function get(key, defaultValue = null) {
  const filePath = path.join(DATA_DIR, key + '.json');
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[DB] 읽기 실패 (${key}):`, e.message);
    return defaultValue;
  }
}

/**
 * 데이터 쓰기
 */
function set(key, value) {
  const filePath = path.join(DATA_DIR, key + '.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`[DB] 쓰기 실패 (${key}):`, e.message);
    return false;
  }
}

/**
 * UUID 생성
 */
function generateId() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * 현재 시간 ISO
 */
function now() {
  return new Date().toISOString();
}

module.exports = { get, set, generateId, now };
