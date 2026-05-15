'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  apiKeyCount: number;
  requestsToday: number;
  requestsWeek: number;
  requestsTotal: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchUsers = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users${q ? `?search=${encodeURIComponent(q)}` : ''}`);
      const d = await res.json();
      if (d.error) setError(d.error);
      else setUsers(d.users || []);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function revokeKeys(userId: string, email: string) {
    if (!confirm(`Revoke all API keys for ${email}? This cannot be undone.`)) return;
    setRevoking(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage(`Revoked ${d.deleted} key(s) for ${email}`);
        await fetchUsers(search);
      } else {
        setError(d.error || 'Failed to revoke keys');
      }
    } finally {
      setRevoking(null);
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const q = e.target.value;
    const timer = setTimeout(() => fetchUsers(q), 400);
    return () => clearTimeout(timer);
  };

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '80px', maxWidth: '1100px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Users</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '0.95rem' }}>
        All registered users and their API key usage.
      </p>

      {error && <div className="error">{error}</div>}
      {message && (
        <div className="success" style={{ marginBottom: '24px' }}>
          {message}
          <button onClick={() => setMessage('')} style={{ marginLeft: '12px', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.7 }}>
            ✕
          </button>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search by email or name…"
        value={search}
        onChange={handleSearch}
        style={{ width: '100%', marginBottom: '28px', borderRadius: '16px 12px 14px 18px' }}
      />

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: '500' }}>
        {users.length} user{users.length !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : users.length === 0 ? (
        <div style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px 14px 18px 22px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No users found.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Joined</th>
                <th>API Keys</th>
                <th>Req Today</th>
                <th>Req Week</th>
                <th>Req Total</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{user.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{user.email}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px',
                      borderRadius: '8px 5px 6px 10px', fontSize: '0.8rem', fontWeight: '600',
                      background: user.apiKeyCount > 0 ? 'rgba(124,58,237,0.15)' : 'rgba(107,114,128,0.15)',
                      color: user.apiKeyCount > 0 ? '#a78bfa' : '#9ca3af',
                    }}>
                      {user.apiKeyCount}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500', fontSize: '0.9rem' }}>{user.requestsToday.toLocaleString()}</td>
                  <td style={{ fontWeight: '500', fontSize: '0.9rem' }}>{user.requestsWeek.toLocaleString()}</td>
                  <td style={{ fontWeight: '500', fontSize: '0.9rem' }}>{user.requestsTotal.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {user.apiKeyCount > 0 && (
                      <button
                        onClick={() => revokeKeys(user.id, user.email)}
                        disabled={revoking === user.id}
                        style={{
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#fca5a5', padding: '5px 12px', borderRadius: '8px 5px 6px 10px',
                          cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                        }}
                      >
                        {revoking === user.id ? '…' : 'Revoke Keys'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
