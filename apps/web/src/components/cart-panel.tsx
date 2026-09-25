'use client';

import type { Cart } from '@/lib/api-types';
import { useAuth } from './auth-provider';
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

export function CartPanel() {
  const { user } = useAuth();
  const { cart, isLoading, error, updateItem, removeItem, clearMyCart } = useCart();

  const cartCount =
    cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const cartTotal = getCartTotal(cart);

  if (!user) {
    return (
      <section id="cart" className="card cart-card cart-empty-card">
        <p className="eyebrow">Cart</p>
        <h2>Sign in to view cart</h2>
        <p>Please login as a customer to add meals, review quantities, and checkout.</p>
      </section>
    );
  }

  if (user.role !== 'CUSTOMER') {
    return (
      <section id="cart" className="card cart-card cart-empty-card">
        <p className="eyebrow">Cart</p>
        <h2>Customer cart only</h2>
        <p>Use a customer account to add food items and submit orders.</p>
      </section>
    );
  }

  return (
    <section id="cart" className="card cart-card">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">Order Summary</p>
          <h2>My Cart</h2>
          <p className="section-subtitle">
            {cartCount === 1 ? '1 item selected' : `${cartCount} items selected`}
          </p>
        </div>

        <strong>{formatPrice(cartTotal)}</strong>
      </div>

      {isLoading ? <p>Loading cart...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && cart && cart.items.length === 0 ? (
        <div className="empty-cart-state">
          <span aria-hidden="true">🛒</span>
          <h3>Your cart is empty</h3>
          <p>Start by choosing meals from the Dindo menu.</p>
          <a className="primary cart-link-button" href="#menu">
            Browse Menu
          </a>
        </div>
      ) : null}

      <div className="cart-list">
        {cart?.items.map((item) => (
          <article className="cart-item" key={item.id}>
            <div>
              <h3>{item.menuItem.name}</h3>
              <p>
                {formatPrice(item.menuItem.price)} × {item.quantity}
              </p>
              {item.specialNotes ? <p>{item.specialNotes}</p> : null}
            </div>

            <div className="cart-actions">
              <button
                className="small-button"
                type="button"
                disabled={item.quantity <= 1}
                onClick={() => updateItem(item.id, item.quantity - 1)}
              >
                −
              </button>

              <span>{item.quantity}</span>

              <button
                className="small-button"
                type="button"
                onClick={() => updateItem(item.id, item.quantity + 1)}
              >
                +
              </button>

              <button
                className="text-button"
                type="button"
                onClick={() => removeItem(item.id)}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      {cart && cart.items.length > 0 ? (
        <div className="cart-summary-bar">
          <div>
            <span>Total</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          <a className="primary cart-link-button" href="#checkout">
            Go to Checkout
          </a>

          <button className="danger-button" type="button" onClick={clearMyCart}>
            Clear Cart
          </button>
        </div>
      ) : null}
    </section>
  );
}
