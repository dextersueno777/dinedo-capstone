import { apiClient } from './api-client';
import type {
  PaymentProof,
  SubmitPaymentProofPayload,
} from './api-types';

export function submitPaymentProof(
  token: string,
  orderId: string,
  payload: SubmitPaymentProofPayload,
) {
  return apiClient<PaymentProof>(`/orders/${orderId}/payment-proofs`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export function getOrderPaymentProofs(token: string, orderId: string) {
  return apiClient<PaymentProof[]>(`/orders/${orderId}/payment-proofs`, {
    token,
  });
}
