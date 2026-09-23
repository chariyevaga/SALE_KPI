import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { listStores } from '../api/stores';
import { useTranslation } from '../i18n/locale-store';
import type { StoreOption } from '../types/api';
import { formInputClassName } from './FormField';
import { SearchableSelect } from './SearchableSelect';

function storeLabel(store: StoreOption): string {
  return store.name ? `${store.nr} · ${store.name}` : String(store.nr);
}

interface StoreLookupFieldProps {
  id: string;
  multiple: boolean;
  /** Selected store ids (`GET /stores` ids); a single-choice field holds at most one. */
  value: number[];
  onChange: (ids: number[]) => void;
  required?: boolean;
  inputClassName?: string;
}

/**
 * `lookup` input with `source: "stores"`. Multi-choice fields list the picked stores as
 * removable chips and use the search box only to add; single-choice fields replace.
 */
export function StoreLookupField({
  id,
  multiple,
  value,
  onChange,
  required = false,
  inputClassName = formInputClassName,
}: StoreLookupFieldProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // The unfiltered list names the chips even when the current search hides them.
  const allStoresQuery = useQuery({ queryKey: ['stores', ''], queryFn: () => listStores('') });
  const searchQuery = useQuery({
    queryKey: ['stores', search],
    queryFn: () => listStores(search),
    placeholderData: keepPreviousData,
  });

  const labels = useMemo(
    () => new Map((allStoresQuery.data ?? []).map((store) => [store.id, storeLabel(store)])),
    [allStoresQuery.data],
  );
  const options = useMemo(
    () =>
      (searchQuery.data ?? [])
        .filter((store) => !multiple || !value.includes(store.id))
        .map((store) => ({ value: String(store.id), label: storeLabel(store) })),
    [multiple, searchQuery.data, value],
  );

  const selectLabels = {
    placeholder: t('kpiTemplateForm.storesPlaceholder'),
    noResultsLabel: t('kpiTemplateForm.storesNoResults'),
    loadingLabel: t('kpiTemplateForm.loading'),
    errorLabel: t('kpiTemplateForm.storesError'),
  };

  if (!multiple) {
    const selected = value[0];

    return (
      <SearchableSelect
        id={id}
        value={selected === undefined ? '' : String(selected)}
        options={options}
        onChange={(next) => onChange(next ? [Number(next)] : [])}
        onSearchChange={setSearch}
        fallbackLabel={selected === undefined ? null : labels.get(selected)}
        isLoading={searchQuery.isFetching}
        isError={searchQuery.isError}
        required={required}
        className={inputClassName}
        {...selectLabels}
      />
    );
  }

  return (
    <div>
      {value.length > 0 ? (
        <ul className="mb-1.5 flex flex-wrap gap-1.5">
          {value.map((storeId) => {
            const label = labels.get(storeId) ?? `#${storeId}`;

            return (
              <li
                key={storeId}
                className="flex min-h-9 items-center gap-1 rounded-full bg-emerald-400/15 pl-3 text-sm font-medium text-emerald-800 dark:text-emerald-200"
              >
                <span className="max-w-[14rem] truncate">{label}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((selectedId) => selectedId !== storeId))}
                  aria-label={t('kpiTemplateForm.removeStore', { name: label })}
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
            );
          })}
        </ul>
      ) : null}
      <SearchableSelect
        id={id}
        value=""
        options={options}
        onChange={(next) => {
          if (next) {
            onChange([...value, Number(next)]);
          }
        }}
        onSearchChange={setSearch}
        isLoading={searchQuery.isFetching}
        isError={searchQuery.isError}
        required={required && value.length === 0}
        className={inputClassName}
        {...selectLabels}
      />
    </div>
  );
}
