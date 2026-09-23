import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { listKpiDefinitions } from '../api/kpi-definitions';
import { pickLocalizedText } from '../i18n/localized-text';
import { useTranslation, type Translate } from '../i18n/locale-store';
import type { TemplateItemDraft } from '../lib/kpi-template-form';
import type { KpiDefinition } from '../types/api';
import { FormField, formInputDenseClassName } from './FormField';
import { KpiInputFields } from './KpiInputFields';
import { SearchableSelect } from './SearchableSelect';

function targetUnit(definition: KpiDefinition | undefined, item: TemplateItemDraft, t: Translate) {
  switch (definition?.unit) {
    case 'money':
      return typeof item.inputValues.currency === 'string'
        ? item.inputValues.currency
        : t('kpiTemplateForm.unitMoney');
    case 'percent':
      return '%';
    case 'score':
      return t('kpiTemplateForm.unitScore');
    default:
      return t('kpiTemplateForm.unitCount');
  }
}

interface KpiTemplateItemEditorProps {
  number: number;
  item: TemplateItemDraft;
  definitionsById: ReadonlyMap<string, KpiDefinition>;
  onChange: (item: TemplateItemDraft) => void;
  onRemove: () => void;
}

/**
 * One template row, kept compact so many KPIs fit on screen: a row number, then KPI,
 * weight and target on one line (stacked on phones), then the definition's own inputs.
 */
export function KpiTemplateItemEditor({
  number,
  item,
  definitionsById,
  onChange,
  onRemove,
}: KpiTemplateItemEditorProps) {
  const { t, locale } = useTranslation();
  const [definitionSearch, setDefinitionSearch] = useState('');

  const definitionsQuery = useQuery({
    queryKey: ['kpi-definitions', definitionSearch],
    queryFn: () => listKpiDefinitions(definitionSearch),
    placeholderData: keepPreviousData,
  });

  const definitionOptions = useMemo(
    () =>
      (definitionsQuery.data ?? []).map((definition) => ({
        value: definition.id,
        label: pickLocalizedText(definition.name, locale),
      })),
    [definitionsQuery.data, locale],
  );

  const definition = definitionsById.get(item.kpiDefinitionId.toLowerCase());
  const headingId = `${item.key}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 id={headingId} className="sr-only">
        {t('kpiTemplateForm.itemTitle', { number })}
      </h3>

      <div className="flex items-start gap-2">
        {/* mt-7 centers the badge on the first row of inputs (20px label + 44px field). */}
        <span
          aria-hidden="true"
          className="mt-7 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
        >
          {number}
        </span>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_9rem]">
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <FormField
              label={t('kpiTemplateForm.definitionLabel')}
              htmlFor={`${item.key}-definition`}
              required
              dense
            >
              <SearchableSelect
                id={`${item.key}-definition`}
                value={item.kpiDefinitionId}
                options={definitionOptions}
                // Another KPI has another input schema, so its inputs start empty.
                onChange={(value) =>
                  onChange({
                    ...item,
                    kpiDefinitionId: value,
                    inputValues: value === item.kpiDefinitionId ? item.inputValues : {},
                  })
                }
                onSearchChange={setDefinitionSearch}
                fallbackLabel={definition ? pickLocalizedText(definition.name, locale) : null}
                placeholder={t('kpiTemplateForm.definitionPlaceholder')}
                noResultsLabel={t('kpiTemplateForm.definitionNoResults')}
                loadingLabel={t('kpiTemplateForm.loading')}
                errorLabel={t('kpiTemplateForm.definitionsError')}
                isLoading={definitionsQuery.isFetching}
                isError={definitionsQuery.isError}
                required
                className={formInputDenseClassName}
              />
            </FormField>
          </div>

          <FormField
            label={t('kpiTemplateForm.weightLabel')}
            htmlFor={`${item.key}-weight`}
            required
            dense
          >
            <input
              id={`${item.key}-weight`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              required
              placeholder="0"
              value={item.weight}
              onChange={(event) => onChange({ ...item, weight: event.target.value })}
              className={formInputDenseClassName}
            />
          </FormField>

          <FormField
            label={t('kpiTemplateForm.targetLabel', { unit: targetUnit(definition, item, t) })}
            htmlFor={`${item.key}-target`}
            dense
          >
            <input
              id={`${item.key}-target`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={item.targetValue}
              onChange={(event) => onChange({ ...item, targetValue: event.target.value })}
              className={formInputDenseClassName}
            />
          </FormField>

          {definition ? (
            definition.inputSchema.length > 0 ? (
              <div className="col-span-2 grid min-w-0 grid-cols-1 gap-x-3 gap-y-2 sm:col-span-3 sm:grid-cols-2">
                <KpiInputFields
                  idPrefix={item.key}
                  schema={definition.inputSchema}
                  values={item.inputValues}
                  onChange={(inputValues) => onChange({ ...item, inputValues })}
                  dense
                />
              </div>
            ) : (
              <p className="col-span-2 text-xs text-slate-500 sm:col-span-3 dark:text-slate-400">
                {t('kpiTemplateForm.noInputs')}
              </p>
            )
          ) : null}
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label={t('kpiTemplateForm.removeItem', { number })}
          className="mt-5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-500"
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
              d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
