import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HealthService } from './health.service.js';

void test('returns a valid API health response', () => {
  const health = new HealthService().getHealth();

  assert.equal(health.status, 'ok');
  assert.equal(health.service, 'api');
  assert.equal(Number.isNaN(Date.parse(health.timestamp)), false);
});
