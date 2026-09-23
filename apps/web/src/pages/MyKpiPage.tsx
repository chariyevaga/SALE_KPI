import { AppShell } from '../components/AppShell';
import { EmployeeKpiView } from '../components/EmployeeKpiView';
import { useTranslation } from '../i18n/locale-store';

/** The signed-in employee's own plan, read-only (see `EmployeeKpiView`). */
export function MyKpiPage() {
  const { t } = useTranslation();

  return (
    <AppShell
      title={t('myKpi.title')}
      breadcrumbs={[{ label: t('common.home'), to: '/leaderboard' }, { label: t('myKpi.title') }]}
    >
      <EmployeeKpiView />
    </AppShell>
  );
}
