'use client';

import { useEffect, useState } from 'react';
import {
  getSecurityQuestionSetupStatus,
  setupSecurityQuestions,
} from '@/lib/auth-api';
import { useAuth } from './auth-provider';
import { SecurityQuestionSetup } from './security-question-setup';

export function SecurityQuestionExistingSetup() {
  const { user, token } = useAuth();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [questions, setQuestions] = useState([
    { questionKey: '', answer: '' },
    { questionKey: '', answer: '' },
    { questionKey: '', answer: '' },
  ]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      setConfigured(null);
      return;
    }

    getSecurityQuestionSetupStatus(token)
      .then((result) => setConfigured(result.configured))
      .catch(() => setError('Unable to check account recovery setup.'));
  }, [token, user]);

  if (!user || configured === null || configured) {
    return null;
  }

  const role =
    user.role === 'SUPERADMIN' ? 'ADMIN' : user.role;

  async function save() {
    if (!token) return;

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const result = await setupSecurityQuestions(
        token,
        questions,
      );

      setConfigured(true);
      setMessage(result.message);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to save security questions.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <p className="eyebrow">Account Recovery Setup</p>
      <h2>Set Up Your Security Questions</h2>

      <SecurityQuestionSetup
        role={role as 'CUSTOMER' | 'ADMIN' | 'KITCHEN' | 'RIDER'}
        value={questions}
        onChange={setQuestions}
      />

      <button
        className="primary full-button"
        type="button"
        disabled={busy}
        onClick={() => void save()}
      >
        {busy ? 'Saving...' : 'Save Recovery Questions'}
      </button>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
