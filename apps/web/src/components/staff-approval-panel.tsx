'use client';

import { useEffect, useState } from 'react';
import {
  getPendingStaffApplications,
  reviewStaffApplication,
  type PendingStaffApplication,
} from '@/lib/auth-api';
import { useAuth } from './auth-provider';

export function StaffApprovalPanel() {
  const { token, user } = useAuth();

  const [items, setItems] =
    useState<PendingStaffApplication[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    if (!token || user?.role !== 'SUPERADMIN') {
      setLoading(false);
      return;
    }

    try {
      setError('');
      setItems(await getPendingStaffApplications(token));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to load staff.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token, user?.role]);

  async function approve(id: string) {
    if (!token) return;

    setBusy(id);

    try {
      await reviewStaffApplication(token, id, {
        action: 'APPROVE',
      });

      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Approval failed.',
      );
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    if (!token) return;

    const reason = window.prompt('Reason for rejection:');
    if (!reason?.trim()) return;

    setBusy(id);

    try {
      await reviewStaffApplication(token, id, {
        action: 'REJECT',
        rejectionReason: reason.trim(),
      });

      await load();
    } finally {
      setBusy(null);
    }
  }

  if (user?.role !== 'SUPERADMIN') return null;

  return (
    <section id="staff-approvals" className="portal-section">
      <h2>Pending Staff Applications</h2>

      <button type="button" onClick={() => void load()}>
        Refresh
      </button>

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No verified staff applications are waiting.</p>
      ) : (
        <div className="staff-approval-grid">
          {items.map((item) => (
            <article key={item.id} className="staff-approval-card">
              <h3>
                {item.profile?.firstName}{' '}
                {item.profile?.lastName}
              </h3>

              <p>{item.email}</p>
              <p>Role: {item.role}</p>
              <p>Phone: {item.staffPhoneNumber}</p>
              <p>Email verified: Yes</p>

              <div className="staff-approval-actions">
                <button
                  disabled={busy === item.id}
                  onClick={() => void approve(item.id)}
                >
                  Approve
                </button>

                <button
                  disabled={busy === item.id}
                  onClick={() => void reject(item.id)}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
