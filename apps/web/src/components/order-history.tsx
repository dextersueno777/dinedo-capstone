'use client';

import { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '@/lib/api-types';
import { cancelOrder, getMyOrders, respondDeliveryFee } from '@/lib/orders-api';
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

const customerStatusSteps: OrderStatus[] = [
  'PENDING',
  'APPROVED',
  'COOKING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

function getStepClass(order: Order, step: OrderStatus) {
  const statusHistory = order.statusHistory.map((history) => history.toStatus);

  if (order.status === step) {
    return 'status-step active-status-step';
  }

  if (statusHistory.includes(step)) {
    return 'status-step completed-status-step';
  }

  return 'status-step';
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase();
}

export function OrderHistory() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feeBusyByOrderId, setFeeBusyByOrderId] = useState<Record<string, boolean>>({});
  const [cancelBusyByOrderId, setCancelBusyByOrderId] = useState<Record<string, boolean>>({});

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

  async function handleDeliveryFee(orderId: string, accept: boolean) {
    if (!token) return;

    setFeeBusyByOrderId((current) => ({ ...current, [orderId]: true }));
    setMessage('');
    setError('');

    try {
      const updatedOrder = await respondDeliveryFee(token, orderId, {
        accept,
        notes: accept
          ? 'Customer accepted additional delivery fee.'
          : 'Customer rejected additional delivery fee.',
      });

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order)),
      );

      setMessage(
        accept
          ? 'Additional delivery fee accepted.'
          : 'Additional delivery fee rejected. Order cancelled.',
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to respond to delivery fee.',
      );
    } finally {
      setFeeBusyByOrderId((current) => ({ ...current, [orderId]: false }));
    }
  }

  async function handleCancelOrder(orderId: string) {
    if (!token) return;

    const confirmed = window.confirm(
      'Cancel this pending order? This is only allowed before preparation.',
    );

    if (!confirmed) return;

    setCancelBusyByOrderId((current) => ({ ...current, [orderId]: true }));
    setMessage('');
    setError('');

    try {
      const updatedOrder = await cancelOrder(token, orderId, {
        cancellationReason: 'Customer cancelled pending order.',
      });

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order)),
      );

      setMessage('Order cancelled successfully.');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to cancel order.',
      );
    } finally {
      setCancelBusyByOrderId((current) => ({ ...current, [orderId]: false }));
    }
  }

  useEffect(() => {
    loadOrders();
  }, [token, user?.id]);

  if (!user) {
    return (
      <section id="orders" className="card order-history-card order-history-empty">
        <p className="eyebrow">Order Status</p>
        <h2>Sign in to track orders</h2>
        <p>Please login as a customer to view order updates, delivery fees, and history.</p>
      </section>
    );
  }

  return (
    <section id="orders" className="card order-history-card">
      <div className="order-history-heading">
        <div>
          <p className="eyebrow">Order Status</p>
          <h2>Track your orders</h2>
          <p className="section-subtitle">
            View staff updates, payment status, delivery fee requests, and order timeline.
          </p>
        </div>

        <button className="secondary refresh-button" type="button" onClick={loadOrders}>
          Refresh
        </button>
      </div>

      {isLoading ? <p>Loading orders...</p> : null}
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && orders.length === 0 ? (
        <div className="empty-order-state">
          <span aria-hidden="true">📦</span>
          <h3>No orders yet</h3>
          <p>Submitted orders will appear here with their latest status updates.</p>
          <a className="primary cart-link-button" href="#menu">
            Browse Menu
          </a>
        </div>
      ) : null}

      <div className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-card-header">
              <div>
                <h3>{order.orderNumber}</h3>
                <p>{formatDate(order.createdAt)}</p>
              </div>

              <span className="status-pill">{formatLabel(order.status)}</span>
            </div>

            <div className="customer-status-flow" aria-label="Customer order status flow">
              {customerStatusSteps.map((step) => (
                <span className={getStepClass(order, step)} key={step}>
                  {formatLabel(step)}
                </span>
              ))}
            </div>

            <div className="order-summary-grid">
              <p>
                <strong>Service:</strong> {formatLabel(order.serviceType)}
              </p>
              <p>
                <strong>Payment:</strong> {formatLabel(order.paymentMethod)}
              </p>
              <p>
                <strong>Payment State:</strong> {formatLabel(order.paymentState)}
              </p>
              <p>
                <strong>Total:</strong> {formatPrice(order.totalAmount)}
              </p>
            </div>

            {order.status === 'PENDING' ? (
              <div className="button-row">
                <button
                  className="secondary"
                  type="button"
                  disabled={cancelBusyByOrderId[order.id]}
                  onClick={() => handleCancelOrder(order.id)}
                >
                  Cancel Order
                </button>
              </div>
            ) : null}

            {order.serviceType === 'DELIVERY' ? (
              <div className="fee-review-box">
                <p>
                  <strong>Delivery Fee Status:</strong> {formatLabel(order.deliveryFeeStatus)}
                </p>

                {Number(order.additionalDeliveryFeeAmount) > 0 ? (
                  <p>
                    <strong>Additional Fee:</strong>{' '}
                    {formatPrice(order.additionalDeliveryFeeAmount)}
                  </p>
                ) : null}

                {order.deliveryFeeStatus === 'PENDING_CUSTOMER_ACCEPTANCE' ? (
                  <div className="button-row">
                    <button
                      type="button"
                      disabled={feeBusyByOrderId[order.id]}
                      onClick={() => handleDeliveryFee(order.id, true)}
                    >
                      Accept Fee
                    </button>
                    <button
                      className="secondary"
                      type="button"
                      disabled={feeBusyByOrderId[order.id]}
                      onClick={() => handleDeliveryFee(order.id, false)}
                    >
                      Reject Fee
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

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
              <h4>Status Timeline</h4>
              {order.statusHistory.map((history) => (
                <p key={history.id}>
                  <strong>{formatLabel(history.toStatus)}</strong>
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
