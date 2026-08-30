export type UserRole = 'CUSTOMER' | 'ADMIN' | 'KITCHEN' | 'RIDER';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
};

export type Branch = {
  id: string;
  code: string;
  name: string;
  address: string | null;
};

export type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};
