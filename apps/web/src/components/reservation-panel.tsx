'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Reservation } from '@/lib/api-types';
import {
  cancelReservation,
  createReservation,
  getMyReservations,
} from '@/lib/reservation-api';
import { useAuth } from './auth-provider';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getDefaultReservedFor() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(12, 0, 0, 0);

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function ReservationPanel() {
  const { user, token } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservedFor, setReservedFor] = useState(getDefaultReservedFor());
  const [guestCount, setGuestCount] = useState('2');
  const [customerName, setCustomerName] = useState('Demo Customer');
  const [customerPhone, setCustomerPhone] = useState('09123456789');
  const [notes, setNotes] = useState('');
  const [totalEstimate, setTotalEstimate] = useState('');
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
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load reservations.',
      );
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
        reservedFor: new Date(reservedFor).toISOString(),
        guestCount: Number(guestCount),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim() || undefined,
        totalEstimate: totalEstimate ? Number(totalEstimate) : undefined,
      });

      setMessage(`Reservation created: ${reservation.reservationNumber}`);
      setNotes('');
      setTotalEstimate('');
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
    loadReservations();
  }, [token, user?.id]);

  return (
    <section id="reservations" className="card">
      <p className="eyebrow">Customer Module</p>
      <h2>Table Reservation</h2>
      <p>
        Create a table reservation for the Tinoc branch. Reservations must be
        within the branch operating hours.
      </p>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!user ? <p>Please login as a customer first.</p> : null}

      {user ? (
        <form className="reservation-form" onSubmit={handleCreateReservation}>
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
            Estimated Total
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalEstimate}
              onChange={(event) => setTotalEstimate(event.target.value)}
              placeholder="Optional"
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

      <div className="reservation-list">
        <h3>My Reservations</h3>

        {reservations.length === 0 ? <p>No reservations yet.</p> : null}

        {reservations.map((reservation) => (
          <article className="reservation-item" key={reservation.id}>
            <div className="reservation-item-header">
              <div>
                <h4>{reservation.reservationNumber}</h4>
                <p>{formatDateTime(reservation.reservedFor)}</p>
              </div>

              <span className="status-pill">{reservation.status}</span>
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

            {reservation.status !== 'CANCELLED' &&
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
