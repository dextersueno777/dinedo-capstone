'use client';

import { FormEvent, useState } from 'react';
import { updateSuperadminContactNumber } from '@/lib/auth-api';
import { useAuth } from './auth-provider';

export function SuperadminContactPanel() {
  const { user, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || user?.role !== 'SUPERADMIN') {
      setError('Super Admin authentication is required.');
      return;
    }

    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const result = await updateSuperadminContactNumber(token, {
        currentPassword,
        newContactNumber,
      });

      setMessage(
        `${result.message} New contact: ${result.maskedContactNumber}`,
      );
      setCurrentPassword('');
      setNewContactNumber('');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update owner contact number.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user?.role !== 'SUPERADMIN') {
    return null;
  }

  return (
    <section id="owner-security" className="card">
      <p className="eyebrow">Owner Security</p>
      <h2>Change Owner Contact Number</h2>

      <p>
        This number is required together with the owner email and password
        when signing in as Super Admin.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Current Password
          <input
            type="password"
            value={currentPassword}
            autoComplete="current-password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>

        <label>
          New Owner Contact Number
          <input
            type="tel"
            value={newContactNumber}
            inputMode="numeric"
            autoComplete="tel"
            maxLength={11}
            pattern="09[0-9]{9}"
            placeholder="09XXXXXXXXX"
            onChange={(event) =>
              setNewContactNumber(
                event.target.value.replace(/\D/g, '').slice(0, 11),
              )
            }
            required
          />
        </label>

        <button
          className="primary full-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update Owner Contact Number'}
        </button>

        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
}
