# 🎮 테트리스 게임 (Tetris Game) - Phaser 3 Edition

**Phaser 3 프레임워크** 기반의 모던한 테트리스 게임입니다. 클래식 테트리스의 재미를 유지하면서 현대적인 UI/UX를 제공합니다.

![Phaser 3](https://img.shields.io/badge/Phaser-3.70.0-blueviolet)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![WebGL](https://img.shields.io/badge/WebGL-990000?logo=webgl&logoColor=white)

## ✨ 주요 특징

### 🎨 **모던한 비주얼 디자인**
- ⚡ **WebGL 렌더링**: GPU 가속으로 부드러운 60 FPS 성능
- 💎 **고품질 블록 디자인**: 그림자, 하이라이트, 글로우 효과
- 🌟 **네온 사이버펑크 스타일**: 글래스모피즘 UI
- 👻 **고스트 블록**: 블록이 떨어질 위치 미리보기

### 🎯 **정확한 게임 메커니즘**
- ✅ **줄 제거 시에만 점수 획득**: 블록 낙하만으로는 점수 없음
- 📊 **공정한 점수 시스템**: 현실적이고 밸런스 잡힌 점수
- 🎲 **7-Bag 시스템**: 공정한 블록 분배
- 🔄 **SRS 회전 시스템**: 벽 킥 지원

### 🎮 **완전한 테트리스 기능**
- 🎯 **홀드 시스템**: 블록을 보관하고 재사용 가능
- 👀 **다음 블록 미리보기**: 전략적 플레이 지원
- 🔢 **콤보 시스템**: 연속 줄 제거 시 누적 보너스
- 💥 **백투백 테트리스**: 연속 테트리스 시 추가 보너스

### 🎵 **사운드 시스템**
- 🎶 **배경음악**: 게임 중 계속 재생되는 루프 음악 (선택)
- 🔊 **효과음**: 줄 제거, 테트리스 등 액션별 사운드 (선택)
- 📦 **선택적 사운드**: 사운드 파일이 없어도 게임 정상 작동

## 🎮 게임 방법

### 기본 조작

| 키 | 기능 |
|---|---|
| **← →** | 블록 좌우 이동 |
| **↑** | 블록 회전 (시계 방향) |
| **↓** | 소프트 드롭 (빠른 낙하) |
| **Space** | 하드 드롭 (즉시 낙하) |
| **C** | 홀드 (블록 보관/교환) |
| **P** | 일시정지/재개 |

### 게임 목표
가로 줄을 완성하여 제거하고 최대한 오래 생존하며 높은 점수를 달성하세요.

## 🎯 점수 시스템

### 기본 점수
| 줄 제거 | 점수 | 설명 |
|---------|------|------|
| 1줄 | **40점** | 기본 점수 |
| 2줄 | **100점** | 2.5배 보너스 |
| 3줄 | **300점** | 7.5배 보너스 |
| 4줄 (테트리스) | **1200점** | 30배 보너스! |

### 보너스 시스템
- **콤보 보너스**: 연속 줄 제거 시 (콤보-1) × 50점
- **백투백 테트리스**: 연속 테트리스 시 점수 × 1.5배

**⚠️ 중요**: 줄을 제거해야만 점수 획득 (블록 낙하만으로는 점수 없음)

## 🚀 시작하기

### 요구사항
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- WebGL 지원

### 실행 방법

1. **로컬 서버 실행**
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve -p 8000
   ```

2. **브라우저에서 열기**: `http://localhost:8000`

## 🏗️ 프로젝트 구조

```
web-Tetris/
│
├── index.html          # HTML 구조 및 UI
├── game.js             # 테트리스 게임 로직
├── styles.css          # 추가 스타일
├── README.md           # 프로젝트 문서
├── TETRIS_GAME_DESIGN.md  # 게임 기획서
└── sounds/             # 사운드 파일 디렉토리
    ├── README.md       # 사운드 파일 가이드
    ├── bgm.mp3         # 배경음악
    ├── drop.wav        # 블록 낙하 효과음
    ├── game_over.wav   # 게임 오버 효과음
    └── tetris.wav      # 테트리스 효과음
```

## 🎨 기술 스택

- **Phaser 3.70.0**: 게임 엔진 (WebGL 렌더링)
- **7-Bag 블록 생성**: 공정한 블록 분배
- **SRS 회전 시스템**: 벽 킥 지원
- **Local Storage**: 최고 점수 및 속도 설정 저장


## 🎯 게임 팁

- **홀드 활용**: C 키로 블록 보관 및 재사용
- **다음 블록 확인**: 미리보기로 전략 수립
- **고스트 블록**: 블록 낙하 위치 미리 확인
- **테트리스 노리기**: 4줄 한 번에 제거 시 최고 점수
- **콤보 시스템**: 연속 줄 제거 시 누적 보너스
- **속도 조절**: 우측 상단 슬라이더로 실시간 조절

## 🔧 주요 기능

- **속도 조절 UI**: 우측 상단 슬라이더 (400ms ~ 1200ms, 자동 저장)
- **사운드 시스템**: 배경음악 및 효과음 (선택적, 파일 없어도 정상 작동)
- **게임 포기**: 언제든지 게임 종료 가능
- **일시정지**: P 키로 게임 일시정지/재개

## 📱 브라우저 지원

Chrome, Firefox, Safari, Edge (WebGL 필요)

**제한사항:**
- 모바일 터치 이벤트 미지원 (키보드 전용)
- 오프라인 모드 미지원 (Phaser CDN 필요)

## 🔜 향후 개발 계획

- [ ] 모바일 터치 지원
- [ ] 레벨 시스템 (속도 점진적 증가)
- [ ] 다양한 게임 모드
- [ ] 사운드 볼륨 조절 UI

## 📝 변경 로그

### v3.1.0 (최신)
- ⚙️ 속도 조절 UI 추가 (우측 상단)
- 🎮 게임 포기 기능 추가
- 🎨 UI 개선: HUD 간소화 (점수, 최고점수, 콤보만 표시)
- 📐 보드 중앙 정렬
- 🎯 일시정지 화면 개선
- 🎨 홀드/다음 블록 패널 크기 통일
- 🔧 사운드 시스템 개선 및 오류 수정

## 📄 라이선스

이 프로젝트는 오픈소스이며 [MIT License](LICENSE) 하에 제공됩니다.

## 🎉 즐기세요!

테트리스 게임을 즐겨주세요! 버그 리포트나 기능 제안은 Issues에 남겨주세요.

**💡 팁: 줄을 완성해야만 점수를 얻을 수 있습니다! 전략적으로 플레이하세요!**

---

Made with ❤️ and Phaser 3

---

### 📱 Connect with me

<a href="https://www.instagram.com/tae_system/" target="_blank">
  <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" />
</a>

<a href="https://www.instagram.com/tae_system/" target="_blank">
  <img src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/instagram.svg" alt="Instagram" width="32" height="32" style="vertical-align: middle;" /> @tae_system
</a>
