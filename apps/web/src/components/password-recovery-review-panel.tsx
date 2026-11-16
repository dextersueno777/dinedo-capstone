'use client';

import { useEffect, useState } from 'react';
import {
  getPasswordRecoveryReviews,
  reviewPasswordRecovery,
  type PasswordRecoveryReview,
} from '@/lib/auth-api';
import { useAuth } from './auth-provider';

export function PasswordRecoveryReviewPanel() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<PasswordRecoveryReview[]>([]);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    if (
      !token ||
      (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN')
    ) {
      setRequests([]);
      return;
    }

    try {
      setError('');
      setRequests(await getPasswordRecoveryReviews(token));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to load recovery requests.',
      );
    }
  }

  useEffect(() => {
    void load();
  }, [token, user?.role]);

  async function review(
    id: string,
    decision: 'APPROVE' | 'REJECT',
  ) {
    if (!token) return;

    const reason = reasonById[id]?.trim();

    if (decision === 'REJECT' && !reason) {
      setError('Enter a reason before rejecting the request.');
      return;
    }

    setBusyId(id);
    setMessage('');
    setError('');

    try {
      const result = await reviewPasswordRecovery(
        token,
        id,
        { decision, reason: reason || undefined },
      );

      setMessage(result.message);
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to review recovery request.',
      );
    } finally {
      setBusyId('');
    }
  }

  return (
    <section id="password-recovery-review" className="card">
      <p className="eyebrow">Account Security</p>
      <h2>Password Recovery Requests</h2>
      <p>
        These users already passed all three saved security
        questions. Review their stated reason before approving.
      </p>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {requests.length === 0 ? (
        <p>No pending password recovery requests.</p>
      ) : (
        requests.map((request) => {
          const name = request.user.profile
            ? `${request.user.profile.firstName} ${request.user.profile.lastName}`
            : request.user.email;

          return (
            <article className="card recovery-request-card" key={request.id}>
              <h3>{name}</h3>

              <p>
                <strong>Email:</strong> {request.user.email}
              </p>
              <p>
                <strong>Role:</strong> {request.user.role}
              </p>

              {request.user.workerId ? (
                <p>
                  <strong>Worker ID:</strong> {request.user.workerId}
                </p>
              ) : null}

              <p className="recovery-identity">
                <strong>Identity verified</strong>{' '}
                {request.identityCheck.passed} of{' '}
                {request.identityCheck.total} answers passed
              </p>

              <div className="recovery-reason">
                <strong>Recovery reason</strong>
                <p>{request.reason}</p>
              </div>

              <label className="recovery-review-note">
                Review note or rejection reason
                <textarea
                  maxLength={500}
                  value={reasonById[request.id] ?? ''}
                  onChange={(e) =>
                    setReasonById((current) => ({
                      ...current,
                      [request.id]: e.target.value,
                    }))
                  }
                />
              </label>

              <div className="button-row recovery-actions">
                <button
                  type="button"
                  className="primary"
                  disabled={busyId === request.id}
                  onClick={() => void review(request.id, 'APPROVE')}
                >
                  Approve
                </button>

                <button
                  type="button"
                  className="danger-button"
                  disabled={busyId === request.id}
                  onClick={() => void review(request.id, 'REJECT')}
                >
                  Reject
                </button>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
