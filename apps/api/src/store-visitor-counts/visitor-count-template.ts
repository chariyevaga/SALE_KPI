import writeXlsxFile, { type Row, type SheetData } from 'write-excel-file/node';

/** Languages of the web client; the template speaks the user's language. */
export const TEMPLATE_LANGUAGES = ['tr', 'en', 'ru', 'tk'] as const;

export type TemplateLanguage = (typeof TEMPLATE_LANGUAGES)[number];

interface TemplateLabels {
  countsSheet: string;
  storesSheet: string;
  helpSheet: string;
  date: string;
  storeNr: string;
  store: string;
  count: string;
  help: string[];
}

const LABELS: Record<TemplateLanguage, TemplateLabels> = {
  tr: {
    countsSheet: 'Ziyaretçi sayıları',
    storesSheet: 'İş yerleri',
    helpSheet: 'Açıklama',
    date: 'Tarih',
    storeNr: 'İş yeri no',
    store: 'İş yeri',
    count: 'Ziyaretçi sayısı',
    help: [
      'Ziyaretçi sayılarını “Ziyaretçi sayıları” sayfasının D sütununa yazın, sonra dosyayı uygulamadaki “Excel’den yükle” ile yükleyin.',
      'D sütunu boş bırakılan satır okunmaz; o gün için kayıtlı sayı varsa değişmez.',
      'Aynı iş yeri ve gün için sayı zaten varsa yüklenen sayı eskisinin yerine geçer; değişiklik kayıt izine “Excel’den” diye yazılır.',
      '0 geçerli bir sayıdır: o gün kimse gelmedi ya da mağaza kapalıydı.',
      'Yeni satır ekleyebilirsiniz: A sütununa tarih (gg.aa.yyyy), B sütununa iş yeri numarası. Numaralar “İş yerleri” sayfasındadır. C sütunu yalnız bilgi içindir.',
      'Gelecekteki günler ve kapatılmış KPI dönemleri yüklenemez. Bir satır bile hatalıysa hiçbir satır yazılmaz; hatalı satırlar numaralarıyla gösterilir.',
    ],
  },
  en: {
    countsSheet: 'Visitor counts',
    storesSheet: 'Stores',
    helpSheet: 'Instructions',
    date: 'Date',
    storeNr: 'Store no',
    store: 'Store',
    count: 'Visitor count',
    help: [
      'Type the visitor counts in column D of the “Visitor counts” sheet, then upload the file with “Import from Excel” in the app.',
      'A row whose column D is empty is not read; a count already saved for that day stays as it is.',
      'When the store and day already have a count, the uploaded number replaces it; the change is logged as “from Excel”.',
      '0 is a valid count: nobody came in, or the store was closed.',
      'You can add rows: a date in column A (dd.mm.yyyy) and the store number in column B. The numbers are on the “Stores” sheet. Column C is for information only.',
      'Future days and closed KPI periods cannot be uploaded. If any row is wrong nothing is saved; the wrong rows are listed by number.',
    ],
  },
  ru: {
    countsSheet: 'Число посетителей',
    storesSheet: 'Магазины',
    helpSheet: 'Инструкция',
    date: 'Дата',
    storeNr: '№ магазина',
    store: 'Магазин',
    count: 'Число посетителей',
    help: [
      'Впишите число посетителей в столбец D листа «Число посетителей» и загрузите файл кнопкой «Загрузить из Excel» в приложении.',
      'Строка с пустым столбцом D не читается; уже сохранённое число за этот день не меняется.',
      'Если за этот магазин и день число уже есть, загруженное число заменяет его; изменение записывается в историю как «из Excel».',
      '0 — допустимое число: никто не пришёл или магазин был закрыт.',
      'Можно добавлять строки: дата в столбце A (дд.мм.гггг), номер магазина в столбце B. Номера — на листе «Магазины». Столбец C только для справки.',
      'Будущие дни и закрытые KPI-периоды загрузить нельзя. Если хотя бы одна строка неверна, ничего не сохраняется; неверные строки показываются с номерами.',
    ],
  },
  tk: {
    countsSheet: 'Gelýänleriň sany',
    storesSheet: 'Iş ýerleri',
    helpSheet: 'Düşündiriş',
    date: 'Sene',
    storeNr: 'Iş ýeriniň №',
    store: 'Iş ýeri',
    count: 'Gelýänleriň sany',
    help: [
      'Gelýänleriň sanyny “Gelýänleriň sany” sahypasynyň D sütünine ýazyň, soňra faýly programmadaky “Excel-den ýükle” bilen ýükläň.',
      'D sütüni boş setir okalmaýar; şol gün üçin ýazylan san üýtgemeýär.',
      'Şol iş ýeri we gün üçin san eýýäm bar bolsa, ýüklenen san onuň ornuna geçýär; üýtgeşme ýazgy yzyna “Excel-den” diýip ýazylýar.',
      '0 dogry san: şol gün hiç kim gelmedi ýa-da dükan ýapykdy.',
      'Täze setir goşup bilersiňiz: A sütünine sene (gg.aa.ýýýý), B sütünine iş ýeriniň belgisi. Belgiler “Iş ýerleri” sahypasynda. C sütüni diňe maglumat üçin.',
      'Geljekki günler we ýapylan KPI döwürleri ýüklenip bilinmeýär. Bir setir hem ýalňyş bolsa hiç zat ýazylmaýar; ýalňyş setirler belgisi bilen görkezilýär.',
    ],
  },
};

export interface TemplateStore {
  nr: number;
  name: string | null;
}

export interface TemplateRow {
  date: string;
  store: TemplateStore;
  /** The count already saved for the store and day, so the sheet can be corrected too. */
  visitorCount: number | null;
}

const HEADER_STYLE = {
  fontWeight: 'bold',
  backgroundColor: '#D1FAE5',
  bottomBorderStyle: 'thin',
} as const;

function header(labels: readonly string[]): Row {
  return labels.map((value) => ({ value, type: String, ...HEADER_STYLE }));
}

/**
 * The import template: one row per store and day of the chosen range with the saved
 * count filled in, the store list, and the instructions. The column order is what the
 * import reads (visitor-count-import-rules.ts).
 */
export async function buildVisitorCountTemplate(
  rows: readonly TemplateRow[],
  stores: readonly TemplateStore[],
  language: TemplateLanguage,
): Promise<Buffer> {
  const labels = LABELS[language];
  const counts: SheetData = [
    header([labels.date, labels.storeNr, labels.store, labels.count]),
    ...rows.map((row): Row => [
      { value: new Date(`${row.date}T00:00:00Z`), type: Date, format: 'dd.mm.yyyy' },
      { value: row.store.nr, type: Number },
      { value: row.store.name ?? '', type: String, textColor: '#64748B' },
      row.visitorCount === null ? null : { value: row.visitorCount, type: Number },
    ]),
  ];
  const storeList: SheetData = [
    header([labels.storeNr, labels.store]),
    ...stores.map((store): Row => [
      { value: store.nr, type: Number },
      { value: store.name ?? '', type: String },
    ]),
  ];
  const help: SheetData = labels.help.map((line, index) => [
    { value: `${String(index + 1)}. ${line}`, type: String, wrap: true },
  ]);

  return writeXlsxFile([
    {
      sheet: labels.countsSheet,
      data: counts,
      columns: [{ width: 14 }, { width: 12 }, { width: 32 }, { width: 18 }],
      stickyRowsCount: 1,
    },
    {
      sheet: labels.storesSheet,
      data: storeList,
      columns: [{ width: 12 }, { width: 40 }],
      stickyRowsCount: 1,
    },
    { sheet: labels.helpSheet, data: help, columns: [{ width: 110 }] },
  ]).toBuffer();
}
