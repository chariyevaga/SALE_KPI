import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { createEmployee, deactivateEmployee, getEmployee, updateEmployee } from '../api/employees';
import { listErpEmployees } from '../api/erp-employees';
import { AppShell } from '../components/AppShell';
import { EmployeeSessionsPanel } from '../components/EmployeeSessionsPanel';
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
  { value: 'sessions', labelKey: 'employeeForm.tabSessions' },
  { value: 'kpi', labelKey: 'employeeForm.tabKpi' },
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

  const employeeQuery = useQuery({
    queryKey: ['employees', id],
    queryFn: () => getEmployee(id as string),
    enabled: mode === 'edit' && Boolean(id),
  });

  const erpEmployeesQuery = useQuery({
    queryKey: ['erp-employees'],
    queryFn: listErpEmployees,
  });

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
    >
      {mode === 'edit' && id ? (
        <div className="mb-5 flex gap-1 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSearchParams(tab.value === 'details' ? {} : { tab: tab.value })}
                aria-current={isActive ? 'page' : undefined}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
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

      {mode === 'edit' && activeTab === 'kpi' ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('common.comingSoon')}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {t('common.comingSoonHint')}
          </p>
        </div>
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
          <Field label={t('employeeForm.usernameLabel')} htmlFor="username">
            <input
              id="username"
              required
              minLength={3}
              autoCapitalize="none"
              autoCorrect="off"
              maxLength={100}
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              className={inputClassName}
            />
          </Field>

          <Field
            label={
              mode === 'create'
                ? t('employeeForm.passwordLabelCreate')
                : t('employeeForm.passwordLabelEdit')
            }
            htmlFor="password"
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
              className={inputClassName}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('employeeForm.firstnameLabel')} htmlFor="firstname">
              <input
                id="firstname"
                required
                maxLength={100}
                value={form.firstname}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, firstname: event.target.value }))
                }
                className={inputClassName}
              />
            </Field>
            <Field label={t('employeeForm.lastnameLabel')} htmlFor="lastname">
              <input
                id="lastname"
                required
                maxLength={100}
                value={form.lastname}
                onChange={(event) => setForm((prev) => ({ ...prev, lastname: event.target.value }))}
                className={inputClassName}
              />
            </Field>
          </div>

          <Field label={t('employeeForm.emailLabel')} htmlFor="email">
            <input
              id="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              maxLength={320}
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className={inputClassName}
            />
          </Field>

          <Field label={t('employeeForm.phoneLabel')} htmlFor="phoneNumber">
            <input
              id="phoneNumber"
              type="tel"
              inputMode="tel"
              maxLength={32}
              value={form.phoneNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
              }
              className={inputClassName}
            />
          </Field>

          <Field label={t('employeeForm.erpEmployeeLabel')} htmlFor="erpEmployeeId">
            <select
              id="erpEmployeeId"
              value={form.erpEmployeeId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, erpEmployeeId: event.target.value }))
              }
              disabled={erpEmployeesQuery.isLoading}
              className={inputClassName}
            >
              <option value="">{t('employeeForm.erpEmployeeNone')}</option>
              {erpEmployeesQuery.data?.map((option) => (
                <option key={option.id} value={option.id}>
                  {[option.code, option.name].filter(Boolean).join(' — ') || option.id}
                </option>
              ))}
            </select>
            {erpEmployeesQuery.isError ? (
              <p role="alert" className="mt-1 text-xs text-red-500 dark:text-red-400">
                {t('employeeForm.erpEmployeesError')}
              </p>
            ) : null}
          </Field>

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

const inputClassName =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{hint}</p> : null}
    </div>
  );
}
