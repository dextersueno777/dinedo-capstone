'use client';

import { useEffect, useState } from 'react';
import type { Notification, NotificationStatus } from '@/lib/api-types';
import {
  archiveNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/notification-api';
import { useAuth } from './auth-provider';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase();
}

export function NotificationPanel() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function loadNotifications() {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setError('');

    try {
      const [loadedNotifications, countResult] = await Promise.all([
        getMyNotifications(
          token,
          statusFilter ? { status: statusFilter } : undefined,
        ),
        getUnreadNotificationCount(token),
      ]);

      setNotifications(loadedNotifications);
      setUnreadCount(countResult.unreadCount);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load notifications.',
      );
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    if (!token) {
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      await markNotificationAsRead(token, notificationId);
      setMessage('Notification marked as read.');
      await loadNotifications();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to mark notification as read.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMarkAllAsRead() {
    if (!token) {
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const result = await markAllNotificationsAsRead(token);
      setMessage(`${result.updatedCount} notification(s) marked as read.`);
      await loadNotifications();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to mark all notifications as read.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleArchive(notificationId: string) {
    if (!token) {
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      await archiveNotification(token, notificationId);
      setMessage('Notification archived.');
      await loadNotifications();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to archive notification.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [token, statusFilter]);

  return (
    <section id="notifications" className="card notification-card">
      <div className="notification-heading">
        <div>
          <p className="eyebrow">Updates</p>
          <h2>Notifications</h2>
          <p>Track order, payment, reservation, and delivery updates in one place.</p>
        </div>

        <span className="status-pill unread-pill">{unreadCount} unread</span>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!user ? (
        <div className="empty-notification-state">
          <span aria-hidden="true">🔔</span>
          <h3>Sign in to view notifications</h3>
          <p>Customer updates will appear here after login.</p>
        </div>
      ) : null}

      {user ? (
        <div className="notification-controls">
          <label>
            Show
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as NotificationStatus | '')
              }
            >
              <option value="">All</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>

          <button
            className="secondary"
            type="button"
            disabled={isBusy}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </button>
        </div>
      ) : null}

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-notification-state">
            <span aria-hidden="true">📭</span>
            <h3>No notifications yet</h3>
            <p>Order, payment, reservation, and delivery alerts will show here.</p>
          </div>
        ) : null}

        {notifications.map((notification) => (
          <article
            className={`notification-item ${
              notification.status === 'UNREAD' ? 'unread-notification-item' : ''
            }`}
            key={notification.id}
          >
            <div className="notification-item-header">
              <div>
                <h3>{notification.title}</h3>
                <p>{formatDate(notification.createdAt)}</p>
              </div>

              <span className="status-pill">{formatLabel(notification.status)}</span>
            </div>

            <p>{notification.message}</p>

            <p>
              <strong>Type:</strong> {formatLabel(notification.type)}
            </p>

            {notification.order ? (
              <p>
                <strong>Order:</strong> {notification.order.orderNumber} —{' '}
                {formatLabel(notification.order.status)}
              </p>
            ) : null}

            {notification.reservation ? (
              <p>
                <strong>Reservation:</strong>{' '}
                {notification.reservation.reservationNumber}
              </p>
            ) : null}

            <div className="notification-actions">
              {notification.status === 'UNREAD' ? (
                <button
                  className="secondary"
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  Mark as Read
                </button>
              ) : null}

              {notification.status !== 'ARCHIVED' ? (
                <button
                  className="secondary"
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleArchive(notification.id)}
                >
                  Archive
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
