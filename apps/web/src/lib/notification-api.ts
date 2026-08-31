import { apiClient } from './api-client';
import type {
  Notification,
  NotificationStatus,
  NotificationType,
  UnreadNotificationCount,
} from './api-types';

export function getMyNotifications(
  token: string,
  filters?: {
    status?: NotificationStatus;
    type?: NotificationType;
  },
) {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set('status', filters.status);
  }

  if (filters?.type) {
    params.set('type', filters.type);
  }

  const query = params.toString();
  const path = query ? `/notifications?${query}` : '/notifications';

  return apiClient<Notification[]>(path, {
    token,
  });
}

export function getUnreadNotificationCount(token: string) {
  return apiClient<UnreadNotificationCount>('/notifications/unread-count', {
    token,
  });
}

export function markNotificationAsRead(token: string, notificationId: string) {
  return apiClient<Notification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    token,
  });
}

export function markAllNotificationsAsRead(token: string) {
  return apiClient<{ updatedCount: number }>('/notifications/read-all', {
    method: 'PATCH',
    token,
  });
}

export function archiveNotification(token: string, notificationId: string) {
  return apiClient<Notification>(`/notifications/${notificationId}/archive`, {
    method: 'PATCH',
    token,
  });
}

export function deleteNotification(token: string, notificationId: string) {
  return apiClient<{ message: string }>(`/notifications/${notificationId}`, {
    method: 'DELETE',
    token,
  });
}
