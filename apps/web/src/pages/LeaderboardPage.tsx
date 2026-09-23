import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { CSSProperties, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { getLeaderboard } from '../api/leaderboard';
import { AppShell } from '../components/AppShell';
import { AuthenticatedImage } from '../components/AuthenticatedImage';
import { ProgressMeter } from '../components/ProgressMeter';
import { formatDateTime, formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import { useAuthStore } from '../store/auth-store';
import type { LeaderboardEntry, LeaderboardResponse } from '../types/api';

/** The server recalculates open periods on its own interval; the screen follows it. */
const OPEN_PERIOD_REFRESH_MS = 60_000;

/** How many places the podium shows. */
const PODIUM_SIZE = 3;

/**
 * Gold, silver and bronze. Every podium place also prints its number and a medal, so the
 * colour is never the only thing that tells the places apart.
 */
const MEDALS = {
  1: {
    ring: 'ring-amber-400 dark:ring-amber-300',
    badge: 'bg-amber-400 text-amber-950 dark:bg-amber-300',
    step: 'bg-linear-to-b from-amber-300 to-amber-500 text-amber-950 dark:from-amber-400/90 dark:to-amber-600/80',
    list: 'bg-amber-400/20 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300',
  },
  2: {
    ring: 'ring-slate-300 dark:ring-slate-400',
    badge: 'bg-slate-300 text-slate-800 dark:bg-slate-400 dark:text-slate-950',
    step: 'bg-linear-to-b from-slate-200 to-slate-400 text-slate-800 dark:from-slate-500 dark:to-slate-700 dark:text-slate-100',
    list: 'bg-slate-400/20 text-slate-700 ring-1 ring-slate-500/40 dark:text-slate-200',
  },
  3: {
    ring: 'ring-orange-400 dark:ring-orange-400',
    badge: 'bg-orange-400 text-orange-950',
    step: 'bg-linear-to-b from-orange-300 to-orange-500 text-orange-950 dark:from-orange-400/90 dark:to-orange-700/80',
    list: 'bg-orange-400/20 text-orange-700 ring-1 ring-orange-500/40 dark:text-orange-300',
  },
} as const;

type Place = keyof typeof MEDALS;

function medalFor(rank: number | null): (typeof MEDALS)[Place] | undefined {
  return rank !== null && rank in MEDALS ? MEDALS[rank as Place] : undefined;
}

function fullName(entry: LeaderboardEntry): string {
  return `${entry.employee.firstname} ${entry.employee.lastname}`;
}

function CrownIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M3 8.5 7.5 12 12 5l4.5 7L21 8.5 19.2 18H4.8L3 8.5Z" />
      <rect x="4.8" y="19" width="14.4" height="2" rx="1" />
    </svg>
  );
}

function MedalIcon({ className = '' }: { className?: string }) {
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
      <path d="M8 2.5 10.5 9M16 2.5 13.5 9" />
      <circle cx="12" cy="15" r="6" />
      <path d="m12 12.3.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 14.4l2-.3.9-1.8Z" />
    </svg>
  );
}

function EntryAvatar({ entry, className }: { entry: LeaderboardEntry; className: string }) {
  const initials =
    `${entry.employee.firstname[0] ?? ''}${entry.employee.lastname[0] ?? ''}`.toUpperCase();
  const fallback = (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400 ${className}`}
    >
      {initials}
    </span>
  );

  return entry.employee.avatarUrl ? (
    <AuthenticatedImage
      path={entry.employee.avatarUrl}
      alt=""
      className={`flex-shrink-0 rounded-full object-cover ${className}`}
      fallback={fallback}
    />
  ) : (
    fallback
  );
}

function YouBadge() {
  const { t } = useTranslation();

  return (
    <span className="flex-shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-emerald-400 dark:text-slate-950">
      {t('leaderboard.you')}
    </span>
  );
}

/**
 * Where tapping an entry goes. Everyone reaches their own plan ("My KPI"); only a
 * `full_access` user can open other employees', on the employee's KPI tab. For anyone else
 * other entries are not links.
 */
function entryLink(
  entry: LeaderboardEntry,
  data: LeaderboardResponse,
  fullAccess: boolean,
): string | null {
  if (entry.isMe && data.period) {
    return `/my-kpi?period=${data.period.label}`;
  }

  if (!fullAccess) {
    return null;
  }

  const period = data.period ? `&period=${data.period.label}` : '';

  return `/employees/${entry.employee.id}?tab=kpi${period}`;
}

/** An entry that links when it has somewhere to go, and stays plain text otherwise. */
function MaybeLink({
  to,
  className,
  children,
}: {
  to: string | null;
  className: string;
  children: ReactNode;
}) {
  return to ? (
    <Link to={to} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

// ---------------------------------------------------------------------------
// Your standing
// ---------------------------------------------------------------------------

/**
 * What stands between you and the next place up: the closest higher score in the list.
 * Null when you lead, or have no score yet.
 */
function nextPlaceUp(
  entries: LeaderboardEntry[],
  me: LeaderboardEntry,
): { rank: number; gap: number } | null {
  if (me.totalScore === null || me.rank === 1) {
    return null;
  }

  const myScore = me.totalScore;
  const above = entries.filter(
    (entry): entry is LeaderboardEntry & { totalScore: number; rank: number } =>
      entry.totalScore !== null && entry.rank !== null && entry.totalScore > myScore,
  );
  const closest = above.at(-1);

  return closest
    ? { rank: closest.rank, gap: Math.round((closest.totalScore - myScore) * 100) / 100 }
    : null;
}

function MyStanding({ me, data }: { me: LeaderboardEntry; data: LeaderboardResponse }) {
  const { t, locale } = useTranslation();
  const ranked = data.entries.filter((entry) => entry.rank !== null).length;
  const next = nextPlaceUp(data.entries, me);
  const medal = medalFor(me.rank);
  const link = data.period ? `/my-kpi?period=${data.period.label}` : '/my-kpi';

  return (
    <Link
      to={link}
      className="mb-5 block rounded-2xl border border-emerald-500/60 bg-emerald-50 p-4 transition hover:border-emerald-500 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:hover:border-emerald-400"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {t('leaderboard.myStanding')}
      </p>

      <div className="mt-2 flex items-center gap-4">
        <div
          className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl ${
            medal ? medal.badge : 'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100'
          }`}
        >
          {me.rank === null ? (
            <span className="text-2xl font-semibold">—</span>
          ) : (
            <>
              <span className="text-2xl font-bold leading-none tabular-nums">
                {formatNumber(me.rank, locale)}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                {t('leaderboard.placeShort')}
              </span>
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {me.totalScore === null ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('leaderboard.myNotCalculated')}
            </p>
          ) : (
            <>
              <p className="flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {formatNumber(me.totalScore, locale)}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t('kpiProgress.outOf', { max: formatNumber(100, locale) })}
                </span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t('leaderboard.amongCount', { count: formatNumber(ranked, locale) })}
              </p>
            </>
          )}
        </div>
      </div>

      {me.totalScore !== null ? (
        <>
          <ProgressMeter
            className="mt-3"
            value={me.totalScore}
            label={t('kpiProgress.scoreMeterLabel', { name: fullName(me) })}
            valueText={`${formatNumber(me.totalScore, locale)} ${t('kpiProgress.outOf', {
              max: formatNumber(100, locale),
            })}`}
          />
          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {next
              ? t('leaderboard.gapToNext', {
                  gap: formatNumber(next.gap, locale),
                  rank: formatNumber(next.rank, locale),
                })
              : t('leaderboard.leading')}
          </p>
        </>
      ) : null}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Podium
// ---------------------------------------------------------------------------

/** Step heights and avatar sizes; the winner stands highest and in the middle. */
const PODIUM_LAYOUT: Record<Place, { step: string; avatar: string; delay: number }> = {
  1: { step: 'h-32 sm:h-40', avatar: 'h-20 w-20 text-xl sm:h-24 sm:w-24', delay: 300 },
  2: { step: 'h-24 sm:h-28', avatar: 'h-16 w-16 text-base sm:h-20 sm:w-20', delay: 0 },
  3: { step: 'h-16 sm:h-20', avatar: 'h-16 w-16 text-base sm:h-20 sm:w-20', delay: 150 },
};

function PodiumPlace({
  entry,
  place,
  data,
  fullAccess,
}: {
  entry: LeaderboardEntry;
  place: Place;
  data: LeaderboardResponse;
  fullAccess: boolean;
}) {
  const { t, locale } = useTranslation();
  // `place` is only where the step stands (2 · 1 · 3). Medal, height and crown follow the
  // real rank, so a tie for first shows three winners, not a gold, a silver and a bronze.
  const rank = entry.rank ?? place;
  const tier: Place = rank >= 1 && rank <= PODIUM_SIZE ? (rank as Place) : place;
  const medal = MEDALS[tier];
  const layout = PODIUM_LAYOUT[tier];
  const delay: CSSProperties = { animationDelay: `${String(PODIUM_LAYOUT[place].delay)}ms` };

  return (
    <li
      className="flex min-w-0 flex-1 animate-podium-rise flex-col items-center motion-reduce:animate-none"
      style={delay}
    >
      <MaybeLink
        to={entryLink(entry, data, fullAccess)}
        className="flex w-full min-w-0 flex-col items-center rounded-2xl px-1 pb-2 pt-1 transition hover:bg-slate-100 dark:hover:bg-slate-900"
      >
        <div className="relative flex flex-col items-center">
          {tier === 1 ? (
            <>
              {/* Soft glow behind the winner. */}
              <span
                aria-hidden="true"
                className="absolute top-4 h-24 w-24 rounded-full bg-amber-400/40 blur-2xl dark:bg-amber-300/25"
              />
              <CrownIcon className="relative mb-1 h-8 w-8 animate-crown-drop text-amber-500 drop-shadow motion-reduce:animate-none dark:text-amber-300" />
            </>
          ) : (
            <span aria-hidden="true" className="h-9" />
          )}

          <span className="relative">
            <span
              className={`block rounded-full ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ${medal.ring}`}
            >
              <EntryAvatar entry={entry} className={layout.avatar} />
            </span>
            <span
              className={`absolute -bottom-2 left-1/2 flex h-7 min-w-7 -translate-x-1/2 items-center justify-center rounded-full px-1.5 text-sm font-bold tabular-nums shadow ring-2 ring-white dark:ring-slate-950 ${medal.badge}`}
            >
              {formatNumber(rank, locale)}
            </span>
          </span>
        </div>

        <span className="mt-4 flex w-full min-w-0 flex-col items-center gap-1 text-center">
          <span className="w-full truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {entry.employee.firstname}
          </span>
          <span className="-mt-1 w-full truncate text-xs text-slate-500 dark:text-slate-400">
            {entry.employee.lastname}
          </span>
          {entry.isMe ? <YouBadge /> : null}
        </span>

        <span className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
          {entry.totalScore === null ? '—' : formatNumber(entry.totalScore, locale)}
        </span>
      </MaybeLink>

      <div
        className={`flex w-full flex-col items-center justify-start rounded-t-2xl pt-2 shadow-inner ${medal.step} ${layout.step}`}
      >
        <MedalIcon className="h-6 w-6 opacity-80" />
        <span className="text-xs font-bold uppercase tracking-wide">
          {t('leaderboard.rank', { rank: formatNumber(rank, locale) })}
        </span>
      </div>
    </li>
  );
}

function Podium({
  top,
  data,
  fullAccess,
}: {
  top: LeaderboardEntry[];
  data: LeaderboardResponse;
  fullAccess: boolean;
}) {
  const { t } = useTranslation();
  // Visual order 2 · 1 · 3; missing places (fewer than three scores) are left empty.
  const slots: { place: Place; entry: LeaderboardEntry | undefined }[] = [
    { place: 2, entry: top[1] },
    { place: 1, entry: top[0] },
    { place: 3, entry: top[2] },
  ];

  return (
    <section aria-label={t('leaderboard.podium')} className="mb-6">
      <ol className="mx-auto flex max-w-xl items-end gap-2 sm:gap-4">
        {slots.map(({ place, entry }) =>
          entry ? (
            <PodiumPlace
              key={entry.assignmentId}
              entry={entry}
              place={place}
              data={data}
              fullAccess={fullAccess}
            />
          ) : (
            <li key={`empty-${String(place)}`} aria-hidden="true" className="flex-1" />
          ),
        )}
      </ol>
      <div className="mx-auto h-1.5 max-w-xl rounded-full bg-slate-200 dark:bg-slate-800" />
    </section>
  );
}

// ---------------------------------------------------------------------------
// The rest of the list
// ---------------------------------------------------------------------------

function RankBadge({ rank }: { rank: number | null }) {
  const { t, locale } = useTranslation();
  const medal = medalFor(rank);

  return (
    <span
      aria-label={rank === null ? t('leaderboard.unranked') : t('leaderboard.rank', { rank })}
      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
        medal?.list ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      {rank === null ? '—' : formatNumber(rank, locale)}
    </span>
  );
}

function EntryName({ entry }: { entry: LeaderboardEntry }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
        {fullName(entry)}
      </span>
      {entry.isMe ? <YouBadge /> : null}
    </span>
  );
}

/** Score with its bar, or why there is none; the bar never carries the number alone. */
function EntryScore({ entry, compact = false }: { entry: LeaderboardEntry; compact?: boolean }) {
  const { t, locale } = useTranslation();

  if (entry.totalScore === null) {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {t('leaderboard.notCalculated')}
      </span>
    );
  }

  const score = formatNumber(entry.totalScore, locale);

  return (
    <div className={compact ? 'w-full' : 'w-full max-w-56'}>
      <div className="flex items-baseline justify-between gap-2">
        {entry.scoredItemCount < entry.itemCount ? (
          <span className="text-[11px] text-amber-700 dark:text-amber-400">
            {t('leaderboard.scoredOf', {
              done: formatNumber(entry.scoredItemCount, locale),
              total: formatNumber(entry.itemCount, locale),
            })}
          </span>
        ) : (
          <span />
        )}
        <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {score}
        </span>
      </div>
      <ProgressMeter
        className="mt-1"
        size="sm"
        value={entry.totalScore}
        label={t('kpiProgress.scoreMeterLabel', { name: fullName(entry) })}
        valueText={`${score} ${t('kpiProgress.outOf', { max: formatNumber(100, locale) })}`}
      />
    </div>
  );
}

function RestList({
  entries,
  data,
  fullAccess,
}: {
  entries: LeaderboardEntry[];
  data: LeaderboardResponse;
  fullAccess: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* < lg: one card per plan */}
      <ol className="flex flex-col gap-2 lg:hidden">
        {entries.map((entry) => (
          <li key={entry.assignmentId}>
            <MaybeLink
              to={entryLink(entry, data, fullAccess)}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                entry.isMe
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400/60 dark:bg-emerald-400/10'
                  : 'border-slate-200 bg-white hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <RankBadge rank={entry.rank} />
              <EntryAvatar entry={entry} className="h-10 w-10 text-xs" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <EntryName entry={entry} />
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {entry.templateName}
                </span>
                <EntryScore entry={entry} compact />
              </div>
            </MaybeLink>
          </li>
        ))}
      </ol>

      {/* ≥ lg: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th scope="col" className="w-20 px-4 py-3">
                {t('leaderboard.colRank')}
              </th>
              <th scope="col" className="px-4 py-3">
                {t('leaderboard.colEmployee')}
              </th>
              <th scope="col" className="px-4 py-3">
                {t('leaderboard.colTemplate')}
              </th>
              <th scope="col" className="w-72 px-4 py-3 text-right">
                {t('leaderboard.colScore')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {entries.map((entry) => {
              const to = entryLink(entry, data, fullAccess);

              return (
                <tr
                  key={entry.assignmentId}
                  className={
                    entry.isMe
                      ? 'bg-emerald-50 dark:bg-emerald-400/10'
                      : 'bg-white dark:bg-slate-950'
                  }
                >
                  <td className="px-4 py-2">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <EntryAvatar entry={entry} className="h-10 w-10 text-xs" />
                      {to ? (
                        <Link to={to} className="min-w-0 hover:underline">
                          <EntryName entry={entry} />
                        </Link>
                      ) : (
                        <EntryName entry={entry} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                    {entry.templateName}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <EntryScore entry={entry} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FreshnessLine({ data }: { data: LeaderboardResponse }) {
  const { t, locale } = useTranslation();
  const { intervalMinutes, lastRunAt } = data.autoCalculation;
  const isOpen = data.period?.status === 'open';
  // A scheduled run that changed nothing does not touch the plans, so it is the newer signal.
  const updatedAt =
    isOpen && lastRunAt && (!data.calculatedAt || lastRunAt > data.calculatedAt)
      ? lastRunAt
      : data.calculatedAt;

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      <span
        aria-hidden="true"
        className={`h-2 w-2 flex-shrink-0 rounded-full ${
          isOpen ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
        }`}
      />
      <span>
        {isOpen
          ? intervalMinutes > 0
            ? t('leaderboard.autoEvery', { minutes: formatNumber(intervalMinutes, locale) })
            : t('leaderboard.autoOff')
          : t('leaderboard.periodClosed')}
      </span>
      {updatedAt ? (
        <span>· {t('leaderboard.updatedAt', { at: formatDateTime(updatedAt, locale) })}</span>
      ) : null}
    </p>
  );
}

/**
 * Leaderboard (ADR-047): every plan of a period ranked by its stored total score, open to
 * every signed-in employee (names and total scores only). Your own standing sits on top,
 * the first three stand on a podium, everyone else follows as a list. Period and template
 * filters live in the URL (`?period=<id>&template=<id>`).
 */
export function LeaderboardPage() {
  const { t } = useTranslation();
  const fullAccess = useAuthStore((state) => state.employee?.fullAccess ?? false);
  const [searchParams, setSearchParams] = useSearchParams();
  const periodId = searchParams.get('period') ?? undefined;
  const templateId = searchParams.get('template') ?? undefined;

  const query = useQuery({
    queryKey: ['leaderboard', periodId ?? null, templateId ?? null],
    queryFn: () => getLeaderboard({ periodId, templateId }),
    placeholderData: keepPreviousData,
    refetchInterval: (current) =>
      current.state.data?.period?.status === 'open' ? OPEN_PERIOD_REFRESH_MS : false,
  });
  const data = query.data;
  const entries = data?.entries ?? [];
  // Only scored plans earn a podium place; the list is already ranked by the API.
  const top = entries.filter((entry) => entry.rank !== null).slice(0, PODIUM_SIZE);
  const podiumIds = new Set(top.map((entry) => entry.assignmentId));
  const rest = entries.filter((entry) => !podiumIds.has(entry.assignmentId));
  const me = entries.find((entry) => entry.isMe);

  function update(next: { period?: string | undefined; template?: string | undefined }) {
    const params: Record<string, string> = {};
    const period = 'period' in next ? next.period : periodId;
    const template = 'template' in next ? next.template : templateId;

    if (period) {
      params.period = period;
    }

    if (template) {
      params.template = template;
    }

    setSearchParams(params, { replace: true });
  }

  return (
    <AppShell title={t('leaderboard.title')}>
      {data && data.periods.length > 0 ? (
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label
              htmlFor="leaderboard-period"
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              {t('leaderboard.period')}
            </label>
            <select
              id="leaderboard-period"
              value={data.period?.id ?? ''}
              // Templates differ from month to month, so a new period starts unfiltered.
              onChange={(event) => update({ period: event.target.value, template: undefined })}
              className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 sm:max-w-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {data.periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {data.templates.length > 1 ? (
            <div
              role="group"
              aria-label={t('leaderboard.templateFilter')}
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              {[{ id: undefined, name: t('leaderboard.allTemplates') }, ...data.templates].map(
                (template) => {
                  const active = templateId === template.id;

                  return (
                    <button
                      key={template.id ?? 'all'}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update({ template: template.id })}
                      className={`min-h-[44px] flex-shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
                        active
                          ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {template.name}
                    </button>
                  );
                },
              )}
            </div>
          ) : null}

          <FreshnessLine data={data} />
        </div>
      ) : null}

      {query.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('leaderboard.loading')}
        </p>
      ) : null}

      {query.isError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {t('leaderboard.errorLoading')}
        </p>
      ) : null}

      {data && entries.length === 0 && !query.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('leaderboard.empty')}
        </p>
      ) : null}

      {data && entries.length > 0 ? (
        <div
          aria-busy={query.isPlaceholderData}
          className={`transition-opacity ${query.isPlaceholderData ? 'opacity-60' : ''}`}
        >
          {me ? <MyStanding me={me} data={data} /> : null}

          {top.length > 0 ? (
            // Keyed by period and filter, so the podium rises again when either changes.
            <Podium
              key={`${data.period?.id ?? ''}-${templateId ?? ''}`}
              top={top}
              data={data}
              fullAccess={fullAccess}
            />
          ) : null}

          {rest.length > 0 ? (
            <section aria-label={t('leaderboard.others')}>
              <h2 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {t('leaderboard.others')}
              </h2>
              <RestList entries={rest} data={data} fullAccess={fullAccess} />
            </section>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
