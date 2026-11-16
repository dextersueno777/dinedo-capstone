'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import {
  sendCustomerEmailVerification,
  verifyCustomerEmail,
} from '@/lib/auth-api';

export function CustomerEmailVerificationPanel() {
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (
      user?.role === 'CUSTOMER' &&
      !user.emailVerifiedAt
    ) {
      setEmail(user.email);
    }
  }, [user]);

  if (
    verified ||
    (user && (
      user.role !== 'CUSTOMER' ||
      Boolean(user.emailVerifiedAt)
    ))
  ) {
    return null;
  }

  async function sendCode() {
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const result = await sendCustomerEmailVerification(
        email.trim(),
      );

      setMessage(result.message);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to send verification code.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const result = await verifyCustomerEmail(
        email.trim(),
        code.trim(),
      );

      setMessage(
        `${result.message} You may now sign in.`,
      );

      setCode('');

      if (user?.role === 'CUSTOMER') {
        setVerified(true);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to verify email.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card auth-card-polished">
      <div className="auth-copy">
        <p className="eyebrow">Email Verification</p>
        <h2>Verify your DineDo account</h2>
        <p>
          After creating an account, enter the same email
          address below and verify the 6-digit code sent to
          your inbox.
        </p>
      </div>

      <form
        className="auth-form"
        onSubmit={(event) => void verifyCode(event)}
      >
        <label>
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            required
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />
        </label>

        <button
          type="button"
          className="secondary full-button"
          disabled={busy || !email.trim()}
          onClick={() => void sendCode()}
        >
          Send 6-digit code
        </button>

        <label>
          Verification Code
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            required
            onChange={(event) =>
              setCode(
                event.target.value
                  .replace(/\D/g, '')
                  .slice(0, 6),
              )
            }
          />
        </label>

        <button
          type="submit"
          className="primary full-button"
          disabled={busy || code.length !== 6}
        >
          {busy ? 'Verifying...' : 'Verify Email'}
        </button>

        {message ? (
          <p className="success-text">{message}</p>
        ) : null}

        {error ? (
          <p className="error-text">{error}</p>
        ) : null}
      </form>
    </section>
  );
}
