'use client';

import { useEffect, useState } from 'react';
import type {
  DeliveryStatus,
  ProofOfDeliveryType,
  RiderDelivery,
} from '@/lib/api-types';
import {
  acceptRiderDelivery,
  captureProofOfDelivery,
  getRiderDeliveries,
  rejectRiderDelivery,
  reportRiderDeliveryIssue,
  updateRiderDeliveryStatus,
} from '@/lib/rider-delivery-api';
import { useAuth } from './auth-provider';

const progressStatuses: DeliveryStatus[] = [
  'OUT_FOR_DELIVERY',
  'ARRIVED',
  'DELIVERED',
  'FAILED',
];

const proofTypes: ProofOfDeliveryType[] = ['PHOTO', 'SIGNATURE'];

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

function showSnapshot(value: unknown) {
  if (!value) {
    return 'Not provided';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

function canUpdateProgress(status: DeliveryStatus) {
  return ['ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(status);
}

function canCaptureProof(status: DeliveryStatus) {
  return ['OUT_FOR_DELIVERY', 'ARRIVED'].includes(status);
}

export function RiderDeliveryPanel() {
  const { user, token } = useAuth();
  const [deliveries, setDeliveries] = useState<RiderDelivery[]>([]);
  const [statusById, setStatusById] = useState<Record<string, DeliveryStatus>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});
  const [issueTitleById, setIssueTitleById] = useState<Record<string, string>>({});
  const [issueDescriptionById, setIssueDescriptionById] = useState<Record<string, string>>({});
  const [proofTypeById, setProofTypeById] = useState<Record<string, ProofOfDeliveryType>>({});
  const [proofUrlById, setProofUrlById] = useState<Record<string, string>>({});
  const [proofNotesById, setProofNotesById] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function loadDeliveries() {
    if (!token || user?.role !== 'RIDER') {
      setDeliveries([]);
      return;
    }

    setError('');

    try {
      const loadedDeliveries = await getRiderDeliveries(token);
      setDeliveries(loadedDeliveries);

      const nextStatus: Record<string, DeliveryStatus> = {};
      const nextProofType: Record<string, ProofOfDeliveryType> = {};

      for (const delivery of loadedDeliveries) {
        if (delivery.status === 'ACCEPTED') {
          nextStatus[delivery.id] = 'OUT_FOR_DELIVERY';
        } else if (delivery.status === 'OUT_FOR_DELIVERY') {
          nextStatus[delivery.id] = 'ARRIVED';
        } else if (delivery.status === 'ARRIVED') {
          nextStatus[delivery.id] = 'DELIVERED';
        } else {
          nextStatus[delivery.id] = 'OUT_FOR_DELIVERY';
        }

        nextProofType[delivery.id] = 'PHOTO';
      }

      setStatusById(nextStatus);
      setProofTypeById(nextProofType);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load rider deliveries.',
      );
    }
  }

  useEffect(() => {
    loadDeliveries();
  }, [token, user?.role]);

  async function runAction(
    action: () => Promise<RiderDelivery>,
    success: string,
  ) {
    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const updated = await action();
      setMessage(`${success}: ${updated.order.orderNumber}`);
      await loadDeliveries();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update rider delivery.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  function handleAccept(deliveryId: string) {
    if (!token) return;

    runAction(
      () => acceptRiderDelivery(token, deliveryId),
      'Delivery accepted',
    );
  }

  function handleReject(deliveryId: string) {
    if (!token) return;

    runAction(
      () =>
        rejectRiderDelivery(token, deliveryId, {
          reason:
            rejectReasonById[deliveryId]?.trim() ||
            'Rejected by rider.',
        }),
      'Delivery rejected',
    );
  }

  function handleProgress(deliveryId: string) {
    if (!token) return;

    runAction(
      () =>
        updateRiderDeliveryStatus(token, deliveryId, {
          status: statusById[deliveryId],
          notes: notesById[deliveryId]?.trim() || undefined,
        }),
      'Delivery status updated',
    );
  }

  function handleIssue(deliveryId: string) {
    if (!token) return;

    runAction(
      () =>
        reportRiderDeliveryIssue(token, deliveryId, {
          title: issueTitleById[deliveryId]?.trim() || 'Delivery issue',
          description:
            issueDescriptionById[deliveryId]?.trim() ||
            'Issue reported by rider.',
        }),
      'Delivery issue reported',
    );
  }

  function handleProof(deliveryId: string) {
    if (!token) return;

    const proofType = proofTypeById[deliveryId] ?? 'PHOTO';
    const proofUrl =
      proofUrlById[deliveryId]?.trim() || 'http://localhost/proof.jpg';

    runAction(
      () =>
        captureProofOfDelivery(token, deliveryId, {
          type: proofType,
          imageUrl: proofType === 'PHOTO' ? proofUrl : undefined,
          signatureUrl: proofType === 'SIGNATURE' ? proofUrl : undefined,
          notes: proofNotesById[deliveryId]?.trim() || undefined,
        }),
      'Proof of delivery captured',
    );
  }

  return (
    <section id="rider-deliveries" className="card">
      <div className="rider-delivery-heading">
        <div>
          <p className="eyebrow">Rider Module</p>
          <h2>Rider Delivery Management</h2>
          <p>Accept assigned deliveries, update progress, report issues, and capture proof.</p>
        </div>

        <button className="secondary" type="button" onClick={loadDeliveries}>
          Refresh
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {user?.role !== 'RIDER' ? (
        <p>Login as a rider account to manage assigned deliveries.</p>
      ) : null}

      <div className="rider-delivery-list">
        {deliveries.length === 0 && user?.role === 'RIDER' ? (
          <p>No assigned deliveries found.</p>
        ) : null}

        {deliveries.map((delivery) => (
          <article className="rider-delivery-card" key={delivery.id}>
            <div className="rider-delivery-card-header">
              <div>
                <h3>{delivery.order.orderNumber}</h3>
                <p>Assigned: {formatDate(delivery.assignedAt)}</p>
              </div>

              <span className="status-pill">{delivery.status}</span>
            </div>

            <div className="rider-delivery-summary-grid">
              <p><strong>Order Status:</strong> {delivery.order.status}</p>
              <p><strong>Payment:</strong> {delivery.order.paymentMethod}</p>
              <p><strong>Payment State:</strong> {delivery.order.paymentState}</p>
              <p><strong>Total:</strong> {money(delivery.order.totalAmount)}</p>
              <p><strong>COD to Collect:</strong> {money(delivery.codAmountToCollect)}</p>
              <p><strong>Delivery Fee:</strong> {money(delivery.deliveryFeeAmount)}</p>
            </div>

            <div className="rider-delivery-address">
              <p><strong>Navigation Address:</strong></p>
              <p>{showSnapshot(delivery.navigationAddress)}</p>
            </div>

            <div className="rider-delivery-address">
              <p><strong>Customer Contact:</strong></p>
              <p>{showSnapshot(delivery.customerContactSnapshot)}</p>
            </div>

            <div className="rider-delivery-actions">
              <button
                className="secondary full-button"
                type="button"
                disabled={isBusy || delivery.status !== 'ASSIGNED'}
                onClick={() => handleAccept(delivery.id)}
              >
                Accept Delivery
              </button>

              <label className="rider-delivery-field">
                Rejection Reason
                <input
                  value={rejectReasonById[delivery.id] ?? ''}
                  onChange={(event) =>
                    setRejectReasonById((current) => ({
                      ...current,
                      [delivery.id]: event.target.value,
                    }))
                  }
                  placeholder="Example: Out of duty or unsafe road."
                />
              </label>

              <button
                className="secondary full-button"
                type="button"
                disabled={isBusy || delivery.status !== 'ASSIGNED'}
                onClick={() => handleReject(delivery.id)}
              >
                Reject Delivery
              </button>
            </div>

            <div className="rider-delivery-actions">
              <label className="rider-delivery-field">
                Delivery Progress
                <select
                  value={statusById[delivery.id] ?? 'OUT_FOR_DELIVERY'}
                  onChange={(event) =>
                    setStatusById((current) => ({
                      ...current,
                      [delivery.id]: event.target.value as DeliveryStatus,
                    }))
                  }
                >
                  {progressStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rider-delivery-field">
                Progress Notes
                <input
                  value={notesById[delivery.id] ?? ''}
                  onChange={(event) =>
                    setNotesById((current) => ({
                      ...current,
                      [delivery.id]: event.target.value,
                    }))
                  }
                  placeholder="Example: Rider arrived."
                />
              </label>

              <button
                className="secondary full-button"
                type="button"
                disabled={isBusy || !canUpdateProgress(delivery.status)}
                onClick={() => handleProgress(delivery.id)}
              >
                Update Delivery Progress
              </button>
            </div>

            <div className="rider-delivery-actions">
              <label className="rider-delivery-field">
                Issue Title
                <input
                  value={issueTitleById[delivery.id] ?? ''}
                  onChange={(event) =>
                    setIssueTitleById((current) => ({
                      ...current,
                      [delivery.id]: event.target.value,
                    }))
                  }
                  placeholder="Example: Weather delay"
                />
              </label>

              <label className="rider-delivery-field">
                Issue Description
                <input
                  value={issueDescriptionById[delivery.id] ?? ''}
                  onChange={(event) =>
                    setIssueDescriptionById((current) => ({
                      ...current,
                      [delivery.id]: event.target.value,
                    }))
                  }
                  placeholder="Describe the issue."
                />
              </label>

              <button
                className="secondary full-button"
                type="button"
                disabled={isBusy}
                onClick={() => handleIssue(delivery.id)}
              >
                Report Delivery Issue
              </button>
            </div>

            <div className="rider-delivery-actions">
              <label className="rider-delivery-field">
                Proof Type
                <select
                  value={proofTypeById[delivery.id] ?? 'PHOTO'}
                  onChange={(event) =>
                    setProofTypeById((current) => ({
                      ...current,
                      [delivery.id]: event.target.value as ProofOfDeliveryType,
                    }))
                  }
                >
                  {proofTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rider-delivery-field">
                Proof URL
                <input
                  value={proofUrlById[delivery.id] ?? ''}
                  onChange={(event) =>
                    setProofUrlById((current) => ({
                      ...current,
                      [delivery.id]: event.target.value,
                    }))
                  }
                  placeholder="http://localhost/proof.jpg"
                />
              </label>

              <label className="rider-delivery-field">
                Proof Notes
                <input
                  value={proofNotesById[delivery.id] ?? ''}
                  onChange={(event) =>
                    setProofNotesById((current) => ({
                      ...current,
                      [delivery.id]: event.target.value,
                    }))
                  }
                  placeholder="Example: Received by customer."
                />
              </label>

              <button
                className="secondary full-button"
                type="button"
                disabled={isBusy || !canCaptureProof(delivery.status)}
                onClick={() => handleProof(delivery.id)}
              >
                Capture Proof of Delivery
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
