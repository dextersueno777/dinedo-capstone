'use client';

import { FormEvent, useState } from 'react';
import {
  getPasswordRecoveryQuestions,
  requestPasswordRecovery,
  type PasswordRecoveryQuestion,
} from '@/lib/auth-api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [questions, setQuestions] =
    useState<PasswordRecoveryQuestion[]>([]);
  const [answers, setAnswers] = useState(['', '', '']);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadQuestions(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    try {
      const result =
        await getPasswordRecoveryQuestions(email);

      setQuestions(result.questions);
      setAnswers(['', '', '']);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to start password recovery.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitRecovery(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    try {
      const result = await requestPasswordRecovery({
        email,
        reason,
        answers: questions.map((question, index) => ({
          questionKey: question.questionKey,
          answer: answers[index],
        })),
      });

      setMessage(result.message);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to submit recovery request.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="portal-shell">
      <section className="card auth-card auth-card-polished">
        <div className="auth-copy">
          <p className="eyebrow">Account Recovery</p>
          <h1>Forgot Password</h1>
          <p>
            Verify your identity using the three security
            questions you selected when your account was
            created.
          </p>
        </div>

        {questions.length === 0 ? (
          <form className="auth-form" onSubmit={loadQuestions}>
            <label>
              Registered Email
              <input
                type="email"
                value={email}
                autoComplete="email"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button
              className="primary full-button"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Checking...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitRecovery}>
            <p className="warning-text">
              <strong>! Important:</strong> Answer all three
              questions using the answers you originally saved.
              Administrators cannot see your saved answers.
            </p>

            {questions.map((question, index) => (
              <label key={question.questionKey}>
                {question.text}
                <input
                  type="text"
                  value={answers[index]}
                  autoComplete="off"
                  minLength={2}
                  maxLength={120}
                  required
                  onChange={(e) =>
                    setAnswers((current) =>
                      current.map((answer, i) =>
                        i === index ? e.target.value : answer,
                      ),
                    )
                  }
                />
              </label>
            ))}

            <label>
              Reason for Password Recovery
              <textarea
                value={reason}
                minLength={10}
                maxLength={500}
                required
                placeholder="Explain why you need to reset your password."
                onChange={(e) => setReason(e.target.value)}
              />
            </label>

            <button
              className="primary full-button"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        )}

        {message ? (
          <p className="success-text">{message}</p>
        ) : null}

        {error ? (
          <p className="error-text">{error}</p>
        ) : null}
      </section>
    </main>
  );
}
