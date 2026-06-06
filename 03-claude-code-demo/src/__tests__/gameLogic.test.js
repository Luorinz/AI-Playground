import { describe, it, expect } from "vitest";
import {
  createEmptyBoard,
  createPiece,
  getShape,
  isValidPosition,
  mergePiece,
  clearLines,
  calculateScore,
  calculateLevel,
  getDropInterval,
  rotatePiece,
  getHardDropY,
  randomTetrominoType,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from "../game/gameLogic.js";
import { TETROMINO_TYPES } from "../game/tetrominoes.js";

describe("createEmptyBoard", () => {
  it("创建尺寸正确的空面板", () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_HEIGHT);
    expect(board[0]).toHaveLength(BOARD_WIDTH);
  });

  it("所有单元格初始为 null", () => {
    const board = createEmptyBoard();
    expect(board.every((row) => row.every((cell) => cell === null))).toBe(true);
  });
});

describe("randomTetrominoType", () => {
  it("返回合法的方块类型", () => {
    for (let i = 0; i < 50; i++) {
      expect(TETROMINO_TYPES).toContain(randomTetrominoType());
    }
  });
});

describe("createPiece", () => {
  it("创建处于顶部居中位置的方块", () => {
    const piece = createPiece("T");
    expect(piece.type).toBe("T");
    expect(piece.rotation).toBe(0);
    expect(piece.y).toBe(0);
    expect(piece.color).toBeTruthy();
  });
});

describe("getShape", () => {
  it("返回当前旋转状态的形状矩阵", () => {
    const piece = createPiece("O");
    const shape = getShape(piece);
    expect(shape).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });
});

describe("isValidPosition", () => {
  it("方块在空面板内为合法位置", () => {
    const board = createEmptyBoard();
    const piece = createPiece("T");
    expect(isValidPosition(board, piece)).toBe(true);
  });

  it("方块左移越界时为非法", () => {
    const board = createEmptyBoard();
    const piece = { ...createPiece("O"), x: 0 };
    expect(isValidPosition(board, piece, -1, 0)).toBe(false);
  });

  it("方块右移越界时为非法", () => {
    const board = createEmptyBoard();
    const piece = { ...createPiece("O"), x: BOARD_WIDTH - 2 };
    expect(isValidPosition(board, piece, 1, 0)).toBe(false);
  });

  it("方块触底后再下移为非法", () => {
    const board = createEmptyBoard();
    const piece = { ...createPiece("O"), y: BOARD_HEIGHT - 2 };
    expect(isValidPosition(board, piece, 0, 1)).toBe(false);
  });

  it("与已有方块重叠时为非法", () => {
    const board = createEmptyBoard();
    board[1][4] = "#fff";
    const piece = { ...createPiece("O"), x: 4, y: 0 };
    expect(isValidPosition(board, piece, 0, 0)).toBe(false);
  });
});

describe("mergePiece", () => {
  it("将方块固定到面板且不修改原面板", () => {
    const board = createEmptyBoard();
    const piece = { ...createPiece("O"), x: 0, y: 0 };
    const newBoard = mergePiece(board, piece);
    expect(newBoard[0][0]).toBe(piece.color);
    expect(newBoard[1][1]).toBe(piece.color);
    // 原面板保持不变（不可变性）
    expect(board[0][0]).toBe(null);
  });
});

describe("clearLines", () => {
  it("消除填满的单行", () => {
    const board = createEmptyBoard();
    board[BOARD_HEIGHT - 1] = Array.from({ length: BOARD_WIDTH }, () => "#fff");
    const { board: newBoard, linesCleared } = clearLines(board);
    expect(linesCleared).toBe(1);
    expect(newBoard).toHaveLength(BOARD_HEIGHT);
    expect(newBoard[BOARD_HEIGHT - 1].every((c) => c === null)).toBe(true);
  });

  it("未填满时不消除", () => {
    const board = createEmptyBoard();
    board[BOARD_HEIGHT - 1][0] = "#fff";
    const { linesCleared } = clearLines(board);
    expect(linesCleared).toBe(0);
  });

  it("一次消除多行", () => {
    const board = createEmptyBoard();
    board[BOARD_HEIGHT - 1] = Array.from({ length: BOARD_WIDTH }, () => "#fff");
    board[BOARD_HEIGHT - 2] = Array.from({ length: BOARD_WIDTH }, () => "#fff");
    const { linesCleared } = clearLines(board);
    expect(linesCleared).toBe(2);
  });
});

describe("calculateScore", () => {
  it("按消除行数与等级计分", () => {
    expect(calculateScore(1, 1)).toBe(100);
    expect(calculateScore(4, 1)).toBe(800);
    expect(calculateScore(2, 3)).toBe(900);
    expect(calculateScore(0, 5)).toBe(0);
  });
});

describe("calculateLevel", () => {
  it("每 10 行升一级", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(9)).toBe(1);
    expect(calculateLevel(10)).toBe(2);
    expect(calculateLevel(25)).toBe(3);
  });
});

describe("getDropInterval", () => {
  it("等级越高下落越快", () => {
    expect(getDropInterval(1)).toBe(1000);
    expect(getDropInterval(2)).toBe(900);
    expect(getDropInterval(1)).toBeGreaterThan(getDropInterval(5));
  });

  it("有最小间隔下限", () => {
    expect(getDropInterval(100)).toBe(100);
  });

  it("默认难度为简单（倍率 1）", () => {
    expect(getDropInterval(1)).toBe(getDropInterval(1, "easy"));
  });

  it("中等难度比简单快 50%（间隔约为 2/3）", () => {
    // 1000 / 1.5 = 666.67 → 四舍五入 667
    expect(getDropInterval(1, "medium")).toBe(667);
  });

  it("困难难度比中等再快 50%（间隔约为简单的 1/2.25）", () => {
    // 1000 / 2.25 = 444.44 → 四舍五入 444
    expect(getDropInterval(1, "hard")).toBe(444);
  });

  it("难度越大间隔越短", () => {
    expect(getDropInterval(1, "easy")).toBeGreaterThan(
      getDropInterval(1, "medium"),
    );
    expect(getDropInterval(1, "medium")).toBeGreaterThan(
      getDropInterval(1, "hard"),
    );
  });

  it("困难难度仍受最小间隔下限约束", () => {
    expect(getDropInterval(100, "hard")).toBe(100);
  });

  it("未知难度回退到默认（简单）", () => {
    expect(getDropInterval(1, "unknown")).toBe(getDropInterval(1, "easy"));
  });
});

describe("rotatePiece", () => {
  it("在空面板中正常旋转方块", () => {
    const board = createEmptyBoard();
    const piece = createPiece("T");
    const rotated = rotatePiece(board, piece);
    expect(rotated.rotation).toBe(1);
  });

  it("O 形方块旋转后形状不变", () => {
    const board = createEmptyBoard();
    const piece = createPiece("O");
    const rotated = rotatePiece(board, piece);
    expect(getShape(rotated)).toEqual(getShape(piece));
  });

  it("靠墙时通过踢墙完成旋转", () => {
    const board = createEmptyBoard();
    // I 形方块贴左墙，旋转应触发踢墙
    const piece = { ...createPiece("I"), x: -1 };
    const rotated = rotatePiece(board, piece);
    expect(isValidPosition(board, rotated, 0, 0, rotated.rotation)).toBe(true);
  });
});

describe("getHardDropY", () => {
  it("计算方块落底后的 y 坐标", () => {
    const board = createEmptyBoard();
    const piece = createPiece("O");
    const dropY = getHardDropY(board, piece);
    // O 形方块高 2，落底后顶行应在 BOARD_HEIGHT - 2
    expect(dropY).toBe(BOARD_HEIGHT - 2);
  });

  it("遇到障碍时停在障碍上方", () => {
    const board = createEmptyBoard();
    board[BOARD_HEIGHT - 1] = Array.from({ length: BOARD_WIDTH }, () => "#fff");
    const piece = createPiece("O");
    const dropY = getHardDropY(board, piece);
    expect(dropY).toBe(BOARD_HEIGHT - 3);
  });
});
