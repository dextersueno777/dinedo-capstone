import { apiClient } from './api-client';
import type { CheckoutPayload, Order } from './api-types';

export function checkout(token: string, payload: CheckoutPayload) {
  return apiClient<Order>('/orders/checkout', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function getMyOrders(token: string) {
  return apiClient<Order[]>('/orders', {
    token,
  });
}

export function getOrderById(token: string, orderId: string) {
  return apiClient<Order>(`/orders/${orderId}`, {
    token,
  });
}

export function respondDeliveryFee(
  token: string,
  orderId: string,
  payload: { accept: boolean; notes?: string },
) {
  return apiClient<Order>(`/orders/${orderId}/delivery-fee-response`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function cancelOrder(
  token: string,
  orderId: string,
  payload: { cancellationReason?: string },
) {
  return apiClient<Order>(`/orders/${orderId}/cancel`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}
