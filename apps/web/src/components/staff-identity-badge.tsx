'use client';

import { useAuth } from './auth-provider';

export function StaffIdentityBadge() {
  const { user } = useAuth();

  if (!user || user.role === 'CUSTOMER' || !user.workerId) {
    return null;
  }

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.email;

  const role = user.role.replaceAll('_', ' ');

  return (
    <div className="staff-identity-badge">
      <span className="staff-identity-name">
        {name}
      </span>

      <span className="staff-identity-worker">
        Worker ID: {user.workerId}
      </span>

      <span className="staff-identity-role">
        {role}
      </span>
    </div>
  );
}
