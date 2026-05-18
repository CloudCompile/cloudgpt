'use client';

import { useState } from 'react';
import { IconArrowRight } from '@/components/brand/icons';
import { PROVIDER_GLYPHS } from '@/components/brand/ProviderGlyphs';

const DONATABLE_PROVIDERS = [
  {
    name: 'Groq',
    freeNote: 'Free tier — fast Llama, Gemma, and Whisper models',
    signupUrl: 'https://console.groq.com',
    limit: null,
  },
  {
    name: 'Cerebras',
    freeNote: '1M tokens / day free on Llama 3.3, Llama 4, DeepSeek R1',
    signupUrl: 'https://cloud.cerebras.ai',
    limit: '1M tokens/day',
  },
  {
    name: 'Happupy',
    freeNote: '100k tokens / day free — easy sign-up, no card required',
    signupUrl: 'https://beta.hapuppy.com',
    limit: '100k tokens/day',
  },
  {
    name: 'AIHorde',
    freeNote: 'Community volunteer network — free by nature',
    signupUrl: 'https://aihorde.net/register',
    limit: null,
  },
  {
    name: 'Pollinations',
    freeNote: 'Open and free creative generation network',
    signupUrl: 'https://pollinations.ai',
    limit: null,
  },
  {
    name: 'VoidAI',
    freeNote: 'Free tier access to major model families',
    signupUrl: 'https://voidai.app',
    limit: null,
  },
  {
    name: 'Airforce',
    freeNote: 'Free endpoints across 50+ models',
    signupUrl: 'https://api.airforce',
    limit: null,
  },
  {
    name: 'TokenReply',
    freeNote: 'Free access to GPT-4, Claude, and Gemini',
    signupUrl: 'https://tokenreply.com',
    limit: null,
  },
  {
    name: 'NagaAI',
    freeNote: 'Free OpenAI-compatible endpoint',
    signupUrl: 'https://naga.ac',
    limit: null,
  },
];

const ALL_PROVIDER_NAMES = DONATABLE_PROVIDERS.map(p => p.name);

function glyphKey(name: string): string {
  if (name === 'AIHorde') return 'AI Horde';
  return name;
}

export default function DonatePage() {
  const [provider, setProvider] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ discordRoleAssigned: boolean } | null>(null);

  const selectedProvider = DONATABLE_PROVIDERS.find(p => p.name === provider);

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
        paddingTop: '80px',
        paddingBottom: '72px',
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(79, 70, 229, 0.07) 50%, rgba(59, 130, 246, 0.04) 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container" style={{ maxWidth: '860px', textAlign: 'center' }}>
          <p className="eyebrow">Contributor Program</p>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: '900',
            marginBottom: '20px',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Power the Network
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto 48px', lineHeight: '1.7' }}>
            OpenRelay is free because contributors donate free API keys. Donating takes 30 seconds — your key is encrypted and pooled with others to serve everyone.
          </p>

          <div className="grid-3" style={{ maxWidth: '680px', margin: '0 auto' }}>
            {[
              { icon: '🔑', title: 'Monitor Your Keys', desc: 'Real-time status and uptime for every key you contribute' },
              { icon: '📊', title: 'System Insights', desc: 'Request metrics and error logs for providers you support' },
              { icon: '💬', title: 'Discord Role', desc: 'Automatic Contributor badge if Discord is connected' },
            ].map((b) => (
              <div key={b.title} style={{
                padding: '24px 20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                background: 'rgba(124, 58, 237, 0.06)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '10px' }}>{b.icon}</div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '6px' }}>{b.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.5' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section style={{ paddingTop: '72px', paddingBottom: '100px' }}>
        <div className="container" style={{ maxWidth: '1100px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px', alignItems: 'start' }}>

            {/* Provider list */}
            <div>
              <p className="eyebrow">Free Providers</p>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '10px' }}>
                Which key should I donate?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '28px' }}>
                All of these providers offer free accounts with no credit card required. Sign up, grab your API key, and donate it below. Click a provider to pre-select it in the form.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DONATABLE_PROVIDERS.map((p) => {
                  const entry = PROVIDER_GLYPHS[glyphKey(p.name)];
                  const color = entry?.color ?? '#7c3aed';
                  const isSelected = provider === p.name;
                  return (
                    <div
                      key={p.name}
                      role="button"
                      tabIndex={0}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-lg)',
                        border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                        background: isSelected ? `${color}08` : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onClick={() => setProvider(isSelected ? '' : p.name)}
                      onKeyDown={e => e.key === 'Enter' && setProvider(isSelected ? '' : p.name)}
                    >
                      {entry ? (
                        <div style={{
                          width: 36, height: 36, flexShrink: 0,
                          borderRadius: 'var(--radius-sm)',
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color,
                        }}>
                          <entry.Glyph size={18} />
                        </div>
                      ) : (
                        <div style={{
                          width: 36, height: 36, flexShrink: 0,
                          borderRadius: 'var(--radius-sm)',
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color, fontWeight: 700, fontSize: '0.8rem',
                        }}>
                          {p.name.slice(0, 2)}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '2px', color: isSelected ? color : 'var(--fg)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {p.freeNote}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                        {p.limit && (
                          <span style={{
                            fontSize: '0.68rem', fontWeight: '600',
                            padding: '2px 7px', borderRadius: '4px',
                            background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            color: '#fcd34d',
                            whiteSpace: 'nowrap',
                          }}>
                            {p.limit}
                          </span>
                        )}
                        <a
                          href={p.signupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontSize: '0.72rem', fontWeight: '600',
                            color: 'var(--accent-light)',
                            padding: '4px 9px', borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(124,58,237,0.25)',
                            background: 'rgba(124,58,237,0.07)',
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Get key <IconArrowRight size={10} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <div style={{ position: 'sticky', top: '96px' }}>
              <div className="card">
                {success ? (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                      fontSize: '1.6rem',
                      color: '#86efac',
                    }}>
                      ✓
                    </div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px', color: '#86efac' }}>
                      Key Donated!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.7', marginBottom: '24px' }}>
                      {success.discordRoleAssigned
                        ? 'Your Discord Contributor role has been assigned. Thanks for keeping OpenRelay free.'
                        : 'Thank you! Connect Discord in your account settings to receive the Contributor role.'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <a href="/contributor" className="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        Contributor Dashboard <IconArrowRight size={14} />
                      </a>
                      <button
                        onClick={() => setSuccess(null)}
                        className="button secondary"
                        style={{ width: '100%' }}
                      >
                        Donate Another Key
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '6px' }}>Submit Your Key</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: '1.6', marginBottom: '22px' }}>
                      Keys are validated live, then stored with AES-256 encryption. Your raw key is never logged.
                    </p>

                    {error && <div className="error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '7px', fontSize: '0.85rem' }}>
                          Provider
                        </label>
                        <select
                          value={provider}
                          onChange={e => setProvider(e.target.value)}
                          required
                          style={{ color: provider ? 'var(--fg)' : 'var(--text-secondary)' }}
                        >
                          <option value="">Select a provider…</option>
                          {ALL_PROVIDER_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>

                        {selectedProvider && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                            {selectedProvider.freeNote}
                            {' · '}
                            <a href={selectedProvider.signupUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)' }}>
                              Get a free key →
                            </a>
                          </p>
                        )}
                      </div>

                      <div style={{ marginBottom: '22px' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '7px', fontSize: '0.85rem' }}>
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
                          width: '100%',
                          padding: '13px',
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          opacity: loading || !provider || !key.trim() ? 0.55 : 1,
                        }}
                      >
                        {loading ? 'Validating…' : (<><span>Donate Key</span><IconArrowRight size={15} /></>)}
                      </button>
                    </form>

                    <p style={{ marginTop: '14px', fontSize: '0.76rem', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: '1.6' }}>
                      Must be signed in. Revoke your key anytime from the Contributor Dashboard.
                    </p>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
