'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import type { Branch, Reservation } from '@/lib/api-types';
import {
  cancelReservation,
  createReservation,
  getMyReservations,
} from '@/lib/reservation-api';
import {
  getReservationDepositProofs,
  submitReservationDepositProof,
  type ReservationDepositProof,
} from '@/lib/reservation-deposit-api';
import { getBranchByCode } from '@/lib/branches-api';
import { formatBranchTime } from '@/lib/branch-hours';
import { useAuth } from './auth-provider';
import { formatDateTimePH, getManilaDatetimeLocalValue, manilaDatetimeLocalToIso } from '@/lib/ph-time';

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Unable to read receipt image.'));

    reader.onerror = () => reject(new Error('Unable to read receipt image.'));
    reader.readAsDataURL(file);
  });
}

function formatDateTime(value: string) {
  return formatDateTimePH(value);
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase();
}

function getDefaultReservedFor() {
  return getManilaDatetimeLocalValue(1, 12, 0);
}

export function ReservationPanel() {
  const { user, token } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [depositProofs, setDepositProofs] =
    useState<Record<string, ReservationDepositProof | null>>({});
  const [reservedFor, setReservedFor] = useState(getDefaultReservedFor());
  const [guestCount, setGuestCount] = useState('2');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingType, setBookingType] = useState('');
  const [notes, setNotes] = useState('');
  const [depositReservationId, setDepositReservationId] = useState('');
  const [depositProofImageUrl, setDepositProofImageUrl] = useState('');
  const [depositReceiptFileName, setDepositReceiptFileName] = useState('');
  const [depositReferenceNumber, setDepositReferenceNumber] = useState('');
  const [depositPayerName, setDepositPayerName] = useState('');
  const [depositAccountLast4, setDepositAccountLast4] = useState('');
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation.');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function loadReservations() {
    if (!token || user?.role !== 'CUSTOMER') {
      setReservations([]);
      return;
    }

    setError('');

    try {
      const loaded = await getMyReservations(token);
      setReservations(loaded);

      const proofEntries = await Promise.all(
        loaded.map(async (reservation) => {
          if (!reservation.depositRequired) {
            return [reservation.id, null] as const;
          }

          const proofs = await getReservationDepositProofs(
            token,
            reservation.id,
          );

          return [reservation.id, proofs[0] ?? null] as const;
        }),
      );

      setDepositProofs(Object.fromEntries(proofEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load reservations.',
      );
    }
  }

  async function handleDepositReceiptChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a GCash receipt image.');
      event.target.value = '';
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Receipt image must be 4 MB or smaller.');
      event.target.value = '';
      return;
    }

    try {
      setDepositProofImageUrl(await fileToDataUrl(file));
      setDepositReceiptFileName(file.name);
      setError('');
    } catch {
      setError('Unable to read receipt image.');
    }
  }

  async function handleDepositSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !depositReservationId) {
      setError('Please select a reservation.');
      return;
    }

    if (!depositProofImageUrl) {
      setError('Please upload your GCash receipt.');
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const proof = await submitReservationDepositProof(
        token,
        depositReservationId,
        {
          proofImageUrl: depositProofImageUrl,
          gcashReferenceNumber: depositReferenceNumber.trim() || undefined,
          payerName: depositPayerName.trim() || undefined,
          payerAccountLast4: depositAccountLast4.trim() || undefined,
        },
      );

      setMessage(`Deposit proof submitted. Status: ${proof.status}`);
      setDepositReservationId('');
      setDepositProofImageUrl('');
      setDepositReceiptFileName('');
      setDepositReferenceNumber('');
      setDepositPayerName('');
      setDepositAccountLast4('');
      await loadReservations();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to submit deposit proof.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError('Please login before creating a reservation.');
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const reservation = await createReservation(token, {
        branchCode: 'TINOC',
        reservedFor: manilaDatetimeLocalToIso(reservedFor),
        guestCount: Number(guestCount),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        bookingType: bookingType.trim(),
        notes: notes.trim() || undefined,
      });

      setMessage(`Reservation created: ${reservation.reservationNumber}`);
      setBookingType('');
      setNotes('');
      await loadReservations();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to create reservation.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCancelReservation(reservationId: string) {
    if (!token) {
      setError('Please login before cancelling a reservation.');
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const reservation = await cancelReservation(token, reservationId, {
        cancellationReason: cancelReason.trim(),
      });

      setMessage(`Reservation cancelled: ${reservation.reservationNumber}`);
      await loadReservations();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to cancel reservation.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getBranchByCode('TINOC')
      .then((loadedBranch) => {
        if (!cancelled) setBranch(loadedBranch);
      })
      .catch(() => {
        if (!cancelled) setBranch(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadReservations();
  }, [token, user?.id]);

  return (
    <section id="reservations" className="card reservation-card">
      <div className="reservation-heading">
        <div>
          <p className="eyebrow">Reservations</p>
          <h2>Reserve a table</h2>
          <p>
            Book a dine-in table for the Tinoc branch within operating hours.
          </p>
        </div>

        <div className="reservation-info-card">
          <span>Branch Hours</span>
          <strong>
            {formatBranchTime(branch?.settings?.orderingOpenTime ?? '07:00')} -{' '}
            {formatBranchTime(branch?.settings?.orderingCloseTime ?? '22:00')}
          </strong>
          <small>Tinoc Branch</small>
        </div>
      </div>

      <div className="reservation-tips">
        <span>📅 Pick date and time</span>
        <span>👥 Add guest count</span>
        <span>📝 Add table notes</span>
        <span>✅ Wait for admin review</span>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!user ? (
        <div className="empty-reservation-state">
          <span aria-hidden="true">📅</span>
          <h3>Sign in to reserve a table</h3>
          <p>Customer login is required before creating a reservation.</p>
        </div>
      ) : null}

      {user ? (
        <form className="reservation-form reservation-form-polished" onSubmit={handleCreateReservation}>
          <label>
            Reservation Date and Time
            <input
              type="datetime-local"
              value={reservedFor}
              onChange={(event) => setReservedFor(event.target.value)}
              required
            />
          </label>

          <label>
            Number of Guests
            <input
              type="number"
              min="1"
              max="50"
              value={guestCount}
              onChange={(event) => setGuestCount(event.target.value)}
              required
            />
          </label>

          <label>
            Customer Name
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              required
            />
          </label>

          <label>
            Customer Phone
            <input
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              required
            />
          </label>

          <label>
            Booking Type / Occasion
            <input
              value={bookingType}
              maxLength={120}
              placeholder="Example: Regular dining, Birthday, Wedding, Meeting"
              onChange={(event) => setBookingType(event.target.value)}
              required
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional request or table notes"
            />
          </label>

          <button type="submit" disabled={isBusy}>
            {isBusy ? 'Saving...' : 'Create Reservation'}
          </button>
        </form>
      ) : null}

      {user ? (
        <label className="cancel-reason-field">
          Cancellation Reason
          <input
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
          />
        </label>
      ) : null}

      <div className="reservation-list reservation-list-polished">
        <div className="reservation-list-heading">
          <h3>My Reservations</h3>
          <p>Track submitted table reservation requests and their status.</p>
        </div>

        {reservations.length === 0 ? (
          <div className="empty-reservation-state">
            <span aria-hidden="true">🍽️</span>
            <h3>No reservations yet</h3>
            <p>Your table reservations will appear here after submission.</p>
          </div>
        ) : null}

        {reservations.map((reservation) => (
          <article className="reservation-item" key={reservation.id}>
            <div className="reservation-item-header">
              <div>
                <h4>{reservation.reservationNumber}</h4>
                <p>{formatDateTime(reservation.reservedFor)}</p>
              </div>

              <span className="status-pill">{formatLabel(reservation.status)}</span>
            </div>

            <p>
              <strong>Guest Count:</strong> {reservation.guestCount}
            </p>
            <p>
              <strong>Name:</strong> {reservation.customerName}
            </p>
            <p>
              <strong>Phone:</strong> {reservation.customerPhone}
            </p>

            {reservation.bookingType ? (
              <p>
                <strong>Booking Type:</strong> {reservation.bookingType}
              </p>
            ) : null}

            {reservation.depositRequired ? (
              <div className="reservation-deposit-notice">
                <p>
                  <strong>Reservation Deposit Required:</strong>{' '}
                  {new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP',
                  }).format(Number(reservation.downPaymentAmount))}
                </p>
                <p>
                  Submit your GCash deposit proof while this reservation is pending.
                </p>
              </div>
            ) : null}

            {depositProofs[reservation.id]?.status === 'PENDING_REVIEW' ? (
              <p>
                <strong>Deposit Proof:</strong> Waiting for owner verification
              </p>
            ) : null}

            {depositProofs[reservation.id]?.status === 'APPROVED' ? (
              <p>
                <strong>Deposit Proof:</strong> Approved
              </p>
            ) : null}

            {depositProofs[reservation.id]?.status === 'REJECTED' ? (
              <p>
                <strong>Deposit Proof:</strong> Rejected
                {depositProofs[reservation.id]?.rejectionReason
                  ? `, ${depositProofs[reservation.id]?.rejectionReason}`
                  : ', please submit a corrected proof.'}
              </p>
            ) : null}

            {reservation.depositRequired &&
            reservation.status === 'PENDING' &&
            (!depositProofs[reservation.id] ||
              depositProofs[reservation.id]?.status === 'REJECTED') ? (
              <form
                className="auth-form reservation-deposit-form"
                onSubmit={handleDepositSubmit}
              >
                <input
                  type="hidden"
                  value={reservation.id}
                  readOnly
                />

                <label>
                  GCash Receipt
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) => {
                      setDepositReservationId(reservation.id);
                      void handleDepositReceiptChange(event);
                    }}
                    required={!depositProofImageUrl}
                  />
                </label>

                {depositReceiptFileName ? (
                  <p>Selected: {depositReceiptFileName}</p>
                ) : null}

                <label>
                  GCash Reference Number
                  <input
                    type="text"
                    value={depositReferenceNumber}
                    maxLength={80}
                    onChange={(event) => {
                      setDepositReservationId(reservation.id);
                      setDepositReferenceNumber(event.target.value);
                    }}
                  />
                </label>

                <label>
                  Payer Name
                  <input
                    type="text"
                    value={depositPayerName}
                    maxLength={120}
                    onChange={(event) => {
                      setDepositReservationId(reservation.id);
                      setDepositPayerName(event.target.value);
                    }}
                  />
                </label>

                <label>
                  Last 4 Digits of GCash Number
                  <input
                    type="text"
                    inputMode="numeric"
                    value={depositAccountLast4}
                    maxLength={4}
                    onChange={(event) => {
                      setDepositReservationId(reservation.id);
                      setDepositAccountLast4(
                        event.target.value.replace(/\D/g, '').slice(0, 4),
                      );
                    }}
                  />
                </label>

                <button
                  className="primary full-button"
                  type="submit"
                  disabled={isBusy}
                  onClick={() => setDepositReservationId(reservation.id)}
                >
                  Submit GCash Deposit Proof
                </button>
              </form>
            ) : null}

            {reservation.notes ? (
              <p>
                <strong>Notes:</strong> {reservation.notes}
              </p>
            ) : null}

            {reservation.tables.length > 0 ? (
              <p>
                <strong>Tables:</strong>{' '}
                {reservation.tables
                  .map((item) => item.table.name)
                  .join(', ')}
              </p>
            ) : null}

            {reservation.status !== 'REJECTED' &&
            reservation.status !== 'CANCELLED' &&
            reservation.status !== 'COMPLETED' &&
            reservation.status !== 'NO_SHOW' ? (
              <button
                className="secondary full-button"
                type="button"
                disabled={isBusy}
                onClick={() => handleCancelReservation(reservation.id)}
              >
                Cancel Reservation
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
