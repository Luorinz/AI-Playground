import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ParticleCanvas from '../components/ParticleCanvas.jsx'

// jsdom 不实现 canvas 2D 上下文，这里提供一个最小桩
function mockCanvasContext() {
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
  }
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx)
  return ctx
}

describe('ParticleCanvas 组件', () => {
  let rafCallbacks

  beforeEach(() => {
    mockCanvasContext()
    rafCallbacks = []
    // 受控的 rAF：手动驱动帧，避免无限循环
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('渲染 canvas 元素，尺寸与面板匹配', () => {
    render(<ParticleCanvas clearEvent={null} />)
    const canvas = screen.getByTestId('particle-canvas')
    expect(canvas).toBeInTheDocument()
    // 10 列 × (28+1) = 290，20 行 × 29 = 580
    expect(canvas.width).toBe(290)
    expect(canvas.height).toBe(580)
  })

  it('接收消行事件后绘制粒子', () => {
    const ctx = mockCanvasContext()
    const clearEvent = {
      id: 1,
      cells: [
        { x: 0, y: 19, color: '#f00' },
        { x: 1, y: 19, color: '#0f0' },
      ],
    }
    render(<ParticleCanvas clearEvent={clearEvent} />)
    // 驱动一帧
    if (rafCallbacks[0]) rafCallbacks[0]()
    // 有粒子时应调用 arc 绘制
    expect(ctx.arc).toHaveBeenCalled()
  })

  it('无消行事件时不绘制粒子', () => {
    const ctx = mockCanvasContext()
    render(<ParticleCanvas clearEvent={null} />)
    if (rafCallbacks[0]) rafCallbacks[0]()
    expect(ctx.arc).not.toHaveBeenCalled()
  })
})
