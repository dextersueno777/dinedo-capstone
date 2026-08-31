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
  const {
    cart,
    isLoading,
    error,
    updateItem,
    removeItem,
    clearMyCart,
  } = useCart();

  if (!user) {
    return (
      <section id="cart" className="card">
        <h2>My Cart</h2>
        <p>Please login as a customer to view and manage your cart.</p>
      </section>
    );
  }

  if (user.role !== 'CUSTOMER') {
    return (
      <section id="cart" className="card">
        <h2>My Cart</h2>
        <p>Cart is available for customer accounts only.</p>
      </section>
    );
  }

  return (
    <section id="cart" className="card">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">Customer Module</p>
          <h2>My Cart</h2>
        </div>

        <strong>{formatPrice(getCartTotal(cart))}</strong>
      </div>

      {isLoading ? <p>Loading cart...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && cart && cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
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
        <button className="danger-button" type="button" onClick={clearMyCart}>
          Clear Cart
        </button>
      ) : null}
    </section>
  );
}
