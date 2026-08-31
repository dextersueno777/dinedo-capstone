'use client';

import { FormEvent, useState } from 'react';
import type { Order, PaymentMethod, ServiceType } from '@/lib/api-types';
import { checkout } from '@/lib/orders-api';
import { useAuth } from './auth-provider';
import { useCart } from './cart-provider';

function formatPrice(price: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(price));
}

export function CheckoutPanel() {
  const { user, token } = useAuth();
  const { cart, refreshCart } = useCart();
  const [serviceType, setServiceType] = useState<ServiceType>('TAKE_OUT');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('PAY_AT_COUNTER');
  const [customerNotes, setCustomerNotes] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasItems = Boolean(cart && cart.items.length > 0);

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage('');
    setError('');
    setCreatedOrder(null);

    if (!token || !user || user.role !== 'CUSTOMER') {
      setError('Please login as a customer before checkout.');
      return;
    }

    if (!hasItems) {
      setError('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await checkout(token, {
        branchCode: 'TINOC',
        serviceType,
        timingType: 'IMMEDIATE',
        paymentMethod,
        customerNotes: customerNotes.trim() || undefined,
      });

      setCreatedOrder(order);
      setMessage(`Order submitted successfully: ${order.orderNumber}`);
      setCustomerNotes('');
      await refreshCart();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Checkout failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="checkout" className="card checkout-card">
      <div>
        <p className="eyebrow">Customer Module</p>
        <h2>Checkout</h2>
        <p>
          Submit your cart for staff review. Delivery checkout will be connected
          after the customer address selector is added.
        </p>
      </div>

      <form className="checkout-form" onSubmit={handleCheckout}>
        <label>
          Service Type
          <select
            value={serviceType}
            onChange={(event) => {
              const value = event.target.value as ServiceType;
              setServiceType(value);
              setPaymentMethod(
                value === 'DINE_IN' ? 'PAY_AFTER_EATING' : 'PAY_AT_COUNTER',
              );
            }}
          >
            <option value="TAKE_OUT">Take-out</option>
            <option value="DINE_IN">Dine-in</option>
          </select>
        </label>

        <label>
          Payment Method
          <select
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(event.target.value as PaymentMethod)
            }
          >
            <option value="PAY_AT_COUNTER">Pay at counter</option>
            <option value="PAY_AFTER_EATING">Pay after eating</option>
          </select>
        </label>

        <label>
          Notes
          <textarea
            value={customerNotes}
            maxLength={500}
            placeholder="Optional notes for the staff..."
            onChange={(event) => setCustomerNotes(event.target.value)}
          />
        </label>

        <button
          className="primary full-button"
          type="submit"
          disabled={isSubmitting || !hasItems}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Order'}
        </button>

        {!hasItems ? <p>Your cart must have items before checkout.</p> : null}
        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {createdOrder ? (
          <div className="order-result">
            <h3>Order Created</h3>
            <p>Order Number: {createdOrder.orderNumber}</p>
            <p>Status: {createdOrder.status}</p>
            <p>Total: {formatPrice(createdOrder.totalAmount)}</p>
          </div>
        ) : null}
      </form>
    </section>
  );
}
