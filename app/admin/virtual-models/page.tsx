'use client';

import { useState, useEffect } from 'react';

interface VirtualModel {
  id: string;
  providers: Array<{ provider: string; modelId: string; type: string }>;
}

export default function VirtualModelsPage() {
  const [models, setModels] = useState<VirtualModel[]>([]);
  const [availableModels, setAvailableModels] = useState<Record<string, any[]>>({});
  const [newModelName, setNewModelName] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string[]>>({});;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchModels(); }, []);

  async function fetchModels() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/virtual-models');
      const d = await res.json();
      setModels(d.models || []);
      setAvailableModels(d.availableModels || {});
      if (d.error) setError(d.error);
    } catch {
      setError('Failed to load models');
    } finally {
      setLoading(false);
    }
  }

  function handleProviderSelect(provider: string, modelId: string, checked: boolean) {
    setSelectedProviders(prev => {
      const current = prev[provider] || [];
      if (checked) {
        return { ...prev, [provider]: [...current, modelId] };
      } else {
        return { ...prev, [provider]: current.filter(m => m !== modelId) };
      }
    });
  }

  async function createModel() {
    if (!newModelName.trim()) {
      setError('Model name is required');
      return;
    }
    const hasSelection = Object.values(selectedProviders).some(models => models.length > 0);
    if (!hasSelection) {
      setError('Select at least one model from a provider');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        id: newModelName.toLowerCase().replace(/\s+/g, '-'),
        providers: Object.entries(selectedProviders).flatMap(([provider, modelIds]) =>
          modelIds.map(modelId => ({
            provider,
            modelId,
            type: availableModels[provider]?.find((m: any) => m.id === modelId)?.type ?? 'text'
          }))
        )
      };
      console.log('Creating model with payload:', payload);

      const res = await fetch('/api/admin/virtual-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      console.log('Response status:', res.status, 'Response:', d);

      if (!res.ok) {
        setError(d.error || `Failed to create model (${res.status})`);
        return;
      }
      setSuccess(`Virtual model "${newModelName}" created!`);
      setNewModelName('');
      setSelectedProviders({});
      await fetchModels();
    } catch (err) {
      console.error('Error creating model:', err);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteModel(id: string) {
    if (!confirm('Delete this virtual model?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/virtual-models?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Model deleted');
        await fetchModels();
      } else {
        setError('Failed to delete model');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '80px', maxWidth: '1100px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Virtual Models</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '0.95rem' }}>
        Create virtual models that route across multiple providers with automatic fallback.
      </p>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Create Model Form */}
      <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px 16px 20px 22px', padding: '28px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Create Virtual Model</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Model Name</label>
          <input
            type="text"
            placeholder="e.g., gpt-5, claude-ultra"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            style={{ width: '100%', maxWidth: '400px', borderRadius: '16px 12px 14px 18px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', fontWeight: '600' }}>Select Providers</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {Object.entries(availableModels).map(([provider, modelList]) => (
              <div key={provider} style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                  {provider} ({modelList.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {modelList.map((model: any) => (
                    <label key={model.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', padding: '4px 0' }}>
                      <input
                        type="checkbox"
                        checked={selectedProviders[provider]?.includes(model.id) || false}
                        onChange={(e) => handleProviderSelect(provider, model.id, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ color: 'var(--fg-secondary)' }}>{model.id.split('/').pop()}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={createModel} disabled={loading} className="button">
          {loading ? 'Creating…' : 'Create Virtual Model'}
        </button>
      </section>

      {/* Models List */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : models.length === 0 ? (
        <div style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px 14px 18px 22px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No virtual models created yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {models.map((model) => (
            <div key={model.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{model.id}</h3>
                <button
                  onClick={() => deleteModel(model.id)}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#fca5a5',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Delete
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {model.providers.map((p, i) => (
                  <span key={i} style={{
                    fontSize: '0.8rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(124,58,237,0.15)',
                    color: 'var(--accent-light)',
                    border: '1px solid rgba(124,58,237,0.3)',
                  }}>
                    {p.provider}: {p.modelId.split('/')[1]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
