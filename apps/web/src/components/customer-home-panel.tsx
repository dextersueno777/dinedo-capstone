'use client';

import { useEffect, useState } from 'react';
import type { Branch } from '@/lib/api-types';
import { getBranchByCode } from '@/lib/branches-api';
import {
  formatBranchTime,
  getBranchHoursStatus,
} from '@/lib/branch-hours';

export function CustomerHomePanel() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    getBranchByCode('TINOC')
      .then((loaded) => {
        if (!cancelled) setBranch(loaded);
      })
      .catch(() => {
        if (!cancelled) setBranch(null);
      });

    const timer = window.setInterval(() => setNow(new Date()), 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const openTime = branch?.settings?.orderingOpenTime ?? '07:00';
  const closeTime = branch?.settings?.orderingCloseTime ?? '22:00';
  const timezone = branch?.settings?.timezone ?? 'Asia/Manila';

  const status = getBranchHoursStatus(
    now,
    openTime,
    closeTime,
    timezone,
  );

  return (
    <section id="customer-home" className="customer-home-card">
      <div className="customer-home-copy">
        <p className="eyebrow">Dindo&apos;s Restaurant · Tinoc</p>

        <div className="customer-status-line">
          <span
            className={
              status.isOpen
                ? 'restaurant-status-dot restaurant-status-open'
                : 'restaurant-status-dot restaurant-status-closed'
            }
          />
          <strong>
            {status.isOpen ? 'Restaurant Open' : 'Restaurant Closed'}
          </strong>
        </div>

        <h2>What would you like today?</h2>

        <p>
          Tinoc branch hours: {formatBranchTime(openTime)} to{' '}
          {formatBranchTime(closeTime)}.
        </p>

        <p className="customer-hours-note">
          {status.isOpen
            ? 'Immediate ordering is currently available.'
            : 'Immediate ordering is currently unavailable. You may still browse the menu and review your existing transactions.'}
        </p>

        <div className="customer-home-actions">
          <a className="primary" href="#menu">
            Order Food
          </a>

          <a className="secondary" href="#reservations">
            Reserve a Table
          </a>
        </div>
      </div>

      <div className="customer-quick-grid">
        <a href="#menu">
          <span>🍽️</span>
          <strong>Menu</strong>
          <small>Browse dishes</small>
        </a>

        <a href="#cart">
          <span>🛒</span>
          <strong>Cart</strong>
          <small>Review items</small>
        </a>

        <a href="#orders">
          <span>📦</span>
          <strong>My Orders</strong>
          <small>Track status</small>
        </a>

        <a href="#reservations">
          <span>📅</span>
          <strong>Reservations</strong>
          <small>View bookings</small>
        </a>
      </div>
    </section>
  );
}
