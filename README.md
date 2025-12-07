# 🎮 테트리스 게임 (Tetris Game)

**Phaser 3** 프레임워크로 만든 모던한 테트리스 게임입니다.

![Phaser 3](https://img.shields.io/badge/Phaser-3.70.0-blueviolet)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ 주요 특징

- ⚡ **WebGL 렌더링**: GPU 가속으로 부드러운 60 FPS 성능
- 💎 **네온 사이버펑크 스타일**: 글래스모피즘 UI
- 👻 **고스트 블록**: 블록이 떨어질 위치 미리보기
- 🎯 **홀드 시스템**: 블록을 보관하고 재사용 가능
- 👀 **다음 블록 미리보기**: 전략적 플레이 지원
- 🔢 **콤보 시스템**: 연속 줄 제거 시 누적 보너스
- 🎵 **사운드 시스템**: 배경음악 및 효과음 (선택적)

## 🎮 게임 조작

| 키 | 기능 |
|---|---|
| **← →** | 블록 좌우 이동 |
| **↑** | 블록 회전 |
| **↓** | 소프트 드롭 |
| **Space** | 하드 드롭 |
| **C** | 홀드 |
| **P** | 일시정지/재개 |

## 🎯 점수 시스템

| 줄 제거 | 점수 |
|---------|------|
| 1줄 | 40점 |
| 2줄 | 100점 |
| 3줄 | 300점 |
| 4줄 (테트리스) | 1200점 |

- **콤보 보너스**: 연속 줄 제거 시 (콤보-1) × 50점
- **백투백 테트리스**: 연속 테트리스 시 점수 × 1.5배

## 🚀 시작하기

1. **로컬 서버 실행**
   ```bash
   python -m http.server 8000
   # 또는
   npx serve -p 8000
   ```

2. **브라우저에서 열기**: `http://localhost:8000`

## 🔧 주요 기능

- **속도 조절**: 우측 상단 슬라이더로 낙하 속도 조절
- **HUD 표시**: 줄 수, 점수, 콤보 실시간 표시
- **홀드/다음 블록**: 전략적 플레이 지원
- **일시정지**: P 키로 게임 일시정지/재개

## 📄 라이선스

[MIT License](LICENSE)

---

### 📱 Instagram

<a href="https://www.instagram.com/tae_system/" target="_blank">
  <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" />
</a>

<a href="https://www.instagram.com/tae_system/" target="_blank">
  <img src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/instagram.svg" alt="Instagram" width="32" height="32" style="vertical-align: middle;" /> @tae_system
</a>
