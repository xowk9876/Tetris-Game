import React, { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import TetrisScene from '../utils/gameClassesFull'
import './TetrisGame.css'

function TetrisGame() {
  const gameRef = useRef(null)
  const containerRef = useRef(null)
  const helpModalRef = useRef(null)
  // localStorage에서 초기 오디오 상태 로드
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('tetrisAudioEnabled')
    return saved === null ? true : saved === 'true'
  })

  useEffect(() => {
    if (!containerRef.current) return

    // Phaser 게임 설정
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 900,
      parent: containerRef.current,
      backgroundColor: 'transparent',
      scene: TetrisScene,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
      },
      antialias: true,
      pixelArt: false
    }

    // 게임 시작
    const game = new Phaser.Game(config)
    gameRef.current = game

    // 전역 접근 (기존 코드 호환성)
    window.tetrisGame = game

    // 이벤트 리스너 설정
    const helpBtn = document.getElementById('help-btn')
    const closeHelpBtn = document.getElementById('close-help')
    const newGameBtn = document.getElementById('new-game-btn')
    const giveUpBtn = document.getElementById('give-up-btn')
    const speedSlider = document.getElementById('speed-slider')
    const speedValue = document.getElementById('speed-value')

    // 이벤트 핸들러 함수들 (cleanup을 위해 별도로 정의)
    const handleHelpClick = () => {
      if (helpModalRef.current) {
        helpModalRef.current.classList.add('show')
      }
    }

    const handleCloseHelpClick = () => {
      if (helpModalRef.current) {
        helpModalRef.current.classList.remove('show')
      }
    }

    const handleNewGameClick = () => {
      if (game.scene.scenes[0]) {
        game.scene.scenes[0].newGame()
      }
    }

    const handleGiveUpClick = () => {
      if (game.scene.scenes[0]) {
        const scene = game.scene.scenes[0]
        if (scene.gameState && !scene.gameState.isGameOver) {
          scene.gameState.isGameOver = true
          scene.isRunning = false
          scene.gameOver()
        }
      }
    }

    const handleAudioToggle = () => {
      const scene = game.scene.scenes[0]
      if (!scene) return
      const newState = scene.toggleAudio()
      setAudioEnabled(newState)
    }

    const audioBtn = document.getElementById('audio-toggle-btn')
    if (audioBtn) {
      audioBtn.addEventListener('click', handleAudioToggle)
    }

    const handleSpeedSliderInput = (e) => {
      const speed = parseInt(e.target.value)
      updateSpeedDisplay(speed)
      localStorage.setItem('tetrisFallSpeed', speed.toString())
      
      if (game.scene.scenes[0] && game.scene.scenes[0].gameState) {
        game.scene.scenes[0].gameState.fallSpeed = speed
      }
    }

    function updateSpeedDisplay(speed) {
      if (!speedValue) return
      let label = ''
      if (speed <= 500) {
        label = '매우 빠름'
      } else if (speed <= 700) {
        label = '빠름'
      } else if (speed <= 900) {
        label = '보통'
      } else if (speed <= 1100) {
        label = '느림'
      } else {
        label = '매우 느림'
      }
      speedValue.textContent = label
    }

    // 조작법 모달
    if (helpBtn) {
      helpBtn.addEventListener('click', handleHelpClick)
    }

    if (closeHelpBtn) {
      closeHelpBtn.addEventListener('click', handleCloseHelpClick)
    }

    // 새 게임 버튼
    if (newGameBtn) {
      newGameBtn.addEventListener('click', handleNewGameClick)
    }

    // 게임 포기 버튼
    if (giveUpBtn) {
      giveUpBtn.addEventListener('click', handleGiveUpClick)
    }

    // 속도 조절 슬라이더
    if (speedSlider) {
      const savedSpeed = parseInt(localStorage.getItem('tetrisFallSpeed') || '800')
      speedSlider.value = savedSpeed
      updateSpeedDisplay(savedSpeed)
      speedSlider.addEventListener('input', handleSpeedSliderInput)
    }

    return () => {
      // 이벤트 리스너 제거
      if (helpBtn) {
        helpBtn.removeEventListener('click', handleHelpClick)
      }
      if (closeHelpBtn) {
        closeHelpBtn.removeEventListener('click', handleCloseHelpClick)
      }
      if (newGameBtn) {
        newGameBtn.removeEventListener('click', handleNewGameClick)
      }
      if (giveUpBtn) {
        giveUpBtn.removeEventListener('click', handleGiveUpClick)
      }
      if (audioBtn) {
        audioBtn.removeEventListener('click', handleAudioToggle)
      }
      if (speedSlider) {
        speedSlider.removeEventListener('input', handleSpeedSliderInput)
      }

      // Phaser 게임 정리
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }

      // 전역 변수 정리
      if (window.tetrisGame) {
        delete window.tetrisGame
      }
    }
  }, [])

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
            <span className="logo-text-main">TETRIS</span>
            <span className="logo-text-sub">테트리스</span>
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
          <div className="game-hud">
            <div className="hud-panel">
              <div className="hud-label">줄 수</div>
              <div className="hud-value" id="lines-count">0</div>
            </div>
            
            <div className="hud-panel">
              <div className="hud-label">점수</div>
              <div className="hud-value" id="current-score">0</div>
            </div>
            
            <div className="hud-panel">
              <div className="hud-label">콤보</div>
              <div className="hud-value" id="combo-count">0</div>
            </div>

            <div className="hud-panel hud-panel-best">
              <div className="hud-label">최고 점수</div>
              <div className="hud-value hud-value-best" id="best-score">0</div>
            </div>
          </div>

          <div className="speed-control">
            <div className="speed-control-label">⚡ 낙하 속도</div>
            <div className="speed-slider-container">
              <input 
                type="range" 
                min="400" 
                max="1200" 
                defaultValue="800" 
                step="50" 
                className="speed-slider" 
                id="speed-slider"
              />
              <div className="speed-value" id="speed-value">보통</div>
            </div>
          </div>
        </div>

        <div ref={containerRef} id="game-container" />

        <div className="game-controls">
          <button className="control-btn primary-btn" id="new-game-btn">
            🎮 새 게임
          </button>
          <button className="control-btn secondary-btn" id="help-btn">
            ❓ 조작법
          </button>
          <button className="control-btn danger-btn" id="give-up-btn">
            🚫 게임 포기
          </button>
        </div>
      </div>

      <div ref={helpModalRef} id="help-modal" className="help-modal">
        <div className="help-modal-content">
          <h2>🎮 조작법</h2>
          <div className="help-content">
            <p><strong>← →</strong> : 좌우 이동</p>
            <p><strong>↑</strong> : 블록 회전</p>
            <p><strong>↓</strong> : 소프트 드롭 (빠른 낙하)</p>
            <p><strong>Space</strong> : 하드 드롭 (즉시 낙하)</p>
            <p><strong>C</strong> : 홀드 (블록 보관)</p>
            <p><strong>P</strong> : 일시정지</p>
          </div>
          <button id="close-help" className="close-help-btn">닫기</button>
        </div>
      </div>
    </div>
  )
}

export default TetrisGame
