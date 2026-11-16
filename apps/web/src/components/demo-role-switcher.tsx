'use client';

import { useState } from 'react';
import type { DemoRole } from '@/lib/auth-api';
import { useAuth } from './auth-provider';

const roles: Array<{
  role: DemoRole;
  label: string;
  href: string;
}> = [
  { role: 'CUSTOMER', label: 'Customer', href: '/customer' },
  { role: 'KITCHEN', label: 'Kitchen', href: '/kitchen' },
  { role: 'RIDER', label: 'Rider', href: '/rider' },
  { role: 'ADMIN', label: 'Admin', href: '/admin' },
];

export function DemoRoleSwitcher() {
  const { user, switchDemoRole } = useAuth();
  const [busy, setBusy] = useState<DemoRole | null>(null);
  const [error, setError] = useState('');

  if (user?.workerId !== 'DEMO') return null;

  async function changeRole(role: DemoRole, href: string) {
    setBusy(role);
    setError('');

    try {
      await switchDemoRole(role);
      window.location.href = href;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to switch demo role.',
      );
      setBusy(null);
    }
  }

  return (
    <section className="demo-role-switcher">
      <div>
        <strong>Panel Demo Mode</strong>
        <small>ID: DEMO · Current: {user.role}</small>
      </div>

      <div className="demo-role-buttons">
        {roles.map((item) => (
          <button
            type="button"
            key={item.role}
            disabled={busy !== null || user.role === item.role}
            onClick={() => changeRole(item.role, item.href)}
          >
            {busy === item.role ? 'Opening...' : item.label}
          </button>
        ))}
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
