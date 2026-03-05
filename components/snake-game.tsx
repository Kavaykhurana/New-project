'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  DEFAULT_SNAKE_CONFIG,
  advanceSnake,
  createSnakeState,
  pointKey,
  queueDirection,
  restartSnake,
  startSnake,
  togglePauseSnake,
  type DirectionName,
  type SnakeState
} from '@/lib/snake';

declare global {
  interface Window {
    advanceTime?: (ms: number) => Promise<void>;
    render_game_to_text?: () => string;
  }
}

const GAME_CONFIG = DEFAULT_SNAKE_CONFIG;
const INITIAL_GAME_STATE = createSnakeState(GAME_CONFIG, () => 0);

const GHOST_BUTTON_CLASS =
  'inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-200/25 bg-slate-950/45 px-4 py-3 text-sm font-semibold text-brand-50 transition hover:border-brand-300/50 hover:bg-brand-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';

const PRIMARY_BUTTON_CLASS =
  'inline-flex min-h-12 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-600/20 px-6 py-3 text-sm font-bold text-cyan-50 shadow-lg shadow-cyan-900/20 transition-all hover:border-cyan-400/60 hover:bg-cyan-600/30 hover:shadow-cyan-400/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';

const CONTROL_BUTTON_CLASS = GHOST_BUTTON_CLASS;

const DIRECTION_KEYS: Record<string, DirectionName> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right'
};

export function SnakeGame() {
  const [game, setGame] = useState<SnakeState>(INITIAL_GAME_STATE);
  const gameRef = useRef(game);
  const gameFrameRef = useRef<HTMLDivElement>(null);

  function updateGame(updater: (current: SnakeState) => SnakeState) {
    setGame((current) => {
      const next = updater(current);
      gameRef.current = next;
      return next;
    });
  }

  function updateGameSync(updater: (current: SnakeState) => SnakeState) {
    flushSync(() => {
      setGame((current) => {
        const next = updater(current);
        gameRef.current = next;
        return next;
      });
    });
  }

  function focusBoard() {
    gameFrameRef.current?.focus();
  }

  function queueMove(direction: DirectionName) {
    updateGame((current) => {
      let next = current;

      if (next.status === 'gameover' || next.status === 'won') {
        next = restartSnake(GAME_CONFIG);
      }

      if (next.status === 'ready') {
        next = startSnake(next);
      }

      return queueDirection(next, direction);
    });
    focusBoard();
  }

  function handlePrimaryAction() {
    updateGame((current) => {
      if (current.status === 'paused') {
        return togglePauseSnake(current);
      }

      if (current.status === 'ready') {
        return startSnake(current);
      }

      if (current.status === 'gameover' || current.status === 'won') {
        return startSnake(restartSnake(GAME_CONFIG));
      }

      return current;
    });
    focusBoard();
  }

  function handlePauseToggle() {
    updateGame(togglePauseSnake);
    focusBoard();
  }

  function handleRestart() {
    updateGame(() => restartSnake(GAME_CONFIG));
    focusBoard();
  }

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    focusBoard();
  }, []);

  useEffect(() => {
    if (game.status !== 'running') {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      updateGame((current) => advanceSnake(current, 1));
    }, GAME_CONFIG.tickMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [game.status]);

  useEffect(() => {
    function applyQueuedMove(direction: DirectionName) {
      setGame((current) => {
        let next = current;

        if (next.status === 'gameover' || next.status === 'won') {
          next = restartSnake(GAME_CONFIG);
        }

        if (next.status === 'ready') {
          next = startSnake(next);
        }

        next = queueDirection(next, direction);
        gameRef.current = next;
        return next;
      });
      focusBoard();
    }

    function applyPrimaryAction() {
      setGame((current) => {
        let next = current;

        if (next.status === 'paused') {
          next = togglePauseSnake(next);
        } else if (next.status === 'ready') {
          next = startSnake(next);
        } else if (next.status === 'gameover' || next.status === 'won') {
          next = startSnake(restartSnake(GAME_CONFIG));
        }

        gameRef.current = next;
        return next;
      });
      focusBoard();
    }

    function applyPauseToggle() {
      setGame((current) => {
        const next = togglePauseSnake(current);
        gameRef.current = next;
        return next;
      });
      focusBoard();
    }

    function applyRestart() {
      setGame(() => {
        const next = restartSnake(GAME_CONFIG);
        gameRef.current = next;
        return next;
      });
      focusBoard();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return;
      }

      const direction = DIRECTION_KEYS[event.key];
      if (direction) {
        event.preventDefault();
        applyQueuedMove(direction);
        return;
      }

      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();

        if (gameRef.current.status === 'running') {
          applyPauseToggle();
          return;
        }

        applyPrimaryAction();
        return;
      }

      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        applyPauseToggle();
        return;
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        applyRestart();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    window.render_game_to_text = () =>
      JSON.stringify({
        origin: '(0,0) is top-left, +x moves right, +y moves down',
        rows: gameRef.current.rows,
        cols: gameRef.current.cols,
        status: gameRef.current.status,
        score: gameRef.current.score,
        direction: gameRef.current.direction,
        queuedDirection: gameRef.current.queuedDirection,
        snake: gameRef.current.snake,
        food: gameRef.current.food
      });

    window.advanceTime = async (ms: number) => {
      const ticks = Math.max(1, Math.round(ms / GAME_CONFIG.tickMs));
      updateGameSync((current) => advanceSnake(current, ticks));
    };

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, []);

  const headKey = pointKey(game.snake[0]);
  const bodyKeys = new Set(game.snake.slice(1).map(pointKey));
  const foodKey = game.food ? pointKey(game.food) : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 text-slate-100 sm:px-5 md:px-8 lg:py-10">
      <header className="glass shadow-glass rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-100/75">Classic Arcade</p>
            <h1 className="text-2xl font-semibold text-brand-50 sm:text-3xl">Classic Snake</h1>
            <p className="max-w-2xl text-sm text-brand-100/75 sm:text-base">
              One screen, one snake, one food target. Use arrow keys or WASD to move, keep
              growing, and avoid walls or your own tail.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="glass shadow-glass rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-brand-100/70">Status</p>
              <p className="mt-1 text-lg font-semibold text-brand-50">{statusLabel(game)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={PRIMARY_BUTTON_CLASS}
                disabled={game.status === 'running'}
                onClick={handlePrimaryAction}
              >
                {primaryActionLabel(game)}
              </button>
              <button
                className={GHOST_BUTTON_CLASS}
                disabled={
                  game.status === 'ready' || game.status === 'gameover' || game.status === 'won'
                }
                onClick={handlePauseToggle}
              >
                {game.status === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button className={GHOST_BUTTON_CLASS} onClick={handleRestart}>
                Restart
              </button>
            </div>
          </div>

          <div
            ref={gameFrameRef}
            tabIndex={0}
            aria-label="Snake board"
            className="rounded-2xl border border-brand-200/20 bg-slate-950/45 p-3 outline-none ring-brand-300/30 transition focus:ring-2 sm:p-4"
          >
            <div
              className="grid aspect-square w-full gap-1 rounded-xl bg-slate-950/30 p-1"
              style={{ gridTemplateColumns: `repeat(${game.cols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: game.rows * game.cols }, (_, cellIndex) => {
                const x = cellIndex % game.cols;
                const y = Math.floor(cellIndex / game.cols);
                const key = `${x}:${y}`;
                const isHead = key === headKey;
                const isBody = bodyKeys.has(key);
                const isFood = key === foodKey;

                let cellClass =
                  'border border-white/5 bg-slate-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]';

                if (isBody) {
                  cellClass =
                    'border border-brand-300/30 bg-gradient-to-br from-brand-500/90 to-brand-700/90';
                }

                if (isHead) {
                  cellClass =
                    'border border-cyan-200/40 bg-gradient-to-br from-cyan-300 to-brand-400';
                }

                if (isFood) {
                  cellClass =
                    'border border-rose-200/40 bg-gradient-to-br from-rose-300 to-orange-400';
                }

                return <div key={key} className={`aspect-square rounded-[0.35rem] ${cellClass}`} />;
              })}
            </div>
          </div>
        </div>

        <aside className="glass shadow-glass flex flex-col gap-4 rounded-2xl p-5">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <InfoCard label="Score" value={String(game.score)} />
            <InfoCard label="Length" value={String(game.snake.length)} />
            <InfoCard label="Speed" value={`${GAME_CONFIG.tickMs}ms`} />
          </div>

          <div className="rounded-2xl border border-brand-200/20 bg-slate-950/35 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-brand-100/70">How To Play</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-100/75">
              <li>Move with arrow keys or WASD.</li>
              <li>Press Space to start, pause, or resume.</li>
              <li>Press R or Restart to reset the board.</li>
              <li>Touch controls below work on smaller screens.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-brand-200/20 bg-slate-950/35 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-brand-100/70">Touch Controls</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div />
              <button className={CONTROL_BUTTON_CLASS} onClick={() => queueMove('up')} type="button">
                Up
              </button>
              <div />
              <button
                className={CONTROL_BUTTON_CLASS}
                onClick={() => queueMove('left')}
                type="button"
              >
                Left
              </button>
              <button
                className={CONTROL_BUTTON_CLASS}
                disabled={
                  game.status === 'ready' || game.status === 'gameover' || game.status === 'won'
                }
                onClick={handlePauseToggle}
                type="button"
              >
                {game.status === 'paused' ? 'Go' : 'Pause'}
              </button>
              <button
                className={CONTROL_BUTTON_CLASS}
                onClick={() => queueMove('right')}
                type="button"
              >
                Right
              </button>
              <div />
              <button
                className={CONTROL_BUTTON_CLASS}
                onClick={() => queueMove('down')}
                type="button"
              >
                Down
              </button>
              <button className={CONTROL_BUTTON_CLASS} onClick={handleRestart} type="button">
                Reset
              </button>
            </div>
          </div>

          <p className="text-sm text-brand-100/70">{statusDescription(game)}</p>
        </aside>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-200/20 bg-slate-950/35 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-brand-100/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-brand-50">{value}</p>
    </div>
  );
}

function primaryActionLabel(game: SnakeState): string {
  if (game.status === 'ready') {
    return 'Start Game';
  }

  if (game.status === 'paused') {
    return 'Resume';
  }

  if (game.status === 'gameover' || game.status === 'won') {
    return 'Play Again';
  }

  return 'Running';
}

function statusLabel(game: SnakeState): string {
  if (game.status === 'ready') {
    return 'Ready To Start';
  }

  if (game.status === 'paused') {
    return 'Paused';
  }

  if (game.status === 'gameover') {
    return 'Game Over';
  }

  if (game.status === 'won') {
    return 'Board Cleared';
  }

  return 'In Play';
}

function statusDescription(game: SnakeState): string {
  if (game.status === 'ready') {
    return 'The snake is centered and waiting. Start the round or press a direction key to begin immediately.';
  }

  if (game.status === 'paused') {
    return 'Movement is frozen. Resume when you are ready to continue the current path.';
  }

  if (game.status === 'gameover') {
    return 'The run ended because the snake hit a wall or collided with itself. Restart to try again.';
  }

  if (game.status === 'won') {
    return 'Every cell is filled. Restart to generate a fresh board and food sequence.';
  }

  return 'Food spawns off the snake body, and each pickup adds one segment plus one point to the score.';
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  );
}
