'use client';

import { useState, useEffect, useMemo } from 'react';
import { IconArrowRight } from '@/components/brand/icons';
import { PROVIDER_GLYPHS } from '@/components/brand/ProviderGlyphs';

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  freeLimit: string;
  signupUrl: string | null;
  status: 'active' | 'coming_soon';
  keyCount: number;
  keysRequired: number;
  keysNeeded: number;
  tiers?: { tier: string; pollenPerHour: number }[];
}

function glyphKey(name: string): string {
  const map: Record<string, string> = {
    'AI Horde': 'AI Horde',
    'AIHorde': 'AI Horde',
    'Airforce': 'Airforce',
  };
  return map[name] ?? name;
}

export default function DonatePage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [key, setKey] = useState('');
  const [tier, setTier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ discordRoleAssigned: boolean; providerNowActive?: boolean; pollenPerHour?: number } | null>(null);

  useEffect(() => {
    fetch('/api/providers')
      .then(r => r.json())
      .then(d => {
        setProviders(d.providers ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return providers;
    const q = search.toLowerCase();
    return providers.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.freeLimit.toLowerCase().includes(q)
    );
  }, [providers, search]);

  const selectedProvider = providers.find(p => p.name === provider);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!provider || !key.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key, ...(tier && { tier }) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      setSuccess({
        discordRoleAssigned: data.discordRoleAssigned,
        providerNowActive: data.providerNowActive,
        pollenPerHour: data.pollenPerHour,
      });
      setKey('');
      setProvider('');
      setTier('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      {/* Hero */}
      <section style={{
        paddingTop: '80px',
        paddingBottom: '72px',
        background: 'linear-gradient(135deg, rgba(184,104,64,0.09) 0%, rgba(184,104,64,0.05) 50%, rgba(184,104,64,0.03) 100%)',
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
            background: 'var(--accent-gradient)',
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
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px', alignItems: 'start' }}>

            {/* Provider list */}
            <div>
              <p className="eyebrow">Free Providers</p>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '10px' }}>
                Which key should I donate?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '20px' }}>
                All of these providers offer free accounts — no credit card required. Sign up, grab your API key, and donate it below.
                Each provider needs <strong style={{ color: 'var(--fg)' }}>3 verified keys</strong> to activate.
              </p>

              {/* Stats bar */}
              {!loading && (
                <div style={{
                  display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--success)' }}>{providers.filter(p => p.status === 'active').length}</strong> active
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--accent-light)' }}>{providers.filter(p => p.status === 'coming_soon').length}</strong> need keys
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--fg)' }}>{providers.length}</strong> total providers
                  </span>
                </div>
              )}

              {/* Search */}
              <input
                type="text"
                placeholder="Search providers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', marginBottom: '14px' }}
              />

              {/* Provider list */}
              {loading ? (
                <div style={{ color: 'var(--text-secondary)', padding: '40px 0', textAlign: 'center', fontSize: '0.9rem' }}>
                  Loading providers...
                </div>
              ) : (
                <>
                  {filtered.length === 0 && (
                    <div style={{ color: 'var(--text-tertiary)', padding: '24px', textAlign: 'center', fontSize: '0.88rem' }}>
                      No providers match &ldquo;{search}&rdquo;
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
                    {filtered.map((p) => {
                      const entry = PROVIDER_GLYPHS[glyphKey(p.name)];
                      const color = entry?.color ?? 'var(--accent)';
                      const isSelected = provider === p.name;
                      const isActive = p.status === 'active';
                      return (
                        <div
                          key={p.id}
                          role="button"
                          tabIndex={0}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius)',
                            border: `1px solid ${isSelected ? color : 'var(--border)'}`,
                            background: isSelected ? `${color}10` : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                          onClick={() => setProvider(isSelected ? '' : p.name)}
                          onKeyDown={e => e.key === 'Enter' && setProvider(isSelected ? '' : p.name)}
                        >
                          {/* Glyph or initials */}
                          {entry ? (
                            <div style={{
                              width: 32, height: 32, flexShrink: 0,
                              borderRadius: 'var(--radius-sm)',
                              background: `${color}15`,
                              border: `1px solid ${color}30`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color,
                            }}>
                              <entry.Glyph size={16} />
                            </div>
                          ) : (
                            <div style={{
                              width: 32, height: 32, flexShrink: 0,
                              borderRadius: 'var(--radius-sm)',
                              background: `${color}15`,
                              border: `1px solid ${color}30`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color, fontWeight: 700, fontSize: '0.72rem',
                            }}>
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.84rem', color: isSelected ? color : 'var(--fg)' }}>
                                {p.name}
                              </span>
                              {isActive && (
                                <span style={{
                                  fontSize: '0.65rem', fontWeight: '700', padding: '1px 5px',
                                  borderRadius: '3px', background: 'rgba(34,197,94,0.12)',
                                  border: '1px solid rgba(34,197,94,0.25)', color: '#3a7a52',
                                }}>LIVE</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                              {p.description}
                            </div>
                          </div>

                          {/* Right side */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
                            {/* Key progress */}
                            <div style={{ fontSize: '0.65rem', color: isActive ? '#3a7a52' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                              {isActive ? '✓ active' : `${p.keyCount}/${p.keysRequired} keys`}
                            </div>
                            {/* Signup link */}
                            {p.signupUrl && (
                              <a
                                href={p.signupUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{
                                  fontSize: '0.68rem', fontWeight: '600',
                                  color: 'var(--accent-light)',
                                  padding: '3px 7px', borderRadius: 'var(--radius-sm)',
                                  border: '1px solid rgba(124,58,237,0.25)',
                                  background: 'rgba(184,104,64,0.06)',
                                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Get key <IconArrowRight size={9} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Form */}
            <div style={{ position: 'sticky', top: '96px' }}>
              <div className="card">
                {success ? (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(90,158,111,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                      fontSize: '1.6rem',
                      color: '#3a7a52',
                    }}>
                      ✓
                    </div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '10px', color: '#3a7a52' }}>
                      Key Donated!
                    </h2>
                    {success.providerNowActive && (
                      <div style={{
                        marginBottom: '14px', padding: '10px 14px',
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.84rem', color: '#3a7a52',
                      }}>
                        Provider is now active with 3+ keys!
                      </div>
                    )}
                    {success.pollenPerHour !== null && success.pollenPerHour !== undefined && (
                      <div style={{
                        marginBottom: '14px', padding: '10px 14px',
                        background: 'rgba(184,104,64,0.07)',
                        border: '1px solid rgba(184,104,64,0.15)',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.84rem', color: 'var(--accent-light)',
                      }}>
                        Total capacity: {success.pollenPerHour.toFixed(2)} pollen/hour
                      </div>
                    )}
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
                          {providers.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>

                        {selectedProvider && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                            {selectedProvider.description}
                            {selectedProvider.signupUrl && (
                              <>
                                {' · '}
                                <a href={selectedProvider.signupUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)' }}>
                                  Get a free key →
                                </a>
                              </>
                            )}
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

                      {selectedProvider?.tiers && (
                        <div style={{ marginBottom: '22px' }}>
                          <label style={{ display: 'block', fontWeight: '600', marginBottom: '7px', fontSize: '0.85rem' }}>
                            Tier
                          </label>
                          <select
                            value={tier}
                            onChange={e => setTier(e.target.value)}
                            required
                            style={{ color: tier ? 'var(--fg)' : 'var(--text-secondary)' }}
                          >
                            <option value="">Select tier…</option>
                            {selectedProvider.tiers.map(t => (
                              <option key={t.tier} value={t.tier}>
                                {t.tier} ({t.pollenPerHour} pollen/hour)
                              </option>
                            ))}
                          </select>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            Select your Pollinations subscription tier
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting || !provider || !key.trim()}
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
                          opacity: submitting || !provider || !key.trim() ? 0.55 : 1,
                        }}
                      >
                        {submitting ? 'Validating…' : (<><span>Donate Key</span><IconArrowRight size={15} /></>)}
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
