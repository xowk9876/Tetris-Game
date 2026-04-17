import React, { useEffect, useRef } from 'react'
import './Background.css'

// 최적화된 우주 테마 테트리스 배경
function Background() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d', { alpha: false }) // 알파 비활성화로 성능 향상
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // 프레임 스킵을 위한 변수
    let frameCount = 0
    const SKIP_FRAMES = 2 // 매 3프레임마다 한번씩 업데이트

    // 별 클래스 (간소화)
    class Star {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 1.5 + 0.5
        this.alpha = Math.random() * 0.3 + 0.5
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`
        ctx.fill()
      }
    }

    // 유성 클래스 (간소화)
    class Meteor {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = -50
        this.speedX = (Math.random() - 0.5) * 2
        this.speedY = Math.random() * 3 + 2
        this.length = Math.random() * 80 + 40
        this.life = 1
        this.color = [
          [0, 245, 255],
          [255, 107, 157],
          [255, 215, 0]
        ][Math.floor(Math.random() * 3)]
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life -= 0.01

        if (this.y > canvas.height + 50 || this.life <= 0) {
          this.reset()
        }
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.life
        
        const gradient = ctx.createLinearGradient(
          this.x, this.y,
          this.x - this.speedX * this.length, this.y - this.speedY * this.length
        )
        gradient.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.x - this.speedX * this.length, this.y - this.speedY * this.length)
        ctx.stroke()
        
        ctx.restore()
      }
    }

    // 성운 클래스 (간소화 - 정적 렌더링)
    class Nebula {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.radius = Math.random() * 200 + 100
        this.color = [
          [0, 245, 255],
          [255, 107, 157],
          [138, 43, 226]
        ][Math.floor(Math.random() * 3)]
        this.opacity = 0.15
      }

      draw() {
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        )
        gradient.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.opacity})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 테트리스 블록 파티클 (간소화)
    class BlockParticle {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = -30
        this.size = Math.random() * 12 + 8
        this.speedY = Math.random() * 1.5 + 0.5
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.05
        this.color = [
          [0, 245, 255],
          [255, 107, 157],
          [255, 215, 0],
          [76, 175, 80]
        ][Math.floor(Math.random() * 4)]
        this.opacity = 0.5
      }

      update() {
        this.y += this.speedY
        this.rotation += this.rotationSpeed
        this.opacity -= 0.003

        if (this.y > canvas.height + 50 || this.opacity <= 0) {
          this.reset()
        }
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)

        ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.8)`
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size)
        
        ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`
        ctx.lineWidth = 1
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size)
        
        ctx.restore()
      }
    }

    // 객체 생성 (대폭 감소)
    const stars = []
    for (let i = 0; i < 150; i++) { // 500 -> 150
      stars.push(new Star())
    }

    const meteors = []
    for (let i = 0; i < 3; i++) { // 8 -> 3
      meteors.push(new Meteor())
    }

    const nebulae = []
    for (let i = 0; i < 3; i++) { // 6 -> 3
      nebulae.push(new Nebula())
    }

    const blockParticles = []
    for (let i = 0; i < 15; i++) { // 40 -> 15
      blockParticles.push(new BlockParticle())
    }

    let time = 0

    const animate = () => {
      frameCount++
      
      // 프레임 스킵: 매 3프레임마다 한 번씩만 업데이트
      const shouldUpdate = frameCount % (SKIP_FRAMES + 1) === 0
      
      if (shouldUpdate) {
        time += 0.02
        
        // 배경 그라데이션
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, '#000011')
        gradient.addColorStop(0.5, '#0f0f23')
        gradient.addColorStop(1, '#000011')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 성운 그리기 (정적)
        nebulae.forEach(nebula => nebula.draw())

        // 별 그리기 (정적)
        stars.forEach(star => star.draw())

        // 유성 그리기
        meteors.forEach(meteor => {
          meteor.update()
          meteor.draw()
        })

        // 블록 파티클 그리기
        blockParticles.forEach(block => {
          block.update()
          block.draw()
        })

        // CSS 변수 업데이트 (느리게)
        container.style.setProperty('--grid-offset-x', `${Math.sin(time) * 15}px`)
        container.style.setProperty('--grid-offset-y', `${Math.cos(time * 0.5) * 15}px`)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      const widthRatio = newWidth / canvas.width
      const heightRatio = newHeight / canvas.height
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      stars.forEach(star => {
        star.x *= widthRatio
        star.y *= heightRatio
      })
      
      nebulae.forEach(nebula => {
        nebula.x *= widthRatio
        nebula.y *= heightRatio
      })
      
      blockParticles.forEach(block => {
        block.x *= widthRatio
        block.y *= heightRatio
      })
    }

    window.addEventListener('resize', handleResize)
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="background-container">
      <canvas ref={canvasRef} className="background-canvas" />
      <div className="background-3d-base" />
      <div className="background-3d-grid" />
      <div className="background-gradient-overlay" />
    </div>
  )
}

export default Background

