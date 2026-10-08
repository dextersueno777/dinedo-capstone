'use client';

import { FormEvent, useState } from 'react';
import type { Cart, Order, PaymentMethod, ServiceType } from '@/lib/api-types';
import { checkout } from '@/lib/orders-api';
import { useAuth } from './auth-provider';
import { AddressSelector } from './address-selector';
import { useCart } from './cart-provider';

function formatPrice(price: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(price));
}

function getCartTotal(cart: Cart | null) {
  if (!cart) {
    return 0;
  }

  return cart.items.reduce((total, item) => {
    const basePrice = Number(item.menuItem.price);
    const optionTotal = item.options.reduce(
      (optionSum, option) => optionSum + Number(option.priceDelta) * option.quantity,
      0,
    );

    return total + (basePrice + optionTotal) * item.quantity;
  }, 0);
}

export function CheckoutPanel() {
  const { user, token } = useAuth();
  const { cart, refreshCart } = useCart();
  const [serviceType, setServiceType] = useState<ServiceType>('TAKE_OUT');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('PAY_AT_COUNTER');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState('0.5');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasItems = Boolean(cart && cart.items.length > 0);
  const cartCount =
    cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const cartTotal = getCartTotal(cart);

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

    if (serviceType === 'DELIVERY' && !selectedAddressId) {
      setError('Please select a delivery address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await checkout(token, {
        branchCode: 'TINOC',
        serviceType,
        timingType: 'IMMEDIATE',
        paymentMethod,
        addressId: serviceType === 'DELIVERY' ? selectedAddressId : undefined,
        deliveryDistanceKm:
          serviceType === 'DELIVERY' ? Number(deliveryDistanceKm) : undefined,
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
    <section id="checkout" className="card checkout-card checkout-card-polished">
      <div className="checkout-header">
        <div>
          <p className="eyebrow">Checkout</p>
          <h2>Review and submit your order</h2>
          <p>
            Choose your service type, payment method, and notes before sending
            the order to staff for review.
          </p>
        </div>

        <div className="checkout-total-card">
          <span>Estimated Total</span>
          <strong>{formatPrice(cartTotal)}</strong>
          <small>{cartCount === 1 ? '1 item in cart' : `${cartCount} items in cart`}</small>
        </div>
      </div>

      <div className="checkout-steps">
        <span>🛒 Cart</span>
        <span>🍽️ Service</span>
        <span>💳 Payment</span>
        <span>📦 Staff Review</span>
      </div>

      {cart && cart.items.length > 0 ? (
        <div className="checkout-review-list">
          <div className="checkout-review-heading">
            <h3>Order items</h3>
            <span>{cartCount === 1 ? '1 item' : `${cartCount} items`}</span>
          </div>

          {cart.items.map((item) => {
            const optionTotal = item.options.reduce(
              (sum, option) => sum + Number(option.priceDelta) * option.quantity,
              0,
            );
            const unitTotal = Number(item.menuItem.price) + optionTotal;

            return (
              <article className="checkout-review-item" key={item.id}>
                <div>
                  <h4>{item.menuItem.name}</h4>
                  <p>
                    {formatPrice(unitTotal)} × {item.quantity}
                  </p>

                  {item.options.length > 0 ? (
                    <ul className="cart-option-list">
                      {item.options.map((option) => (
                        <li key={option.id}>
                          <span>
                            {option.menuOption.optionGroup.name}:{' '}
                            {option.menuOption.name}
                          </span>
                          {Number(option.priceDelta) > 0 ? (
                            <strong>+{formatPrice(option.priceDelta)}</strong>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {item.specialNotes ? (
                    <p className="cart-special-notes">
                      Note: {item.specialNotes}
                    </p>
                  ) : null}
                </div>

                <strong>{formatPrice(unitTotal * item.quantity)}</strong>
              </article>
            );
          })}
        </div>
      ) : null}

      <form className="checkout-form" onSubmit={handleCheckout}>
        <label>
          Service Type
          <select
            value={serviceType}
            onChange={(event) => {
              const value = event.target.value as ServiceType;
              setServiceType(value);
              if (value === 'DELIVERY') {
                setPaymentMethod('COD');
              } else {
                setPaymentMethod(
                  value === 'DINE_IN' ? 'PAY_AFTER_EATING' : 'PAY_AT_COUNTER',
                );
              }
            }}
          >
            <option value="TAKE_OUT">Take-out</option>
            <option value="DINE_IN">Dine-in</option>
            <option value="DELIVERY">Delivery</option>
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
            {serviceType === 'DELIVERY' ? (
              <>
                <option value="COD">Cash on delivery</option>
                <option value="GCASH_MANUAL">Manual GCash</option>
              </>
            ) : (
              <>
                <option value="PAY_AT_COUNTER">Pay at counter</option>
                <option value="PAY_AFTER_EATING">Pay after eating</option>
              </>
            )}
          </select>
        </label>

        {serviceType === 'DELIVERY' ? (
          <>
            <AddressSelector
              selectedAddressId={selectedAddressId}
              onSelectAddress={setSelectedAddressId}
            />

            <label>
              Delivery Distance in Kilometers
              <input
                type="number"
                min="0"
                step="0.1"
                value={deliveryDistanceKm}
                onChange={(event) => setDeliveryDistanceKm(event.target.value)}
              />
            </label>
          </>
        ) : null}

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
