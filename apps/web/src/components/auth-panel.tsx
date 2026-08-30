'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from './auth-provider';

export function AuthPanel() {
  const { user, isLoading, login, logout } = useAuth();
  const [email, setEmail] = useState('customer.demo@dinedo.local');
  const [password, setPassword] = useState('Customer123!');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({
        email,
        password,
      });

      setMessage(`Logged in as ${loggedInUser.email}.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Login failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="card">
        <h2>Authentication</h2>
        <p>Checking saved login...</p>
      </section>
    );
  }

  if (user) {
    return (
      <section className="card auth-card">
        <div>
          <h2>Logged In</h2>
          <p>
            {user.email} is currently signed in as <strong>{user.role}</strong>.
          </p>
        </div>

        <button className="danger-button" type="button" onClick={logout}>
          Logout
        </button>
      </section>
    );
  }

  return (
    <section className="card auth-card">
      <div>
        <h2>Demo Login</h2>
        <p>
          Use the seeded test account to verify frontend and backend
          authentication.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleLogin}>
        <label>
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button className="primary full-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>

        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
}
