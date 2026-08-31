import { apiClient } from './api-client';
import type { AdminDashboardSummary } from './api-types';

export function getAdminDashboardSummary(
  token: string,
  filters?: {
    branchCode?: string;
    from?: string;
    to?: string;
  },
) {
  const params = new URLSearchParams();

  if (filters?.branchCode) {
    params.set('branchCode', filters.branchCode);
  }

  if (filters?.from) {
    params.set('from', filters.from);
  }

  if (filters?.to) {
    params.set('to', filters.to);
  }

  const query = params.toString();
  const path = query
    ? `/admin/reports/dashboard-summary?${query}`
    : '/admin/reports/dashboard-summary';

  return apiClient<AdminDashboardSummary>(path, {
    token,
  });
}
