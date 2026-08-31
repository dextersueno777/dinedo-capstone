'use client';

import { useEffect, useState } from 'react';
import type { AdminDashboardSummary } from '@/lib/api-types';
import { getAdminDashboardSummary } from '@/lib/admin-dashboard-api';
import { useAuth } from './auth-provider';

function money(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value);
}

type MetricProps = {
  label: string;
  value: string | number;
};

function Metric({ label, value }: MetricProps) {
  return (
    <article className="admin-metric">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export function AdminDashboardPanel() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function loadSummary() {
    if (!token || user?.role !== 'ADMIN') {
      setSummary(null);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await getAdminDashboardSummary(token, {
        branchCode: 'TINOC',
      });

      setSummary(result);
      setMessage('Admin dashboard summary loaded.');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load admin dashboard.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, [token, user?.role]);

  return (
    <section id="admin-dashboard" className="card">
      <div className="admin-dashboard-heading">
        <div>
          <p className="eyebrow">Admin Module</p>
          <h2>Admin Dashboard</h2>
          <p>View Tinoc branch orders, reservations, deliveries, payments, and inventory summary.</p>
        </div>

        <button
          className="secondary"
          type="button"
          disabled={isLoading}
          onClick={loadSummary}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {user?.role !== 'ADMIN' ? (
        <p>Login as an admin to view the dashboard summary.</p>
      ) : null}

      {summary ? (
        <>
          <div className="admin-metrics">
            <Metric label="Total Orders" value={summary.orders.total} />
            <Metric label="Gross Sales" value={money(summary.orders.grossSales)} />
            <Metric label="Reservations" value={summary.reservations.total} />
            <Metric label="Pending Payments" value={summary.payments.pendingReview} />
            <Metric label="Low Stock Items" value={summary.inventory.lowStockItems} />
          </div>

          <div className="admin-dashboard-grid">
            <article className="admin-summary-card">
              <h3>Orders</h3>
              <p><strong>Pending:</strong> {summary.orders.pending}</p>
              <p><strong>Approved:</strong> {summary.orders.approved}</p>
              <p><strong>Cooking:</strong> {summary.orders.cooking}</p>
              <p><strong>Delivered:</strong> {summary.orders.delivered}</p>
              <p><strong>Completed:</strong> {summary.orders.completed}</p>
              <p><strong>Cancelled:</strong> {summary.orders.cancelled}</p>
            </article>

            <article className="admin-summary-card">
              <h3>Reservations</h3>
              <p><strong>Pending:</strong> {summary.reservations.pending}</p>
              <p><strong>Approved:</strong> {summary.reservations.approved}</p>
              <p><strong>Completed:</strong> {summary.reservations.completed}</p>
              <p><strong>Cancelled:</strong> {summary.reservations.cancelled}</p>
              <p><strong>No Show:</strong> {summary.reservations.noShow}</p>
              <p><strong>Total Guests:</strong> {summary.reservations.guestCountTotal}</p>
            </article>

            <article className="admin-summary-card">
              <h3>Deliveries</h3>
              <p><strong>Total:</strong> {summary.deliveries.total}</p>
              <p><strong>Pending Assignment:</strong> {summary.deliveries.pendingAssignment}</p>
              <p><strong>Assigned:</strong> {summary.deliveries.assigned}</p>
              <p><strong>Out for Delivery:</strong> {summary.deliveries.outForDelivery}</p>
              <p><strong>Delivered:</strong> {summary.deliveries.delivered}</p>
              <p><strong>COD to Collect:</strong> {money(summary.deliveries.codAmountToCollect)}</p>
            </article>

            <article className="admin-summary-card">
              <h3>Payments</h3>
              <p><strong>Proofs Total:</strong> {summary.payments.proofsTotal}</p>
              <p><strong>Pending Review:</strong> {summary.payments.pendingReview}</p>
              <p><strong>Approved:</strong> {summary.payments.approved}</p>
              <p><strong>Rejected:</strong> {summary.payments.rejected}</p>
              <p><strong>Submitted Amount:</strong> {money(summary.payments.submittedAmount)}</p>
            </article>

            <article className="admin-summary-card">
              <h3>Inventory</h3>
              <p><strong>Total Items:</strong> {summary.inventory.totalItems}</p>
              <p><strong>Active Items:</strong> {summary.inventory.activeItems}</p>
              <p><strong>Low Stock Items:</strong> {summary.inventory.lowStockItems}</p>
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
