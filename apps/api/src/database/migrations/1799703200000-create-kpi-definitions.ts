import type { MigrationInterface, QueryRunner } from 'typeorm';

// Seed data is intentionally inlined: a migration is a snapshot and must not follow
// later changes in application code. Contract: docs/DATABASE.md, ADR-032.

const STORE_IDS_INPUT = {
  key: 'storeIds',
  type: 'lookup',
  label: { tr: 'Mağazalar', en: 'Stores', ru: 'Магазины', tk: 'Dükanlar' },
  required: true,
  multiple: true,
  source: 'stores',
};

const CURRENCY_INPUT = {
  key: 'currency',
  type: 'select',
  label: { tr: 'Para birimi', en: 'Currency', ru: 'Валюта', tk: 'Walýuta' },
  required: true,
  multiple: false,
  options: [
    {
      value: 'TMT',
      label: {
        tr: 'Türkmen manatı (TMT)',
        en: 'Turkmen manat (TMT)',
        ru: 'Туркменский манат (TMT)',
        tk: 'Türkmen manady (TMT)',
      },
    },
    {
      value: 'USD',
      label: {
        tr: 'ABD doları (USD)',
        en: 'US dollar (USD)',
        ru: 'Доллар США (USD)',
        tk: 'ABŞ dollary (USD)',
      },
    },
  ],
};

const DEFINITIONS = [
  {
    code: 'STORE_SALES',
    scope: 'store',
    unit: 'money',
    inputMode: 'calculated',
    sortOrder: 10,
    name: {
      tr: 'Mağaza bazında ciro',
      en: 'Sales by store',
      ru: 'Выручка по магазину',
      tk: 'Dükan boýunça satuw',
    },
    inputSchema: [STORE_IDS_INPUT, CURRENCY_INPUT],
  },
  {
    code: 'EMPLOYEE_SALES',
    scope: 'employee',
    unit: 'money',
    inputMode: 'calculated',
    sortOrder: 20,
    name: {
      tr: 'Personel bazında ciro',
      en: 'Sales by employee',
      ru: 'Выручка по сотруднику',
      tk: 'Işgär boýunça satuw',
    },
    inputSchema: [CURRENCY_INPUT],
  },
  {
    code: 'STORE_RECEIPTS',
    scope: 'store',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 30,
    name: {
      tr: 'Mağaza bazında fiş sayısı',
      en: 'Receipts by store',
      ru: 'Количество чеков по магазину',
      tk: 'Dükan boýunça çek sany',
    },
    inputSchema: [STORE_IDS_INPUT],
  },
  {
    code: 'EMPLOYEE_RECEIPTS',
    scope: 'employee',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 40,
    name: {
      tr: 'Personel bazında fiş sayısı',
      en: 'Receipts by employee',
      ru: 'Количество чеков по сотруднику',
      tk: 'Işgär boýunça çek sany',
    },
    inputSchema: [],
  },
  {
    code: 'STORE_CUSTOMERS',
    scope: 'store',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 50,
    name: {
      tr: 'Mağaza bazında müşteri sayısı',
      en: 'Customers by store',
      ru: 'Количество покупателей по магазину',
      tk: 'Dükan boýunça müşderi sany',
    },
    inputSchema: [STORE_IDS_INPUT],
  },
  {
    code: 'EMPLOYEE_CUSTOMERS',
    scope: 'employee',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 60,
    name: {
      tr: 'Personel bazında müşteri sayısı',
      en: 'Customers by employee',
      ru: 'Количество покупателей по сотруднику',
      tk: 'Işgär boýunça müşderi sany',
    },
    inputSchema: [],
  },
  {
    code: 'STORE_NEW_CUSTOMERS',
    scope: 'store',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 70,
    name: {
      tr: 'Mağaza bazında yeni müşteri',
      en: 'New customers by store',
      ru: 'Новые покупатели по магазину',
      tk: 'Dükan boýunça täze müşderiler',
    },
    inputSchema: [STORE_IDS_INPUT],
  },
  {
    code: 'EMPLOYEE_NEW_CUSTOMERS',
    scope: 'employee',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 80,
    name: {
      tr: 'Personel bazında yeni müşteri',
      en: 'New customers by employee',
      ru: 'Новые покупатели по сотруднику',
      tk: 'Işgär boýunça täze müşderiler',
    },
    inputSchema: [],
  },
  {
    code: 'STORE_RETURNING_CUSTOMERS',
    scope: 'store',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 90,
    name: {
      tr: 'Mağaza bazında eski müşteri',
      en: 'Returning customers by store',
      ru: 'Повторные покупатели по магазину',
      tk: 'Dükan boýunça gaýtadan gelen müşderiler',
    },
    inputSchema: [STORE_IDS_INPUT],
  },
  {
    code: 'EMPLOYEE_RETURNING_CUSTOMERS',
    scope: 'employee',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 100,
    name: {
      tr: 'Personel bazında eski müşteri',
      en: 'Returning customers by employee',
      ru: 'Повторные покупатели по сотруднику',
      tk: 'Işgär boýunça gaýtadan gelen müşderiler',
    },
    inputSchema: [],
  },
  {
    code: 'STORE_PRODUCT_VARIETY',
    scope: 'store',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 110,
    name: {
      tr: 'Mağaza bazında ürün çeşitliliği',
      en: 'Product variety by store',
      ru: 'Ассортимент продаж по магазину',
      tk: 'Dükan boýunça haryt dürlüligi',
    },
    inputSchema: [STORE_IDS_INPUT],
  },
  {
    code: 'EMPLOYEE_PRODUCT_VARIETY',
    scope: 'employee',
    unit: 'count',
    inputMode: 'calculated',
    sortOrder: 120,
    name: {
      tr: 'Personel bazında ürün çeşitliliği',
      en: 'Product variety by employee',
      ru: 'Ассортимент продаж по сотруднику',
      tk: 'Işgär boýunça haryt dürlüligi',
    },
    inputSchema: [],
  },
  {
    code: 'STORE_CONVERSION',
    scope: 'store',
    unit: 'percent',
    inputMode: 'calculated',
    sortOrder: 130,
    name: {
      tr: 'Mağaza bazında dönüşüm oranı (CRM)',
      en: 'Conversion rate by store (CRM)',
      ru: 'Конверсия по магазину (CRM)',
      tk: 'Dükan boýunça konwersiýa (CRM)',
    },
    inputSchema: [STORE_IDS_INPUT],
  },
  {
    code: 'EMPLOYEE_DISCIPLINE',
    scope: 'employee',
    unit: 'score',
    inputMode: 'manual',
    sortOrder: 140,
    name: {
      tr: 'Tertip ve disiplin',
      en: 'Order and discipline',
      ru: 'Порядок и дисциплина',
      tk: 'Tertip we düzgün-nyzam',
    },
    inputSchema: [],
  },
];

export class CreateKpiDefinitions1799703200000 implements MigrationInterface {
  name = 'CreateKpiDefinitions1799703200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE [dbo].[kpi_definitions] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_kpi_definitions_id] DEFAULT NEWSEQUENTIALID(),
        [code] nvarchar(64) NOT NULL,
        [scope] nvarchar(16) NOT NULL,
        [unit] nvarchar(16) NOT NULL,
        [input_mode] nvarchar(16) NOT NULL,
        [name] nvarchar(1000) NOT NULL,
        [input_schema] nvarchar(max) NOT NULL
          CONSTRAINT [DF_kpi_definitions_input_schema] DEFAULT N'[]',
        [sort_order] int NOT NULL,
        [is_active] bit NOT NULL
          CONSTRAINT [DF_kpi_definitions_is_active] DEFAULT 1,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_kpi_definitions_created_at] DEFAULT SYSUTCDATETIME(),
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_kpi_definitions_updated_at] DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_kpi_definitions] PRIMARY KEY ([id]),
        CONSTRAINT [CK_kpi_definitions_code_format] CHECK (
          LEN([code]) > 0
          AND [code] COLLATE Latin1_General_BIN2 NOT LIKE N'%[^A-Z0-9_]%'
        ),
        CONSTRAINT [CK_kpi_definitions_scope]
          CHECK ([scope] IN (N'store', N'employee')),
        CONSTRAINT [CK_kpi_definitions_unit]
          CHECK ([unit] IN (N'money', N'count', N'percent', N'score')),
        CONSTRAINT [CK_kpi_definitions_input_mode]
          CHECK ([input_mode] IN (N'calculated', N'manual')),
        CONSTRAINT [CK_kpi_definitions_name_json] CHECK (
          ISJSON([name]) = 1
          AND JSON_VALUE([name], N'$.tr') IS NOT NULL
          AND LEN(JSON_VALUE([name], N'$.tr')) > 0
        ),
        CONSTRAINT [CK_kpi_definitions_input_schema_json] CHECK (
          ISJSON([input_schema]) = 1
          AND LEFT(LTRIM([input_schema]), 1) = N'['
        )
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_kpi_definitions_code]
      ON [dbo].[kpi_definitions] ([code])
    `);

    for (const definition of DEFINITIONS) {
      await queryRunner.query(
        `
          INSERT INTO [dbo].[kpi_definitions] (
            [code], [scope], [unit], [input_mode], [name], [input_schema], [sort_order]
          )
          VALUES (@0, @1, @2, @3, @4, @5, @6)
        `,
        [
          definition.code,
          definition.scope,
          definition.unit,
          definition.inputMode,
          JSON.stringify(definition.name),
          JSON.stringify(definition.inputSchema),
          definition.sortOrder,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE [dbo].[kpi_definitions]');
  }
}
