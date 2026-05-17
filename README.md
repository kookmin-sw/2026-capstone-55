[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Lvs6kcL8)

<div align="center">
  <img src="pawsitive_logo_transparent.png" alt="Pawsitive" width="400">
  <p><strong>반려견과의 더 나은 일상</strong></p>
  <p>AI 건강 분석부터 산책 매칭까지, 당신과 반려견을 위한 공간.</p>
</div>

---

## 소개

Pawsitive는 반려견 보호자와 전문 산책 도우미를 연결하고, AI 기반 건강 관리·교육·커뮤니티를 제공하는 반려견 종합 케어 플랫폼입니다.

- 웹사이트: [Pawsitive 바로가기](https://competent-famished-leatrice.ngrok-free.dev)
- 소개 영상: [YouTube](https://youtu.be/)

---

## 주요 기능

### 산책 매칭
- 지도 기반 주변 산책 도우미 탐색 및 실시간 매칭 요청
- 브로드캐스트 매칭 — 주변 모든 도우미에게 동시 요청 발송
- 매칭 수락/거절 실시간 알림, 도우미 이동 중 라이브 위치 추적

### GPS 산책 추적
- 산책 중 실시간 경로 기록 (Kakao Maps)
- 거리·시간·속도 통계, 산책 완료 후 리뷰 및 별점

### AI 기능
- 증상 분석 — 반려견 증상을 입력하면 Gemini AI가 원인과 대처법 제시
- 품종 추천 — 라이프스타일 기반 AI 맞춤 품종 추천
- 품종 도감 — 200여 종 품종 상세 정보 검색
- Claude AI 전문가 상담 — Claude 기반 심층 건강·행동 상담

### 전문가 상담
- 수의사·훈련사 전문가 목록 탐색
- 토스페이먼츠 결제 후 1:1 채팅 상담방 개설

### 커뮤니티
- 게시물 작성 (사진·동영상·산책 경로 첨부), 좋아요·댓글·대댓글
- 스토리 — 24시간 자동 만료, 반응·댓글·시청자 확인
- 팔로우/팔로잉, DM(다이렉트 메시지), 해시태그 검색
- AI 기반 맞춤 게시물 추천

### 실시간 알림
- 좋아요·댓글·팔로우·산책 상태 변경 즉시 알림 (Socket.IO)
- 커뮤니티 알림 / 공지사항 탭 분리

### PAW 포인트
- 가입·추천인 코드 사용 시 포인트 지급
- 산책 매칭·전문가 상담 결제 수단으로 활용

### 인증
- 이메일 회원가입 (핸드폰 본인인증 필수)
- 소셜 로그인 — Google, Kakao, Naver OAuth
- 추천인 코드 시스템

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Backend | Node.js, Express |
| AI | Google Gemini API, Anthropic Claude API |
| 지도 | OpenStreetMap API |
| 실시간 통신 | Socket.IO |
| 인증 | Passport.js (Google, Kakao, Naver OAuth) |
| 결제 | 토스페이먼츠 |

---

## 팀 소개

| 이름 | 역할 | 기여 내용 |
|------|------|-----------|
| 조현찬 | 팀장, 풀스택 개발 | 프로젝트 총괄, 서버 아키텍처 설계 및 핵심 기능 구현 |
| 하준서 | 풀스택 개발 | 프로필·반려견 관리, AI 건강 분석, 커뮤니티 기능 구현 |
| 이재준 | 풀스택 개발 | 교육 컨텐츠, 실시간 채팅, 결제 시스템 구현 |
| 이충범 | 풀스택 개발 | 산책 매칭·GPS 추적, 워커 대시보드, 리뷰·평점 시스템 구현 |

---

## 설치 및 실행

```bash
git clone https://github.com/kookmin-sw/2026-capstone-55.git
cd 2026-capstone-55
npm install
npm start
# http://localhost:3000
```

팀페이지: [https://kookmin-sw.github.io/2026-capstone-55/](https://kookmin-sw.github.io/2026-capstone-55/)
