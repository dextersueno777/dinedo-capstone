import { apiClient } from './api-client';
import type {
  CreateAddressPayload,
  CustomerAddress,
  UpdateAddressPayload,
} from './api-types';

export function getMyAddresses(token: string) {
  return apiClient<CustomerAddress[]>('/addresses', {
    token,
  });
}

export function createAddress(token: string, payload: CreateAddressPayload) {
  return apiClient<CustomerAddress>('/addresses', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateAddress(
  token: string,
  addressId: string,
  payload: UpdateAddressPayload,
) {
  return apiClient<CustomerAddress>(`/addresses/${addressId}`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export function deleteAddress(token: string, addressId: string) {
  return apiClient<{ message: string }>(`/addresses/${addressId}`, {
    method: 'DELETE',
    token,
  });
}
