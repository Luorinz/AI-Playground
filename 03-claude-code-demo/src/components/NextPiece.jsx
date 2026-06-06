import { TETROMINOES } from '../game/tetrominoes.js'

// 显示下一个方块的预览
export default function NextPiece({ type }) {
  if (!type) {
    return <div className="next-preview" data-testid="next-preview" />
  }

  const def = TETROMINOES[type]
  const shape = def.shapes[0]

  return (
    <div
      className="next-preview"
      data-testid="next-preview"
      style={{ gridTemplateColumns: `repeat(${shape[0].length}, 1fr)` }}
    >
      {shape.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={`mini-cell ${cell ? 'filled' : ''}`}
            style={cell ? { backgroundColor: def.color } : undefined}
          />
        ))
      )}
    </div>
  )
}
