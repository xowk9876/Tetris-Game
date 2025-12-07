# 🎵 테트리스 게임 사운드 파일

이 디렉토리에는 테트리스 게임에 사용되는 사운드 파일들이 들어갑니다.

## 필요한 사운드 파일

다음 사운드 파일들을 이 디렉토리에 추가해주세요:

### 필수 사운드
- `bgm.mp3` 또는 `bgm.wav` - **배경음악** (게임 중 계속 재생, 루프)
- `move.mp3` 또는 `move.wav` - 블록 이동 소리
- `rotate.mp3` 또는 `rotate.wav` - 블록 회전 소리
- `drop.mp3` 또는 `drop.wav` - 블록 낙하/고정 소리
- `line_clear.mp3` 또는 `line_clear.wav` - 줄 제거 소리
- `tetris.mp3` 또는 `tetris.wav` - 테트리스(4줄) 제거 소리
- `game_over.mp3` 또는 `game_over.wav` - 게임 오버 소리

### 선택 사운드
- `hold.mp3` 또는 `hold.wav` - 홀드 소리
- `combo.mp3` 또는 `combo.wav` - 콤보 보너스 소리

## 사운드 파일 추천 사이트

무료 사운드 리소스:
- [Freesound.org](https://freesound.org/) - 무료 사운드 효과
- [Zapsplat](https://www.zapsplat.com/) - 무료 게임 사운드
- [OpenGameArt](https://opengameart.org/) - 오픈소스 게임 리소스

## 파일 형식

- **권장**: MP3 (압축률 좋음) 또는 WAV (고품질)
- **크기**: 효과음 50KB 이하, 배경음악 2MB 이하 권장
- **길이**: 효과음은 0.5초 이하, 배경음악은 루프 가능한 파일 (30초~2분)
- **배경음악**: 8-bit 스타일이나 테트리스 느낌의 반복 가능한 음악 추천

## 사용 방법

1. 위의 사운드 파일들을 이 디렉토리에 추가
2. `game.js`의 사운드 시스템이 자동으로 로드합니다
3. 게임에서 자동으로 재생됩니다

