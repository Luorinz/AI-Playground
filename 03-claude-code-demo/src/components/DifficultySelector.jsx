import { DIFFICULTIES } from '../game/gameLogic.js'

// 难度选择器：在游戏开始前选择简单 / 中等 / 困难
export default function DifficultySelector({ value, onChange }) {
  return (
    <div className="difficulty-selector" data-testid="difficulty-selector">
      {Object.entries(DIFFICULTIES).map(([key, { label }]) => (
        <button
          key={key}
          type="button"
          className={`difficulty-btn ${value === key ? 'active' : ''}`}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          data-testid={`difficulty-${key}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
