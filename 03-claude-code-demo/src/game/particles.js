// 粒子特效引擎（纯函数，便于测试）
// 坐标以「格」为单位，渲染时再乘以格子像素尺寸

// 单次消行时每个格子爆裂出的粒子数量
export const PARTICLES_PER_CELL = 6
// 重力加速度（格/帧²）
export const GRAVITY = 0.012
// 速度摩擦系数（每帧衰减）
export const FRICTION = 0.96
// 每帧生命衰减量（life 从 1 衰减到 0）
export const LIFE_DECAY = 0.02

// 基于被消除格子生成粒子数组
// cells: [{ x, y, color }]；rand 可注入以便测试（默认 Math.random）
export function createParticles(cells, rand = Math.random) {
  const particles = []
  for (const cell of cells) {
    for (let i = 0; i < PARTICLES_PER_CELL; i++) {
      const angle = rand() * Math.PI * 2
      const speed = 0.05 + rand() * 0.15
      particles.push({
        // 粒子初始位置落在格子内部随机点（格子中心附近）
        x: cell.x + 0.5,
        y: cell.y + 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.1, // 初始略微向上喷射
        color: cell.color,
        size: 0.2 + rand() * 0.25,
        life: 1,
      })
    }
  }
  return particles
}

// 推进单个粒子一帧，返回新的粒子对象（不可变）
export function stepParticle(p) {
  const vx = p.vx * FRICTION
  const vy = p.vy * FRICTION + GRAVITY
  return {
    ...p,
    x: p.x + vx,
    y: p.y + vy,
    vx,
    vy,
    life: p.life - LIFE_DECAY,
  }
}

// 推进整个粒子系统一帧，并剔除生命耗尽的粒子
export function stepParticles(particles) {
  return particles.map(stepParticle).filter((p) => p.life > 0)
}
