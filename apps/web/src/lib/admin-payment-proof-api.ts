import { apiClient } from './api-client';
import type {
  AdminPaymentProof,
  AdminReservationDepositProof,
  PaymentProofStatus,
  ReviewPaymentProofPayload,
} from './api-types';

export function getAdminReservationDepositProofs(
  token: string,
  status?: PaymentProofStatus,
) {
  const query = status ? `?status=${status}` : '';

  return apiClient<AdminReservationDepositProof[]>(
    `/admin/payment-proofs/reservation-deposits${query}`,
    { token },
  );
}

export function reviewAdminReservationDepositProof(
  token: string,
  proofId: string,
  payload: ReviewPaymentProofPayload,
) {
  return apiClient<AdminReservationDepositProof>(
    `/admin/payment-proofs/reservation-deposits/${proofId}/review`,
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  );
}

export function getAdminPaymentProofs(
  token: string,
  status?: PaymentProofStatus,
) {
  const query = status ? `?status=${status}` : '';

  return apiClient<AdminPaymentProof[]>(`/admin/payment-proofs${query}`, {
    token,
  });
}

export function getAdminPaymentProofById(token: string, proofId: string) {
  return apiClient<AdminPaymentProof>(`/admin/payment-proofs/${proofId}`, {
    token,
  });
}

export function reviewAdminPaymentProof(
  token: string,
  proofId: string,
  payload: ReviewPaymentProofPayload,
) {
  return apiClient<AdminPaymentProof>(
    `/admin/payment-proofs/${proofId}/review`,
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  );
}
