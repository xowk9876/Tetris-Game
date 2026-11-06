import React, { useEffect, useRef, useState } from 'react'
import TouchControls from './TouchControls'
import './TetrisGame.css'

function TetrisGame() {
  const gameRef = useRef(null)
  const containerRef = useRef(null)
  const helpModalRef = useRef(null)
  const [status, setStatus] = useState({ ready: false, score: 0, lines: 0, combo: 0,
    best: 0, paused: false, gameOver: false, locking: false, audioEnabled: true })
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [bootError, setBootError] = useState(false)
  const { audioEnabled } = status
  const scene = () => gameRef.current?.scene?.getScene('TetrisScene')
  const focusBoard = () => containerRef.current?.focus({ preventScroll: true })

  useEffect(() => {
    const mq = window.matchMedia('(any-pointer: coarse), (max-width: 768px), (max-width: 900px) and (max-height: 500px)')
    const update = () => setIsTouchDevice(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let game
    let disposed = false
    const receiveState = snapshot => setStatus(current => ({ ...current, ...snapshot }))
    async function startGame() {
      const [{ default: Phaser }, { default: TetrisScene }] = await Promise.all([
        import('phaser'),
        import('../utils/gameClassesFull.js'),
      ])
      if (disposed) return
      game = new Phaser.Game({
        type: Phaser.AUTO, width: 800, height: 900, parent: containerRef.current,
        transparent: true, scene: TetrisScene, antialias: true, audio: { noAudio: true },
        callbacks: {
          preBoot: instance => instance.events.on('tetris-state', receiveState),
          postBoot: instance => {
            instance.canvas.setAttribute('aria-label', '테트리스 게임판. 터치와 키보드 사용법은 조작법 버튼에서 확인하세요.')
            instance.canvas.setAttribute('role', 'img')
          }
        }
      })
      gameRef.current = game
    }
    startGame().catch(() => { if (!disposed) setBootError(true) })
    return () => {
      disposed = true
      game?.events.off('tetris-state', receiveState)
      game?.destroy(true)
      gameRef.current = null
    }
  }, [])

  const openHelp = () => {
    const current = scene()
    current?.setPaused(true)
    if (current) current.helpOpen = true
    setHelpOpen(true)
    helpModalRef.current?.showModal()
  }
  const closeHelp = () => {
    const current = scene()
    if (current) current.helpOpen = false
    setHelpOpen(false)
    focusBoard()
  }
  const runControl = action => {
    const current = scene()
    if (action === 'new') current?.newGame()
    if (action === 'pause') current?.executeAction('pause')
    if (action === 'quit') current?.gameOver()
    focusBoard()
  }

  return (
    <div className="tetris-game-wrapper">
      <div className="tetris-game-container">

        {/* 게임 로고 배너 */}
        <div className="game-logo-bar">
          <div className="game-logo-icon" aria-hidden="true">
            <svg viewBox="0 0 52 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0"  y="0" width="15" height="15" rx="3" fill="#00f5ff"/>
              <rect x="0"  y="0" width="15" height="5"  rx="3" fill="white" opacity="0.3"/>
              <rect x="18" y="0" width="15" height="15" rx="3" fill="#00f5ff"/>
              <rect x="18" y="0" width="15" height="5"  rx="3" fill="white" opacity="0.3"/>
              <rect x="36" y="0" width="15" height="15" rx="3" fill="#00f5ff"/>
              <rect x="36" y="0" width="15" height="5"  rx="3" fill="white" opacity="0.3"/>
              <rect x="18" y="17" width="15" height="15" rx="3" fill="#00f5ff"/>
              <rect x="18" y="17" width="15" height="5"  rx="3" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <h1 className="game-logo-title">
            <span className="logo-text-main">TETRIS</span>{' '}
            <span className="logo-text-sub">PC·모바일 테트리스 게임</span>
          </h1>
          <div className="game-logo-icon logo-icon-right" aria-hidden="true">
            <svg viewBox="0 0 34 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0"  y="0"  width="15" height="15" rx="3" fill="#ff6b9d"/>
              <rect x="0"  y="0"  width="15" height="5"  rx="3" fill="white" opacity="0.3"/>
              <rect x="0"  y="18" width="15" height="15" rx="3" fill="#ff6b9d"/>
              <rect x="0"  y="18" width="15" height="5"  rx="3" fill="white" opacity="0.3"/>
              <rect x="18" y="18" width="15" height="15" rx="3" fill="#ff6b9d"/>
              <rect x="18" y="18" width="15" height="5"  rx="3" fill="white" opacity="0.3"/>
              <rect x="0"  y="36" width="15" height="15" rx="3" fill="#ff6b9d"/>
              <rect x="0"  y="36" width="15" height="5"  rx="3" fill="white" opacity="0.3"/>
            </svg>
          </div>

          {/* 오디오 ON/OFF 토글 버튼 */}
          <button
            id="audio-toggle-btn"
            onClick={event => {
              scene()?.toggleAudio()
              if (event.detail > 0) focusBoard()
            }}
            disabled={!status.ready}
            aria-pressed={audioEnabled}
            className={`audio-toggle-btn${audioEnabled ? '' : ' muted'}`}
            title={audioEnabled ? '오디오 끄기' : '오디오 켜기'}
            aria-label={audioEnabled ? '오디오 끄기' : '오디오 켜기'}
          >
            {audioEnabled ? (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
                <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>

        <div className="game-header">
          <div className="game-hud" data-nosnippet="">
            <div className="hud-panel">
              <div className="hud-label">줄 수</div>
              <div className="hud-value" id="lines-count">{status.lines}</div>
            </div>
            
            <div className="hud-panel">
              <div className="hud-label">점수</div>
              <div className="hud-value" id="current-score">{status.score.toLocaleString()}</div>
            </div>
            
            <div className="hud-panel">
              <div className="hud-label">콤보</div>
              <div className="hud-value" id="combo-count">{status.combo}</div>
            </div>

            <div className="hud-panel hud-panel-best">
              <div className="hud-label">최고 점수</div>
              <div className="hud-value hud-value-best" id="best-score">{status.best.toLocaleString()}</div>
            </div>
          </div>

        </div>

        <div className="game-status">
          <span role="status" aria-live="polite" data-nosnippet="">
            {bootError ? '게임을 불러오지 못했어요. 페이지를 새로고침해 주세요.' : !status.ready ? '게임 불러오는 중…' : status.gameOver ? '게임 종료 · 새 게임으로 다시 시작하세요.' : status.paused ? '일시정지 · 계속하기를 눌러 재개하세요.' : '게임 진행 중'}
          </span>
          <a href="/how-to-play.html" target="_blank" rel="noopener" aria-label="테트리스 조작법·점수표 (새 탭)">테트리스 조작법·점수표</a>
        </div>
        <div ref={containerRef} id="game-container" tabIndex={0} aria-label="테트리스 게임 조작 영역" />

        {/* 터치 기기와 작은 화면의 컨트롤 */}
        {isTouchDevice && <TouchControls gameRef={gameRef} containerRef={containerRef} disabled={!status.ready || status.paused || status.gameOver || status.locking || helpOpen} />}

        <div className="game-controls">
          <button className="control-btn primary-btn" id="new-game-btn" disabled={!status.ready} onClick={() => runControl('new')}>
            🎮 새 게임
          </button>
          <button className="control-btn secondary-btn" id="pause-btn" disabled={!status.ready || status.gameOver} onClick={() => runControl('pause')}>
            {status.paused ? '▶ 계속하기' : 'Ⅱ 일시정지'}
          </button>
          <button className="control-btn secondary-btn" id="help-btn" disabled={!status.ready} onClick={openHelp}>
            ❓ 조작법
          </button>
          <button className="control-btn danger-btn" id="give-up-btn" disabled={!status.ready || status.gameOver} onClick={() => runControl('quit')}>
            🚫 게임 포기
          </button>
        </div>
      </div>

      <dialog ref={helpModalRef} id="help-modal" className="help-modal" aria-labelledby="help-title" onClose={closeHelp}>
        <div className="help-modal-content">
          <h2 id="help-title">🎮 조작법</h2>
          <div className="help-content">
            <p>블록을 돌리고 옮겨 가로 한 줄을 빈틈없이 채우면 줄이 사라지고 점수를 얻어요. 블록의 착지 위치는 윤곽선으로 확인할 수 있어요.</p>
            <p><strong>← →</strong> : 좌우 이동</p>
            <p><strong>↑</strong> : 블록 회전</p>
            <p><strong>↓</strong> : 소프트 드롭 (빠른 낙하)</p>
            <p><strong>Space</strong> : 하드 드롭 (즉시 낙하)</p>
            <p><strong>C</strong> : 홀드 (블록 보관)</p>
            <p><strong>P</strong> : 일시정지 / 계속하기</p>
            <h3>휴대폰 · 태블릿</h3>
            <p>화면 아래 이동 버튼을 길게 누르면 반복해서 움직여요. <a href="/how-to-play.html#mobile-controls" target="_blank" rel="noopener" aria-label="터치 버튼 그림 보기 (새 탭)">터치 버튼 그림 보기</a></p>
            <p>게임판 탭: 회전 · 좌우 밀기: 이동 · 위로 밀기: 홀드 · 아래로 빠르게 밀기: 즉시 낙하</p>
            <p>홀드는 블록 하나당 한 번 사용할 수 있어요. 조작법을 닫은 뒤 계속하기를 누르면 게임이 재개됩니다.</p>
          </div>
          <button id="close-help" className="close-help-btn" onClick={() => helpModalRef.current?.close()}>닫기</button>
        </div>
      </dialog>
    </div>
  )
}

export default TetrisGame
