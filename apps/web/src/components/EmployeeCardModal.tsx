import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { useTranslation } from '../i18n/locale-store';
import type { EmployeeResponse } from '../types/api';
import { AuthenticatedImage } from './AuthenticatedImage';
import { Modal } from './Modal';
import { ProfileAvatar } from './ProfileAvatar';

interface EmployeeCardModalProps {
  open: boolean;
  onClose: () => void;
  employee: EmployeeResponse | null;
}

export function EmployeeCardModal({ open, onClose, employee }: EmployeeCardModalProps) {
  const { t } = useTranslation();
  const [photoOpen, setPhotoOpen] = useState(false);

  if (!employee) return null;

  const erpCode = employee.erpEmployeeCode;

  return (
    <Modal open={open} onClose={onClose} title={t('employeeCard.title')}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-400/15 to-emerald-600/5 p-5 text-center">
          {employee.avatar ? (
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              aria-label={t('employeeCard.viewPhoto')}
              className="rounded-full transition hover:opacity-90"
            >
              <ProfileAvatar employee={employee} className="h-20 w-20 ring-4 ring-white dark:ring-slate-900" />
            </button>
          ) : (
            <ProfileAvatar employee={employee} className="h-20 w-20 ring-4 ring-white dark:ring-slate-900" />
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {employee.firstname} {employee.lastname}
            </p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">@{employee.username}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              {employee.fullAccess ? t('employeeCard.managerRole') : t('employeeCard.employeeRole')}
            </span>
            {!employee.isActive ? (
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {t('employees.inactiveBadge')}
              </span>
            ) : null}
          </div>
        </div>

        <dl className="w-full space-y-1.5 text-sm">
          {employee.email ? (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">{t('employeeCard.email')}</dt>
              <dd className="truncate text-slate-800 dark:text-slate-200">{employee.email}</dd>
            </div>
          ) : null}
          {employee.phoneNumber ? (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">{t('employees.columnPhone')}</dt>
              <dd className="truncate text-slate-800 dark:text-slate-200">{employee.phoneNumber}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500 dark:text-slate-400">{t('employeeCard.erpCode')}</dt>
            <dd className="truncate text-slate-800 dark:text-slate-200">
              {erpCode ?? <span className="text-slate-400">{t('employeeCard.noErpLink')}</span>}
            </dd>
          </div>
        </dl>

        {erpCode ? (
          <>
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-3 dark:bg-slate-100">
              <QRCodeSVG value={erpCode} size={132} level="M" marginSize={0} />
            </div>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">{t('employeeCard.scanHint')}</p>
          </>
        ) : (
          <div className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center dark:border-slate-700">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-slate-400" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3m4 0v3m-7 4h3m4-4v4" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('employeeCard.noErpLink')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('employeeCard.noQrHint')}</p>
          </div>
        )}
      </div>

      {photoOpen && employee.avatar ? (
        <button
          type="button"
          onClick={() => setPhotoOpen(false)}
          aria-label={t('common.cancel')}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm"
        >
          <AuthenticatedImage
            path={employee.avatar.bigImageUrl ?? employee.avatar.contentUrl}
            alt={`${employee.firstname} ${employee.lastname}`}
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </button>
      ) : null}
    </Modal>
  );
}
