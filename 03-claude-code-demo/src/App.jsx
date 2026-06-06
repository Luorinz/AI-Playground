import { useTetris } from './game/useTetris.js'
import Board from './components/Board.jsx'
import ScorePanel from './components/ScorePanel.jsx'
import './App.css'

export default function App() {
  const { state, actions } = useTetris()
  const { board, current, next, score, lines, level, status } = state

  return (
    <div className="app">
      <h1 className="title">俄罗斯方块</h1>

      <div className="game-area">
        <div className="board-wrapper">
          <Board board={board} piece={current} />

          {status === 'idle' && (
            <div className="overlay" data-testid="overlay-idle">
              <p>准备好了吗？</p>
              <button onClick={actions.start} className="btn">
                开始游戏
              </button>
            </div>
          )}

          {status === 'gameover' && (
            <div className="overlay" data-testid="overlay-gameover">
              <p>游戏结束</p>
              <p className="final-score">最终得分：{score}</p>
              <button onClick={actions.start} className="btn">
                再来一局
              </button>
            </div>
          )}
        </div>

        <ScorePanel
          score={score}
          lines={lines}
          level={level}
          next={next}
          status={status}
        />
      </div>

      {status === 'playing' && (
        <button onClick={actions.togglePause} className="btn btn-secondary">
          暂停 / 继续
        </button>
      )}
    </div>
  )
}
