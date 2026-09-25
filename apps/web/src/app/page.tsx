import { AuthPanel } from '@/components/auth-panel';
import { MenuBrowser } from '@/components/menu-browser';
import { CartPanel } from '@/components/cart-panel';
import { CheckoutPanel } from '@/components/checkout-panel';
import { OrderHistory } from '@/components/order-history';
import { PaymentProofPanel } from '@/components/payment-proof-panel';
import { ReservationPanel } from '@/components/reservation-panel';
import { NotificationPanel } from '@/components/notification-panel';
import { AdminDashboardPanel } from '@/components/admin-dashboard-panel';
import { AdminOrderPanel } from '@/components/admin-order-panel';
import { KitchenOrderPanel } from '@/components/kitchen-order-panel';
import { RiderDeliveryPanel } from '@/components/rider-delivery-panel';
import { AdminPaymentProofPanel } from '@/components/admin-payment-proof-panel';
import { AdminReservationPanel } from '@/components/admin-reservation-panel';
import { AdminInventoryPanel } from '@/components/admin-inventory-panel';
import { AdminAuditLogPanel } from '@/components/admin-audit-log-panel';
import { AdminRefundPanel } from '@/components/admin-refund-panel';

const modules = [
  {
    title: 'Customer Ordering',
    description: 'Browse real Dindo menu photos, add food to cart, and checkout.',
  },
  {
    title: 'Table Reservation',
    description: 'Reserve tables for dine-in customers within branch hours.',
  },
  {
    title: 'Kitchen Queue',
    description: 'Let kitchen staff view approved orders and update preparation.',
  },
  {
    title: 'Rider Delivery',
    description: 'Support rider assignment, delivery status updates, and proof.',
  },
  {
    title: 'Admin Dashboard',
    description: 'Manage orders, payments, riders, reservations, and reports.',
  },
];

export default function HomePage() {
  return (
    <main id="top" className="page">
      <header className="app-topbar">
        <a className="topbar-brand" href="#top" aria-label="Go to DineDo home">
          <img src="/brand/dindos-logo.jpg" alt="Dindo's Restaurant logo" />
          <span>
            <strong>DineDo</strong>
            <small>Tinoc Branch</small>
          </span>
        </a>

        <nav className="topbar-nav" aria-label="Main app shortcuts">
          <a href="#menu">Menu</a>
          <a href="#cart">Cart</a>
          <a href="#reservations">Reserve</a>
          <a href="#orders">Orders</a>
        </nav>
      </header>

      <section className="app-hero">
        <div className="app-hero-copy">
          <div className="brand-lockup">
            <img src="/brand/dindos-logo.jpg" alt="Dindo's Restaurant logo" />
            <div>
              <p className="eyebrow">Dindo’s Restaurant - Tinoc Branch</p>
              <strong>Official ordering PWA</strong>
            </div>
          </div>

          <h1>Order Dindo favorites faster.</h1>
          <p className="lead">
            Browse real menu photos, choose dine-in, take-out, delivery, or
            reservation, and receive clear order status updates.
          </p>

          <div className="actions">
            <a className="primary" href="#menu">Order Now</a>
            <a className="secondary" href="#reservations">Reserve a Table</a>
          </div>
        </div>

        <div className="hero-promo-card">
          <span className="promo-badge">Tinoc Branch</span>
          <h2>Real food photos now live</h2>
          <p>
            View Dindo’s meals with updated client-provided menu prices.
          </p>
          <a className="promo-link" href="#menu">Browse Menu →</a>
        </div>
      </section>

      <section className="service-strip" aria-label="Available services">
        <a href="#menu">🍽️ Order Food</a>
        <a href="#checkout">🛒 Checkout</a>
        <a href="#reservations">📅 Reservation</a>
        <a href="#orders">📦 Order Status</a>
      </section>

      <section className="restaurant-status-card" aria-label="Restaurant ordering information">
        <div>
          <p className="eyebrow">Restaurant Status</p>
          <h2>Ready for dine-in, take-out, delivery, and reservations.</h2>
          <p>
            Ordering hours are from 8:00 AM to 6:00 PM. Customers may pay by COD
            or upload GCash proof for manual verification.
          </p>
        </div>

        <div className="status-grid">
          <span>🕗 8:00 AM - 6:00 PM</span>
          <span>🏍️ 1 km base delivery area</span>
          <span>💳 COD / GCash proof</span>
          <span>📦 Status updates</span>
        </div>
      </section>

      <AuthPanel />

      <section id="modules" className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">System Modules</p>
            <h2>Built for restaurant operations</h2>
          </div>
        </div>

        <div className="grid">
          {modules.map((module) => (
            <article className="module" key={module.title}>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </article>
          ))}
        </div>
      </section>

      <MenuBrowser />

      <CartPanel />

      <CheckoutPanel />

      <AdminDashboardPanel />

      <AdminOrderPanel />

      <KitchenOrderPanel />

      <RiderDeliveryPanel />

      <NotificationPanel />

      <ReservationPanel />

      <AdminReservationPanel />

      <AdminInventoryPanel />

      <AdminAuditLogPanel />

      <AdminRefundPanel />

      <PaymentProofPanel />

      <AdminPaymentProofPanel />

      <OrderHistory />

      <section id="status" className="card">
        <h2>Foundation Status</h2>
        <p>
          Web app foundation is ready for mobile-first screens,
          API connection, authentication, and PWA installation support.
        </p>
      </section>
      <nav className="mobile-bottom-nav" aria-label="Mobile app navigation">
        <a href="#menu">
          <span>🍽️</span>
          Menu
        </a>
        <a href="#cart">
          <span>🛒</span>
          Cart
        </a>
        <a href="#reservations">
          <span>📅</span>
          Reserve
        </a>
        <a href="#orders">
          <span>📦</span>
          Orders
        </a>
      </nav>

    </main>
  );
}
