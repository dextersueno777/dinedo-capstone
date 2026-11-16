'use client';

import { useEffect, useState } from 'react';
import type { Order } from '@/lib/api-types';
import { getMyOrders } from '@/lib/orders-api';
import { useAuth } from './auth-provider';

function formatPrice(value: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value));
}

function formatStatus(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CustomerLatestOrder() {
  const { user, token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLatestOrder() {
      if (!token || user?.role !== 'CUSTOMER') {
        if (active) setOrder(null);
        return;
      }

      try {
        const orders = await getMyOrders(token);

        if (active) {
          setOrder(orders[0] ?? null);
        }
      } catch {
        if (active) setOrder(null);
      }
    }

    void loadLatestOrder();

    function handleOrdersChanged() {
      void loadLatestOrder();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void loadLatestOrder();
      }
    }

    const refreshInterval = window.setInterval(() => {
      void loadLatestOrder();
    }, 30000);

    window.addEventListener(
      'dinedo:orders-changed',
      handleOrdersChanged,
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    );

    return () => {
      active = false;
      window.clearInterval(refreshInterval);

      window.removeEventListener(
        'dinedo:orders-changed',
        handleOrdersChanged,
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );
    };
  }, [token, user?.id, user?.role]);

  if (!order) {
    return null;
  }

  return (
    <section
      className="customer-latest-order"
      aria-label="Latest customer order"
    >
      <div className="customer-latest-order-copy">
        <p className="eyebrow">Latest Order</p>
        <h2>{order.orderNumber}</h2>

        <div className="customer-latest-order-meta">
          <span>{formatStatus(order.serviceType)}</span>
          <span>•</span>
          <strong>{formatStatus(order.status)}</strong>
        </div>
      </div>

      <div className="customer-latest-order-actions">
        <strong>{formatPrice(order.totalAmount)}</strong>

        <a className="primary" href="#orders">
          Track Order
        </a>
      </div>
    </section>
  );
}
