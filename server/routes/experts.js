/**
 * Expert matching routes
 * Verified expert applications, approved expert profiles, and paid consultations.
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

const CATEGORY_META = {
  vet: {
    label: '수의사',
    badge: '수의사 면허 확인',
    defaultTitle: '반려견 건강 상담 수의사',
    requiredDocs: ['수의사 면허증', '면허번호', '동물병원 재직/개설 증빙'],
    trustedIssuers: ['농림축산식품부', '대한수의사회']
  },
  trainer: {
    label: '훈련사',
    badge: '행동지도 자격 확인',
    defaultTitle: '반려견 행동지도 훈련사',
    requiredDocs: ['반려동물행동지도사 국가자격', 'KKC 반려견지도사', 'KKF 훈련사/핸들러', '경력증명 또는 포트폴리오'],
    trustedIssuers: ['농림축산식품부', 'KKC 한국애견협회', 'KKF 한국애견연맹']
  },
  groomer: {
    label: '미용사',
    badge: '미용 자격 확인',
    defaultTitle: '반려견 미용/홈케어 전문가',
    requiredDocs: ['KKC 반려견스타일리스트', 'KKF 애견미용사', 'FCI/KKF 미용 인증', '미용 포트폴리오'],
    trustedIssuers: ['KKC 한국애견협회', 'KKF 한국애견연맹', 'FCI']
  }
};

const MOCK_PASSWORD = 'expert2026!';
const MOCK_EXPERTS = [
  {
    id: 'expert-vet-mock',
    userId: 'mock-vet-user',
    email: 'vet@pawsitive.mock',
    name: '윤서진',
    nickname: '서진수의사',
    category: 'vet',
    title: '소동물 내과 수의사',
    price: 39000,
    location: '서울 강남',
    experience: '9년 경력',
    responseTime: '평균 8분',
    tags: ['피부/알러지', '소화기', '응급 판단'],
    intro: '병원 방문 전 보호자가 놓치기 쉬운 건강 신호를 정리해드립니다.',
    credentials: [
      { issuer: '농림축산식품부', name: '수의사 면허', grade: '면허', number: 'VET-MOCK-2026' },
      { issuer: '동물병원', name: '재직 확인', grade: '내과', number: 'CLINIC-SEOUL-01' }
    ],
    rating: 4.9,
    reviews: 184
  },
  {
    id: 'expert-trainer-mock',
    userId: 'mock-trainer-user',
    email: 'trainer@pawsitive.mock',
    name: '강도윤',
    nickname: '도윤훈련사',
    category: 'trainer',
    title: '문제행동 교정 훈련사',
    price: 33000,
    location: '서울 마포',
    experience: '7년 경력',
    responseTime: '평균 12분',
    tags: ['짖음', '분리불안', '줄 당김'],
    intro: '보호자 루틴과 산책 환경을 함께 보고 단계별 훈련안을 제안합니다.',
    credentials: [
      { issuer: '농림축산식품부', name: '반려동물행동지도사', grade: '2급', number: 'BHV-MOCK-2026' },
      { issuer: 'KKC 한국애견협회', name: '반려견지도사', grade: '1급', number: 'KKC-DI-001' }
    ],
    rating: 4.8,
    reviews: 126
  },
  {
    id: 'expert-groomer-mock',
    userId: 'mock-groomer-user',
    email: 'groomer@pawsitive.mock',
    name: '정유민',
    nickname: '유민미용사',
    category: 'groomer',
    title: '스트레스 케어 미용사',
    price: 25000,
    location: '경기 성남',
    experience: '8년 경력',
    responseTime: '평균 10분',
    tags: ['엉킴 관리', '발톱/발바닥', '미용 공포'],
    intro: '미용을 무서워하는 아이도 무리하지 않도록 홈케어 순서를 안내합니다.',
    credentials: [
      { issuer: 'KKC 한국애견협회', name: '반려견스타일리스트', grade: '1급', number: 'KKC-ST-001' },
      { issuer: 'KKF 한국애견연맹', name: '애견미용사', grade: '2급', number: 'KKF-GR-002' }
    ],
    rating: 4.7,
    reviews: 142
  }
];

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(36);
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function profileFromMock(mock) {
  const meta = CATEGORY_META[mock.category];
  return {
    id: mock.id,
    userId: mock.userId,
    category: mock.category,
    categoryLabel: meta.label,
    name: mock.name,
    title: mock.title,
    avatar: mock.name.charAt(0),
    rating: mock.rating,
    reviews: mock.reviews,
    price: mock.price,
    responseTime: mock.responseTime,
    experience: mock.experience,
    location: mock.location,
    tags: mock.tags,
    intro: mock.intro,
    credentials: mock.credentials,
    verificationBadges: [meta.badge, '관리자 서류 심사 통과'],
    status: 'approved',
    source: 'mock',
    approvedAt: db.now()
  };
}

function seedMockExperts() {
  const now = db.now();
  const users = db.get('users', []);
  let usersChanged = false;
  MOCK_EXPERTS.forEach(mock => {
    const idx = users.findIndex(u => u.id === mock.userId || u.email === mock.email);
    const nextUser = {
      id: mock.userId,
      email: mock.email,
      name: mock.name,
      nickname: mock.nickname,
      passwordHash: hashPassword(MOCK_PASSWORD),
      referralCode: 'PAW-' + mock.category.toUpperCase(),
      dogs: [],
      pawCoins: 3000,
      isExpert: true,
      expertCategory: mock.category,
      expertProfileId: mock.id,
      createdAt: now
    };
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...nextUser, createdAt: users[idx].createdAt || now };
      usersChanged = true;
    } else {
      users.push(nextUser);
      usersChanged = true;
    }
  });
  if (usersChanged) db.set('users', users);

  const profiles = db.get('expertProfiles', []);
  let profilesChanged = false;
  MOCK_EXPERTS.forEach(mock => {
    const idx = profiles.findIndex(p => p.id === mock.id);
    const profile = profileFromMock(mock);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...profile, approvedAt: profiles[idx].approvedAt || profile.approvedAt };
    } else {
      profiles.push(profile);
    }
    profilesChanged = true;
  });
  if (profilesChanged) db.set('expertProfiles', profiles);
}

function getProfiles() {
  seedMockExperts();
  return db.get('expertProfiles', []);
}

function normalizeCategory(category) {
  return CATEGORY_META[category] ? category : null;
}

function emitToUser(req, userId, event, data) {
  const emit = req.app.get('emitToUser');
  if (emit && userId) emit(userId, event, data);
}

router.get('/meta', (req, res) => {
  seedMockExperts();
  res.json({
    success: true,
    categories: CATEGORY_META,
    mockAccounts: MOCK_EXPERTS.map(m => ({
      role: CATEGORY_META[m.category].label,
      email: m.email,
      password: MOCK_PASSWORD,
      userId: m.userId
    }))
  });
});

router.get('/profiles', (req, res) => {
  const profiles = getProfiles();
  const includeAll = req.query.all === 'true';
  const category = normalizeCategory(req.query.category);
  let result = includeAll ? profiles : profiles.filter(p => p.status === 'approved');
  if (category) result = result.filter(p => p.category === category);
  result.sort((a, b) => (b.source === 'mock') - (a.source === 'mock') || (b.rating || 0) - (a.rating || 0));
  res.json({ success: true, profiles: result });
});

router.post('/applications', (req, res) => {
  seedMockExperts();
  const category = normalizeCategory(req.body.category);
  if (!category) return res.status(400).json({ success: false, error: '전문가 분야를 선택해주세요.' });
  if (!req.body.userId || !req.body.displayName || !req.body.licenseName || !req.body.licenseNumber) {
    return res.status(400).json({ success: false, error: '이름, 자격명, 자격번호는 필수입니다.' });
  }
  const docs = Array.isArray(req.body.documents) ? req.body.documents : [];
  if (docs.length === 0) {
    return res.status(400).json({ success: false, error: '관리자가 확인할 서류 파일을 1개 이상 첨부해주세요.' });
  }

  const applications = db.get('expertApplications', []);
  const pending = applications.find(a => a.userId === req.body.userId && a.status === 'pending');
  if (pending) {
    return res.status(409).json({ success: false, error: '이미 심사 대기 중인 신청서가 있어요.' });
  }

  const application = {
    id: db.generateId(),
    userId: req.body.userId,
    applicantName: req.body.applicantName || req.body.displayName,
    applicantEmail: req.body.applicantEmail || '',
    category,
    categoryLabel: CATEGORY_META[category].label,
    displayName: String(req.body.displayName || '').trim(),
    title: String(req.body.title || CATEGORY_META[category].defaultTitle).trim(),
    price: Number(req.body.price || 30000),
    location: String(req.body.location || '온라인').trim(),
    experienceYears: String(req.body.experienceYears || '').trim(),
    workplace: String(req.body.workplace || '').trim(),
    intro: String(req.body.intro || '').trim(),
    tags: String(req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
    licenseIssuer: String(req.body.licenseIssuer || '').trim(),
    licenseName: String(req.body.licenseName || '').trim(),
    licenseGrade: String(req.body.licenseGrade || '').trim(),
    licenseNumber: String(req.body.licenseNumber || '').trim(),
    licenseExpiry: String(req.body.licenseExpiry || '').trim(),
    documentNote: String(req.body.documentNote || '').trim(),
    documents: docs.slice(0, 4).map(d => ({
      name: d.name,
      type: d.type,
      size: d.size,
      data: d.data
    })),
    status: 'pending',
    createdAt: db.now(),
    updatedAt: db.now()
  };
  applications.unshift(application);
  db.set('expertApplications', applications);
  res.json({ success: true, application });
});

router.get('/applications', (req, res) => {
  seedMockExperts();
  const applications = db.get('expertApplications', []);
  const userId = req.query.userId;
  const result = userId ? applications.filter(a => a.userId === userId) : applications;
  res.json({ success: true, applications: result });
});

router.patch('/applications/:id/review', (req, res) => {
  seedMockExperts();
  const applications = db.get('expertApplications', []);
  const appIdx = applications.findIndex(a => a.id === req.params.id);
  if (appIdx === -1) return res.status(404).json({ success: false, error: '신청서를 찾을 수 없습니다.' });

  const decision = req.body.decision === 'approved' ? 'approved' : 'rejected';
  const application = applications[appIdx];
  application.status = decision;
  application.reviewedAt = db.now();
  application.reviewedBy = req.body.adminId || 'admin';
  application.rejectionReason = decision === 'rejected' ? (req.body.reason || '서류 확인이 필요합니다.') : '';
  application.updatedAt = db.now();

  let profile = null;
  if (decision === 'approved') {
    const meta = CATEGORY_META[application.category];
    const profiles = db.get('expertProfiles', []);
    const profileId = application.profileId || 'expert-' + application.id;
    profile = {
      id: profileId,
      userId: application.userId,
      category: application.category,
      categoryLabel: meta.label,
      name: application.displayName,
      title: application.title || meta.defaultTitle,
      avatar: application.displayName.charAt(0),
      rating: 4.8,
      reviews: 0,
      price: application.price,
      responseTime: '평균 15분',
      experience: application.experienceYears ? `${application.experienceYears}년 경력` : '경력 심사 완료',
      location: application.location || '온라인',
      tags: application.tags && application.tags.length ? application.tags : meta.requiredDocs.slice(0, 3),
      intro: application.intro || '관리자 서류 심사를 통과한 검증 전문가입니다.',
      credentials: [
        {
          issuer: application.licenseIssuer,
          name: application.licenseName,
          grade: application.licenseGrade,
          number: application.licenseNumber,
          expiry: application.licenseExpiry
        }
      ],
      verificationBadges: [meta.badge, '관리자 서류 심사 통과'],
      workplace: application.workplace,
      status: 'approved',
      source: 'application',
      applicationId: application.id,
      approvedAt: db.now()
    };
    const idx = profiles.findIndex(p => p.id === profileId || p.applicationId === application.id || p.userId === application.userId);
    if (idx >= 0) profiles[idx] = { ...profiles[idx], ...profile };
    else profiles.unshift(profile);
    db.set('expertProfiles', profiles);

    const users = db.get('users', []);
    const userIdx = users.findIndex(u => u.id === application.userId);
    if (userIdx >= 0) {
      users[userIdx].isExpert = true;
      users[userIdx].expertCategory = application.category;
      users[userIdx].expertProfileId = profile.id;
      db.set('users', users);
    }
  }

  applications[appIdx] = application;
  db.set('expertApplications', applications);
  emitToUser(req, application.userId, 'expert-application-reviewed', { application, profile });
  res.json({ success: true, application, profile });
});

router.post('/consultations', (req, res) => {
  seedMockExperts();
  const profiles = getProfiles();
  const expert = profiles.find(p => p.id === req.body.expertId && p.status === 'approved');
  if (!expert) return res.status(404).json({ success: false, error: '상담 가능한 전문가를 찾을 수 없습니다.' });
  if (!req.body.requesterId) return res.status(400).json({ success: false, error: '요청자 정보가 필요합니다.' });

  const consultations = db.get('expertConsultations', []);
  const existing = consultations.find(c => c.requesterId === req.body.requesterId && c.expertId === expert.id && ['requested', 'accepted'].includes(c.status));
  if (existing) return res.json({ success: true, consultation: existing, existing: true });

  const now = db.now();
  const consultation = {
    id: db.generateId(),
    requesterId: req.body.requesterId,
    requesterName: req.body.requesterName || '보호자',
    requesterEmail: req.body.requesterEmail || '',
    expertId: expert.id,
    expertUserId: expert.userId,
    expertName: expert.name,
    category: expert.category,
    categoryLabel: expert.categoryLabel,
    dogName: req.body.dogName || '반려견',
    topic: req.body.topic || '상담 요청',
    firstMessage: req.body.firstMessage || '상담을 시작하고 싶어요.',
    amount: Number(req.body.amount || expert.price || 0),
    paymentOrderId: req.body.paymentOrderId || '',
    status: 'requested',
    createdAt: now,
    updatedAt: now,
    messages: [
      { from: 'system', text: `${expert.name} ${expert.categoryLabel}에게 상담 요청이 접수됐어요.`, createdAt: now },
      { from: 'requester', text: req.body.firstMessage || '상담을 시작하고 싶어요.', createdAt: now }
    ]
  };

  consultations.unshift(consultation);
  db.set('expertConsultations', consultations);
  emitToUser(req, expert.userId, 'expert-consultation-requested', { consultation });
  emitToUser(req, consultation.requesterId, 'expert-consultation-updated', { consultation });
  res.json({ success: true, consultation });
});

router.get('/consultations', (req, res) => {
  seedMockExperts();
  const consultations = db.get('expertConsultations', []);
  const userId = req.query.userId;
  const role = req.query.role;
  let result = consultations;
  if (userId && role === 'expert') result = consultations.filter(c => c.expertUserId === userId);
  else if (userId && role === 'requester') result = consultations.filter(c => c.requesterId === userId);
  else if (userId) result = consultations.filter(c => c.requesterId === userId || c.expertUserId === userId);
  res.json({ success: true, consultations: result });
});

router.patch('/consultations/:id/status', (req, res) => {
  seedMockExperts();
  const allowed = ['requested', 'accepted', 'declined', 'completed'];
  const status = allowed.includes(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ success: false, error: '상태 값이 올바르지 않습니다.' });

  const consultations = db.get('expertConsultations', []);
  const idx = consultations.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '상담을 찾을 수 없습니다.' });

  const consultation = consultations[idx];
  consultation.status = status;
  consultation.updatedAt = db.now();
  if (status === 'accepted') consultation.acceptedAt = consultation.updatedAt;
  if (status === 'declined') consultation.declinedAt = consultation.updatedAt;
  if (status === 'completed') consultation.completedAt = consultation.updatedAt;
  const text = {
    accepted: `${consultation.expertName} 전문가가 상담을 확인했어요.`,
    declined: `${consultation.expertName} 전문가가 상담을 진행하기 어렵다고 답했어요.`,
    completed: '상담이 종료됐어요. 필요하면 새 상담을 신청할 수 있어요.'
  }[status];
  if (text) consultation.messages.push({ from: 'system', text, createdAt: consultation.updatedAt });

  consultations[idx] = consultation;
  db.set('expertConsultations', consultations);
  emitToUser(req, consultation.requesterId, 'expert-consultation-updated', { consultation });
  emitToUser(req, consultation.expertUserId, 'expert-consultation-updated', { consultation });
  res.json({ success: true, consultation });
});

router.post('/consultations/:id/messages', (req, res) => {
  seedMockExperts();
  const consultations = db.get('expertConsultations', []);
  const idx = consultations.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '상담을 찾을 수 없습니다.' });

  const consultation = consultations[idx];
  if (['declined', 'completed'].includes(consultation.status)) {
    return res.status(400).json({ success: false, error: '종료된 상담에는 메시지를 보낼 수 없습니다.' });
  }
  const senderId = req.body.senderId;
  const from = senderId === consultation.expertUserId ? 'expert' : 'requester';
  const message = {
    from,
    text: String(req.body.text || '').trim(),
    images: Array.isArray(req.body.images) ? req.body.images.slice(0, 4) : [],
    createdAt: db.now()
  };
  if (!message.text && !message.images.length) {
    return res.status(400).json({ success: false, error: '메시지 내용이 필요합니다.' });
  }
  consultation.messages.push(message);
  consultation.updatedAt = message.createdAt;
  consultations[idx] = consultation;
  db.set('expertConsultations', consultations);

  const targetId = from === 'expert' ? consultation.requesterId : consultation.expertUserId;
  emitToUser(req, targetId, 'expert-consultation-message', { consultation, message });
  emitToUser(req, senderId, 'expert-consultation-updated', { consultation });
  res.json({ success: true, consultation, message });
});

module.exports = router;
