'use client';

export function CustomerBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Customer mobile navigation">
      <a href="#menu">
        <span aria-hidden="true">🍽️</span>
        Menu
      </a>

      <a href="#cart">
        <span aria-hidden="true">🛒</span>
        Cart
      </a>

      <a href="#orders">
        <span aria-hidden="true">📦</span>
        Orders
      </a>

      <a href="#reservations">
        <span aria-hidden="true">📅</span>
        Reserve
      </a>

      <a href="#notifications">
        <span aria-hidden="true">🔔</span>
        Alerts
      </a>
    </nav>
  );
}
