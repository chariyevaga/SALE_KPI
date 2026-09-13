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
}
