import type { ReactNode } from 'react';

import type { TranslationKey } from '../i18n/locale-store';

/** One outline icon in the app's style: 24px grid, currentColor stroke. */
function Outline({ className, children }: { className: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  sales: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5v5M18 9.5v5" />
    </>
  ),
  receipts: (
    <>
      <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  customers: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </>
  ),
  newCustomers: (
    <>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" />
    </>
  ),
  returningCustomers: (
    <>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20a6.5 6.5 0 0 1 10.5-5.1" />
      <path d="M21 14.5a3.5 3.5 0 1 1-1-2.5M21 10v2.5h-2.5" />
    </>
  ),
  productVariety: (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5z" />
      <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
    </>
  ),
  conversion: (
    <>
      <path d="M3 4h18l-7 8.5V19l-4 2v-8.5z" />
    </>
  ),
  visitors: (
    <>
      <path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3H14v18" />
      <path d="M14 3l5 2v16h-5M3 21h18" />
      <circle cx="11" cy="12.5" r=".6" fill="currentColor" />
    </>
  ),
  summary: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  other: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
} satisfies Record<string, ReactNode>;

type IconName = keyof typeof ICONS;

/**
 * What each store dashboard KPI looks like: an icon and a short name ("Ciro" instead of
 * "#1 Mağaza bazında ciro"). A KPI without an entry falls back to a chart icon and its
 * catalog name, so a new store KPI still shows.
 */
const STORE_KPI_VISUALS: Record<string, { icon: IconName; shortName: TranslationKey }> = {
  STORE_SALES: { icon: 'sales', shortName: 'storeDashboard.kpiShort.sales' },
  STORE_RECEIPTS: { icon: 'receipts', shortName: 'storeDashboard.kpiShort.receipts' },
  STORE_CUSTOMERS: { icon: 'customers', shortName: 'storeDashboard.kpiShort.customers' },
  STORE_NEW_CUSTOMERS: { icon: 'newCustomers', shortName: 'storeDashboard.kpiShort.newCustomers' },
  STORE_RETURNING_CUSTOMERS: {
    icon: 'returningCustomers',
    shortName: 'storeDashboard.kpiShort.returningCustomers',
  },
  STORE_PRODUCT_VARIETY: {
    icon: 'productVariety',
    shortName: 'storeDashboard.kpiShort.productVariety',
  },
  STORE_CONVERSION: { icon: 'conversion', shortName: 'storeDashboard.kpiShort.conversion' },
  STORE_VISITOR_COUNT: { icon: 'visitors', shortName: 'storeDashboard.kpiShort.visitors' },
};

/** The short name's translation key, or null to show the catalog name. */
export function storeKpiShortName(code: string): TranslationKey | null {
  return STORE_KPI_VISUALS[code]?.shortName ?? null;
}

/** The icon of a store KPI; `code` null is the summary tab. */
export function StoreKpiIcon({
  code,
  className = 'h-5 w-5',
}: {
  code: string | null;
  className?: string;
}) {
  const name: IconName = code === null ? 'summary' : (STORE_KPI_VISUALS[code]?.icon ?? 'other');

  return <Outline className={className}>{ICONS[name]}</Outline>;
}
