// Vitest 测试环境初始化：引入 jest-dom 自定义匹配器
import "@testing-library/jest-dom";

// jsdom 未实现 canvas 2D 上下文，提供一个最小桩避免组件挂载报错
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    fillStyle: "",
    globalAlpha: 1,
  });
}
