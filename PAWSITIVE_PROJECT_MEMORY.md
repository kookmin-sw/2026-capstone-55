# Pawsitive Project Memory

Last updated: 2026-05-15  
Workspace: `C:\Users\Peter\Desktop\Pawsitive4`  
Current branch: `feature/chungbeom`  
Local URL: `http://localhost:3000`

## 1. One-line Summary

Pawsitive는 반려견 보호자, 산책 도우미, 전문가, 커뮤니티를 하나의 흐름으로 연결하는 반려견 종합 케어 웹 서비스이다.

핵심은 `산책 매칭 + GPS 위치 확인 + AI 상담/분석 + 전문가 상담 + 품종 도감 + 커뮤니티/스토리 + 알림/DM`이다.

## 2. How to Run

```powershell
npm install
npm start
```

서버는 `server/index.js`에서 실행된다. `package.json` 기준 `start`와 `dev` 모두 `node server/index.js`를 사용한다.

## 3. Current Important Context

- 현재 브랜치: `feature/chungbeom`
- 최근 충범 브랜치 작업물을 받아온 뒤, 여러 UI/기능 개선이 누적된 상태이다.
- 작업 트리는 깨끗하지 않다. 이미 많은 변경 파일과 JSON 데이터 변경이 있으므로 절대 무심코 되돌리지 말 것.
- 방금 생성한 보고서 파일:
  - `수행결과보고서_Pawsitive_작성본.docx`
- 원본 보고서 양식:
  - `양식-수행결과보고서.docx`
- 민감 정보는 파일에 직접 적지 않는다. 관리자 계정/비밀번호는 팀 내부 대화나 환경 파일에서 확인한다.

## 4. Service Map

### Main

- 메인 서비스 섹션은 5개에서 7개로 확장됨.
- 현재 핵심 카드:
  - 산책 매칭
  - GPS 추적
  - AI 건강 상담
  - 교육 센터
  - 품종 정보
  - 전문가 상담
  - AI 건강 분석
- 메인 메시지는 “반려견과 함께하는 더 나은 일상” 계열의 통합 서비스 톤.

### AI Consultation

- 훈련/행동 상담과 건강/증상 상담 탭이 있음.
- 견종, 고민 유형, 나이 등을 받아 AI 상담 흐름 제공.
- 왼쪽/측면에 전문가 매칭 연결 카드가 추가되어, AI 답변만으로 부족한 경우 전문가 상담으로 넘어가도록 설계됨.
- 배경 이미지는 영어 파일명으로 정리했고 부드러운 페이드 처리를 적용한 상태.

### Health

- 반려견별 산책 리듬과 건강 신호를 보여주는 화면.
- 거리, 시간, 칼로리, 산책 횟수 등 활동 데이터 기반으로 건강 분석 UI 제공.
- 로딩 UI는 `pawsitive_loading.mp4`를 활용하도록 개선됨.
- 기존 로딩 영상에 간헐적으로 보이던 얇은 검은 선은 영상/컨테이너 경계 크롭 문제로 보고, 가장 안정적인 방식으로 배경색과 크롭/오버플로우 처리를 맞춘 상태.

### Breed Atlas

- 품종 정보 문구는 약 383~400여 품종 데이터 맥락으로 정리.
- 기존 단순 리스트보다 “품종 탐색 도감” 느낌으로 리디자인됨.
- AI 맞춤 견종 찾기와 품종 탐색 도감 탭이 있음.

### Expert Matching

- 전문가 상담 카드가 메인과 전문가 화면에 연결됨.
- 수의사, 훈련사, 미용사 등 전문가 카테고리 사용.
- 전문가 카드와 메인 전문가 상담 카드에 실제 얼굴 이미지 3명이 적용됨.
- 전문가 등록/검수/관리자 승인 흐름이 있음.
- 전문가 매칭 채팅/상담 데이터는 서버 JSON과 프론트 상태가 섞여 있으므로, 운영 전에는 DB 전환이 필요함.

### Matching / Walk Service

가장 민감하고 중요한 기능 영역이다.

- 요청자와 도우미 양쪽 화면이 존재함.
- 도우미는 ON 상태일 때 산책 요청을 받을 수 있음.
- 요청자는 산책 요청 후 본인이 요청을 보낸 상태인지 명확히 알 수 있도록 상태창이 보강됨.
- 요청 시점의 GPS 위치는 “고정 픽업 지점”으로 사용한다.
- 요청자 위치를 계속 실시간 추적하는 서비스가 아니라, 도우미가 찾아갈 기준점으로 요청 시점 위치를 고정해서 쓰는 방향이다.
- 이 개념을 사용자 친화적으로 설명하는 안내 문구를 매칭 프로세스에 넣어둠.
- 매칭 완료 후 도우미가 “출발하기”를 누르면 진행되는 산책 매칭 프로세스 탭이 양쪽 모두 리디자인됨.
- 도우미/요청자 얼굴을 잘 확인하라는 안전 안내 문구가 양쪽 프로세스에 들어감.
- 실제 개인 얼굴 사진을 등록해야 매칭 서비스를 이용할 수 있다는 프로필 안내가 있음.
- 더미 도우미 7명은 삭제하면 안 됨. 발표용으로 AI 점수 계산과 GPS 지도 마커 시연에 필요함.
- 더미 도우미는 “실제 산책 매칭 프로세스 시연용”이 아니라 “주변 추천/AI 점수/GPS 마커 데모용”으로 유지해야 함.

### Community

- 커뮤니티는 팀원이 만든 구현과 비교하면서 보수적으로 반영하려던 영역.
- 기존 우리 서비스 기능을 없애지 않는 것이 최우선.
- 현재 커뮤니티에는 홈, 탐색, 팔로잉, 내 글, 기록 탭이 있음.
- 게시글 작성에서 사진, 동영상, 산책 경로를 다룰 수 있음.
- 좋아요, 댓글, 팔로우, 저장, 공유 성격의 기능이 있음.
- 인스타그램 스토리 형태의 `커뮤니티 스토리` 기능이 들어감.
- 커뮤니티 알림은 댓글/반응 등에서 생성되고, 누르면 해당 커뮤니티 화면으로 이동하는 흐름을 목표로 함.
- 관련 파일:
  - `js/pages/community.js`
  - `js/pages/community-social.js`
  - `js/pages/community-stories.js`
  - `js/services/communityService.js`
  - `server/data/communityPosts.json`
  - `server/data/communityStories.json`

### Notifications

- 알림은 3분할 구조로 정리하는 요구가 있었음:
  - 공지/관리자
  - 커뮤니티
  - 매칭
- 실제 알림을 눌렀을 때 관련 화면으로 이동해야 함.
- 예: 커뮤니티 댓글 알림 클릭 -> 해당 커뮤니티 흐름으로 이동.
- 관련 파일:
  - `js/core/notifications.js`
  - `js/core/realtime.js`
  - `js/services/realtimeService.js`
  - `server/data/notices.json`

### DM / Chat

- DM 기능 파일이 추가되어 있음:
  - `js/features/dm.js`
  - `server/routes/dm.js`
  - `server/data/dm_*.json`
- 일반 채팅과 전문가/매칭 채팅은 localStorage만으로 끝나는 구조가 아니라, 서버 JSON과 Socket.IO/프론트 상태가 함께 섞여 있음.
- 운영 서비스로 보려면 DB 정규화가 필요하다.

### Profile / Dogs / Documents

- 프로필 등록폼, 반려견 세부사항, 건강 서류 관리폼을 한 흐름으로 통일하는 요구가 있었음.
- 프로필 화면에 실제 얼굴 사진 등록 안내가 들어감:
  - 실제 개인 얼굴이 나오는 사진을 등록해야 매칭 서비스를 이용할 수 있음.
  - 도우미와 요청자가 서로 얼굴을 확인하고 안전하게 매칭된다는 메시지.
- 프로필 UI는 기존보다 자연스럽게 개선하는 방향으로 손봤음.
- 산책 기록 영역은 너무 어수선하지 않게 카드 구조를 정리하는 방향으로 개선됨.

## 5. Architecture

### Frontend

- 정적 SPA 구조.
- 핵심 진입점:
  - `index.html`
  - `js/app.js`
  - `css/styles-modern.css`
- 라우팅은 프론트 해시 라우터 기반.
- 주요 라우트:
  - `/`
  - `/breeds`
  - `/education`
  - `/ai`
  - `/community`
  - `/experts`
  - `/matching`
  - `/health`
  - `/walk-tracking`
  - `/walk-session`
  - `/profile`
  - `/admin`

### Backend

- Node.js + Express 5.x.
- Socket.IO 4.x로 실시간 이벤트 처리.
- 서버 진입점:
  - `server/index.js`
- 주요 라우트:
  - `auth`
  - `email`
  - `ai`
  - `walkers`
  - `data`
  - `walks`
  - `health`
  - `users`
  - `matching`
  - `chat`
  - `walk-requests`
  - `walk-sessions`
  - `walk-chat`
  - `walk-review`
  - `upload`
  - `phone`
  - `experts`
  - `dm`

### Data

- 현재는 서버 JSON 파일과 브라우저 저장소가 섞인 데모 친화 구조.
- 주요 서버 데이터 위치:
  - `server/data/*.json`
- 브라우저 저장소:
  - `localStorage`
  - `sessionStorage`
- 운영 단계에서는 JSON/localStorage 중심 구조를 DB와 파일 스토리지로 전환해야 한다.

## 6. Important Design Direction

- 싸보이거나 AI가 대충 만든 느낌을 피하는 것이 중요함.
- Pawsitive 스타일은 깨끗하고 세련된 반려견 케어 서비스 느낌.
- 과한 강아지 이모지, 장식적 요소, 허술한 카드 UI는 피해야 함.
- 기능은 절대 바꾸지 않고, 사용자가 상태를 더 잘 이해하도록 UI를 정리하는 방향이 좋음.
- 특히 산책 매칭은 “실제 안전 서비스”처럼 보여야 함:
  - 얼굴 확인
  - 픽업 지점 고정
  - 진행 단계 명확화
  - 요청자/도우미 상태 표시
  - 기록 카드 정리

## 7. Known Caveats

- 같은 컴퓨터의 두 브라우저로 GPS를 검증하면 실제 위치 차이를 보기 어렵다.
- 브라우저 위치 권한, HTTPS 여부, 기기 센서 상태에 따라 GPS 기능이 다르게 보일 수 있다.
- 현재 로컬 서버는 `localhost:3000`에서 테스트한다.
- JSON 데이터 파일이 자주 변경되므로 커밋 전에는 발표용 데이터인지, 테스트 중 생긴 찌꺼기인지 구분해야 한다.
- 더미 도우미 데이터는 발표에 필요하므로 무심코 삭제하지 말 것.
- 관리자 계정 정보와 API 키는 문서나 메모리 파일에 평문 저장하지 말 것.

## 8. Recent Changed/Untracked Areas

현재 작업 트리에는 다음 계열 변경이 있다.

- UI/스타일:
  - `css/styles-modern.css`
  - `index.html`
  - `js/app.js`
  - `js/core/ui.js`
- 알림/실시간:
  - `js/core/notifications.js`
  - `js/core/realtime.js`
  - `js/services/realtimeService.js`
  - `server/index.js`
- 산책 매칭:
  - `js/pages/matching.js`
  - `js/features/walkSession.js`
  - `js/features/walkerDashboard.js`
  - `js/services/matchingService.js`
  - `server/data/walkRequests.json`
  - `server/data/walkSessions.json`
  - `server/data/walkers.json`
  - `server/data/walks.json`
- 커뮤니티/스토리:
  - `js/pages/community.js`
  - `js/pages/community-social.js`
  - `js/pages/community-stories.js`
  - `js/services/communityService.js`
  - `server/data/communityPosts.json`
  - `server/data/communityStories.json`
- DM:
  - `js/features/dm.js`
  - `server/routes/dm.js`
  - `server/data/dm_*.json`
- 관리자/전문가/프로필 데이터:
  - `js/pages/admin.js`
  - `server/data/users.json`
  - `server/data/expertProfiles.json`
  - `server/data/expertConsultations.json`
  - `server/data/matchProfiles.json`

## 9. Suggested Next Steps

1. 발표 직전에는 `localhost:3000`에서 메인, 매칭, 커뮤니티, 프로필, 관리자 화면을 한 번씩 직접 클릭 검증한다.
2. 산책 매칭은 요청자/도우미 두 브라우저로 테스트하되, GPS는 같은 PC 한계가 있음을 감안한다.
3. 커뮤니티 스토리와 알림 딥링크는 발표 중 눈에 잘 띄는 기능이므로 시연 데이터를 미리 준비한다.
4. 커밋 전에는 JSON 데이터 변경을 확인해서 발표용 데이터만 남긴다.
5. 운영 서비스 수준으로 확장하려면 DB 전환, 푸시 알림, 개인정보/위치정보 보관 정책, 파일 스토리지 분리가 필요하다.
