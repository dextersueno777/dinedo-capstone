'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';

const mainLinks = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '#menu', label: 'Menu', icon: '📋', active: true },
  { href: '#cart', label: 'Cart', icon: '🛒' },
  { href: '#checkout', label: 'Checkout', icon: '💳' },
  { href: '#orders', label: 'Orders', icon: '📦' },
  { href: '#reservations', label: 'Reservations', icon: '🍽️' },
  { href: '#notifications', label: 'Notifications', icon: '🔔' },
];

const supportLinks = [
  { href: '#account', label: 'Help Center', icon: '❔' },
  { href: '#payment-proof', label: 'Payment Guide', icon: '💸' },
];

const legalLinks = [
  { href: '/', label: 'Terms & Conditions', icon: '📄' },
  { href: '/', label: 'Privacy Notice', icon: '🛡️' },
  { href: '/', label: 'About DineDo', icon: 'ℹ️' },
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

      <aside className={isOpen ? 'app-drawer open' : 'app-drawer'} aria-hidden={!isOpen}>
        <div className="app-drawer-header">
          <a className="app-drawer-brand" href="/" onClick={closeDrawer}>
            <img src="/brand/dindos-logo.jpg" alt="Dindo's Restaurant logo" />
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

        <nav className="app-drawer-nav" aria-label="Customer app navigation">
          {mainLinks.map((link) => (
            <a
              className={link.active ? 'drawer-link drawer-link-active' : 'drawer-link'}
              href={link.href}
              key={link.label}
              onClick={closeDrawer}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </a>
          ))}

          <p className="drawer-section-label">Support</p>
          {supportLinks.map((link) => (
            <a className="drawer-link" href={link.href} key={link.label} onClick={closeDrawer}>
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </a>
          ))}

          <p className="drawer-section-label">Legal</p>
          {legalLinks.map((link) => (
            <a className="drawer-link" href={link.href} key={link.label} onClick={closeDrawer}>
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
            <a className="drawer-login-button" href="#account" onClick={closeDrawer}>
              Register / Log in
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
