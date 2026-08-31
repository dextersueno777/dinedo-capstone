'use client';

import { useEffect, useState } from 'react';
import type {
  AdminReservation,
  ReservationStatus,
} from '@/lib/api-types';
import {
  assignAdminReservationTables,
  getAdminReservations,
  reviewAdminReservation,
  updateAdminReservationStatus,
} from '@/lib/admin-reservation-api';
import { useAuth } from './auth-provider';

const filterStatuses: Array<ReservationStatus | 'ALL'> = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
  'ALL',
];

const reviewStatuses: ReservationStatus[] = ['APPROVED', 'REJECTED'];
const finalStatuses: ReservationStatus[] = ['CANCELLED', 'COMPLETED', 'NO_SHOW'];

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 'N/A';

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value));
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not yet';

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function parseTableIds(value: string) {
  return value
    .split(',')
    .map((tableId) => tableId.trim())
    .filter(Boolean);
}

export function AdminReservationPanel() {
  const { user, token } = useAuth();
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [filterStatus, setFilterStatus] =
    useState<ReservationStatus | 'ALL'>('PENDING');
  const [reviewStatusById, setReviewStatusById] =
    useState<Record<string, ReservationStatus>>({});
  const [finalStatusById, setFinalStatusById] =
    useState<Record<string, ReservationStatus>>({});
  const [tableIdsById, setTableIdsById] = useState<Record<string, string>>({});
  const [adminNotesById, setAdminNotesById] = useState<Record<string, string>>({});
  const [rejectionReasonById, setRejectionReasonById] =
    useState<Record<string, string>>({});
  const [cancellationReasonById, setCancellationReasonById] =
    useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function loadReservations() {
    if (!token || user?.role !== 'ADMIN') {
      setReservations([]);
      return;
    }

    setError('');

    try {
      const status = filterStatus === 'ALL' ? undefined : filterStatus;
      const loadedReservations = await getAdminReservations(token, status);

      setReservations(loadedReservations);

      const nextReview: Record<string, ReservationStatus> = {};
      const nextFinal: Record<string, ReservationStatus> = {};
      const nextTables: Record<string, string> = {};
      const nextNotes: Record<string, string> = {};
      const nextReject: Record<string, string> = {};
      const nextCancel: Record<string, string> = {};

      for (const reservation of loadedReservations) {
        nextReview[reservation.id] = 'APPROVED';
        nextFinal[reservation.id] = 'COMPLETED';
        nextTables[reservation.id] = reservation.tables
          .map((reservationTable) => reservationTable.table.id)
          .join(', ');
        nextNotes[reservation.id] = '';
        nextReject[reservation.id] = '';
        nextCancel[reservation.id] = '';
      }

      setReviewStatusById(nextReview);
      setFinalStatusById(nextFinal);
      setTableIdsById(nextTables);
      setAdminNotesById(nextNotes);
      setRejectionReasonById(nextReject);
      setCancellationReasonById(nextCancel);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load admin reservations.',
      );
    }
  }

  useEffect(() => {
    loadReservations();
  }, [token, user?.role, filterStatus]);

  async function handleReview(reservationId: string) {
    if (!token) return;

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const status = reviewStatusById[reservationId] ?? 'APPROVED';

      const updated = await reviewAdminReservation(token, reservationId, {
        status,
        tableIds:
          status === 'APPROVED'
            ? parseTableIds(tableIdsById[reservationId] ?? '')
            : undefined,
        adminNotes: adminNotesById[reservationId]?.trim() || undefined,
        rejectionReason:
          status === 'REJECTED'
            ? rejectionReasonById[reservationId]?.trim() ||
              'Rejected by admin.'
            : undefined,
      });

      setMessage(`Reservation reviewed: ${updated.reservationNumber}`);
      await loadReservations();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to review reservation.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAssignTables(reservationId: string) {
    if (!token) return;

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const updated = await assignAdminReservationTables(token, reservationId, {
        tableIds: parseTableIds(tableIdsById[reservationId] ?? ''),
      });

      setMessage(`Tables assigned: ${updated.reservationNumber}`);
      await loadReservations();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to assign reservation tables.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFinalStatus(reservationId: string) {
    if (!token) return;

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const status = finalStatusById[reservationId] ?? 'COMPLETED';

      const updated = await updateAdminReservationStatus(token, reservationId, {
        status,
        adminNotes: adminNotesById[reservationId]?.trim() || undefined,
        cancellationReason:
          status === 'CANCELLED'
            ? cancellationReasonById[reservationId]?.trim() ||
              'Cancelled by admin.'
            : undefined,
      });

      setMessage(`Reservation status updated: ${updated.reservationNumber}`);
      await loadReservations();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update reservation status.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section id="admin-reservations" className="card">
      <div className="admin-reservation-heading">
        <div>
          <p className="eyebrow">Admin Module</p>
          <h2>Reservation Management</h2>
          <p>Review table reservations, assign tables, and update reservation status.</p>
        </div>

        <button className="secondary" type="button" onClick={loadReservations}>
          Refresh
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {user?.role !== 'ADMIN' ? (
        <p>Login as an admin to manage reservations.</p>
      ) : null}

      {user?.role === 'ADMIN' ? (
        <label className="admin-reservation-filter">
          Filter Status
          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value as ReservationStatus | 'ALL')
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

      <div className="admin-reservation-list">
        {reservations.length === 0 && user?.role === 'ADMIN' ? (
          <p>No reservations found.</p>
        ) : null}

        {reservations.map((reservation) => {
          const assignedTables = reservation.tables;

          return (
            <article className="admin-reservation-card" key={reservation.id}>
              <div className="admin-reservation-card-header">
                <div>
                  <h3>{reservation.reservationNumber}</h3>
                  <p>Reserved For: {formatDate(reservation.reservedFor)}</p>
                </div>

                <span className="status-pill">{reservation.status}</span>
              </div>

              <div className="admin-reservation-summary-grid">
                <p><strong>Customer:</strong> {reservation.customerName}</p>
                <p><strong>Phone:</strong> {reservation.customerPhone}</p>
                <p><strong>Guests:</strong> {reservation.guestCount}</p>
                <p><strong>Branch:</strong> {reservation.branch.name}</p>
                <p><strong>Down Payment:</strong> {money(reservation.downPaymentAmount)}</p>
                <p><strong>Total Estimate:</strong> {money(reservation.totalEstimate)}</p>
              </div>

              {reservation.notes ? (
                <p><strong>Customer Notes:</strong> {reservation.notes}</p>
              ) : null}

              <div className="admin-reservation-tables">
                <h4>Assigned Tables</h4>

                {assignedTables.length === 0 ? (
                  <p>No tables assigned yet.</p>
                ) : null}

                {assignedTables.map((reservationTable) => (
                  <p key={reservationTable.table.id}>
                    {reservationTable.table.name} — Capacity {reservationTable.table.capacity}
                  </p>
                ))}
              </div>

              <div className="admin-reservation-actions">
                <label className="admin-reservation-field">
                  Review Decision
                  <select
                    value={reviewStatusById[reservation.id] ?? 'APPROVED'}
                    onChange={(event) =>
                      setReviewStatusById((current) => ({
                        ...current,
                        [reservation.id]: event.target.value as ReservationStatus,
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

                <label className="admin-reservation-field">
                  Table IDs
                  <input
                    value={tableIdsById[reservation.id] ?? ''}
                    onChange={(event) =>
                      setTableIdsById((current) => ({
                        ...current,
                        [reservation.id]: event.target.value,
                      }))
                    }
                    placeholder="Paste table IDs separated by comma"
                  />
                </label>

                <label className="admin-reservation-field">
                  Admin Notes
                  <input
                    value={adminNotesById[reservation.id] ?? ''}
                    onChange={(event) =>
                      setAdminNotesById((current) => ({
                        ...current,
                        [reservation.id]: event.target.value,
                      }))
                    }
                    placeholder="Optional admin notes"
                  />
                </label>

                <label className="admin-reservation-field">
                  Rejection Reason
                  <input
                    value={rejectionReasonById[reservation.id] ?? ''}
                    onChange={(event) =>
                      setRejectionReasonById((current) => ({
                        ...current,
                        [reservation.id]: event.target.value,
                      }))
                    }
                    placeholder="Required only when rejecting"
                  />
                </label>

                <button
                  className="secondary full-button"
                  type="button"
                  disabled={isBusy || reservation.status !== 'PENDING'}
                  onClick={() => handleReview(reservation.id)}
                >
                  Submit Review
                </button>

                <button
                  className="secondary full-button"
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleAssignTables(reservation.id)}
                >
                  Assign Tables
                </button>
              </div>

              <div className="admin-reservation-actions">
                <label className="admin-reservation-field">
                  Final Status
                  <select
                    value={finalStatusById[reservation.id] ?? 'COMPLETED'}
                    onChange={(event) =>
                      setFinalStatusById((current) => ({
                        ...current,
                        [reservation.id]: event.target.value as ReservationStatus,
                      }))
                    }
                  >
                    {finalStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-reservation-field">
                  Cancellation Reason
                  <input
                    value={cancellationReasonById[reservation.id] ?? ''}
                    onChange={(event) =>
                      setCancellationReasonById((current) => ({
                        ...current,
                        [reservation.id]: event.target.value,
                      }))
                    }
                    placeholder="Required only when cancelling"
                  />
                </label>

                <button
                  className="secondary full-button"
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleFinalStatus(reservation.id)}
                >
                  Update Final Status
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
