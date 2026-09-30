'use client';

import type { ReactNode } from 'react';
import type { UserRole } from '@/lib/api-types';
import { useAuth } from './auth-provider';

type RoleGateProps = {
  allowedRoles: UserRole[];
  portalName: string;
  children: ReactNode;
};

function formatRole(role: UserRole) {
  return role
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function RoleGate({
  allowedRoles,
  portalName,
  children,
}: Readonly<RoleGateProps>) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <section className="card role-gate-card">
        <span aria-hidden="true">⏳</span>
        <h2>Checking access...</h2>
        <p>Preparing your DineDo session.</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="card role-gate-card">
        <span aria-hidden="true">🔐</span>
        <h2>Login required</h2>
        <p>Please login with the correct account before opening the {portalName}.</p>
      </section>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <section className="card role-gate-card role-gate-denied">
        <span aria-hidden="true">🚫</span>
        <h2>Wrong portal for this account</h2>
        <p>
          You are logged in as {formatRole(user.role)}. This portal is for{' '}
          {allowedRoles.map(formatRole).join(' or ')} accounts only.
        </p>
        <a className="secondary" href="/">
          Back to Portal Selection
        </a>
      </section>
    );
  }

  return <>{children}</>;
}
