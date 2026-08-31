'use client';

import { useEffect, useState } from 'react';
import type { AdminOrder, OrderStatus } from '@/lib/api-types';
import {
  getAdminOrders,
  setAdminDeliveryFee,
  updateAdminOrderStatus,
} from '@/lib/admin-order-api';
import { useAuth } from './auth-provider';

const orderStatuses: OrderStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'MODIFICATION_REQUESTED',
  'CANCELLED',
  'COOKING',
  'READY_FOR_PICKUP',
  'READY_TO_SERVE',
  'ASSIGNED_TO_RIDER',
  'OUT_FOR_DELIVERY',
  'ARRIVED',
  'DELIVERED',
  'COMPLETED',
];

function money(value: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AdminOrderPanel() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusByOrderId, setStatusByOrderId] = useState<Record<string, OrderStatus>>({});
  const [feeByOrderId, setFeeByOrderId] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function loadOrders() {
    if (!token || user?.role !== 'ADMIN') {
      setOrders([]);
      return;
    }

    setError('');

    try {
      const loadedOrders = await getAdminOrders(token);
      setOrders(loadedOrders);

      const nextStatus: Record<string, OrderStatus> = {};
      const nextFee: Record<string, string> = {};

      for (const order of loadedOrders) {
        nextStatus[order.id] = order.status;
        nextFee[order.id] = String(order.additionalDeliveryFeeAmount ?? 0);
      }

      setStatusByOrderId(nextStatus);
      setFeeByOrderId(nextFee);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load admin orders.',
      );
    }
  }

  async function handleUpdateStatus(orderId: string) {
    if (!token) {
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const updated = await updateAdminOrderStatus(token, orderId, {
        status: statusByOrderId[orderId],
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setMessage(`Order updated: ${updated.orderNumber}`);
      await loadOrders();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update order status.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSetDeliveryFee(orderId: string) {
    if (!token) {
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const updated = await setAdminDeliveryFee(token, orderId, {
        additionalDeliveryFeeAmount: Number(feeByOrderId[orderId] ?? 0),
        adminNotes: adminNotes.trim() || undefined,
      });

      setMessage(`Delivery fee updated: ${updated.orderNumber}`);
      await loadOrders();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to set delivery fee.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [token, user?.role]);

  return (
    <section id="admin-orders" className="card">
      <div className="admin-order-heading">
        <div>
          <p className="eyebrow">Admin Module</p>
          <h2>Admin Order Management</h2>
          <p>Review customer orders, update status, and set extra delivery fees.</p>
        </div>

        <button className="secondary" type="button" onClick={loadOrders}>
          Refresh
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {user?.role !== 'ADMIN' ? (
        <p>Login as an admin to manage orders.</p>
      ) : null}

      {user?.role === 'ADMIN' ? (
        <div className="admin-order-notes">
          <label>
            Status Reason
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional reason"
            />
          </label>

          <label>
            Status Notes
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes"
            />
          </label>

          <label>
            Delivery Fee Admin Notes
            <input
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              placeholder="Optional delivery fee notes"
            />
          </label>
        </div>
      ) : null}

      <div className="admin-order-list">
        {orders.length === 0 && user?.role === 'ADMIN' ? (
          <p>No orders found.</p>
        ) : null}

        {orders.map((order) => (
          <article className="admin-order-card" key={order.id}>
            <div className="admin-order-card-header">
              <div>
                <h3>{order.orderNumber}</h3>
                <p>{formatDate(order.createdAt)}</p>
              </div>

              <span className="status-pill">{order.status}</span>
            </div>

            <div className="admin-order-summary-grid">
              <p><strong>Customer:</strong> {order.customer.email}</p>
              <p><strong>Service:</strong> {order.serviceType}</p>
              <p><strong>Payment:</strong> {order.paymentMethod}</p>
              <p><strong>Payment State:</strong> {order.paymentState}</p>
              <p><strong>Delivery Fee:</strong> {order.deliveryFeeStatus}</p>
              <p><strong>Total:</strong> {money(order.totalAmount)}</p>
            </div>

            {order.address ? (
              <p>
                <strong>Address:</strong> {order.address.line1},{' '}
                {order.address.municipality}, {order.address.province}
              </p>
            ) : null}

            <div className="admin-order-items">
              {order.items.map((item) => (
                <p key={item.id}>
                  {item.quantity}× {item.itemName} — {money(item.lineTotal)}
                </p>
              ))}
            </div>

            <label className="admin-order-field">
              Update Status
              <select
                value={statusByOrderId[order.id] ?? order.status}
                onChange={(event) =>
                  setStatusByOrderId((current) => ({
                    ...current,
                    [order.id]: event.target.value as OrderStatus,
                  }))
                }
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="secondary full-button"
              type="button"
              disabled={isBusy}
              onClick={() => handleUpdateStatus(order.id)}
            >
              Update Status
            </button>

            {order.serviceType === 'DELIVERY' ? (
              <>
                <label className="admin-order-field">
                  Additional Delivery Fee
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={feeByOrderId[order.id] ?? '0'}
                    onChange={(event) =>
                      setFeeByOrderId((current) => ({
                        ...current,
                        [order.id]: event.target.value,
                      }))
                    }
                  />
                </label>

                <button
                  className="secondary full-button"
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleSetDeliveryFee(order.id)}
                >
                  Set Delivery Fee
                </button>
              </>
            ) : null}

            <div className="admin-order-history">
              <h4>Status History</h4>

              {order.statusHistory.map((history) => (
                <p key={history.id}>
                  <strong>{history.toStatus}</strong>
                  {history.notes ? ` — ${history.notes}` : ''}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
