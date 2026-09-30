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
    href: '/customer',
    icon: '🍽️',
    title: 'Customer App',
    description: 'Order food, reserve tables, upload GCash proof, and track status.',
  },
  {
    href: '/admin',
    icon: '🛡️',
    title: 'Admin Dashboard',
    description: 'Manage orders, payments, reservations, inventory, refunds, and reports.',
  },
  {
    href: '/kitchen',
    icon: '👨‍🍳',
    title: 'Kitchen Staff',
    description: 'View approved orders and update cooking or ready status.',
  },
  {
    href: '/rider',
    icon: '🏍️',
    title: 'Rider App',
    description: 'Handle delivery assignments, COD collection, and proof of delivery.',
  },
  {
    href: '/super-admin',
    icon: '👑',
    title: 'Super Admin',
    description: 'Owner-level monitoring partition for high-level restaurant oversight.',
  },
];

const restaurantPhotos: Array<{ src: string; alt: string; label: string }> = [
  {
    src: '/restaurant/storefront-night.jpg',
    alt: "Dindo's Restaurant storefront at night",
    label: 'Storefront',
  },
  {
    src: '/restaurant/dining-flower-wall-wide.jpg',
    alt: "Dindo's Restaurant dining area with flower wall",
    label: 'Dining Area',
  },
  {
    src: '/restaurant/counter-display-area.jpg',
    alt: "Dindo's Restaurant counter and display area",
    label: 'Counter Area',
  },
  {
    src: '/restaurant/mountain-sign-view.jpg',
    alt: "Dindo's Restaurant sign with Tinoc mountain view",
    label: 'Tinoc View',
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

      <section className="restaurant-photo-showcase" aria-label="Restaurant photos">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Dindo’s Place</p>
            <h2>Real restaurant photos</h2>
            <p className="section-subtitle">
              A preview of the Tinoc branch dining area, counter, storefront, and location view.
            </p>
          </div>
        </div>

        <div className="restaurant-photo-grid">
          {restaurantPhotos.map((photo) => (
            <article className="restaurant-photo-card" key={photo.src}>
              <img src={photo.src} alt={photo.alt} />
              <span>{photo.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="ordering-steps-card" aria-label="How ordering works">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Customer Flow</p>
            <h2>How ordering works</h2>
            <p className="section-subtitle">
              A simple flow for dine-in, take-out, delivery, and reservations.
            </p>
          </div>
        </div>

        <div className="ordering-steps-grid">
          <article>
            <span>1</span>
            <h3>Browse Menu</h3>
            <p>Choose from Dindo’s updated menu with real food photos.</p>
          </article>

          <article>
            <span>2</span>
            <h3>Add to Cart</h3>
            <p>Select items, review the cart, and prepare checkout details.</p>
          </article>

          <article>
            <span>3</span>
            <h3>Submit Order</h3>
            <p>Choose dine-in, take-out, delivery, or reservation request.</p>
          </article>

          <article>
            <span>4</span>
            <h3>Get Updates</h3>
            <p>Receive order status updates after staff review and preparation.</p>
          </article>
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
            <a className="module module-link" href={module.href} key={module.title}>
              <span className="module-icon" aria-hidden="true">
                {module.icon}
              </span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </a>
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
