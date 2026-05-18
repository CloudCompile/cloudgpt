'use client';

import { useState, useEffect } from 'react';
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

const BASE_URL = 'https://www.cjhauser.me';

export default function Dashboard() {
  const { userId, isSignedIn } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<NewKeyResponse | null>(null);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState<string | null>(null);

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
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }
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
        marginBottom: '40px',
        padding: '20px 24px',
        borderRadius: '18px 14px 16px 20px',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.08) 100%)',
        border: '1px solid rgba(124,58,237,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px' }}>
            🔑 Keep OpenRelay free — donate an API key
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Got a free API key from Groq, Cerebras, Happupy, or others? Donate it to power the network for everyone.
          </p>
        </div>
        <a href="/donate" className="button" style={{ padding: '9px 22px', fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Donate a Key
        </a>
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
            <code style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: '16px 10px 12px 14px', wordBreak: 'break-all', fontSize: '0.9rem' }}>
              {createdKey.key}
            </code>
            <button
              onClick={() => copyToClipboard(createdKey.key, 'new')}
              className="button"
              style={{ whiteSpace: 'nowrap', padding: '10px 20px' }}
            >
              {copying === 'new' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            style={{ marginTop: '12px', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Key */}
      <section style={{ marginBottom: '60px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '28px 18px 24px 22px', padding: '32px' }}>
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
          <div style={{ padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px 16px 20px 26px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No API keys yet — create one above.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td style={{ fontWeight: '500' }}>{key.name}</td>
                  <td><code>{key.keyPreview}</code></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(key.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => deleteKey(key.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Quick Connect */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Quick Connect</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Use this base URL with any OpenAI-compatible client.
        </p>
        <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.28)', borderRadius: '22px 14px 18px 24px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base URL</p>
              <code style={{ color: 'var(--accent-light)', fontSize: '1rem' }}>{BASE_URL}/v1</code>
            </div>
            <button
              onClick={() => copyToClipboard(`${BASE_URL}/v1`, 'baseurl')}
              style={{ background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.35)', color: 'var(--accent-light)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
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
          100+ free models across 5 providers. Use any model ID in your requests.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { name: 'AIHubMix', color: '#3b82f6', models: 'GPT-4o, Claude 3.5, Gemini 2.0, DeepSeek' },
            { name: 'Pollinations', color: '#8b5cf6', models: 'Image, text, and specialized generation' },
            { name: 'VoidAI', color: '#06b6d4', models: 'Free-tier models from major providers' },
            { name: 'Airforce', color: '#f59e0b', models: '53 models: OpenAI, Anthropic, Meta, xAI' },
            { name: 'Cerebras', color: '#a855f7', models: 'Llama 3.3, Llama 4 Scout, DeepSeek R1 (1M tokens/day)' },
          ].map(({ name, color, models }) => (
            <div key={name} style={{ background: 'var(--bg-secondary)', border: `1px solid ${color}30`, borderRadius: '24px 16px 20px 22px', padding: '18px' }}>
              <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', background: `${color}20`, color, marginBottom: '10px' }}>{name}</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>{models}</p>
            </div>
          ))}
        </div>
        <a href="/models" className="button secondary">Browse All Models</a>
      </section>
    </main>
  );
}
