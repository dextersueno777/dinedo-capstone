import { AuthPanel } from '@/components/auth-panel';
import { RiderDeliveryPanel } from '@/components/rider-delivery-panel';

export default function RiderPage() {
  return (
    <main className="page portal-page">
      <header className="portal-header rider-portal-header">
        <a className="topbar-brand" href="/" aria-label="Go to DineDo home">
          <img src="/brand/dindos-logo.jpg" alt="Dindo's Restaurant logo" />
          <span>
            <strong>DineDo Rider</strong>
            <small>Delivery assignments and proof of delivery</small>
          </span>
        </a>

        <nav className="portal-nav" aria-label="Rider shortcuts">
          <a href="#rider-deliveries">Deliveries</a>
        </nav>
      </header>

      <section className="portal-hero rider-portal-hero">
        <p className="eyebrow">Rider App</p>
        <h1>Handle assigned deliveries.</h1>
        <p>
          Accept delivery assignments, view customer details, update delivery
          status, collect COD, and submit proof of delivery.
        </p>
      </section>

      <AuthPanel />
      <RiderDeliveryPanel />
    </main>
  );
}
