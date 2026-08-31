'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MenuCategory, MenuItem } from '@/lib/api-types';
import { getMenuCategories, getMenuItems } from '@/lib/menu-api';
import { useAuth } from './auth-provider';
import { useCart } from './cart-provider';

function formatPrice(price: string | number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Number(price));
}

export function MenuBrowser() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('Loading menu...');
  const [cartMessage, setCartMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { addMenuItem } = useCart();

  useEffect(() => {
    let isActive = true;

    Promise.all([
      getMenuCategories(),
      getMenuItems(),
    ])
      .then(([loadedCategories, loadedItems]) => {
        if (!isActive) {
          return;
        }

        setCategories(loadedCategories);
        setItems(loadedItems);
        setMessage('');
      })
      .catch((caughtError) => {
        if (!isActive) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Unable to load menu.',
        );
        setMessage('');
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory =
        !selectedCategory || item.category.slug === selectedCategory;

      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description?.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, search]);

  async function handleAddToCart(item: MenuItem) {
    setCartMessage('');
    setError('');

    if (!user || user.role !== 'CUSTOMER') {
      setError('Please login as a customer before adding items to cart.');
      return;
    }

    if (item.status !== 'AVAILABLE') {
      setError('This menu item is currently sold out.');
      return;
    }

    try {
      await addMenuItem(item.id, 1);
      setCartMessage(`${item.name} added to cart.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to add item to cart.',
      );
    }
  }

  return (
    <section id="menu" className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Customer Module</p>
          <h2>Menu Browsing</h2>
        </div>

        <input
          className="search-input"
          type="search"
          placeholder="Search menu..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="category-row">
        <button
          className={selectedCategory === '' ? 'chip active-chip' : 'chip'}
          type="button"
          onClick={() => setSelectedCategory('')}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            className={
              selectedCategory === category.slug ? 'chip active-chip' : 'chip'
            }
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {message ? <p>{message}</p> : null}
      {cartMessage ? <p className="success-text">{cartMessage}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="menu-grid">
        {filteredItems.map((item) => (
          <article className="menu-card" key={item.id}>
            <div>
              <p className="menu-category">{item.category.name}</p>
              <h3>{item.name}</h3>
              <p>{item.description ?? 'No description available.'}</p>
            </div>

            <div className="menu-footer">
              <div>
                <strong>{formatPrice(item.price)}</strong>
                <span className={item.status === 'SOLD_OUT' ? 'sold-out' : 'available'}>
                  {item.status === 'SOLD_OUT' ? 'Sold Out' : 'Available'}
                </span>
              </div>

              <button
                className="primary add-cart-button"
                type="button"
                disabled={item.status !== 'AVAILABLE'}
                onClick={() => handleAddToCart(item)}
              >
                Add to Cart
              </button>
            </div>
          </article>
        ))}
      </div>

      {!message && !error && filteredItems.length === 0 ? (
        <p>No menu items found.</p>
      ) : null}
    </section>
  );
}
