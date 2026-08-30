import { apiClient } from './api-client';
import type { AuthUser, LoginResponse } from './api-types';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export function login(payload: LoginPayload) {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function register(payload: RegisterPayload) {
  return apiClient<LoginResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export function getMe(token: string) {
  return apiClient<AuthUser>('/auth/me', {
    token,
  });
}
