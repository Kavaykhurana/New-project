import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceSnake,
  createSnakeState,
  queueDirection,
  spawnFood,
  startSnake,
  stepSnake,
  type SnakeState
} from './snake.ts';

test('createSnakeState centers the snake and places food off-body', () => {
  const state = createSnakeState({ rows: 6, cols: 6, initialLength: 3 }, () => 0);

  assert.equal(state.status, 'ready');
  assert.deepEqual(state.snake, [
    { x: 3, y: 3 },
    { x: 2, y: 3 },
    { x: 1, y: 3 }
  ]);
  assert.deepEqual(state.food, { x: 0, y: 0 });
});

test('queueDirection ignores an immediate reverse turn', () => {
  const started = startSnake(createSnakeState({ rows: 6, cols: 6 }, () => 0.25));
  const reversed = queueDirection(started, 'left');

  assert.equal(reversed.queuedDirection, null);
});

test('stepSnake moves the head and clears queued input', () => {
  const started = startSnake(createSnakeState({ rows: 6, cols: 6 }, () => 0.25));
  const queued = queueDirection(started, 'down');
  const moved = stepSnake(queued, () => 0.25);

  assert.deepEqual(moved.snake, [
    { x: 3, y: 4 },
    { x: 3, y: 3 },
    { x: 2, y: 3 }
  ]);
  assert.equal(moved.direction, 'down');
  assert.equal(moved.queuedDirection, null);
});

test('stepSnake grows and increments score when food is eaten', () => {
  const started = startSnake(createSnakeState({ rows: 5, cols: 5 }, () => 0.6));
  const customState: SnakeState = {
    ...started,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 }
    ],
    direction: 'right',
    queuedDirection: null,
    food: { x: 3, y: 2 },
    score: 0
  };

  const eaten = stepSnake(customState, () => 0);

  assert.equal(eaten.score, 1);
  assert.equal(eaten.snake.length, 4);
  assert.deepEqual(eaten.snake[0], { x: 3, y: 2 });
  assert.notDeepEqual(eaten.food, { x: 3, y: 2 });
});

test('stepSnake ends the game on wall collision', () => {
  const state: SnakeState = {
    rows: 4,
    cols: 4,
    snake: [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 }
    ],
    direction: 'right',
    queuedDirection: null,
    food: { x: 0, y: 0 },
    score: 0,
    status: 'running'
  };

  const collided = stepSnake(state, () => 0.5);

  assert.equal(collided.status, 'gameover');
});

test('stepSnake ends the game on self collision', () => {
  const state: SnakeState = {
    rows: 6,
    cols: 6,
    snake: [
      { x: 3, y: 3 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 3, y: 4 }
    ],
    direction: 'up',
    queuedDirection: 'left',
    food: { x: 5, y: 5 },
    score: 0,
    status: 'running'
  };

  const collided = stepSnake(state, () => 0.5);

  assert.equal(collided.status, 'gameover');
});

test('spawnFood picks the only open cell and advanceSnake stops after game over', () => {
  const almostFull: SnakeState = {
    rows: 2,
    cols: 2,
    snake: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 }
    ],
    direction: 'right',
    queuedDirection: null,
    food: null,
    score: 0,
    status: 'running'
  };

  const withFood = spawnFood(almostFull, () => 0.9);

  assert.deepEqual(withFood.food, { x: 0, y: 1 });

  const advanced = advanceSnake(
    {
      ...almostFull,
      snake: [
        { x: 1, y: 0 },
        { x: 0, y: 0 }
      ],
      food: { x: 1, y: 1 }
    },
    5,
    () => 0.5
  );

  assert.equal(advanced.status, 'gameover');
});
