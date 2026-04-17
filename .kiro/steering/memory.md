# Pawsitive 프로젝트 메모리

## 프로젝트 개요
- **이름**: Pawsitive 🐾 - 반려견 종합 플랫폼
- **설명**: 반려견 품종 정보, AI 건강 상담, 산책 매칭, 커뮤니티 등을 제공하는 웹 서비스
- **개발자**: ChoHyeonChan
- **GitHub**: https://github.com/ChoHyeonChan/Pawsitive.git
- **브랜치**: dev (작업용), main

## 기술 스택
- **프론트엔드**: Vanilla JS (SPA, 해시 라우팅), Leaflet 지도, CSS
- **백엔드**: Express 5 (Node.js), 세션 기반 인증
- **AI**: Google Gemini (메인) + Anthropic Claude (폴백)
- **인증**: 소셜 로그인 (구글/카카오/네이버 OAuth) + 이메일 인증 (Nodemailer)
- **데이터**: 서버 JSON 파일 DB (server/data/) + localStorage 하이브리드
- **외부 접근**: ngrok 터널링

## 프로젝트 구조
```
├── index.html              # SPA 진입점
├── css/styles.css          # 전체 스타일
├── js/
│   ├── app.js              # 메인 앱 (라우팅 + 모든 페이지 렌더링, 3500줄+)
│   ├── data/
│   │   ├── breeds.js       # 견종 대백과사전 (383종, 444KB)
│   │   └── education.js    # 교육 콘텐츠 데이터
│   └── services/
│       ├── authService.js        # 인증 (회원가입/로그인/프로필)
│       ├── breedService.js       # 품종 조회/검색
│       ├── breedImageService.js  # 견종 이미지 (Wikimedia Commons)
│       ├── communityService.js   # 커뮤니티 (게시물/좋아요/댓글)
│       ├── educationService.js   # 교육 콘텐츠/진행률
│       ├── matchingService.js    # 산책 매칭/도그워커
│       ├── walletService.js      # Paw 코인 지갑
│       └── storage.js            # 서버 동기화 + localStorage 하이브리드
├── server/
│   ├── index.js            # Express 서버 메인
│   ├── db.js               # DB 유틸
│   ├── config/passport.js  # OAuth 설정
│   ├── data/
│   │   ├── knowledge.json  # RAG 지식 베이스 (399개)
│   │   ├── users.json      # 사용자 데이터
│   │   └── walkers.json    # 도그워커 데이터
│   └── routes/
│       ├── ai.js           # AI 라우트 (Gemini + Claude 폴백)
│       ├── auth.js         # 인증 라우트
│       ├── data.js         # 데이터 동기화 라우트
│       ├── email.js        # 이메일 인증 라우트
│       ├── walkers.js      # 도그워커 라우트
│       └── admin.js        # 관리자 라우트
└── .env                    # 환경변수 (API 키 등)
```

## 주요 기능 (10개 페이지)
1. **홈** — 대시보드, Paw 코인 잔액, 최근 커뮤니티 소식
2. **품종 정보** — 383종 견종 대백과사전, 검색, 상세 정보, AI 질문
3. **산책 교육** — 자세/리드줄/안전 카테고리, 진행률 추적
4. **AI 질병 분석** — 증상 입력 → Gemini/Claude AI 분석
5. **AI 훈련사 상담** — 문제 행동 상담 (RAG 기반)
6. **커뮤니티** — 게시물 CRUD, 좋아요, 댓글
7. **Paw 지갑** — 코인 적립/사용, 거래 내역
8. **산책 매칭** — walker/requester 역할 기반 매칭
9. **도그워커** — GPS 기반 근처 도그워커 탐색 (Leaflet 지도)
10. **프로필** — 회원 관리, 반려견 등록, 닉네임, 추천인 코드

## 견종 데이터 (breeds.js)
- **383종** 등록 (중복 0, 불완전 항목 0)
- 소형 99 / 중형 139 / 대형 145
- 10개 그룹: 하운드(79), 워킹(69), 허딩(49), 스포팅(43), 테리어(38), 하이브리드(27), 토이(27), 스피츠(24), 논스포팅(21), 컴패니언(6)
- 한국 토종견 6종: 진돗개, 삽살개, 동경이, 제주개, 경주개 동경이, 도사견
- 각 견종 필드: id, name, nameEn, size, group, origin, lifespan, weight, height, personality, exerciseLevel, groomingLevel, trainability, barkingLevel, childFriendly, apartmentFriendly, cautions, healthIssues, dietTips, exerciseTips, groomingTips, funFact, imageUrl
- 이미지: Wikimedia Commons (CC BY-SA, 출처 표기 포함)

## RAG 시스템
- **knowledge.json**: 438개 지식 항목
  - 품종 정보: 385개 (383종 견종 + 기존 2개)
  - 문제행동 교정: 13개 (짖음, 분리불안, 입질, 공격성, 반응성, 자원보호, 마운팅, 파괴, 뛰어오르기, 줍기, 공포 등)
  - 훈련: 12개 (앉아, 기다려, 이리와, 엎드려, 안돼, 켄넬, 매트, 노즈워크, 클리커, 배변, 사회화 등)
  - 건강: 14개 (예방접종, 치아, 진드기, 비만, 귀감염, 알레르기, 위험음식, 노견, 중성화, 응급 등)
  - 산책: 7개 (기본산책, 리드줄, 여름/겨울, 다견산책, 첫산책, 줍기교정)
  - 관리: 7개 (목욕, 발톱, 사료선택, 새강아지, 여행, 다견가정, 일반관리)
- 키워드 기반 검색 → AI 프롬프트에 참고 자료로 주입
- AI 상담(/api/ai/consult)과 증상 분석(/api/ai/symptom) 모두 적용

## AI 구조
- **Gemini** (메인): gemini-2.5-flash → 폴백 모델 순차 시도, 503 시 최대 3회 재시도
- **Claude** (폴백): Gemini 완전 실패 시 claude-haiku-4-5로 자동 전환
- 도그워커 AI 추천: Claude claude-sonnet-4-6
- 반려견 행동 상담 (SSE 스트리밍): Claude claude-haiku-4-5

## 환경변수 (.env)
- PORT=3000
- GOOGLE/KAKAO/NAVER OAuth 키
- SMTP (Gmail)
- GEMINI_API_KEY
- ANTHROPIC_API_KEY
- ADMIN_EMAILS

## 작업 이력
- **2025-04-17**: 견종 20종 → 383종 확장, 실제 사진 적용(Wikimedia Commons), RAG 438개 확장, AI Gemini→Claude 폴백 추가, 이미지 재시도 로직, 훈련/건강/관리 전문 지식 39개 추가
- 커밋: `견종 383종 대백과사전 + 실제 사진 + RAG + AI 폴백` (dev 브랜치)

## 주의사항
- breeds.js 파일이 444KB로 큼 — 수정 시 빌드 스크립트 사용 권장
- knowledge.json 374KB — breeds.js 수정 시 함께 업데이트 필요
- Wikimedia 이미지 단시간 대량 요청 시 429 차단됨 — 100ms 간격 유지
- 서버 실행: `npm start` (포트 3000)
- 서버 실행 전 기존 node 프로세스 확인 필요 (포트 충돌)
