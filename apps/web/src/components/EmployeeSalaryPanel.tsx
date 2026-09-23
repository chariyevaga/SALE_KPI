import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';

import {
  createEmployeeSalary,
  deleteEmployeeSalary,
  listEmployeeSalaries,
  updateEmployeeSalary,
} from '../api/employee-salaries';
import { localizeApiError } from '../i18n/api-errors';
import { formatMonth, formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import { ApiError } from '../lib/api-client';
import type { EmployeeSalary, SalaryCurrency } from '../types/api';
import { FormField, formInputClassName } from './FormField';
import { Modal } from './Modal';
import { RecordInfoButton } from './RecordInfo';
import { confirmAction } from '../store/confirm-store';

const CURRENCIES: SalaryCurrency[] = ['TMT', 'USD'];
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_AMOUNT = 999_999_999.99;

/** This month on this device, `YYYY-MM`. */
function thisMonth(): string {
  const now = new Date();

  return `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** `2026-09` → `2026-08`. */
function previousMonth(month: string): string {
  const [year = 0, value = 1] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, value - 2, 1));

  return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** `2026-09` → `2026-10`. */
function nextMonth(month: string): string {
  const [year = 0, value = 1] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, value, 1));

  return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Two decimals at most, as the API stores them. */
function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function money(
  value: number,
  currency: SalaryCurrency,
  locale: Parameters<typeof formatNumber>[1],
) {
  return `${formatNumber(value, locale)} ${currency}`;
}

function describeError(error: unknown, t: Translate): string {
  if (error instanceof ApiError) {
    switch (error.body?.code) {
      case 'EMPLOYEE_SALARY_MONTH_EXISTS':
        return t('salary.errorMonthExists');
      case 'EMPLOYEE_SALARY_PERCENT_TOTAL':
        return t('salary.errorPercentTotal');
    }
  }

  return localizeApiError(error, t, 'salary.saveError');
}

/**
 * The fixed and KPI parts of a salary as one bar with both amounts printed, so the split
 * never rests on colour alone.
 */
function SalarySplit({ salary, large = false }: { salary: EmployeeSalary; large?: boolean }) {
  const { t, locale } = useTranslation();

  return (
    <div>
      <div
        role="img"
        aria-label={t('salary.splitLabel', {
          fixed: formatNumber(salary.fixedPercent, locale),
          kpi: formatNumber(salary.kpiPercent, locale),
        })}
        className={`flex w-full overflow-hidden rounded-full ${large ? 'h-3' : 'h-1.5'}`}
      >
        <span
          className="bg-slate-400 dark:bg-slate-500"
          style={{ width: `${String(salary.fixedPercent)}%` }}
        />
        <span
          className="bg-emerald-500 dark:bg-emerald-400"
          style={{ width: `${String(salary.kpiPercent)}%` }}
        />
      </div>
      <div className={`mt-2 grid grid-cols-2 gap-3 ${large ? 'text-sm' : 'text-xs'} tabular-nums`}>
        <div>
          <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"
            />
            {t('salary.fixedPart', { percent: formatNumber(salary.fixedPercent, locale) })}
          </p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {money(salary.fixedAmount, salary.currency, locale)}
          </p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1.5 text-slate-500 dark:text-slate-400">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
            />
            {t('salary.kpiPart', { percent: formatNumber(salary.kpiPercent, locale) })}
          </p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {money(salary.kpiAmount, salary.currency, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Add / correct modal
// ---------------------------------------------------------------------------

interface SalaryModalProps {
  employeeId: string;
  /** The salary being corrected; without it a new one is added. */
  salary: EmployeeSalary | null;
  /** What a new salary starts from: the latest one's amount and split. */
  template: EmployeeSalary | null;
  /** Months that already have a salary, to pick a free month for a new one. */
  takenMonths: string[];
  onClose: () => void;
  onSaved: () => void;
}

function SalaryModal({
  employeeId,
  salary,
  template,
  takenMonths,
  onClose,
  onSaved,
}: SalaryModalProps) {
  const { t, locale } = useTranslation();
  const isEdit = salary !== null;
  const source = salary ?? template;
  const [month, setMonth] = useState(() => {
    if (salary) return salary.effectiveMonth;

    let candidate = thisMonth();

    while (takenMonths.includes(candidate)) candidate = nextMonth(candidate);

    return candidate;
  });
  const [amount, setAmount] = useState(source ? String(source.amount) : '');
  const [currency, setCurrency] = useState<SalaryCurrency>(source?.currency ?? 'TMT');
  const [fixed, setFixed] = useState(String(source?.fixedPercent ?? 30));
  const [kpi, setKpi] = useState(String(source?.kpiPercent ?? 70));

  const amountValue = Number(amount.replace(',', '.'));
  const fixedValue = Number(fixed.replace(',', '.'));
  const kpiValue = Number(kpi.replace(',', '.'));
  const monthTaken = takenMonths.includes(month) && month !== salary?.effectiveMonth;
  const amountValid =
    amount.trim() !== '' &&
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    amountValue <= MAX_AMOUNT;
  const percentsValid =
    fixed.trim() !== '' &&
    kpi.trim() !== '' &&
    fixedValue >= 0 &&
    kpiValue >= 0 &&
    Math.round((fixedValue + kpiValue) * 100) === 10_000;

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        effectiveMonth: month,
        amount: Math.round(amountValue * 100) / 100,
        currency,
        fixedPercent: roundPercent(fixedValue),
        kpiPercent: roundPercent(kpiValue),
      };

      return salary
        ? updateEmployeeSalary(salary.id, input)
        : createEmployeeSalary(employeeId, input);
    },
    onSuccess: onSaved,
  });

  const canSave =
    MONTH_PATTERN.test(month) &&
    !monthTaken &&
    amountValid &&
    percentsValid &&
    !saveMutation.isPending;

  // Typing one percentage fills in the other, so the two always make 100.
  function changeFixed(value: string) {
    setFixed(value);
    const parsed = Number(value.replace(',', '.'));

    if (value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) {
      setKpi(String(roundPercent(100 - parsed)));
    }
  }

  function changeKpi(value: string) {
    setKpi(value);
    const parsed = Number(value.replace(',', '.'));

    if (value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) {
      setFixed(String(roundPercent(100 - parsed)));
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();

    if (canSave) {
      saveMutation.mutate();
    }
  }

  const preview =
    amountValid && percentsValid
      ? {
          fixed: Math.round(amountValue * fixedValue) / 100,
          kpi: Math.round((amountValue - Math.round(amountValue * fixedValue) / 100) * 100) / 100,
        }
      : null;

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isEdit ? 'salary.editTitle' : 'salary.addTitle')}
      headerActions={
        salary ? (
          <RecordInfoButton
            tableName="employee_salaries"
            recordId={salary.id}
            title={formatMonth(salary.effectiveMonth, locale)}
          />
        ) : undefined
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField label={t('salary.effectiveMonth')} htmlFor="salary-month" required>
          <input
            id="salary-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            required
            className={formInputClassName}
          />
        </FormField>
        {monthTaken ? (
          <p role="alert" className="-mt-2 text-xs text-red-600 dark:text-red-400">
            {t('salary.errorMonthExists')}
          </p>
        ) : (
          <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t('salary.effectiveHint')}
          </p>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <FormField label={t('salary.amount')} htmlFor="salary-amount" required>
            <input
              id="salary-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={t('salary.amountPlaceholder')}
              required
              className={formInputClassName}
            />
          </FormField>
          <FormField label={t('salary.currency')} htmlFor="salary-currency" required>
            <select
              id="salary-currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as SalaryCurrency)}
              className={formInputClassName}
            >
              {CURRENCIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FormField label={t('salary.fixedPercent')} htmlFor="salary-fixed" required>
            <input
              id="salary-fixed"
              type="text"
              inputMode="decimal"
              value={fixed}
              onChange={(event) => changeFixed(event.target.value)}
              required
              className={formInputClassName}
            />
          </FormField>
          <FormField label={t('salary.kpiPercent')} htmlFor="salary-kpi" required>
            <input
              id="salary-kpi"
              type="text"
              inputMode="decimal"
              value={kpi}
              onChange={(event) => changeKpi(event.target.value)}
              required
              className={formInputClassName}
            />
          </FormField>
        </div>

        {!percentsValid && fixed.trim() !== '' && kpi.trim() !== '' ? (
          <p role="alert" className="-mt-2 text-xs text-red-600 dark:text-red-400">
            {t('salary.errorPercentTotal')}
          </p>
        ) : null}

        {preview ? (
          <p className="-mt-1 rounded-lg bg-slate-50 px-3 py-2 text-xs tabular-nums text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            {t('salary.preview', {
              fixed: money(preview.fixed, currency, locale),
              kpi: money(preview.kpi, currency, locale),
            })}
          </p>
        ) : null}

        {saveMutation.isError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {describeError(saveMutation.error, t)}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="h-12 flex-1 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
          >
            {saveMutation.isPending ? t('salary.saving') : t('salary.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * The employee form's "Salary" tab (ADR-048), for `full_access` users only. A salary is
 * entered with the month it takes effect from and stays in force until a newer one; the
 * one in force this month leads the tab, the history follows with each salary's months.
 */
export function EmployeeSalaryPanel({ employeeId }: { employeeId: string }) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const queryKey = ['employee-salaries', employeeId];
  // `null` closed, `'new'` adding, a salary when correcting it.
  const [editing, setEditing] = useState<EmployeeSalary | 'new' | null>(null);

  const salariesQuery = useQuery({
    queryKey,
    queryFn: () => listEmployeeSalaries(employeeId),
  });
  const items = salariesQuery.data?.items ?? [];
  const current = salariesQuery.data?.current ?? null;

  const deleteMutation = useMutation({
    mutationFn: (salary: EmployeeSalary) => deleteEmployeeSalary(salary.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  async function remove(salary: EmployeeSalary) {
    const confirmed = await confirmAction({
      message: t('salary.deleteConfirm', { month: formatMonth(salary.effectiveMonth, locale) }),
      confirmLabel: t('salary.delete'),
      tone: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(salary);
    }
  }

  async function handleSaved() {
    setEditing(null);
    await queryClient.invalidateQueries({ queryKey });
  }

  /** "Eylül 2026 – Kasım 2026", or "Eylül 2026'dan itibaren" for the newest. */
  function rangeText(index: number): string {
    const salary = items[index];
    const newer = items[index - 1];

    if (!salary) return '';

    const from = formatMonth(salary.effectiveMonth, locale);

    if (!newer) {
      return t('salary.fromMonth', { month: from });
    }

    const until = previousMonth(newer.effectiveMonth);

    return until === salary.effectiveMonth ? from : `${from} – ${formatMonth(until, locale)}`;
  }

  if (salariesQuery.isLoading) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('salary.loading')}
      </p>
    );
  }

  if (salariesQuery.isError) {
    return (
      <p
        role="alert"
        className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
      >
        {t('salary.errorLoading')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('salary.currentTitle')}
        </p>
        {current ? (
          <>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {formatNumber(current.amount, locale)}
              </span>
              <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                {current.currency}
              </span>
            </p>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {t('salary.sinceMonth', { month: formatMonth(current.effectiveMonth, locale) })}
            </p>
            <SalarySplit salary={current} large />
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {items.length > 0 ? t('salary.noneYet') : t('salary.empty')}
          </p>
        )}
      </section>

      {items.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('salary.history')}
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((salary, index) => {
              const isCurrent = salary.id === current?.id;
              const range = rangeText(index);

              return (
                <li
                  key={salary.id}
                  className={`flex items-start overflow-hidden rounded-xl border ${
                    isCurrent
                      ? 'border-emerald-500/60 bg-emerald-50/60 dark:border-emerald-400/40 dark:bg-emerald-400/5'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setEditing(salary)}
                    aria-label={t('salary.editFor', { range })}
                    className="flex min-w-0 flex-1 flex-col gap-2 p-3 text-left transition active:bg-slate-100 dark:active:bg-slate-800"
                  >
                    <span className="flex w-full items-baseline justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {range}
                        </span>
                        {isCurrent ? (
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            {t('salary.inForce')}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex-shrink-0 text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {money(salary.amount, salary.currency, locale)}
                      </span>
                    </span>
                    <SalarySplit salary={salary} />
                  </button>
                  <div className="flex flex-col items-center py-1 pr-1">
                    <button
                      type="button"
                      onClick={() => void remove(salary)}
                      disabled={deleteMutation.isPending}
                      aria-label={t('salary.deleteFor', { range })}
                      title={t('salary.deleteFor', { range })}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40 dark:hover:text-red-400"
                    >
                      <TrashIcon />
                    </button>
                    <RecordInfoButton
                      tableName="employee_salaries"
                      recordId={salary.id}
                      title={range}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {deleteMutation.isError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {localizeApiError(deleteMutation.error, t, 'salary.deleteError')}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setEditing('new')}
        className="fixed bottom-6 right-6 z-20 mb-[env(safe-area-inset-bottom)] inline-flex h-14 items-center gap-2 rounded-full bg-emerald-400 pl-4 pr-5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300 active:scale-95"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        {t('salary.add')}
      </button>

      {editing !== null ? (
        <SalaryModal
          employeeId={employeeId}
          salary={editing === 'new' ? null : editing}
          template={items[0] ?? null}
          takenMonths={items.map((salary) => salary.effectiveMonth)}
          onClose={() => setEditing(null)}
          onSaved={() => void handleSaved()}
        />
      ) : null}
    </div>
  );
}
