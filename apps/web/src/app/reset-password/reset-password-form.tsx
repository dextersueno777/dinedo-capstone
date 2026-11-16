'use client';

import { FormEvent, useState } from 'react';
import { resetPassword } from '@/lib/auth-api';

type Props = {
  token: string;
};

export function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Password reset link is missing or invalid.');
      return;
    }

    if (password !== confirm) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const result = await resetPassword({
        token,
        newPassword: password,
      });

      setMessage(result.message);
      setPassword('');
      setConfirm('');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to reset password.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        New Password
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <label>
        Confirm New Password
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          required
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>

      <button
        type="button"
        className="password-toggle"
        onClick={() => setShowPassword((current) => !current)}
      >
        {showPassword ? 'Hide passwords' : 'Show passwords'}
      </button>

      <button
        className="primary full-button"
        type="submit"
        disabled={busy || !token}
      >
        {busy ? 'Changing password...' : 'Change Password'}
      </button>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
}
