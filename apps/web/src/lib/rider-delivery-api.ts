import { apiClient } from './api-client';
import type {
  CaptureProofOfDeliveryPayload,
  RejectRiderDeliveryPayload,
  ReportDeliveryIssuePayload,
  RiderDelivery,
  UpdateRiderDeliveryStatusPayload,
} from './api-types';

export function getRiderDeliveries(token: string) {
  return apiClient<RiderDelivery[]>('/rider/deliveries', {
    token,
  });
}

export function getRiderDeliveryById(token: string, deliveryId: string) {
  return apiClient<RiderDelivery>(`/rider/deliveries/${deliveryId}`, {
    token,
  });
}

export function acceptRiderDelivery(token: string, deliveryId: string) {
  return apiClient<RiderDelivery>(`/rider/deliveries/${deliveryId}/accept`, {
    method: 'PATCH',
    token,
  });
}

export function rejectRiderDelivery(
  token: string,
  deliveryId: string,
  payload: RejectRiderDeliveryPayload,
) {
  return apiClient<RiderDelivery>(`/rider/deliveries/${deliveryId}/reject`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function updateRiderDeliveryStatus(
  token: string,
  deliveryId: string,
  payload: UpdateRiderDeliveryStatusPayload,
) {
  return apiClient<RiderDelivery>(`/rider/deliveries/${deliveryId}/status`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function reportRiderDeliveryIssue(
  token: string,
  deliveryId: string,
  payload: ReportDeliveryIssuePayload,
) {
  return apiClient<RiderDelivery>(`/rider/deliveries/${deliveryId}/issues`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export function captureProofOfDelivery(
  token: string,
  deliveryId: string,
  payload: CaptureProofOfDeliveryPayload,
) {
  return apiClient<RiderDelivery>(`/rider/deliveries/${deliveryId}/proofs`, {
    method: 'POST',
    token,
    body: payload,
  });
}
