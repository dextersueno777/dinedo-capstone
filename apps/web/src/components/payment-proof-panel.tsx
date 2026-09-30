'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Order } from '@/lib/api-types';
import { getMyOrders } from '@/lib/orders-api';
import { submitPaymentProof } from '@/lib/payment-proof-api';
import { useAuth } from './auth-provider';

function money(value: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(value));
}

export function PaymentProofPanel() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [gcashReferenceNumber, setGcashReferenceNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerAccountLast4, setPayerAccountLast4] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const eligibleOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.paymentMethod === 'GCASH_MANUAL' &&
          order.paymentState !== 'APPROVED' &&
          order.paymentState !== 'PAID',
      ),
    [orders],
  );

  async function loadOrders() {
    if (!token || user?.role !== 'CUSTOMER') {
      setOrders([]);
      return;
    }

    setError('');

    try {
      const loaded = await getMyOrders(token);
      setOrders(loaded);

      const first = loaded.find(
        (order) =>
          order.paymentMethod === 'GCASH_MANUAL' &&
          order.paymentState !== 'APPROVED' &&
          order.paymentState !== 'PAID',
      );

      if (first) {
        setOrderId(first.id);
        setAmount(String(first.totalAmount));
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load manual GCash orders.',
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !orderId) {
      setError('Please login and select a manual GCash order.');
      return;
    }

    setIsBusy(true);
    setMessage('');
    setError('');

    try {
      const proof = await submitPaymentProof(token, orderId, {
        amount: Number(amount),
        proofImageUrl: proofImageUrl.trim(),
        gcashReferenceNumber: gcashReferenceNumber.trim() || undefined,
        payerName: payerName.trim() || undefined,
        payerAccountLast4: payerAccountLast4.trim() || undefined,
      });

      setMessage(`Payment proof submitted. Status: ${proof.status}`);
      setProofImageUrl('');
      setGcashReferenceNumber('');
      setPayerName('');
      setPayerAccountLast4('');
      await loadOrders();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to submit payment proof.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [token, user?.id]);

  return (
    <section id="payment-proof" className="card payment-proof-card">
      <div className="payment-proof-heading">
        <div>
          <p className="eyebrow">Manual Payment</p>
          <h2>GCash Payment Proof</h2>
          <p>
            Submit your receipt details for manual admin verification.
          </p>
        </div>

        <div className="payment-proof-info-card">
          <span>Payment Type</span>
          <strong>Manual GCash</strong>
          <small>Admin will review the receipt</small>
        </div>
      </div>

      <div className="payment-proof-tips">
        <span>💳 Pay using GCash</span>
        <span>📸 Copy receipt image link</span>
        <span>🔢 Add reference number</span>
        <span>✅ Wait for approval</span>
      </div>

      <div className="gcash-qr-card">
        <img
          className="gcash-qr-image"
          src="/payment/gcash-qr.jpg"
          alt="Official Dindo's Restaurant Tinoc Branch GCash QR code"
        />

        <div>
          <h3>Official GCash QR</h3>
          <p>
            Scan the official Dindo’s Restaurant Tinoc Branch GCash QR before
            submitting your receipt details.
          </p>
          <small>
            Use this only for manual GCash payment, then submit your receipt link
            and reference number for admin verification.
          </small>
        </div>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!user ? (
        <div className="empty-payment-proof-state">
          <span aria-hidden="true">💳</span>
          <h3>Sign in to submit proof</h3>
          <p>Customer login is required before submitting GCash receipt details.</p>
        </div>
      ) : null}

      {user && eligibleOrders.length === 0 ? (
        <div className="empty-payment-proof-state">
          <span aria-hidden="true">📭</span>
          <h3>No GCash proof needed</h3>
          <p>No manual GCash orders are currently waiting for payment proof.</p>
        </div>
      ) : null}

      {eligibleOrders.length > 0 ? (
        <form className="payment-proof-form payment-proof-form-polished" onSubmit={handleSubmit}>
          <label>
            Manual GCash Order
            <select
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
            >
              {eligibleOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} — {money(order.totalAmount)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Amount Paid
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>

          <label>
            Receipt Image URL
            <input
              type="url"
              value={proofImageUrl}
              onChange={(event) => setProofImageUrl(event.target.value)}
              placeholder="https://example.com/gcash-receipt.jpg"
              required
            />
          </label>

          <label>
            Reference Number
            <input
              value={gcashReferenceNumber}
              onChange={(event) => setGcashReferenceNumber(event.target.value)}
            />
          </label>

          <label>
            Payer Name
            <input
              value={payerName}
              onChange={(event) => setPayerName(event.target.value)}
            />
          </label>

          <label>
            GCash Last 4 Digits
            <input
              maxLength={4}
              value={payerAccountLast4}
              onChange={(event) => setPayerAccountLast4(event.target.value)}
            />
          </label>

          <button className="primary full-button" type="submit" disabled={isBusy}>
            {isBusy ? 'Submitting...' : 'Submit Payment Proof'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
