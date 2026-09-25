'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from './auth-provider';

const demoAccounts = [
  {
    label: 'Customer',
    icon: '🍽️',
    email: 'customer.demo@dinedo.local',
    password: 'Customer123!',
  },
  {
    label: 'Admin',
    icon: '🛡️',
    email: 'admin@dinedo.local',
    password: 'ChangeMe123!',
  },
  {
    label: 'Kitchen',
    icon: '👨‍🍳',
    email: 'kitchen@dinedo.local',
    password: 'ChangeMe123!',
  },
  {
    label: 'Rider',
    icon: '🏍️',
    email: 'rider@dinedo.local',
    password: 'ChangeMe123!',
  },
];

function getRoleLabel(role: string) {
  return role.replaceAll('_', ' ').toLowerCase();
}

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

      setMessage(`Signed in as ${loggedInUser.email}.`);
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
      <section className="card auth-card auth-card-polished">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Checking saved login...</h2>
          <p>Preparing your DineDo session.</p>
        </div>
      </section>
    );
  }

  if (user) {
    return (
      <section className="card auth-card auth-card-polished">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Ready to use DineDo</h2>
          <p>
            <strong>{user.email}</strong> is signed in as{' '}
            <span className="role-badge">{getRoleLabel(user.role)}</span>.
          </p>
        </div>

        <button className="danger-button" type="button" onClick={logout}>
          Logout
        </button>
      </section>
    );
  }

  return (
    <section className="card auth-card auth-card-polished">
      <div className="auth-copy">
        <p className="eyebrow">Account</p>
        <h2>Sign in to order</h2>
        <p>
          Use the demo accounts to test customer ordering, admin review,
          kitchen preparation, and rider delivery flows.
        </p>
      </div>

      <div className="demo-account-grid" aria-label="Demo account shortcuts">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => {
              setEmail(account.email);
              setPassword(account.password);
              setMessage('');
              setError('');
            }}
          >
            <span>{account.icon}</span>
            {account.label}
          </button>
        ))}
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
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
}
