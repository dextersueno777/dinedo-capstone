import { apiClient } from './api-client';
import type { AdminRider } from './api-types';

export function getAdminRiders(token: string, branchCode = 'TINOC') {
  const params = new URLSearchParams();

  if (branchCode) {
    params.set('branchCode', branchCode);
  }

  const query = params.toString();

  return apiClient<AdminRider[]>(`/admin/riders${query ? `?${query}` : ''}`, {
    token,
  });
}
