import { CustomerAppDrawer } from '@/components/customer-app-drawer';
import { RoleGate } from '@/components/role-gate';
import { AuthPanel } from '@/components/auth-panel';
import { MenuBrowser } from '@/components/menu-browser';
import { CartPanel } from '@/components/cart-panel';
import { CheckoutPanel } from '@/components/checkout-panel';
import { PaymentProofPanel } from '@/components/payment-proof-panel';
import { ReservationPanel } from '@/components/reservation-panel';
import { NotificationPanel } from '@/components/notification-panel';
import { OrderHistory } from '@/components/order-history';

export default function CustomerPage() {
  return (
    <main className="page portal-page">
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
          <a href="#menu">Menu</a>
          <a href="#cart">Cart</a>
          <a href="#checkout">Checkout</a>
          <a href="#orders">Orders</a>
        </nav>
      </header>

      <section className="portal-hero customer-portal-hero">
        <p className="eyebrow">Customer App</p>
        <h1>Order, reserve, and track Dindo favorites.</h1>
        <p>
          Browse menu items, add food to cart, checkout, upload GCash proof,
          reserve a table, and receive order status updates.
        </p>
      </section>

      <AuthPanel />
      <RoleGate allowedRoles={['CUSTOMER']} portalName="Customer App">
        <MenuBrowser />
        <CartPanel />
        <CheckoutPanel />
        <PaymentProofPanel />
        <ReservationPanel />
        <NotificationPanel />
        <OrderHistory />
      </RoleGate>
    </main>
  );
}
