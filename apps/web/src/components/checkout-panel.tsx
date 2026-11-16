'use client';

import { FormEvent, useEffect, useState } from 'react';
import type {
  Branch,
  Cart,
  Order,
  OrderTimingType,
  PaymentMethod,
  Reservation,
  ServiceType,
} from '@/lib/api-types';
import { checkout } from '@/lib/orders-api';
import { getBranchByCode } from '@/lib/branches-api';
import { formatBranchTime, getBranchHoursStatus } from '@/lib/branch-hours';
import { getMyReservations } from '@/lib/reservation-api';
import {
  getManilaDatetimeLocalValue,
  manilaDatetimeLocalToIso,
} from '@/lib/ph-time';
import { useAuth } from './auth-provider';
import { AddressSelector } from './address-selector';
import { useCart } from './cart-provider';

function formatPrice(price: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(price));
}

function formatReservationDateTime(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
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
  const [timingType, setTimingType] =
    useState<OrderTimingType>('IMMEDIATE');
  const [scheduledFor, setScheduledFor] = useState(() =>
    getManilaDatetimeLocalValue(1, 12, 0),
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('PAY_AT_COUNTER');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeHoursNow, setStoreHoursNow] = useState(() => new Date());
  const [branch, setBranch] = useState<Branch | null>(null);

  const hasItems = Boolean(cart && cart.items.length > 0);
  const cartCount =
    cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const cartTotal = getCartTotal(cart);
  const orderingOpenTime = branch?.settings?.orderingOpenTime ?? '07:00';
  const orderingCloseTime = branch?.settings?.orderingCloseTime ?? '22:00';
  const branchTimeZone = branch?.settings?.timezone ?? 'Asia/Manila';
  const storeHours = getBranchHoursStatus(
    storeHoursNow,
    orderingOpenTime,
    orderingCloseTime,
    branchTimeZone,
  );

  const availableReservations = reservations.filter(
    (reservation) =>
      !reservation.linkedOrderId &&
      (reservation.status === 'PENDING' || reservation.status === 'APPROVED') &&
      new Date(reservation.reservedFor).getTime() > Date.now(),
  );

  const linkedReservation =
    availableReservations.find(
      (reservation) => reservation.id === selectedReservationId,
    ) ?? null;

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
    const timer = window.setInterval(() => setStoreHoursNow(new Date()), 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReservations() {
      if (!token || user?.role !== 'CUSTOMER') {
        setReservations([]);
        return;
      }

      try {
        const loadedReservations = await getMyReservations(token);

        if (!cancelled) {
          setReservations(loadedReservations);
        }
      } catch {
        if (!cancelled) {
          setReservations([]);
        }
      }
    }

    void loadReservations();

    return () => {
      cancelled = true;
    };
  }, [token, user?.role]);

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

    if (selectedReservationId && !linkedReservation) {
      setError('The selected reservation is no longer available for a food order.');
      return;
    }

    const checkoutTimingType: OrderTimingType = linkedReservation
      ? 'ADVANCE'
      : timingType;

    let checkoutScheduledFor: string | undefined;

    if (linkedReservation) {
      checkoutScheduledFor = linkedReservation.reservedFor;
    } else if (checkoutTimingType === 'ADVANCE') {
      if (!scheduledFor) {
        setError('Please select a future date and time for your advance order.');
        return;
      }

      checkoutScheduledFor = manilaDatetimeLocalToIso(scheduledFor);

      if (new Date(checkoutScheduledFor).getTime() <= Date.now()) {
        setError('Advance order date and time must be in the future.');
        return;
      }
    }

    if (
      checkoutTimingType === 'IMMEDIATE' &&
      !storeHours.isOpen
    ) {
      setError(
        'Immediate orders are not available outside the current ordering hours. You may choose Order for later instead.',
      );
      return;
    }

    const checkoutServiceType: ServiceType = linkedReservation
      ? 'DINE_IN'
      : serviceType;

    const checkoutPaymentMethod: PaymentMethod = linkedReservation
      ? 'PAY_AFTER_EATING'
      : paymentMethod;

    if (checkoutServiceType === 'DELIVERY' && !selectedAddressId) {
      setError('Please select a delivery address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await checkout(token, {
        branchCode: 'TINOC',
        serviceType: checkoutServiceType,
        timingType: checkoutTimingType,
        scheduledFor: checkoutScheduledFor,
        reservationId: linkedReservation?.id,
        paymentMethod: checkoutPaymentMethod,
        addressId:
          checkoutServiceType === 'DELIVERY' ? selectedAddressId : undefined,
        customerNotes: customerNotes.trim() || undefined,
      });

      setCreatedOrder(order);
      setMessage(`Order submitted successfully: ${order.orderNumber}`);
      setCustomerNotes('');
      await refreshCart();

      window.dispatchEvent(new Event('dinedo:orders-changed'));
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

      <div className={storeHours.isOpen ? 'success-text' : 'error-text'}>
        <strong>Store Hours:</strong>{' '}
        {formatBranchTime(orderingOpenTime)} to{' '}
        {formatBranchTime(orderingCloseTime)} Philippine Time.
        Current PH time: {storeHours.timeLabel}.{' '}
        {storeHours.isOpen
          ? 'Immediate ordering is currently available.'
          : 'Immediate ordering is currently unavailable. Advance orders may still be submitted for a future valid schedule.'}
      </div>

      <form className="checkout-form" onSubmit={handleCheckout}>
        <label>
          Food Order Option
          <select
            value={selectedReservationId}
            onChange={(event) => {
              const reservationId = event.target.value;

              setSelectedReservationId(reservationId);

              if (reservationId) {
                setServiceType('DINE_IN');
                setPaymentMethod('PAY_AFTER_EATING');
                setSelectedAddressId('');
              } else {
                setServiceType('TAKE_OUT');
                setPaymentMethod('PAY_AT_COUNTER');
              }
            }}
          >
            <option value="">Regular order</option>

            {availableReservations.map((reservation) => (
              <option key={reservation.id} value={reservation.id}>
                Add food to {reservation.reservationNumber} —{' '}
                {formatReservationDateTime(reservation.reservedFor)}
              </option>
            ))}
          </select>
        </label>

        {linkedReservation ? (
          <div className="success-text">
            <strong>Linked reservation:</strong>{' '}
            {linkedReservation.reservationNumber}
            {' — '}
            {formatReservationDateTime(linkedReservation.reservedFor)}.
            This food order will be submitted as an advance dine-in order.
          </div>
        ) : (
          <>
            <label>
              When do you want your order?
              <select
                value={timingType}
                onChange={(event) =>
                  setTimingType(event.target.value as OrderTimingType)
                }
              >
                <option value="IMMEDIATE">Order now</option>
                <option value="ADVANCE">Order for later</option>
              </select>
            </label>

            {timingType === 'ADVANCE' ? (
              <label>
                Scheduled Date and Time
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  min={getManilaDatetimeLocalValue()}
                  onChange={(event) => setScheduledFor(event.target.value)}
                  required
                />
              </label>
            ) : null}
          </>
        )}

        <label>
          Service Type
          <select
            value={serviceType}
            disabled={Boolean(linkedReservation)}
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
            disabled={Boolean(linkedReservation)}
            onChange={(event) =>
              setPaymentMethod(event.target.value as PaymentMethod)
            }
          >
            {serviceType === 'DELIVERY' ? (
              <>
                <option value="COD">Cash on delivery</option>
                <option value="GCASH_MANUAL">Manual GCash</option>
              </>
            ) : serviceType === 'DINE_IN' ? (
              <>
                <option value="PAY_AFTER_EATING">Pay after eating</option>
                <option value="GCASH_MANUAL">Manual GCash</option>
              </>
            ) : (
              <>
                <option value="PAY_AT_COUNTER">Pay at counter</option>
                <option value="GCASH_MANUAL">Manual GCash</option>
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
          <div className="order-result order-success-card">
            <div className="order-success-icon" aria-hidden="true">
              ✓
            </div>

            <div>
              <p className="eyebrow">Order Submitted</p>
              <h3>Thank you for your order</h3>
              <p>
                Your order has been sent to Dindo&apos;s Restaurant for
                processing.
              </p>
            </div>

            <div className="order-success-details">
              <div>
                <span>Order Number</span>
                <strong>{createdOrder.orderNumber}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {createdOrder.status.replaceAll('_', ' ').toLowerCase()}
                </strong>
              </div>

              <div>
                <span>Total</span>
                <strong>{formatPrice(createdOrder.totalAmount)}</strong>
              </div>
            </div>

            <div className="order-success-actions">
              <a className="primary" href="#orders">
                Track My Order
              </a>

              <a className="secondary" href="#menu">
                Order More Food
              </a>
            </div>
          </div>
        ) : null}
      </form>
    </section>
  );
}
