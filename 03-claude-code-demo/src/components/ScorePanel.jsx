import NextPiece from './NextPiece.jsx'

// 侧边信息面板：分数、行数、等级、下一个方块、控制说明
export default function ScorePanel({ score, lines, level, next, status }) {
  return (
    <div className="score-panel">
      <div className="stat">
        <span className="stat-label">分数</span>
        <span className="stat-value" data-testid="score">{score}</span>
      </div>
      <div className="stat">
        <span className="stat-label">消除行数</span>
        <span className="stat-value" data-testid="lines">{lines}</span>
      </div>
      <div className="stat">
        <span className="stat-label">等级</span>
        <span className="stat-value" data-testid="level">{level}</span>
      </div>

      <div className="next-section">
        <span className="stat-label">下一个</span>
        <NextPiece type={next} />
      </div>

      <div className="controls-help">
        <p className="help-title">操作说明</p>
        <ul>
          <li>← → 移动</li>
          <li>↑ 旋转</li>
          <li>↓ 软降</li>
          <li>空格 硬降</li>
          <li>P 暂停</li>
        </ul>
      </div>

      {status === 'paused' && <div className="status-badge">已暂停</div>}
    </div>
  )
}
