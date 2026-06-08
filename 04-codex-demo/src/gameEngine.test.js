import {
  BIRD_RADIUS,
  BIRD_X,
  FLAP_VELOCITY,
  PIPE_SPEED,
  PIPE_WIDTH,
  createInitialGame,
  flap,
  hasCollision,
  restartGame,
  tickGame,
} from './gameEngine.js';

describe('game engine', () => {
  it('creates deterministic initial pipes from the same seed', () => {
    const first = createInitialGame({ seed: 42 });
    const second = createInitialGame({ seed: 42 });

    expect(first.pipes).toEqual(second.pipes);
    expect(first.phase).toBe('ready');
    expect(first.score).toBe(0);
  });

  it('flap starts the game and applies upward velocity', () => {
    const game = flap(createInitialGame());

    expect(game.phase).toBe('playing');
    expect(game.velocity).toBe(FLAP_VELOCITY);
  });

  it('moves the bird and pipes during a playing tick', () => {
    const game = flap(createInitialGame());
    const next = tickGame(game, 0.1);

    expect(next.birdY).toBeLessThan(game.birdY);
    expect(next.pipes[0].x).toBeCloseTo(game.pipes[0].x - PIPE_SPEED / 30, 5);
  });

  it('scores when the bird passes an unscored pipe', () => {
    const game = {
      ...flap(createInitialGame()),
      birdY: 286,
      pipes: [
        {
          id: 1,
          x: BIRD_X - BIRD_RADIUS - PIPE_WIDTH - 4,
          gapTop: 180,
          gapBottom: 360,
          scored: false,
        },
        { id: 2, x: 260, gapTop: 180, gapBottom: 360, scored: false },
        { id: 3, x: 500, gapTop: 180, gapBottom: 360, scored: false },
      ],
    };

    const next = tickGame(game, 0.01);

    expect(next.score).toBe(1);
    expect(next.pipes[0].scored).toBe(true);
  });

  it('detects ground and pipe collisions', () => {
    expect(hasCollision(570, [])).toBe(true);
    expect(
      hasCollision(250, [
        {
          id: 1,
          x: BIRD_X,
          gapTop: 300,
          gapBottom: 430,
          scored: false,
        },
      ])
    ).toBe(true);
  });

  it('ends the game and stores the best score after a crash', () => {
    const game = {
      ...flap(createInitialGame()),
      score: 3,
      bestScore: 1,
      birdY: 250,
      pipes: [
        {
          id: 1,
          x: BIRD_X,
          gapTop: 300,
          gapBottom: 430,
          scored: false,
        },
      ],
    };

    const next = tickGame(game, 0.01);

    expect(next.phase).toBe('gameOver');
    expect(next.bestScore).toBe(3);
  });

  it('ignores flap while game over', () => {
    const game = { ...createInitialGame(), phase: 'gameOver' };

    expect(flap(game)).toBe(game);
  });

  it('restarts with the best score preserved', () => {
    const restarted = restartGame({
      ...createInitialGame({ seed: 12 }),
      score: 4,
      bestScore: 2,
    });

    expect(restarted.phase).toBe('ready');
    expect(restarted.score).toBe(0);
    expect(restarted.bestScore).toBe(4);
    expect(restarted.seed).toBe(13);
  });
});
