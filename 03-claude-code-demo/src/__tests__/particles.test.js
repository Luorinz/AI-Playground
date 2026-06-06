import { describe, it, expect } from 'vitest'
import {
  createParticles,
  stepParticle,
  stepParticles,
  PARTICLES_PER_CELL,
  LIFE_DECAY,
} from '../game/particles.js'

describe('createParticles', () => {
  it('每个格子生成固定数量的粒子', () => {
    const cells = [
      { x: 0, y: 19, color: '#f00' },
      { x: 1, y: 19, color: '#0f0' },
    ]
    const particles = createParticles(cells)
    expect(particles).toHaveLength(2 * PARTICLES_PER_CELL)
  })

  it('粒子继承所属格子的颜色', () => {
    const particles = createParticles([{ x: 3, y: 5, color: '#abc' }])
    expect(particles.every((p) => p.color === '#abc')).toBe(true)
  })

  it('粒子初始 life 为 1 且位置在格子中心附近', () => {
    const particles = createParticles([{ x: 2, y: 4, color: '#fff' }])
    expect(particles[0].life).toBe(1)
    expect(particles[0].x).toBeCloseTo(2.5)
    expect(particles[0].y).toBeCloseTo(4.5)
  })

  it('支持注入随机源以保证确定性', () => {
    const rand = () => 0.5
    const a = createParticles([{ x: 0, y: 0, color: '#fff' }], rand)
    const b = createParticles([{ x: 0, y: 0, color: '#fff' }], rand)
    expect(a).toEqual(b)
  })

  it('空格子列表返回空数组', () => {
    expect(createParticles([])).toEqual([])
  })
})

describe('stepParticle', () => {
  it('推进一帧后 life 衰减', () => {
    const p = { x: 0, y: 0, vx: 0, vy: 0, color: '#fff', size: 0.3, life: 1 }
    const next = stepParticle(p)
    expect(next.life).toBeCloseTo(1 - LIFE_DECAY)
  })

  it('重力使竖直速度增大、位置下移', () => {
    const p = { x: 0, y: 0, vx: 0, vy: 0, color: '#fff', size: 0.3, life: 1 }
    const next = stepParticle(p)
    expect(next.vy).toBeGreaterThan(0)
    expect(next.y).toBeGreaterThan(0)
  })

  it('不修改原粒子（不可变）', () => {
    const p = { x: 0, y: 0, vx: 1, vy: 1, color: '#fff', size: 0.3, life: 1 }
    stepParticle(p)
    expect(p.x).toBe(0)
    expect(p.life).toBe(1)
  })
})

describe('stepParticles', () => {
  it('剔除生命耗尽的粒子', () => {
    const particles = [
      { x: 0, y: 0, vx: 0, vy: 0, color: '#fff', size: 0.3, life: LIFE_DECAY / 2 },
      { x: 0, y: 0, vx: 0, vy: 0, color: '#fff', size: 0.3, life: 1 },
    ]
    const next = stepParticles(particles)
    expect(next).toHaveLength(1)
  })

  it('多帧后所有粒子最终消失', () => {
    let particles = createParticles([{ x: 0, y: 0, color: '#fff' }])
    for (let i = 0; i < 100; i++) {
      particles = stepParticles(particles)
    }
    expect(particles).toHaveLength(0)
  })
})
