'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getSecurityQuestions,
  type SecurityQuestionAnswerPayload,
  type SecurityQuestionOption,
} from '@/lib/auth-api';

type Props = {
  role: 'CUSTOMER' | 'ADMIN' | 'KITCHEN' | 'RIDER';
  value: SecurityQuestionAnswerPayload[];
  onChange: (value: SecurityQuestionAnswerPayload[]) => void;
};

export function SecurityQuestionSetup({
  role,
  value,
  onChange,
}: Readonly<Props>) {
  const [questions, setQuestions] = useState<SecurityQuestionOption[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getSecurityQuestions(role)
      .then((result) => {
        setQuestions(result.questions);
        setError('');
      })
      .catch(() => setError('Unable to load security questions.'));
  }, [role]);

  const selected = useMemo(
    () => new Set(value.map((item) => item.questionKey).filter(Boolean)),
    [value],
  );

  function updateQuestion(index: number, questionKey: string) {
    onChange(
      value.map((item, i) =>
        i === index
          ? { ...item, questionKey, answer: '' }
          : item,
      ),
    );
  }

  function updateAnswer(index: number, answer: string) {
    onChange(
      value.map((item, i) =>
        i === index ? { ...item, answer } : item,
      ),
    );
  }

  return (
    <div className="security-setup">
      <div className="security-setup-heading">
        <div className="security-shield">!</div>

        <div>
          <h3>Account Recovery Security Questions</h3>
          <p>
            Choose three questions that are personal and easy for
            you to remember, but difficult for other people to guess.
          </p>
        </div>
      </div>

      <div className="security-reminder">
        <strong>Important</strong>
        <span>
          Remember your answers and keep them private. DineDo may
          use all three answers to verify your identity if you forget
          your password. Administrators cannot view your saved answers.
        </span>
      </div>

      {role === 'ADMIN' ? (
        <div className="admin-question-note">
          Admin accounts must select at least one question marked
          <strong> Admin only</strong>.
        </div>
      ) : null}

      <div className="security-question-list">
        {value.map((item, index) => (
          <div className="security-question-card" key={index}>
            <div className="security-question-number">
              <span>{index + 1}</span>
              <strong>Security Question</strong>
            </div>

            <label className="security-field">
              <span>Choose your question</span>
              <select
                value={item.questionKey}
                required
                onChange={(event) =>
                  updateQuestion(index, event.target.value)
                }
              >
                <option value="">Select a security question</option>

                {questions.map((question) => (
                  <option
                    key={question.key}
                    value={question.key}
                    disabled={
                      selected.has(question.key) &&
                      question.key !== item.questionKey
                    }
                  >
                    {question.adminOnly
                      ? `Admin only — ${question.text}`
                      : question.text}
                  </option>
                ))}
              </select>
            </label>

            <label className="security-field">
              <span>Your answer</span>
              <input
                type="text"
                value={item.answer}
                minLength={2}
                maxLength={120}
                autoComplete="off"
                placeholder="Enter an answer you will remember"
                required
                onChange={(event) =>
                  updateAnswer(index, event.target.value)
                }
              />
            </label>
          </div>
        ))}
      </div>

      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
