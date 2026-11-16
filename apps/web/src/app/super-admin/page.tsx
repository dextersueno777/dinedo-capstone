import { StaffIdentityBadge } from '@/components/staff-identity-badge';
import { StaffApprovalPanel } from '@/components/staff-approval-panel';
import { RoleGate } from '@/components/role-gate';
import { AuthPanel } from '@/components/auth-panel';
import { AdminDashboardPanel } from '@/components/admin-dashboard-panel';
import { AdminInventoryPanel } from '@/components/admin-inventory-panel';
import { AdminRefundPanel } from '@/components/admin-refund-panel';
import { AdminAuditLogPanel } from '@/components/admin-audit-log-panel';
import { SuperadminContactPanel } from '@/components/superadmin-contact-panel';
import { PasswordRecoveryReviewPanel } from '@/components/password-recovery-review-panel';
export default function SuperAdminPage() {
  return (
    <main className="page portal-page">
      <StaffIdentityBadge />
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
          <a href="#owner-security">Owner Security</a>
        </nav>
      </header>

      <section className="portal-hero super-admin-portal-hero">
        <p className="eyebrow">Owner / Super Admin</p>
        <h1>Monitor high-level restaurant operations.</h1>
        <p>
          This owner-only portal provides privileged oversight, security,
          financial review, audit, and restaurant management controls.
        </p>
      </section>

      <AuthPanel superAdminExperience allowedLoginRoles={['SUPERADMIN']} />
      <RoleGate allowedRoles={['SUPERADMIN']} portalName="Super Admin Portal">
<AdminDashboardPanel />
        <PasswordRecoveryReviewPanel />
        <SuperadminContactPanel />
        <AdminInventoryPanel />
        <AdminRefundPanel />
        <AdminAuditLogPanel />
      </RoleGate>
          <StaffApprovalPanel />
    </main>
  );
}
