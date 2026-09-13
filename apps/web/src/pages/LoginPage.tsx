import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { login } from '../api/auth';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Modal } from '../components/Modal';
import { PasswordInput } from '../components/PasswordInput';
import { useTranslation } from '../i18n/locale-store';
import { ApiError } from '../lib/api-client';
import { useAuthStore } from '../store/auth-store';

const inputClassName =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (auth) => {
      setSession(auth);
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/leaderboard';
      void navigate(redirectTo, { replace: true });
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/leaderboard" replace />;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    loginMutation.mutate({ username, password, rememberMe });
  }

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.status === 401
        ? t('login.errorInvalidCredentials')
        : loginMutation.error.message
      : loginMutation.isError
        ? t('login.errorGeneric')
        : null;

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-white via-slate-50 to-white text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 right-20 h-72 w-72 bg-emerald-200/20 rounded-full blur-3xl dark:bg-emerald-950/20" />
        <div className="absolute bottom-10 left-10 h-96 w-96 bg-blue-200/20 rounded-full blur-3xl dark:bg-blue-950/20" />
      </div>

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="flex w-full flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">LG</span>
              </div>
              <p className="text-base font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                Lorem & Glamur
              </p>
            </div>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              {t('login.brand')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-top-4 duration-700 delay-200" noValidate>
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="mb-2 space-y-1 text-center">
                <h1 className="text-3xl font-bold tracking-tight">{t('login.title')}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Hesabınıza giriş yaparak başlayın
                </p>
              </div>

              <div>
                <label htmlFor="username" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {t('login.usernameLabel')}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className={inputClassName}
                  placeholder="john.doe"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {t('login.passwordLabel')}
                </label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={setPassword}
                  className={inputClassName}
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded accent-emerald-400"
                  />
                  <span className="font-medium">{t('login.rememberMe')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              {errorMessage ? (
                <p role="alert" className="animate-in fade-in duration-300 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="group relative h-12 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-400/40 transition hover:from-emerald-300 hover:to-emerald-400 hover:shadow-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-emerald-900/50 dark:hover:shadow-emerald-900/60"
              >
                <span className="relative flex items-center justify-center">
                  {loginMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                      {t('login.submitting')}
                    </>
                  ) : (
                    t('login.submit')
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 lg:flex">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_60%,white,transparent_30%)]" />
        <div className="relative px-12 text-center text-white">
          <p className="text-4xl font-bold tracking-tight">Lorem & Glamur</p>
          <p className="mt-4 text-emerald-50/80">{t('login.brand')}</p>
        </div>
      </div>

      <Modal
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        title={t('login.forgotPassword')}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('login.forgotPasswordHelp')}</p>
      </Modal>
    </div>
  );
}
