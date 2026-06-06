import { useRef, useEffect } from 'react'
import { createParticles, stepParticles } from '../game/particles.js'
import { BOARD_WIDTH, BOARD_HEIGHT } from '../game/gameLogic.js'

// 每格像素尺寸，与 CSS --cell-size 保持一致
const CELL_PX = 28
const GAP_PX = 1

// 覆盖在游戏面板上的粒子特效层
// 监听 clearEvent，每次消行喷射一批粒子并用 requestAnimationFrame 动画
export default function ParticleCanvas({ clearEvent }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const rafRef = useRef(null)

  // 接收到新的消行事件时追加粒子
  useEffect(() => {
    if (!clearEvent || !clearEvent.cells?.length) return
    particlesRef.current = [
      ...particlesRef.current,
      ...createParticles(clearEvent.cells),
    ]
  }, [clearEvent])

  // 启动持续渲染循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particlesRef.current) {
        const px = p.x * (CELL_PX + GAP_PX)
        const py = p.y * (CELL_PX + GAP_PX)
        const size = p.size * CELL_PX
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(px, py, size / 2, 0, Math.PI * 2)
        ctx.fill()
        // 高光提升炫酷感
        ctx.globalAlpha = Math.max(0, p.life) * 0.6
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(px - size * 0.15, py - size * 0.15, size / 6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      particlesRef.current = stepParticles(particlesRef.current)
      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const width = BOARD_WIDTH * (CELL_PX + GAP_PX)
  const height = BOARD_HEIGHT * (CELL_PX + GAP_PX)

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      width={width}
      height={height}
      data-testid="particle-canvas"
    />
  )
}
