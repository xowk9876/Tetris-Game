import React, { useEffect, useRef, useCallback } from 'react'
import './TouchControls.css'

// ── 테트리스 가이드라인 기준 DAS / ARR ──────────────────────────────────
const DAS_MS = 133
const ARR_MS = 33

// ── 스와이프 감도 ─────────────────────────────────────────────────────────
const SWIPE_CELL_PX = 26
const FLICK_VY_FAST = 0.75
const SWIPE_MIN_Y   = 55
const TAP_MAX_MOVE  = 14
const TAP_MAX_MS    = 260

function TouchControls({ gameRef }) {
  const dasRef = useRef(null)
  const arrRef = useRef(null)
  const swipe  = useRef({
    active: false,
    startX: 0, startY: 0,
    lastX: 0,  lastY: 0,
    startTime: 0,
    accX: 0,
    hasMoved: false,
  })

  const act = useCallback((action) => {
    const scene = gameRef.current?.scene?.scenes?.[0]
    if (!scene) return
    scene.executeAction(action)
  }, [gameRef])

  const vib = (pattern) => {
    try { navigator.vibrate?.(pattern) } catch (_) {}
  }

  // ── DAS/ARR 좌우 반복 ─────────────────────────────────────────────────
  const startRepeat = useCallback((action) => {
    act(action)
    vib(8)
    clearTimeout(dasRef.current)
    clearInterval(arrRef.current)
    dasRef.current = setTimeout(() => {
      arrRef.current = setInterval(() => act(action), ARR_MS)
    }, DAS_MS)
  }, [act])

  const stopRepeat = useCallback(() => {
    clearTimeout(dasRef.current)
    clearInterval(arrRef.current)
  }, [])

  // ── 캔버스 스와이프 제스처 ────────────────────────────────────────────
  useEffect(() => {
    let canvas = null
    let retryId = null

    function attach() {
      const container = document.getElementById('game-container')
      if (!container) { retryId = setTimeout(attach, 150); return }
      canvas = container.querySelector('canvas') || container
      canvas.style.touchAction = 'none'
      canvas.addEventListener('touchstart',  onStart,  { passive: false })
      canvas.addEventListener('touchmove',   onMove,   { passive: false })
      canvas.addEventListener('touchend',    onEnd,    { passive: false })
      canvas.addEventListener('touchcancel', onEnd,    { passive: false })
    }

    function onStart(e) {
      e.preventDefault()
      const t = e.touches[0], s = swipe.current
      s.active = true
      s.startX = s.lastX = t.clientX
      s.startY = s.lastY = t.clientY
      s.startTime = performance.now()
      s.accX = 0; s.hasMoved = false
    }

    function onMove(e) {
      e.preventDefault()
      const s = swipe.current
      if (!s.active) return
      const t = e.touches[0]
      const dx      = t.clientX - s.lastX
      const totalDx = Math.abs(t.clientX - s.startX)
      const totalDy = Math.abs(t.clientY - s.startY)

      if (totalDx > totalDy * 0.9) {
        s.accX += dx
        while (Math.abs(s.accX) >= SWIPE_CELL_PX) {
          act(s.accX > 0 ? 'right' : 'left')
          s.accX -= Math.sign(s.accX) * SWIPE_CELL_PX
          if (!s.hasMoved) { vib(6); s.hasMoved = true }
        }
      }
      s.lastX = t.clientX; s.lastY = t.clientY
    }

    function onEnd(e) {
      e.preventDefault()
      const s = swipe.current
      if (!s.active) return
      s.active = false
      const t = e.changedTouches[0]
      const dx = t.clientX - s.startX
      const dy = t.clientY - s.startY
      const dt = performance.now() - s.startTime
      const absDx = Math.abs(dx), absDy = Math.abs(dy)

      // 탭 → 회전
      if (!s.hasMoved && absDx < TAP_MAX_MOVE && absDy < TAP_MAX_MOVE && dt < TAP_MAX_MS) {
        act('rotate'); vib(12); return
      }
      // 수직 스와이프
      if (absDy > SWIPE_MIN_Y && absDy > absDx * 1.2) {
        if (dy > 0) {
          absDy / dt >= FLICK_VY_FAST
            ? (act('hardDrop'), vib([18, 8, 18]))
            : (act('softDrop'), vib(8))
        } else {
          act('hold'); vib(20)
        }
      }
    }

    attach()
    return () => {
      clearTimeout(retryId)
      if (canvas) {
        canvas.removeEventListener('touchstart',  onStart)
        canvas.removeEventListener('touchmove',   onMove)
        canvas.removeEventListener('touchend',    onEnd)
        canvas.removeEventListener('touchcancel', onEnd)
      }
    }
  }, [act])

  // ── 버튼 핸들러 ───────────────────────────────────────────────────────
  const down = (e, action, repeat = false) => {
    e.preventDefault(); e.stopPropagation()
    repeat ? startRepeat(action) : (act(action), vib(10))
  }
  const up = (e, repeat = false) => {
    e.preventDefault()
    if (repeat) stopRepeat()
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
            onTouchStart={(e) => down(e, 'left', true)}
            onTouchEnd={(e)   => up(e, true)}
            onTouchCancel={(e)=> up(e, true)}
            aria-label="왼쪽 이동"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span>LEFT</span>
          </button>

          <button
            className="tc-btn tc-move"
            onTouchStart={(e) => down(e, 'right', true)}
            onTouchEnd={(e)   => up(e, true)}
            onTouchCancel={(e)=> up(e, true)}
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
              onTouchStart={(e) => down(e, 'hold')}
              onTouchEnd={(e)   => up(e)}
              aria-label="홀드"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v4h2V6h4V4zm10 0h-6v2h4v4h2V6c0-1.1-.9-2-2-2zM4 14H2v4c0 1.1.9 2 2 2h6v-2H4v-4zm16 4h-4v2h6v-6h-2v4z"/>
              </svg>
              <span>HOLD</span>
            </button>

            <button
              className="tc-btn tc-rotate"
              onTouchStart={(e) => down(e, 'rotate')}
              onTouchEnd={(e)   => up(e)}
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
            onTouchStart={(e) => down(e, 'hardDrop')}
            onTouchEnd={(e)   => up(e)}
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
