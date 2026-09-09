import { apiClient } from './api-client';
import type {
  AdminAuditLog,
  AdminAuditLogFilters,
} from './api-types';

export async function getAdminAuditLogs(
  token: string,
  filters: AdminAuditLogFilters = {},
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return apiClient<AdminAuditLog[]>(
    `/admin/audit-logs${query ? `?${query}` : ''}`,
    {
      token,
    },
  );
}

export async function getAdminAuditLogById(
  token: string,
  auditLogId: string,
) {
  return apiClient<AdminAuditLog>(`/admin/audit-logs/${auditLogId}`, {
    token,
  });
}
