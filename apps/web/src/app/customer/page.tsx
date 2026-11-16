import { CustomerEmailVerificationPanel } from '@/components/customer-email-verification-panel';
import { DemoRoleSwitcher } from '@/components/demo-role-switcher';
import { CustomerAppDrawer } from '@/components/customer-app-drawer';
import { RoleGate } from '@/components/role-gate';
import { AuthPanel } from '@/components/auth-panel';
import { MenuBrowser } from '@/components/menu-browser';
import { CustomerHomePanel } from '@/components/customer-home-panel';
import { CustomerLatestOrder } from '@/components/customer-latest-order';
import { CartPanel } from '@/components/cart-panel';
import { CustomerCartSummary } from '@/components/customer-cart-summary';
import { CheckoutPanel } from '@/components/checkout-panel';
import { PaymentProofPanel } from '@/components/payment-proof-panel';
import { ReservationPanel } from '@/components/reservation-panel';
import { NotificationPanel } from '@/components/notification-panel';
import { OrderHistory } from '@/components/order-history';
import { CustomerBottomNav } from '@/components/customer-bottom-nav';
import { SecurityQuestionExistingSetup } from '@/components/security-question-existing-setup';

export default function CustomerPage() {
  return (
    <main className="page portal-page">
      <DemoRoleSwitcher />
      <header className="portal-header customer-portal-header">
        <CustomerAppDrawer />

        <a className="topbar-brand" href="/" aria-label="Go to DineDo home">
          <img src="/brand/dindos-logo.jpg" alt="Dindo's Restaurant logo" />
          <span>
            <strong>DineDo Customer</strong>
            <small>Ordering, reservation, and status updates</small>
          </span>
        </a>

        <nav className="portal-nav" aria-label="Customer shortcuts">
          <a href="#customer-home">Home</a>
          <a href="#menu">Menu</a>
          <a href="#orders">Orders</a>
          <a href="#reservations">Reserve</a>
          <a href="#account">Account</a>
        </nav>
      </header>


      <RoleGate
        allowedRoles={['CUSTOMER']}
        portalName="Customer App"
        unauthenticatedFallback={
          <>
            <AuthPanel customerExperience />
            <CustomerEmailVerificationPanel />
          </>
        }
      >
        <CustomerEmailVerificationPanel />
        <SecurityQuestionExistingSetup />
        <CustomerHomePanel />
        <CustomerLatestOrder />
        <MenuBrowser />
        <CustomerCartSummary />
        <CartPanel />
        <CheckoutPanel />
        <PaymentProofPanel />
        <ReservationPanel />
        <NotificationPanel />
        <OrderHistory />
        <AuthPanel customerExperience />
        <CustomerBottomNav />
      </RoleGate>
    </main>
  );
}
