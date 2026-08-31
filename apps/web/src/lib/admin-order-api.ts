import { apiClient } from './api-client';
import type {
  AdminOrder,
  SetAdminDeliveryFeePayload,
  UpdateAdminOrderStatusPayload,
} from './api-types';

export function getAdminOrders(token: string) {
  return apiClient<AdminOrder[]>('/admin/orders', {
    token,
  });
}

export function getAdminOrderById(token: string, orderId: string) {
  return apiClient<AdminOrder>(`/admin/orders/${orderId}`, {
    token,
  });
}

export function updateAdminOrderStatus(
  token: string,
  orderId: string,
  payload: UpdateAdminOrderStatusPayload,
) {
  return apiClient<AdminOrder>(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function setAdminDeliveryFee(
  token: string,
  orderId: string,
  payload: SetAdminDeliveryFeePayload,
) {
  return apiClient<AdminOrder>(`/admin/orders/${orderId}/delivery-fee`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}
