# 🎮 테트리스 게임 (Tetris Game)

**React + Phaser 3 + Vite**로 만든 모던한 테트리스 게임입니다.

<div align="center">

## 🚀 체험해보기

<a href="https://tetrisgame-fawn.vercel.app/" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/🎮_지금_체험해보기-00D4FF?style=for-the-badge&logo=vercel&logoColor=white&labelColor=000011" alt="Play Now" />
</a>

</div>

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Phaser 3](https://img.shields.io/badge/Phaser-3.70.0-blueviolet)
![Vite](https://img.shields.io/badge/Vite-5.4.21-646CFF)
![Version](https://img.shields.io/badge/Version-1.2.0-green)

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
- ⚙️ **속도 조절**: 실시간 낙하 속도 조절 기능

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 🎮 게임 조작

| 키 | 기능 |
|---|---|
| **← →** | 블록 좌우 이동 |
| **↑** | 블록 회전 |
| **↓** | 소프트 드롭 (빠른 낙하) |
| **Space** | 하드 드롭 (즉시 낙하) |
| **C** | 홀드 (블록 보관) |
| **P** | 일시정지/재개 |

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
Tetris-Game-main/
├── src/
│   ├── components/
│   │   ├── Background.jsx      # 우주 배경 컴포넌트
│   │   ├── Background.css      # 배경 스타일
│   │   ├── TetrisGame.jsx      # 메인 게임 컴포넌트
│   │   └── TetrisGame.css      # 게임 스타일
│   ├── utils/
│   │   ├── gameConfig.js       # 게임 설정
│   │   └── gameClassesFull.js  # 게임 클래스 및 Phaser 씬
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

- **프레임워크**: React 18.2.0
- **게임 엔진**: Phaser 3.70.0
- **빌드 도구**: Vite 5.4.21
- **배경 렌더링**: HTML5 Canvas
- **게임 렌더링**: WebGL (GPU 가속)
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
- **속도 조절**: 슬라이더로 낙하 속도 조절 (400ms ~ 1200ms)
- **HUD 표시**: 줄 수, 점수, 콤보 실시간 표시
- **홀드/다음 블록**: 전략적 플레이 지원
- **일시정지**: P 키로 게임 일시정지/재개
- **SRS 회전 시스템**: 현대 테트리스 표준 회전 규칙 (벽 킥 지원)
- **7-Bag 시스템**: 공정한 블록 분배 시스템

## 📝 업데이트 내역

### v1.2.0 (최신)
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

[![Instagram](https://img.shields.io/badge/Instagram-@tae__system-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/tae_system/)

**Copyright © 2026 Tae-System**

</div>
