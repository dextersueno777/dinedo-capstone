import { apiClient } from './api-client';
import type {
  KitchenOrder,
  UpdateKitchenOrderStatusPayload,
} from './api-types';

export function getKitchenOrders(token: string) {
  return apiClient<KitchenOrder[]>('/kitchen/orders', {
    token,
  });
}

export function getKitchenOrderById(token: string, orderId: string) {
  return apiClient<KitchenOrder>(`/kitchen/orders/${orderId}`, {
    token,
  });
}

export function updateKitchenOrderStatus(
  token: string,
  orderId: string,
  payload: UpdateKitchenOrderStatusPayload,
) {
  return apiClient<KitchenOrder>(`/kitchen/orders/${orderId}/status`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}
