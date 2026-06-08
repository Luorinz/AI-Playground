import '@testing-library/jest-dom/vitest';

beforeAll(() => {
  let frame = 0;

  window.requestAnimationFrame = (callback) => {
    frame += 1;
    return window.setTimeout(() => callback(frame * 16), 16);
  };

  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
});
