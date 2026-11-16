'use client';

import { useAuth } from '@/components/auth-provider';
import { StaffApplicationPanel } from '@/components/staff-application-panel';
import { StaffEmailVerificationPanel } from '@/components/staff-email-verification-panel';
import type { StaffApplicationRole } from '@/lib/auth-api';

type Props = {
  role: StaffApplicationRole;
};

export function StaffOnboardingPanels({ role }: Props) {
  const { user } = useAuth();

  // An already active account no longer needs application
  // or email-verification forms.
  if (user?.status === 'ACTIVE') {
    return null;
  }

  return (
    <div className="staff-onboarding-grid">
      <StaffApplicationPanel role={role} />
      <StaffEmailVerificationPanel />
    </div>
  );
}
