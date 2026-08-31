'use client';

import { useEffect, useState } from 'react';
import type { KitchenOrder, OrderStatus } from '@/lib/api-types';
import {
  getKitchenOrders,
  updateKitchenOrderStatus,
} from '@/lib/kitchen-order-api';
import { useAuth } from './auth-provider';

const kitchenStatuses: OrderStatus[] = [
  'COOKING',
  'READY_FOR_PICKUP',
  'READY_TO_SERVE',
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

export function KitchenOrderPanel() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [statusByOrderId, setStatusByOrderId] = useState<Record<string, OrderStatus>>({});
  const [notesByOrderId, setNotesByOrderId] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function loadOrders() {
    if (!token || user?.role !== 'KITCHEN') {
      setOrders([]);
      return;
    }

    setError('');

    try {
      const loadedOrders = await getKitchenOrders(token);
      setOrders(loadedOrders);

      const nextStatus: Record<string, OrderStatus> = {};
      const nextNotes: Record<string, string> = {};

      for (const order of loadedOrders) {
        nextStatus[order.id] =
          order.status === 'APPROVED' ? 'COOKING' : order.status;
        nextNotes[order.id] = '';
      }

      setStatusByOrderId(nextStatus);
      setNotesByOrderId(nextNotes);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load kitchen orders.',
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
      const updated = await updateKitchenOrderStatus(token, orderId, {
        status: statusByOrderId[orderId],
        notes: notesByOrderId[orderId]?.trim() || undefined,
      });

      setMessage(`Kitchen order updated: ${updated.orderNumber}`);
      await loadOrders();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update kitchen order.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [token, user?.role]);

  return (
    <section id="kitchen-orders" className="card">
      <div className="kitchen-order-heading">
        <div>
          <p className="eyebrow">Kitchen Module</p>
          <h2>Kitchen Order Queue</h2>
          <p>View approved orders and update preparation status.</p>
        </div>

        <button className="secondary" type="button" onClick={loadOrders}>
          Refresh
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {user?.role !== 'KITCHEN' ? (
        <p>Login as a kitchen staff account to view the kitchen queue.</p>
      ) : null}

      <div className="kitchen-order-list">
        {orders.length === 0 && user?.role === 'KITCHEN' ? (
          <p>No kitchen orders in the queue.</p>
        ) : null}

        {orders.map((order) => (
          <article className="kitchen-order-card" key={order.id}>
            <div className="kitchen-order-card-header">
              <div>
                <h3>{order.orderNumber}</h3>
                <p>{formatDate(order.createdAt)}</p>
              </div>

              <span className="status-pill">{order.status}</span>
            </div>

            <div className="kitchen-order-summary-grid">
              <p><strong>Customer:</strong> {order.customer.email}</p>
              <p><strong>Service:</strong> {order.serviceType}</p>
              <p><strong>Payment:</strong> {order.paymentMethod}</p>
              <p><strong>Payment State:</strong> {order.paymentState}</p>
              <p><strong>Total:</strong> {money(order.totalAmount)}</p>
              <p><strong>Branch:</strong> {order.branch.name}</p>
            </div>

            {order.customerNotes ? (
              <p><strong>Customer Notes:</strong> {order.customerNotes}</p>
            ) : null}

            <div className="kitchen-order-items">
              <h4>Order Items</h4>

              {order.items.map((item) => (
                <p key={item.id}>
                  {item.quantity}× {item.itemName} — {money(item.lineTotal)}
                  {item.specialNotes ? ` — ${item.specialNotes}` : ''}
                </p>
              ))}
            </div>

            <label className="kitchen-order-field">
              Preparation Status
              <select
                value={statusByOrderId[order.id] ?? 'COOKING'}
                onChange={(event) =>
                  setStatusByOrderId((current) => ({
                    ...current,
                    [order.id]: event.target.value as OrderStatus,
                  }))
                }
              >
                {kitchenStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="kitchen-order-field">
              Kitchen Notes
              <input
                value={notesByOrderId[order.id] ?? ''}
                onChange={(event) =>
                  setNotesByOrderId((current) => ({
                    ...current,
                    [order.id]: event.target.value,
                  }))
                }
                placeholder="Example: Started cooking."
              />
            </label>

            <button
              className="secondary full-button"
              type="button"
              disabled={isBusy}
              onClick={() => handleUpdateStatus(order.id)}
            >
              Update Preparation Status
            </button>

            <div className="kitchen-order-history">
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
