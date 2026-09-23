import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { createEmployee, deactivateEmployee, getEmployee, updateEmployee } from '../api/employees';
import { listErpEmployees } from '../api/erp-employees';
import { AppShell } from '../components/AppShell';
import { EmployeeKpiPlansPanel } from '../components/EmployeeKpiPlansPanel';
import { EmployeeKpiView } from '../components/EmployeeKpiView';
import { EmployeeSalaryPanel } from '../components/EmployeeSalaryPanel';
import { EmployeeSessionsPanel } from '../components/EmployeeSessionsPanel';
import { FormField, formInputClassName } from '../components/FormField';
import { SearchableSelect } from '../components/SearchableSelect';
import { Spinner } from '../components/Spinner';
import { PasswordInput } from '../components/PasswordInput';
import { localizeApiError } from '../i18n/api-errors';
import { useTranslation, type TranslationKey } from '../i18n/locale-store';
import { useAuthStore } from '../store/auth-store';

interface FormValues {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  erpEmployeeId: string;
  fullAccess: boolean;
  canEnterVisitorCounts: boolean;
}

const EMPTY_FORM: FormValues = {
  username: '',
  password: '',
  firstname: '',
  lastname: '',
  email: '',
  phoneNumber: '',
  erpEmployeeId: '',
  fullAccess: false,
  canEnterVisitorCounts: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(form: FormValues, mode: 'create' | 'edit'): TranslationKey | null {
  if (!form.username.trim()) return 'employeeForm.usernameRequired';
  if (form.username.trim().length < 3) return 'employeeForm.usernameTooShort';
  if (mode === 'create' && !form.password) return 'employeeForm.passwordRequired';
  if (form.password && form.password.length < 8) return 'employeeForm.passwordTooShort';
  if (!form.firstname.trim()) return 'employeeForm.firstnameRequired';
  if (!form.lastname.trim()) return 'employeeForm.lastnameRequired';
  if (form.email && !EMAIL_PATTERN.test(form.email.trim())) return 'employeeForm.emailInvalid';

  return null;
}

const TABS: { value: string; labelKey: TranslationKey }[] = [
  { value: 'details', labelKey: 'employeeForm.tabDetails' },
  { value: 'kpi', labelKey: 'employeeForm.tabKpi' },
  { value: 'kpi-plans', labelKey: 'employeeForm.tabKpiPlans' },
  { value: 'salary', labelKey: 'employeeForm.tabSalary' },
  { value: 'sessions', labelKey: 'employeeForm.tabSessions' },
];

export function EmployeeFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const currentEmployee = useAuthStore((state) => state.employee);

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [formErrorKey, setFormErrorKey] = useState<TranslationKey | null>(null);
  const [erpSearch, setErpSearch] = useState('');

  const employeeQuery = useQuery({
    queryKey: ['employees', id],
    queryFn: () => getEmployee(id as string),
    enabled: mode === 'edit' && Boolean(id),
  });

  const erpEmployeesQuery = useQuery({
    queryKey: ['erp-employees', erpSearch],
    queryFn: () => listErpEmployees(erpSearch),
    // Keep the previous results on screen while the next search loads.
    placeholderData: keepPreviousData,
  });

  const erpEmployeeOptions = useMemo(
    () =>
      (erpEmployeesQuery.data ?? []).map((option) => ({
        value: String(option.id),
        label: [option.code, option.name].filter(Boolean).join(' — ') || String(option.id),
      })),
    [erpEmployeesQuery.data],
  );

  // A linked rep that is inactive in Tiger is not listed; fall back to its code.
  const erpFallbackLabel =
    employeeQuery.data?.erpEmployeeId !== null &&
    String(employeeQuery.data?.erpEmployeeId) === form.erpEmployeeId
      ? employeeQuery.data?.erpEmployeeCode
      : null;

  useEffect(() => {
    if (employeeQuery.data) {
      setForm({
        username: employeeQuery.data.username,
        password: '',
        firstname: employeeQuery.data.firstname,
        lastname: employeeQuery.data.lastname,
        email: employeeQuery.data.email ?? '',
        phoneNumber: employeeQuery.data.phoneNumber ?? '',
        erpEmployeeId:
          employeeQuery.data.erpEmployeeId !== null ? String(employeeQuery.data.erpEmployeeId) : '',
        fullAccess: employeeQuery.data.fullAccess,
        canEnterVisitorCounts: employeeQuery.data.canEnterVisitorCounts,
      });
    }
  }, [employeeQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        username: form.username,
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email || null,
        phoneNumber: form.phoneNumber || null,
        erpEmployeeId: form.erpEmployeeId ? Number(form.erpEmployeeId) : null,
        fullAccess: form.fullAccess,
        canEnterVisitorCounts: form.canEnterVisitorCounts,
        ...(form.password ? { password: form.password } : {}),
      };

      return mode === 'create'
        ? createEmployee(payload as Parameters<typeof createEmployee>[0])
        : updateEmployee(id as string, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      void navigate('/employees', { replace: true });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateEmployee(id as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      void navigate('/employees', { replace: true });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => updateEmployee(id as string, { isActive: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      await queryClient.invalidateQueries({ queryKey: ['employees', id] });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveMutation.reset();
    deactivateMutation.reset();
    reactivateMutation.reset();

    const validationErrorKey = validateForm(form, mode);
    setFormErrorKey(validationErrorKey);

    if (validationErrorKey) {
      return;
    }

    saveMutation.mutate();
  }

  const isSelf = mode === 'edit' && currentEmployee?.id === id;
  const activeTab = searchParams.get('tab') ?? 'details';
  const isLoadingExisting = mode === 'edit' && employeeQuery.isLoading;
  const pageTitle = mode === 'create' ? t('employeeForm.titleCreate') : t('employeeForm.titleEdit');
  const formError = formErrorKey
    ? t(formErrorKey)
    : saveMutation.isError
      ? localizeApiError(saveMutation.error, t, 'employeeForm.genericSaveError')
      : deactivateMutation.isError
        ? localizeApiError(deactivateMutation.error, t, 'employeeForm.deactivateError')
        : reactivateMutation.isError
          ? localizeApiError(reactivateMutation.error, t, 'employeeForm.reactivateError')
          : null;

  return (
    <AppShell
      title={pageTitle}
      breadcrumbs={[{ label: t('employees.title'), to: '/employees' }, { label: pageTitle }]}
      recordInfo={
        mode === 'edit' && employeeQuery.data
          ? {
              tableName: 'employees',
              recordId: employeeQuery.data.id,
              title: `${employeeQuery.data.firstname} ${employeeQuery.data.lastname}`,
            }
          : undefined
      }
    >
      {mode === 'edit' && id ? (
        // Four tabs overflow a phone; the bar scrolls sideways instead of wrapping.
        <div className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0 dark:border-slate-800">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSearchParams(tab.value === 'details' ? {} : { tab: tab.value })}
                aria-current={isActive ? 'page' : undefined}
                className={`-mb-px min-h-[44px] flex-shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-emerald-400 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      ) : null}

      {mode === 'edit' && id && activeTab === 'sessions' ? (
        <EmployeeSessionsPanel employeeId={id} />
      ) : null}

      {mode === 'edit' && id && activeTab === 'kpi' ? (
        <EmployeeKpiView employeeId={id} salaryVisible />
      ) : null}

      {mode === 'edit' && id && activeTab === 'kpi-plans' ? (
        <EmployeeKpiPlansPanel employeeId={id} />
      ) : null}

      {mode === 'edit' && id && activeTab === 'salary' ? (
        <EmployeeSalaryPanel employeeId={id} />
      ) : null}

      {activeTab !== 'details' && mode === 'edit' ? null : isLoadingExisting ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('employeeForm.loading')}
        </p>
      ) : employeeQuery.isError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {localizeApiError(employeeQuery.error, t, 'employeeForm.errorLoading')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-8" noValidate>
          <FormField label={t('employeeForm.usernameLabel')} htmlFor="username" required>
            <input
              id="username"
              required
              minLength={3}
              autoCapitalize="none"
              autoCorrect="off"
              maxLength={100}
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              className={formInputClassName}
            />
          </FormField>

          <FormField
            label={
              mode === 'create'
                ? t('employeeForm.passwordLabelCreate')
                : t('employeeForm.passwordLabelEdit')
            }
            htmlFor="password"
            required={mode === 'create'}
            hint={mode === 'edit' ? t('employeeForm.passwordHintEdit') : undefined}
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              required={mode === 'create'}
              minLength={8}
              maxLength={128}
              value={form.password}
              onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
              className={formInputClassName}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t('employeeForm.firstnameLabel')} htmlFor="firstname" required>
              <input
                id="firstname"
                required
                maxLength={100}
                value={form.firstname}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, firstname: event.target.value }))
                }
                className={formInputClassName}
              />
            </FormField>
            <FormField label={t('employeeForm.lastnameLabel')} htmlFor="lastname" required>
              <input
                id="lastname"
                required
                maxLength={100}
                value={form.lastname}
                onChange={(event) => setForm((prev) => ({ ...prev, lastname: event.target.value }))}
                className={formInputClassName}
              />
            </FormField>
          </div>

          <FormField label={t('employeeForm.emailLabel')} htmlFor="email">
            <input
              id="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              maxLength={320}
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className={formInputClassName}
            />
          </FormField>

          <FormField label={t('employeeForm.phoneLabel')} htmlFor="phoneNumber">
            <input
              id="phoneNumber"
              type="tel"
              inputMode="tel"
              maxLength={32}
              value={form.phoneNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
              }
              className={formInputClassName}
            />
          </FormField>

          <FormField label={t('employeeForm.erpEmployeeLabel')} htmlFor="erpEmployeeId">
            <SearchableSelect
              id="erpEmployeeId"
              value={form.erpEmployeeId}
              options={erpEmployeeOptions}
              onChange={(value) => setForm((prev) => ({ ...prev, erpEmployeeId: value }))}
              onSearchChange={setErpSearch}
              fallbackLabel={erpFallbackLabel}
              noneLabel={t('employeeForm.erpEmployeeNone')}
              placeholder={t('employeeForm.erpEmployeeSearchPlaceholder')}
              noResultsLabel={t('employeeForm.erpEmployeeNoResults')}
              loadingLabel={t('employeeForm.loading')}
              errorLabel={t('employeeForm.erpEmployeesError')}
              isLoading={erpEmployeesQuery.isFetching}
              isError={erpEmployeesQuery.isError}
              className={formInputClassName}
            />
            {erpEmployeesQuery.isError ? (
              <p role="alert" className="mt-1 text-xs text-red-500 dark:text-red-400">
                {t('employeeForm.erpEmployeesError')}
              </p>
            ) : null}
          </FormField>

          <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <span>
              <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                {t('employeeForm.fullAccessLabel')}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {t('employeeForm.fullAccessHint')}
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.fullAccess}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fullAccess: event.target.checked }))
              }
              className="h-6 w-11 flex-shrink-0 cursor-pointer accent-emerald-400"
            />
          </label>

          <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <span>
              <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                {t('employeeForm.visitorCountsLabel')}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {t('employeeForm.visitorCountsHint')}
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.canEnterVisitorCounts}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, canEnterVisitorCounts: event.target.checked }))
              }
              className="h-6 w-11 flex-shrink-0 cursor-pointer accent-emerald-400"
            />
          </label>

          {formError ? (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="mt-2 h-12 w-full rounded-xl bg-emerald-400 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center justify-center gap-2">
              {saveMutation.isPending ? <Spinner /> : null}
              {saveMutation.isPending ? t('employeeForm.saving') : t('employeeForm.save')}
            </span>
          </button>

          {mode === 'edit' && employeeQuery.data ? (
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              {employeeQuery.data.isActive ? (
                <button
                  type="button"
                  disabled={isSelf || deactivateMutation.isPending}
                  onClick={() => {
                    setFormErrorKey(null);
                    saveMutation.reset();
                    reactivateMutation.reset();
                    deactivateMutation.mutate();
                  }}
                  title={isSelf ? t('employeeForm.selfDeactivateHint') : undefined}
                  className="h-12 w-full rounded-xl border border-red-500/30 text-base font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deactivateMutation.isPending
                    ? t('employeeForm.deactivating')
                    : t('employeeForm.deactivate')}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={reactivateMutation.isPending}
                  onClick={() => {
                    setFormErrorKey(null);
                    saveMutation.reset();
                    deactivateMutation.reset();
                    reactivateMutation.mutate();
                  }}
                  className="h-12 w-full rounded-xl border border-emerald-400/30 text-base font-semibold text-emerald-400 transition hover:bg-emerald-400/10"
                >
                  {reactivateMutation.isPending
                    ? t('employeeForm.reactivating')
                    : t('employeeForm.reactivate')}
                </button>
              )}
              {isSelf ? (
                <p className="mt-2 text-center text-xs text-slate-500">
                  {t('employeeForm.selfDeactivateHint')}
                </p>
              ) : null}
            </div>
          ) : null}
        </form>
      )}
    </AppShell>
  );
}
