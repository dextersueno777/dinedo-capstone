import { apiClient } from './api-client';
import type {
  AddCartItemPayload,
  Cart,
  UpdateCartItemPayload,
} from './api-types';

const DEFAULT_BRANCH_CODE = 'TINOC';

export function getCart(token: string, branchCode = DEFAULT_BRANCH_CODE) {
  return apiClient<Cart>(`/cart?branchCode=${encodeURIComponent(branchCode)}`, {
    token,
  });
}

export function addCartItem(token: string, payload: AddCartItemPayload) {
  return apiClient<Cart>('/cart/items', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateCartItem(
  token: string,
  cartItemId: string,
  payload: UpdateCartItemPayload,
) {
  return apiClient<Cart>(`/cart/items/${cartItemId}`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function removeCartItem(token: string, cartItemId: string) {
  return apiClient<Cart>(`/cart/items/${cartItemId}`, {
    method: 'DELETE',
    token,
  });
}

export function clearCart(token: string, branchCode = DEFAULT_BRANCH_CODE) {
  return apiClient<Cart>(`/cart?branchCode=${encodeURIComponent(branchCode)}`, {
    method: 'DELETE',
    token,
  });
}
