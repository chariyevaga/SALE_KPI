import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { listItemGroups } from '../api/item-groups';
import { formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import { formInputClassName } from './FormField';
import { SearchableSelect } from './SearchableSelect';

interface ItemGroupLookupFieldProps {
  id: string;
  multiple: boolean;
  /** Selected Tiger item group codes (`STGRPCODE`); a single-choice field holds at most one. */
  value: string[];
  onChange: (codes: string[]) => void;
  required?: boolean;
  inputClassName?: string;
}

/**
 * `lookup` input with `source: "itemGroups"` (ADR-045). Works like `StoreLookupField`, but the
 * values are the group codes themselves, since Logo has no master table that would give them
 * ids. Items without a group cannot be picked; the field says how much of the sales they hold.
 */
export function ItemGroupLookupField({
  id,
  multiple,
  value,
  onChange,
  required = false,
  inputClassName = formInputClassName,
}: ItemGroupLookupFieldProps) {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');

  // The unfiltered list gives the ungrouped share even while a search narrows the options.
  const allGroupsQuery = useQuery({
    queryKey: ['item-groups', ''],
    queryFn: () => listItemGroups(''),
  });
  const searchQuery = useQuery({
    queryKey: ['item-groups', search],
    queryFn: () => listItemGroups(search),
    placeholderData: keepPreviousData,
  });

  const options = useMemo(
    () =>
      (searchQuery.data?.items ?? [])
        .filter((group) => !multiple || !value.includes(group.code))
        .map((group) => ({
          value: group.code,
          label: t('kpiTemplateForm.itemGroupOption', {
            code: group.code,
            count: formatNumber(group.itemCount, locale),
          }),
        })),
    [locale, multiple, searchQuery.data, t, value],
  );
  const ungroupedShare = allGroupsQuery.data?.ungroupedSalesShare ?? null;

  const selectLabels = {
    placeholder: t('kpiTemplateForm.itemGroupsPlaceholder'),
    noResultsLabel: t('kpiTemplateForm.itemGroupsNoResults'),
    loadingLabel: t('kpiTemplateForm.loading'),
    errorLabel: t('kpiTemplateForm.itemGroupsError'),
  };

  const hint =
    ungroupedShare !== null && ungroupedShare > 0 ? (
      <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
        {t('kpiTemplateForm.ungroupedHint', { share: formatNumber(ungroupedShare, locale) })}
      </p>
    ) : null;

  if (!multiple) {
    const selected = value[0];

    return (
      <div>
        <SearchableSelect
          id={id}
          value={selected ?? ''}
          options={options}
          onChange={(next) => onChange(next ? [next] : [])}
          onSearchChange={setSearch}
          fallbackLabel={selected ?? null}
          isLoading={searchQuery.isFetching}
          isError={searchQuery.isError}
          required={required}
          className={inputClassName}
          {...selectLabels}
        />
        {hint}
      </div>
    );
  }

  return (
    <div>
      {value.length > 0 ? (
        <ul className="mb-1.5 flex flex-wrap gap-1.5">
          {value.map((code) => (
            <li
              key={code}
              className="flex min-h-9 items-center gap-1 rounded-full bg-emerald-400/15 pl-3 text-sm font-medium text-emerald-800 dark:text-emerald-200"
            >
              <span className="max-w-[14rem] truncate">{code}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((selectedCode) => selectedCode !== code))}
                aria-label={t('kpiTemplateForm.removeItemGroup', { name: code })}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-emerald-400/25"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-3.5 w-3.5"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <SearchableSelect
        id={id}
        value=""
        options={options}
        onChange={(next) => {
          if (next) {
            onChange([...value, next]);
          }
        }}
        onSearchChange={setSearch}
        isLoading={searchQuery.isFetching}
        isError={searchQuery.isError}
        required={required && value.length === 0}
        className={inputClassName}
        {...selectLabels}
      />
      {hint}
    </div>
  );
}
