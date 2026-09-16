'use client';

import { useEffect, useState } from 'react';
import type { AdminRefund, RefundStatus } from '@/lib/api-types';
import {
  getAdminRefunds,
  updateAdminRefundStatus,
} from '@/lib/admin-refund-api';
import { useAuth } from './auth-provider';

const filterStatuses: Array<RefundStatus | 'ALL'> = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'CANCELLED',
  'ALL',
];

const actionStatuses: RefundStatus[] = [
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'CANCELLED',
];

function money(value: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return 'Not yet';
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AdminRefundPanel() {
  const { user, token } = useAuth();
  const [refunds, setRefunds] = useState<AdminRefund[]>([]);
  const [filterStatus, setFilterStatus] =
    useState<RefundStatus | 'ALL'>('PENDING');
  const [statusById, setStatusById] = useState<Record<string, RefundStatus>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [refById, setRefById] = useState<Record<string, string>>({});
  const [proofById, setProofById] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function loadRefunds() {
    if (!token || user?.role !== 'ADMIN') {
      setRefunds([]);
      return;
    }

    setError('');

    try {
      const status = filterStatus === 'ALL' ? undefined : filterStatus;
      const loaded = await getAdminRefunds(token, status);
      setRefunds(loaded);

      const nextStatus: Record<string, RefundStatus> = {};
      const nextNotes: Record<string, string> = {};
      const nextRefs: Record<string, string> = {};
      const nextProofs: Record<string, string> = {};

      for (const refund of loaded) {
        nextStatus[refund.id] =
          refund.status === 'PENDING' ? 'APPROVED' : refund.status;
        nextNotes[refund.id] = refund.adminNotes ?? '';
        nextRefs[refund.id] = refund.gcashReferenceNumber ?? '';
        nextProofs[refund.id] = refund.refundProofImageUrl ?? '';
      }

      setStatusById(nextStatus);
      setNotesById(nextNotes);
      setRefById(nextRefs);
      setProofById(nextProofs);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load refunds.',
      );
    }
  }

  useEffect(() => {
    loadRefunds();
  }, [token, user?.role, filterStatus]);

  async function handleUpdate(refund: AdminRefund) {
    if (!token) return;

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const nextStatus = statusById[refund.id] ?? 'APPROVED';
      const updated = await updateAdminRefundStatus(token, refund.id, {
        status: nextStatus,
        adminNotes: notesById[refund.id]?.trim() || undefined,
        gcashReferenceNumber: refById[refund.id]?.trim() || undefined,
        refundProofImageUrl: proofById[refund.id]?.trim() || undefined,
      });

      setMessage(`Refund updated for ${updated.order.orderNumber}.`);
      await loadRefunds();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update refund.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section id="admin-refunds" className="card">
      <div className="admin-payment-proof-heading">
        <div>
          <p className="eyebrow">Admin Module</p>
          <h2>Refund Management</h2>
          <p>Review and process manual GCash refunds for cancelled paid orders.</p>
        </div>

        <button className="secondary" type="button" onClick={loadRefunds}>
          Refresh
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {user?.role !== 'ADMIN' ? (
        <p>Login as an admin to manage refunds.</p>
      ) : null}

      {user?.role === 'ADMIN' ? (
        <label className="admin-payment-proof-filter">
          Filter Status
          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value as RefundStatus | 'ALL')
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
        {refunds.length === 0 && user?.role === 'ADMIN' ? (
          <p>No refunds found.</p>
        ) : null}

        {refunds.map((refund) => (
          <article className="admin-payment-proof-card" key={refund.id}>
            <div className="admin-payment-proof-card-header">
              <div>
                <h3>{refund.order.orderNumber}</h3>
                <p>Requested: {formatDate(refund.requestedAt)}</p>
              </div>

              <span className="status-pill">{refund.status}</span>
            </div>

            <div className="admin-payment-proof-summary-grid">
              <p><strong>Customer:</strong> {refund.customer.email}</p>
              <p><strong>Amount:</strong> {money(refund.amount)}</p>
              <p><strong>Method:</strong> {refund.method}</p>
              <p><strong>Order Status:</strong> {refund.order.status}</p>
              <p><strong>Payment State:</strong> {refund.order.paymentState}</p>
              <p><strong>Processed:</strong> {formatDate(refund.processedAt)}</p>
              <p><strong>Completed:</strong> {formatDate(refund.completedAt)}</p>
              <p><strong>GCash Ref:</strong> {refund.gcashReferenceNumber ?? 'None'}</p>
            </div>

            <p><strong>Reason:</strong> {refund.reason}</p>

            <div className="admin-payment-proof-review">
              <label className="admin-payment-proof-field">
                Refund Decision
                <select
                  value={statusById[refund.id] ?? 'APPROVED'}
                  onChange={(event) =>
                    setStatusById((current) => ({
                      ...current,
                      [refund.id]: event.target.value as RefundStatus,
                    }))
                  }
                >
                  {actionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-payment-proof-field">
                Admin Notes
                <input
                  value={notesById[refund.id] ?? ''}
                  onChange={(event) =>
                    setNotesById((current) => ({
                      ...current,
                      [refund.id]: event.target.value,
                    }))
                  }
                  placeholder="Example: Refund approved after incident."
                />
              </label>

              <label className="admin-payment-proof-field">
                GCash Refund Reference
                <input
                  value={refById[refund.id] ?? ''}
                  onChange={(event) =>
                    setRefById((current) => ({
                      ...current,
                      [refund.id]: event.target.value,
                    }))
                  }
                  placeholder="Required when completing refund."
                />
              </label>

              <label className="admin-payment-proof-field">
                Refund Proof Image URL
                <input
                  value={proofById[refund.id] ?? ''}
                  onChange={(event) =>
                    setProofById((current) => ({
                      ...current,
                      [refund.id]: event.target.value,
                    }))
                  }
                  placeholder="Optional screenshot/proof URL."
                />
              </label>

              <button
                className="secondary full-button"
                type="button"
                disabled={
                  isBusy ||
                  refund.status === 'COMPLETED' ||
                  refund.status === 'CANCELLED'
                }
                onClick={() => handleUpdate(refund)}
              >
                Update Refund
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
