# 俄罗斯方块 · Tetris

基于 React + Vite 构建的经典俄罗斯方块游戏。包含完整的游戏逻辑、键盘控制、计分系统与单元测试。

## 技术栈

- **React 18** — UI 组件与状态管理（useReducer + 自定义 Hook）
- **Vite 5** — 开发服务器与生产构建
- **Vitest + Testing Library** — 单元测试与组件测试（覆盖率 96%）

## 功能特性

- 七种标准 Tetromino 方块（I / J / L / O / S / T / Z）
- 完整旋转系统，含简单踢墙（wall kick）
- 三档难度选择（简单 / 中等 / 困难），控制方块下落速度
- 软降、硬降、消行、计分、等级与加速
- 消行时的 Canvas 粒子爆裂特效（颜色取自被消除的方块）
- 下一个方块预览
- 暂停 / 继续、游戏结束重开
- 键盘操控

## 难度

开始游戏前可选择难度，难度仅影响方块自动下落速度：

| 难度 | 下落速度 | 说明 |
|------|----------|------|
| 简单 | 基准（×1） | 默认难度 |
| 中等 | 比简单快 50%（×1.5） | 下落间隔约为简单的 2/3 |
| 困难 | 比中等再快 50%（×2.25） | 下落间隔约为简单的 1/2.25 |

等级提升带来的加速会在所选难度的基础上叠加。

## 操作说明

| 按键 | 功能 |
|------|------|
| ← → | 左右移动 |
| ↑ | 旋转 |
| ↓ | 软降（加速下落） |
| 空格 | 硬降（瞬间落底） |
| P | 暂停 / 继续 |

## 计分规则

| 消除行数 | 基础分（× 当前等级） |
|----------|---------------------|
| 1 行 | 100 |
| 2 行 | 300 |
| 3 行 | 500 |
| 4 行 | 800 |

软降每格 +1 分，硬降每格 +2 分。每消除 10 行升一级，等级越高方块下落越快。

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建
npm run build

# 预览生产构建（默认 http://localhost:4173）
npm run preview
```

## 测试

```bash
# 运行全部测试
npm test

# 监听模式
npm run test:watch

# 测试覆盖率报告
npm run test:coverage
```

## 项目结构

```
03-claude-code-demo/
├── index.html
├── vite.config.js          # Vite + Vitest 配置
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx            # 应用入口
    ├── App.jsx             # 主组件
    ├── App.css
    ├── index.css
    ├── components/
    │   ├── Board.jsx              # 游戏面板
    │   ├── NextPiece.jsx          # 下一个方块预览
    │   ├── DifficultySelector.jsx # 难度选择器
    │   ├── ParticleCanvas.jsx     # 消行粒子特效层
    │   └── ScorePanel.jsx         # 分数信息面板
    ├── game/
    │   ├── tetrominoes.js  # 方块定义
    │   ├── gameLogic.js    # 核心逻辑（纯函数）
    │   ├── particles.js    # 粒子特效引擎（纯函数）
    │   └── useTetris.js    # 游戏状态 Hook
    └── __tests__/          # 测试文件
```

## 架构说明

核心游戏逻辑（`gameLogic.js`）全部为纯函数，与 React 解耦，便于独立测试。游戏状态通过 `useReducer` 以不可变方式管理，所有状态变更都返回新对象，避免隐式副作用。
