/**
 * BreedImageService - 견종 이미지 서비스
 * Wikipedia/Wikimedia Commons 이미지 사용 (CC BY-SA 라이선스)
 */

const BreedImageService = (() => {

  const GROUP_COLORS = {
    '스포팅(건독)':  'linear-gradient(135deg, #A5D6A7, #66BB6A)',
    '토이':          'linear-gradient(135deg, #F8BBD0, #F06292)',
    '스피츠':        'linear-gradient(135deg, #90CAF9, #42A5F5)',
    '논스포팅':      'linear-gradient(135deg, #FFCC80, #FFA726)',
    '허딩(목양)':    'linear-gradient(135deg, #9FA8DA, #5C6BC0)',
    '워킹(사역)':    'linear-gradient(135deg, #BCAAA4, #8D6E63)',
    '하운드':        'linear-gradient(135deg, #FFAB91, #FF7043)',
    '테리어':        'linear-gradient(135deg, #CE93D8, #AB47BC)',
    '하이브리드':    'linear-gradient(135deg, #80DEEA, #26C6DA)',
    '컴패니언':      'linear-gradient(135deg, #FFE082, #FFD54F)',
  };

  // 썸네일 URL 변환
  function toThumbUrl(url, width) {
    if (!url || url.includes('/thumb/')) return url;
    const m = url.match(/upload\.wikimedia\.org\/wikipedia\/commons\/([a-f0-9]\/[a-f0-9]{2})\/(.+)/);
    if (m) return `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${width}px-${m[2]}`;
    return url;
  }

  function loadAll() {
    document.querySelectorAll('[data-breed-id]').forEach(el => {
      const breed = BREEDS_DATA.find(b => b.id === el.getAttribute('data-breed-id'));
      if (breed) loadInto(el, breed);
    });
  }

  function loadInto(el, breed, isDetail) {
    if (!el || !breed || !breed.imageUrl) { applyFallback(el, breed); return; }

    const w = isDetail ? 800 : 400;
    const thumbUrl = toThumbUrl(breed.imageUrl, w);
    const originalUrl = breed.imageUrl;

    tryLoad(el, breed, [thumbUrl, originalUrl], 0, 0);
  }

  // 재시도 포함 이미지 로드 (최대 2회 재시도, 3초 간격)
  function tryLoad(el, breed, urls, urlIdx, attempt) {
    if (urlIdx >= urls.length) {
      // 모든 URL 실패 → 3초 후 한 번 더 재시도
      if (attempt < 2) {
        setTimeout(() => tryLoad(el, breed, urls, 0, attempt + 1), 3000 * (attempt + 1));
      } else {
        applyFallback(el, breed);
      }
      return;
    }

    const img = new Image();
    img.onload = () => {
      el.style.background = `url('${urls[urlIdx]}') center/cover no-repeat`;
      el.innerHTML = '<span class="img-credit">📷 Wikimedia Commons</span>';
    };
    img.onerror = () => tryLoad(el, breed, urls, urlIdx + 1, attempt);
    img.src = urls[urlIdx];
  }

  function applyFallback(el, breed) {
    if (!el) return;
    const g = (breed && GROUP_COLORS[breed.group]) || 'linear-gradient(135deg, #FFB3C6, #C9A9E9)';
    el.style.background = g;
    const emoji = !breed ? '🐕' : breed.size === 'small' ? '🐕' : breed.size === 'large' ? '🐕‍🦺' : '🐶';
    el.innerHTML = `<span style="font-size:inherit">${emoji}</span>`;
  }

  return { loadAll, loadInto, GROUP_COLORS };
})();
