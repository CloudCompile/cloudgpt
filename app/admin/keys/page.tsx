'use client';

import { useState, useEffect, useCallback } from 'react';

interface ProviderInfo {
  id: string;
  name: string;
  keyCount: number;
  status: string;
}

interface KeyEntry {
  id: string;
  preview: string;
  source: 'env' | 'kv';
  status: string;
  createdAt: number | null;
  tier?: string;
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  working:      { color: '#22c55e', label: 'Working' },
  rate_limited: { color: '#f59e0b', label: 'Rate Limited' },
  error:        { color: '#ef4444', label: 'Error' },
  unknown:      { color: '#6b7280', label: 'Unknown' },
};

function providerColor(id: string): string {
  const COLORS = [
    '#a855f7', '#06b6d4', '#f59e0b', '#8b5cf6', '#00d084', '#ec4899',
    '#7c3aed', '#10b981', '#f472b6', '#3b82f6', '#ef4444', '#22c55e',
    '#f97316', '#6366f1', '#14b8a6', '#eab308', '#84cc16', '#0ea5e9',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function KeysPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [keys, setKeys] = useState<KeyEntry[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active'>('all');
  const [newKey, setNewKey] = useState('');
  const [newTier, setNewTier] = useState('Seed');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProviders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProviders() {
    setLoadingProviders(true);
    try {
      const res = await fetch('/api/providers');
      const d = await res.json();
      if (d.providers) {
        const list: ProviderInfo[] = d.providers.map((p: any) => ({
          id: p.id,
          name: p.name,
          keyCount: p.keyCount || 0,
          status: p.status,
        }));
        setProviders(list);
        if (list.length > 0) setSelectedId(list[0].id);
      }
    } catch {
      setError('Failed to load providers');
    } finally {
      setLoadingProviders(false);
    }
  }

  const fetchKeys = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingKeys(true);
    setKeys([]);
    try {
      const res = await fetch(`/api/admin/keys?provider=${encodeURIComponent(id)}`);
      const d = await res.json();
      if (d.error) setError(d.error);
      else setKeys(d.keys || []);
    } catch {
      setError('Failed to load keys');
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchKeys(selectedId);
  }, [selectedId, fetchKeys]);

  function selectProvider(id: string) {
    setSelectedId(id);
    setAddError('');
    setAddSuccess('');
    setNewKey('');
  }

  async function addKey() {
    if (!newKey.trim()) { setAddError('Paste a key first'); return; }
    setAdding(true); setAddError(''); setAddSuccess('');
    try {
      const body: Record<string, string> = { provider: selectedId, key: newKey.trim() };
      if (selectedId === 'pollinations') body.tier = newTier;
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setAddError(d.error || 'Failed to add key'); return; }
      setAddSuccess(`Key added (${d.preview}) — status: ${d.status}`);
      setNewKey('');
      await fetchKeys(selectedId);
      setProviders(prev => prev.map(p =>
        p.id === selectedId ? { ...p, keyCount: p.keyCount + 1 } : p
      ));
    } catch {
      setAddError('Network error');
    } finally {
      setAdding(false);
    }
  }

  async function refreshStatus(keyId: string) {
    setRefreshing(keyId);
    try {
      const res = await fetch('/api/admin/keys/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedId, id: keyId }),
      });
      const d = await res.json();
      if (res.ok) {
        setKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: d.status } : k));
      }
    } finally {
      setRefreshing(null);
    }
  }

  async function deleteKey(keyId: string) {
    if (!confirm('Delete this key?')) return;
    setDeleting(keyId);
    try {
      await fetch(`/api/admin/keys?provider=${encodeURIComponent(selectedId)}&id=${encodeURIComponent(keyId)}`, {
        method: 'DELETE',
      });
      setKeys(prev => prev.filter(k => k.id !== keyId));
      setProviders(prev => prev.map(p =>
        p.id === selectedId ? { ...p, keyCount: Math.max(0, p.keyCount - 1) } : p
      ));
    } finally {
      setDeleting(null);
    }
  }

  const filteredProviders = providers.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || (filter === 'active' && p.keyCount > 0);
    return matchSearch && matchFilter;
  });

  const selectedProvider = providers.find(p => p.id === selectedId);
  const color = selectedId ? providerColor(selectedId) : 'var(--accent)';
  const activeCount = providers.filter(p => p.keyCount > 0).length;

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '80px', maxWidth: '1300px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Provider Keys</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
        Manage API keys across all {providers.length > 0 ? providers.length : '—'} community providers.
        ENV keys come from environment variables; KV keys are stored encrypted in Redis.
      </p>

      {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Provider List */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', overflow: 'hidden',
          position: 'sticky', top: '80px',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <input
              type="text"
              placeholder="Search providers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', borderRadius: 'var(--radius)', marginBottom: '10px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                  border: filter === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: filter === 'all' ? 'rgba(139,92,246,0.12)' : 'transparent',
                  color: filter === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                All ({providers.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                  border: filter === 'active' ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: filter === 'active' ? 'rgba(139,92,246,0.12)' : 'transparent',
                  color: filter === 'active' ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                Has Keys ({activeCount})
              </button>
            </div>
          </div>
          <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {loadingProviders ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Loading…
              </div>
            ) : filteredProviders.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                No providers match
              </div>
            ) : (
              filteredProviders.map(p => {
                const pColor = providerColor(p.id);
                const isSelected = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectProvider(p.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 16px',
                      background: isSelected ? `${pColor}12` : 'transparent',
                      border: 'none',
                      borderLeft: isSelected ? `3px solid ${pColor}` : '3px solid transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'background 0.1s',
                    }}
                  >
                    <span style={{
                      fontSize: '0.82rem', fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? pColor : 'var(--fg-secondary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.name}
                    </span>
                    {p.keyCount > 0 && (
                      <span style={{
                        fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px',
                        borderRadius: '10px', background: `${pColor}20`, color: pColor,
                        flexShrink: 0, marginLeft: '6px',
                      }}>
                        {p.keyCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Key Management */}
        <div>
          {!selectedProvider ? (
            <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Select a provider to manage its keys.</p>
            </div>
          ) : (
            <>
              {/* Provider header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{selectedProvider.name}</h2>
                <span style={{
                  fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
                  background: selectedProvider.keyCount > 0 ? `${color}18` : 'rgba(107,114,128,0.12)',
                  color: selectedProvider.keyCount > 0 ? color : 'var(--text-tertiary)',
                  border: `1px solid ${selectedProvider.keyCount > 0 ? color + '30' : 'transparent'}`,
                }}>
                  {selectedProvider.keyCount} {selectedProvider.keyCount === 1 ? 'key' : 'keys'}
                </span>
              </div>

              {/* Add key form */}
              <section style={{
                background: 'var(--bg-secondary)', border: `1px solid ${color}30`,
                borderRadius: 'var(--radius-xl)', padding: '24px', marginBottom: '24px',
              }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>Add New Key</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '16px' }}>
                  Key will be validated against {selectedProvider.name}&apos;s API before storing.
                </p>
                {addError && <div className="error" style={{ marginBottom: '12px' }}>{addError}</div>}
                {addSuccess && <div className="success" style={{ marginBottom: '12px' }}>{addSuccess}</div>}

                {selectedId === 'pollinations' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '7px' }}>
                      Pollinations Tier
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { value: 'Seed',    pollen: '0.15/hr' },
                        { value: 'Flower',  pollen: '0.4/hr' },
                        { value: 'Spore',   pollen: '1.0/hr' },
                        { value: 'Premium', pollen: '3.0/hr' },
                      ].map(tier => (
                        <button
                          key={tier.value}
                          onClick={() => setNewTier(tier.value)}
                          style={{
                            padding: '6px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.8rem',
                            border: newTier === tier.value ? '1px solid #a855f7' : '1px solid var(--border)',
                            background: newTier === tier.value ? 'rgba(168,85,247,0.15)' : 'transparent',
                            color: newTier === tier.value ? '#d8b4fe' : 'var(--text-secondary)',
                          }}
                        >
                          {tier.value} <span style={{ opacity: 0.7 }}>{tier.pollen}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder={`Paste ${selectedProvider.name} API key…`}
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addKey()}
                    style={{ flex: 1, borderRadius: 'var(--radius-lg)' }}
                  />
                  <button onClick={addKey} disabled={adding} className="button">
                    {adding ? 'Validating…' : 'Add Key'}
                  </button>
                </div>
              </section>

              {/* Keys table */}
              {loadingKeys ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading keys…</p>
              ) : keys.length === 0 ? (
                <div style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No keys configured for {selectedProvider.name}.</p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Key Preview</th>
                          {selectedId === 'pollinations' && <th>Tier</th>}
                          <th>Source</th>
                          <th>Status</th>
                          <th>Added</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map(key => {
                          const sm = STATUS_META[key.status] || STATUS_META.unknown;
                          return (
                            <tr key={key.id}>
                              <td><code>{key.preview}</code></td>
                              {selectedId === 'pollinations' && (
                                <td>
                                  {key.tier ? (
                                    <span style={{
                                      display: 'inline-block', padding: '3px 8px',
                                      borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '700',
                                      background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', letterSpacing: '0.5px',
                                    }}>
                                      {key.tier}
                                    </span>
                                  ) : '—'}
                                </td>
                              )}
                              <td>
                                <span style={{
                                  display: 'inline-block', padding: '3px 8px',
                                  borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: '700',
                                  background: key.source === 'env' ? 'rgba(99,102,241,0.15)' : 'rgba(124,58,237,0.15)',
                                  color: key.source === 'env' ? '#818cf8' : '#a78bfa', letterSpacing: '0.5px',
                                }}>
                                  {key.source === 'env' ? 'ENV' : key.id.startsWith('donor-') ? 'DONOR' : 'KV'}
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
                                    onClick={() => refreshStatus(key.id)}
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
                                      onClick={() => deleteKey(key.id)}
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

                  {/* Capacity summary */}
                  <div className="info-box" style={{ marginTop: '16px' }}>
                    <strong>{keys.length} key{keys.length !== 1 ? 's' : ''}</strong>
                    {selectedId === 'pollinations' ? (
                      <>
                        {' = '}
                        <span style={{ fontWeight: '700' }}>
                          {(() => {
                            const tierMap: Record<string, number> = { Seed: 0.15, Flower: 0.4, Spore: 1.0, Premium: 3.0 };
                            const total = keys.reduce((sum, k) => sum + (tierMap[k.tier || 'Seed'] || 0.15), 0);
                            return `${total.toFixed(2)} pollen/hour`;
                          })()}
                        </span>
                        {' capacity for Pollinations'}
                      </>
                    ) : (
                      <> = ~{keys.length * 60} req/min estimated capacity for {selectedProvider.name}</>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
