import assert from 'node:assert/strict';
import { test } from 'node:test';

import { weightedAverage } from './kpi-recommendation-rules.js';

void test('a rate of several stores follows the store with more visitors', () => {
  // 5 % on 6,000 visitors and 10 % on 2,000: pooled 300 + 200 receipts / 8,000 = 6.25 %.
  assert.equal(
    weightedAverage([
      { value: 5, weight: 6_000 },
      { value: 10, weight: 2_000 },
    ]),
    6.25,
  );
});

void test('stores without a value are left out; no weights at all fall back to the mean', () => {
  assert.equal(
    weightedAverage([
      { value: 4, weight: 100 },
      { value: null, weight: 900 },
    ]),
    4,
  );
  assert.equal(
    weightedAverage([
      { value: 4, weight: 0 },
      { value: 6, weight: 0 },
    ]),
    5,
  );
  assert.equal(weightedAverage([{ value: null, weight: 10 }]), null);
});
