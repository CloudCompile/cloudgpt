'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface BugReport {
  id: string;
  source: string;
  description: string;
  timestamp: string;
  status: string;
  user_id?: string;
  discord_user?: string;
}

export default function BugsPage() {
  const { userId, isSignedIn } = useAuth();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSignedIn) return;
    fetchBugs();
  }, [isSignedIn]);

  async function fetchBugs() {
    try {
      const response = await fetch('/api/admin/bugs');
      if (!response.ok) throw new Error('Failed to fetch bugs');
      const data = await response.json();
      setBugs(data.bugs || []);
      setError('');
    } catch (err) {
      setError('Failed to load bugs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!isSignedIn) {
    return (
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center' }}>
        <h1>Bug Reports</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in to view bug reports.</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '100px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', fontSize: '2rem' }}>Bug Reports</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
            {bugs.length} bug{bugs.length !== 1 ? 's' : ''} reported
          </p>
        </div>
        <button
          onClick={fetchBugs}
          className="button"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '12px',
          color: '#dc2626',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>
      ) : bugs.length === 0 ? (
        <div style={{
          padding: '40px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)' }}>No bug reports yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bugs.map((bug) => (
            <div
              key={bug.id}
              style={{
                padding: '20px 24px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '18px 14px 16px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>
                    {bug.source === 'discord' ? '🔵 Discord' : '🌐 Website'}
                  </p>
                  <code style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    display: 'inline-block',
                    marginTop: '4px',
                  }}>
                    {bug.id}
                  </code>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: bug.status === 'pending' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: bug.status === 'pending' ? '#3b82f6' : '#22c55e',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}>
                    {bug.status}
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    {new Date(bug.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p style={{
                margin: '0 0 8px 0',
                color: 'var(--text-primary)',
                lineHeight: '1.5',
              }}>
                {bug.description}
              </p>

              {bug.discord_user && (
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  margin: '8px 0 0 0',
                }}>
                  From: {bug.discord_user}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
