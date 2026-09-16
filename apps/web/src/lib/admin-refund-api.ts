import { apiClient } from './api-client';
import type { AdminRefund, RefundStatus } from './api-types';

export function getAdminRefunds(token: string, status?: RefundStatus) {
  const params = new URLSearchParams();

  if (status) {
    params.set('status', status);
  }

  const query = params.toString();

  return apiClient<AdminRefund[]>(`/admin/refunds${query ? `?${query}` : ''}`, {
    token,
  });
}

export function updateAdminRefundStatus(
  token: string,
  refundId: string,
  payload: {
    status: RefundStatus;
    adminNotes?: string;
    gcashReferenceNumber?: string;
    refundProofImageUrl?: string;
  },
) {
  return apiClient<AdminRefund>(`/admin/refunds/${refundId}/status`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}
