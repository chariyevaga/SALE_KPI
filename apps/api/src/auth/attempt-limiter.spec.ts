import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AttemptLimiter } from './attempt-limiter.js';

const MINUTE = 60_000;

function limiterAt(clock: { now: number }) {
  return new AttemptLimiter(
    { maxFailures: 5, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE },
    () => clock.now,
  );
}

void test('the fifth failure inside the window blocks the key for the block time', () => {
  const clock = { now: 0 };
  const limiter = limiterAt(clock);

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    limiter.recordFailure('admin');
    assert.equal(limiter.retryAfterSeconds('admin'), 0, `blocked too early at ${attempt}`);
  }

  limiter.recordFailure('admin');
  assert.equal(limiter.retryAfterSeconds('admin'), 15 * 60);

  clock.now = 10 * MINUTE;
  assert.equal(limiter.retryAfterSeconds('admin'), 5 * 60);

  clock.now = 15 * MINUTE;
  assert.equal(limiter.retryAfterSeconds('admin'), 0);
});

void test('failures older than the window do not count', () => {
  const clock = { now: 0 };
  const limiter = limiterAt(clock);

  for (let attempt = 0; attempt < 4; attempt += 1) limiter.recordFailure('admin');
  clock.now = 16 * MINUTE;
  limiter.recordFailure('admin');

  assert.equal(limiter.retryAfterSeconds('admin'), 0);
});

void test('a success resets the key; keys do not affect each other', () => {
  const clock = { now: 0 };
  const limiter = limiterAt(clock);

  for (let attempt = 0; attempt < 4; attempt += 1) limiter.recordFailure('admin');
  limiter.reset('admin');
  limiter.recordFailure('admin');
  assert.equal(limiter.retryAfterSeconds('admin'), 0);

  for (let attempt = 0; attempt < 5; attempt += 1) limiter.recordFailure('merjen');
  assert.ok(limiter.retryAfterSeconds('merjen') > 0);
  assert.equal(limiter.retryAfterSeconds('admin'), 0);
});
