import { apiClient } from './api-client';

export type ReservationDepositProof = {
  id: string;
  reservationId: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  amount: string | number;
  proofImageUrl: string;
  gcashReferenceNumber: string | null;
  payerName: string | null;
  payerAccountLast4: string | null;
  rejectionReason: string | null;
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

export type SubmitReservationDepositProofPayload = {
  proofImageUrl: string;
  gcashReferenceNumber?: string;
  payerName?: string;
  payerAccountLast4?: string;
};

export function submitReservationDepositProof(
  token: string,
  reservationId: string,
  payload: SubmitReservationDepositProofPayload,
) {
  return apiClient<ReservationDepositProof>(
    `/reservations/${reservationId}/deposit-proofs`,
    {
      method: 'POST',
      token,
      body: payload,
    },
  );
}

export function getReservationDepositProofs(
  token: string,
  reservationId: string,
) {
  return apiClient<ReservationDepositProof[]>(
    `/reservations/${reservationId}/deposit-proofs`,
    { token },
  );
}
