'use client';

import { useState, useEffect } from 'react';

interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <main>
      <section className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <h1 style={{ marginBottom: '40px', textAlign: 'center' }}>Available Models</h1>

        <div className="info-box">
          <p style={{ marginBottom: '12px' }}>
            <strong>OpenRelay is powered by AIHubMix</strong>
          </p>
          <p style={{ marginBottom: '16px' }}>
            Access {models.length} free AI models including GPT-4o, Claude, Gemini, and more.
          </p>
          <a href="https://aihubmix.com/models" target="_blank" rel="noopener noreferrer" className="button">
            View All Models on AIHubMix
          </a>
        </div>

        <h2 style={{ marginTop: '60px', marginBottom: '24px' }}>All Models ({models.length})</h2>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <p>Loading models...</p>
        ) : models.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>
            No models available. Check your API configuration.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <td>
                      <code style={{ fontSize: '0.9rem' }}>{model.id}</code>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{model.owned_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ marginTop: '40px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Use any model ID above in your API requests. Copy the ID and use it in the <code>model</code> parameter.
        </p>

        <p style={{ marginTop: '20px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          For more details, visit{' '}
          <a href="https://aihubmix.com/models" target="_blank" rel="noopener noreferrer">
            AIHubMix Models
          </a>
        </p>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="/" className="button">Back Home</a>
        </div>
      </section>
    </main>
  );
}
