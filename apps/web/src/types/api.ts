export interface EmployeeAvatarResponse {
  bigImageUrl: string | null;
  blurhash: string | null;
  contentUrl: string;
  id: string;
  mediumImageUrl: string | null;
  smallImageUrl: string | null;
}

export interface EmployeeResponse {
  avatar: EmployeeAvatarResponse | null;
  createdAt: string;
  email: string | null;
  erpEmployeeId: number | null;
  erpEmployeeCode: string | null;
  firstname: string;
  fullAccess: boolean;
  id: string;
  isActive: boolean;
  lastname: string;
  phoneNumber: string | null;
  updatedAt: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  employee: EmployeeResponse;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface FileResponse {
  id: string;
  contentUrl: string;
  smallImageUrl: string | null;
  mediumImageUrl: string | null;
  bigImageUrl: string | null;
  blurhash: string | null;
}

export interface CreateEmployeeInput {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  phoneNumber?: string | null;
  erpEmployeeId?: number | null;
  avatarId?: string | null;
  fullAccess?: boolean;
  isActive?: boolean;
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export interface ErpEmployeeOption {
  id: number;
  code: string | null;
  name: string | null;
}

export interface EmployeeListResponse {
  items: EmployeeResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiErrorBody {
  message: string | string[];
  error?: string;
  statusCode: number;
  /** Business error code, e.g. `KPI_TEMPLATE_WEIGHT_TOTAL`; absent on DTO validation errors. */
  code?: string;
  totalWeight?: number;
  itemIndex?: number;
  duplicateOf?: number;
  path?: string;
  storeIds?: number[];
}

export interface LocalizedText {
  tr: string;
  en?: string;
  ru?: string;
  tk?: string;
}

export type KpiScope = 'store' | 'employee';
export type KpiUnit = 'money' | 'count' | 'percent' | 'score';
export type KpiInputMode = 'calculated' | 'manual';

export interface KpiSelectOption {
  value: string;
  label: LocalizedText;
}

interface KpiInputFieldBase {
  key: string;
  label: LocalizedText;
  required: boolean;
}

export type KpiInputField =
  | (KpiInputFieldBase & { type: 'number'; min?: number; max?: number; decimals?: number })
  | (KpiInputFieldBase & { type: 'select'; multiple: boolean; options: KpiSelectOption[] })
  | (KpiInputFieldBase & { type: 'lookup'; multiple: boolean; source: 'stores' })
  | (KpiInputFieldBase & { type: 'boolean' });

export interface KpiDefinition {
  id: string;
  code: string;
  name: LocalizedText;
  scope: KpiScope;
  unit: KpiUnit;
  inputMode: KpiInputMode;
  sortOrder: number;
  inputSchema: KpiInputField[];
}

export interface StoreOption {
  id: number;
  nr: number;
  name: string | null;
}

export type KpiInputValue = number | string | boolean | number[] | string[];

export interface KpiTemplateItem {
  id: string;
  kpiDefinitionId: string;
  definition: Pick<KpiDefinition, 'id' | 'code' | 'name' | 'scope' | 'unit' | 'inputMode'>;
  weight: number;
  targetValue: number | null;
  inputValues: Record<string, KpiInputValue>;
  sortOrder: number;
}

export interface KpiTemplate {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalWeight: number;
  items: KpiTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface KpiTemplateSummary {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  itemCount: number;
  totalWeight: number;
  createdAt: string;
  updatedAt: string;
}

export interface KpiTemplateListResponse {
  items: KpiTemplateSummary[];
  total: number;
  page: number;
  limit: number;
}

/** Result of the bulk status endpoints: rows whose state actually changed (ADR-035). */
export interface BulkUpdateResponse {
  updated: number;
}

export interface KpiTemplateCopyResult {
  sourceId: string;
  id: string;
  name: string;
}

export interface KpiTemplateBulkCopyResponse {
  copies: KpiTemplateCopyResult[];
}

export interface SaveKpiTemplateInput {
  name: string;
  description: string | null;
  isActive?: boolean;
  items: {
    kpiDefinitionId: string;
    weight: number;
    targetValue: number | null;
    inputValues: Record<string, KpiInputValue>;
  }[];
}

/** Tables whose screens show record info (ADR-036); the API accepts every audited table. */
export type AuditedTable = 'employees' | 'kpi_templates';

export interface AuditActor {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
}

/** `old` is missing for created rows, `new` for deleted ones; secrets only say `redacted`. */
export interface AuditFieldChange {
  old?: unknown;
  new?: unknown;
  redacted?: true;
}

export interface AuditLogEntry {
  id: string;
  tableName: string;
  recordId: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, AuditFieldChange>;
  context: Record<string, unknown> | null;
  /** null: the system (migration, scheduled job). */
  actor: AuditActor | null;
  requestId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogListResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface RecordInfo {
  tableName: string;
  recordId: string;
  createdAt: string;
  createdBy: AuditActor | null;
  updatedAt: string;
  updatedBy: AuditActor | null;
}
