import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { downloadVisitorCountTemplate, importVisitorCounts } from '../api/store-visitor-counts';
import { localizeApiError } from '../i18n/api-errors';
import { formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import { ApiError } from '../lib/api-client';
import type { StoreVisitorCountImportResult } from '../types/api';
import { FormField, formInputClassName } from './FormField';
import { Modal } from './Modal';

/** Longest range the template covers; the API holds the same number (MAX_TEMPLATE_DAYS). */
const MAX_TEMPLATE_DAYS = 62;
const DAY_MS = 24 * 60 * 60 * 1000;

function localDate(offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * DAY_MS);

  return [
    String(date.getFullYear()),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function dayCount(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

/** Hands the browser a file to save, without leaving the page. */
function saveFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function describeImportError(error: unknown, t: Translate): string {
  if (error instanceof ApiError) {
    switch (error.body?.code) {
      case 'STORE_VISITOR_COUNT_IMPORT_FILE':
        return t('visitorCounts.excelErrorFile');
      case 'STORE_VISITOR_COUNT_IMPORT_TOO_LARGE':
        return t('visitorCounts.excelErrorTooLarge');
      case 'STORE_VISITOR_COUNT_IMPORT_EMPTY':
        return t('visitorCounts.excelErrorEmpty');
      case 'STORE_VISITOR_COUNT_TEMPLATE_RANGE':
        return t('visitorCounts.excelErrorRange');
    }

    if (error.status === 413) {
      return t('visitorCounts.excelErrorTooLarge');
    }
  }

  return localizeApiError(error, t, 'visitorCounts.saveError');
}

function StepNumber({ value }: { value: number }) {
  return (
    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-bold text-emerald-700 dark:text-emerald-300">
      {value}
    </span>
  );
}

interface VisitorCountImportModalProps {
  /** The store the list is filtered by: the template then has only its rows. */
  storeId: number | undefined;
  storeLabel: string;
  /** The list's date filter, used as the template's range when set. */
  initialFrom: string;
  initialTo: string;
  onClose: () => void;
  onImported: () => void;
}

/**
 * Bulk entry of visitor counts with Excel (ADR-055): download the template for a range of
 * days (saved counts come filled in), type the counts, upload. The API writes the whole
 * file or nothing; wrong rows come back with their Excel row numbers.
 */
export function VisitorCountImportModal({
  storeId,
  storeLabel,
  initialFrom,
  initialTo,
  onClose,
  onImported,
}: VisitorCountImportModalProps) {
  const { t, locale } = useTranslation();
  const today = localDate();
  const yesterday = localDate(-1);
  const [from, setFrom] = useState(initialFrom || initialTo || yesterday);
  const [to, setTo] = useState(initialTo || initialFrom || yesterday);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<StoreVisitorCountImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rangeValid =
    from !== '' &&
    to !== '' &&
    from <= to &&
    to <= today &&
    dayCount(from, to) <= MAX_TEMPLATE_DAYS;

  const templateMutation = useMutation({
    mutationFn: () =>
      downloadVisitorCountTemplate({
        from,
        to,
        lang: locale,
        ...(storeId === undefined ? {} : { storeId }),
      }),
    onSuccess: (blob) => saveFile(blob, `visitor-counts_${from}_${to}.xlsx`),
  });

  const importMutation = useMutation({
    mutationFn: (chosen: File) => importVisitorCounts(chosen),
    onSuccess: (imported) => {
      setResult(imported);
      setFile(null);
      onImported();
    },
  });

  const importError = importMutation.error;
  const rowErrors =
    importError instanceof ApiError &&
    importError.body?.code === 'STORE_VISITOR_COUNT_IMPORT_INVALID'
      ? {
          rows: importError.body.rows ?? [],
          total: importError.body.errorCount ?? importError.body.rows?.length ?? 0,
        }
      : null;

  function chooseFile(chosen: File | null) {
    setFile(chosen);
    setResult(null);
    importMutation.reset();
  }

  return (
    <Modal open onClose={onClose} title={t('visitorCounts.excelTitle')}>
      <div className="flex flex-col gap-5">
        {/* 1. Template */}
        <section className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <StepNumber value={1} />
            {t('visitorCounts.excelStep1')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('visitorCounts.excelStep1Hint')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={t('visitorCounts.filterFrom')} htmlFor="visitor-template-from">
              <input
                id="visitor-template-from"
                type="date"
                value={from}
                max={to || today}
                onChange={(event) => setFrom(event.target.value)}
                className={formInputClassName}
              />
            </FormField>
            <FormField label={t('visitorCounts.filterTo')} htmlFor="visitor-template-to">
              <input
                id="visitor-template-to"
                type="date"
                value={to}
                min={from || undefined}
                max={today}
                onChange={(event) => setTo(event.target.value)}
                className={formInputClassName}
              />
            </FormField>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {storeId === undefined
              ? t('visitorCounts.excelStoreAll')
              : t('visitorCounts.excelStoreOne', { store: storeLabel })}
          </p>
          {!rangeValid ? (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {t('visitorCounts.excelErrorRange')}
            </p>
          ) : null}
          {templateMutation.isError ? (
            <p
              role="alert"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
            >
              {describeImportError(templateMutation.error, t)}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => templateMutation.mutate()}
            disabled={!rangeValid || templateMutation.isPending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-500 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/10 disabled:opacity-40 dark:border-emerald-400 dark:text-emerald-300"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path
                d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {templateMutation.isPending
              ? t('visitorCounts.excelDownloading')
              : t('visitorCounts.excelDownload')}
          </button>
        </section>

        {/* 2. Upload */}
        <section className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <StepNumber value={2} />
            {t('visitorCounts.excelStep2')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('visitorCounts.excelStep2Hint')}
          </p>

          <input
            ref={fileInputRef}
            id="visitor-import-file"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) => {
              chooseFile(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />
          <label
            htmlFor="visitor-import-file"
            className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm transition hover:border-emerald-400 hover:bg-emerald-500/5 dark:border-slate-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5 flex-shrink-0 text-slate-400"
            >
              <path
                d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13l2 2 4-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="min-w-0 flex-1">
              {file ? (
                <>
                  <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                    {file.name}
                  </span>
                  <span className="block text-xs text-emerald-700 dark:text-emerald-300">
                    {t('visitorCounts.excelChangeFile')}
                  </span>
                </>
              ) : (
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {t('visitorCounts.excelChooseFile')}
                </span>
              )}
            </span>
          </label>

          {rowErrors ? (
            <div
              role="alert"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
            >
              <p className="font-medium">
                {t('visitorCounts.excelRowsInvalid', {
                  count: formatNumber(rowErrors.total, locale),
                })}
              </p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
                {rowErrors.rows.map((rowError) => (
                  <li key={`${String(rowError.row)}-${rowError.code}`}>
                    <span className="font-semibold tabular-nums">
                      {t('visitorCounts.excelRow', { row: String(rowError.row) })}
                    </span>
                    {': '}
                    {t(`visitorCounts.excelRowErrors.${rowError.code}`)}
                  </li>
                ))}
                {rowErrors.total > rowErrors.rows.length ? (
                  <li>
                    {t('visitorCounts.excelMoreErrors', {
                      count: formatNumber(rowErrors.total - rowErrors.rows.length, locale),
                    })}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : importMutation.isError ? (
            <p
              role="alert"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
            >
              {describeImportError(importError, t)}
            </p>
          ) : null}

          {result ? (
            <div
              role="status"
              className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300"
            >
              <p>
                {t('visitorCounts.excelResult', {
                  created: formatNumber(result.created, locale),
                  updated: formatNumber(result.updated, locale),
                  unchanged: formatNumber(result.unchanged, locale),
                })}
              </p>
              {result.skipped > 0 ? (
                <p className="mt-1 text-xs">
                  {t('visitorCounts.excelSkipped', {
                    count: formatNumber(result.skipped, locale),
                  })}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {result ? t('visitorCounts.excelDone') : t('common.cancel')}
          </button>
          {result ? null : (
            <button
              type="button"
              onClick={() => (file ? importMutation.mutate(file) : fileInputRef.current?.click())}
              disabled={importMutation.isPending}
              className="h-12 flex-1 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
            >
              {importMutation.isPending
                ? t('visitorCounts.excelUploading')
                : file
                  ? t('visitorCounts.excelUpload')
                  : t('visitorCounts.excelChooseFile')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
