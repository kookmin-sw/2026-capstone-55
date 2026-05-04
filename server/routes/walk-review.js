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

  // 중복 리뷰 방지
  const reviews = db.get('walkReviews', []);
  if (reviews.find(r => r.requestId === requestId && r.reviewerId === reviewerId)) {
    return res.json({ success: false, error: '이미 리뷰를 작성했습니다.' });
  }

  const review = {
    id:         db.generateId(),
    requestId,
    reviewerId,
    walkerId,
    rating:     Number(rating),
    comment:    comment || '',
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
