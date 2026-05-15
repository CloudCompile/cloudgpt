'use client';

import { useState, useEffect } from 'react';

interface Model {
  id: string;
  object: string;
  owned_by: string;
  provider?: string;
  type?: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  AIHubMix: '#6366f1',
  Pollinations: '#a855f7',
  VoidAI: '#06b6d4',
  Airforce: '#f59e0b',
  Cerebras: '#8b5cf6',
};

const TYPE_META: Record<string, { color: string; label: string }> = {
  text:          { color: '#6366f1', label: 'Text' },
  image:         { color: '#a855f7', label: 'Image' },
  video:         { color: '#f43f5e', label: 'Video' },
  audio:         { color: '#22c55e', label: 'Audio' },
  transcription: { color: '#f59e0b', label: 'Transcription' },
  embedding:     { color: '#06b6d4', label: 'Embedding' },
};

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchModels(); }, []);

  async function fetchModels() {
    try {
      const res = await fetch('/api/v1/models');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setModels(data.data || []);
    } catch {
      setError('Failed to load models. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const providers = [...new Set(models.map((m) => m.provider || 'Unknown'))].sort();
  const types = [...new Set(models.map((m) => m.type || 'text'))].sort();

  let filtered = models;
  if (providerFilter) filtered = filtered.filter((m) => (m.provider || 'Unknown') === providerFilter);
  if (typeFilter)    filtered = filtered.filter((m) => (m.type || 'text') === typeFilter);
  if (search)        filtered = filtered.filter((m) => m.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <main>
      <section className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <h1 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '16px' }}>
          AI Models
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '50px', fontSize: '1.05rem' }}>
          {models.length} free models across 6 providers
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by model ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: '32px', borderRadius: '16px 12px 14px 18px' }}
        />

        {/* Provider filter */}
        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '12px', fontWeight: '600' }}>Provider</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <FilterChip label={`All (${models.length})`} active={providerFilter === ''} color="var(--accent)" onClick={() => setProviderFilter('')} />
          {providers.map((p) => (
            <FilterChip key={p} label={`${p} (${models.filter((m) => (m.provider || 'Unknown') === p).length})`}
              active={providerFilter === p} color={PROVIDER_COLORS[p] || 'var(--accent)'}
              onClick={() => setProviderFilter(providerFilter === p ? '' : p)} />
          ))}
        </div>

        {/* Type filter */}
        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '12px', fontWeight: '600' }}>Type</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <FilterChip label="All Types" active={typeFilter === ''} color="var(--accent)" onClick={() => setTypeFilter('')} />
          {types.map((t) => (
            <FilterChip key={t} label={TYPE_META[t]?.label || t}
              active={typeFilter === t} color={TYPE_META[t]?.color || 'var(--accent)'}
              onClick={() => setTypeFilter(typeFilter === t ? '' : t)} />
          ))}
        </div>

        <p style={{ fontWeight: '600', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {filtered.length} model{filtered.length !== 1 ? 's' : ''}
          {(providerFilter || typeFilter || search) ? ' matching filters' : ''}
        </p>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '40px 0', textAlign: 'center' }}>Loading models...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '40px 0', textAlign: 'center' }}>No models found.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
            <table>
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Type</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((model) => {
                  const typeMeta = TYPE_META[model.type || 'text'] || TYPE_META.text;
                  const provColor = PROVIDER_COLORS[model.provider || ''] || '#666';
                  return (
                    <tr key={model.id}>
                      <td><code>{model.id}</code></td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px', borderRadius: '10px 6px 8px 12px',
                          fontSize: '0.8rem', fontWeight: '600',
                          background: `${typeMeta.color}18`, color: typeMeta.color,
                          border: `1px solid ${typeMeta.color}35`,
                        }}>
                          {typeMeta.label}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px', borderRadius: '10px 6px 8px 12px',
                          fontSize: '0.8rem', fontWeight: '600',
                          background: `${provColor}18`, color: provColor,
                          border: `1px solid ${provColor}35`,
                        }}>
                          {model.provider || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="info-box">
          <p>
            <strong>How to use:</strong> Copy any model ID and pass it as the <code>model</code> parameter in your API request. Learn more in our <a href="/docs">documentation</a>.
          </p>
        </div>
      </section>
    </main>
  );
}

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px', borderRadius: '14px 10px 12px 16px', cursor: 'pointer',
        fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.2s ease',
        border: active ? `2px solid ${color}` : '1px solid var(--border)',
        background: active ? `${color}20` : 'transparent',
        color: active ? color : 'var(--fg-secondary)',
      }}
    >
      {label}
    </button>
  );
}
