# 테트리스 사용·운영·업데이트 매뉴얼

기준일: 2026-11-13. 저장소 `xowk9876/Tetris-Game`, Vercel 팀 `xowk9876s-projects`, 프로젝트 `tetrisgame`, 운영 브랜치 `main`.

[운영 사이트](https://tetrisgame-fawn.vercel.app/) · [상세 조작법](https://tetrisgame-fawn.vercel.app/how-to-play.html) · [초보 공략](https://tetrisgame-fawn.vercel.app/tetris-tips.html) · [이번 점검 기록](UPDATE_2026-11-13.md)

## 1. 사용자 조작

| 입력 | 동작 |
| --- | --- |
| ← / → | 좌우 이동 |
| ↑ | 시계 방향 회전, 벽·바닥 보정 |
| ↓ | 빠르게 한 칸씩 낙하 |
| Space | 착지 위치까지 즉시 낙하 |
| C | 홀드, 블록당 한 번 |
| P / 일시정지 버튼 | 정지·재개 |
| 새 게임 | 현재 판 초기화 |
| 조작법 | 게임 정지 후 안내. 닫은 뒤 직접 재개 |

휴대폰은 이동·회전·홀드·하드 드롭 버튼을 사용한다. 이동 버튼은 길게 누를 수 있다. 게임판 탭은 회전, 좌우 밀기는 이동, 위로 밀기는 홀드, 아래로 빠르게 밀기는 하드 드롭이다. 창을 벗어나면 자동 정지한다.

1/2/3/4줄 기본 점수는 40/100/300/1200점이며 콤보·백투백 보너스가 추가된다. 최고 점수와 음소거 설정은 해당 브라우저에 저장한다. 저장소 차단 시 기록은 현재 실행 중에만 유지될 수 있다.

## 2. 설치·실행

**이유:** 운영과 같은 Node.js 24 및 잠금 파일로 재현한다. 경로는 실제 복제 위치에 맞춘다.

```powershell
# 처음 복제할 때만 git clone 실행
Set-Location -LiteralPath 'D:\개발'
git clone https://github.com/xowk9876/Tetris-Game.git
Set-Location -LiteralPath 'D:\개발\Tetris-Game'
node --version
npm.cmd ci
npm.cmd run dev
```

**정상 결과:** Node `v24.x`, 설치 성공, `http://localhost:3000`에 게임 표시.

## 3. 업데이트 선택

**이유:** 취약점과 최신 메이저는 다른 정보다. 고정 버전은 `outdated`의 `wanted`에도 현재 버전이 표시된다.

```powershell
Set-Location -LiteralPath 'D:\개발\Tetris-Game'
git status --short --branch
# 변경이 있으면 별도 커밋/보관한 다음 pull
git pull --ff-only origin main
npm.cmd ci
npm.cmd audit
npm.cmd outdated
npm.cmd view vite@8 version
```

**정상 결과:** 작업 트리 깨끗함, audit 취약점 0건. `outdated`는 새 버전이 있으면 종료 코드 1을 반환한다. 공식 릴리스와 호환성을 검토한 버전만 지정해 설치한다. 예: `npm.cmd install --save-dev --save-exact vite@8.3.8`. `package.json`과 `package-lock.json`을 함께 검토한다.

React 19.3.1·Phaser 4.2.1·Vite 8.3.8 전환을 검증했다. Vite 8은 `rolldownOptions.output.codeSplitting`으로 엔진·React 청크를 분리한다. 최소 브라우저 빌드 대상은 Chrome/Edge 107, Firefox 104, Safari 16으로 유지한다. `npm audit fix --force`는 정기 점검에 사용하지 않는다.

직접 의존성이 최신이어도 하위 패키지는 오래될 수 있다. `npm.cmd outdated --all`로 확인하고 `npm.cmd update`로 호환 범위를 갱신한 뒤 잠금 파일의 실제 버전 변경과 플랫폼별 패키지를 검토한다. 검증은 4절의 전체 명령을 다시 실행한다.

## 4. 배포 전 필수 검증

**이유:** 입력·게임 규칙·정적 HTML 회귀를 push 전에 찾는다.

```powershell
npm.cmd run check
if ($LASTEXITCODE -ne 0) { throw '검증 실패: 배포 중단' }
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'diff 검사 실패' }
git status --short
git diff --stat
git diff
```

**정상 결과:** 게임·씬·저장·입력 테스트 55개와 빌드 후 HTML·검색 테스트 10개 통과(추후 증가 가능), Vite 빌드 성공, 취약점 0건. Phaser 청크 약 1.37MB(압축 약 357kB) 경고는 현재 알려진 크기 경고이며 빌드 실패가 아니다.

`npm.cmd run preview -- --host 127.0.0.1 --port 4173`으로 미리보기한다. 새 게임, 이동·회전·낙하·홀드, 정지/재개, 조작법, 재시작, 음소거 복원, 모바일 버튼을 확인한다. `dist`, `node_modules`, `.env*`, 인증 파일은 커밋하지 않는다. 검색 소유권 변수는 Vercel에서 관리한다.

## 5. GitHub → Vercel 배포

**이유:** 검증한 파일만 운영 main에 반영하고 실제 서비스 커밋을 확인한다.

```powershell
# 실제 수정한 파일만 지정
git add package.json package-lock.json README.md docs/MAINTENANCE.md docs/UPDATE_2026-11-13.md
git diff --cached --check
git diff --cached
git commit -m "chore: 검증된 유지보수 업데이트"
git push origin main
git rev-parse HEAD
```

**정상 결과:** push 성공. Vercel → `xowk9876s-projects` → `tetrisgame` → Deployments에서 해당 SHA의 **Production / READY** 확인. 운영 도메인도 그 배포를 가리켜야 한다. ERROR면 첫 빌드 오류를 수정하고 4절부터 재검증한다.

배포 후 운영 사이트에서 게임 시작·정지·조작법, 브라우저 오류를 확인한다. `/how-to-play.html`, `/tetris-tips.html`, `/sitemap.xml`, `/rss.xml`, `/robots.txt`도 확인한다. READY는 실제 게임 조작 검증을 대신하지 않는다.

## 6. 장애·복구·정기 점검

| 증상 | 확인·대응 | 정상 결과 |
| --- | --- | --- |
| 게임 로딩 실패 | Console/Network 최초 오류와 JS 청크 404 확인 | 게임판 1개, 조작 버튼 활성화 |
| 소리 없음 | 음소거 해제 후 게임 입력, 자동재생 정책 확인 | 사용자 조작 후 재생 |
| 최고 점수 미저장 | 저장소 권한·용량 확인 | 새로고침 후 기록 유지 |
| 배포 실패 | 프로젝트·main SHA·Node 24·Build Logs 확인 | READY |

운영 장애는 Vercel 정상 배포로 **Instant Rollback**한다. 롤백은 이후 자동 운영 도메인 할당을 멈출 수 있으므로 수정 배포를 검증한 뒤 **Promote to Production**으로 복구한다. 코드도 되돌릴 때는 `git revert <실제-문제-커밋-SHA>` → `npm.cmd run check` → push한다. 강제 push로 이력을 지우지 않는다.

매월 audit·호환 패치를 확인한다. 변경마다 4~5절을 수행하며 날짜, 기준/배포 SHA, 테스트·빌드 결과, 운영 확인, 남은 제약을 기록한다. 실제 모바일 기기와 브라우저 화면 크기 모의 검증은 구분한다.

## 7. 오디오 파일·불필요 파일 정리

게임판과 조작은 오디오 다운로드를 기다리지 않고 시작한다. 음소거 상태에서는 소리를 요청하지 않으며, 자동 재생이 차단되면 다음 게임 조작에서 다시 시도한다.

| public/sounds 파일 | 재생 시점 |
| --- | --- |
| bgm.mp3 | 게임 진행 중 반복 재생 |
| drop.wav | 블록 고정 |
| tetris.wav | 한 줄 이상 제거 |
| game_over.wav | 게임 종료 |

이름·형식을 변경하면 `src/utils/gameAudio.js`도 수정한다. 개발용 설명은 `docs`에 두고 `public`에 배포하지 않는다. 실제 공유 이미지는 `public/tetris-game.jpg`다. 코드에서 참조하지 않는 파일도 검색 소유권 확인·외부 서비스에서 사용할 수 있으므로 용도를 확인한 뒤 삭제한다. `dist`는 빌드로 재생성하며 소스·잠금 파일·검색 확인 파일은 보존한다.

## 8. 검색 등록·수집 요청

Google Search Console과 네이버 서치어드바이저에서 HTTPS 운영 주소의 기존 속성을 사용한다.

1. 배포 후 사이트맵의 3개 페이지와 RSS의 가이드 2개가 200 응답인지 확인한다. RSS는 빌드에서 실제 가이드 본문·수정일로 생성한다. 변경하지 않은 글의 날짜는 올리지 않는다.
2. Google → Sitemaps에서 `sitemap.xml`을 제출한다. URL 검사에 홈·조작법·초보 공략 주소를 넣고 필요할 때 색인 생성을 요청한다.
3. 네이버 → 요청 → 사이트맵 제출에서 `sitemap.xml`, RSS 제출에서 전체 `https://tetrisgame-fawn.vercel.app/rss.xml` 주소를 제출한다. 기존 피드는 자동 재방문하므로 재등록을 위해 삭제하지 않는다.
4. 네이버 → 웹 페이지 수집에 홈·조작법·초보 공략 경로를 요청한다. 접수/처리/색인 완료를 구분해서 기록한다.
5. 로그인·보안문자는 계정 소유자가 처리한다. 요청이 접수되어도 수집 시점·색인·검색 순위는 보장되지 않는다. 같은 주소를 반복 요청하지 않는다.

[Google 재수집 안내](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl) · [네이버 피드 안내](https://searchadvisor.naver.com/guide/request-feed)
