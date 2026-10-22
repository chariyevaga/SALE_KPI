/*
  KPI mail send: n8n "Mailleri hazırla" Code düğümü (Mode: Run Once for All Items).
  ADR-063, docs/N8N.md.

  Girdi: "KPI_DB" düğümünün tek satırı, { payload: '<JSON>' } (query.sql).
  Çıktı: alıcı başına bir item, { to, subject, html, ... }. Mail düğümü her item için bir mail atar.

  Her çalışana kendi maili gider: puanı, sırası, maaşından bu dönem alacağı ve her KPI'ın
  hedefi, gerçekleşeni, maaştaki değeri ve kazandığı tutar; altta sıralama tablosu.
  Sıralama tablosunda yalnız ad, şablon ve puan vardır; başkasının maaşı, hedefi ve
  gerçekleşeni hiçbir mailde yoktur (ADR-047, ADR-049).

  Hesaplar uygulamanınkiyle aynıdır, burada yeniden yazılmıştır:
    sıralama  → apps/api/src/leaderboard/leaderboard-rules.ts (rankEntries)
    üst sıra  → apps/web/src/pages/LeaderboardPage.tsx (nextPlaceUp)
    maaş      → apps/api/src/employee-salaries/employee-salary-rules.ts (splitSalary, salaryShare)
  Onlar değişirse burası da değişir.
*/

// ---- Ayarlar -----------------------------------------------------------------
const LANGUAGE = 'ru'; // 'tr' | 'en' | 'ru' | 'tk'
const BRAND_NAME = 'Lorem';
const APP_URL = ''; // ör. 'https://kpi.sirket.tm'; boşsa "KPI'larımı aç" düğmesi çıkmaz
const TEST_RECIPIENT = ''; // doluysa bütün mailler yalnız bu adrese gider (deneme için)
const TIME_ZONE = 'Asia/Ashgabat';

// ---- Metinler ----------------------------------------------------------------
const TEXTS = {
  tr: {
    subject: 'KPI · {period} · {score} puan · {rank}. sıra',
    subjectUnranked: 'KPI · {period} · puan henüz hesaplanmadı',
    preheader: '{score} puan · {rank}. sıra · {count} kişi arasında',
    greeting: 'Merhaba {name},',
    intro: '{period} KPI sonucun. Değerler {at} hesaplamasına göredir.',
    periodOpen: 'Dönem açık: puan ve tutarlar ara sonuçtur, satış oldukça değişir.',
    periodClosed: 'Dönem kapandı; puan ve tutarlar kesin.',
    scoreTitle: 'KPI puanın',
    outOf: '/ 100',
    scoredOf: '{done}/{total} KPI puanlandı',
    rank: '{rank}. sıra',
    amongCount: '{count} kişi arasında',
    gapToNext: '{rank}. sıraya çıkmak için {gap} puan daha',
    leading: 'Zirvedesin! Böyle devam.',
    notCalculated: 'Puanın henüz hesaplanmadı.',
    salaryTitle: 'Maaş',
    payable: 'Bu dönem alınacak',
    fullSalary: 'Toplam maaş',
    since: '{month} ayından beri geçerli',
    fixedPart: 'Sabit kısım (%{percent})',
    kpiPart: 'KPI kısmı (%{percent})',
    kpiEarned: 'KPI’dan kazanılan',
    byScore: 'puan {score} üzerinden',
    kpiNotCalculated: 'KPI kısmı, puan hesaplanınca eklenecek.',
    noSalary: 'Bu ay için geçerli maaşın girilmemiş; tutarlar gösterilemiyor.',
    itemsTitle: 'KPI’ların: ne için ne kazandın?',
    stores: 'Mağazalar',
    groups: 'Gruplar',
    weight: 'Ağırlık %{value}',
    target: 'Hedef',
    actual: 'Gerçekleşen',
    achievement: 'Gerçekleşme',
    points: 'Puan katkısı',
    itemValue: 'Maaştaki değeri',
    itemEarned: 'Kazanılan',
    remaining: 'Hedefe kalan: {value}',
    exceeded: 'Hedef aşıldı; puana en çok %100 ile girer.',
    noTarget: 'Hedef henüz girilmedi; puanlanmadı.',
    noActual: 'Gerçekleşen henüz yok; puanlanmadı.',
    conversionResult:
      'Sayısı girilen {counted} günde {receipts} satış fişi ÷ {visitors} kişi (kapsama %{coverage}).',
    lowCoverage:
      'Ziyaretçi sayısı günlerin yalnız %{coverage}’inde girildi; puanlanmak için en az %{required} gerekir.',
    noVisitors: 'Sayılan günlerin hepsinde giren kişi 0 girildi; oran hesaplanamaz.',
    noDays: 'Henüz hesaba girecek gün yok: yalnız bugünden önceki günler sayılır.',
    leaderboardTitle: 'Sıralama tablosu',
    leaderboardSubtitle: '{period} · {count} kişi',
    you: 'Sen',
    notScoredShort: 'hesaplanmadı',
    howTitle: 'Nasıl hesaplanır?',
    howText:
      'Her KPI puana, hedefe göre gerçekleşmesiyle (en çok %100) ve ağırlığı kadar girer; toplamı KPI puanındır (0–100). KPI’dan kazanılan = KPI kısmı × puan / 100; bu dönem alınacak = sabit kısım + KPI’dan kazanılan.',
    footer:
      'Bu mail her akşam otomatik gönderilir. Güncel değerler uygulamada “KPI’larım” ekranındadır.',
    openApp: 'KPI’larımı aç',
  },
  en: {
    subject: 'KPI · {period} · {score} points · rank {rank}',
    subjectUnranked: 'KPI · {period} · score not calculated yet',
    preheader: '{score} points · rank {rank} of {count}',
    greeting: 'Hi {name},',
    intro: 'Your KPI result for {period}, as calculated at {at}.',
    periodOpen: 'The period is open: score and amounts are provisional and change with sales.',
    periodClosed: 'The period is closed; score and amounts are final.',
    scoreTitle: 'Your KPI score',
    outOf: '/ 100',
    scoredOf: '{done}/{total} KPIs scored',
    rank: 'Rank {rank}',
    amongCount: 'out of {count}',
    gapToNext: '{gap} more points to reach rank {rank}',
    leading: 'You are on top! Keep it up.',
    notCalculated: 'Your score has not been calculated yet.',
    salaryTitle: 'Salary',
    payable: 'Payable this period',
    fullSalary: 'Full salary',
    since: 'In force since {month}',
    fixedPart: 'Fixed part ({percent}%)',
    kpiPart: 'KPI part ({percent}%)',
    kpiEarned: 'Earned from KPI',
    byScore: 'at score {score}',
    kpiNotCalculated: 'The KPI part is added once the score is calculated.',
    noSalary: 'No salary is in force for this month, so amounts cannot be shown.',
    itemsTitle: 'Your KPIs: what you earned and why',
    stores: 'Stores',
    groups: 'Groups',
    weight: 'Weight {value}%',
    target: 'Target',
    actual: 'Actual',
    achievement: 'Achievement',
    points: 'Score points',
    itemValue: 'Worth in salary',
    itemEarned: 'Earned',
    remaining: 'Left to target: {value}',
    exceeded: 'Target exceeded; it counts with at most 100%.',
    noTarget: 'No target yet; not scored.',
    noActual: 'No actual value yet; not scored.',
    conversionResult:
      '{receipts} sales receipts ÷ {visitors} visitors on {counted} counted days (coverage {coverage}%).',
    lowCoverage:
      'Visitor counts cover only {coverage}% of the days; at least {required}% is needed to be scored.',
    noVisitors: 'Every counted day has 0 visitors, so there is no rate.',
    noDays: 'No day to count yet: only days before today count.',
    leaderboardTitle: 'Leaderboard',
    leaderboardSubtitle: '{period} · {count} people',
    you: 'You',
    notScoredShort: 'not calculated',
    howTitle: 'How is it calculated?',
    howText:
      'Each KPI adds its achievement against the target (at most 100%) times its weight; the sum is your KPI score (0–100). Earned from KPI = KPI part × score / 100; payable = fixed part + earned from KPI.',
    footer:
      'This email is sent automatically every evening. Current values are on the “My KPIs” screen in the app.',
    openApp: 'Open my KPIs',
  },
  ru: {
    subject: 'KPI · {period} · {score} б. · {rank}-е место',
    subjectUnranked: 'KPI · {period} · балл ещё не рассчитан',
    preheader: '{score} б. · {rank}-е место из {count}',
    greeting: 'Здравствуйте, {name}!',
    intro: 'Ваш результат KPI за период «{period}». Значения на момент расчёта {at}.',
    periodOpen: 'Период открыт: балл и суммы предварительные и меняются вместе с продажами.',
    periodClosed: 'Период закрыт; балл и суммы окончательные.',
    scoreTitle: 'Ваш балл KPI',
    outOf: '/ 100',
    scoredOf: 'Оценено KPI: {done}/{total}',
    rank: '{rank}-е место',
    amongCount: 'из {count} человек',
    gapToNext: 'Ещё {gap} балла до {rank}-го места',
    leading: 'Вы на первом месте! Так держать.',
    notCalculated: 'Ваш балл ещё не рассчитан.',
    salaryTitle: 'Зарплата',
    payable: 'К выплате за период',
    fullSalary: 'Полная зарплата',
    since: 'Действует с {month}',
    fixedPart: 'Фиксированная часть ({percent}%)',
    kpiPart: 'Часть KPI ({percent}%)',
    kpiEarned: 'Заработано по KPI',
    byScore: 'при балле {score}',
    kpiNotCalculated: 'Часть KPI добавится после расчёта балла.',
    noSalary: 'Зарплата на этот месяц не введена, поэтому суммы не показаны.',
    itemsTitle: 'Ваши KPI: за что и сколько заработано',
    stores: 'Магазины',
    groups: 'Группы',
    weight: 'Вес {value}%',
    target: 'Цель',
    actual: 'Факт',
    achievement: 'Выполнение',
    points: 'Баллы',
    itemValue: 'Доля в зарплате',
    itemEarned: 'Заработано',
    remaining: 'До цели осталось: {value}',
    exceeded: 'Цель перевыполнена; в зачёт идёт не более 100%.',
    noTarget: 'Цель ещё не задана; не оценено.',
    noActual: 'Факта пока нет; не оценено.',
    conversionResult:
      '{receipts} чеков продаж ÷ {visitors} посетителей за {counted} учтённых дней (охват {coverage}%).',
    lowCoverage:
      'Число посетителей введено только за {coverage}% дней; для оценки нужно минимум {required}%.',
    noVisitors: 'Во всех учтённых днях 0 посетителей; конверсию рассчитать нельзя.',
    noDays: 'Пока нет дней для расчёта: учитываются только дни до сегодняшнего.',
    leaderboardTitle: 'Рейтинг',
    leaderboardSubtitle: '{period} · {count} чел.',
    you: 'Вы',
    notScoredShort: 'не рассчитан',
    howTitle: 'Как рассчитывается?',
    howText:
      'Каждый KPI даёт выполнение цели (не более 100%), умноженное на его вес; сумма — ваш балл KPI (0–100). Заработано по KPI = часть KPI × балл / 100; к выплате = фиксированная часть + заработано по KPI.',
    footer:
      'Это письмо отправляется автоматически каждый вечер. Актуальные значения — на экране «Мои KPI» в приложении.',
    openApp: 'Открыть мои KPI',
  },
  tk: {
    subject: 'KPI · {period} · {score} bal · {rank}-nji orun',
    subjectUnranked: 'KPI · {period} · bal entek hasaplanmady',
    preheader: '{score} bal · {count} adamyň arasynda {rank}-nji orun',
    greeting: 'Salam, {name}!',
    intro: '{period} KPI netijäňiz. Bahalar {at} hasaplamasyna görädir.',
    periodOpen: 'Döwür açyk: bal we mukdarlar aralyk netijedir, satuw boldugyça üýtgeýär.',
    periodClosed: 'Döwür ýapyldy; bal we mukdarlar gutarnykly.',
    scoreTitle: 'KPI balyňyz',
    outOf: '/ 100',
    scoredOf: '{done}/{total} KPI bahalandyryldy',
    rank: '{rank}-nji orun',
    amongCount: '{count} adamyň arasynda',
    gapToNext: '{rank}-nji orna çykmak üçin ýene {gap} bal',
    leading: 'Siz birinji! Şeýle dowam ediň.',
    notCalculated: 'Balyňyz entek hasaplanmady.',
    salaryTitle: 'Aýlyk',
    payable: 'Bu döwür üçin alynjak',
    fullSalary: 'Doly aýlyk',
    since: '{month} aýyndan bäri güýjünde',
    fixedPart: 'Hemişelik bölek (%{percent})',
    kpiPart: 'KPI bölegi (%{percent})',
    kpiEarned: 'KPI-dan gazanylan',
    byScore: '{score} bal boýunça',
    kpiNotCalculated: 'KPI bölegi bal hasaplanandan soň goşular.',
    noSalary: 'Bu aý üçin güýjündäki aýlygyňyz girizilmedik; mukdarlar görkezilip bilmeýär.',
    itemsTitle: 'KPI-laryňyz: näme üçin näçe gazandyňyz?',
    stores: 'Dükanlar',
    groups: 'Toparlar',
    weight: 'Agramy %{value}',
    target: 'Maksat',
    actual: 'Ýerine ýetirilen',
    achievement: 'Ýerine ýetiriliş',
    points: 'Baha goşandy',
    itemValue: 'Aýlykdaky gymmaty',
    itemEarned: 'Gazanylan',
    remaining: 'Maksada galan: {value}',
    exceeded: 'Maksatdan geçildi; bala iň köp %100 bilen girýär.',
    noTarget: 'Maksat entek girizilmedi; bahalandyrylmady.',
    noActual: 'Ýerine ýetirilen entek ýok; bahalandyrylmady.',
    conversionResult:
      'San girizilen {counted} günde {receipts} satuw çegi ÷ {visitors} adam (gurşaw %{coverage}).',
    lowCoverage:
      'Gelen adam sany günleriň diňe %{coverage}-inde girizildi; bahalandyrylmak üçin azyndan %{required} gerek.',
    noVisitors: 'Hasaba alnan günleriň hemmesinde giren adam 0; gatnaşygy hasaplap bolmaýar.',
    noDays: 'Entek hasaba girjek gün ýok: diňe şu günden öňki günler hasaba alynýar.',
    leaderboardTitle: 'Reýting tablisasy',
    leaderboardSubtitle: '{period} · {count} adam',
    you: 'Siz',
    notScoredShort: 'hasaplanmady',
    howTitle: 'Nähili hasaplanýar?',
    howText:
      'Her KPI bala maksada görä ýerine ýetirilişi (iň köp %100) bilen we agramy möçberinde girýär; jemi KPI balyňyzdyr (0–100). KPI-dan gazanylan = KPI bölegi × bal / 100; alynjak = hemişelik bölek + KPI-dan gazanylan.',
    footer:
      'Bu hat her agşam awtomatik iberilýär. Häzirki bahalar programmanyň “Meniň KPI-larym” ekranynda.',
    openApp: 'KPI-larymy aç',
  },
};

const LOCALE_TAGS = { tr: 'tr-TR', en: 'en-US', ru: 'ru-RU', tk: 'tk-TM' };
const language = TEXTS[LANGUAGE] ? LANGUAGE : 'tr';
const LOCALE = LOCALE_TAGS[language];
const TEXT = TEXTS[language];

// ---- Renkler ve yazı (mail istemcileri için satır içi stil) ----------------------
const C = {
  page: '#f3f4f6',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  muted: '#6b7280',
  track: '#e5e7eb',
  brand: '#111111',
  gold: '#d4af37',
  green: '#15803d',
  greenBar: '#16a34a',
  greenSoft: '#ecfdf5',
  greenLine: '#6ee7b7',
  amber: '#b45309',
  amberSoft: '#fffbeb',
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// ---- Giriş ----------------------------------------------------------------------
const raw = $input.first()?.json?.payload;

if (!raw) {
  return [];
}

const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
const period = data.period;
const plans = (data.plans ?? []).filter((plan) => plan.employee);
const periodLabel = formatMonth(period.year, period.month);
const isOpen = period.status === 'open';
const ranked = rankEntries(plans);
const rankedCount = ranked.filter((entry) => entry.rank !== null).length;
const calculatedAt = latest(plans.map((plan) => plan.scoreCalculatedAt));
const calculatedAtText = formatDateTime(calculatedAt ?? data.generatedAt);
const output = [];

for (const me of ranked) {
  const email = (me.employee.email ?? '').trim();

  if (!me.employee.isActive || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    continue;
  }

  const name = `${me.employee.firstname} ${me.employee.lastname}`.trim();
  const subject = subjectFor(me);

  output.push({
    json: {
      to: TEST_RECIPIENT || email,
      subject: TEST_RECIPIENT ? `[TEST → ${name}] ${subject}` : subject,
      html: buildMail(me),
      employeeId: me.employee.id,
      employeeName: name,
      period: `${period.year}-${pad(period.month)}`,
      totalScore: me.totalScore,
      rank: me.rank,
    },
  });
}

return output;

// ---- Sıralama (leaderboard-rules.ts ile aynı) --------------------------------------

/** Puana göre, büyükten küçüğe; eşit puan aynı sırayı alır ("1, 2, 2, 4"), puanı olmayan sırasızdır. */
function rankEntries(entries) {
  const sorted = [...entries].sort((left, right) => {
    if (left.totalScore !== right.totalScore) {
      if (left.totalScore === null) return 1;
      if (right.totalScore === null) return -1;
      return right.totalScore - left.totalScore;
    }

    return (
      left.employee.firstname.localeCompare(right.employee.firstname) ||
      left.employee.lastname.localeCompare(right.employee.lastname)
    );
  });
  let previousScore = null;
  let previousRank = 0;

  return sorted.map((entry, index) => {
    if (entry.totalScore === null) {
      return { ...entry, rank: null };
    }

    const rank = entry.totalScore === previousScore ? previousRank : index + 1;

    previousScore = entry.totalScore;
    previousRank = rank;

    return { ...entry, rank };
  });
}

/** Bir üst sıra ve oraya kaç puan kaldığı; zirvedeyse null (LeaderboardPage.tsx nextPlaceUp). */
function nextPlaceUp(me) {
  if (me.totalScore === null || me.rank === 1) {
    return null;
  }

  const above = ranked.filter((entry) => entry.rank !== null && entry.totalScore > me.totalScore);
  const closest = above[above.length - 1];

  return closest
    ? { rank: closest.rank, gap: Math.round((closest.totalScore - me.totalScore) * 100) / 100 }
    : null;
}

// ---- Maaş (employee-salary-rules.ts ile aynı) --------------------------------------

/** Sabit ve KPI kısmı; KPI kısmı kalandır, ikisi her zaman maaşı verir. */
function splitSalary(amount, fixedPercent) {
  const fixedAmount = Math.round(amount * fixedPercent) / 100;

  return { fixedAmount, kpiAmount: Math.round((amount - fixedAmount) * 100) / 100 };
}

/** KPI kısmının `points` (0–100) puanla kazanılan payı. */
function salaryShare(kpiAmount, points) {
  return Math.round(kpiAmount * points) / 100;
}

function payoutOf(plan) {
  const salary = plan.salary;

  if (!salary) {
    return null;
  }

  const { fixedAmount, kpiAmount } = splitSalary(salary.amount, salary.fixedPercent);
  const kpiEarned = plan.totalScore === null ? null : salaryShare(kpiAmount, plan.totalScore);

  return {
    ...salary,
    fixedAmount,
    kpiAmount,
    kpiEarned,
    totalEarned: kpiEarned === null ? null : Math.round((fixedAmount + kpiEarned) * 100) / 100,
  };
}

// ---- Mail -------------------------------------------------------------------------

function subjectFor(me) {
  const prefix = BRAND_NAME ? `${BRAND_NAME} ` : '';

  return me.rank === null
    ? prefix + t('subjectUnranked', { period: periodLabel })
    : prefix + t('subject', { period: periodLabel, score: score(me.totalScore), rank: me.rank });
}

function buildMail(me) {
  const payout = payoutOf(me);
  // Gelen kutusundaki önizleme satırı: alınacak tutar (yalnız kişinin kendi maaşı), puan ve sıra.
  const preheader = [
    payout && payout.totalEarned !== null
      ? `${t('payable')}: ${money(payout.totalEarned, payout.currency)}`
      : '',
    me.rank === null
      ? t('notCalculated')
      : t('preheader', { score: score(me.totalScore), rank: me.rank, count: rankedCount }),
  ]
    .filter(Boolean)
    .join(' · ');
  const sections = [
    headerSection(),
    card(introBlock(me)),
    // Önce sıralama tablosu, sonra kişinin kendi puanı, maaşı ve KPI tutarları.
    card(leaderboardBlock(me)),
    card(scoreBlock(me)),
    card(salaryBlock(payout, me)),
    card(itemsBlock(me, payout)),
    card(howBlock()),
    footerSection(),
  ];

  return (
    `<!doctype html><html lang="${language}"><head><meta charset="utf-8">` +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">' +
    `<title>${esc(subjectFor(me))}</title></head>` +
    `<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">` +
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">` +
    '<tr><td align="center" style="padding:16px 8px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">' +
    sections.join('') +
    '</table></td></tr></table></body></html>'
  );
}

function headerSection() {
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.brand};border-radius:12px;">` +
      '<tr>' +
      `<td style="padding:16px;font-family:${FONT};color:${C.gold};font-size:20px;font-weight:700;letter-spacing:0.5px;">` +
      `${esc(BRAND_NAME)} <span style="color:#ffffff;font-weight:400;font-size:14px;">KPI</span></td>` +
      `<td align="right" style="padding:16px;font-family:${FONT};color:#ffffff;font-size:14px;white-space:nowrap;">${esc(periodLabel)}</td>` +
      '</tr></table>',
  );
}

function introBlock(me) {
  return (
    text(t('greeting', { name: me.employee.firstname }), 'font-size:17px;font-weight:600;') +
    text(
      t('intro', { period: periodLabel, at: calculatedAtText }),
      `margin-top:6px;color:${C.muted};font-size:14px;`,
    ) +
    chip(
      isOpen ? t('periodOpen') : t('periodClosed'),
      isOpen ? C.amber : C.green,
      isOpen ? C.amberSoft : C.greenSoft,
    )
  );
}

function scoreBlock(me) {
  const items = me.items ?? [];
  const scored = items.filter((item) => item.weightedScore !== null).length;

  if (me.totalScore === null) {
    return (
      text(t('scoreTitle'), labelStyle()) +
      text(t('notCalculated'), 'margin-top:8px;font-size:15px;')
    );
  }

  const next = nextPlaceUp(me);

  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    `<td valign="top" style="font-family:${FONT};">` +
    text(t('scoreTitle'), labelStyle()) +
    `<div style="font-family:${FONT};color:${C.text};font-size:40px;font-weight:700;line-height:1.15;">${esc(score(me.totalScore))}` +
    ` <span style="font-size:16px;font-weight:400;color:${C.muted};">${esc(t('outOf'))}</span></div>` +
    '</td>' +
    `<td valign="top" align="right" style="font-family:${FONT};white-space:nowrap;">` +
    `<div style="display:inline-block;background:${C.greenSoft};border:1px solid ${C.greenLine};border-radius:10px;padding:8px 12px;text-align:center;">` +
    `<div style="font-size:18px;font-weight:700;color:${C.green};line-height:1.2;">${esc(`${medal(me.rank)} ${t('rank', { rank: me.rank })}`.trim())}</div>` +
    `<div style="font-size:12px;color:${C.green};">${esc(t('amongCount', { count: rankedCount }))}</div>` +
    '</div></td></tr></table>' +
    `<div style="margin-top:10px;">${bar(me.totalScore, C.greenBar)}</div>` +
    text(
      t('scoredOf', { done: scored, total: items.length }),
      `margin-top:6px;color:${C.muted};font-size:12px;`,
    ) +
    text(
      next ? t('gapToNext', { gap: score(next.gap), rank: next.rank }) : t('leading'),
      'margin-top:10px;font-size:14px;font-weight:600;',
    )
  );
}

function salaryBlock(payout, me) {
  if (!payout) {
    return (
      text(t('salaryTitle'), labelStyle()) +
      text(t('noSalary'), `margin-top:6px;font-size:14px;color:${C.muted};`)
    );
  }

  const currency = payout.currency;
  const lines = [
    [
      t('fullSalary'),
      t('since', { month: formatMonthKey(payout.effectiveMonth) }),
      money(payout.amount, currency),
      '',
    ],
    [
      t('fixedPart', { percent: number(payout.fixedPercent) }),
      '',
      money(payout.fixedAmount, currency),
      '',
    ],
    [
      t('kpiPart', { percent: number(payout.kpiPercent) }),
      '',
      money(payout.kpiAmount, currency),
      '',
    ],
  ];

  if (payout.kpiEarned !== null) {
    lines.push([
      t('kpiEarned'),
      t('byScore', { score: score(me.totalScore) }),
      money(payout.kpiEarned, currency),
      `color:${C.green};font-weight:700;`,
    ]);
  }

  return (
    text(t('salaryTitle'), labelStyle()) +
    text(t('payable'), `margin-top:6px;font-size:14px;color:${C.muted};`) +
    `<div style="font-family:${FONT};font-size:30px;font-weight:700;color:${C.text};line-height:1.2;">` +
    `${esc(money(payout.totalEarned ?? payout.fixedAmount, currency))}</div>` +
    (payout.kpiEarned === null
      ? text(t('kpiNotCalculated'), `margin-top:4px;font-size:13px;color:${C.amber};`)
      : '') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">' +
    lines
      .map(
        ([label, hint, value, valueStyle], index) =>
          `<tr><td style="font-family:${FONT};font-size:14px;color:${C.text};padding:8px 0;${index ? `border-top:1px solid ${C.border};` : ''}">` +
          `${esc(label)}${hint ? `<div style="font-size:12px;color:${C.muted};">${esc(hint)}</div>` : ''}</td>` +
          `<td align="right" valign="top" style="font-family:${FONT};font-size:14px;white-space:nowrap;padding:8px 0 8px 12px;${index ? `border-top:1px solid ${C.border};` : ''}${valueStyle}">${esc(value)}</td></tr>`,
      )
      .join('') +
    '</table>'
  );
}

function itemsBlock(me, payout) {
  const items = me.items ?? [];

  return (
    text(t('itemsTitle'), 'font-size:16px;font-weight:700;') +
    items.map((item) => itemCard(item, payout)).join('')
  );
}

function itemCard(item, payout) {
  const unit = unitOf(item);
  const scored = item.weightedScore !== null;
  const kpiAmount = payout ? payout.kpiAmount : null;
  const value = kpiAmount === null ? null : salaryShare(kpiAmount, item.weight);
  const earned = kpiAmount === null || !scored ? null : salaryShare(kpiAmount, item.weightedScore);
  const scope = [];

  if (item.stores?.length) {
    scope.push(`${t('stores')}: ${item.stores.map((store) => store.name || store.nr).join(', ')}`);
  }

  if (item.inputs?.groupCodes?.length) {
    scope.push(`${t('groups')}: ${item.inputs.groupCodes.join(', ')}`);
  }

  scope.push(t('weight', { value: number(item.weight) }));

  const rows = [
    [t('target'), hasTarget(item) ? measure(item.target, unit) : '—', ''],
    [t('actual'), item.actual === null ? '—' : measure(item.actual, unit), ''],
  ];

  if (item.rawAchievement !== null) {
    rows.push([t('achievement'), percent(item.rawAchievement), '']);
  }

  rows.push([
    t('points'),
    `${scored ? score(item.weightedScore) : '—'} / ${score(item.weight)}`,
    '',
  ]);

  if (value !== null) {
    rows.push([t('itemValue'), money(value, payout.currency), '']);
    rows.push([
      t('itemEarned'),
      earned === null ? '—' : money(earned, payout.currency),
      `color:${C.green};font-weight:700;`,
    ]);
  }

  const headline =
    earned !== null ? money(earned, payout.currency) : scored ? score(item.weightedScore) : '';

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;border:1px solid ${C.border};border-radius:10px;">` +
    `<tr><td style="padding:12px;font-family:${FONT};">` +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    `<td style="font-family:${FONT};font-size:15px;font-weight:600;color:${C.text};">${esc(localized(item.name))}</td>` +
    (headline
      ? `<td align="right" valign="top" style="font-family:${FONT};font-size:15px;font-weight:700;color:${C.green};white-space:nowrap;padding-left:8px;">${esc(headline)}</td>`
      : '') +
    '</tr></table>' +
    text(scope.join(' · '), `margin-top:2px;font-size:12px;color:${C.muted};`) +
    `<div style="margin-top:10px;">${bar(item.cappedAchievement ?? 0, (item.cappedAchievement ?? 0) >= 100 ? C.greenBar : C.gold)}</div>` +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">' +
    rows
      .map(
        ([label, cell, style]) =>
          `<tr><td style="font-family:${FONT};font-size:13px;color:${C.muted};padding:3px 0;">${esc(label)}</td>` +
          `<td align="right" style="font-family:${FONT};font-size:13px;color:${C.text};padding:3px 0;white-space:nowrap;${style}">${esc(cell)}</td></tr>`,
      )
      .join('') +
    '</table>' +
    itemNotes(item, unit) +
    '</td></tr></table>'
  );
}

/** Puanlanmama nedeni, dönüşümün nasıl hesaplandığı, hedefe kalan ya da hedefin aşıldığı. */
function itemNotes(item, unit) {
  const notes = [];
  const detail = item.detail;

  if (!hasTarget(item)) {
    notes.push(t('noTarget'));
  } else if (detail && detail.gap) {
    notes.push(
      detail.gap === 'low-coverage'
        ? t('lowCoverage', {
            coverage: number(detail.coverage),
            required: number(detail.requiredCoverage),
          })
        : t(detail.gap === 'no-visitors' ? 'noVisitors' : 'noDays'),
    );
  } else if (item.actual === null) {
    notes.push(t('noActual'));
  } else {
    if (detail && detail.visitors) {
      notes.push(
        t('conversionResult', {
          counted: number(detail.countedDays),
          receipts: number(detail.receipts),
          visitors: number(detail.visitors),
          coverage: number(detail.coverage),
        }),
      );
    }

    if (item.actual < item.target) {
      notes.push(t('remaining', { value: measure(item.target - item.actual, unit) }));
    } else if (item.rawAchievement !== null && item.rawAchievement > 100) {
      notes.push(t('exceeded'));
    }
  }

  return notes
    .map((note) => text(note, `margin-top:6px;font-size:12px;color:${C.muted};`))
    .join('');
}

function leaderboardBlock(me) {
  const rows = ranked
    .map((entry) => {
      const isMe = entry.id === me.id;
      const background = isMe ? `background:${C.greenSoft};` : '';
      const name = `${entry.employee.firstname} ${entry.employee.lastname}`;
      const place = entry.rank === null ? '–' : medal(entry.rank) || `${number(entry.rank)}.`;

      return (
        `<tr style="${background}">` +
        `<td width="44" align="center" style="font-family:${FONT};font-size:${medal(entry.rank) ? 20 : 14}px;font-weight:700;color:${C.text};padding:8px 4px;border-top:1px solid ${C.border};">${esc(place)}</td>` +
        `<td style="font-family:${FONT};font-size:14px;color:${C.text};padding:8px 4px;border-top:1px solid ${C.border};">` +
        `<span style="${isMe ? 'font-weight:700;' : ''}">${esc(name)}</span>` +
        (isMe
          ? ` <span style="font-size:11px;font-weight:700;color:${C.green};text-transform:uppercase;">${esc(t('you'))}</span>`
          : '') +
        `<div style="font-size:12px;color:${C.muted};">${esc(entry.templateName)}</div></td>` +
        `<td align="right" style="font-family:${FONT};font-size:${entry.totalScore === null ? 12 : 15}px;font-weight:700;white-space:nowrap;padding:8px 4px 8px 8px;border-top:1px solid ${C.border};color:${entry.totalScore === null ? C.muted : C.text};">` +
        `${esc(entry.totalScore === null ? t('notScoredShort') : score(entry.totalScore))}</td>` +
        '</tr>'
      );
    })
    .join('');

  return (
    text(t('leaderboardTitle'), 'font-size:16px;font-weight:700;') +
    text(
      t('leaderboardSubtitle', { period: periodLabel, count: ranked.length }),
      `margin-top:2px;font-size:12px;color:${C.muted};`,
    ) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;border-collapse:collapse;">${rows}</table>`
  );
}

function howBlock() {
  return (
    text(t('howTitle'), 'font-size:14px;font-weight:700;') +
    text(t('howText'), `margin-top:4px;font-size:13px;color:${C.muted};line-height:1.5;`)
  );
}

function footerSection() {
  const button = APP_URL
    ? `<a href="${esc(`${APP_URL.replace(/\/+$/, '')}/my-kpi`)}" style="display:inline-block;background:${C.brand};color:#ffffff;font-family:${FONT};font-size:15px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:10px;">${esc(t('openApp'))}</a>`
    : '';

  return row(
    `<div style="text-align:center;padding:4px 8px 16px;">${button}` +
      text(
        t('footer'),
        `margin-top:${button ? 14 : 0}px;font-size:12px;color:${C.muted};text-align:center;`,
      ) +
      '</div>',
  );
}

// ---- HTML yardımcıları --------------------------------------------------------------

function row(html) {
  return `<tr><td style="padding:0 0 12px 0;">${html}</td></tr>`;
}

function card(html) {
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.card};border:1px solid ${C.border};border-radius:12px;">` +
      `<tr><td style="padding:16px;font-family:${FONT};color:${C.text};">${html}</td></tr></table>`,
  );
}

function text(value, style) {
  return `<div style="font-family:${FONT};color:${C.text};${style}">${esc(value)}</div>`;
}

function labelStyle() {
  return `font-size:12px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:0.5px;`;
}

function chip(value, color, background) {
  return (
    `<div style="margin-top:12px;font-family:${FONT};font-size:13px;color:${color};background:${background};` +
    `border:1px solid ${color};border-radius:8px;padding:8px 10px;">${esc(value)}</div>`
  );
}

/** Yatay çubuk; genişlik 0–100 arası yüzde. */
function bar(value, color) {
  const width = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const cell = (background, cellWidth) =>
    `<td${cellWidth ? ` width="${cellWidth}%"` : ''} style="background:${background};height:8px;line-height:8px;font-size:0;mso-line-height-rule:exactly;">&nbsp;</td>`;

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:4px;background:${C.track};"><tr>` +
    (width > 0 ? cell(color, width) : '') +
    (width < 100 ? cell(C.track) : '') +
    '</tr></table>'
  );
}

function medal(rank) {
  return { 1: '🥇', 2: '🥈', 3: '🥉' }[rank] ?? '';
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function t(key, values = {}) {
  return (TEXT[key] ?? TEXTS.tr[key] ?? key).replace(/\{(\w+)\}/g, (_, name) =>
    name in values
      ? typeof values[name] === 'number'
        ? number(values[name])
        : String(values[name])
      : '',
  );
}

// ---- Biçimler -------------------------------------------------------------------------

function localized(name) {
  return (name && (name[language] || name.tr)) || '';
}

/** Para KPI'ının birimi satırın girdisindeki para birimidir; yüzde KPI'ı `%`. */
function unitOf(item) {
  if (item.unit === 'money') return item.inputs?.currency ?? '';
  if (item.unit === 'percent') return '%';
  return '';
}

function hasTarget(item) {
  return item.target !== null && item.target !== 0;
}

function measure(value, unit) {
  if (unit === '%') return percent(value);
  if (unit) return money(value, unit);
  return number(value);
}

function number(value, options = {}) {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2, ...options }).format(value);
}

function score(value) {
  return number(value);
}

function money(value, currency) {
  return `${number(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/** 87.5 → "%87,5" (tr) / "87.5%" (en); dilin yüzde yazımıyla. */
function percent(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1 }).format(
    value / 100,
  );
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatMonth(year, month) {
  const label = new Intl.DateTimeFormat(LOCALE, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  return label.charAt(0).toLocaleUpperCase(LOCALE) + label.slice(1);
}

/** `2026-09` → "Eylül 2026". */
function formatMonthKey(value) {
  const [year, month] = String(value).split('-').map(Number);

  return formatMonth(year, month);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: TIME_ZONE,
  }).format(new Date(value));
}

function latest(values) {
  return values.reduce(
    (newest, value) => (value && (!newest || new Date(value) > new Date(newest)) ? value : newest),
    null,
  );
}
