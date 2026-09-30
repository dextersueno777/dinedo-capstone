'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MenuCategory, MenuItem, MenuOptionGroup } from '@/lib/api-types';
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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');
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

  const featuredItems = useMemo(
    () => items.filter((item) => item.isFeatured).slice(0, 6),
    [items],
  );

  const visibleCategories = useMemo(() => {
    const categorySlugsWithItems = new Set(
      items.map((item) => item.category.slug),
    );

    return categories.filter((category) =>
      categorySlugsWithItems.has(category.slug),
    );
  }, [categories, items]);

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

  useEffect(() => {
    if (
      selectedCategory &&
      !visibleCategories.some((category) => category.slug === selectedCategory)
    ) {
      setSelectedCategory('');
    }
  }, [selectedCategory, visibleCategories]);

  const menuCountText =
    filteredItems.length === 1
      ? '1 item available'
      : `${filteredItems.length} items available`;

  function hasFlexiblePricing(item: MenuItem) {
    const description = item.description?.toLowerCase() ?? '';

    return (
      description.includes('₱') ||
      description.includes('solo') ||
      description.includes('unli') ||
      description.includes('small:') ||
      description.includes('medium:') ||
      description.includes('large:') ||
      description.includes('whole')
    );
  }

  const selectedItemImage = selectedItem?.images?.[0]?.url;


  function resetItemSelection() {
    setSelectedItem(null);
    setSelectedQuantity(1);
    setSelectedOptionIds([]);
    setSpecialNotes('');
  }

  function openItemDetail(item: MenuItem) {
    setSelectedItem(item);
    setSelectedQuantity(1);
    setSelectedOptionIds([]);
    setSpecialNotes('');
  }

  function getSelectedOptionsTotal(item: MenuItem) {
    return (item.optionGroups ?? [])
      .flatMap((group) => group.options)
      .filter((option) => selectedOptionIds.includes(option.id))
      .reduce((total, option) => total + Number(option.priceDelta), 0);
  }

  function getOptionPriceLabel(priceDelta: string | number) {
    const amount = Number(priceDelta);
    if (amount > 0) return `+${formatPrice(amount)}`;
    if (amount < 0) return `-${formatPrice(Math.abs(amount))}`;
    return 'Included';
  }

  function toggleOption(group: MenuOptionGroup, optionId: string) {
    setSelectedOptionIds((current) => {
      const groupOptionIds = group.options.map((option) => option.id);
      const isSelected = current.includes(optionId);

      if (group.type === 'SINGLE') {
        return [...current.filter((id) => !groupOptionIds.includes(id)), optionId];
      }

      if (isSelected) {
        return current.filter((id) => id !== optionId);
      }

      const selectedInGroup = current.filter((id) => groupOptionIds.includes(id));
      if (selectedInGroup.length >= group.maxSelect) return current;

      return [...current, optionId];
    });
  }

  function getOptionSelectionError(item: MenuItem, optionIds: string[]) {
    for (const group of item.optionGroups ?? []) {
      const groupOptionIds = group.options.map((option) => option.id);
      const selectedCount = optionIds.filter((id) => groupOptionIds.includes(id)).length;

      if (group.isRequired && selectedCount === 0) {
        return `Please open this item and select ${group.name}.`;
      }

      if (selectedCount < group.minSelect) {
        return `Please select at least ${group.minSelect} option(s) for ${group.name}.`;
      }

      if (selectedCount > group.maxSelect) {
        return `Please select only ${group.maxSelect} option(s) for ${group.name}.`;
      }
    }

    return '';
  }

  async function handleAddToCart(item: MenuItem, quantity = 1) {
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

    const optionIds = selectedItem?.id === item.id ? selectedOptionIds : [];
    const notes = selectedItem?.id === item.id ? specialNotes : '';
    const optionError = getOptionSelectionError(item, optionIds);

    if (optionError) {
      setError(optionError);
      return;
    }

    try {
      await addMenuItem(item.id, quantity, optionIds, notes);
      setCartMessage(
        quantity > 1
          ? `${quantity}× ${item.name} added to cart.`
          : `${item.name} added to cart.`,
      );
      resetItemSelection();
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
          <p className="eyebrow">Order Menu</p>
          <h2>Choose your Dindo favorites</h2>
          <p className="section-subtitle">{menuCountText}</p>
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

        {visibleCategories.map((category) => (
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

      {!message && !error && featuredItems.length > 0 ? (
        <div className="featured-menu-block">
          <div className="mini-section-heading">
            <div>
              <p className="eyebrow">Popular Picks</p>
              <h3>Featured Favorites</h3>
            </div>
            <a href="#cart">View Cart</a>
          </div>

          <div className="featured-menu-row">
            {featuredItems.map((item) => {
              const menuImage = item.images?.[0]?.url;

              return (
                <article
                  className="featured-menu-card menu-clickable-card"
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openItemDetail(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openItemDetail(item);
                    }
                  }}
                >
                  {menuImage ? (
                    <img
                      src={menuImage}
                      alt={item.images?.[0]?.altText ?? item.name}
                      loading="lazy"
                    />
                  ) : null}

                  <div>
                    <p>{item.category.name}</p>
                    <h4>{item.name}</h4>
                    <strong>
                      {hasFlexiblePricing(item) ? 'Starts at ' : ''}
                      {formatPrice(item.price)}
                    </strong>
                  </div>

                  <button
                    className="primary"
                    type="button"
                    disabled={item.status !== 'AVAILABLE'}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAddToCart(item);
                    }}
                  >
                    Add
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="menu-grid">
        {filteredItems.map((item) => {
          const menuImage = item.images?.[0]?.url;

          return (
            <article
              className="menu-card menu-clickable-card"
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => openItemDetail(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openItemDetail(item);
                }
              }}
            >
              {item.isFeatured ? <span className="card-badge">Popular</span> : null}

              {menuImage ? (
                <img
                  className="menu-card-image"
                  src={menuImage}
                  alt={item.images?.[0]?.altText ?? item.name}
                  loading="lazy"
                />
              ) : (
                <div className="menu-card-image menu-card-image-placeholder">
                  No Image
                </div>
              )}

              <div>
                <p className="menu-category">{item.category.name}</p>
                <h3>{item.name}</h3>
                <p>{item.description ?? 'No description available.'}</p>
              </div>

              <div className="menu-footer">
              <div>
                <span className="price-label">
                  {hasFlexiblePricing(item) ? 'Starts at' : 'Price'}
                </span>
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
          );
        })}
      </div>

      {!message && !error && filteredItems.length === 0 ? (
        <p>No menu items found.</p>
      ) : null}

      {selectedItem ? (
        <div
          className="menu-modal-backdrop"
          role="presentation"
          onClick={() => resetItemSelection()}
        >
          <div
            className="menu-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="menu-modal-close"
              type="button"
              aria-label="Close menu details"
              onClick={() => resetItemSelection()}
            >
              ×
            </button>

            {selectedItemImage ? (
              <img
                className="menu-detail-image"
                src={selectedItemImage}
                alt={selectedItem.images?.[0]?.altText ?? selectedItem.name}
              />
            ) : (
              <div className="menu-detail-image menu-card-image-placeholder">
                No Image
              </div>
            )}

            <div className="menu-detail-content">
              <p className="menu-category">{selectedItem.category.name}</p>
              <h3 id="menu-detail-title">{selectedItem.name}</h3>
              <p>{selectedItem.description ?? 'No description available.'}</p>

              <div className="menu-detail-price-row">
                <div>
                  <span className="price-label">
                    {hasFlexiblePricing(selectedItem) ? 'Starts at' : 'Price'}
                  </span>
                  <strong>{formatPrice(selectedItem.price)}</strong>
                  {getSelectedOptionsTotal(selectedItem) > 0 ? (
                    <small>
                      Unit with options:{' '}
                      {formatPrice(
                        Number(selectedItem.price) + getSelectedOptionsTotal(selectedItem),
                      )}
                    </small>
                  ) : null}
                </div>

                <span
                  className={
                    selectedItem.status === 'SOLD_OUT' ? 'sold-out' : 'available'
                  }
                >
                  {selectedItem.status === 'SOLD_OUT' ? 'Sold Out' : 'Available'}
                </span>
              </div>

              {(selectedItem.optionGroups ?? []).length > 0 ? (
                <div className="menu-option-groups">
                  {(selectedItem.optionGroups ?? []).map((group) => (
                    <fieldset className="menu-option-group" key={group.id}>
                      <legend>
                        {group.name}
                        {group.isRequired ? <span>Required</span> : null}
                      </legend>

                      <p>
                        {group.type === 'SINGLE'
                          ? 'Choose one option.'
                          : `Choose up to ${group.maxSelect} option(s).`}
                      </p>

                      {group.options.map((option) => (
                        <label className="menu-option-row" key={option.id}>
                          <input
                            type={group.type === 'SINGLE' ? 'radio' : 'checkbox'}
                            name={group.id}
                            checked={selectedOptionIds.includes(option.id)}
                            onChange={() => toggleOption(group, option.id)}
                          />
                          <span>{option.name}</span>
                          <strong>{getOptionPriceLabel(option.priceDelta)}</strong>
                        </label>
                      ))}
                    </fieldset>
                  ))}
                </div>
              ) : null}

              <label className="menu-special-notes">
                Special instructions
                <textarea
                  value={specialNotes}
                  maxLength={300}
                  placeholder="Example: less sauce, separate soup, no onions..."
                  onChange={(event) => setSpecialNotes(event.target.value)}
                />
              </label>

              <div className="quantity-control">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedQuantity((quantity) => Math.max(1, quantity - 1))
                  }
                >
                  −
                </button>
                <strong>{selectedQuantity}</strong>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedQuantity((quantity) => Math.min(20, quantity + 1))
                  }
                >
                  +
                </button>
              </div>

              <button
                className="primary full-button"
                type="button"
                disabled={selectedItem.status !== 'AVAILABLE'}
                onClick={() => handleAddToCart(selectedItem, selectedQuantity)}
              >
                Add {selectedQuantity} to Cart
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
