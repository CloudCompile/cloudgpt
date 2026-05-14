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
  const filteredModels = providerFilter
    ? models.filter((m) => (m.provider || 'Unknown') === providerFilter)
    : models;

  const providerColors: Record<string, string> = {
    AIHubMix: '#3b82f6',
    Pollinations: '#8b5cf6',
  };

  return (
    <main>
      <section className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <h1 style={{ marginBottom: '40px', textAlign: 'center' }}>Available Models</h1>

        <div className="info-box">
          <p style={{ marginBottom: '12px' }}>
            <strong>OpenRelay is powered by multiple providers</strong>
          </p>
          <p style={{ marginBottom: '16px' }}>
            Access {models.length} free AI models from AIHubMix, Pollinations, and more.
          </p>
        </div>

        <h2 style={{ marginTop: '60px', marginBottom: '24px' }}>Providers</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <button
            onClick={() => setProviderFilter('')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: providerFilter === '' ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: providerFilter === '' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: 'var(--fg)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            All ({models.length})
          </button>
          {providers.map((provider) => {
            const count = models.filter((m) => (m.provider || 'Unknown') === provider).length;
            return (
              <button
                key={provider}
                onClick={() => setProviderFilter(provider)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border:
                    providerFilter === provider
                      ? `2px solid ${providerColors[provider as string] || 'var(--accent)'}`
                      : '1px solid var(--border)',
                  background:
                    providerFilter === provider
                      ? `rgba(${hexToRgb(providerColors[provider as string] || '#3b82f6')}, 0.1)`
                      : 'transparent',
                  color: 'var(--fg)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {provider} ({count})
              </button>
            );
          })}
        </div>

        <h2 style={{ marginTop: '40px', marginBottom: '24px' }}>
          {filteredModels.length} {providerFilter ? `${providerFilter} ` : ''}
          {filteredModels.length === 1 ? 'Model' : 'Models'}
        </h2>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <p>Loading models...</p>
        ) : filteredModels.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No models found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Provider</th>
                  <th style={{ display: 'none', maxWidth: '400px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map((model) => (
                  <tr key={model.id}>
                    <td>
                      <code style={{ fontSize: '0.85rem' }}>{model.id}</code>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          background: `${providerColors[model.provider as string] || '#666'}20`,
                          color: providerColors[model.provider as string] || '#999',
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

        <p style={{ marginTop: '40px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Use any model ID above in your API requests. Copy the ID and use it in the <code>model</code> parameter.
        </p>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="/" className="button">Back Home</a>
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
