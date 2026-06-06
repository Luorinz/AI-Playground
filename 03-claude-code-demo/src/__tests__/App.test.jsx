import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App.jsx";

describe("App 集成测试", () => {
  it("初始显示开始游戏覆盖层", () => {
    render(<App />);
    expect(screen.getByText("俄罗斯方块")).toBeInTheDocument();
    expect(screen.getByTestId("overlay-idle")).toBeInTheDocument();
    expect(screen.getByText("开始游戏")).toBeInTheDocument();
  });

  it("点击开始后隐藏覆盖层并显示暂停按钮", () => {
    render(<App />);
    fireEvent.click(screen.getByText("开始游戏"));
    expect(screen.queryByTestId("overlay-idle")).not.toBeInTheDocument();
    expect(screen.getByText("暂停 / 继续")).toBeInTheDocument();
  });

  it("开始后分数初始为 0", () => {
    render(<App />);
    fireEvent.click(screen.getByText("开始游戏"));
    expect(screen.getByTestId("score")).toHaveTextContent("0");
    expect(screen.getByTestId("level")).toHaveTextContent("1");
  });

  it("渲染游戏面板", () => {
    render(<App />);
    expect(screen.getByTestId("board")).toBeInTheDocument();
  });

  it("开始前显示难度选择器，默认选中简单", () => {
    render(<App />);
    expect(screen.getByTestId("difficulty-selector")).toBeInTheDocument();
    expect(screen.getByTestId("difficulty-easy")).toHaveClass("active");
  });

  it("选择困难难度后开始，侧边面板显示对应难度", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("difficulty-hard"));
    fireEvent.click(screen.getByText("开始游戏"));
    expect(screen.getByTestId("difficulty")).toHaveTextContent("困难");
  });

  it("默认难度开始时侧边面板显示简单", () => {
    render(<App />);
    fireEvent.click(screen.getByText("开始游戏"));
    expect(screen.getByTestId("difficulty")).toHaveTextContent("简单");
  });
});
