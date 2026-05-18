/**
 * StorageService - 서버 동기화 + LocalStorage 하이브리드
 * 공유 데이터: 서버 JSON DB에 저장 (모든 사용자가 공유)
 * 개인 데이터: localStorage에 저장 (로그인 상태 등)
 */

const StorageService = (() => {
  // 서버와 동기화할 키 목록
  const SHARED_KEYS = ['users', 'communityPosts', 'communityStories', 'transactions',
    'matchProfiles', 'notices', 'walkers'];

  // 탭별로 독립 유지해야 할 키 (sessionStorage 사용)
  const SESSION_KEYS = ['currentUser', 'authToken'];

  // 로컬 캐시 (서버 데이터의 메모리 캐시)
  const cache = {};

  /**
   * 데이터 저장
   */
  function set(key, value) {
    // 공유 데이터 → 서버에 저장 + 캐시 업데이트
    if (SHARED_KEYS.includes(key)) {
      cache[key] = value;
      // 비동기로 서버에 저장 (UI 블로킹 안 함)
      fetch('/api/data/' + key, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      }).catch(e => console.warn('[Storage] 서버 저장 실패:', e.message));
      return true;
    }

    // 탭 독립 데이터 → sessionStorage
    if (SESSION_KEYS.includes(key)) {
      try {
        sessionStorage.setItem('pawsitive_' + key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('[Storage] 저장 실패:', e);
        return false;
      }
    }

    // 개인 데이터 → localStorage
    try {
      localStorage.setItem('pawsitive_' + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[Storage] 저장 실패:', e);
      return false;
    }
  }

  /**
   * 데이터 조회
   */
  function get(key, defaultValue = null) {
    // 공유 데이터 → 캐시에서 반환
    if (SHARED_KEYS.includes(key)) {
      return cache[key] !== undefined ? cache[key] : defaultValue;
    }

    // 탭 독립 데이터 → sessionStorage
    if (SESSION_KEYS.includes(key)) {
      try {
        const raw = sessionStorage.getItem('pawsitive_' + key);
        if (raw === null) return defaultValue;
        return JSON.parse(raw);
      } catch (e) {
        return defaultValue;
      }
    }

    // 개인 데이터 → localStorage
    try {
      const raw = localStorage.getItem('pawsitive_' + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * 데이터 삭제
   */
  function remove(key) {
    if (SHARED_KEYS.includes(key)) {
      delete cache[key];
      return true;
    }
    if (SESSION_KEYS.includes(key)) {
      try {
        sessionStorage.removeItem('pawsitive_' + key);
        return true;
      } catch (e) {
        return false;
      }
    }

    try {
      localStorage.removeItem('pawsitive_' + key);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 서버에서 공유 데이터 로드 (앱 시작 시 호출)
   */
  async function syncFromServer() {
    for (const key of SHARED_KEYS) {
      try {
        const res = await fetch('/api/data/' + key);
        if (res.ok) {
          const data = await res.json();
          cache[key] = data;
        }
      } catch (e) {
        console.warn('[Storage] 서버 동기화 실패 (' + key + '):', e.message);
        cache[key] = [];
      }
    }
    console.log('[Storage] 서버 데이터 동기화 완료');
  }

  function clear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pawsitive_')) keys.push(key);
    }
    keys.forEach(key => localStorage.removeItem(key));
    return true;
  }

  function isUsingMemory() { return false; }

  function generateId() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
  }

  function now() {
    return new Date().toISOString();
  }

  function setCache(key, value) {
    if (SHARED_KEYS.includes(key)) { cache[key] = value; }
  }

  return {
    set, get, remove, clear, isUsingMemory, generateId, now, syncFromServer, setCache
  };
})();
