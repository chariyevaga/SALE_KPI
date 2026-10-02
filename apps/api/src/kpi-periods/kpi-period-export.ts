import writeXlsxFile, { type Cell, type Row, type SheetData } from 'write-excel-file/node';

import type { SalaryPayoutResponse } from '../employee-salaries/salary-payout.js';
import type { TemplateLanguage } from '../store-visitor-counts/visitor-count-template.js';

/**
 * The Excel file of a KPI period (ADR-059): one summary row per plan with the employee, the
 * score and what the salary pays; one row per KPI of every plan; and a sheet saying what the
 * file is. Pure: the service gathers the rows, this only lays them out.
 */

export interface KpiExportPlanRow {
  erpCode: string | null;
  firstname: string;
  lastname: string;
  username: string;
  jobTitle: string | null;
  storeName: string | null;
  templateName: string;
  /** `null`: the plan was never calculated. */
  totalScore: number | null;
  scoredItemCount: number;
  itemCount: number;
  /** The salary in force in the period's month; `null` without one. */
  salary: SalaryPayoutResponse | null;
}

export interface KpiExportItemRow {
  erpCode: string | null;
  firstname: string;
  lastname: string;
  kpiName: string;
  weight: number;
  /** `TMT`, `USD`, `%` or empty for counts. */
  unit: string;
  targetValue: number | null;
  actualValue: number | null;
  rawAchievement: number | null;
  cappedAchievement: number | null;
  weightedScore: number | null;
  /** In the salary's currency; `null` without a salary. */
  salaryValue: number | null;
  salaryEarned: number | null;
}

export interface KpiExportInfo {
  periodLabel: string;
  isOpen: boolean;
  /** Already formatted in the business time zone. */
  exportedAt: string;
  exportedBy: string;
  calculatedAt: string | null;
}

interface ExportLabels {
  summarySheet: string;
  itemsSheet: string;
  infoSheet: string;
  erpCode: string;
  firstname: string;
  lastname: string;
  username: string;
  jobTitle: string;
  store: string;
  template: string;
  score: string;
  scoredItems: string;
  salary: string;
  currency: string;
  fixedPercent: string;
  kpiPercent: string;
  fixedAmount: string;
  kpiAmount: string;
  kpiEarned: string;
  totalEarned: string;
  salaryMonth: string;
  kpi: string;
  weight: string;
  unit: string;
  target: string;
  actual: string;
  rawAchievement: string;
  cappedAchievement: string;
  weightedScore: string;
  salaryValue: string;
  salaryEarned: string;
  period: string;
  status: string;
  statusOpen: string;
  statusClosed: string;
  planCount: string;
  calculatedAt: string;
  notCalculated: string;
  exportedBy: string;
  exportedAt: string;
  totalPayable: string;
  notes: string[];
}

const LABELS: Record<TemplateLanguage, ExportLabels> = {
  tr: {
    summarySheet: 'Özet',
    itemsSheet: 'KPI ayrıntıları',
    infoSheet: 'Bilgi',
    erpCode: 'ERP kodu',
    firstname: 'Ad',
    lastname: 'Soyad',
    username: 'Kullanıcı adı',
    jobTitle: 'Görevi',
    store: 'Mağaza',
    template: 'Şablon',
    score: 'KPI puanı',
    scoredItems: 'Puanlanan KPI',
    salary: 'Maaş',
    currency: 'Para birimi',
    fixedPercent: 'Sabit %',
    kpiPercent: 'KPI %',
    fixedAmount: 'Sabit kısım',
    kpiAmount: 'KPI kısmı',
    kpiEarned: 'KPI’dan kazanılan',
    totalEarned: 'Bu dönem alınacak',
    salaryMonth: 'Maaşın geçerli olduğu ay',
    kpi: 'KPI',
    weight: 'Ağırlık %',
    unit: 'Birim',
    target: 'Hedef',
    actual: 'Gerçekleşen',
    rawAchievement: 'Gerçekleşme %',
    cappedAchievement: 'Puana giren %',
    weightedScore: 'Puan katkısı',
    salaryValue: 'Maaştaki değeri',
    salaryEarned: 'Kazanılan',
    period: 'Dönem',
    status: 'Durum',
    statusOpen: 'Açık: puanlar ve tutarlar ara sonuçtur',
    statusClosed: 'Kapalı: puanlar ve tutarlar kesindir',
    planCount: 'Plan sayısı',
    calculatedAt: 'Son hesaplama',
    notCalculated: 'Hesaplanmadı',
    exportedBy: 'İndiren',
    exportedAt: 'İndirme zamanı',
    totalPayable: 'Bu dönem alınacak toplam',
    notes: [
      'KPI puanı 0–100 arasıdır; her KPI puana en çok %100 gerçekleşmeyle girer.',
      'Maaş, dönemin ayında geçerli olan maaştır. KPI’dan kazanılan = KPI kısmı × KPI puanı / 100; bu dönem alınacak = sabit kısım + KPI’dan kazanılan.',
      'Hiç hesaplanmamış planın puanı ve kazanılan tutarları boştur. Maaşı girilmemiş çalışanın maaş sütunları boştur.',
      'Bu dosya bir gösterimdir; bordroya aktarılmadan önce kontrol edilmelidir.',
    ],
  },
  en: {
    summarySheet: 'Summary',
    itemsSheet: 'KPI details',
    infoSheet: 'About',
    erpCode: 'ERP code',
    firstname: 'First name',
    lastname: 'Last name',
    username: 'Username',
    jobTitle: 'Job title',
    store: 'Store',
    template: 'Template',
    score: 'KPI score',
    scoredItems: 'Scored KPIs',
    salary: 'Salary',
    currency: 'Currency',
    fixedPercent: 'Fixed %',
    kpiPercent: 'KPI %',
    fixedAmount: 'Fixed part',
    kpiAmount: 'KPI part',
    kpiEarned: 'Earned from KPI',
    totalEarned: 'Payable this period',
    salaryMonth: 'Salary in force since',
    kpi: 'KPI',
    weight: 'Weight %',
    unit: 'Unit',
    target: 'Target',
    actual: 'Actual',
    rawAchievement: 'Achievement %',
    cappedAchievement: 'Counted %',
    weightedScore: 'Score points',
    salaryValue: 'Worth in salary',
    salaryEarned: 'Earned',
    period: 'Period',
    status: 'Status',
    statusOpen: 'Open: scores and amounts are provisional',
    statusClosed: 'Closed: scores and amounts are final',
    planCount: 'Plans',
    calculatedAt: 'Last calculated',
    notCalculated: 'Not calculated',
    exportedBy: 'Downloaded by',
    exportedAt: 'Downloaded at',
    totalPayable: 'Total payable this period',
    notes: [
      'The KPI score runs from 0 to 100; each KPI counts with at most 100 % achievement.',
      'The salary is the one in force in the period’s month. Earned from KPI = KPI part × KPI score / 100; payable = fixed part + earned from KPI.',
      'Plans never calculated have no score and no earned amounts. Employees without a salary have empty salary columns.',
      'This file is a report; check it before it goes to payroll.',
    ],
  },
  ru: {
    summarySheet: 'Сводка',
    itemsSheet: 'Детали KPI',
    infoSheet: 'О файле',
    erpCode: 'Код ERP',
    firstname: 'Имя',
    lastname: 'Фамилия',
    username: 'Логин',
    jobTitle: 'Должность',
    store: 'Магазин',
    template: 'Шаблон',
    score: 'Балл KPI',
    scoredItems: 'Оценено KPI',
    salary: 'Зарплата',
    currency: 'Валюта',
    fixedPercent: 'Фикс. %',
    kpiPercent: 'KPI %',
    fixedAmount: 'Фиксированная часть',
    kpiAmount: 'Часть KPI',
    kpiEarned: 'Заработано по KPI',
    totalEarned: 'К выплате за период',
    salaryMonth: 'Зарплата действует с',
    kpi: 'KPI',
    weight: 'Вес %',
    unit: 'Ед.',
    target: 'Цель',
    actual: 'Факт',
    rawAchievement: 'Выполнение %',
    cappedAchievement: 'В зачёт %',
    weightedScore: 'Баллы',
    salaryValue: 'Стоимость в зарплате',
    salaryEarned: 'Заработано',
    period: 'Период',
    status: 'Статус',
    statusOpen: 'Открыт: баллы и суммы предварительные',
    statusClosed: 'Закрыт: баллы и суммы окончательные',
    planCount: 'Планов',
    calculatedAt: 'Последний расчёт',
    notCalculated: 'Не рассчитан',
    exportedBy: 'Скачал',
    exportedAt: 'Время скачивания',
    totalPayable: 'Итого к выплате за период',
    notes: [
      'Балл KPI — от 0 до 100; каждый KPI идёт в зачёт не более чем на 100 %.',
      'Зарплата — та, что действует в месяце периода. Заработано по KPI = часть KPI × балл KPI / 100; к выплате = фиксированная часть + заработано по KPI.',
      'У нерассчитанного плана балл и заработанные суммы пусты. У сотрудника без зарплаты столбцы зарплаты пусты.',
      'Файл — отчёт; проверьте его перед передачей в расчёт зарплаты.',
    ],
  },
  tk: {
    summarySheet: 'Jemi',
    itemsSheet: 'KPI jikme-jiklikleri',
    infoSheet: 'Maglumat',
    erpCode: 'ERP kody',
    firstname: 'Ady',
    lastname: 'Familiýasy',
    username: 'Ulanyjy ady',
    jobTitle: 'Wezipesi',
    store: 'Dükan',
    template: 'Şablon',
    score: 'KPI bahasy',
    scoredItems: 'Bahalanan KPI',
    salary: 'Aýlyk',
    currency: 'Pul birligi',
    fixedPercent: 'Hemişelik %',
    kpiPercent: 'KPI %',
    fixedAmount: 'Hemişelik bölegi',
    kpiAmount: 'KPI bölegi',
    kpiEarned: 'KPI-dan gazanylan',
    totalEarned: 'Bu döwürde alynjak',
    salaryMonth: 'Aýlygyň güýje giren aýy',
    kpi: 'KPI',
    weight: 'Agramy %',
    unit: 'Birlik',
    target: 'Maksat',
    actual: 'Ýerine ýetirilen',
    rawAchievement: 'Ýerine ýetiriliş %',
    cappedAchievement: 'Baha girýän %',
    weightedScore: 'Baha goşandy',
    salaryValue: 'Aýlykdaky gymmaty',
    salaryEarned: 'Gazanylan',
    period: 'Döwür',
    status: 'Ýagdaýy',
    statusOpen: 'Açyk: bahalar we möçberler aralyk netijedir',
    statusClosed: 'Ýapyk: bahalar we möçberler kesgitlidir',
    planCount: 'Meýilnama sany',
    calculatedAt: 'Soňky hasaplama',
    notCalculated: 'Hasaplanmady',
    exportedBy: 'Göçürip alan',
    exportedAt: 'Göçürip alnan wagty',
    totalPayable: 'Bu döwürde alynjak jemi',
    notes: [
      'KPI bahasy 0–100 aralygyndadyr; her KPI baha iň köp 100 % ýerine ýetiriliş bilen girýär.',
      'Aýlyk döwrüň aýynda güýjüne giren aýlykdyr. KPI-dan gazanylan = KPI bölegi × KPI bahasy / 100; alynjak = hemişelik bölegi + KPI-dan gazanylan.',
      'Hiç hasaplanmadyk meýilnamanyň bahasy we gazanylan möçberleri boşdur. Aýlygy girizilmedik işgäriň aýlyk sütünleri boşdur.',
      'Bu faýl hasabatdyr; aýlyk hasabyna geçirmezden öň barlaň.',
    ],
  },
};

const HEADER_STYLE = {
  fontWeight: 'bold',
  backgroundColor: '#D1FAE5',
  bottomBorderStyle: 'thin',
  wrap: true,
} as const;

const MONEY = '#,##0.00';
const DECIMAL = '0.00';

function header(labels: readonly string[]): Row {
  return labels.map((value) => ({ value, type: String, ...HEADER_STYLE }));
}

function text(value: string | null): Cell {
  return value === null || value === '' ? null : { value, type: String };
}

function number(value: number | null | undefined, format?: string): Cell {
  return value === null || value === undefined
    ? null
    : { value, type: Number, ...(format ? { format } : {}) };
}

/**
 * `2026-07_KPI_admin.xlsx`: the period, what the file is and who downloaded it. The name
 * travels in a `Content-Disposition` header, so anything outside plain ASCII becomes `_`.
 */
export function kpiExportFileName(periodLabel: string, username: string): string {
  const safeUsername = username.replace(/[^A-Za-z0-9._-]/g, '_') || 'user';

  return `${periodLabel}_KPI_${safeUsername}.xlsx`;
}

/** What the file pays per currency; plans without a salary or a score add nothing. */
export function totalPayableByCurrency(plans: readonly KpiExportPlanRow[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const plan of plans) {
    const earned = plan.salary?.totalEarned;

    if (plan.salary && earned !== null && earned !== undefined) {
      const current = totals.get(plan.salary.currency) ?? 0;

      totals.set(plan.salary.currency, Math.round((current + earned) * 100) / 100);
    }
  }

  return totals;
}

export async function buildKpiPeriodExport(
  info: KpiExportInfo,
  plans: readonly KpiExportPlanRow[],
  items: readonly KpiExportItemRow[],
  language: TemplateLanguage,
): Promise<Buffer> {
  const labels = LABELS[language];
  const summary: SheetData = [
    header([
      labels.erpCode,
      labels.firstname,
      labels.lastname,
      labels.username,
      labels.jobTitle,
      labels.store,
      labels.template,
      labels.score,
      labels.scoredItems,
      labels.salary,
      labels.currency,
      labels.fixedPercent,
      labels.kpiPercent,
      labels.fixedAmount,
      labels.kpiAmount,
      labels.kpiEarned,
      labels.totalEarned,
      labels.salaryMonth,
    ]),
    ...plans.map((plan): Row => [
      text(plan.erpCode),
      text(plan.firstname),
      text(plan.lastname),
      text(plan.username),
      text(plan.jobTitle),
      text(plan.storeName),
      text(plan.templateName),
      number(plan.totalScore, DECIMAL),
      text(`${String(plan.scoredItemCount)}/${String(plan.itemCount)}`),
      number(plan.salary?.amount, MONEY),
      text(plan.salary?.currency ?? null),
      number(plan.salary?.fixedPercent, DECIMAL),
      number(plan.salary?.kpiPercent, DECIMAL),
      number(plan.salary?.fixedAmount, MONEY),
      number(plan.salary?.kpiAmount, MONEY),
      number(plan.salary?.kpiEarned, MONEY),
      number(plan.salary?.totalEarned, MONEY),
      text(plan.salary?.effectiveMonth ?? null),
    ]),
  ];
  const details: SheetData = [
    header([
      labels.erpCode,
      labels.firstname,
      labels.lastname,
      labels.kpi,
      labels.weight,
      labels.unit,
      labels.target,
      labels.actual,
      labels.rawAchievement,
      labels.cappedAchievement,
      labels.weightedScore,
      labels.salaryValue,
      labels.salaryEarned,
    ]),
    ...items.map((item): Row => [
      text(item.erpCode),
      text(item.firstname),
      text(item.lastname),
      text(item.kpiName),
      number(item.weight, DECIMAL),
      text(item.unit),
      number(item.targetValue, MONEY),
      number(item.actualValue, MONEY),
      number(item.rawAchievement, DECIMAL),
      number(item.cappedAchievement, DECIMAL),
      number(item.weightedScore, DECIMAL),
      number(item.salaryValue, MONEY),
      number(item.salaryEarned, MONEY),
    ]),
  ];
  const bold = { fontWeight: 'bold' } as const;
  const about: SheetData = [
    [{ value: labels.period, type: String, ...bold }, text(info.periodLabel)],
    [
      { value: labels.status, type: String, ...bold },
      text(info.isOpen ? labels.statusOpen : labels.statusClosed),
    ],
    [{ value: labels.planCount, type: String, ...bold }, number(plans.length)],
    [
      { value: labels.calculatedAt, type: String, ...bold },
      text(info.calculatedAt ?? labels.notCalculated),
    ],
    ...[...totalPayableByCurrency(plans)].map(([currency, total]): Row => [
      { value: `${labels.totalPayable} (${currency})`, type: String, ...bold },
      number(total, MONEY),
    ]),
    [{ value: labels.exportedBy, type: String, ...bold }, text(info.exportedBy)],
    [{ value: labels.exportedAt, type: String, ...bold }, text(info.exportedAt)],
    [],
    ...labels.notes.map((note, index): Row => [
      { value: `${String(index + 1)}. ${note}`, type: String, wrap: true, columnSpan: 2 },
      null,
    ]),
  ];

  return writeXlsxFile([
    {
      sheet: labels.summarySheet,
      data: summary,
      columns: [
        { width: 12 },
        { width: 16 },
        { width: 18 },
        { width: 16 },
        { width: 20 },
        { width: 20 },
        { width: 22 },
        { width: 11 },
        { width: 11 },
        { width: 13 },
        { width: 9 },
        { width: 9 },
        { width: 9 },
        { width: 13 },
        { width: 13 },
        { width: 14 },
        { width: 15 },
        { width: 14 },
      ],
      stickyRowsCount: 1,
      stickyColumnsCount: 3,
    },
    {
      sheet: labels.itemsSheet,
      data: details,
      columns: [
        { width: 12 },
        { width: 16 },
        { width: 18 },
        { width: 34 },
        { width: 10 },
        { width: 8 },
        { width: 14 },
        { width: 14 },
        { width: 13 },
        { width: 13 },
        { width: 12 },
        { width: 14 },
        { width: 13 },
      ],
      stickyRowsCount: 1,
      stickyColumnsCount: 3,
    },
    { sheet: labels.infoSheet, data: about, columns: [{ width: 34 }, { width: 70 }] },
  ]).toBuffer();
}
