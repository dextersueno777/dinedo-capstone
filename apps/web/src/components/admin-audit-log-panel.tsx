'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { AdminAuditLog } from '@/lib/api-types';
import { getAdminAuditLogs } from '@/lib/admin-audit-log-api';
import { useAuth } from './auth-provider';

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-PH');
}

function formatMetadata(value: unknown) {
  if (!value) {
    return 'No metadata';
  }

  try {
    return JSON.stringify(value);
  } catch {
    return 'Unable to display metadata';
  }
}

export function AdminAuditLogPanel() {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [branchCode, setBranchCode] = useState('TINOC');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function loadLogs() {
    if (!token || user?.role !== 'ADMIN') {
      setLogs([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const loadedLogs = await getAdminAuditLogs(token, {
        branchCode: branchCode.trim() || undefined,
        action: action.trim() || undefined,
        entityType: entityType.trim() || undefined,
        entityId: entityId.trim() || undefined,
        actorId: actorId.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      });

      setLogs(loadedLogs);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to load audit logs.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [token, user?.role]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadLogs();
  }

  return (
    <section id="admin-audit-logs" className="card">
      <div className="admin-audit-heading">
        <div>
          <p className="eyebrow">Admin Module</p>
          <h2>Audit Logs</h2>
          <p>Review recorded admin actions and system activity history.</p>
        </div>

        <button className="secondary" type="button" onClick={loadLogs}>
          Refresh
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {user?.role !== 'ADMIN' ? (
        <p>Login as an admin to view audit logs.</p>
      ) : null}

      {user?.role === 'ADMIN' ? (
        <>
          <form className="admin-audit-filter" onSubmit={handleSearch}>
            <input
              value={branchCode}
              onChange={(event) => setBranchCode(event.target.value)}
              placeholder="Branch code"
            />

            <input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="Action filter"
            />

            <input
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              placeholder="Entity type"
            />

            <input
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
              placeholder="Entity ID"
            />

            <input
              value={actorId}
              onChange={(event) => setActorId(event.target.value)}
              placeholder="Actor user ID"
            />

            <input
              type="datetime-local"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />

            <input
              type="datetime-local"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />

            <button className="secondary full-button" type="submit" disabled={isLoading}>
              Search Logs
            </button>
          </form>

          <div className="admin-audit-list">
            {isLoading ? <p>Loading audit logs...</p> : null}

            {!isLoading && logs.length === 0 ? (
              <p>No audit logs found.</p>
            ) : null}

            {logs.map((log) => (
              <article className="admin-audit-card" key={log.id}>
                <div className="admin-audit-card-header">
                  <div>
                    <h3>{log.action}</h3>
                    <p>{formatDate(log.createdAt)}</p>
                  </div>

                  <span className="status-pill">{log.entityType}</span>
                </div>

                <div className="admin-audit-summary-grid">
                  <p><strong>Entity ID:</strong> {log.entityId ?? 'N/A'}</p>
                  <p><strong>Branch:</strong> {log.branch?.name ?? 'N/A'}</p>
                  <p><strong>Actor:</strong> {log.actor?.email ?? 'System'}</p>
                  <p><strong>Role:</strong> {log.actor?.role ?? 'N/A'}</p>
                </div>

                <p><strong>Description:</strong> {log.description ?? 'No description'}</p>

                <pre className="admin-audit-metadata">
                  {formatMetadata(log.metadata)}
                </pre>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
