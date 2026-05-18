/**
 * 결제 관리 API
 *
 * POST   /api/payments                → 결제 기록 생성 (결제 성공 직후)
 * GET    /api/payments/pending        → 미처리 결제 조회 (?userId=xxx)
 * PATCH  /api/payments/:id/complete   → 요청 전송 완료 처리
 * PATCH  /api/payments/:id/refund     → 환불 처리
 * GET    /api/payments/:id            → 단건 조회
 *
 * 결제 상태 흐름:
 *   pending → completed (요청 전송 성공)
 *   pending → refund_requested → refunded (매칭 실패/취소)
 *   pending → expired (5분 초과 미처리 → 자동 환불 대상)
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

const PAYMENT_EXPIRY_MS = 5 * 60 * 1000; // 5분

// ── 결제 기록 생성 ──────────────────────────────────────────
router.post('/', (req, res) => {
  const {
    userId, orderId, amount, duration,
    dogs, walkerId, requestType, lat, lng
  } = req.body;

  if (!userId || !orderId || !amount) {
    return res.status(400).json({ success: false, error: 'userId, orderId, amount가 필요합니다.' });
  }

  const payments = db.get('payments', []);

  // 동일 orderId 중복 방지
  const existing = payments.find(p => p.orderId === orderId);
  if (existing) {
    return res.json({ success: true, payment: existing, duplicate: true });
  }

  const payment = {
    id: db.generateId(),
    userId,
    orderId,
    amount,
    duration: duration || 40,
    dogs: dogs || [],
    walkerId: walkerId || null,
    requestType: requestType || 'direct', // 'direct' | 'broadcast' | 'map'
    lat: lat || null,
    lng: lng || null,
    status: 'pending',       // pending | completed | refund_requested | refunded | expired
    requestId: null,         // 요청 생성 후 연결
    createdAt: db.now(),
    completedAt: null,
    refundedAt: null,
    retryCount: 0,
    lastError: null
  };

  payments.push(payment);
  db.set('payments', payments);

  res.json({ success: true, payment });
});

// ── 미처리 결제 조회 ────────────────────────────────────────
router.get('/pending', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId가 필요합니다.' });
  }

  const payments = db.get('payments', []);
  const now = Date.now();

  // pending 상태이면서 만료되지 않은 결제
  const pending = payments.filter(p =>
    p.userId === userId &&
    p.status === 'pending' &&
    (now - new Date(p.createdAt).getTime()) < PAYMENT_EXPIRY_MS
  );

  // 만료된 pending 결제는 expired로 변경
  let changed = false;
  payments.forEach(p => {
    if (
      p.userId === userId &&
      p.status === 'pending' &&
      (now - new Date(p.createdAt).getTime()) >= PAYMENT_EXPIRY_MS
    ) {
      p.status = 'expired';
      p.lastError = '5분 초과 미처리 — 자동 만료';
      changed = true;
    }
  });
  if (changed) db.set('payments', payments);

  res.json({ success: true, payments: pending });
});

// ── 요청 전송 완료 처리 ─────────────────────────────────────
router.patch('/:id/complete', (req, res) => {
  const { requestId } = req.body;
  const payments = db.get('payments', []);
  const idx = payments.findIndex(p => p.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: '결제 기록을 찾을 수 없습니다.' });
  }

  if (payments[idx].status !== 'pending') {
    return res.json({ success: false, error: '이미 처리된 결제입니다.', payment: payments[idx] });
  }

  payments[idx].status = 'completed';
  payments[idx].requestId = requestId || null;
  payments[idx].completedAt = db.now();
  db.set('payments', payments);

  res.json({ success: true, payment: payments[idx] });
});

// ── 환불 요청 ───────────────────────────────────────────────
router.patch('/:id/refund', (req, res) => {
  const { reason } = req.body;
  const payments = db.get('payments', []);
  const idx = payments.findIndex(p => p.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: '결제 기록을 찾을 수 없습니다.' });
  }

  const validStatuses = ['pending', 'completed', 'expired'];
  if (!validStatuses.includes(payments[idx].status)) {
    return res.json({ success: false, error: '환불할 수 없는 상태입니다.' });
  }

  payments[idx].status = 'refunded';
  payments[idx].refundedAt = db.now();
  payments[idx].refundReason = reason || '매칭 실패/취소';
  db.set('payments', payments);

  // TODO: 실제 토스페이먼츠 환불 API 호출
  // await tossRefund(payments[idx].orderId, payments[idx].amount);

  res.json({ success: true, payment: payments[idx] });
});

// ── 재시도 횟수 증가 ────────────────────────────────────────
router.patch('/:id/retry', (req, res) => {
  const { error } = req.body;
  const payments = db.get('payments', []);
  const idx = payments.findIndex(p => p.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ success: false, error: '결제 기록을 찾을 수 없습니다.' });
  }

  payments[idx].retryCount = (payments[idx].retryCount || 0) + 1;
  payments[idx].lastError = error || null;

  // 3회 이상 실패 시 자동 환불 대상으로 전환
  if (payments[idx].retryCount >= 3) {
    payments[idx].status = 'expired';
    payments[idx].lastError = '3회 재시도 실패 — 자동 만료';
  }

  db.set('payments', payments);
  res.json({ success: true, payment: payments[idx] });
});

// ── 단건 조회 ───────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const payments = db.get('payments', []);
  const payment = payments.find(p => p.id === req.params.id);
  if (!payment) {
    return res.status(404).json({ success: false, error: '결제 기록을 찾을 수 없습니다.' });
  }
  res.json({ success: true, payment });
});

// ── orderId로 조회 ──────────────────────────────────────────
router.get('/by-order/:orderId', (req, res) => {
  const payments = db.get('payments', []);
  const payment = payments.find(p => p.orderId === req.params.orderId);
  if (!payment) {
    return res.status(404).json({ success: false, error: '결제 기록을 찾을 수 없습니다.' });
  }
  res.json({ success: true, payment });
});

module.exports = router;
