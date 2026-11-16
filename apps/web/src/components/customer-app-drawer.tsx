'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';

const mainLinks = [
  { href: '#customer-home', label: 'Home', icon: '🏠' },
  { href: '#menu', label: 'Menu', icon: '🍽️' },
  { href: '#cart', label: 'Cart', icon: '🛒' },
  { href: '#orders', label: 'My Orders', icon: '📦' },
  { href: '#reservations', label: 'Reservations', icon: '📅' },
  { href: '#notifications', label: 'Notifications', icon: '🔔' },
  { href: '#account', label: 'Account', icon: '👤' },
];

export function CustomerAppDrawer() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  function closeDrawer() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        className="app-drawer-toggle"
        type="button"
        aria-label="Open DineDo menu"
        onClick={() => setIsOpen(true)}
      >
        ☰
      </button>

      {isOpen ? (
        <button
          className="app-drawer-backdrop"
          type="button"
          aria-label="Close DineDo menu"
          onClick={closeDrawer}
        />
      ) : null}

      <aside
        className={isOpen ? 'app-drawer open' : 'app-drawer'}
        aria-hidden={!isOpen}
      >
        <div className="app-drawer-header">
          <a
            className="app-drawer-brand"
            href="#customer-home"
            onClick={closeDrawer}
          >
            <img
              src="/brand/dindos-logo.jpg"
              alt="Dindo's Restaurant logo"
            />
            <span>DineDo</span>
          </a>

          <button
            className="app-drawer-close"
            type="button"
            aria-label="Close menu"
            onClick={closeDrawer}
          >
            ×
          </button>
        </div>

        <nav
          className="app-drawer-nav"
          aria-label="Customer app navigation"
        >
          {mainLinks.map((link) => (
            <a
              className="drawer-link"
              href={link.href}
              key={link.label}
              onClick={closeDrawer}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="app-drawer-footer">
          {user ? (
            <button
              className="drawer-login-button"
              type="button"
              onClick={() => {
                logout();
                closeDrawer();
              }}
            >
              Logout
            </button>
          ) : (
            <a
              className="drawer-login-button"
              href="#account"
              onClick={closeDrawer}
            >
              Register / Log in
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
