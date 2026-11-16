'use client';

import { useState } from 'react';
import {
  sendStaffEmailVerification,
  verifyStaffEmail,
} from '@/lib/auth-api';

export function StaffEmailVerificationPanel() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function sendCode() {
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const result =
        await sendStaffEmailVerification(email.trim());

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

  async function verifyCode() {
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const result = await verifyStaffEmail(
        email.trim(),
        code.trim(),
      );

      setMessage(result.message);
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
    <section className="portal-section">
      <h2>Verify Staff Email</h2>

      <p>
        Enter the same email used in the staff application.
      </p>

      <label>
        Staff Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <button
        type="button"
        disabled={busy || !email.trim()}
        onClick={() => void sendCode()}
      >
        Send 6-digit Code
      </button>

      <label>
        Verification Code
        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value.replace(/\D/g, '').slice(0, 6),
            )
          }
          placeholder="000000"
        />
      </label>

      <button
        type="button"
        disabled={busy || code.length !== 6}
        onClick={() => void verifyCode()}
      >
        Verify Email
      </button>

      {message ? <p>{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
