import { AuthPanel } from '@/components/auth-panel';
import { KitchenOrderPanel } from '@/components/kitchen-order-panel';

export default function KitchenPage() {
  return (
    <main className="page portal-page">
      <header className="portal-header kitchen-portal-header">
        <a className="topbar-brand" href="/" aria-label="Go to DineDo home">
          <img src="/brand/dindos-logo.jpg" alt="Dindo's Restaurant logo" />
          <span>
            <strong>DineDo Kitchen</strong>
            <small>Merchant and kitchen preparation queue</small>
          </span>
        </a>

        <nav className="portal-nav" aria-label="Kitchen shortcuts">
          <a href="#kitchen-orders">Kitchen Queue</a>
        </nav>
      </header>

      <section className="portal-hero kitchen-portal-hero">
        <p className="eyebrow">Kitchen Staff</p>
        <h1>Prepare approved customer orders.</h1>
        <p>
          View approved orders, check item details, update cooking status,
          and mark orders ready for pickup or serving.
        </p>
      </section>

      <AuthPanel />
      <KitchenOrderPanel />
    </main>
  );
}
