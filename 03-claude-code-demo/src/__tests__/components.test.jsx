import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Board from "../components/Board.jsx";
import NextPiece from "../components/NextPiece.jsx";
import ScorePanel from "../components/ScorePanel.jsx";
import DifficultySelector from "../components/DifficultySelector.jsx";
import {
  createEmptyBoard,
  createPiece,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from "../game/gameLogic.js";

describe("Board 组件", () => {
  it("渲染出正确数量的单元格", () => {
    const board = createEmptyBoard();
    render(<Board board={board} piece={null} />);
    const cells = screen.getAllByTestId(/^cell-/);
    expect(cells).toHaveLength(BOARD_WIDTH * BOARD_HEIGHT);
  });

  it("将当前方块叠加显示在面板上", () => {
    const board = createEmptyBoard();
    const piece = { ...createPiece("O"), x: 0, y: 0 };
    render(<Board board={board} piece={piece} />);
    // O 方块占据左上角 2x2
    expect(screen.getByTestId("cell-0-0")).toHaveClass("filled");
    expect(screen.getByTestId("cell-1-1")).toHaveClass("filled");
    // 远处单元格应为空
    expect(screen.getByTestId("cell-5-5")).not.toHaveClass("filled");
  });
});

describe("NextPiece 组件", () => {
  it("无类型时渲染空预览", () => {
    render(<NextPiece type={null} />);
    expect(screen.getByTestId("next-preview")).toBeInTheDocument();
  });

  it("渲染指定方块预览", () => {
    const { container } = render(<NextPiece type="T" />);
    const filled = container.querySelectorAll(".mini-cell.filled");
    // T 方块有 4 个实心格
    expect(filled).toHaveLength(4);
  });
});

describe("ScorePanel 组件", () => {
  it("显示分数、行数与等级", () => {
    render(
      <ScorePanel score={1200} lines={5} level={2} next="I" status="playing" />,
    );
    expect(screen.getByTestId("score")).toHaveTextContent("1200");
    expect(screen.getByTestId("lines")).toHaveTextContent("5");
    expect(screen.getByTestId("level")).toHaveTextContent("2");
  });

  it("暂停时显示暂停徽标", () => {
    render(
      <ScorePanel score={0} lines={0} level={1} next="I" status="paused" />,
    );
    expect(screen.getByText("已暂停")).toBeInTheDocument();
  });

  it("非暂停状态不显示暂停徽标", () => {
    render(
      <ScorePanel score={0} lines={0} level={1} next="I" status="playing" />,
    );
    expect(screen.queryByText("已暂停")).not.toBeInTheDocument();
  });

  it("传入难度时显示难度", () => {
    render(
      <ScorePanel
        score={0}
        lines={0}
        level={1}
        next="I"
        status="playing"
        difficulty="困难"
      />,
    );
    expect(screen.getByTestId("difficulty")).toHaveTextContent("困难");
  });

  it("未传入难度时不显示难度栏", () => {
    render(
      <ScorePanel score={0} lines={0} level={1} next="I" status="playing" />,
    );
    expect(screen.queryByTestId("difficulty")).not.toBeInTheDocument();
  });
});

describe("DifficultySelector 组件", () => {
  it("渲染三个难度按钮", () => {
    render(<DifficultySelector value="easy" onChange={() => {}} />);
    expect(screen.getByTestId("difficulty-easy")).toHaveTextContent("简单");
    expect(screen.getByTestId("difficulty-medium")).toHaveTextContent("中等");
    expect(screen.getByTestId("difficulty-hard")).toHaveTextContent("困难");
  });

  it("当前选中项带 active 样式且 aria-pressed 为真", () => {
    render(<DifficultySelector value="medium" onChange={() => {}} />);
    const medium = screen.getByTestId("difficulty-medium");
    expect(medium).toHaveClass("active");
    expect(medium).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("difficulty-easy")).not.toHaveClass("active");
  });

  it("点击难度按钮触发 onChange", () => {
    const onChange = vi.fn();
    render(<DifficultySelector value="easy" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("difficulty-hard"));
    expect(onChange).toHaveBeenCalledWith("hard");
  });
});
