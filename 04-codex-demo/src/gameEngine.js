export const GAME_WIDTH = 420;
export const GAME_HEIGHT = 640;
export const GROUND_HEIGHT = 72;
export const BIRD_X = 112;
export const BIRD_RADIUS = 17;
export const PIPE_WIDTH = 70;
export const PIPE_GAP = 158;
export const PIPE_SPACING = 236;
export const PIPE_SPEED = 174;
export const GRAVITY = 1480;
export const FLAP_VELOCITY = -430;

const FIRST_PIPE_X = GAME_WIDTH + 86;
const MAX_DELTA_SECONDS = 1 / 30;

export function createSeededRandom(seed = 1) {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function createPipe(x, random = Math.random, id = 0) {
  const playHeight = GAME_HEIGHT - GROUND_HEIGHT;
  const margin = 86;
  const minCenter = margin + PIPE_GAP / 2;
  const maxCenter = playHeight - margin - PIPE_GAP / 2;
  const gapCenter = minCenter + random() * (maxCenter - minCenter);

  return {
    id,
    x,
    gapTop: Math.round(gapCenter - PIPE_GAP / 2),
    gapBottom: Math.round(gapCenter + PIPE_GAP / 2),
    scored: false,
  };
}

export function createInitialGame({ seed = 7 } = {}) {
  const random = createSeededRandom(seed);
  const pipes = Array.from({ length: 3 }, (_, index) =>
    createPipe(FIRST_PIPE_X + index * PIPE_SPACING, random, index + 1)
  );

  return {
    phase: 'ready',
    birdY: 286,
    velocity: 0,
    score: 0,
    bestScore: 0,
    pipes,
    nextPipeId: pipes.length + 1,
    seed,
    random,
  };
}

export function restartGame(previous) {
  const seed = previous.seed + 1;
  return {
    ...createInitialGame({ seed }),
    bestScore: Math.max(previous.bestScore, previous.score),
  };
}

export function flap(game) {
  if (game.phase === 'gameOver') {
    return game;
  }

  return {
    ...game,
    phase: 'playing',
    velocity: FLAP_VELOCITY,
  };
}

export function tickGame(game, deltaSeconds) {
  if (game.phase !== 'playing') {
    return game;
  }

  const dt = Math.min(deltaSeconds, MAX_DELTA_SECONDS);
  const velocity = game.velocity + GRAVITY * dt;
  const birdY = game.birdY + velocity * dt;
  const shiftedPipes = game.pipes.map((pipe) => ({
    ...pipe,
    x: pipe.x - PIPE_SPEED * dt,
  }));

  let score = game.score;
  const scoredPipes = shiftedPipes.map((pipe) => {
    if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X - BIRD_RADIUS) {
      score += 1;
      return { ...pipe, scored: true };
    }

    return pipe;
  });

  const { pipes, nextPipeId } = recyclePipes(scoredPipes, game.random, game.nextPipeId);
  const crashed = hasCollision(birdY, pipes);
  const phase = crashed ? 'gameOver' : 'playing';
  const bestScore = crashed ? Math.max(game.bestScore, score) : game.bestScore;

  return {
    ...game,
    phase,
    birdY,
    velocity,
    pipes,
    nextPipeId,
    score,
    bestScore,
  };
}

export function hasCollision(birdY, pipes) {
  const birdTop = birdY - BIRD_RADIUS;
  const birdBottom = birdY + BIRD_RADIUS;

  if (birdTop <= 0 || birdBottom >= GAME_HEIGHT - GROUND_HEIGHT) {
    return true;
  }

  return pipes.some((pipe) => {
    const overlapsX =
      BIRD_X + BIRD_RADIUS > pipe.x && BIRD_X - BIRD_RADIUS < pipe.x + PIPE_WIDTH;

    if (!overlapsX) {
      return false;
    }

    return birdTop < pipe.gapTop || birdBottom > pipe.gapBottom;
  });
}

function recyclePipes(pipes, random, nextPipeId) {
  const visiblePipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -20);
  let id = nextPipeId;

  while (visiblePipes.length < 3) {
    const lastX = Math.max(...visiblePipes.map((pipe) => pipe.x), FIRST_PIPE_X);
    visiblePipes.push(createPipe(lastX + PIPE_SPACING, random, id));
    id += 1;
  }

  return { pipes: visiblePipes, nextPipeId: id };
}
