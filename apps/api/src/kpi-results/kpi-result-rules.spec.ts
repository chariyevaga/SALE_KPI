import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type ComparableResult,
  isCalculableKpi,
  MAX_RAW_ACHIEVEMENT,
  planScore,
  sameResults,
  scoreRow,
} from './kpi-result-rules.js';

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
    // A manual KPI nobody has filled in yet.
    scoreRow({ targetValue: 100, actualValue: null, weight: 40 }),
  ]);

  assert.deepEqual(total, { totalScore: 60, scoredItemCount: 1, itemCount: 2 });
});

void test('a plan nothing could be scored in totals zero', () => {
  assert.deepEqual(planScore([]), { totalScore: 0, scoredItemCount: 0, itemCount: 0 });
});

void test('report KPIs and the derived conversion are calculated; unknown codes are not', () => {
  assert.equal(isCalculableKpi('STORE_SALES'), true);
  assert.equal(isCalculableKpi('EMPLOYEE_PRODUCT_VARIETY'), true);
  // From Tiger receipts and the entered visitor counts since ADR-052.
  assert.equal(isCalculableKpi('STORE_CONVERSION'), true);
  assert.equal(isCalculableKpi('EMPLOYEE_DISCIPLINE'), false);
});

function resultRow(overrides: Partial<ComparableResult> = {}): ComparableResult {
  return {
    assignmentItemId: 'A1B2C3D4-0000-0000-0000-000000000001',
    targetValue: 1000,
    actualValue: 812.3456,
    source: 'calculated',
    weight: 50,
    ...scoreRow({ targetValue: 1000, actualValue: 812.3456, weight: 50 }),
    ...overrides,
  };
}

void test('sameResults: equal at the stored precision, whatever the GUID case', () => {
  const stored = [resultRow()];
  // A fresh Tiger sum carries more decimals than decimal(19,4) keeps.
  const next = [
    resultRow({
      assignmentItemId: 'a1b2c3d4-0000-0000-0000-000000000001',
      actualValue: 812.345600000001,
    }),
  ];

  assert.equal(sameResults(stored, next), true);
});

void test('sameResults: a moved value, a new row or a first calculation is a change', () => {
  const stored = [resultRow()];

  assert.equal(sameResults(stored, [resultRow({ actualValue: 900 })]), false);
  assert.equal(sameResults(stored, [resultRow({ targetValue: null })]), false);
  assert.equal(
    sameResults(stored, [
      resultRow(),
      resultRow({ assignmentItemId: 'a1b2c3d4-0000-0000-0000-000000000002' }),
    ]),
    false,
  );
  assert.equal(sameResults([], [resultRow()]), false);
  assert.equal(sameResults([], []), true);
});

void test('a tiny target cannot overflow the stored raw achievement', () => {
  // 1 TMT typed by mistake against 200,000 TMT of sales: 20,000,000 %.
  const score = scoreRow({ targetValue: 1, actualValue: 200_000, weight: 40 });

  assert.equal(score.rawAchievement, MAX_RAW_ACHIEVEMENT);
  assert.equal(score.cappedAchievement, 100);
  assert.equal(score.weightedScore, 40);
  assert.equal(
    scoreRow({ targetValue: 1, actualValue: -200_000, weight: 40 }).rawAchievement,
    -MAX_RAW_ACHIEVEMENT,
  );
});
