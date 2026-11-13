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
npm.cmd view vite@7 version
```

**정상 결과:** 작업 트리 깨끗함, audit 취약점 0건. `outdated`는 새 버전이 있으면 종료 코드 1을 반환한다. 공식 릴리스와 호환성을 검토한 버전만 지정해 설치한다. 예: `npm.cmd install --save-dev --save-exact vite@7.3.8`. `package.json`과 `package-lock.json`을 함께 검토한다.

React 19·Phaser 4·Vite 8 전환은 별도 호환성 작업이다. `npm audit fix --force`는 정기 점검에 사용하지 않는다.

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

**정상 결과:** 게임·씬·저장·입력 테스트 55개와 빌드 후 HTML·검색 테스트 9개 통과(추후 증가 가능), Vite 빌드 성공, 취약점 0건. Phaser 청크 약 1.21MB 경고는 현재 알려진 크기 경고이며 빌드 실패가 아니다.

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

배포 후 운영 사이트에서 게임 시작·정지·조작법, 브라우저 오류를 확인한다. `/how-to-play.html`, `/tetris-tips.html`, `/sitemap.xml`, `/robots.txt`도 확인한다. READY는 실제 게임 조작 검증을 대신하지 않는다.

## 6. 장애·복구·정기 점검

| 증상 | 확인·대응 | 정상 결과 |
| --- | --- | --- |
| 게임 로딩 실패 | Console/Network 최초 오류와 JS 청크 404 확인 | 게임판 1개, 조작 버튼 활성화 |
| 소리 없음 | 음소거 해제 후 게임 입력, 자동재생 정책 확인 | 사용자 조작 후 재생 |
| 최고 점수 미저장 | 저장소 권한·용량 확인 | 새로고침 후 기록 유지 |
| 배포 실패 | 프로젝트·main SHA·Node 24·Build Logs 확인 | READY |

운영 장애는 Vercel 정상 배포로 **Instant Rollback**한다. 롤백은 이후 자동 운영 도메인 할당을 멈출 수 있으므로 수정 배포를 검증한 뒤 **Promote to Production**으로 복구한다. 코드도 되돌릴 때는 `git revert <실제-문제-커밋-SHA>` → `npm.cmd run check` → push한다. 강제 push로 이력을 지우지 않는다.

매월 audit·호환 패치를 확인한다. 변경마다 4~5절을 수행하며 날짜, 기준/배포 SHA, 테스트·빌드 결과, 운영 확인, 남은 제약을 기록한다. 실제 모바일 기기와 브라우저 화면 크기 모의 검증은 구분한다.
