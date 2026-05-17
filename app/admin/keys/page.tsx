'use client';

import { useState, useEffect } from 'react';

const PROVIDERS = ['AIHubMix', 'Pollinations', 'VoidAI', 'Airforce', 'Cerebras', 'Groq', 'AIHorde', 'TokenReply', 'NagaAI', 'Happupy'] as const;
type Provider = typeof PROVIDERS[number];

const PROVIDER_COLORS: Record<string, string> = {
  AIHubMix: '#6366f1',
  Pollinations: '#a855f7',
  VoidAI: '#06b6d4',
  Airforce: '#f59e0b',
  Cerebras: '#8b5cf6',
  Groq: '#00d084',
  AIHorde: '#ec4899',
  TokenReply: '#7c3aed',
  NagaAI: '#10b981',
  Happupy: '#f472b6',
};

const STATUS_META: Record<string, { color: string; label: string }> = {
  working:      { color: '#22c55e', label: 'Working' },
  rate_limited: { color: '#f59e0b', label: 'Rate Limited' },
  error:        { color: '#ef4444', label: 'Error' },
  unknown:      { color: '#6b7280', label: 'Unknown' },
};

interface KeyEntry {
  id: string;
  preview: string;
  source: 'env' | 'kv';
  status: string;
  createdAt: number | null;
}

interface ProvidersData {
  [provider: string]: KeyEntry[];
}

export default function KeysPage() {
  const [data, setData] = useState<ProvidersData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeProvider, setActiveProvider] = useState<Provider>('Pollinations');
  const [newKey, setNewKey] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchKeys(); }, []);

  async function fetchKeys() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/keys');
      const d = await res.json();
      if (d.error) setError(d.error);
      else setData(d.providers || {});
    } catch {
      setError('Failed to load keys');
    } finally {
      setLoading(false);
    }
  }

  async function addKey() {
    if (!newKey.trim()) { setAddError('Paste a key first'); return; }
    setAdding(true); setAddError(''); setAddSuccess('');
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: activeProvider, key: newKey.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setAddError(d.error || 'Failed to add key'); return; }
      setAddSuccess(`Key added (${d.preview}) — status: ${d.status}`);
      setNewKey('');
      await fetchKeys();
    } catch {
      setAddError('Network error');
    } finally {
      setAdding(false);
    }
  }

  async function refreshStatus(provider: string, id: string) {
    setRefreshing(id);
    try {
      const res = await fetch('/api/admin/keys/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, id }),
      });
      const d = await res.json();
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          [provider]: prev[provider]?.map((k) =>
            k.id === id ? { ...k, status: d.status } : k
          ) || [],
        }));
      }
    } finally {
      setRefreshing(null);
    }
  }

  async function deleteKey(provider: string, id: string) {
    if (!confirm('Delete this key?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/keys?provider=${provider}&id=${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          [provider]: prev[provider]?.filter((k) => k.id !== id) || [],
        }));
      }
    } finally {
      setDeleting(null);
    }
  }

  const keys = data[activeProvider] || [];
  const color = PROVIDER_COLORS[activeProvider] || 'var(--accent)';

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '80px', maxWidth: '1100px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Provider Keys</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '0.95rem' }}>
        Manage API keys for each provider. ENV keys are from environment variables. KV keys are stored encrypted in Redis.
      </p>

      {error && <div className="error">{error}</div>}

      {/* Provider tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {PROVIDERS.map((p) => {
          const count = data[p]?.length || 0;
          const pColor = PROVIDER_COLORS[p] || 'var(--accent)';
          return (
            <button
              key={p}
              onClick={() => { setActiveProvider(p); setAddError(''); setAddSuccess(''); setNewKey(''); }}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                border: activeProvider === p ? `2px solid ${pColor}` : '1px solid var(--border)',
                background: activeProvider === p ? `${pColor}20` : 'transparent',
                color: activeProvider === p ? pColor : 'var(--fg-secondary)',
              }}
            >
              {p} <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Add key form */}
      <section style={{ background: 'var(--bg-secondary)', border: `1px solid ${color}30`, borderRadius: 'var(--radius-xl)', padding: '28px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Add New {activeProvider} Key</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Key will be validated against {activeProvider}'s API before storing.
        </p>
        {addError && <div className="error">{addError}</div>}
        {addSuccess && <div className="success">{addSuccess}</div>}
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder={`Paste ${activeProvider} API key...`}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKey()}
            style={{ flex: 1, borderRadius: 'var(--radius-lg)' }}
          />
          <button onClick={addKey} disabled={adding} className="button">
            {adding ? 'Validating…' : 'Add Key'}
          </button>
        </div>
      </section>

      {/* Keys table */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : keys.length === 0 ? (
        <div style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No keys configured for {activeProvider}.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Key Preview</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const sm = STATUS_META[key.status] || STATUS_META.unknown;
                return (
                  <tr key={key.id}>
                    <td><code>{key.preview}</code></td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '700',
                        background: key.source === 'env' ? 'rgba(99,102,241,0.15)' : 'rgba(124,58,237,0.15)',
                        color: key.source === 'env' ? '#818cf8' : '#a78bfa',
                        letterSpacing: '0.5px',
                      }}>
                        {key.source.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px',
                        borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '600',
                        background: `${sm.color}18`, color: sm.color, border: `1px solid ${sm.color}35`,
                      }}>
                        {sm.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => refreshStatus(activeProvider, key.id)}
                          disabled={refreshing === key.id}
                          style={{
                            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                            color: '#93c5fd', padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                          }}
                        >
                          {refreshing === key.id ? '…' : 'Refresh'}
                        </button>
                        {key.source === 'kv' && (
                          <button
                            onClick={() => deleteKey(activeProvider, key.id)}
                            disabled={deleting === key.id}
                            style={{
                              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                              color: '#fca5a5', padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500',
                            }}
                          >
                            {deleting === key.id ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Capacity summary */}
      {keys.length > 0 && (
        <div className="info-box" style={{ marginTop: '24px' }}>
          <strong>{keys.length} key{keys.length !== 1 ? 's' : ''}</strong> = {keys.length * 60} req/min capacity for {activeProvider}
        </div>
      )}
    </main>
  );
}
