# 🎮 테트리스 게임 (Tetris Game)

**React + Phaser 4 + Vite**로 만든 모던한 테트리스 게임입니다.

<div align="center">

## 🚀 체험해보기

<a href="https://tetrisgame-fawn.vercel.app/" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/🎮_지금_체험해보기-00D4FF?style=for-the-badge&logo=vercel&logoColor=white&labelColor=000011" alt="Play Now" />
</a>

</div>

<div align="center">

![React](https://img.shields.io/badge/React-19.3.1-blue)
![Phaser 4](https://img.shields.io/badge/Phaser-4.2.1-blueviolet)
![Vite](https://img.shields.io/badge/Vite-8.3.8-646CFF)

</div>

## ✨ 주요 특징

- ⚡ **React + Vite**: 빠른 개발 환경과 빌드
- 🌌 **우주 테마 배경**: Canvas 기반 동적 파티클 시스템 (성능 최적화)
- 💎 **블록 렌더링**: 하이라이트와 테두리로 선명한 블록
- 🎆 **줄 제거 효과**: SINGLE, DOUBLE, TRIPLE, TETRIS! 메시지 표시
- 👻 **고스트 블록**: 블록이 떨어질 위치 미리보기
- 🎯 **홀드 시스템**: 블록을 보관하고 재사용 가능
- 👀 **다음 블록 미리보기**: 전략적 플레이 지원
- 🔢 **콤보 시스템**: 연속 줄 제거 시 누적 보너스
- 🎵 **사운드 시스템**: 배경음악 및 효과음
- 📱 **터치 조작**: 버튼과 게임판 제스처, 일시정지/재개
- 💾 **최고 점수**: 브라우저에 저장 (저장 권한이 없으면 현재 실행 중에만 유지)

## 🚀 시작하기

Node.js 24를 사용합니다. Windows PowerShell에서는 `npm` 대신 `npm.cmd`를 사용하세요.

### 설치

```bash
npm.cmd ci
```

### 개발 서버 실행

```bash
npm.cmd run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

### 테스트 및 프로덕션 빌드

```bash
npm.cmd run check
```

`check`는 회귀 테스트 → Vite 빌드 → 정적 HTML·검색 회귀 테스트 → 의존성 보안 검사를 실행합니다. Vercel의 `npm run build`도 `prebuild`에서 테스트를 먼저 실행합니다. 테스트 실패 시 배포 빌드가 중단됩니다.

- [운영·업데이트 매뉴얼](docs/MAINTENANCE.md): 조작법, 점검, Windows 명령, 배포 확인, 복구
- [2026-11-13 점검·업데이트 기록](docs/UPDATE_2026-11-13.md)

빌드된 파일은 `dist/` 폴더에 생성됩니다.

홈 화면은 빌드 시 HTML로도 생성됩니다. 조작법은 `/how-to-play.html`, 초보 공략은 `/tetris-tips.html`이며, 세 페이지는 `/sitemap.xml`에 포함됩니다. Google Search Console이나 네이버 서치어드바이저의 HTML 태그로 소유권을 확인할 때는 발급받은 `content` 값만 Vercel 환경 변수 `GOOGLE_SITE_VERIFICATION` 또는 `NAVER_SITE_VERIFICATION`에 넣고 다시 빌드하세요.

## 🎮 게임 조작

| 키 | 기능 |
|---|---|
| **← →** | 블록 좌우 이동 |
| **↑** | 블록 회전 |
| **↓** | 소프트 드롭 (빠른 낙하) |
| **Space** | 하드 드롭 (즉시 낙하) |
| **C** | 홀드 (블록 보관) |
| **P** | 일시정지/재개 |

휴대폰에서는 화면 아래 버튼을 사용합니다. 이동 버튼을 길게 누르면 반복 이동합니다.
게임판 탭은 회전, 좌우 밀기는 이동, 위로 밀기는 홀드입니다. 아래로 빠르게 밀면 즉시 낙하하고 천천히 밀면 한 칸 내려갑니다. 홀드는 블록당 한 번 가능합니다.

## 🎯 점수 시스템

| 줄 제거 | 점수 |
|---------|------|
| 1줄 (SINGLE) | 40점 |
| 2줄 (DOUBLE) | 100점 |
| 3줄 (TRIPLE) | 300점 |
| 4줄 (TETRIS!) | 1200점 |

- **콤보 보너스**: 연속 줄 제거 시 (콤보-1) × 50점
- **백투백 테트리스**: 연속 테트리스 시 점수 × 1.5배

## 📁 프로젝트 구조

```
Tetris-Game/
├── src/
│   ├── components/
│   │   ├── Background.jsx      # 우주 배경 컴포넌트
│   │   ├── Background.css      # 배경 스타일
│   │   ├── TetrisGame.jsx      # 메인 게임 컴포넌트
│   │   ├── TouchControls.jsx   # 터치 조작 버튼
│   │   └── TetrisGame.css      # 게임 스타일
│   ├── utils/
│   │   ├── gameConfig.js       # 게임 설정
│   │   ├── gameEngine.js       # 브라우저와 독립된 게임 규칙
│   │   ├── gameAudio.js        # 오디오 재생과 음소거
│   │   ├── inputControls.js    # 반복 입력과 제스처
│   │   ├── storage.js          # 안전한 환경 설정/최고 점수 저장
│   │   └── gameClassesFull.js  # 렌더러 및 Phaser 씬
│   ├── styles/
│   │   ├── index.css           # 전역 스타일
│   │   └── App.css             # 앱 스타일
│   ├── App.jsx                 # 루트 컴포넌트
│   └── main.jsx                # 진입점
├── public/
│   └── sounds/                 # 사운드 파일
├── index.html                  # HTML 템플릿
├── package.json                # 의존성
├── vite.config.js              # Vite 설정
└── README.md                   # 이 파일
```

## 🛠 기술 스택

- **프레임워크**: React 19.3.1
- **게임 엔진**: Phaser 4.90.0
- **빌드 도구**: Vite 8.3.8
- **배경 렌더링**: HTML5 Canvas
- **게임 렌더링**: Phaser AUTO (WebGL 지원 시 사용, 아니면 Canvas)
- **스타일링**: CSS3

## 🌌 우주 테마 배경

Canvas 기반 동적 파티클 시스템으로 구현된 우주 배경:

- **150개의 별**: 정적 렌더링으로 성능 최적화
- **3개의 유성**: 그라데이션 꼬리 효과
- **3개의 성운**: 방사형 그라데이션
- **15개의 테트리스 블록 파티클**: 회전 애니메이션
- **프레임 스킵**: 매 3프레임마다 업데이트하여 성능 향상

## 🔧 주요 기능

### 게임 기능
- **낙하 속도**: 기본 800ms, 아래 방향키로 빠르게 낙하 (속도 슬라이더 없음)
- **HUD 표시**: 줄 수, 점수, 콤보 실시간 표시
- **홀드/다음 블록**: 전략적 플레이 지원
- **일시정지**: P 키 또는 버튼. 조작법을 열거나 창을 벗어나면 자동 정지하며 직접 재개합니다.
- **회전**: 시계 방향 SRS 벽·바닥 보정 (I 블록 별도 규칙)
- **7-Bag 시스템**: 공정한 블록 분배 시스템

## 📝 업데이트 내역

### 2026-10-31 안정성 점검
- 여러 줄을 동시에 제거할 때 남은 블록이 삭제되던 오류 수정
- 홀드 교환 시 생성 위치 충돌 판정, 줄 제거 중 재시작 상태 초기화
- 게임 엔진과 Phaser 렌더링·오디오·저장소 분리
- 회전 보정, 균일한 7-Bag 섞기, 새 블록의 낙하 타이머 초기화
- 취소된 터치 입력과 반복 타이머 정리, 모바일 일시정지 및 조작법 접근성 보완
- 음소거 유지, 손상되거나 차단된 저장소 처리, 없는 오디오·아이콘 요청 제거
- 게임·저장·입력 회귀 테스트 및 배포 전 자동 검사 추가

### v1.2.0
- ⚡ **대규모 성능 최적화**
  - 배경 파티클 75% 감소 (700+ → 170개)
  - O(n²) 연결선 계산 제거
  - 렌더러 더티 플래그 패턴 적용
  - 프레임 스킵 적용 (매 3프레임당 1회 업데이트)
  - CSS 애니메이션 정적 렌더링으로 전환
- 🐛 **버그 수정**
  - 라인 클리어 중 블록 중복 생성 버그 수정
  - 라인 클리어 후 다음 블록 바뀌는 버그 수정
  - 렌더링 캐싱 버그 수정
  - `impactIntensity` 미정의 오류 수정
- 🎨 **UI 개선**
  - 줄 제거 효과 간소화
  - 블록 스타일 최적화

### v1.1.0
- 🌌 화려한 우주 배경 추가
- 🎆 줄 제거 효과 (SINGLE, DOUBLE, TRIPLE, TETRIS!)
- 🔢 콤보 시스템
- 🎵 사운드 시스템

### v1.0.0
- 🎮 기본 테트리스 게임 구현
- 👻 고스트 블록
- 🎯 홀드 시스템
- ⚙️ 속도 조절

## 📄 라이선스

[MIT License](LICENSE)

---

<div align="center">

### 🔎 방문

[![Instagram](https://img.shields.io/badge/Instagram-@tae_system-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/tae_system/)

**Copyright © 2026 Tae-System**

</div>
