import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getCorsOrigin,
  getFirmNumber,
  getKpiAutoCalculationIntervalMinutes,
  getTigerPeriodNumbers,
  getTigerSharedCustomerCodes,
} from './environment.js';

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

void test('reads the KPI auto-calculation interval; 0 switches it off', () => {
  const name = 'KPI_AUTO_CALCULATION_INTERVAL_MINUTES';

  withEnvironment({ [name]: undefined }, () => {
    assert.equal(getKpiAutoCalculationIntervalMinutes(), 10);
  });

  withEnvironment({ [name]: '30' }, () => {
    assert.equal(getKpiAutoCalculationIntervalMinutes(), 30);
  });

  withEnvironment({ [name]: '0' }, () => {
    assert.equal(getKpiAutoCalculationIntervalMinutes(), 0);
  });

  for (const invalid of ['-1', '1.5', 'ten', '1441']) {
    withEnvironment({ [name]: invalid }, () => {
      assert.throws(() => getKpiAutoCalculationIntervalMinutes(), /between 0 \(off\) and 1440/);
    });
  }
});

void test('allows every origin in development and only the list elsewhere', () => {
  const origins = 'http://localhost:5555, https://kpi.example.com';

  withEnvironment({ NODE_ENV: 'development', CORS_ORIGINS: origins }, () => {
    assert.equal(getCorsOrigin(), true);
  });

  for (const mode of ['production', 'test', undefined]) {
    withEnvironment({ NODE_ENV: mode, CORS_ORIGINS: origins }, () => {
      assert.deepEqual(getCorsOrigin(), ['http://localhost:5555', 'https://kpi.example.com']);
    });
  }
});

void test('reads the Logo periods the KPI views union; the current period must be one of them', () => {
  withEnvironment({ TIGER_PERIOD_NR: '2', TIGER_PERIOD_NRS: undefined }, () => {
    assert.deepEqual(getTigerPeriodNumbers(), [2]);
  });

  withEnvironment({ TIGER_PERIOD_NR: '2', TIGER_PERIOD_NRS: ' 2, 1,2 ' }, () => {
    assert.deepEqual(getTigerPeriodNumbers(), [1, 2]);
  });

  withEnvironment({ TIGER_PERIOD_NR: '2', TIGER_PERIOD_NRS: '1' }, () => {
    assert.throws(() => getTigerPeriodNumbers(), /must include TIGER_PERIOD_NR/);
  });

  withEnvironment({ TIGER_PERIOD_NR: '1', TIGER_PERIOD_NRS: '1,x' }, () => {
    assert.throws(() => getTigerPeriodNumbers(), /comma-separated list/);
  });
});
