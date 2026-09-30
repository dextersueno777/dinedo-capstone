import { RoleGate } from '@/components/role-gate';
import { AuthPanel } from '@/components/auth-panel';
import { AdminDashboardPanel } from '@/components/admin-dashboard-panel';
import { AdminOrderPanel } from '@/components/admin-order-panel';
import { AdminPaymentProofPanel } from '@/components/admin-payment-proof-panel';
import { AdminReservationPanel } from '@/components/admin-reservation-panel';
import { AdminInventoryPanel } from '@/components/admin-inventory-panel';
import { AdminRefundPanel } from '@/components/admin-refund-panel';
import { AdminAuditLogPanel } from '@/components/admin-audit-log-panel';

export default function AdminPage() {
  return (
    <main className="page portal-page">
      <header className="portal-header admin-portal-header">
        <a className="topbar-brand" href="/" aria-label="Go to DineDo home">
          <img src="/brand/dindos-logo.jpg" alt="Dindo's Restaurant logo" />
          <span>
            <strong>DineDo Admin</strong>
            <small>Restaurant management dashboard</small>
          </span>
        </a>

        <nav className="portal-nav" aria-label="Admin shortcuts">
          <a href="#admin-orders">Orders</a>
          <a href="#admin-payment-proofs">Payments</a>
          <a href="#admin-reservations">Reservations</a>
          <a href="#admin-inventory">Inventory</a>
        </nav>
      </header>

      <section className="portal-hero admin-portal-hero">
        <p className="eyebrow">Admin Dashboard</p>
        <h1>Manage Dindo restaurant operations.</h1>
        <p>
          Review orders, verify GCash proofs, manage reservations, update stock,
          process refunds, and check audit activity.
        </p>
      </section>

      <AuthPanel />
      <RoleGate allowedRoles={['ADMIN']} portalName="Admin Dashboard">
        <AdminDashboardPanel />
        <AdminOrderPanel />
        <AdminPaymentProofPanel />
        <AdminReservationPanel />
        <AdminInventoryPanel />
        <AdminRefundPanel />
        <AdminAuditLogPanel />
      </RoleGate>
    </main>
  );
}
