import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Spinner } from './Spinner';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id: string;
  value: string;
  /** Options for the current search; the parent loads them from the API. */
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  /**
   * Receives the typed text 300 ms after typing stops, and '' when the list closes.
   * Pass a stable function (e.g. a state setter) so typing does not restart the delay.
   */
  onSearchChange: (search: string) => void;
  /** Shown for `value` until an option with that value has been loaded. */
  fallbackLabel?: string | null | undefined;
  /** Label of the empty choice; omit it when a selection is required. */
  noneLabel?: string | undefined;
  placeholder: string;
  noResultsLabel: string;
  loadingLabel: string;
  errorLabel: string;
  isLoading?: boolean;
  isError?: boolean;
  /** Announced to screen readers; the visible asterisk comes from the field label. */
  required?: boolean;
  className?: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const NONE_KEY = '__none__';

/**
 * Editable combobox (WAI-ARIA 1.2 pattern): type to search, arrows + Enter to pick,
 * Escape to close. Touch selections blur the input so the mobile keyboard goes away.
 */
export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  onSearchChange,
  fallbackLabel,
  noneLabel,
  placeholder,
  noResultsLabel,
  loadingLabel,
  errorLabel,
  isLoading = false,
  isError = false,
  required = false,
  className = '',
}: SearchableSelectProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastPointerType = useRef<string>('mouse');
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [knownLabels, setKnownLabels] = useState<ReadonlyMap<string, string>>(() => new Map());

  // Remember loaded labels so the selection stays readable after a search filters it out.
  useEffect(() => {
    setKnownLabels((previous) => {
      const changed = options.filter((option) => previous.get(option.value) !== option.label);

      if (changed.length === 0) {
        return previous;
      }

      const next = new Map(previous);

      for (const option of changed) {
        next.set(option.value, option.label);
      }

      return next;
    });
  }, [options]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = setTimeout(() => onSearchChange(inputText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputText, isOpen, onSearchChange]);

  const items = useMemo<SearchableSelectOption[]>(
    () =>
      noneLabel !== undefined && inputText.trim() === ''
        ? [{ value: '', label: noneLabel }, ...options]
        : options,
    [inputText, noneLabel, options],
  );

  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      document.getElementById(`${listboxId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen, listboxId]);

  const selectedLabel =
    value === ''
      ? (noneLabel ?? '')
      : (options.find((option) => option.value === value)?.label ??
        knownLabels.get(value) ??
        fallbackLabel ??
        value);

  function open() {
    if (isOpen) {
      return;
    }

    setInputText('');
    setActiveIndex(-1);
    setIsOpen(true);
  }

  function close() {
    if (!isOpen) {
      return;
    }

    setIsOpen(false);
    setInputText('');
    setActiveIndex(-1);
    onSearchChange('');
  }

  function select(option: SearchableSelectOption, viaTouch: boolean) {
    onChange(option.value);
    close();

    if (viaTouch) {
      inputRef.current?.blur();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();

        if (!isOpen) {
          open();
          return;
        }

        setActiveIndex((index) => Math.min(index + 1, items.length - 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      case 'Enter': {
        if (!isOpen) {
          return;
        }

        // Never submit the surrounding form while the list is open.
        event.preventDefault();
        const option = items[activeIndex];

        if (option) {
          select(option, false);
        }

        return;
      }
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          close();
        }

        return;
    }
  }

  const statusLabel = isError
    ? errorLabel
    : options.length === 0
      ? isLoading
        ? loadingLabel
        : noResultsLabel
      : null;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-required={required || undefined}
        aria-activedescendant={
          isOpen && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={isOpen ? inputText : selectedLabel}
        placeholder={isOpen && selectedLabel ? selectedLabel : placeholder}
        onFocus={open}
        onClick={open}
        onBlur={close}
        onChange={(event) => {
          setInputText(event.target.value);
          setActiveIndex(-1);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={`${className} pr-11`}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400"
      >
        {isOpen && isLoading ? (
          <Spinner />
        ) : (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`h-5 w-5 transition ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      {isOpen ? (
        <div
          // Keeps focus in the input (options, scrollbar, status text) so blur does not close the list first.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-0 z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <ul id={listboxId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {items.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              const tone = isSelected
                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                : option.value === ''
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-900 dark:text-slate-100';

              return (
                <li
                  key={option.value === '' ? NONE_KEY : option.value}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerDown={(event: PointerEvent<HTMLLIElement>) => {
                    lastPointerType.current = event.pointerType;
                  }}
                  onClick={() => select(option, lastPointerType.current === 'touch')}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex min-h-[44px] cursor-pointer items-center justify-between gap-3 px-4 py-2 text-base ${
                    isActive ? 'bg-emerald-400/10' : ''
                  } ${tone}`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {isSelected ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5 flex-shrink-0"
                    >
                      <path
                        d="m4.5 10.5 3.5 3.5 7.5-8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {statusLabel ? (
            <p
              role={isError ? 'alert' : 'status'}
              className={`px-4 py-3 text-sm ${
                isError ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {statusLabel}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
