import { pickLocalizedText } from '../i18n/localized-text';
import { useTranslation } from '../i18n/locale-store';
import type { KpiInputField, KpiInputValue } from '../types/api';
import { FormField, RequiredMark, formInputClassName, formInputDenseClassName } from './FormField';
import { StoreLookupField } from './StoreLookupField';

interface KpiInputFieldsProps {
  idPrefix: string;
  schema: KpiInputField[];
  values: Record<string, KpiInputValue>;
  onChange: (values: Record<string, KpiInputValue>) => void;
  /** Compact labels and 44px controls for repeated rows such as template items. */
  dense?: boolean;
}

/**
 * Renders a KPI definition's `inputSchema` (ADR-032) as form controls. One control per
 * field type, so a new KPI or a new field never needs KPI-specific form code.
 */
export function KpiInputFields({
  idPrefix,
  schema,
  values,
  onChange,
  dense = false,
}: KpiInputFieldsProps) {
  const { t, locale } = useTranslation();
  const inputClassName = dense ? formInputDenseClassName : formInputClassName;

  function setValue(key: string, value: KpiInputValue | undefined) {
    const next = { ...values };

    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }

    onChange(next);
  }

  return (
    <>
      {schema.map((field) => {
        const id = `${idPrefix}-${field.key}`;
        const label = pickLocalizedText(field.label, locale);
        const current = values[field.key];

        switch (field.type) {
          case 'lookup': {
            const ids = Array.isArray(current)
              ? current.filter((entry): entry is number => typeof entry === 'number')
              : typeof current === 'number'
                ? [current]
                : [];

            return (
              <FormField
                key={field.key}
                label={label}
                htmlFor={id}
                required={field.required}
                dense={dense}
              >
                <StoreLookupField
                  id={id}
                  multiple={field.multiple}
                  value={ids}
                  onChange={(next) =>
                    setValue(field.key, field.multiple ? next : (next[0] ?? undefined))
                  }
                  required={field.required}
                  inputClassName={inputClassName}
                />
              </FormField>
            );
          }
          case 'select': {
            if (field.multiple) {
              const selected = Array.isArray(current)
                ? current.filter((entry): entry is string => typeof entry === 'string')
                : [];

              return (
                <fieldset key={field.key} className="min-w-0">
                  <legend
                    className={`font-medium text-slate-700 dark:text-slate-300 ${
                      dense ? 'mb-1 text-xs' : 'mb-1.5 text-sm'
                    }`}
                  >
                    {label}
                    {field.required ? <RequiredMark /> : null}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(option.value)}
                          onChange={(event) =>
                            setValue(
                              field.key,
                              event.target.checked
                                ? [...selected, option.value]
                                : selected.filter((value) => value !== option.value),
                            )
                          }
                          className="h-4 w-4 accent-emerald-400"
                        />
                        {pickLocalizedText(option.label, locale)}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            }

            return (
              <FormField
                key={field.key}
                label={label}
                htmlFor={id}
                required={field.required}
                dense={dense}
              >
                <select
                  id={id}
                  required={field.required}
                  value={typeof current === 'string' ? current : ''}
                  onChange={(event) => setValue(field.key, event.target.value || undefined)}
                  className={inputClassName}
                >
                  <option value="">{t('kpiTemplateForm.selectPlaceholder')}</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {pickLocalizedText(option.label, locale)}
                    </option>
                  ))}
                </select>
              </FormField>
            );
          }
          case 'number':
            return (
              <FormField
                key={field.key}
                label={label}
                htmlFor={id}
                required={field.required}
                dense={dense}
              >
                <input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  value={typeof current === 'number' ? current : ''}
                  onChange={(event) =>
                    setValue(
                      field.key,
                      event.target.value === '' ? undefined : Number(event.target.value),
                    )
                  }
                  className={inputClassName}
                />
              </FormField>
            );
          case 'boolean':
            return (
              <label
                key={field.key}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-800 dark:text-slate-100"
              >
                <span>
                  {label}
                  {field.required ? <RequiredMark /> : null}
                </span>
                <input
                  type="checkbox"
                  checked={current === true}
                  onChange={(event) => setValue(field.key, event.target.checked)}
                  className="h-5 w-5 accent-emerald-400"
                />
              </label>
            );
        }
      })}
    </>
  );
}
