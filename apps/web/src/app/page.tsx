import { AuthPanel } from '@/components/auth-panel';

const modules = [
  'Customer Ordering',
  'Table Reservation',
  'Kitchen Queue',
  'Rider Delivery',
  'Admin Dashboard',
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Dindo’s Restaurant - Tinoc Branch</p>
        <h1>DineDo</h1>
        <p className="lead">
          A Progressive Web Application for integrated ordering, table
          reservation, and delivery management.
        </p>
        <div className="actions">
          <a className="primary" href="#modules">View Modules</a>
          <a className="secondary" href="#status">System Status</a>
        </div>
      </section>

      <AuthPanel />

      <section id="modules" className="card">
        <h2>Core Modules</h2>
        <div className="grid">
          {modules.map((module) => (
            <article className="module" key={module}>
              <h3>{module}</h3>
              <p>Foundation ready for DineDo development.</p>
            </article>
          ))}
        </div>
      </section>

      <section id="status" className="card">
        <h2>Foundation Status</h2>
        <p>
          Web app foundation is ready for mobile-first screens,
          API connection, authentication, and PWA installation support.
        </p>
      </section>
    </main>
  );
}
