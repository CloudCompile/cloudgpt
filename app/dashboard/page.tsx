'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: number;
}

interface NewKeyResponse {
  id: string;
  key: string;
  name: string;
  createdAt: number;
}

interface Analytics {
  requests: { today: number; week: number; total: number };
  topModels: Array<{ model: string; count: number }>;
}

interface LorebookEntry {
  keywords: string[];
  content: string;
}

interface PluginConfig {
  tokenSaver: { enabled: boolean; maxMessages: number; strategy: 'window' | 'trim-middle' };
  lorebook: { enabled: boolean; entries: LorebookEntry[]; wikiUrl?: string };
  uncensored: { enabled: boolean };
  rpOptimize: { enabled: boolean };
  webSearch: { enabled: boolean; mode: 'always' | 'auto'; provider: 'ddg' | 'brave' | 'serper' | 'tavily'; apiKey?: string };
}

const DEFAULT_CONFIG: PluginConfig = {
  tokenSaver: { enabled: false, maxMessages: 20, strategy: 'window' },
  lorebook: { enabled: false, entries: [] },
  uncensored: { enabled: false },
  rpOptimize: { enabled: false },
  webSearch: { enabled: false, mode: 'auto', provider: 'ddg' },
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cjhauser.me';

export default function Dashboard() {
  const { userId, isSignedIn } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<NewKeyResponse | null>(null);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState<string | null>(null);
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchKeys();
    fetchAnalytics();
  }, [isSignedIn, userId]);

  async function fetchAnalytics() {
    try {
      const response = await fetch('/api/user/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (e) {
      console.warn('Failed to load analytics:', e);
    }
  }

  async function fetchKeys() {
    try {
      const response = await fetch('/api/dashboard/keys');
      if (!response.ok) throw new Error('Failed to fetch keys');
      const data = await response.json();
      setKeys(data.keys || []);
      setError('');
    } catch {
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) { setError('Please enter a key name'); return; }
    try {
      const response = await fetch('/api/dashboard/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create key');
        return;
      }
      const data = await response.json();
      setCreatedKey(data);
      setNewKeyName('');
      setError('');
      await fetchKeys();
    } catch {
      setError('Failed to create API key');
    }
  }

  async function deleteKey(id: string) {
    if (!confirm('Delete this key? This cannot be undone.')) return;
    try {
      const response = await fetch('/api/dashboard/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete key');
        return;
      }
      setError('');
      if (expandedPlugin === id) setExpandedPlugin(null);
      await fetchKeys();
    } catch {
      setError('Failed to delete API key');
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(id);
      setTimeout(() => setCopying(null), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }

  if (!isSignedIn) {
    return (
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '16px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in to access your API keys.</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '100px', maxWidth: '900px' }}>
      {/* Donate Banner */}
      <div style={{
        marginBottom: '40px', padding: '18px 22px', borderRadius: 'var(--radius-lg)',
        background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '3px' }}>Keep OpenRelay free — donate an API key</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', margin: 0 }}>
            Got a free key from Groq, Cerebras, Happupy, or others? Donate it in 30 seconds.
          </p>
        </div>
        <a href="/donate" className="button" style={{ padding: '9px 20px', fontSize: '0.88rem', whiteSpace: 'nowrap', flexShrink: 0 }}>Donate a Key</a>
      </div>

      {/* Usage Stats */}
      {analytics && (
        <div style={{
          marginBottom: '50px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
        }}>
          <div style={{
            padding: '20px 24px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '18px 14px 16px 20px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{analytics.requests.today}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>requests</p>
          </div>
          <div style={{
            padding: '20px 24px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '18px 14px 16px 20px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Week</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{analytics.requests.week}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>requests</p>
          </div>
          <div style={{
            padding: '20px 24px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '18px 14px 16px 20px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>{analytics.requests.total}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>requests</p>
          </div>
        </div>
      )}

      {analytics?.topModels && analytics.topModels.length > 0 && (
        <div style={{
          marginBottom: '50px',
          padding: '20px 24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '18px 14px 16px 20px',
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Most Used Models</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.topModels.map((model, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(124,58,237,0.05)',
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}>
                <code style={{ fontSize: '0.85rem' }}>{model.model}</code>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{model.count} {model.count === 1 ? 'request' : 'requests'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h1 style={{ marginBottom: '8px', fontSize: '2rem' }}>API Keys</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '50px' }}>
        Manage your OpenRelay API keys. Use them with any OpenAI-compatible client.
      </p>

      {error && <div className="error">{error}</div>}

      {createdKey && (
        <div className="success" style={{ marginBottom: '40px' }}>
          <p style={{ marginBottom: '12px', fontWeight: '600' }}>Key created — save it now, it won't be shown again.</p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <code style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: 'var(--radius)', wordBreak: 'break-all', fontSize: '0.9rem' }}>
              {createdKey.key}
            </code>
            <button onClick={() => copyToClipboard(createdKey.key, 'new')} className="button" style={{ whiteSpace: 'nowrap', padding: '10px 20px' }}>
              {copying === 'new' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setCreatedKey(null)} style={{ marginTop: '12px', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Create Key */}
      <section style={{ marginBottom: '60px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Create a New Key</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>Up to 5 keys per account.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Key name (e.g., Production, My App)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createKey()}
            style={{ flex: 1 }}
          />
          <button onClick={createKey} className="button">Create Key</button>
        </div>
      </section>

      {/* Keys List */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Your Keys</h2>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : keys.length === 0 ? (
          <div style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No API keys yet — create one above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {keys.map((key) => (
              <div key={key.id}>
                {/* Key card */}
                <div style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: expandedPlugin === key.id ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                  padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>{key.name}</div>
                    <code style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{key.keyPreview}</code>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => setExpandedPlugin(expandedPlugin === key.id ? null : key.id)}
                      style={{
                        background: expandedPlugin === key.id ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.08)',
                        border: `1px solid rgba(124,58,237,${expandedPlugin === key.id ? '0.5' : '0.25'})`,
                        color: 'var(--accent-light)', padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500',
                      }}
                    >
                      Plugins {expandedPlugin === key.id ? '▲' : '▼'}
                    </button>
                    <button
                      onClick={() => deleteKey(key.id)}
                      style={{
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#fca5a5', padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Plugin panel */}
                {expandedPlugin === key.id && (
                  <PluginPanel keyId={key.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Connect */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Quick Connect</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Use this base URL with any OpenAI-compatible client.
        </p>
        <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.22)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base URL</p>
              <code style={{ color: 'var(--accent-light)', fontSize: '1rem' }}>{BASE_URL}/v1</code>
            </div>
            <button
              onClick={() => copyToClipboard(`${BASE_URL}/v1`, 'baseurl')}
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: 'var(--accent-light)', padding: '8px 16px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600', whiteSpace: 'nowrap' }}
            >
              {copying === 'baseurl' ? '✓ Copied' : 'Copy URL'}
            </button>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Usage</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          OpenRelay is fully OpenAI-compatible. Works with SillyTavern, OpenWebUI, LiteLLM, and any OpenAI SDK.
        </p>

        <h3 style={{ marginBottom: '12px', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>cURL</h3>
        <div className="curl-example">{`curl ${BASE_URL}/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-free",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</div>

        <h3 style={{ marginBottom: '12px', marginTop: '32px', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Python</h3>
        <div className="curl-example">{`from openai import OpenAI

client = OpenAI(
  api_key="YOUR_KEY_HERE",
  base_url="${BASE_URL}/v1"
)

response = client.chat.completions.create(
  model="gpt-4o-free",
  messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`}</div>

        <h3 style={{ marginBottom: '12px', marginTop: '32px', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SillyTavern</h3>
        <ol style={{ marginLeft: '20px', color: 'var(--text-secondary)', lineHeight: '2', fontSize: '0.95rem' }}>
          <li>Go to <strong style={{ color: 'var(--fg)' }}>User Settings → API Connections</strong></li>
          <li>Select <strong style={{ color: 'var(--fg)' }}>OpenAI</strong> and enable it</li>
          <li>Set API Base URL to: <code>{BASE_URL}/v1</code></li>
          <li>Paste your API key and connect</li>
        </ol>

        <h3 style={{ marginBottom: '12px', marginTop: '32px', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OpenWebUI</h3>
        <ol style={{ marginLeft: '20px', color: 'var(--text-secondary)', lineHeight: '2', fontSize: '0.95rem' }}>
          <li>Go to <strong style={{ color: 'var(--fg)' }}>Settings → Connections → OpenAI</strong></li>
          <li>Set API Base URL to: <code>{BASE_URL}/v1</code></li>
          <li>Paste your API key — models load automatically</li>
        </ol>
      </section>

      {/* Available Models */}
      <section>
        <h2 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Available Models</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          357+ free models across 10 providers. Use any model ID in your requests.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { name: 'Pollinations', color: '#a855f7', models: 'Text, images, video, and audio generation' },
            { name: 'Airforce', color: '#f59e0b', models: '53 models: OpenAI, Anthropic, Meta, xAI' },
            { name: 'Groq', color: '#00d084', models: 'Ultra-fast Llama, Gemma, and Whisper models' },
            { name: 'Cerebras', color: '#8b5cf6', models: 'Llama 3.3, Llama 4, DeepSeek R1 (1M/day)' },
          ].map(({ name, color, models }) => (
            <div key={name} style={{ background: 'var(--bg-secondary)', border: `1px solid ${color}28`, borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: '600', background: `${color}18`, color, marginBottom: '8px' }}>{name}</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: '1.5' }}>{models}</p>
            </div>
          ))}
        </div>
        <a href="/models" className="button secondary">Browse All Models</a>
      </section>
    </main>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
        background: checked ? 'var(--accent)' : 'var(--bg-tertiary)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: checked ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  );
}

function PluginRow({ label, desc, checked, onChange, children }: {
  label: string; desc: string; checked: boolean;
  onChange: (v: boolean) => void; children?: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: checked && children ? '16px' : 0 }}>
        <Toggle checked={checked} onChange={onChange} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{label}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc}</div>
        </div>
      </div>
      {checked && children && (
        <div style={{ marginLeft: '52px' }}>{children}</div>
      )}
    </div>
  );
}

function PluginPanel({ keyId }: { keyId: string }) {
  const [config, setConfig] = useState<PluginConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [newEntryKw, setNewEntryKw] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [wikiRefreshing, setWikiRefreshing] = useState(false);
  const [wikiPreview, setWikiPreview] = useState('');

  useEffect(() => {
    fetch(`/api/user/plugins?keyId=${encodeURIComponent(keyId)}`)
      .then(r => r.json())
      .then(d => { if (d.config) setConfig(d.config); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [keyId]);

  const update = useCallback(<K extends keyof PluginConfig>(plugin: K, patch: Partial<PluginConfig[K]>) => {
    setConfig(prev => ({ ...prev, [plugin]: { ...prev[plugin], ...patch } }));
    setSaved(false);
  }, []);

  async function save() {
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/user/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, config }),
      });
      if (!res.ok) { const d = await res.json(); setErr(d.error || 'Save failed'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setErr('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function refreshWiki() {
    setWikiRefreshing(true);
    try {
      const res = await fetch('/api/user/plugins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      const d = await res.json();
      if (d.preview) setWikiPreview(d.preview);
    } catch {} finally { setWikiRefreshing(false); }
  }

  function addLorebookEntry() {
    if (!newEntryKw.trim() || !newEntryContent.trim()) return;
    const keywords = newEntryKw.split(',').map(k => k.trim()).filter(Boolean);
    update('lorebook', { entries: [...config.lorebook.entries, { keywords, content: newEntryContent.trim() }] });
    setNewEntryKw(''); setNewEntryContent('');
  }

  function removeEntry(i: number) {
    update('lorebook', { entries: config.lorebook.entries.filter((_, idx) => idx !== i) });
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', padding: '24px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
        Loading plugins…
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderTop: 'none',
      borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', padding: '28px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', margin: 0 }}>
          Plugins — silently transform every request from this key
        </p>
        <button
          onClick={save}
          disabled={saving}
          className="button"
          style={{ fontSize: '0.82rem', padding: '7px 16px', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      {err && <div className="error" style={{ marginBottom: '20px' }}>{err}</div>}

      {/* Token Saver */}
      <PluginRow
        label="Token Saver"
        desc="Trim long conversation history to reduce token usage."
        checked={config.tokenSaver.enabled}
        onChange={v => update('tokenSaver', { enabled: v })}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
            Max messages
            <input
              type="number" min={4} max={200}
              value={config.tokenSaver.maxMessages}
              onChange={e => update('tokenSaver', { maxMessages: Math.max(4, parseInt(e.target.value) || 20) })}
              style={{ width: '70px', marginLeft: '10px', padding: '4px 8px', fontSize: '0.85rem' }}
            />
          </label>
          <label style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
            Strategy
            <select
              value={config.tokenSaver.strategy}
              onChange={e => update('tokenSaver', { strategy: e.target.value as 'window' | 'trim-middle' })}
              style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)' }}
            >
              <option value="window">Sliding window (keep last N)</option>
              <option value="trim-middle">Trim middle (keep first + last N)</option>
            </select>
          </label>
        </div>
      </PluginRow>

      {/* RP Optimize */}
      <PluginRow
        label="RP Optimize"
        desc="Injects a roleplay-focused system prompt: immersion, character consistency, narrative pacing."
        checked={config.rpOptimize.enabled}
        onChange={v => update('rpOptimize', { enabled: v })}
      />

      {/* Uncensored */}
      <PluginRow
        label="Uncensored"
        desc="Adds a directive instructing the model to respond without content restrictions."
        checked={config.uncensored.enabled}
        onChange={v => update('uncensored', { enabled: v })}
      />

      {/* Lorebook */}
      <PluginRow
        label="Lore Book"
        desc="Inject world lore entries when keywords appear in the conversation. Optional wiki URL for background knowledge."
        checked={config.lorebook.enabled}
        onChange={v => update('lorebook', { enabled: v })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Wiki URL */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Wiki URL (Wikipedia or any page — cached for 7 days)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="https://en.wikipedia.org/wiki/..."
                value={config.lorebook.wikiUrl || ''}
                onChange={e => update('lorebook', { wikiUrl: e.target.value || undefined })}
                style={{ flex: 1, fontSize: '0.85rem', padding: '6px 10px' }}
              />
              {config.lorebook.wikiUrl && (
                <button
                  onClick={refreshWiki}
                  disabled={wikiRefreshing}
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  {wikiRefreshing ? '…' : 'Refresh Cache'}
                </button>
              )}
            </div>
            {wikiPreview && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px', fontStyle: 'italic' }}>
                Preview: {wikiPreview}…
              </p>
            )}
          </div>

          {/* Existing entries */}
          {config.lorebook.entries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {config.lorebook.entries.map((entry, i) => (
                <div key={i} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-light)', marginBottom: '4px', fontWeight: '600' }}>
                      Keywords: {entry.keywords.join(', ')}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.content}
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntry(i)}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add entry */}
          <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Entry</div>
            <input
              type="text"
              placeholder="Keywords (comma-separated): dragon, Daenerys"
              value={newEntryKw}
              onChange={e => setNewEntryKw(e.target.value)}
              style={{ width: '100%', marginBottom: '8px', fontSize: '0.85rem', padding: '6px 10px' }}
            />
            <textarea
              placeholder="Lore content injected when these keywords appear…"
              value={newEntryContent}
              onChange={e => setNewEntryContent(e.target.value)}
              rows={3}
              style={{ width: '100%', marginBottom: '8px', fontSize: '0.85rem', padding: '6px 10px', resize: 'vertical', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)', fontFamily: 'inherit' }}
            />
            <button
              onClick={addLorebookEntry}
              disabled={!newEntryKw.trim() || !newEntryContent.trim()}
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: 'var(--accent-light)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500', opacity: (!newEntryKw.trim() || !newEntryContent.trim()) ? 0.5 : 1 }}
            >
              Add Entry
            </button>
          </div>
        </div>
      </PluginRow>

      {/* Web Search */}
      <PluginRow
        label="Web Search"
        desc="Inject live search results into context. Auto mode only searches when the query seems to need current info."
        checked={config.webSearch.enabled}
        onChange={v => update('webSearch', { enabled: v })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
              Mode
              <select
                value={config.webSearch.mode}
                onChange={e => update('webSearch', { mode: e.target.value as 'auto' | 'always' })}
                style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)' }}
              >
                <option value="auto">Auto (smart detection)</option>
                <option value="always">Always search</option>
              </select>
            </label>
            <label style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
              Provider
              <select
                value={config.webSearch.provider}
                onChange={e => update('webSearch', { provider: e.target.value as 'ddg' | 'brave' | 'serper' | 'tavily' })}
                style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)' }}
              >
                <option value="ddg">DuckDuckGo (free, no key)</option>
                <option value="brave">Brave Search</option>
                <option value="serper">Serper (Google)</option>
                <option value="tavily">Tavily</option>
              </select>
            </label>
          </div>
          {config.webSearch.provider !== 'ddg' && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {config.webSearch.provider === 'brave' ? 'Brave' : config.webSearch.provider === 'serper' ? 'Serper' : 'Tavily'} API Key
              </label>
              <input
                type="password"
                placeholder="Paste your API key…"
                value={config.webSearch.apiKey || ''}
                onChange={e => update('webSearch', { apiKey: e.target.value || undefined })}
                style={{ width: '100%', fontSize: '0.85rem', padding: '6px 10px' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Falls back to DuckDuckGo if no key is provided.
              </p>
            </div>
          )}
        </div>
      </PluginRow>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          onClick={save}
          disabled={saving}
          className="button"
          style={{ fontSize: '0.85rem', padding: '8px 20px', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
