// 俄罗斯方块核心逻辑（纯函数，便于单元测试）
import { TETROMINOES, TETROMINO_TYPES } from "./tetrominoes.js";

// 游戏面板尺寸
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// 每消除一行的基础分数表（按一次消除的行数计分）
export const LINE_SCORES = [0, 100, 300, 500, 800];

// 难度定义：以简单为基准，中等下落速度比简单快 50%，困难比中等再快 50%
// speedMultiplier 表示下落速度倍率，间隔 = 基础间隔 / 倍率
export const DIFFICULTIES = {
  easy: { label: "简单", speedMultiplier: 1 },
  medium: { label: "中等", speedMultiplier: 1.5 },
  hard: { label: "困难", speedMultiplier: 2.25 },
};

export const DEFAULT_DIFFICULTY = "easy";

// 创建空面板：二维数组，每个单元格为 null（空）或颜色字符串
export function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null),
  );
}

// 随机生成一个新方块类型
export function randomTetrominoType() {
  const index = Math.floor(Math.random() * TETROMINO_TYPES.length);
  return TETROMINO_TYPES[index];
}

// 根据类型创建一个处于初始位置的方块对象
export function createPiece(type) {
  const def = TETROMINOES[type];
  const shape = def.shapes[0];
  // 让方块水平居中出现在顶部
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  return {
    type,
    color: def.color,
    rotation: 0,
    x,
    y: 0,
  };
}

// 获取方块当前旋转状态对应的形状矩阵
export function getShape(piece) {
  return TETROMINOES[piece.type].shapes[piece.rotation];
}

// 检查方块在指定位置/旋转下是否与面板发生碰撞（越界或重叠）
export function isValidPosition(
  board,
  piece,
  offsetX = 0,
  offsetY = 0,
  rotation = piece.rotation,
) {
  const shape = TETROMINOES[piece.type].shapes[rotation];
  const newX = piece.x + offsetX;
  const newY = piece.y + offsetY;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 0) continue;
      const boardX = newX + col;
      const boardY = newY + row;

      // 左右及底部越界
      if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
        return false;
      }
      // 顶部以上允许（方块刚生成时），但若落在面板内则需检查重叠
      if (boardY >= 0 && board[boardY][boardX] !== null) {
        return false;
      }
    }
  }
  return true;
}

// 将方块固定到面板上，返回新的面板（不可变）
export function mergePiece(board, piece) {
  const newBoard = board.map((row) => [...row]);
  const shape = getShape(piece);

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 0) continue;
      const boardX = piece.x + col;
      const boardY = piece.y + row;
      if (
        boardY >= 0 &&
        boardY < BOARD_HEIGHT &&
        boardX >= 0 &&
        boardX < BOARD_WIDTH
      ) {
        newBoard[boardY][boardX] = piece.color;
      }
    }
  }
  return newBoard;
}

// 清除已填满的行，返回 { board, linesCleared, clearedRows, clearedCells }
// clearedRows：被消除行的原始行号；clearedCells：被消除格子的 {x, y, color}，供粒子特效使用
export function clearLines(board) {
  const clearedRows = [];
  const clearedCells = [];

  board.forEach((row, y) => {
    const isFull = row.every((cell) => cell !== null);
    if (isFull) {
      clearedRows.push(y);
      row.forEach((color, x) => {
        clearedCells.push({ x, y, color });
      });
    }
  });

  const remainingRows = board.filter((row) =>
    row.some((cell) => cell === null),
  );
  const linesCleared = BOARD_HEIGHT - remainingRows.length;

  // 在顶部补充等量的空行
  const emptyRows = Array.from({ length: linesCleared }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null),
  );

  return {
    board: [...emptyRows, ...remainingRows],
    linesCleared,
    clearedRows,
    clearedCells,
  };
}

// 根据消除行数和当前等级计算得分增量
export function calculateScore(linesCleared, level) {
  return LINE_SCORES[linesCleared] * level;
}

// 根据已消除总行数计算等级（每 10 行升一级，从 1 级起）
export function calculateLevel(totalLines) {
  return Math.floor(totalLines / 10) + 1;
}

// 根据等级和难度计算方块自动下落间隔（毫秒）；等级越高、难度越大越快
export function getDropInterval(level, difficulty = DEFAULT_DIFFICULTY) {
  const base = Math.max(100, 1000 - (level - 1) * 100);
  const { speedMultiplier } =
    DIFFICULTIES[difficulty] || DIFFICULTIES[DEFAULT_DIFFICULTY];
  return Math.max(100, Math.round(base / speedMultiplier));
}

// 旋转方块：尝试普通旋转，失败则进行简单的踢墙（wall kick）
export function rotatePiece(board, piece) {
  const shapes = TETROMINOES[piece.type].shapes;
  const nextRotation = (piece.rotation + 1) % shapes.length;

  // 依次尝试：原位、左移1、右移1、左移2、右移2
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (isValidPosition(board, piece, kick, 0, nextRotation)) {
      return { ...piece, rotation: nextRotation, x: piece.x + kick };
    }
  }
  // 全部失败则保持不变
  return piece;
}

// 计算硬降（瞬间落底）后方块的最终 y 坐标
export function getHardDropY(board, piece) {
  let dropY = 0;
  while (isValidPosition(board, piece, 0, dropY + 1)) {
    dropY++;
  }
  return piece.y + dropY;
}
