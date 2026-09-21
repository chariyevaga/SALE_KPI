import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isCalculableKpi, planScore, scoreRow } from './kpi-result-rules.js';

void test('scores a row against its target and weight', () => {
  assert.deepEqual(scoreRow({ targetValue: 1000, actualValue: 800, weight: 50 }), {
    rawAchievement: 80,
    cappedAchievement: 80,
    weightedScore: 40,
  });
  assert.deepEqual(scoreRow({ targetValue: 400, actualValue: 300, weight: 15 }), {
    rawAchievement: 75,
    cappedAchievement: 75,
    weightedScore: 11.25,
  });
});

void test('keeps the raw achievement above 100 but caps the score at the weight', () => {
  const score = scoreRow({ targetValue: 1000, actualValue: 1450, weight: 30 });

  assert.equal(score.rawAchievement, 145);
  assert.equal(score.cappedAchievement, 100);
  assert.equal(score.weightedScore, 30);
});

void test('negative achievement is kept but never lowers the score below zero', () => {
  // More returns than sales in the month.
  const score = scoreRow({ targetValue: 1000, actualValue: -250, weight: 40 });

  assert.equal(score.rawAchievement, -25);
  assert.equal(score.cappedAchievement, 0);
  assert.equal(score.weightedScore, 0);
});

void test('a row without a target or without an actual value cannot be scored', () => {
  const empty = { rawAchievement: null, cappedAchievement: null, weightedScore: null };

  assert.deepEqual(scoreRow({ targetValue: null, actualValue: 500, weight: 20 }), empty);
  assert.deepEqual(scoreRow({ targetValue: 0, actualValue: 500, weight: 20 }), empty);
  assert.deepEqual(scoreRow({ targetValue: 500, actualValue: null, weight: 20 }), empty);
});

void test('zero is an actual value, not a missing one', () => {
  assert.deepEqual(scoreRow({ targetValue: 500, actualValue: 0, weight: 20 }), {
    rawAchievement: 0,
    cappedAchievement: 0,
    weightedScore: 0,
  });
});

void test('rounds to the two decimals the columns hold', () => {
  const score = scoreRow({ targetValue: 3, actualValue: 1, weight: 33.33 });

  assert.equal(score.rawAchievement, 33.33);
  assert.equal(score.weightedScore, 11.11);
});

void test('the plan total adds up the rows that could be scored', () => {
  const total = planScore([
    scoreRow({ targetValue: 1000, actualValue: 800, weight: 50 }),
    scoreRow({ targetValue: 400, actualValue: 300, weight: 15 }),
    scoreRow({ targetValue: 100, actualValue: 200, weight: 35 }),
  ]);

  assert.deepEqual(total, { totalScore: 86.25, scoredItemCount: 3, itemCount: 3 });
});

void test('unscored rows are counted but do not lower the total', () => {
  const total = planScore([
    scoreRow({ targetValue: 1000, actualValue: 1000, weight: 60 }),
    // The manual discipline KPI nobody has filled in yet.
    scoreRow({ targetValue: 100, actualValue: null, weight: 40 }),
  ]);

  assert.deepEqual(total, { totalScore: 60, scoredItemCount: 1, itemCount: 2 });
});

void test('a plan nothing could be scored in totals zero', () => {
  assert.deepEqual(planScore([]), { totalScore: 0, scoredItemCount: 0, itemCount: 0 });
});

void test('only the KPIs with a Tiger report are calculated', () => {
  assert.equal(isCalculableKpi('STORE_SALES'), true);
  assert.equal(isCalculableKpi('EMPLOYEE_PRODUCT_VARIETY'), true);
  // No visitor data, and discipline is a manager's judgement (docs/BUSINESS_RULES.md).
  assert.equal(isCalculableKpi('STORE_CONVERSION'), false);
  assert.equal(isCalculableKpi('EMPLOYEE_DISCIPLINE'), false);
});
