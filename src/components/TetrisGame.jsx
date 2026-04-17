import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import TetrisScene from '../utils/gameClassesFull'
import './TetrisGame.css'

function TetrisGame() {
  const gameRef = useRef(null)
  const containerRef = useRef(null)
  const helpModalRef = useRef(null)

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

