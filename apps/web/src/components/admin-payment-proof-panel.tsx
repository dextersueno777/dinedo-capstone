'use client';

import { useEffect, useState } from 'react';
import type {
  AdminPaymentProof,
  PaymentProofStatus,
} from '@/lib/api-types';
import {
  getAdminPaymentProofs,
  reviewAdminPaymentProof,
} from '@/lib/admin-payment-proof-api';
import { useAuth } from './auth-provider';

const filterStatuses: Array<PaymentProofStatus | 'ALL'> = [
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'ALL',
];

const reviewStatuses: PaymentProofStatus[] = [
  'APPROVED',
  'REJECTED',
];

function money(value: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not yet';
  }

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AdminPaymentProofPanel() {
  const { user, token } = useAuth();
  const [proofs, setProofs] = useState<AdminPaymentProof[]>([]);
  const [filterStatus, setFilterStatus] =
    useState<PaymentProofStatus | 'ALL'>('PENDING_REVIEW');
  const [reviewStatusById, setReviewStatusById] =
    useState<Record<string, PaymentProofStatus>>({});
  const [reviewNotesById, setReviewNotesById] =
    useState<Record<string, string>>({});
  const [rejectionReasonById, setRejectionReasonById] =
    useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function loadProofs() {
    if (!token || user?.role !== 'ADMIN') {
      setProofs([]);
      return;
    }

    setError('');

    try {
      const status = filterStatus === 'ALL' ? undefined : filterStatus;
      const loadedProofs = await getAdminPaymentProofs(token, status);
      setProofs(loadedProofs);

      const nextStatus: Record<string, PaymentProofStatus> = {};
      const nextNotes: Record<string, string> = {};
      const nextReason: Record<string, string> = {};

      for (const proof of loadedProofs) {
        nextStatus[proof.id] =
          proof.status === 'PENDING_REVIEW' ? 'APPROVED' : proof.status;
        nextNotes[proof.id] = '';
        nextReason[proof.id] = '';
      }

      setReviewStatusById(nextStatus);
      setReviewNotesById(nextNotes);
      setRejectionReasonById(nextReason);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load payment proofs.',
      );
    }
  }

  useEffect(() => {
    loadProofs();
  }, [token, user?.role, filterStatus]);

  async function handleReview(proofId: string) {
    if (!token) {
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const reviewStatus = reviewStatusById[proofId];
      const reviewedProof = await reviewAdminPaymentProof(token, proofId, {
        status: reviewStatus,
        reviewNotes: reviewNotesById[proofId]?.trim() || undefined,
        rejectionReason:
          reviewStatus === 'REJECTED'
            ? rejectionReasonById[proofId]?.trim() || 'Rejected by admin.'
            : undefined,
      });

      setMessage(`Payment proof reviewed: ${reviewedProof.order.orderNumber}`);
      await loadProofs();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to review payment proof.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section id="admin-payment-proofs" className="card">
      <div className="admin-payment-proof-heading">
        <div>
          <p className="eyebrow">Admin Module</p>
          <h2>Payment Proof Review</h2>
          <p>Review uploaded GCash receipts and approve or reject manual payments.</p>
        </div>

        <button className="secondary" type="button" onClick={loadProofs}>
          Refresh
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {user?.role !== 'ADMIN' ? (
        <p>Login as an admin to review payment proofs.</p>
      ) : null}

      {user?.role === 'ADMIN' ? (
        <label className="admin-payment-proof-filter">
          Filter Status
          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value as PaymentProofStatus | 'ALL')
            }
          >
            {filterStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="admin-payment-proof-list">
        {proofs.length === 0 && user?.role === 'ADMIN' ? (
          <p>No payment proofs found.</p>
        ) : null}

        {proofs.map((proof) => (
          <article className="admin-payment-proof-card" key={proof.id}>
            <div className="admin-payment-proof-card-header">
              <div>
                <h3>{proof.order.orderNumber}</h3>
                <p>Submitted: {formatDate(proof.submittedAt)}</p>
              </div>

              <span className="status-pill">{proof.status}</span>
            </div>

            <div className="admin-payment-proof-summary-grid">
              <p><strong>Uploaded By:</strong> {proof.uploadedBy.email}</p>
              <p><strong>Amount:</strong> {money(proof.amount)}</p>
              <p><strong>Order Total:</strong> {money(proof.order.totalAmount)}</p>
              <p><strong>GCash Ref:</strong> {proof.gcashReferenceNumber}</p>
              <p><strong>Payer:</strong> {proof.payerName}</p>
              <p><strong>Last 4:</strong> {proof.payerAccountLast4 ?? 'N/A'}</p>
              <p><strong>Order Status:</strong> {proof.order.status}</p>
              <p><strong>Payment State:</strong> {proof.order.paymentState}</p>
            </div>

            <div className="admin-payment-proof-image">
              <p><strong>Proof Image URL:</strong></p>
              <a href={proof.proofImageUrl} target="_blank">
                {proof.proofImageUrl}
              </a>
            </div>

            <div className="admin-payment-proof-review">
              <label className="admin-payment-proof-field">
                Review Decision
                <select
                  value={reviewStatusById[proof.id] ?? 'APPROVED'}
                  onChange={(event) =>
                    setReviewStatusById((current) => ({
                      ...current,
                      [proof.id]: event.target.value as PaymentProofStatus,
                    }))
                  }
                >
                  {reviewStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-payment-proof-field">
                Review Notes
                <input
                  value={reviewNotesById[proof.id] ?? ''}
                  onChange={(event) =>
                    setReviewNotesById((current) => ({
                      ...current,
                      [proof.id]: event.target.value,
                    }))
                  }
                  placeholder="Example: GCash receipt verified."
                />
              </label>

              <label className="admin-payment-proof-field">
                Rejection Reason
                <input
                  value={rejectionReasonById[proof.id] ?? ''}
                  onChange={(event) =>
                    setRejectionReasonById((current) => ({
                      ...current,
                      [proof.id]: event.target.value,
                    }))
                  }
                  placeholder="Required only when rejecting."
                />
              </label>

              <button
                className="secondary full-button"
                type="button"
                disabled={isBusy || proof.status !== 'PENDING_REVIEW'}
                onClick={() => handleReview(proof.id)}
              >
                Submit Review
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
