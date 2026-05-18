'use client';

import { useState, useEffect } from 'react';

interface VirtualModel {
  id: string;
  providers: Array<{ provider: string; modelId: string; type: string }>;
}

const MODEL_TYPES = [
  { key: 'text',          label: 'Text / Chat',    color: '#6366f1' },
  { key: 'image',         label: 'Image',          color: '#a855f7' },
  { key: 'video',         label: 'Video',          color: '#f43f5e' },
  { key: 'audio',         label: 'Audio / TTS',    color: '#22c55e' },
  { key: 'transcription', label: 'Transcription',  color: '#f59e0b' },
  { key: 'embedding',     label: 'Embeddings',     color: '#06b6d4' },
] as const;

type ModelTypeKey = typeof MODEL_TYPES[number]['key'];

export default function VirtualModelsPage() {
  const [models, setModels] = useState<VirtualModel[]>([]);
  const [availableModels, setAvailableModels] = useState<Record<string, any[]>>({});
  const [newModelName, setNewModelName] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string[]>>({});
  const [typeFilter, setTypeFilter] = useState<ModelTypeKey>('text');
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
      if (checked) return { ...prev, [provider]: [...current, modelId] };
      return { ...prev, [provider]: current.filter(m => m !== modelId) };
    });
  }

  function getFilteredModels(provider: string): any[] {
    return (availableModels[provider] || []).filter(
      (m: any) => (m.type || 'text') === typeFilter
    );
  }

  const providersWithFilteredModels = Object.entries(availableModels).filter(
    ([provider]) => getFilteredModels(provider).length > 0
  );

  const totalSelected = Object.values(selectedProviders).reduce((n, ids) => n + ids.length, 0);

  async function createModel() {
    if (!newModelName.trim()) { setError('Model name is required'); return; }
    if (totalSelected === 0) { setError('Select at least one model from a provider'); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        id: newModelName.trim().toLowerCase().replace(/\s+/g, '-'),
        providers: Object.entries(selectedProviders).flatMap(([provider, modelIds]) =>
          modelIds.map(modelId => ({
            provider,
            modelId,
            type: availableModels[provider]?.find((m: any) => m.id === modelId)?.type ?? 'text',
          }))
        ),
      };

      const res = await fetch('/api/admin/virtual-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || `Failed to create model (${res.status})`); return; }

      setSuccess(`Virtual model "${newModelName}" created!`);
      setNewModelName('');
      setSelectedProviders({});
      await fetchModels();
    } catch (err) {
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
      if (res.ok) { setSuccess('Model deleted'); await fetchModels(); }
      else setError('Failed to delete model');
    } finally {
      setLoading(false);
    }
  }

  const typeMeta = MODEL_TYPES.find(t => t.key === typeFilter)!;

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '80px', maxWidth: '1100px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Virtual Models</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '0.95rem' }}>
        Create virtual model IDs that route across multiple providers with automatic fallback.
        Supports text, image, video, audio, transcription, and embedding types.
      </p>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Create Model Form */}
      <section className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Create Virtual Model</h2>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.88rem', fontWeight: '600' }}>
              Model ID
            </label>
            <input
              type="text"
              placeholder="e.g., my-fast-chat, best-image-gen"
              value={newModelName}
              onChange={e => setNewModelName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createModel()}
              style={{ width: '100%' }}
            />
          </div>
          <button
            onClick={createModel}
            disabled={loading || !newModelName.trim() || totalSelected === 0}
            className="button"
            style={{ opacity: loading || !newModelName.trim() || totalSelected === 0 ? 0.55 : 1, whiteSpace: 'nowrap' }}
          >
            {loading ? 'Creating…' : `Create (${totalSelected} model${totalSelected !== 1 ? 's' : ''} selected)`}
          </button>
        </div>

        {/* Type filter tabs */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.88rem', fontWeight: '600' }}>
            Model Type
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {MODEL_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => { setTypeFilter(t.key); setSelectedProviders({}); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  border: typeFilter === t.key ? `2px solid ${t.color}` : '1px solid var(--border)',
                  background: typeFilter === t.key ? `${t.color}18` : 'transparent',
                  color: typeFilter === t.key ? t.color : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Provider model selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.88rem', fontWeight: '600' }}>
            Select Models
            <span style={{ marginLeft: '8px', fontWeight: '400', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
              (pick one or more — requests fall back in order)
            </span>
          </label>

          {providersWithFilteredModels.length === 0 ? (
            <div style={{ padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', fontSize: '0.88rem', textAlign: 'center' }}>
              No {typeMeta.label} models available from any provider.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {providersWithFilteredModels.map(([provider]) => {
                const filteredList = getFilteredModels(provider);
                const selectedCount = selectedProviders[provider]?.length ?? 0;
                return (
                  <div key={provider} style={{
                    padding: '14px 16px',
                    background: 'var(--bg)',
                    border: selectedCount > 0 ? `1px solid ${typeMeta.color}50` : '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    transition: 'border-color 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                        {provider}
                      </span>
                      {selectedCount > 0 && (
                        <span style={{
                          fontSize: '0.72rem', fontWeight: '700',
                          padding: '2px 7px', borderRadius: '4px',
                          background: `${typeMeta.color}18`,
                          color: typeMeta.color,
                          border: `1px solid ${typeMeta.color}30`,
                        }}>
                          {selectedCount} selected
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {filteredList.map((model: any) => (
                        <label key={model.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', padding: '2px 0' }}>
                          <input
                            type="checkbox"
                            checked={selectedProviders[provider]?.includes(model.id) || false}
                            onChange={e => handleProviderSelect(provider, model.id, e.target.checked)}
                            style={{ cursor: 'pointer', flexShrink: 0 }}
                          />
                          <span style={{ color: 'var(--fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {model.id.split('/').pop()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Models List */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Existing Virtual Models</h2>
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : models.length === 0 ? (
        <div style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No virtual models yet — create one above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {models.map((model) => {
            const types = [...new Set(model.providers.map(p => p.type))];
            return (
              <div key={model.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <code style={{ fontSize: '0.95rem', fontWeight: '600' }}>{model.id}</code>
                    {types.map(t => {
                      const meta = MODEL_TYPES.find(m => m.key === t);
                      return meta ? (
                        <span key={t} style={{
                          fontSize: '0.7rem', fontWeight: '700',
                          padding: '2px 8px', borderRadius: '4px',
                          background: `${meta.color}15`,
                          color: meta.color,
                          border: `1px solid ${meta.color}30`,
                          flexShrink: 0,
                        }}>
                          {meta.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <button
                    onClick={() => deleteModel(model.id)}
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: '#fca5a5',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {model.providers.map((p, i) => (
                    <span key={i} style={{
                      fontSize: '0.78rem',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(124,58,237,0.1)',
                      color: 'var(--accent-light)',
                      border: '1px solid rgba(124,58,237,0.22)',
                    }}>
                      {p.provider}: {p.modelId.split('/').pop()}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
