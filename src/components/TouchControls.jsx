import React, { useEffect, useRef, useCallback } from 'react'
import './TouchControls.css'
import { createRepeater, createGesture } from '../utils/inputControls.js'

function TouchControls({ gameRef, containerRef, disabled }) {
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  const pointerRef = useRef(null)
  const repeaterRef = useRef(null)
  const act = useCallback(action => {
    if (!disabledRef.current) gameRef.current?.scene?.getScene('TetrisScene')?.executeAction(action)
  }, [gameRef])

  useEffect(() => {
    const repeater = createRepeater(act)
    repeaterRef.current = repeater
    const gesture = createGesture(act)
    const container = containerRef.current
    const cancel = () => { repeater.stop(); gesture.cancel(); pointerRef.current = null }
    const down = event => {
      if (disabledRef.current || event.pointerType === 'mouse' || !event.isPrimary) return
      event.preventDefault()
      container.setPointerCapture(event.pointerId)
      gesture.start(event.pointerId, event.clientX, event.clientY, event.timeStamp)
    }
    const move = event => gesture.move(event.pointerId, event.clientX, event.clientY)
    const up = event => gesture.end(event.pointerId, event.clientX, event.clientY, event.timeStamp)
    const visibility = () => { if (document.hidden) cancel() }
    container.addEventListener('pointerdown', down)
    container.addEventListener('pointermove', move)
    container.addEventListener('pointerup', up)
    container.addEventListener('pointercancel', cancel)
    container.addEventListener('lostpointercapture', cancel)
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      cancel()
      container.removeEventListener('pointerdown', down)
      container.removeEventListener('pointermove', move)
      container.removeEventListener('pointerup', up)
      container.removeEventListener('pointercancel', cancel)
      container.removeEventListener('lostpointercapture', cancel)
      window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', visibility)
      repeaterRef.current = null
    }
  }, [act, containerRef, disabled])

  const repeatProps = action => ({
    disabled,
    onPointerDown: event => {
      if (!event.isPrimary || event.button !== 0 || disabled) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      pointerRef.current = event.pointerId
      repeaterRef.current?.start(action)
    },
    onPointerUp: stopRepeat,
    onPointerCancel: stopRepeat,
    onLostPointerCapture: stopRepeat,
    onClick: event => { if (event.detail === 0) act(action) }
  })
  function stopRepeat(event) {
    if (event.pointerId !== pointerRef.current) return
    repeaterRef.current?.stop()
    pointerRef.current = null
  }

  return (
    <div className="tc-wrap" aria-label="터치 컨트롤" role="group">

      {/* 힌트 */}
      <div className="tc-hint" aria-hidden="true">
        <span className="tc-hint-arrow">←</span>
        <span className="tc-hint-text">캔버스 탭·스와이프 또는 버튼으로 조작</span>
        <span className="tc-hint-arrow">→</span>
      </div>

      <div className="tc-pad">

        {/* ── 왼쪽: ◀ ▶ 큰 이동 버튼 ──────────────────────────── */}
        <div className="tc-zone tc-left">
          <button
            className="tc-btn tc-move"
            {...repeatProps('left')}
            aria-label="왼쪽 이동"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span>LEFT</span>
          </button>

          <button
            className="tc-btn tc-move"
            {...repeatProps('right')}
            aria-label="오른쪽 이동"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
            <span>RIGHT</span>
          </button>
        </div>

        {/* 구분선 */}
        <div className="tc-divider" aria-hidden="true" />

        {/* ── 오른쪽: HOLD / ROTATE / HARD DROP ─────────────── */}
        <div className="tc-zone tc-right">

          {/* 위 행: HOLD + ROTATE */}
          <div className="tc-row">
            <button
              className="tc-btn tc-hold"
              disabled={disabled}
              onClick={() => act('hold')}
              aria-label="홀드"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v4h2V6h4V4zm10 0h-6v2h4v4h2V6c0-1.1-.9-2-2-2zM4 14H2v4c0 1.1.9 2 2 2h6v-2H4v-4zm16 4h-4v2h6v-6h-2v4z"/>
              </svg>
              <span>HOLD</span>
            </button>

            <button
              className="tc-btn tc-rotate"
              disabled={disabled}
              onClick={() => act('rotate')}
              aria-label="회전"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
              </svg>
              <span>ROTATE</span>
            </button>
          </div>

          {/* 아래: HARD DROP 풀폭 */}
          <button
            className="tc-btn tc-hard tc-hard-wide"
            disabled={disabled}
              onClick={() => act('hardDrop')}
            aria-label="하드 드롭 (즉시 낙하)"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 18h16v2H4zm8-16L5.33 10H9v6h6v-6h3.67z"/>
            </svg>
            <span>HARD DROP</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TouchControls
