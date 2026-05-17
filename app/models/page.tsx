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
  Groq: '#00d084',
  AIHorde: '#ec4899',
};

const TYPE_META: Record<string, { color: string; label: string; icon: string }> = {
  text:          { color: '#6366f1', label: 'Text', icon: '💬' },
  image:         { color: '#a855f7', label: 'Image', icon: '🖼️' },
  video:         { color: '#f43f5e', label: 'Video', icon: '🎬' },
  audio:         { color: '#22c55e', label: 'Audio', icon: '🔊' },
  transcription: { color: '#f59e0b', label: 'Transcription', icon: '📝' },
  embedding:     { color: '#06b6d4', label: 'Embedding', icon: '🔗' },
};

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

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

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const typeCount = (type: string) => models.filter((m) => (m.type || 'text') === type).length;
  const providerCount = (provider: string) => models.filter((m) => (m.provider || 'Unknown') === provider).length;

  return (
    <main>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(79, 70, 229, 0.1) 50%, rgba(59, 130, 246, 0.05) 100%)',
        borderBottom: '1px solid var(--border)',
        paddingTop: '80px',
        paddingBottom: '60px',
      }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '900',
            marginBottom: '16px',
            lineHeight: '1.1',
          }}>
            {models.length}+ AI Models
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            maxWidth: '700px',
            fontWeight: '500',
          }}>
            Access cutting-edge AI models across 8 providers. Text generation, image synthesis, video, audio, and more. All free.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
            <StatCard label="Providers" value={providers.length.toString()} color="var(--accent)" />
            <StatCard label="Text Models" value={typeCount('text').toString()} color="#6366f1" />
            <StatCard label="Image Models" value={typeCount('image').toString()} color="#a855f7" />
            <StatCard label="Model Types" value={types.length.toString()} color="#22c55e" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container" style={{ paddingTop: '60px', paddingBottom: '80px', maxWidth: '1200px' }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="Search models by ID, provider, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--fg)',
            }}
          />
        </div>

        {/* Filter Section */}
        <div style={{ marginBottom: '40px' }}>
          {/* Provider Filter */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-tertiary)',
              marginBottom: '12px',
              fontWeight: '700',
            }}>
              Filter by Provider
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <FilterChip
                label={`All Providers (${models.length})`}
                active={providerFilter === ''}
                color="var(--accent)"
                onClick={() => setProviderFilter('')}
              />
              {providers.map((p) => (
                <FilterChip
                  key={p}
                  label={`${p} (${providerCount(p)})`}
                  active={providerFilter === p}
                  color={PROVIDER_COLORS[p] || 'var(--accent)'}
                  onClick={() => setProviderFilter(providerFilter === p ? '' : p)}
                />
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <p style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--text-tertiary)',
              marginBottom: '12px',
              fontWeight: '700',
            }}>
              Filter by Type
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <FilterChip
                label="All Types"
                active={typeFilter === ''}
                color="var(--accent)"
                onClick={() => setTypeFilter('')}
              />
              {types.map((t) => (
                <FilterChip
                  key={t}
                  label={`${TYPE_META[t]?.icon} ${TYPE_META[t]?.label || t} (${typeCount(t)})`}
                  active={typeFilter === t}
                  color={TYPE_META[t]?.color || 'var(--accent)'}
                  onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <p style={{
          fontWeight: '600',
          marginBottom: '24px',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
        }}>
          {filtered.length} model{filtered.length !== 1 ? 's' : ''}
          {(providerFilter || typeFilter || search) ? ' matching filters' : ''}
        </p>

        {error && <div className="error" style={{ marginBottom: '24px' }}>{error}</div>}

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '60px 0', textAlign: 'center' }}>
            Loading {models.length} models...
          </p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '16px' }}>
              No models found matching your filters.
            </p>
            <button
              onClick={() => { setProviderFilter(''); setTypeFilter(''); setSearch(''); }}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--fg)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Model ID</th>
                  <th style={{ textAlign: 'left', padding: '16px 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '16px 12px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Provider</th>
                  <th style={{ textAlign: 'right', padding: '16px 0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((model) => {
                  const typeMeta = TYPE_META[model.type || 'text'] || TYPE_META.text;
                  const provColor = PROVIDER_COLORS[model.provider || ''] || '#666';
                  return (
                    <tr key={model.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '16px 0', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--fg-secondary)' }}>
                        {model.id}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '10px 6px 8px 12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          background: `${typeMeta.color}18`,
                          color: typeMeta.color,
                          border: `1px solid ${typeMeta.color}35`,
                        }}>
                          {typeMeta.icon} {typeMeta.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '10px 6px 8px 12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          background: `${provColor}18`,
                          color: provColor,
                          border: `1px solid ${provColor}35`,
                        }}>
                          {model.provider || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 0', textAlign: 'right' }}>
                        <button
                          onClick={() => copyToClipboard(model.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(59,130,246,0.3)',
                            background: 'rgba(59,130,246,0.1)',
                            color: '#93c5fd',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                          }}
                        >
                          {copied === model.id ? '✓ Copied' : 'Copy'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Box */}
        <div className="info-box" style={{ marginTop: '40px' }}>
          <p>
            <strong>How to use:</strong> Click "Copy" to copy any model ID, then pass it as the <code>model</code> parameter in your API request. Learn more in our <a href="/docs" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>documentation</a>.
          </p>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${color}30`,
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: '700', color, marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</div>
    </div>
  );
}

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        border: active ? `2px solid ${color}` : '1px solid var(--border)',
        background: active ? `${color}20` : 'transparent',
        color: active ? color : 'var(--fg-secondary)',
      }}
    >
      {label}
    </button>
  );
}
