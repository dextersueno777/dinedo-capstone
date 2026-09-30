import { RoleGate } from '@/components/role-gate';
import { AuthPanel } from '@/components/auth-panel';
import { AdminDashboardPanel } from '@/components/admin-dashboard-panel';
import { AdminInventoryPanel } from '@/components/admin-inventory-panel';
import { AdminRefundPanel } from '@/components/admin-refund-panel';
import { AdminAuditLogPanel } from '@/components/admin-audit-log-panel';

export default function SuperAdminPage() {
  return (
    <main className="page portal-page">
      <header className="portal-header super-admin-portal-header">
        <a className="topbar-brand" href="/" aria-label="Go to DineDo home">
          <img src="/brand/dindos-logo.jpg" alt="Dindo's Restaurant logo" />
          <span>
            <strong>DineDo Super Admin</strong>
            <small>Owner-level monitoring partition</small>
          </span>
        </a>

        <nav className="portal-nav" aria-label="Super admin shortcuts">
          <a href="#admin-dashboard">Dashboard</a>
          <a href="#admin-inventory">Inventory</a>
          <a href="#admin-refunds">Refunds</a>
          <a href="#admin-audit-logs">Audit Logs</a>
        </nav>
      </header>

      <section className="portal-hero super-admin-portal-hero">
        <p className="eyebrow">Owner / Super Admin</p>
        <h1>Monitor high-level restaurant operations.</h1>
        <p>
          This partition is prepared for owner-level oversight. It currently
          reuses admin access until a separate Super Admin role is added.
        </p>
      </section>

      <AuthPanel />
      <RoleGate allowedRoles={['ADMIN']} portalName="Super Admin Portal">
        <AdminDashboardPanel />
        <AdminInventoryPanel />
        <AdminRefundPanel />
        <AdminAuditLogPanel />
      </RoleGate>
    </main>
  );
}
