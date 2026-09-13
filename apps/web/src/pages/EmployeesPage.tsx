import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { listEmployees, type EmployeeListQuery, type EmployeeSortField } from '../api/employees';
import { AppShell } from '../components/AppShell';
import { AuthenticatedImage } from '../components/AuthenticatedImage';
import { EmployeeCardModal } from '../components/EmployeeCardModal';
import { Drawer } from '../components/Drawer';
import { useTranslation, type TranslationKey } from '../i18n/locale-store';
import { useAuthStore } from '../store/auth-store';
import type { EmployeeResponse } from '../types/api';

function initials(employee: EmployeeResponse): string {
  return `${employee.firstname[0] ?? ''}${employee.lastname[0] ?? ''}`.toUpperCase();
}

function AvatarOrInitials({ employee }: { employee: EmployeeResponse }) {
  const fallback = (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {initials(employee)}
    </span>
  );

  if (employee.avatar) {
    return (
      <AuthenticatedImage
        path={employee.avatar.smallImageUrl ?? employee.avatar.contentUrl}
        alt=""
        className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
        fallback={fallback}
      />
    );
  }

  return fallback;
}

function AvatarButton({
  employee,
  onShowCard,
}: {
  employee: EmployeeResponse;
  onShowCard: (employee: EmployeeResponse) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        // The avatar sits inside a row link; keep the click from navigating.
        event.preventDefault();
        event.stopPropagation();
        onShowCard(employee);
      }}
      aria-label={`${employee.firstname} ${employee.lastname}`}
      className="flex-shrink-0 rounded-full transition hover:ring-2 hover:ring-emerald-400/60"
    >
      <AvatarOrInitials employee={employee} />
    </button>
  );
}

function StatusBadges({ employee }: { employee: EmployeeResponse }) {
  const { t } = useTranslation();

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {!employee.isActive ? (
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {t('employees.inactiveBadge')}
        </span>
      ) : null}
      {employee.fullAccess ? (
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          {t('employees.managerBadge')}
        </span>
      ) : null}
      {employee.isActive && !employee.fullAccess ? (
        <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
      ) : null}
    </span>
  );
}

function EmployeeCard({
  employee,
  onShowCard,
  canManage,
}: {
  employee: EmployeeResponse;
  onShowCard: (employee: EmployeeResponse) => void;
  canManage: boolean;
}) {
  const className =
    'flex min-h-[64px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800';

  const content = (
    <>
      <AvatarButton employee={employee} onShowCard={onShowCard} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {employee.firstname} {employee.lastname}
          </span>
          <StatusBadges employee={employee} />
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          @{employee.username}
          {employee.email ? ` \u00b7 ${employee.email}` : ''}
        </span>
      </span>
      {canManage ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0 text-slate-400" stroke="currentColor" strokeWidth="2">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </>
  );

  // Only admins can open the edit screen, so the row is a plain container otherwise.
  if (!canManage) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link to={`/employees/${employee.id}`} className={className}>
      {content}
    </Link>
  );
}

function EmployeeRow({
  employee,
  onShowCard,
  canManage,
}: {
  employee: EmployeeResponse;
  onShowCard: (employee: EmployeeResponse) => void;
  canManage: boolean;
}) {
  const { t } = useTranslation();

  return (
    <tr className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-900">
      <td className="py-2 pl-4 pr-3">
        <div className="flex items-center gap-2.5">
          <AvatarButton employee={employee} onShowCard={onShowCard} />
          {canManage ? (
            <Link
              to={`/employees/${employee.id}`}
              className="truncate text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              {employee.firstname}
            </Link>
          ) : (
            <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {employee.firstname}
            </span>
          )}
        </div>
      </td>
      <td className="py-2 pr-3 text-sm text-slate-700 dark:text-slate-300">{employee.lastname}</td>
      <td className="py-2 pr-3 text-sm text-slate-500 dark:text-slate-400">@{employee.username}</td>
      {canManage ? (
        <>
          <td className="py-2 pr-3 text-sm text-slate-500 dark:text-slate-400">{employee.email ?? '—'}</td>
          <td className="py-2 pr-3 text-sm text-slate-500 dark:text-slate-400">{employee.phoneNumber ?? '—'}</td>
        </>
      ) : null}
      <td className="py-2 pr-3">
        <StatusBadges employee={employee} />
      </td>
      {canManage ? (
        <td className="py-2 pr-4 text-right">
          <Link
            to={`/employees/${employee.id}`}
            aria-label={t('employees.columnActions')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-400/10 dark:text-emerald-400"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </td>
      ) : null}
    </tr>
  );
}

/** Filters the user is editing in the drawer, applied to the query only on confirm. */
interface FilterState {
  status: 'all' | 'active' | 'inactive';
  managersOnly: boolean;
  erpLinkedOnly: boolean;
  withAvatarOnly: boolean;
}

const EMPTY_FILTERS: FilterState = {
  status: 'all',
  managersOnly: false,
  erpLinkedOnly: false,
  withAvatarOnly: false,
};

function countActiveFilters(filters: FilterState): number {
  return (
    (filters.status === 'all' ? 0 : 1) +
    (filters.managersOnly ? 1 : 0) +
    (filters.erpLinkedOnly ? 1 : 0) +
    (filters.withAvatarOnly ? 1 : 0)
  );
}

function toQuery(filters: FilterState): EmployeeListQuery {
  return {
    ...(filters.status === 'all' ? {} : { isActive: filters.status === 'active' }),
    ...(filters.managersOnly ? { fullAccess: true } : {}),
    ...(filters.erpLinkedOnly ? { hasErpLink: true } : {}),
    ...(filters.withAvatarOnly ? { hasAvatar: true } : {}),
  };
}

interface SortOption {
  value: string;
  labelKey: TranslationKey;
  sort: EmployeeSortField;
  order: 'asc' | 'desc';
}

const SORT_OPTIONS: [SortOption, ...SortOption[]] = [
  { value: 'firstname-asc', labelKey: 'employees.sortFirstnameAsc', sort: 'firstname', order: 'asc' },
  { value: 'firstname-desc', labelKey: 'employees.sortFirstnameDesc', sort: 'firstname', order: 'desc' },
  { value: 'lastname-asc', labelKey: 'employees.sortLastname', sort: 'lastname', order: 'asc' },
  { value: 'username-asc', labelKey: 'employees.sortUsername', sort: 'username', order: 'asc' },
  { value: 'createdAt-desc', labelKey: 'employees.sortNewest', sort: 'createdAt', order: 'desc' },
  { value: 'createdAt-asc', labelKey: 'employees.sortOldest', sort: 'createdAt', order: 'asc' },
];

export function EmployeesPage() {
  const { t } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sortValue, setSortValue] = useState('firstname-asc');
  const [cardEmployee, setCardEmployee] = useState<EmployeeResponse | null>(null);
  const canManage = useAuthStore((state) => state.employee?.fullAccess ?? false);

  // Debounce so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const sortOption = SORT_OPTIONS.find((option) => option.value === sortValue) ?? SORT_OPTIONS[0];
  const activeFilterCount = countActiveFilters(appliedFilters);

  const query: EmployeeListQuery = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...toQuery(appliedFilters),
      sort: sortOption.sort,
      order: sortOption.order,
    }),
    [search, appliedFilters, sortOption],
  );

  const employeesQuery = useInfiniteQuery({
    queryKey: ['employees', query],
    queryFn: ({ pageParam }) => listEmployees(pageParam, query),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });

  const employees = useMemo(
    () => employeesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [employeesQuery.data],
  );
  const total = employeesQuery.data?.pages[0]?.total ?? 0;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && employeesQuery.hasNextPage && !employeesQuery.isFetchingNextPage) {
        void employeesQuery.fetchNextPage();
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [employeesQuery]);

  function openFilters() {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setFilterOpen(false);
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setFilterOpen(false);
  }

  const hasNoResults = !employeesQuery.isLoading && employees.length === 0;
  const isFiltered = Boolean(search) || activeFilterCount > 0;

  return (
    <AppShell
      title={t('employees.title')}
      fullWidth
      breadcrumbs={[{ label: t('common.home'), to: '/leaderboard' }, { label: t('employees.title') }]}
    >
      <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} side="right" variant="overlay">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('employees.filters')}</h2>
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            aria-label={t('appShell.closeMenu')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('employees.statusColumn')}
            </legend>
            {([
              ['all', t('employees.filterStatusAll')],
              ['active', t('employees.filterOnlyActive')],
              ['inactive', t('employees.filterOnlyInactive')],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="radio"
                  name="status"
                  checked={draftFilters.status === value}
                  onChange={() => setDraftFilters((prev) => ({ ...prev, status: value }))}
                  className="h-4 w-4 accent-emerald-400"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('employees.filters')}
            </legend>
            {([
              ['managersOnly', t('employees.filterManagers')],
              ['erpLinkedOnly', t('employees.filterErpLinked')],
              ['withAvatarOnly', t('employees.filterWithAvatar')],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={draftFilters[key]}
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, [key]: event.target.checked }))}
                  className="h-4 w-4 rounded accent-emerald-400"
                />
                {label}
              </label>
            ))}
          </fieldset>
        </div>

        <div className="flex gap-2 border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-800">
          <button
            type="button"
            onClick={clearFilters}
            className="h-10 flex-1 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {t('common.clear')}
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="h-10 flex-1 rounded-lg bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            {t('common.apply')}
          </button>
        </div>
      </Drawer>

      {/* Toolbar: search left, sort + filter right */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('employees.searchPlaceholder')}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={sortValue}
            onChange={(event) => setSortValue(event.target.value)}
            aria-label={t('employees.sortLabel')}
            className="h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openFilters}
            aria-label={t('employees.filters')}
            className={`relative flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
              activeFilterCount > 0
                ? 'border-emerald-400 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">{t('employees.filters')}</span>
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[11px] font-bold text-slate-950">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Active filter summary */}
      {isFiltered ? (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {total} {t('employees.title').toLowerCase()}
          </span>
          {search ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              “{search}”
              <button type="button" onClick={() => setSearchInput('')} aria-label={t('common.clear')} className="text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-100">
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="3">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ) : null}
          {activeFilterCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300">
              {activeFilterCount} {t('employees.filtersActiveCount')}
              <button type="button" onClick={clearFilters} aria-label={t('common.clear')} className="transition hover:text-emerald-900 dark:hover:text-emerald-100">
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="3">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ) : null}
        </div>
      ) : null}

      {employeesQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{t('employees.loading')}</p>
      ) : null}

      {employeesQuery.isError ? (
        <p className="mx-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400">
          {t('employees.errorLoading')}
        </p>
      ) : null}

      {hasNoResults ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {isFiltered ? t('employees.noSearchResults') : t('employees.empty')}
        </p>
      ) : null}

      {employees.length > 0 ? (
        <>
          <div className="flex flex-col gap-2 px-4 lg:hidden">
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} onShowCard={setCardEmployee} canManage={canManage} />
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/60 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                  <th className="py-2 pl-4 pr-3 font-medium">{t('employeeForm.firstnameLabel')}</th>
                  <th className="py-2 pr-3 font-medium">{t('employees.columnLastname')}</th>
                  <th className="py-2 pr-3 font-medium">{t('employees.columnUsername')}</th>
                  {canManage ? (
                    <>
                      <th className="py-2 pr-3 font-medium">{t('employeeForm.emailLabel')}</th>
                      <th className="py-2 pr-3 font-medium">{t('employees.columnPhone')}</th>
                    </>
                  ) : null}
                  <th className="py-2 pr-3 font-medium">{t('employees.statusColumn')}</th>
                  {canManage ? (
                    <th className="py-2 pr-4 text-right font-medium">{t('employees.columnActions')}</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <EmployeeRow key={employee.id} employee={employee} onShowCard={setCardEmployee} canManage={canManage} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <div ref={sentinelRef} className="h-1" />

      {employeesQuery.isFetchingNextPage ? (
        <p className="py-4 text-center text-xs text-slate-500">{t('employees.loading')}</p>
      ) : null}

      <EmployeeCardModal
        open={cardEmployee !== null}
        onClose={() => setCardEmployee(null)}
        employee={cardEmployee}
      />

      {canManage ? (
      <Link
        to="/employees/new"
        aria-label={t('employees.addEmployee')}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300 active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </Link>
      ) : null}
    </AppShell>
  );
}
