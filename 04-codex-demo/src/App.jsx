import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  BIRD_RADIUS,
  BIRD_X,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_HEIGHT,
  PIPE_WIDTH,
  createInitialGame,
  flap,
  restartGame,
  tickGame,
} from './gameEngine.js';

const STORAGE_KEY = 'flappy-bird-codex-best-score';

function getStoredBestScore() {
  const rawValue = window.localStorage?.getItem(STORAGE_KEY);
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function gameReducer(game, action) {
  switch (action.type) {
    case 'flap':
      return flap(game);
    case 'restart':
      return restartGame(game);
    case 'tick':
      return tickGame(game, action.deltaSeconds);
    case 'hydrateBest':
      return { ...game, bestScore: Math.max(game.bestScore, action.bestScore) };
    default:
      return game;
  }
}

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, createInitialGame);
  const lastFrame = useRef();

  useEffect(() => {
    dispatch({ type: 'hydrateBest', bestScore: getStoredBestScore() });
  }, []);

  useEffect(() => {
    window.localStorage?.setItem(STORAGE_KEY, String(game.bestScore));
  }, [game.bestScore]);

  useEffect(() => {
    let animationFrame;

    const step = (time) => {
      if (lastFrame.current === undefined) {
        lastFrame.current = time;
      }

      const deltaSeconds = (time - lastFrame.current) / 1000;
      lastFrame.current = time;
      dispatch({ type: 'tick', deltaSeconds });
      animationFrame = window.requestAnimationFrame(step);
    };

    animationFrame = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  const handleFlap = useCallback(() => {
    if (game.phase === 'gameOver') {
      dispatch({ type: 'restart' });
      lastFrame.current = undefined;
      return;
    }

    dispatch({ type: 'flap' });
  }, [game.phase]);

  const handleStagePointerDown = useCallback(
    (event) => {
      event.preventDefault();
      handleFlap();
    },
    [handleFlap]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        handleFlap();
      }

      if (event.code === 'Enter' && game.phase === 'gameOver') {
        event.preventDefault();
        dispatch({ type: 'restart' });
        lastFrame.current = undefined;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.phase, handleFlap]);

  const statusText =
    game.phase === 'ready'
      ? 'Press space, tap, or click to start'
      : game.phase === 'gameOver'
        ? 'Game over. Click or press Enter to restart'
        : 'Keep flying';

  return (
    <main className="app-shell">
      <section className="scorebar" aria-label="Score board">
        <div>
          <span className="scorebar__label">Score</span>
          <strong>{game.score}</strong>
        </div>
        <h1>Flappy Bird</h1>
        <div>
          <span className="scorebar__label">Best</span>
          <strong>{game.bestScore}</strong>
        </div>
      </section>

      <button
        className="game-stage"
        type="button"
        aria-label="Flappy Bird game area"
        onPointerDown={handleStagePointerDown}
        style={{ '--game-width': GAME_WIDTH, '--game-height': GAME_HEIGHT }}
      >
        <div className="sky" />
        <div className="cloud cloud--one" />
        <div className="cloud cloud--two" />

        {game.pipes.map((pipe) => (
          <div
            className="pipe"
            key={pipe.id}
            style={{
              left: pipe.x,
              width: PIPE_WIDTH,
              '--pipe-top-height': `${pipe.gapTop}px`,
              '--pipe-bottom-top': `${pipe.gapBottom}px`,
            }}
          />
        ))}

        <div
          className="bird"
          data-testid="bird"
          style={{
            left: BIRD_X - BIRD_RADIUS,
            top: game.birdY - BIRD_RADIUS,
            width: BIRD_RADIUS * 2,
            height: BIRD_RADIUS * 2,
            transform: `rotate(${Math.max(-24, Math.min(46, game.velocity / 12))}deg)`,
          }}
        >
          <span className="bird__wing" />
          <span className="bird__eye" />
        </div>

        <div className="ground" style={{ height: GROUND_HEIGHT }}>
          <span />
          <span />
          <span />
          <span />
        </div>

        {game.phase !== 'playing' && (
          <div className="game-message" role="status">
            <strong>{game.phase === 'ready' ? 'Ready' : 'Game Over'}</strong>
            <span>{statusText}</span>
          </div>
        )}
      </button>
    </main>
  );
}
