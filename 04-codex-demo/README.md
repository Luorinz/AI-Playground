# Flappy Bird Codex Demo

A playable Flappy Bird style browser game built with Vite, React, and Vitest.

## Run Locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Press Space or Arrow Up, or click/tap the game stage, to flap.

## Test

```bash
npm test
npm run test:coverage
npm run build
```

The test suite covers the deterministic game engine, scoring, collision handling, restart behavior, keyboard/stage input, and saved best score hydration.

## Deploy

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

The production assets are emitted to `dist/`. Any static host that supports single-page Vite apps can serve that directory.
