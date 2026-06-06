import { useReducer, useCallback, useEffect, useRef } from 'react'
import {
  createEmptyBoard,
  createPiece,
  randomTetrominoType,
  isValidPosition,
  mergePiece,
  clearLines,
  calculateScore,
  calculateLevel,
  getDropInterval,
  rotatePiece,
  getHardDropY,
} from '../game/gameLogic.js'

// 游戏状态机：所有状态变更通过 reducer 以不可变方式处理
const initialState = {
  board: createEmptyBoard(),
  current: null,
  next: null,
  score: 0,
  lines: 0,
  level: 1,
  status: 'idle', // idle | playing | paused | gameover
}

// 锁定当前方块到面板，消行计分，并生成下一个方块
function lockAndSpawn(state) {
  const merged = mergePiece(state.board, state.current)
  const { board: clearedBoard, linesCleared } = clearLines(merged)

  const totalLines = state.lines + linesCleared
  const level = calculateLevel(totalLines)
  const score = state.score + calculateScore(linesCleared, state.level)

  const newPiece = createPiece(state.next)
  const nextType = randomTetrominoType()

  // 新方块若一出生就碰撞，则游戏结束
  if (!isValidPosition(clearedBoard, newPiece)) {
    return {
      ...state,
      board: clearedBoard,
      current: null,
      score,
      lines: totalLines,
      level,
      status: 'gameover',
    }
  }

  return {
    ...state,
    board: clearedBoard,
    current: newPiece,
    next: nextType,
    score,
    lines: totalLines,
    level,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'START': {
      const firstType = randomTetrominoType()
      const nextType = randomTetrominoType()
      return {
        ...initialState,
        board: createEmptyBoard(),
        current: createPiece(firstType),
        next: nextType,
        status: 'playing',
      }
    }

    case 'MOVE_LEFT':
      if (state.status !== 'playing') return state
      if (isValidPosition(state.board, state.current, -1, 0)) {
        return { ...state, current: { ...state.current, x: state.current.x - 1 } }
      }
      return state

    case 'MOVE_RIGHT':
      if (state.status !== 'playing') return state
      if (isValidPosition(state.board, state.current, 1, 0)) {
        return { ...state, current: { ...state.current, x: state.current.x + 1 } }
      }
      return state

    case 'ROTATE':
      if (state.status !== 'playing') return state
      return { ...state, current: rotatePiece(state.board, state.current) }

    case 'SOFT_DROP':
    case 'TICK': {
      if (state.status !== 'playing') return state
      // 仍可下落则下移一格
      if (isValidPosition(state.board, state.current, 0, 1)) {
        const next = { ...state, current: { ...state.current, y: state.current.y + 1 } }
        // 软降额外加 1 分
        return action.type === 'SOFT_DROP' ? { ...next, score: next.score + 1 } : next
      }
      // 否则锁定并生成新方块
      return lockAndSpawn(state)
    }

    case 'HARD_DROP': {
      if (state.status !== 'playing') return state
      const dropY = getHardDropY(state.board, state.current)
      const dropped = { ...state.current, y: dropY }
      const distance = dropY - state.current.y
      // 硬降按下落距离加 2 倍分数
      return lockAndSpawn({
        ...state,
        current: dropped,
        score: state.score + distance * 2,
      })
    }

    case 'TOGGLE_PAUSE':
      if (state.status === 'playing') return { ...state, status: 'paused' }
      if (state.status === 'paused') return { ...state, status: 'playing' }
      return state

    default:
      return state
  }
}

export function useTetris() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const start = useCallback(() => dispatch({ type: 'START' }), [])
  const moveLeft = useCallback(() => dispatch({ type: 'MOVE_LEFT' }), [])
  const moveRight = useCallback(() => dispatch({ type: 'MOVE_RIGHT' }), [])
  const rotate = useCallback(() => dispatch({ type: 'ROTATE' }), [])
  const softDrop = useCallback(() => dispatch({ type: 'SOFT_DROP' }), [])
  const hardDrop = useCallback(() => dispatch({ type: 'HARD_DROP' }), [])
  const togglePause = useCallback(() => dispatch({ type: 'TOGGLE_PAUSE' }), [])

  // 自动下落计时器：根据等级调整速度
  useEffect(() => {
    if (state.status !== 'playing') return
    const interval = getDropInterval(state.level)
    const timer = setInterval(() => dispatch({ type: 'TICK' }), interval)
    return () => clearInterval(timer)
  }, [state.status, state.level])

  // 键盘控制
  useEffect(() => {
    const handleKey = (e) => {
      const status = stateRef.current.status
      // 空格/P 等控制键阻止页面滚动
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault()
      }
      switch (e.key) {
        case 'ArrowLeft':
          moveLeft()
          break
        case 'ArrowRight':
          moveRight()
          break
        case 'ArrowDown':
          softDrop()
          break
        case 'ArrowUp':
          rotate()
          break
        case ' ':
          if (status === 'playing') hardDrop()
          break
        case 'p':
        case 'P':
          togglePause()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [moveLeft, moveRight, softDrop, rotate, hardDrop, togglePause])

  return {
    state,
    actions: { start, moveLeft, moveRight, rotate, softDrop, hardDrop, togglePause },
  }
}
