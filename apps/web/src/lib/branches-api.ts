import { apiClient } from './api-client';
import type { Branch } from './api-types';

export function getBranchByCode(code: string) {
  return apiClient<Branch>(`/branches/${encodeURIComponent(code)}`);
}
