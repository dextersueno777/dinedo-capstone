'use client';

import { useEffect, useState } from 'react';
import type { Order } from '@/lib/api-types';
import { getMyOrders } from '@/lib/orders-api';
import { useAuth } from './auth-provider';

function formatPrice(price: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(price));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function OrderHistory() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function loadOrders() {
    if (!token || user?.role !== 'CUSTOMER') {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const loadedOrders = await getMyOrders(token);
      setOrders(loadedOrders);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load order history.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [token, user?.id]);

  if (!user) {
    return (
      <section id="orders" className="card">
        <h2>Order History</h2>
        <p>Please login as a customer to view your orders.</p>
      </section>
    );
  }

  return (
    <section id="orders" className="card">
      <div className="order-history-heading">
        <div>
          <p className="eyebrow">Customer Module</p>
          <h2>Order History</h2>
        </div>

        <button className="secondary refresh-button" type="button" onClick={loadOrders}>
          Refresh
        </button>
      </div>

      {isLoading ? <p>Loading orders...</p> : null}
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : null}

      <div className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-card-header">
              <div>
                <h3>{order.orderNumber}</h3>
                <p>{formatDate(order.createdAt)}</p>
              </div>

              <span className="status-pill">{order.status}</span>
            </div>

            <div className="order-summary-grid">
              <p>
                <strong>Service:</strong> {order.serviceType}
              </p>
              <p>
                <strong>Payment:</strong> {order.paymentMethod}
              </p>
              <p>
                <strong>Payment State:</strong> {order.paymentState}
              </p>
              <p>
                <strong>Total:</strong> {formatPrice(order.totalAmount)}
              </p>
            </div>

            {order.address ? (
              <p>
                <strong>Delivery Address:</strong> {order.address.line1},{' '}
                {order.address.municipality}, {order.address.province}
              </p>
            ) : null}

            <div className="order-items">
              {order.items.map((item) => (
                <p key={item.id}>
                  {item.quantity}× {item.itemName} — {formatPrice(item.lineTotal)}
                </p>
              ))}
            </div>

            <div className="timeline">
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
