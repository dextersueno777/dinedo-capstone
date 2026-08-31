'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { CustomerAddress } from '@/lib/api-types';
import { createAddress, getMyAddresses } from '@/lib/address-api';
import { useAuth } from './auth-provider';

type AddressSelectorProps = {
  selectedAddressId: string;
  onSelectAddress: (addressId: string) => void;
};

export function AddressSelector({
  selectedAddressId,
  onSelectAddress,
}: AddressSelectorProps) {
  const { user, token } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  async function loadAddresses() {
    if (!token || user?.role !== 'CUSTOMER') {
      setAddresses([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const loadedAddresses = await getMyAddresses(token);
      setAddresses(loadedAddresses);

      if (!selectedAddressId && loadedAddresses.length > 0) {
        const defaultAddress =
          loadedAddresses.find((address) => address.isDefault) ??
          loadedAddresses[0];

        onSelectAddress(defaultAddress.id);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load addresses.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateDemoAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError('Please login before creating an address.');
      return;
    }

    setIsCreating(true);
    setMessage('');
    setError('');

    try {
      const address = await createAddress(token, {
        label: 'Home',
        recipient: 'Demo Customer',
        phoneNumber: '09123456789',
        line1: 'Tinoc local delivery address',
        barangay: 'Poblacion',
        municipality: 'Tinoc',
        province: 'Ifugao',
        landmark: 'Near Dindo’s Restaurant',
        isDefault: true,
      });

      setMessage('Demo delivery address created.');
      onSelectAddress(address.id);
      await loadAddresses();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to create address.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, [token, user?.id]);

  return (
    <div className="address-selector">
      <div>
        <h3>Delivery Address</h3>
        <p>Select an address for delivery checkout.</p>
      </div>

      {isLoading ? <p>Loading addresses...</p> : null}
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="address-list">
        {addresses.map((address) => (
          <label className="address-option" key={address.id}>
            <input
              type="radio"
              name="deliveryAddress"
              checked={selectedAddressId === address.id}
              onChange={() => onSelectAddress(address.id)}
            />

            <span>
              <strong>
                {address.label}
                {address.isDefault ? ' • Default' : ''}
              </strong>
              <small>
                {address.recipient} • {address.phoneNumber}
              </small>
              <small>
                {address.line1}, {address.barangay ? `${address.barangay}, ` : ''}
                {address.municipality}, {address.province}
              </small>
            </span>
          </label>
        ))}
      </div>

      {addresses.length === 0 ? (
        <form onSubmit={handleCreateDemoAddress}>
          <button
            className="secondary full-button"
            type="submit"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Demo Address'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
