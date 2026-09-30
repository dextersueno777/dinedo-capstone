const portals = [
  {
    href: '/customer',
    icon: '🍽️',
    title: 'Customer App',
    description: 'Order food, reserve a table, upload GCash proof, and track status.',
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
    description: 'Owner-level monitoring partition for high-level oversight.',
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

        <nav className="topbar-nav" aria-label="Portal shortcuts">
          <a href="/customer">Customer</a>
          <a href="/admin">Admin</a>
          <a href="/kitchen">Kitchen</a>
          <a href="/rider">Rider</a>
        </nav>
      </header>

      <section className="app-hero portal-landing-hero">
        <div className="app-hero-copy">
          <div className="brand-lockup">
            <img src="/brand/dindos-logo.jpg" alt="Dindo's Restaurant logo" />
            <div>
              <p className="eyebrow">Dindo’s Restaurant - Tinoc Branch</p>
              <strong>Official DineDo PWA</strong>
            </div>
          </div>

          <h1>Choose your DineDo portal.</h1>
          <p className="lead">
            Separate access for customers, admin, kitchen staff, riders, and
            owner-level monitoring.
          </p>

          <div className="actions">
            <a className="primary" href="/customer">Open Customer App</a>
            <a className="secondary" href="/admin">Open Admin Dashboard</a>
          </div>
        </div>

        <div className="hero-promo-card">
          <span className="promo-badge">Live PWA</span>
          <h2>Role-based partitions</h2>
          <p>
            The system is now organized like a real restaurant ordering platform.
          </p>
        </div>
      </section>

      <section id="portals" className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">System Access</p>
            <h2>Select a portal</h2>
            <p className="section-subtitle">
              Each user type now has a separate page for its own workflow.
            </p>
          </div>
        </div>

        <div className="grid">
          {portals.map((portal) => (
            <a className="module module-link portal-choice-card" href={portal.href} key={portal.title}>
              <span className="module-icon" aria-hidden="true">
                {portal.icon}
              </span>
              <h3>{portal.title}</h3>
              <p>{portal.description}</p>
              <strong>Open Portal →</strong>
            </a>
          ))}
        </div>
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
    </main>
  );
}
