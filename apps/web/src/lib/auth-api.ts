import { apiClient } from './api-client';
import type { AuthUser, LoginResponse } from './api-types';

export type LoginPayload = {
  email: string;
  password: string;
  ownerContactNumber?: string;
};

export type SecurityQuestionAnswerPayload = {
  questionKey: string;
  answer: string;
};

export type SecurityQuestionOption = {
  key: string;
  text: string;
  adminOnly: boolean;
};

export type SecurityQuestionCatalog = {
  questions: SecurityQuestionOption[];
  requiredSelections: number;
  adminMinimumAdminQuestions: number;
};

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  securityQuestions: SecurityQuestionAnswerPayload[];
};

export function getSecurityQuestions(role: string) {
  return apiClient<SecurityQuestionCatalog>(
    `/auth/security-questions?role=${encodeURIComponent(role)}`,
  );
}

export function login(payload: LoginPayload) {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

export function register(payload: RegisterPayload) {
  return apiClient<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export function sendCustomerEmailVerification(email: string) {
  return apiClient<{ message: string }>(
    '/auth/customer/email-verification/send',
    {
      method: 'POST',
      body: { email },
    },
  );
}

export function verifyCustomerEmail(
  email: string,
  code: string,
) {
  return apiClient<{
    message: string;
    user: AuthUser;
  }>('/auth/customer/email-verification/verify', {
    method: 'POST',
    body: { email, code },
  });
}

export async function getMe(token: string) {
  const response = await apiClient<{ user: AuthUser }>('/auth/me', {
    token,
  });

  return response.user;
}

export type UpdateSuperadminContactNumberPayload = {
  currentPassword: string;
  newContactNumber: string;
};

export type UpdateSuperadminContactNumberResponse = {
  message: string;
  maskedContactNumber: string;
};

export function updateSuperadminContactNumber(
  token: string,
  payload: UpdateSuperadminContactNumberPayload,
) {
  return apiClient<UpdateSuperadminContactNumberResponse>(
    '/auth/superadmin/contact-number',
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  );
}

export type DemoRole =
  | 'CUSTOMER'
  | 'KITCHEN'
  | 'RIDER'
  | 'ADMIN';

export function switchDemoRole(
  token: string,
  role: DemoRole,
) {
  return apiClient<LoginResponse>('/auth/demo/switch-role', {
    method: 'POST',
    token,
    body: { role },
  });
}

export type PendingStaffApplication = {
  id: string;
  email: string;
  role: 'ADMIN' | 'KITCHEN' | 'RIDER';
  status: string;
  workerId: string | null;
  staffPhoneNumber: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
  } | null;
  branch: {
    id: string;
    name: string;
    code: string;
  } | null;
};

export function getPendingStaffApplications(token: string) {
  return apiClient<PendingStaffApplication[]>(
    '/auth/superadmin/staff-applications',
    { token },
  );
}

export function reviewStaffApplication(
  token: string,
  id: string,
  payload:
    | { action: 'APPROVE' }
    | { action: 'REJECT'; rejectionReason: string },
) {
  return apiClient<PendingStaffApplication>(
    `/auth/superadmin/staff-applications/${id}/review`,
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  );
}

export type StaffApplicationRole =
  | 'ADMIN'
  | 'KITCHEN'
  | 'RIDER';

export type StaffApplicationPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: StaffApplicationRole;
  securityQuestions: SecurityQuestionAnswerPayload[];
};

export function applyForStaff(
  payload: StaffApplicationPayload,
) {
  return apiClient<{
    message: string;
    user: AuthUser;
  }>('/auth/staff/apply', {
    method: 'POST',
    body: payload,
  });
}

export function sendStaffEmailVerification(email: string) {
  return apiClient<{ message: string }>(
    '/auth/staff/email-verification/send',
    {
      method: 'POST',
      body: { email },
    },
  );
}

export function verifyStaffEmail(
  email: string,
  code: string,
) {
  return apiClient<{
    message: string;
    user?: AuthUser;
  }>('/auth/staff/email-verification/verify', {
    method: 'POST',
    body: { email, code },
  });
}

export type PasswordRecoveryQuestion = {
  questionKey: string;
  text: string;
};

export type PasswordRecoveryQuestionsResponse = {
  questions: PasswordRecoveryQuestion[];
  message: string;
};

export function getPasswordRecoveryQuestions(email: string) {
  return apiClient<PasswordRecoveryQuestionsResponse>(
    '/auth/password-recovery/questions',
    {
      method: 'POST',
      body: { email },
    },
  );
}

export function requestPasswordRecovery(payload: {
  email: string;
  reason: string;
  answers: SecurityQuestionAnswerPayload[];
}) {
  return apiClient<{ message: string }>(
    '/auth/password-recovery/request',
    {
      method: 'POST',
      body: payload,
    },
  );
}

export function resetPassword(payload: {
  token: string;
  newPassword: string;
}) {
  return apiClient<{ message: string }>(
    '/auth/password-recovery/reset',
    {
      method: 'POST',
      body: payload,
    },
  );
}

export type PasswordRecoveryReview = {
  id: string;
  reason: string;
  status: 'PENDING';
  securityVerifiedAt: string;
  createdAt: string;
  identityCheck: {
    verified: boolean;
    passed: number;
    total: number;
  };
  user: {
    id: string;
    email: string;
    role: string;
    workerId: string | null;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
};

export function getPasswordRecoveryReviews(token: string) {
  return apiClient<PasswordRecoveryReview[]>(
    '/auth/password-recovery/review',
    { token },
  );
}

export function reviewPasswordRecovery(
  token: string,
  id: string,
  payload: {
    decision: 'APPROVE' | 'REJECT';
    reason?: string;
  },
) {
  return apiClient<{ message: string }>(
    `/auth/password-recovery/review/${id}`,
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  );
}

export function getSecurityQuestionSetupStatus(token: string) {
  return apiClient<{
    configured: boolean;
    count: number;
  }>('/auth/security-questions/setup-status', {
    token,
  });
}

export function setupSecurityQuestions(
  token: string,
  securityQuestions: SecurityQuestionAnswerPayload[],
) {
  return apiClient<{ message: string }>(
    '/auth/security-questions/setup',
    {
      method: 'POST',
      token,
      body: { securityQuestions },
    },
  );
}
