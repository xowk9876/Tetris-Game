import React, { useEffect, useRef } from 'react'
import './Background.css'

// 화려한 우주 테마 3D 테트리스 배경
function Background() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // 별 클래스
    class Star {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.brightness = Math.random()
        this.twinkleSpeed = Math.random() * 0.002 + 0.001 // 깜빡임 속도 더 줄임 (0.005 -> 0.002)
        this.twinkleOffset = Math.random() * Math.PI * 2
      }

      update() {
        this.brightness += this.twinkleSpeed
        if (this.brightness > 1) this.brightness = 0
      }

      draw() {
        const alpha = (Math.sin(this.brightness * Math.PI * 2 + this.twinkleOffset) + 1) / 2
        // 깜빡임 범위 더 줄임 (0.5-0.9 -> 0.65-0.85로 더 안정적으로)
        const finalAlpha = alpha * 0.2 + 0.65
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`
        ctx.fill()
        
        // 글로우 효과 더 줄임
        ctx.shadowBlur = this.size * 1.5 // 2 -> 1.5
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)' // 0.5 -> 0.3
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    // 유성 클래스 (더 화려하게!)
    class Meteor {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = -50
        this.speedX = (Math.random() - 0.5) * 3
        this.speedY = Math.random() * 4 + 3
        this.length = Math.random() * 120 + 80
        this.opacity = 1
        this.life = 1
        this.color = [
          [0, 245, 255],
          [255, 107, 157],
          [255, 215, 0],
          [138, 43, 226]
        ][Math.floor(Math.random() * 4)]
        this.particles = []
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x: this.x,
            y: this.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1
          })
        }
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.life -= 0.008

        // 파티클 업데이트
        this.particles.forEach(p => {
          p.x += p.vx
          p.y += p.vy
          p.life -= 0.05
        })
        this.particles = this.particles.filter(p => p.life > 0)

        // 새로운 파티클 추가
        if (Math.random() < 0.3 && this.particles.length < 8) {
          this.particles.push({
            x: this.x,
            y: this.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1
          })
        }

        if (this.y > canvas.height + 50 || this.life <= 0) {
          this.reset()
        }
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.life
        
        // 메인 꼬리
        const gradient = ctx.createLinearGradient(
          this.x, this.y,
          this.x - this.speedX * this.length, this.y - this.speedY * this.length
        )
        gradient.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`)
        gradient.addColorStop(0.3, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.8)`)
        gradient.addColorStop(0.6, `rgba(255, 255, 255, 0.6)`)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 4
        ctx.shadowBlur = 20
        ctx.shadowColor = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.9)`
        
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.x - this.speedX * this.length * 0.4, this.y - this.speedY * this.length * 0.4)
        ctx.stroke()
        
        // 긴 꼬리
        ctx.lineWidth = 2
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.moveTo(this.x - this.speedX * this.length * 0.4, this.y - this.speedY * this.length * 0.4)
        ctx.lineTo(this.x - this.speedX * this.length, this.y - this.speedY * this.length)
        ctx.stroke()
        
        // 핵심 부분 (밝은 점)
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, 1)`
        ctx.fill()
        ctx.shadowBlur = 15
        ctx.shadowColor = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`
        ctx.fill()
        
        // 파티클 그리기
        this.particles.forEach(p => {
          ctx.shadowBlur = 0
          ctx.beginPath()
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${p.life * 0.8})`
          ctx.fill()
        })
        
        ctx.restore()
      }
    }

    // 행성/성운 클래스 (더 화려하게!)
    class Nebula {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.radius = Math.random() * 250 + 180
        this.color = [
          [0, 245, 255],    // 시안
          [255, 107, 157],  // 핑크
          [255, 215, 0],    // 골드
          [65, 105, 225],   // 로얄 블루
          [138, 43, 226],   // 바이올렛
          [255, 20, 147],   // 딥 핑크
          [0, 191, 255]     // 딥 스카이 블루
        ][Math.floor(Math.random() * 7)]
        this.pulseSpeed = Math.random() * 0.001 + 0.0005 // 펄스 속도 더 줄임 (0.003 -> 0.001)
        this.pulseOffset = Math.random() * Math.PI * 2
        this.rotation = 0
        this.rotationSpeed = (Math.random() - 0.5) * 0.6
        this.secondaryColor = [
          [255, 107, 157],
          [0, 245, 255],
          [138, 43, 226],
          [255, 215, 0]
        ][Math.floor(Math.random() * 4)]
      }

      update() {
        this.rotation += this.rotationSpeed
      }

      draw() {
        const pulse = (Math.sin(Date.now() * this.pulseSpeed + this.pulseOffset) + 1) / 2
        // 펄스 범위 더 줄임 (더 부드럽게)
        const currentRadius = this.radius * (0.90 + pulse * 0.10) // 0.85-1.0 -> 0.90-1.0
        const opacity = 0.2 + pulse * 0.05 // 0.2-0.28 -> 0.2-0.25

        // 메인 그라데이션
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, currentRadius
        )
        gradient.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${opacity})`)
        gradient.addColorStop(0.3, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${opacity * 0.8})`)
        gradient.addColorStop(0.6, `rgba(${this.secondaryColor[0]}, ${this.secondaryColor[1]}, ${this.secondaryColor[2]}, ${opacity * 0.4})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2)
        ctx.fill()

        // 외곽 글로우 더 줄임
        ctx.shadowBlur = currentRadius * 0.3 // 0.5 -> 0.3
        ctx.shadowColor = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.2)` // 0.3 -> 0.2
        ctx.strokeStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.08)` // 0.1 -> 0.08
        ctx.lineWidth = 1.5 // 2 -> 1.5
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // 테트리스 블록 모양 파티클
    class BlockParticle {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = -50
        this.size = Math.random() * 15 + 10
        this.speedY = Math.random() * 2 + 1
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.1
        this.color = [
          [0, 245, 255],    // 시안
          [255, 107, 157],  // 핑크
          [255, 215, 0],    // 골드
          [65, 105, 225],   // 로얄 블루
          [76, 175, 80],    // 그린
          [255, 20, 147]    // 딥 핑크
        ][Math.floor(Math.random() * 6)]
        this.opacity = 0.6
      }

      update() {
        this.y += this.speedY
        this.rotation += this.rotationSpeed
        this.opacity -= 0.005

        if (this.y > canvas.height + 50 || this.opacity <= 0) {
          this.reset()
        }
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)

        // 블록 모양 그리기 (사각형) - 더 화려하게!
        const size = this.size
        ctx.shadowBlur = 20
        ctx.shadowColor = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.9)`
        
        // 3D 효과를 위한 그라데이션 (더 강화)
        const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2)
        gradient.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`)
        gradient.addColorStop(0.5, `rgba(${this.color[0] * 0.7}, ${this.color[1] * 0.7}, ${this.color[2] * 0.7}, 0.9)`)
        gradient.addColorStop(1, `rgba(${this.color[0] * 0.4}, ${this.color[1] * 0.4}, ${this.color[2] * 0.4}, 0.8)`)
        
        ctx.fillStyle = gradient
        ctx.fillRect(-size/2, -size/2, size, size)
        
        // 하이라이트 (상단)
        const highlightGradient = ctx.createLinearGradient(-size/2, -size/2, -size/2, size/4)
        highlightGradient.addColorStop(0, `rgba(255, 255, 255, 0.6)`)
        highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
        ctx.fillStyle = highlightGradient
        ctx.fillRect(-size/2, -size/2, size, size/2)
        
        // 테두리 (더 밝게)
        ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`
        ctx.lineWidth = 2.5
        ctx.shadowBlur = 10
        ctx.strokeRect(-size/2, -size/2, size, size)
        
        // 내부 하이라이트
        ctx.shadowBlur = 0
        ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`
        ctx.lineWidth = 1
        ctx.strokeRect(-size/2 + 2, -size/2 + 2, size - 4, size - 4)
        
        ctx.restore()
      }
    }

    // 파티클 시스템 (연결선용)
    class Particle {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 1
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.opacity = Math.random() * 0.3 + 0.1
        this.color = [0, 245, 255]
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.opacity})`
        ctx.fill()
      }
    }

    // 은하수 효과 클래스
    class Galaxy {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height * 0.3 + canvas.height * 0.2
        this.width = canvas.width * (0.3 + Math.random() * 0.4)
        this.height = canvas.height * (0.1 + Math.random() * 0.2)
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.001
        this.opacity = 0.15 + Math.random() * 0.1
        this.color = [
          [0, 245, 255],
          [255, 107, 157],
          [138, 43, 226]
        ][Math.floor(Math.random() * 3)]
      }

      update() {
        this.rotation += this.rotationSpeed
      }

      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        ctx.globalAlpha = this.opacity

        const gradient = ctx.createLinearGradient(-this.width/2, 0, this.width/2, 0)
        gradient.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0)`)
        gradient.addColorStop(0.3, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.3)`)
        gradient.addColorStop(0.5, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.4)`)
        gradient.addColorStop(0.7, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.3)`)
        gradient.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0)`)

        ctx.fillStyle = gradient
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height)

        ctx.restore()
      }
    }

    // 빛나는 별 클래스 (더 큰 별)
    class BrightStar {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 4 + 2
        this.brightness = Math.random()
        this.twinkleSpeed = Math.random() * 0.003 + 0.002 // 깜빡임 속도 더 줄임 (0.008 -> 0.003)
        this.twinkleOffset = Math.random() * Math.PI * 2
        this.color = [
          [0, 245, 255],
          [255, 107, 157],
          [255, 215, 0],
          [138, 43, 226]
        ][Math.floor(Math.random() * 4)]
      }

      update() {
        this.brightness += this.twinkleSpeed
        if (this.brightness > 1) this.brightness = 0
      }

      draw() {
        const alpha = (Math.sin(this.brightness * Math.PI * 2 + this.twinkleOffset) + 1) / 2
        // 깜빡임 범위 더 줄임 (0.6-0.9 -> 0.7-0.85로 더 안정적으로)
        const currentAlpha = alpha * 0.15 + 0.7
        
        // 외곽 글로우 더 줄임
        ctx.shadowBlur = this.size * 2.5 // 4 -> 2.5
        ctx.shadowColor = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.3)` // 0.5 -> 0.3
        
        // 메인 별
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${currentAlpha})`
        ctx.fill()
        
        // 내부 하이라이트
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.4})` // 0.6 -> 0.4로 더 줄임
        ctx.fill()
        
        ctx.shadowBlur = 0
      }
    }

    // 객체 생성 (더 많이!)
    const stars = []
    for (let i = 0; i < 500; i++) { // 300 -> 500
      stars.push(new Star())
    }

    const brightStars = []
    for (let i = 0; i < 50; i++) { // 새로운 빛나는 별
      brightStars.push(new BrightStar())
    }

    const meteors = []
    for (let i = 0; i < 8; i++) { // 5 -> 8
      meteors.push(new Meteor())
    }

    const nebulae = []
    for (let i = 0; i < 6; i++) { // 4 -> 6
      nebulae.push(new Nebula())
    }

    const galaxies = []
    for (let i = 0; i < 3; i++) { // 새로운 은하수 효과
      galaxies.push(new Galaxy())
    }

    const blockParticles = []
    for (let i = 0; i < 40; i++) { // 20 -> 40
      blockParticles.push(new BlockParticle())
    }

    const particles = []
    for (let i = 0; i < 150; i++) { // 100 -> 150
      particles.push(new Particle())
    }

    let time = 0

    const animate = () => {
      time += 0.01
      
      // 우주 배경 그라데이션 (더 복잡하고 화려하게)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#000011')
      gradient.addColorStop(0.15, '#0a0a1a')
      gradient.addColorStop(0.3, '#1a1a2e')
      gradient.addColorStop(0.5, '#0f0f23')
      gradient.addColorStop(0.7, '#1a1a2e')
      gradient.addColorStop(0.85, '#0a0a1a')
      gradient.addColorStop(1, '#000011')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 은하수 그리기 (가장 먼저)
      galaxies.forEach(galaxy => {
        galaxy.update()
        galaxy.draw()
      })

      // 성운 그리기
      nebulae.forEach(nebula => {
        nebula.update()
        nebula.draw()
      })

      // 작은 별 그리기
      stars.forEach(star => {
        star.update()
        star.draw()
      })

      // 빛나는 별 그리기
      brightStars.forEach(star => {
        star.update()
        star.draw()
      })

      // 유성 그리기
      meteors.forEach(meteor => {
        meteor.update()
        meteor.draw()
      })

      // 테트리스 블록 파티클 그리기
      blockParticles.forEach(block => {
        block.update()
        block.draw()
      })

      // 파티클 연결선 (더 화려하게)
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 180) { // 150 -> 180
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            const opacity = (1 - distance / 180) * 0.2 // 0.15 -> 0.2
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
            gradient.addColorStop(0, `rgba(0, 245, 255, ${opacity})`)
            gradient.addColorStop(0.5, `rgba(255, 107, 157, ${opacity * 0.8})`)
            gradient.addColorStop(1, `rgba(0, 245, 255, ${opacity})`)
            ctx.strokeStyle = gradient
            ctx.lineWidth = 1.5 // 1 -> 1.5
            ctx.stroke()
          }
        })
      })
      
      // 별자리 연결선 (빛나는 별끼리)
      brightStars.forEach((s1, i) => {
        brightStars.slice(i + 1).forEach(s2 => {
          const dx = s1.x - s2.x
          const dy = s1.y - s2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 300) {
            ctx.beginPath()
            ctx.moveTo(s1.x, s1.y)
            ctx.lineTo(s2.x, s2.y)
            const opacity = (1 - distance / 300) * 0.1
            const gradient = ctx.createLinearGradient(s1.x, s1.y, s2.x, s2.y)
            gradient.addColorStop(0, `rgba(${s1.color[0]}, ${s1.color[1]}, ${s1.color[2]}, ${opacity})`)
            gradient.addColorStop(1, `rgba(${s2.color[0]}, ${s2.color[1]}, ${s2.color[2]}, ${opacity})`)
            ctx.strokeStyle = gradient
            ctx.lineWidth = 1
            ctx.shadowBlur = 5
            ctx.shadowColor = `rgba(${s1.color[0]}, ${s1.color[1]}, ${s1.color[2]}, 0.5)`
            ctx.stroke()
            ctx.shadowBlur = 0
          }
        })
      })

      // 파티클 그리기
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      // CSS 변수 업데이트
      container.style.setProperty('--grid-offset-x', `${Math.sin(time) * 30}px`)
      container.style.setProperty('--grid-offset-y', `${Math.cos(time * 0.6) * 30}px`)
      container.style.setProperty('--rotation', `${time * 3}deg`)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      const widthRatio = newWidth / canvas.width
      const heightRatio = newHeight / canvas.height
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      // 파티클 위치 조정 (비율 유지)
      stars.forEach(star => {
        star.x *= widthRatio
        star.y *= heightRatio
      })
      
      meteors.forEach(meteor => {
        meteor.x *= widthRatio
        meteor.y *= heightRatio
      })
      
      nebulae.forEach(nebula => {
        nebula.x *= widthRatio
        nebula.y *= heightRatio
      })
      
      galaxies.forEach(galaxy => {
        galaxy.x *= widthRatio
        galaxy.y *= heightRatio
      })
      
      brightStars.forEach(star => {
        star.x *= widthRatio
        star.y *= heightRatio
      })
      
      blockParticles.forEach(block => {
        block.x *= widthRatio
        block.y *= heightRatio
      })
      
      particles.forEach(particle => {
        particle.x *= widthRatio
        particle.y *= heightRatio
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

