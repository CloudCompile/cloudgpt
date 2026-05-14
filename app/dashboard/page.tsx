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

export default function Dashboard() {
  const { userId, isSignedIn } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<NewKeyResponse | null>(null);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchKeys();
  }, [isSignedIn, userId]);

  async function fetchKeys() {
    try {
      const response = await fetch('/api/dashboard/keys');
      if (!response.ok) throw new Error('Failed to fetch keys');
      const data = await response.json();
      setKeys(data.keys || []);
      setError('');
    } catch (err) {
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
    } catch (err) {
      setError('Failed to create API key');
    }
  }

  async function deleteKey(id: string) {
    if (!confirm('Are you sure? This cannot be undone.')) return;

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
    } catch (err) {
      setError('Failed to delete API key');
    }
  }

  async function copyToClipboard(text: string) {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
      setCopying(false);
    }
  }

  if (!isSignedIn) {
    return (
      <main className="container" style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center' }}>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>
          Please sign in to access your API keys
        </p>
      </main>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <main className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '900px' }}>
      <h1 style={{ marginBottom: '40px' }}>API Keys</h1>

      {error && <div className="error">{error}</div>}

      {createdKey && (
        <div className="success">
          <p style={{ marginBottom: '16px' }}>
            <strong>✓ New API Key Created</strong>
          </p>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Save this key securely — it will not be shown again!
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <code style={{ flex: 1, background: '#000', padding: '12px', borderRadius: '6px', overflow: 'auto' }}>
              {createdKey.key}
            </code>
            <button
              onClick={() => copyToClipboard(createdKey.key)}
              className="button"
              style={{ whiteSpace: 'nowrap' }}
            >
              {copying ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px' }}>Create a New Key</h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Key name (e.g., Production, Testing)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={createKey} className="button">
            Create
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Maximum 5 keys per account
        </p>
      </section>

      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px' }}>Your Keys</h2>
        {loading ? (
          <p>Loading...</p>
        ) : keys.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>
            No API keys yet. Create one above to get started.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td>
                    <code>{key.keyPreview}</code>
                  </td>
                  <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => deleteKey(key.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        color: '#fca5a5',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
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

      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '24px' }}>Quick Connect</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          {keys.length > 0
            ? 'Use your first API key with the following base URL:'
            : 'Create an API key above to see your connection details.'}
        </p>
        {keys.length > 0 && (
          <div className="info-box">
            <code style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
              Authorization: Bearer {/* Show first key preview */}
              {keys[0]?.keyPreview}...
            </code>
          </div>
        )}
      </section>

      <section>
        <h2 style={{ marginBottom: '24px' }}>Setup Instructions</h2>

        <h3 style={{ marginBottom: '12px', marginTop: '24px' }}>SillyTavern</h3>
        <ol style={{ marginLeft: '20px', marginBottom: '24px', color: 'var(--text-secondary)' }}>
          <li>Go to User Settings → API Connections</li>
          <li>Select OpenAI and enable it</li>
          <li>Set API Base URL to: <code>{baseUrl}/v1</code></li>
          <li>Paste your API key in the API Key field</li>
        </ol>

        <h3 style={{ marginBottom: '12px' }}>OpenWebUI</h3>
        <ol style={{ marginLeft: '20px', marginBottom: '24px', color: 'var(--text-secondary)' }}>
          <li>Go to Settings → OpenAI</li>
          <li>Set API Base URL to: <code>{baseUrl}/v1</code></li>
          <li>Paste your API key in the API Key field</li>
          <li>Models will be loaded automatically</li>
        </ol>

        <h3 style={{ marginBottom: '12px' }}>Using the API</h3>
        <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
          OpenRelay supports the standard OpenAI API format:
        </p>
        <div className="curl-example">{`curl ${baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</div>
      </section>
    </main>
  );
}
