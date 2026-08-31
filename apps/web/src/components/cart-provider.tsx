'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Cart } from '@/lib/api-types';
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '@/lib/cart-api';
import { useAuth } from './auth-provider';

type CartContextValue = {
  cart: Cart | null;
  isLoading: boolean;
  error: string;
  refreshCart: () => Promise<void>;
  addMenuItem: (menuItemId: string, quantity?: number) => Promise<void>;
  updateItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearMyCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, token } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canUseCart = Boolean(token && user?.role === 'CUSTOMER');

  async function refreshCart() {
    if (!token || user?.role !== 'CUSTOMER') {
      setCart(null);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const loadedCart = await getCart(token);
      setCart(loadedCart);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load cart.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function addMenuItem(menuItemId: string, quantity = 1) {
    if (!token) {
      throw new Error('Please login before adding items to cart.');
    }

    const updatedCart = await addCartItem(token, {
      branchCode: 'TINOC',
      menuItemId,
      quantity,
    });

    setCart(updatedCart);
  }

  async function updateItem(cartItemId: string, quantity: number) {
    if (!token) {
      throw new Error('Please login before updating cart.');
    }

    const updatedCart = await updateCartItem(token, cartItemId, {
      quantity,
    });

    setCart(updatedCart);
  }

  async function removeItem(cartItemId: string) {
    if (!token) {
      throw new Error('Please login before removing cart items.');
    }

    const updatedCart = await removeCartItem(token, cartItemId);
    setCart(updatedCart);
  }

  async function clearMyCart() {
    if (!token) {
      throw new Error('Please login before clearing cart.');
    }

    const updatedCart = await clearCart(token);
    setCart(updatedCart);
  }

  useEffect(() => {
    if (!canUseCart) {
      setCart(null);
      setError('');
      return;
    }

    refreshCart();
  }, [canUseCart, token, user?.id]);

  const value = useMemo(
    () => ({
      cart,
      isLoading,
      error,
      refreshCart,
      addMenuItem,
      updateItem,
      removeItem,
      clearMyCart,
    }),
    [cart, isLoading, error, token],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider.');
  }

  return context;
}
