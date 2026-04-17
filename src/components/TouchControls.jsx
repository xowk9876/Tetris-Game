import React, { useEffect, useRef, useCallback } from 'react'
import './TouchControls.css'

// ── 테트리스 가이드라인 기준 DAS / ARR ──────────────────────────────────
const DAS_MS = 133   // 버튼을 처음 눌렀다가 반복 시작까지 대기 (ms)
const ARR_MS = 33    // 반복 간격 (ms) ≒ 30fps

// ── 스와이프 감도 ─────────────────────────────────────────────────────────
const SWIPE_CELL_PX   = 26    // 이 픽셀 이상 수평 이동 시 한 칸 이동
const FLICK_VY_FAST   = 0.75  // px/ms 이상이면 하드드롭 (빠른 플릭)
const SWIPE_MIN_Y     = 55    // 수직 스와이프 최소 거리 (px)
const TAP_MAX_MOVE    = 14    // 탭으로 인정되는 최대 이동 (px)
const TAP_MAX_MS      = 260   // 탭으로 인정되는 최대 시간 (ms)

function TouchControls({ gameRef }) {
  const dasRef  = useRef(null)
  const arrRef  = useRef(null)
  const swipe   = useRef({
    active: false,
    startX: 0, startY: 0,
    lastX: 0,  lastY: 0,
    startTime: 0,
    accX: 0,         // 수평 누적 픽셀 (정수 이동 추출용)
    hasMoved: false,
  })

  // ── 씬 액션 실행 ──────────────────────────────────────────────────────
  const act = useCallback((action) => {
    const scene = gameRef.current?.scene?.scenes?.[0]
    if (!scene) return
    scene.executeAction(action)
  }, [gameRef])

  // ── 햅틱 (진동 지원 기기) ─────────────────────────────────────────────
  const vib = (pattern) => {
    try { navigator.vibrate?.(pattern) } catch (_) {}
  }

  // ── DAS/ARR 좌우 반복 시작/정지 ───────────────────────────────────────
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

  // ── 소프트드롭 hold: Phaser update() 루프와 연동 ─────────────────────
  const startSoft = useCallback(() => {
    const scene = gameRef.current?.scene?.scenes?.[0]
    if (!scene) return
    scene.touchSoftDropping = true
    vib(5)
  }, [gameRef])

  const stopSoft = useCallback(() => {
    const scene = gameRef.current?.scene?.scenes?.[0]
    if (!scene) return
    scene.touchSoftDropping = false
  }, [gameRef])

  // ── 게임 캔버스 스와이프 제스처 ──────────────────────────────────────
  useEffect(() => {
    let canvas = null
    let retryId = null

    function attach() {
      const container = document.getElementById('game-container')
      if (!container) { retryId = setTimeout(attach, 150); return }

      // Phaser 캔버스 또는 컨테이너 자체에 바인드
      canvas = container.querySelector('canvas') || container
      canvas.style.touchAction = 'none'   // 브라우저 스크롤/줌 차단

      canvas.addEventListener('touchstart',  onStart,  { passive: false })
      canvas.addEventListener('touchmove',   onMove,   { passive: false })
      canvas.addEventListener('touchend',    onEnd,    { passive: false })
      canvas.addEventListener('touchcancel', onEnd,    { passive: false })
    }

    function onStart(e) {
      e.preventDefault()
      const t = e.touches[0]
      const s = swipe.current
      s.active    = true
      s.startX    = s.lastX = t.clientX
      s.startY    = s.lastY = t.clientY
      s.startTime = performance.now()
      s.accX      = 0
      s.hasMoved  = false
    }

    function onMove(e) {
      e.preventDefault()
      const s = swipe.current
      if (!s.active) return
      const t = e.touches[0]

      const dx      = t.clientX - s.lastX
      const totalDx = Math.abs(t.clientX - s.startX)
      const totalDy = Math.abs(t.clientY - s.startY)

      // 수평 지배 → 좌/우 이동 (연속 감지)
      if (totalDx > totalDy * 0.9) {
        s.accX += dx
        // 누적 픽셀이 한 칸 임계치를 넘을 때마다 이동
        while (Math.abs(s.accX) >= SWIPE_CELL_PX) {
          const dir = s.accX > 0 ? 'right' : 'left'
          act(dir)
          s.accX -= Math.sign(s.accX) * SWIPE_CELL_PX
          if (!s.hasMoved) { vib(6); s.hasMoved = true }
        }
      }

      s.lastX = t.clientX
      s.lastY = t.clientY
    }

    function onEnd(e) {
      e.preventDefault()
      const s = swipe.current
      if (!s.active) return
      s.active = false

      const t    = e.changedTouches[0]
      const dx   = t.clientX - s.startX
      const dy   = t.clientY - s.startY
      const dt   = performance.now() - s.startTime
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      // ① 탭: 짧은 시간 + 작은 이동 → 회전
      if (!s.hasMoved && absDx < TAP_MAX_MOVE && absDy < TAP_MAX_MOVE && dt < TAP_MAX_MS) {
        act('rotate')
        vib(12)
        return
      }

      // ② 수직 플릭/스와이프
      if (absDy > SWIPE_MIN_Y && absDy > absDx * 1.2) {
        if (dy > 0) {
          // 아래: 속도에 따라 하드드롭 or 소프트드롭 1회
          const vy = absDy / dt
          if (vy >= FLICK_VY_FAST) {
            act('hardDrop')
            vib([18, 8, 18])
          } else {
            act('softDrop')
            vib(8)
          }
        } else {
          // 위: 홀드
          act('hold')
          vib(20)
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
  const btnDown = (e, action, mode = 'once') => {
    e.preventDefault()
    e.stopPropagation()
    if (mode === 'repeat')   { startRepeat(action); return }
    if (mode === 'soft')     { startSoft();          return }
    act(action)
    vib(10)
  }
  const btnUp = (e, mode = 'once') => {
    e.preventDefault()
    if (mode === 'repeat') stopRepeat()
    if (mode === 'soft')   stopSoft()
  }

  return (
    <div className="tc-wrap" aria-label="터치 컨트롤" role="group">

      {/* 스와이프 힌트 바 */}
      <div className="tc-hint" aria-hidden="true">
        <span className="tc-hint-icon">←</span>
        <span className="tc-hint-text">캔버스를 탭/스와이프하거나 버튼을 눌러 조작</span>
        <span className="tc-hint-icon">→</span>
      </div>

      <div className="tc-pad">

        {/* ── 왼쪽: 이동 D-패드 ─────────────────────────────────── */}
        <div className="tc-zone tc-left">

          {/* 위 행: ◀ ▶ */}
          <div className="tc-row">
            <button
              className="tc-btn tc-move"
              onTouchStart={(e) => btnDown(e, 'left', 'repeat')}
              onTouchEnd={(e)   => btnUp(e, 'repeat')}
              onTouchCancel={(e)=> btnUp(e, 'repeat')}
              aria-label="왼쪽 이동"
            >
              {/* ◀ chevron left */}
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span>LEFT</span>
            </button>

            <button
              className="tc-btn tc-move"
              onTouchStart={(e) => btnDown(e, 'right', 'repeat')}
              onTouchEnd={(e)   => btnUp(e, 'repeat')}
              onTouchCancel={(e)=> btnUp(e, 'repeat')}
              aria-label="오른쪽 이동"
            >
              {/* ▶ chevron right */}
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
              <span>RIGHT</span>
            </button>
          </div>

          {/* 아래 행: ▼ 소프트드롭 (풀폭) */}
          <button
            className="tc-btn tc-move tc-soft tc-wide"
            onTouchStart={(e) => btnDown(e, 'softDrop', 'soft')}
            onTouchEnd={(e)   => btnUp(e, 'soft')}
            onTouchCancel={(e)=> btnUp(e, 'soft')}
            aria-label="소프트 드롭 (누르는 동안 빠르게 낙하)"
          >
            {/* ▼ arrow down */}
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20 12 18.59 10.59 13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8z"/>
            </svg>
            <span>SOFT DROP</span>
          </button>
        </div>

        {/* 구분선 */}
        <div className="tc-divider" aria-hidden="true" />

        {/* ── 오른쪽: 액션 버튼 ─────────────────────────────────── */}
        <div className="tc-zone tc-right">

          {/* 위 행: HOLD + ROTATE */}
          <div className="tc-row">
            <button
              className="tc-btn tc-hold"
              onTouchStart={(e) => btnDown(e, 'hold')}
              onTouchEnd={(e)   => btnUp(e)}
              aria-label="홀드 (블록 보관)"
            >
              {/* hold box icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v4h2V6h4V4zm10 0h-6v2h4v4h2V6c0-1.1-.9-2-2-2zM4 14H2v4c0 1.1.9 2 2 2h6v-2H4v-4zm16 4h-4v2h6v-6h-2v4z"/>
              </svg>
              <span>HOLD</span>
            </button>

            <button
              className="tc-btn tc-rotate"
              onTouchStart={(e) => btnDown(e, 'rotate')}
              onTouchEnd={(e)   => btnUp(e)}
              aria-label="블록 회전"
            >
              {/* rotate icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
              </svg>
              <span>ROTATE</span>
            </button>
          </div>

          {/* 아래 행: HARD DROP (풀폭) */}
          <button
            className="tc-btn tc-hard tc-wide"
            onTouchStart={(e) => btnDown(e, 'hardDrop')}
            onTouchEnd={(e)   => btnUp(e)}
            aria-label="하드 드롭 (즉시 낙하)"
          >
            {/* vertical align bottom arrow */}
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
