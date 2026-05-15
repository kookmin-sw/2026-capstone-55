/**
 * Pawsitive 백엔드 서버
 * 소셜 로그인 (구글/카카오/네이버) + 이메일 인증 + Socket.IO 실시간
 */

require('dotenv').config();
const http    = require('http');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors    = require('cors');
const path    = require('path');
const { Server } = require('socket.io');

const authRoutes         = require('./routes/auth');
const emailRoutes        = require('./routes/email');
const aiRoutes           = require('./routes/ai');
const walkerRoutes       = require('./routes/walkers');
const dataRoutes         = require('./routes/data');
const walkRoutes         = require('./routes/walks');
const healthRoutes       = require('./routes/health');
const userRoutes         = require('./routes/users');
const uploadRoutes       = require('./routes/upload');
const matchingRoutes     = require('./routes/matching');
const chatRoutes         = require('./routes/chat');
const walkRequestRoutes  = require('./routes/walk-requests');
const walkSessionRoutes  = require('./routes/walk-sessions');
const walkChatRoutes     = require('./routes/walk-chat');
const walkReviewRoutes   = require('./routes/walk-review');
const phoneRoutes        = require('./routes/phone');
const paymentRoutes      = require('./routes/payments');
const dmRoutes           = require('./routes/dm');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: true, credentials: true }
});

const PORT = process.env.PORT || 3000;

// io를 라우터에서 사용할 수 있도록 app에 주입
app.set('io', io);

// --- 미들웨어 ---
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'pawsitive-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

require('./config/passport')(passport);

// --- 라우트 ---
app.use('/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/walkers', walkerRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/walks', walkRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/walk-requests', walkRequestRoutes);
app.use('/api/walk-sessions', walkSessionRoutes);
app.use('/api/walk-chat',     walkChatRoutes);
app.use('/api/walk-review',   walkReviewRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/phone', phoneRoutes);
app.use('/api/dm',    dmRoutes);

// --- 정적 파일 (프론트엔드) ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..')));

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// --- Socket.IO ---
// userId → socketId 매핑 (메모리)
const userSockets = {};

io.on('connection', (socket) => {
  // 클라이언트가 로그인 후 자신의 userId를 등록
  socket.on('register', (userId) => {
    if (userId) {
      userSockets[userId] = socket.id;
      socket.userId = userId;
      // walker 프로필이 있으면 lastSeenAt 갱신 (신선도 반영)
      try {
        const db = require('./db');
        const walkers = db.get('walkers', []);
        const idx = walkers.findIndex(w => w.userId === userId);
        if (idx >= 0) {
          walkers[idx].lastSeenAt = new Date().toISOString();
          db.set('walkers', walkers);
        }
      } catch (e) { /* noop */ }
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      delete userSockets[socket.userId];
    }
  });
});

// 특정 userId에게 이벤트 전송
function emitToUser(userId, event, data) {
  const sid = userSockets[userId];
  if (sid) io.to(sid).emit(event, data);
}

// 온라인 상태인 모든 도우미에게 브로드캐스트
function emitToAvailableWalkers(event, data) {
  const db = require('./db');
  const walkers = db.get('walkers', []);

  // isAvailable + 소켓 연결된 워커에게 개인 emit
  const availableWalkerIds = walkers
    .filter(w => w.isAvailable && userSockets[w.userId])
    .map(w => w.userId);
  availableWalkerIds.forEach(uid => {
    io.to(userSockets[uid]).emit(event, data);
  });

  return availableWalkerIds.length;
}

app.set('emitToUser', emitToUser);
app.set('emitToAvailableWalkers', emitToAvailableWalkers);

// --- 서버 시작 ---

// 오래된 요청 자동 만료 (10분마다 실행)
const db = require('./db');

// 결제 자동 환불 헬퍼 (만료 시 사용)
function _autoRefundPayment(orderId, reason) {
  const payments = db.get('payments', []);
  const idx = payments.findIndex(p => p.orderId === orderId);
  if (idx !== -1 && ['pending', 'completed'].includes(payments[idx].status)) {
    payments[idx].status = 'refunded';
    payments[idx].refundedAt = db.now();
    payments[idx].refundReason = reason;
    db.set('payments', payments);
    // TODO: 실제 토스페이먼츠 환불 API 호출
  }
}

setInterval(() => {
  const now = Date.now();
  const cutoff24h = now - 24 * 60 * 60 * 1000;
  const cutoff2h  = now - 2  * 60 * 60 * 1000;

  const requests = db.get('walkRequests', []);
  let changed = false;
  requests.forEach(r => {
    const created = new Date(r.createdAt).getTime();
    // pending 상태로 2시간 지난 것 → expired
    if (r.status === 'pending' && created < cutoff2h) {
      r.status = 'expired'; changed = true;
      // 결제 환불 처리
      if (r.paymentOrderId) _autoRefundPayment(r.paymentOrderId, '요청 만료 (2시간 초과)');
    }
    // accepted/heading 상태로 24시간 지난 것 → expired
    if (['accepted','heading'].includes(r.status) && created < cutoff24h) {
      r.status = 'expired'; changed = true;
      if (r.paymentOrderId) _autoRefundPayment(r.paymentOrderId, '세션 만료 (24시간 초과)');
    }
    // broadcasting 상태 만료 체크
    if (r.status === 'broadcasting' && r.expiresAt && new Date(r.expiresAt) < new Date()) {
      r.status = 'expired'; changed = true;
      if (r.paymentOrderId) _autoRefundPayment(r.paymentOrderId, '브로드캐스트 만료 (도우미 미응답)');
    }
  });
  if (changed) db.set('walkRequests', requests);
}, 10 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`🐾 Pawsitive 서버가 http://localhost:${PORT} 에서 실행 중!`);
  console.log('');
  console.log('📋 설정 상태:');
  console.log(`   구글 로그인: ${process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('여기에') ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`   카카오 로그인: ${process.env.KAKAO_CLIENT_ID && !process.env.KAKAO_CLIENT_ID.includes('여기에') ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`   네이버 로그인: ${process.env.NAVER_CLIENT_ID && !process.env.NAVER_CLIENT_ID.includes('여기에') ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`   이메일 인증: ${process.env.SMTP_USER && !process.env.SMTP_USER.includes('여기에') ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`   AI (Gemini): ${process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('여기에') ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`   Socket.IO: ✅ 실시간 매칭 활성화`);
});
