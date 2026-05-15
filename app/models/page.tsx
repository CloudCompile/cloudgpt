'use client';

import { useState, useEffect } from 'react';

interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  provider?: string;
  description?: string;
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    try {
      const response = await fetch('/api/v1/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      setModels(data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load models. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const providers = [...new Set(models.map((m) => m.provider || 'Unknown'))].sort();
  let filteredModels = providerFilter
    ? models.filter((m) => (m.provider || 'Unknown') === providerFilter)
    : models;

  if (searchTerm) {
    filteredModels = filteredModels.filter((m) =>
      m.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const providerColors: Record<string, string> = {
    AIHubMix: '#3b82f6',
    Pollinations: '#8b5cf6',
    VoidAI: '#06b6d4',
    Airforce: '#f59e0b',
  };

  return (
    <main>
      <section className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <h1 style={{ marginBottom: '20px', textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>AI Models</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '50px', fontSize: '1.05rem' }}>
          Browse {models.length} free AI models from multiple providers
        </p>

        <div className="info-box">
          <p style={{ marginBottom: '0' }}>
            <strong>✨ 100+ Free Models</strong> from <strong>AIHubMix</strong>, <strong>Pollinations</strong>, <strong>VoidAI</strong>, and <strong>Airforce</strong> — all powered by OpenRelay.
          </p>
        </div>

        <div style={{ marginTop: '40px', marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              color: 'var(--fg)',
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        <h2 style={{ marginBottom: '20px', fontSize: '1.3rem', fontWeight: '600' }}>Filter by Provider</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '50px' }}>
          <button
            onClick={() => setProviderFilter('')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: providerFilter === '' ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: providerFilter === '' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: providerFilter === '' ? 'var(--accent)' : 'var(--fg)',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
          >
            All ({models.length})
          </button>
          {providers.map((provider) => {
            const count = models.filter((m) => (m.provider || 'Unknown') === provider).length;
            const color = providerColors[provider as string] || 'var(--accent)';
            return (
              <button
                key={provider}
                onClick={() => setProviderFilter(provider)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: providerFilter === provider ? `2px solid ${color}` : '1px solid var(--border)',
                  background:
                    providerFilter === provider ? `${color}20` : 'transparent',
                  color: providerFilter === provider ? color : 'var(--fg)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
              >
                {provider} ({count})
              </button>
            );
          })}
        </div>

        <h2 style={{ marginBottom: '20px', fontSize: '1.3rem', fontWeight: '600' }}>
          {filteredModels.length} {providerFilter ? `${providerFilter} ` : ''}
          {filteredModels.length === 1 ? 'Model' : 'Models'}
        </h2>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <p>Loading models...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <p>No models found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
            <table>
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map((model) => (
                  <tr key={model.id}>
                    <td style={{ fontFamily: "'Monaco', 'Courier New', monospace" }}>
                      <code>{model.id}</code>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          background: `${providerColors[model.provider as string] || '#666'}20`,
                          color: providerColors[model.provider as string] || '#999',
                          border: `1px solid ${providerColors[model.provider as string] || '#666'}40`,
                        }}
                      >
                        {model.provider || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '24px', marginTop: '40px', marginBottom: '40px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0' }}>
            <strong style={{ color: 'var(--fg)' }}>How to use:</strong> Copy any model ID and use it in the <code>model</code> parameter of your API requests.
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <a href="/" className="button">← Back Home</a>
        </div>
      </section>
    </main>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '59, 130, 246';
}
