'use client';

import type { Cart } from '@/lib/api-types';
import { useAuth } from './auth-provider';
import { useCart } from './cart-provider';

function money(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value);
}

function getCartTotal(cart: Cart | null) {
  if (!cart) return 0;

  return cart.items.reduce((total, item) => {
    const base = Number(item.menuItem.price);

    const options = item.options.reduce(
      (sum, option) =>
        sum + Number(option.priceDelta) * option.quantity,
      0,
    );

    return total + (base + options) * item.quantity;
  }, 0);
}

export function CustomerCartSummary() {
  const { user } = useAuth();
  const { cart } = useCart();

  if (
    !user ||
    user.role !== 'CUSTOMER' ||
    !cart ||
    cart.items.length === 0
  ) {
    return null;
  }

  const count = cart.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const total = getCartTotal(cart);

  return (
    <aside
      className="customer-cart-summary"
      aria-label="Current cart summary"
    >
      <div className="customer-cart-summary-info">
        <span>
          🛒 {count} {count === 1 ? 'item' : 'items'}
        </span>
        <strong>{money(total)}</strong>
      </div>

      <div className="customer-cart-summary-actions">
        <a className="secondary" href="#cart">
          View Cart
        </a>

        <a className="primary" href="#checkout">
          Checkout
        </a>
      </div>
    </aside>
  );
}
