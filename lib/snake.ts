export type DirectionName = 'up' | 'down' | 'left' | 'right';
export type SnakeStatus = 'ready' | 'running' | 'paused' | 'gameover' | 'won';

export interface Point {
  x: number;
  y: number;
}

export interface SnakeConfig {
  rows: number;
  cols: number;
  initialLength: number;
  tickMs: number;
}

export interface SnakeState {
  rows: number;
  cols: number;
  snake: Point[];
  direction: DirectionName;
  queuedDirection: DirectionName | null;
  food: Point | null;
  score: number;
  status: SnakeStatus;
}

export type RandomNumberGenerator = () => number;

export const DIRECTION_VECTORS: Record<DirectionName, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export const DEFAULT_SNAKE_CONFIG: SnakeConfig = {
  rows: 14,
  cols: 14,
  initialLength: 3,
  tickMs: 160
};

export function createSnakeState(
  config: Partial<SnakeConfig> = {},
  rng: RandomNumberGenerator = Math.random
): SnakeState {
  const resolvedConfig = resolveConfig(config);
  const startX = Math.floor(resolvedConfig.cols / 2);
  const startY = Math.floor(resolvedConfig.rows / 2);
  const snake: Point[] = [];

  for (let index = 0; index < resolvedConfig.initialLength; index += 1) {
    snake.push({ x: startX - index, y: startY });
  }

  return spawnFood(
    {
      rows: resolvedConfig.rows,
      cols: resolvedConfig.cols,
      snake,
      direction: 'right',
      queuedDirection: null,
      food: null,
      score: 0,
      status: 'ready'
    },
    rng
  );
}

export function startSnake(state: SnakeState): SnakeState {
  if (state.status !== 'ready' && state.status !== 'paused') {
    return state;
  }

  return {
    ...state,
    status: 'running'
  };
}

export function togglePauseSnake(state: SnakeState): SnakeState {
  if (state.status === 'running') {
    return {
      ...state,
      status: 'paused'
    };
  }

  if (state.status === 'paused') {
    return {
      ...state,
      status: 'running'
    };
  }

  return state;
}

export function restartSnake(
  config: Partial<SnakeConfig> = {},
  rng: RandomNumberGenerator = Math.random
): SnakeState {
  return createSnakeState(config, rng);
}

export function queueDirection(state: SnakeState, requested: DirectionName): SnakeState {
  if (state.status === 'gameover' || state.status === 'won') {
    return state;
  }

  if (requested === state.direction || isOppositeDirection(state.direction, requested)) {
    return state;
  }

  return {
    ...state,
    queuedDirection: requested
  };
}

export function stepSnake(
  state: SnakeState,
  rng: RandomNumberGenerator = Math.random
): SnakeState {
  if (state.status !== 'running') {
    return state;
  }

  const direction = state.queuedDirection ?? state.direction;
  const vector = DIRECTION_VECTORS[direction];
  const currentHead = state.snake[0];
  const nextHead = {
    x: currentHead.x + vector.x,
    y: currentHead.y + vector.y
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= state.cols ||
    nextHead.y < 0 ||
    nextHead.y >= state.rows;

  if (hitWall) {
    return {
      ...state,
      direction,
      queuedDirection: null,
      status: 'gameover'
    };
  }

  const isEatingFood = Boolean(
    state.food && nextHead.x === state.food.x && nextHead.y === state.food.y
  );
  const collisionBody = isEatingFood ? state.snake : state.snake.slice(0, -1);
  const hitSelf = collisionBody.some(
    (segment) => segment.x === nextHead.x && segment.y === nextHead.y
  );

  if (hitSelf) {
    return {
      ...state,
      direction,
      queuedDirection: null,
      status: 'gameover'
    };
  }

  const nextSnake = isEatingFood
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)];

  const movedState: SnakeState = {
    ...state,
    snake: nextSnake,
    direction,
    queuedDirection: null,
    score: isEatingFood ? state.score + 1 : state.score
  };

  if (isEatingFood) {
    return spawnFood(movedState, rng);
  }

  return movedState;
}

export function advanceSnake(
  state: SnakeState,
  ticks: number,
  rng: RandomNumberGenerator = Math.random
): SnakeState {
  let nextState = state;
  const safeTicks = Math.max(0, Math.floor(ticks));

  for (let tick = 0; tick < safeTicks; tick += 1) {
    nextState = stepSnake(nextState, rng);
    if (nextState.status !== 'running') {
      break;
    }
  }

  return nextState;
}

export function spawnFood(
  state: SnakeState,
  rng: RandomNumberGenerator = Math.random
): SnakeState {
  const occupied = new Set(state.snake.map(pointKey));
  const emptyCells: Point[] = [];

  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      const key = pointKey({ x, y });
      if (!occupied.has(key)) {
        emptyCells.push({ x, y });
      }
    }
  }

  if (emptyCells.length === 0) {
    return {
      ...state,
      food: null,
      status: 'won'
    };
  }

  const choice = Math.min(emptyCells.length - 1, Math.floor(rng() * emptyCells.length));

  return {
    ...state,
    food: emptyCells[choice]
  };
}

export function pointKey(point: Point): string {
  return `${point.x}:${point.y}`;
}

function isOppositeDirection(current: DirectionName, requested: DirectionName): boolean {
  const currentVector = DIRECTION_VECTORS[current];
  const requestedVector = DIRECTION_VECTORS[requested];

  return (
    currentVector.x + requestedVector.x === 0 &&
    currentVector.y + requestedVector.y === 0
  );
}

function resolveConfig(config: Partial<SnakeConfig>): SnakeConfig {
  return {
    rows: config.rows ?? DEFAULT_SNAKE_CONFIG.rows,
    cols: config.cols ?? DEFAULT_SNAKE_CONFIG.cols,
    initialLength: Math.max(2, config.initialLength ?? DEFAULT_SNAKE_CONFIG.initialLength),
    tickMs: config.tickMs ?? DEFAULT_SNAKE_CONFIG.tickMs
  };
}
