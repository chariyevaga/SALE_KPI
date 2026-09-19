import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getFirmNumber, getTigerSharedCustomerCodes } from './environment.js';

function withEnvironment(values: Record<string, string | undefined>, run: () => void): void {
  const previous = Object.fromEntries(Object.keys(values).map((name) => [name, process.env[name]]));

  try {
    for (const [name, value] of Object.entries(values)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }

    run();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
}

void test('reads shared cash account codes as a trimmed, de-duplicated list', () => {
  withEnvironment(
    { TIGER_SHARED_CUSTOMER_CODES: ' 120.99361279916, 120.00003 ,,120.00003' },
    () => {
      assert.deepEqual(getTigerSharedCustomerCodes(), ['120.99361279916', '120.00003']);
    },
  );

  withEnvironment({ TIGER_SHARED_CUSTOMER_CODES: undefined }, () => {
    assert.deepEqual(getTigerSharedCustomerCodes(), []);
  });
});

void test('rejects codes longer than the Tiger CODE column', () => {
  withEnvironment({ TIGER_SHARED_CUSTOMER_CODES: '120.9936127991600000' }, () => {
    assert.throws(() => getTigerSharedCustomerCodes(), /at most 17 characters/);
  });
});

void test('keeps the firm number within what Logo supports', () => {
  withEnvironment({ FIRM_NR: '3' }, () => assert.equal(getFirmNumber(), 3));
  withEnvironment({ FIRM_NR: '1000' }, () =>
    assert.throws(() => getFirmNumber(), /FIRM_NR must be an integer between 1 and 999/),
  );
  withEnvironment({ FIRM_NR: '0' }, () => assert.throws(() => getFirmNumber()));
});
