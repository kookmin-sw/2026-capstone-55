[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Lvs6kcL8)

<div align="center">
  <img src="pawsitive_logo_transparent.png" alt="Pawsitive" width="800">
  <p><strong>반려견과의 더 나은 일상</strong></p>
  <p>AI 건강 분석부터 산책 매칭까지, 당신과 반려견을 위한 공간.</p>
  <img src="poster.png" alt="Pawsitive 포스터" width="800">
</div>

---

## 목차

- [프로젝트 소개](#1-프로젝트-소개)
- [주요 기능 소개](#2-주요-기능-소개)
- [주요 화면](#3-주요-화면)
- [시스템 아키텍처](#4-시스템-아키텍처)
- [기술 스택](#5-기술-스택)
- [팀원 소개](#6-팀원-소개)
- [설치 및 실행](#7-설치-및-실행)

---

## 1. 프로젝트 소개

| "Pawsitive : AI 기반 반려견 통합 케어 플랫폼"

현대 사회에서 반려견 양육 가구는 꾸준히 증가하고 있지만, 보호자들은 바쁜 일상 속에서 산책, 건강 관리, 행동 상담 등을 체계적으로 관리하는 데 어려움을 겪고 있습니다. 또한 자신의 반려견에 대한 정보와 지식 부족으로 적절한 대응이 어려운 경우도 많습니다. 그러나 현재 반려견 관련 서비스들은 산책, 건강 관리, 상담 등의 기능이 각각 분리된 앱과 사이트로 운영되어 여러 서비스를 따로 이용해야 하는 불편함이 존재합니다. 이로 인해 건강 기록과 관리 정보가 분산되어 지속적이고 체계적인 관리가 어려운 문제가 발생하고 있습니다.

저희는 이러한 문제를 해결하기 위해 AI 기반 반려견 통합 케어 플랫폼 **Pawsitive(포지티브)**를 개발하였습니다. Pawsitive는 실시간 산책 매칭, AI 건강 분석, 전문가 및 도우미 매칭, AI 상담, 건강 서류 통합 관리 기능을 하나의 서비스로 제공하여 보호자와 반려견 모두의 더 나은 일상을 지원합니다. 또한 AI 기술을 활용해 반려견의 활동 데이터와 건강 정보를 분석하고 맞춤형 서비스를 제공함으로써 보다 편리하고 체계적인 반려 생활 환경을 제공합니다.

### 서비스 강점

✅ 실시간 산책 매칭 기능을 통해 주변 보호자 및 산책 도우미와 연결하여 안전하고 효율적인 산책 환경을 제공합니다.

✅ 훈련사·전문가 매칭 기능을 통해 행동 교정, 건강 관리 등 반려견 상황에 맞는 전문 상담과 도움을 빠르게 받을 수 있습니다.

✅ Gemini 기반 AI 상담 시스템과 AI 건강 분석 기능을 활용하여 반려견의 활동 데이터와 건강 정보를 기반으로 맞춤형 건강 리포트 및 상담 서비스를 제공합니다.

- 웹사이트: [Pawsitive 바로가기](https://competent-famished-leatrice.ngrok-free.dev)

---

## 2. 주요 기능 소개

| 기능 | 설명 |
|------|------|
| **산책 매칭** | 지도 기반 주변 산책 도우미 탐색, 브로드캐스트 매칭, 실시간 위치 추적, GPS 경로 기록, 리뷰·별점 |
| **전문가 케어** | 수의사·훈련사·미용사 목록 탐색, 토스페이먼츠 결제 후 1:1 채팅 상담방 개설 |
| **AI 서비스** | Gemini AI 증상 분석·대처법 제시, 라이프스타일 기반 품종 추천, Claude AI 심층 건강·행동 상담 |
| **품종 정보 및 교육** | 380여 종 품종 도감 검색, 반려견 교육 콘텐츠 제공 |

---

## 3. 주요 화면

---

## 4. 시스템 아키텍처

---

## 5. 기술 스택

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

## 6. 팀원 소개

| 이름 | 역할 | 기여 내용 |
|------|------|-----------|
| 조현찬 | 팀장, 풀스택 개발 | 프로젝트 총괄, 교육 컨텐츠, 품종 정보, AI 상담 기능 구현 |
| 이재준 | 풀스택 개발 | 서버 아키텍처 설계, 전문가 매칭, 커뮤니티 기능 구현 |
| 이충범 | 풀스택 개발 | 산책 매칭·GPS 추적, 워커 대시보드, UI 설계, 리뷰·평점 시스템 구현 |
| 하준서 | 풀스택 개발 | AI 건강 분석, 프로필·반려견 건강서류 관리, 알림 시스템 구현 |

---

## 7. 설치 및 실행

```bash
git clone https://github.com/kookmin-sw/2026-capstone-55.git
cd 2026-capstone-55
npm install
npm start
# http://localhost:3000
```

팀페이지: [https://kookmin-sw.github.io/2026-capstone-55/](https://kookmin-sw.github.io/2026-capstone-55/)
