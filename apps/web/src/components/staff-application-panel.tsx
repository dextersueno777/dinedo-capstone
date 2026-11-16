'use client';

import { FormEvent, useState } from 'react';
import {
  applyForStaff,
  type StaffApplicationRole,
} from '@/lib/auth-api';
import { SecurityQuestionSetup } from './security-question-setup';

type Props = {
  role: StaffApplicationRole;
};

export function StaffApplicationPanel({ role }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setBusy(true);

    try {
      const result = await applyForStaff({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role,
        securityQuestions,
      });

      setMessage(result.message);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to submit staff application.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="portal-section staff-application">
      <h2>Apply as {role}</h2>

      <p>
        Staff access requires email verification and
        Super Admin approval.
      </p>

      <form onSubmit={submit}>
        <label>
          First Name
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>

        <label>
          Last Name
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Cellphone Number
          <input
            type="tel"
            inputMode="numeric"
            maxLength={11}
            value={phoneNumber}
            onChange={(e) =>
              setPhoneNumber(
                e.target.value.replace(/\D/g, '').slice(0, 11),
              )
            }
            required
          />
        </label>

        <label>
          Password
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? 'Hide password' : 'Show password'}
          </button>
        </label>

        <SecurityQuestionSetup
          role={role}
          value={securityQuestions}
          onChange={setSecurityQuestions}
        />

        <button type="submit" disabled={busy}>
          {busy ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>

      {message ? <p>{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
