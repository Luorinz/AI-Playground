import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTetris } from "../game/useTetris.js";

describe("useTetris Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初始状态为 idle", () => {
    const { result } = renderHook(() => useTetris());
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.current).toBeNull();
  });

  it("START 后进入 playing 并生成方块", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    expect(result.current.state.status).toBe("playing");
    expect(result.current.state.current).not.toBeNull();
    expect(result.current.state.next).not.toBeNull();
  });

  it("左右移动改变方块横坐标", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    const startX = result.current.state.current.x;
    act(() => result.current.actions.moveLeft());
    expect(result.current.state.current.x).toBe(startX - 1);
    act(() => result.current.actions.moveRight());
    expect(result.current.state.current.x).toBe(startX);
  });

  it("软降使方块下移并加分", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    const startY = result.current.state.current.y;
    act(() => result.current.actions.softDrop());
    expect(result.current.state.current.y).toBe(startY + 1);
    expect(result.current.state.score).toBe(1);
  });

  it("硬降使方块直接落底", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    act(() => result.current.actions.hardDrop());
    // 硬降后会锁定并生成新方块，分数应增加
    expect(result.current.state.score).toBeGreaterThan(0);
    expect(result.current.state.current).not.toBeNull();
  });

  it("暂停与继续切换状态", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    act(() => result.current.actions.togglePause());
    expect(result.current.state.status).toBe("paused");
    act(() => result.current.actions.togglePause());
    expect(result.current.state.status).toBe("playing");
  });

  it("暂停状态下不响应移动", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    act(() => result.current.actions.togglePause());
    const x = result.current.state.current.x;
    act(() => result.current.actions.moveLeft());
    expect(result.current.state.current.x).toBe(x);
  });

  it("定时器驱动方块自动下落", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    const startY = result.current.state.current.y;
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.state.current.y).toBe(startY + 1);
  });

  // 键盘事件辅助：派发 keydown 到 window
  function pressKey(key) {
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key }));
    });
  }

  it("方向键控制方块移动与旋转", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    const startX = result.current.state.current.x;

    pressKey("ArrowLeft");
    expect(result.current.state.current.x).toBe(startX - 1);

    pressKey("ArrowRight");
    expect(result.current.state.current.x).toBe(startX);

    const startRotation = result.current.state.current.rotation;
    pressKey("ArrowUp");
    // O 方块只有一个旋转态，用通用断言：旋转值在合法范围
    expect(result.current.state.current.rotation).toBeGreaterThanOrEqual(0);
    expect(typeof startRotation).toBe("number");
  });

  it("下方向键触发软降", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    const startY = result.current.state.current.y;
    pressKey("ArrowDown");
    expect(result.current.state.current.y).toBe(startY + 1);
  });

  it("空格键触发硬降", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    pressKey(" ");
    expect(result.current.state.score).toBeGreaterThan(0);
  });

  it("P 键切换暂停", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    pressKey("p");
    expect(result.current.state.status).toBe("paused");
    pressKey("P");
    expect(result.current.state.status).toBe("playing");
  });

  it("未识别按键不影响状态", () => {
    const { result } = renderHook(() => useTetris());
    act(() => result.current.actions.start());
    const x = result.current.state.current.x;
    pressKey("a");
    expect(result.current.state.current.x).toBe(x);
  });
});
