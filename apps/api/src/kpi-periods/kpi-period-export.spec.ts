import assert from 'node:assert/strict';
import { test } from 'node:test';

import readXlsxFile from 'read-excel-file/node';

import { toSalaryPayout } from '../employee-salaries/salary-payout.js';
import type { EmployeeSalaryEntity } from '../employee-salaries/entities/employee-salary.entity.js';
import {
  buildKpiPeriodExport,
  kpiExportFileName,
  totalPayableByCurrency,
  type KpiExportPlanRow,
} from './kpi-period-export.js';

function salary(amount: number, currency: 'TMT' | 'USD', fixedPercent: number) {
  return {
    effectiveMonth: '2026-06-01',
    amount,
    currency,
    fixedPercent,
    kpiPercent: 100 - fixedPercent,
  } as EmployeeSalaryEntity;
}

const JAHAN: KpiExportPlanRow = {
  erpCode: '006',
  firstname: 'Jahan',
  lastname: 'Mukamova',
  username: 'jahan',
  jobTitle: 'Satyjy',
  storeName: 'LOREM',
  templateName: 'Mudir KPI 2026',
  totalScore: 81.1,
  scoredItemCount: 5,
  itemCount: 5,
  salary: toSalaryPayout(salary(12_000, 'TMT', 30), 81.1),
};

const MEKAN: KpiExportPlanRow = {
  ...JAHAN,
  erpCode: null,
  firstname: 'Mekan',
  lastname: 'Mekanow',
  username: 'mekan',
  jobTitle: null,
  storeName: null,
  totalScore: null,
  scoredItemCount: 0,
  salary: toSalaryPayout(salary(1_000, 'USD', 50), null),
};

void test('the file is named after the period and who downloaded it', () => {
  assert.equal(kpiExportFileName('2026-07', 'admin'), '2026-07_KPI_admin.xlsx');
  // The name travels in a header, so only plain ASCII survives.
  assert.equal(kpiExportFileName('2026-07', 'şükrü.a'), '2026-07_KPI___kr_.a.xlsx');
  assert.equal(kpiExportFileName('2026-07', ''), '2026-07_KPI_user.xlsx');
});

void test('the payable total adds up per currency and skips plans without a score', () => {
  // 12,000 × 30 % = 3,600 fixed; 8,400 × 81.1 / 100 = 6,812.40 earned.
  assert.deepEqual([...totalPayableByCurrency([JAHAN, MEKAN])], [['TMT', 10_412.4]]);
});

void test('the workbook has the summary, the KPI rows and what the file is', async () => {
  const file = await buildKpiPeriodExport(
    {
      periodLabel: '2026-07',
      isOpen: true,
      exportedAt: '2026-09-28 17:30',
      exportedBy: 'System Administrator (@admin)',
      calculatedAt: null,
    },
    [JAHAN, MEKAN],
    [
      {
        erpCode: '006',
        firstname: 'Jahan',
        lastname: 'Mukamova',
        kpiName: 'Mağaza bazında ciro',
        weight: 51,
        unit: 'USD',
        targetValue: 4_000,
        actualValue: 9_177.85,
        rawAchievement: 229.45,
        cappedAchievement: 100,
        weightedScore: 51,
        salaryValue: 4_284,
        salaryEarned: 4_284,
      },
    ],
    'tr',
  );
  const sheets = await readXlsxFile(file);

  assert.deepEqual(
    sheets.map((sheet) => sheet.sheet),
    ['Özet', 'KPI ayrıntıları', 'Bilgi'],
  );

  const summary = sheets[0]?.data ?? [];

  assert.deepEqual(summary[0]?.slice(0, 9), [
    'ERP kodu',
    'Ad',
    'Soyad',
    'Kullanıcı adı',
    'Görevi',
    'Mağaza',
    'Şablon',
    'KPI puanı',
    'Puanlanan KPI',
  ]);
  assert.deepEqual(summary[1], [
    '006',
    'Jahan',
    'Mukamova',
    'jahan',
    'Satyjy',
    'LOREM',
    'Mudir KPI 2026',
    81.1,
    '5/5',
    12_000,
    'TMT',
    30,
    70,
    3_600,
    8_400,
    6_812.4,
    10_412.4,
    '2026-06',
  ]);
  // Never calculated: no score and nothing earned, but the salary is still shown.
  assert.equal(summary[2]?.[7], null);
  assert.equal(summary[2]?.[9], 1_000);
  assert.equal(summary[2]?.[15], null);

  assert.deepEqual(sheets[1]?.data[1]?.slice(3, 9), [
    'Mağaza bazında ciro',
    51,
    'USD',
    4_000,
    9_177.85,
    229.45,
  ]);

  const about = sheets[2]?.data ?? [];

  assert.deepEqual(about[0], ['Dönem', '2026-07']);
  assert.deepEqual(about[4], ['Bu dönem alınacak toplam (TMT)', 10_412.4]);
});
