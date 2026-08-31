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
    <section id="payment-proof" className="card">
      <p className="eyebrow">Customer Module</p>
      <h2>GCash Payment Proof</h2>
      <p>Submit a receipt link for manual GCash orders.</p>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!user ? <p>Please login as a customer first.</p> : null}

      {user && eligibleOrders.length === 0 ? (
        <p>No manual GCash orders are waiting for payment proof.</p>
      ) : null}

      {eligibleOrders.length > 0 ? (
        <form className="payment-proof-form" onSubmit={handleSubmit}>
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

          <button type="submit" disabled={isBusy}>
            {isBusy ? 'Submitting...' : 'Submit Payment Proof'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
