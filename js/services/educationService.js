/**
 * EducationService - education content lookup and progress tracking
 */

const EducationService = (() => {
  const PROGRESS_KEY_PREFIX = 'education_progress_';
  const LEGACY_CATEGORY_KEY_PREFIX = 'education_cat_';
  const CATEGORY_QUIZ_KEY_PREFIX = 'education_cat_quiz_';

  function _getProgressKey(userId) {
    return PROGRESS_KEY_PREFIX + userId;
  }

  function _getLegacyCategoryKey(userId) {
    return LEGACY_CATEGORY_KEY_PREFIX + userId;
  }

  function _getCategoryQuizKey(userId) {
    return CATEGORY_QUIZ_KEY_PREFIX + userId;
  }

  function _unique(values) {
    return [...new Set(values)];
  }

  function _arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
  }

  function _getAllCategoryKeys() {
    return _unique(
      EDUCATION_DATA
        .map(item => item.category)
        .filter(Boolean)
    );
  }

  function _normalizeCompletedIds(values) {
    const validIds = new Set(EDUCATION_DATA.map(item => item.id));
    return _unique(
      (Array.isArray(values) ? values : [])
        .filter(id => typeof id === 'string' && validIds.has(id))
    );
  }

  function _normalizeCategoryKeys(values) {
    const validCategories = new Set(_getAllCategoryKeys());
    return _unique(
      (Array.isArray(values) ? values : [])
        .filter(category => typeof category === 'string' && validCategories.has(category))
    );
  }

  function _readCompletedIds(userId) {
    const key = _getProgressKey(userId);
    const raw = StorageService.get(key, []);
    const normalized = _normalizeCompletedIds(raw);
    if (!_arraysEqual(raw, normalized)) {
      StorageService.set(key, normalized);
    }
    return normalized;
  }

  function _readPassedCategoryQuizzes(userId) {
    const quizKey = _getCategoryQuizKey(userId);
    const legacyKey = _getLegacyCategoryKey(userId);
    const rawQuiz = StorageService.get(quizKey, null);
    const rawLegacy = StorageService.get(legacyKey, []);
    const source = Array.isArray(rawQuiz) ? rawQuiz : rawLegacy;
    const normalized = _normalizeCategoryKeys(source);

    if (!Array.isArray(rawQuiz) || !_arraysEqual(rawQuiz, normalized)) {
      StorageService.set(quizKey, normalized);
    }
    if (!_arraysEqual(rawLegacy, normalized)) {
      StorageService.set(legacyKey, normalized);
    }

    return normalized;
  }

  function getByCategory(category) {
    if (!category || category === 'all') {
      return EDUCATION_DATA;
    }
    return EDUCATION_DATA.filter(item => item.category === category);
  }

  function getById(id) {
    const content = EDUCATION_DATA.find(item => item.id === id);
    return content || null;
  }

  function markComplete(userId, contentId) {
    const completedIds = _readCompletedIds(userId);
    if (!completedIds.includes(contentId)) {
      const next = [...completedIds, contentId];
      StorageService.set(_getProgressKey(userId), next);
    }
  }

  function getProgress(userId) {
    const completedIds = _readCompletedIds(userId);
    const total = EDUCATION_DATA.length;
    const completed = completedIds.length;
    const ratio = total > 0 ? completed / total : 0;
    return {
      total,
      completed,
      ratio,
      completedIds
    };
  }

  function getCategoryProgress(userId, category) {
    const items = getByCategory(category);
    const completedIds = _readCompletedIds(userId);
    const passedCategoryQuizzes = _readPassedCategoryQuizzes(userId);
    const allCompleted = items.length > 0 && items.every(item => completedIds.includes(item.id));
    const quizPassed = passedCategoryQuizzes.includes(category);
    return {
      total: items.length,
      completed: items.filter(item => completedIds.includes(item.id)).length,
      allCompleted,
      quizPassed,
      isCertified: allCompleted && quizPassed
    };
  }

  function markCategoryComplete(userId, category) {
    const passedCategories = _readPassedCategoryQuizzes(userId);
    if (!passedCategories.includes(category)) {
      const next = [...passedCategories, category];
      StorageService.set(_getCategoryQuizKey(userId), next);
      StorageService.set(_getLegacyCategoryKey(userId), next);
    }
  }

  function getCategoryCompleted(userId) {
    const completedIds = _readCompletedIds(userId);
    const passedCategories = _readPassedCategoryQuizzes(userId);

    return passedCategories.filter(category => {
      const items = getByCategory(category);
      return items.length > 0 && items.every(item => completedIds.includes(item.id));
    });
  }

  return {
    getByCategory,
    getById,
    markComplete,
    getProgress,
    getCategoryProgress,
    markCategoryComplete,
    getCategoryCompleted
  };
})();
