'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
}

interface NewApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  message: string;
}

export default function Dashboard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<NewApiKey | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (err) {
      setError('Failed to fetch API keys');
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
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create API key');
        return;
      }

      const data = await response.json();
      setCreatedKey(data);
      setNewKeyName('');
      await fetchKeys();
    } catch (err) {
      setError('Failed to create API key');
    }
  }

  async function deleteKey(id: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete API key');
        return;
      }

      await fetchKeys();
    } catch (err) {
      setError('Failed to delete API key');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  return (
    <main style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '40px' }}>Dashboard</h1>
        
        <section style={{ marginBottom: '40px' }}>
          <h2>API Keys</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Create and manage your API keys for accessing the CloudGPT API.
          </p>

          {error && (
            <div style={{ background: '#fee', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              {error}
              <button onClick={() => setError('')} style={{ marginLeft: '10px' }}>Dismiss</button>
            </div>
          )}

          {createdKey && (
            <div style={{ background: '#e7f5e7', color: '#060', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <p><strong>New API Key Created!</strong></p>
              <p style={{ marginTop: '8px' }}>{createdKey.message}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <code style={{ background: '#fff', padding: '8px 12px', borderRadius: '4px', flex: 1 }}>
                  {createdKey.key}
                </code>
                <button onClick={() => copyToClipboard(createdKey.key)} className="button">
                  Copy
                </button>
              </div>
              <button 
                onClick={() => setCreatedKey(null)} 
                style={{ marginTop: '12px', background: 'transparent', border: 'none', color: '#060', cursor: 'pointer' }}
              >
                Dismiss
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input
              type="text"
              placeholder="Key name (e.g., Production, Development)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
            <button onClick={createKey} className="button">
              Create Key
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : keys.length === 0 ? (
            <p style={{ color: '#666' }}>No API keys yet. Create one above to get started.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Key</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Created</th>
                  <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{key.name}</td>
                    <td style={{ padding: '12px' }}>
                      <code>{key.keyPreview}</code>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => deleteKey(key.id)}
                        style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
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

        <section>
          <h2>Quick Start</h2>
          <p style={{ marginBottom: '16px' }}>Use your API key to make requests:</p>
          <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', overflow: 'auto' }}>
{`curl -X POST https://your-app.vercel.app/api/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
          </pre>
        </section>
      </div>
    </main>
  );
}
