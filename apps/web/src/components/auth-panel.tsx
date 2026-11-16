'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useAuth } from './auth-provider';
import { SecurityQuestionSetup } from './security-question-setup';

function getRoleLabel(role: string) {
  return role.replaceAll('_', ' ').toLowerCase();
}

type AuthPanelProps = {
  customerExperience?: boolean;
  superAdminExperience?: boolean;
  adminExperience?: boolean;
  loginOnly?: boolean;
  allowedLoginRoles?: string[];
};

export function AuthPanel({
  customerExperience = false,
  superAdminExperience = false,
  adminExperience = false,
  loginOnly = false,
  allowedLoginRoles,
}: Readonly<AuthPanelProps>) {
  const { user, isLoading, login, register, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ownerContactNumber, setOwnerContactNumber] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [securityQuestions, setSecurityQuestions] = useState([
    { questionKey: '', answer: '' },
    { questionKey: '', answer: '' },
    { questionKey: '', answer: '' },
  ]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      if (
        superAdminExperience &&
        ownerContactNumber.trim().length !== 11
      ) {
        throw new Error(
          'Enter the 11-digit Super Admin contact number.',
        );
      }

      const loggedInUser = await login({
        email,
        password,
        ownerContactNumber: ownerContactNumber.trim() || undefined,
      });

      if (
        allowedLoginRoles &&
        !allowedLoginRoles.includes(loggedInUser.role)
      ) {
        logout();

        const roleLabel = getRoleLabel(loggedInUser.role);
        const readableRole =
          roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1);

        throw new Error(
          `This account is registered as ${readableRole} staff. Please use the ${readableRole} portal.`,
        );
      }

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

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loginOnly) {
      setError('Registration is not available from this login form.');
      return;
    }

    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const registeredUser = await register({
        email,
        password,
        firstName,
        lastName,
        phoneNumber: phoneNumber.trim(),
        securityQuestions,
      });

      setMessage(`Account created for ${registeredUser.email}.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Registration failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section id="account" className="card auth-card auth-card-polished">
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
      <section id="account" className="card auth-card auth-card-polished">
        <div>
          <p className="eyebrow">Account</p>
          <h2>
            {customerExperience ? 'Your DineDo account' : 'Ready to use DineDo'}
          </h2>
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
    <section id="account" className="card auth-card auth-card-polished">
      <div className="auth-copy">
        <p className="eyebrow">Account</p>
        <h2>
          {mode === 'login'
            ? customerExperience
              ? 'Welcome back'
              : 'Sign in to DineDo'
            : 'Create your DineDo account'}
        </h2>

        <p>
          {customerExperience
            ? 'Sign in or create an account to order food, manage reservations, track orders, and receive updates.'
            : 'Sign in using your assigned DineDo account to access the appropriate system workflow.'}
        </p>
      </div>

      {!loginOnly ? (
        <div className="button-row">
          <button
            type="button"
            className={mode === 'login' ? 'primary' : 'secondary'}
            onClick={() => setMode('login')}
          >
            Sign in
          </button>

          <button
            type="button"
            className={mode === 'register' ? 'primary' : 'secondary'}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>
      ) : null}

      <form
        className="auth-form"
        onSubmit={mode === 'login' ? handleLogin : handleRegister}
      >
        {mode === 'register' ? (
          <>
            <label>
              First Name
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>

            <label>
              Last Name
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </label>

            <label>
              Phone Number
              <input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                pattern="09[0-9]{9}"
                value={phoneNumber}
                placeholder="09XXXXXXXXX"
                onChange={(event) =>
                  setPhoneNumber(
                    event.target.value.replace(/\D/g, '').slice(0, 11),
                  )
                }
                required
              />
            </label>
          </>
        ) : null}

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
            type={showPassword ? "text" : "password"}
            value={password}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Hide password' : 'Show password'}
          </button>
        </label>

        {mode === 'register' ? (
          <SecurityQuestionSetup
            role="CUSTOMER"
            value={securityQuestions}
            onChange={setSecurityQuestions}
          />
        ) : null}

        {mode === 'login' &&
        (superAdminExperience || adminExperience) ? (
          <label>
            {superAdminExperience
              ? 'Owner Contact Number'
              : 'Owner Contact Number (Super Admin only)'}
            <input
              type="tel"
              value={ownerContactNumber}
              inputMode="numeric"
              autoComplete="tel"
              maxLength={11}
              placeholder={
                superAdminExperience
                  ? '11-digit Super Admin contact number'
                  : 'Required only when signing in as Super Admin'
              }
              required={superAdminExperience}
              onChange={(event) =>
                setOwnerContactNumber(event.target.value.replace(/\D/g, '').slice(0, 11))
              }
            />
          </label>
        ) : null}

        {mode === 'login' && !superAdminExperience ? (
          <p>
            <Link href="/forgot-password">
              Forgot password?
            </Link>
          </p>
        ) : null}

        <button className="primary full-button" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === 'login'
              ? 'Signing in...'
              : 'Creating account...'
            : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
        </button>

        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
}
