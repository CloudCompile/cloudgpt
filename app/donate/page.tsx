'use client';

import { useState } from 'react';
import { IconArrowRight } from '@/components/brand/icons';

const PROVIDERS = [
  'AIHubMix', 'Pollinations', 'VoidAI', 'Airforce',
  'Cerebras', 'Groq', 'AIHorde', 'TokenReply', 'NagaAI',
];

const PROVIDER_SIGNUP_URLS: Record<string, string> = {
  AIHubMix:    'https://aihubmix.com',
  Pollinations: 'https://pollinations.ai',
  VoidAI:      'https://voidai.app',
  Airforce:    'https://api.airforce',
  Cerebras:    'https://cloud.cerebras.ai',
  Groq:        'https://console.groq.com',
  AIHorde:     'https://aihorde.net/register',
  TokenReply:  'https://tokenreply.com',
  NagaAI:      'https://naga.ac',
};

export default function DonatePage() {
  const [provider, setProvider] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ discordRoleAssigned: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!provider || !key.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      setSuccess({ discordRoleAssigned: data.discordRoleAssigned });
      setKey('');
      setProvider('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      {/* Hero */}
      <section style={{
        paddingTop: '80px', paddingBottom: '80px',
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(79, 70, 229, 0.1) 50%, rgba(59, 130, 246, 0.05) 100%)',
        borderBottom: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>
            Contributor Program
          </p>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', marginBottom: '20px', lineHeight: '1.1',
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Power the Network
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 48px', lineHeight: '1.6' }}>
            Donate a free API key to help scale OpenRelay for everyone. In return, get contributor access and a Discord role.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
            {[
              { emoji: '🔑', title: 'Monitor Your Keys', desc: 'See status and uptime in real time' },
              { emoji: '📊', title: 'System Insights', desc: 'Error logs and request metrics for providers you support' },
              { emoji: '💬', title: 'Discord Role', desc: 'Automatic Contributor role if Discord is connected' },
            ].map((b, i) => (
              <div key={i} style={{
                padding: '22px', borderRadius: '16px 12px 14px 18px',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                background: 'rgba(124, 58, 237, 0.06)',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{b.emoji}</div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '6px' }}>{b.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section style={{ paddingTop: '80px', paddingBottom: '100px' }}>
        <div className="container" style={{ maxWidth: '560px' }}>
          {success ? (
            <div style={{
              padding: '48px 40px', borderRadius: '24px 16px 20px 28px',
              border: '1px solid rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.06)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>✓</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '12px', color: '#86efac' }}>
                Key Donated — Thank You!
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.7' }}>
                {success.discordRoleAssigned
                  ? 'Your Discord Contributor role has been assigned. Thanks for helping keep OpenRelay free.'
                  : 'Thanks for contributing! Connect Discord in your account settings to receive the Contributor role.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/contributor" className="button" style={{ padding: '10px 28px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  View Dashboard <IconArrowRight size={15} />
                </a>
                <button
                  onClick={() => setSuccess(null)}
                  className="button secondary"
                  style={{ padding: '10px 28px' }}
                >
                  Donate Another
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>Submit Your Key</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
                Keys are validated live before being accepted. We only store them encrypted with AES-256 — your raw key is never logged.
              </p>

              {error && <div className="error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
                    Provider
                  </label>
                  <select
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    required
                    style={{
                      width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
                      color: provider ? 'var(--fg)' : 'var(--text-secondary)',
                      padding: '12px 16px', borderRadius: '16px 12px 14px 18px',
                      fontSize: '0.95rem', cursor: 'pointer',
                    }}
                  >
                    <option value="">Select a provider…</option>
                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {provider && PROVIDER_SIGNUP_URLS[provider] && (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '6px' }}>
                      Don't have a key?{' '}
                      <a href={PROVIDER_SIGNUP_URLS[provider]} target="_blank" rel="noopener noreferrer">
                        Sign up at {provider}
                      </a>
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem' }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="Paste your API key…"
                    required
                    minLength={8}
                    style={{ width: '100%', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.05em' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !provider || !key.trim()}
                  className="button"
                  style={{
                    width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: loading || !provider || !key.trim() ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Validating…' : <><span>Donate Key</span> <IconArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
