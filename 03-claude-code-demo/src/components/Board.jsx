import { getShape, BOARD_WIDTH, BOARD_HEIGHT } from '../game/gameLogic.js'

// 将当前下落方块叠加到面板上，生成用于渲染的显示面板（不修改原数据）
function getDisplayBoard(board, piece) {
  const display = board.map((row) => [...row])
  if (!piece) return display

  const shape = getShape(piece)
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 0) continue
      const y = piece.y + row
      const x = piece.x + col
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        display[y][x] = piece.color
      }
    }
  }
  return display
}

export default function Board({ board, piece }) {
  const display = getDisplayBoard(board, piece)

  return (
    <div className="board" data-testid="board">
      {display.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={`cell ${cell ? 'filled' : ''}`}
            style={cell ? { backgroundColor: cell } : undefined}
            data-testid={`cell-${y}-${x}`}
          />
        ))
      )}
    </div>
  )
}
