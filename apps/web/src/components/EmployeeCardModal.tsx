import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { getEmployeeCard } from '../api/employees';
import { localizeApiError } from '../i18n/api-errors';
import { useTranslation } from '../i18n/locale-store';
import type { EmployeeCard } from '../types/api';
import { AuthenticatedImage } from './AuthenticatedImage';
import { Modal } from './Modal';
import { ProfileAvatar } from './ProfileAvatar';
import { RecordInfoButton } from './RecordInfo';
import { Spinner } from './Spinner';

interface EmployeeCardModalProps {
  /** Whose card to show; `null` keeps the modal closed. */
  employeeId: string | null;
  onClose: () => void;
}

function storeLabel(store: NonNullable<EmployeeCard['defaultStore']>): string {
  if (store.nr === null) {
    return `#${String(store.id)}`;
  }

  return store.name ? `${String(store.nr)} · ${store.name}` : String(store.nr);
}

/**
 * The employee card (ADR-058). Every signed-in user may open anyone's card: name, photo,
 * job title, default store and the ERP code with its QR code come from
 * `GET /employees/:id/card`; e-mail and phone only arrive for admins and the employee.
 */
export function EmployeeCardModal({ employeeId, onClose }: EmployeeCardModalProps) {
  const { t } = useTranslation();
  const cardQuery = useQuery({
    queryKey: ['employee-card', employeeId],
    queryFn: () => getEmployeeCard(employeeId as string),
    enabled: Boolean(employeeId),
  });
  const card = cardQuery.data;

  return (
    <Modal
      open={Boolean(employeeId)}
      onClose={onClose}
      title={t('employeeCard.title')}
      headerActions={
        card ? (
          <RecordInfoButton
            tableName="employees"
            recordId={card.id}
            title={`${card.firstname} ${card.lastname}`}
          />
        ) : null
      }
    >
      {card ? (
        <EmployeeCardBody card={card} />
      ) : cardQuery.isError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {localizeApiError(cardQuery.error, t, 'employeeCard.errorLoading')}
        </p>
      ) : (
        <div className="flex justify-center py-10 text-slate-400" aria-busy="true">
          <Spinner className="h-6 w-6" />
          <span className="sr-only">{t('employeeCard.loading')}</span>
        </div>
      )}
    </Modal>
  );
}

function EmployeeCardBody({ card }: { card: EmployeeCard }) {
  const { t } = useTranslation();
  const [photoOpen, setPhotoOpen] = useState(false);
  const erpCode = card.erpEmployeeCode;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-400/15 to-emerald-600/5 p-5 text-center">
        {card.avatar ? (
          <button
            type="button"
            onClick={() => setPhotoOpen(true)}
            aria-label={t('employeeCard.viewPhoto')}
            className="rounded-full transition hover:opacity-90"
          >
            <ProfileAvatar employee={card} className="h-20 w-20 ring-4 ring-white dark:ring-slate-900" />
          </button>
        ) : (
          <ProfileAvatar employee={card} className="h-20 w-20 ring-4 ring-white dark:ring-slate-900" />
        )}

        <div className="min-w-0 max-w-full">
          <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {card.firstname} {card.lastname}
          </p>
          {card.jobTitle ? (
            <p className="truncate text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {card.jobTitle}
            </p>
          ) : null}
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">@{card.username}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            {card.fullAccess ? t('employeeCard.managerRole') : t('employeeCard.employeeRole')}
          </span>
          {!card.isActive ? (
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {t('employees.inactiveBadge')}
            </span>
          ) : null}
        </div>
      </div>

      <dl className="w-full space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="flex-shrink-0 text-slate-500 dark:text-slate-400">
            {t('employeeCard.jobTitle')}
          </dt>
          <dd className="truncate text-slate-800 dark:text-slate-200">
            {card.jobTitle ?? <span className="text-slate-400">—</span>}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="flex-shrink-0 text-slate-500 dark:text-slate-400">
            {t('employeeCard.defaultStore')}
          </dt>
          <dd className="truncate text-slate-800 dark:text-slate-200">
            {card.defaultStore ? (
              storeLabel(card.defaultStore)
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </dd>
        </div>
        {card.email ? (
          <div className="flex justify-between gap-3">
            <dt className="flex-shrink-0 text-slate-500 dark:text-slate-400">
              {t('employeeCard.email')}
            </dt>
            <dd className="truncate text-slate-800 dark:text-slate-200">{card.email}</dd>
          </div>
        ) : null}
        {card.phoneNumber ? (
          <div className="flex justify-between gap-3">
            <dt className="flex-shrink-0 text-slate-500 dark:text-slate-400">
              {t('employees.columnPhone')}
            </dt>
            <dd className="truncate text-slate-800 dark:text-slate-200">{card.phoneNumber}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="flex-shrink-0 text-slate-500 dark:text-slate-400">
            {t('employeeCard.erpCode')}
          </dt>
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

      {photoOpen && card.avatar ? (
        <button
          type="button"
          onClick={() => setPhotoOpen(false)}
          aria-label={t('common.cancel')}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm"
        >
          <AuthenticatedImage
            path={card.avatar.bigImageUrl ?? card.avatar.contentUrl}
            alt={`${card.firstname} ${card.lastname}`}
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </button>
      ) : null}
    </div>
  );
}
