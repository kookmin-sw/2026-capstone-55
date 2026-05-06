/**
 * 산책 완료 후 리뷰 API
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// 리뷰 작성
router.post('/', (req, res) => {
  const { requestId, reviewerId, walkerId, rating, comment } = req.body;
  if (!requestId || !reviewerId || !walkerId || !rating) {
    return res.status(400).json({ success: false, error: '필수 항목이 없습니다.' });
  }

  // 자기 자신 리뷰 금지
  if (reviewerId === walkerId) {
    return res.status(400).json({ success: false, error: '본인에게 리뷰를 작성할 수 없습니다.' });
  }

  // 별점 범위 강제 (1~5)
  const numRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));
  if (numRating < 1) {
    return res.status(400).json({ success: false, error: '평점은 1~5 사이여야 합니다.' });
  }

  // 해당 요청이 실제로 존재하고, 이 리뷰어가 요청자(participant)이며, 완료 상태인지 확인
  const walkRequests = db.get('walkRequests', []);
  const walkRequest  = walkRequests.find(r => r.id === requestId);
  if (!walkRequest) {
    return res.status(404).json({ success: false, error: '산책 요청을 찾을 수 없습니다.' });
  }
  if (walkRequest.requesterId !== reviewerId) {
    return res.status(403).json({ success: false, error: '해당 산책의 요청자만 리뷰를 작성할 수 있습니다.' });
  }
  if (walkRequest.walkerId !== walkerId) {
    return res.status(400).json({ success: false, error: '리뷰 대상 도우미가 일치하지 않습니다.' });
  }
  if (!['completed', 'finished'].includes(walkRequest.status)) {
    return res.status(400).json({ success: false, error: '완료된 산책에만 리뷰를 작성할 수 있습니다.' });
  }

  // 중복 리뷰 방지
  const reviews = db.get('walkReviews', []);
  if (reviews.find(r => r.requestId === requestId && r.reviewerId === reviewerId)) {
    return res.status(409).json({ success: false, error: '이미 리뷰를 작성했습니다.' });
  }

  const review = {
    id:         db.generateId(),
    requestId,
    reviewerId,
    walkerId,
    rating:     numRating,
    comment:    String(comment || '').slice(0, 500),
    createdAt:  db.now()
  };
  reviews.push(review);
  db.set('walkReviews', reviews);

  // 도우미 평균 평점 업데이트
  const walkerReviews = reviews.filter(r => r.walkerId === walkerId);
  const avgRating = walkerReviews.reduce((s, r) => s + r.rating, 0) / walkerReviews.length;

  const walkers = db.get('walkers', []);
  const wi = walkers.findIndex(w => w.userId === walkerId);
  if (wi !== -1) {
    walkers[wi].rating      = Math.round(avgRating * 10) / 10;
    walkers[wi].reviewCount = walkerReviews.length;
    db.set('walkers', walkers);
  }

  res.json({ success: true, review, newRating: Math.round(avgRating * 10) / 10 });
});

// 도우미 리뷰 목록 조회
router.get('/walker/:walkerId', (req, res) => {
  const reviews = db.get('walkReviews', []).filter(r => r.walkerId === req.params.walkerId);
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, reviews });
});

// 내가 특정 요청에 리뷰 썼는지 확인
router.get('/check/:requestId/:reviewerId', (req, res) => {
  const exists = db.get('walkReviews', []).some(
    r => r.requestId === req.params.requestId && r.reviewerId === req.params.reviewerId
  );
  res.json({ success: true, reviewed: exists });
});

module.exports = router;
