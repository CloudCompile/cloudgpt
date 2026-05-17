'use client';

import { useEffect, useState } from 'react';
import { IconArrowRight } from '@/components/brand/icons';

interface DonatedKey {
  id: string;
  provider: string;
  preview: string;
  status: string;
  createdAt: number;
}

interface Stats {
  requestsToday: number;
  contributedProviders: string[];
  providerBreakdown: Record<string, number>;
  recentErrors: Array<{ provider: string; message: string; ts: number }>;
  discordConnected: boolean;
  discordRoleAssigned: boolean;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  working:      { bg: 'rgba(34,197,94,0.12)',  color: '#86efac', label: '✓ Working' },
  rate_limited: { bg: 'rgba(245,158,11,0.12)', color: '#fcd34d', label: '⚠ Rate limited' },
  error:        { bg: 'rgba(239,68,68,0.12)',  color: '#fca5a5', label: '✕ Error' },
  unknown:      { bg: 'rgba(90,79,128,0.2)',   color: 'var(--text-secondary)', label: '— Unknown' },
};

export default function ContributorPage() {
  const [keys, setKeys] = useState<DonatedKey[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [claimingDiscord, setClaimingDiscord] = useState(false);
  const [notContributor, setNotContributor] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/contributor/keys').then(r => r.json()),
      fetch('/api/contributor/stats').then(r => r.json()),
    ]).then(([keysData, statsData]) => {
      if (keysData.keys) setKeys(keysData.keys);
      if (statsData.error === 'Not a contributor') {
        setNotContributor(true);
      } else if (!statsData.error) {
        setStats(statsData);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function revokeKey(provider: string, id: string) {
    setRevoking(id);
    try {
      const res = await fetch(
        `/api/contributor/keys?provider=${encodeURIComponent(provider)}&id=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );
      if (res.ok) setKeys(prev => prev.filter(k => k.id !== id));
    } catch {}
    setRevoking(null);
  }

  async function claimDiscordRole() {
    setClaimingDiscord(true);
    try {
      const res = await fetch('/api/contributor/discord', { method: 'POST' });
      const data = await res.json();
      if (data.success) setStats(prev => prev ? { ...prev, discordRoleAssigned: true } : prev);
    } catch {}
    setClaimingDiscord(false);
  }

  if (loading) {
    return (
      <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      </main>
    );
  }

  if (notContributor) {
    return (
      <main>
        <section style={{ paddingTop: '100px', paddingBottom: '100px', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px' }}>
              Contributor Program
            </p>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px' }}>
              You haven't donated any keys yet
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', lineHeight: '1.7' }}>
              Donate a free API key to help scale OpenRelay and unlock contributor access — including system insights and a Discord role.
            </p>
            <a href="/donate" className="button" style={{ padding: '12px 32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Donate a Key <IconArrowRight size={16} />
            </a>
          </div>
        </section>
      </main>
    );
  }

  const uniqueProviders = [...new Set(keys.map(k => k.provider))];

  return (
    <main>
      {/* Hero */}
      <section style={{
        paddingTop: '60px', paddingBottom: '60px',
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(79, 70, 229, 0.06) 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '10px' }}>
            Contributor Dashboard
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '10px' }}>
            Thanks for supporting OpenRelay
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {keys.length} key{keys.length !== 1 ? 's' : ''} donated
            {uniqueProviders.length > 0 && ` across ${uniqueProviders.join(', ')}`}
            {stats ? ` · ${stats.requestsToday.toLocaleString()} requests routed today` : ''}
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: '1000px', paddingTop: '60px', paddingBottom: '80px' }}>

        {/* Keys */}
        <section style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Your Donated Keys</h2>
            <a href="/donate" className="button secondary" style={{ padding: '7px 16px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Donate more <IconArrowRight size={13} />
            </a>
          </div>

          {keys.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No active keys found.</p>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <table style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Key</th>
                    <th>Status</th>
                    <th>Donated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map(k => {
                    const s = STATUS_STYLE[k.status] ?? STATUS_STYLE.unknown;
                    return (
                      <tr key={k.id}>
                        <td style={{ fontWeight: '600' }}>{k.provider}</td>
                        <td><code>{k.preview}</code></td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{timeAgo(k.createdAt)}</td>
                        <td>
                          <button
                            onClick={() => revokeKey(k.provider, k.id)}
                            disabled={revoking === k.id}
                            style={{
                              background: 'transparent', border: '1px solid rgba(239,68,68,0.4)',
                              color: '#fca5a5', padding: '4px 12px', borderRadius: '8px',
                              cursor: 'pointer', fontSize: '0.83rem', opacity: revoking === k.id ? 0.5 : 1,
                            }}
                          >
                            {revoking === k.id ? 'Revoking…' : 'Revoke'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {stats && (
          <>
            {/* Provider Impact */}
            {stats.contributedProviders.length > 0 && (
              <section style={{ marginBottom: '64px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>Today's Impact</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  {stats.contributedProviders.map(prov => (
                    <div key={prov} style={{
                      padding: '22px', borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                    }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{prov}</div>
                      <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-light)', lineHeight: 1 }}>
                        {(stats.providerBreakdown[prov] || 0).toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', marginTop: '6px' }}>requests today</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Errors */}
            <section style={{ marginBottom: '64px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>Recent Errors</h2>
              {stats.recentErrors.length === 0 ? (
                <div style={{
                  padding: '18px 22px', borderRadius: 'var(--radius)',
                  border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)',
                  color: '#86efac', fontSize: '0.95rem',
                }}>
                  ✓ No recent errors
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.recentErrors.map((err, i) => (
                    <div key={i} style={{
                      padding: '14px 18px', borderRadius: 'var(--radius)',
                      border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--accent-light)' }}>
                          {err.provider}
                        </span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {err.message.slice(0, 140)}{err.message.length > 140 ? '…' : ''}
                        </p>
                      </div>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', flexShrink: 0, paddingTop: '2px' }}>
                        {timeAgo(err.ts)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Discord */}
            <section>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>Discord Role</h2>
              <div style={{
                padding: '24px 28px', borderRadius: 'var(--radius-lg)',
                border: `1px solid ${stats.discordRoleAssigned ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.3)'}`,
                background: stats.discordRoleAssigned ? 'rgba(34,197,94,0.06)' : 'rgba(124,58,237,0.06)',
              }}>
                {stats.discordRoleAssigned ? (
                  <p style={{ color: '#86efac', fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
                    ✓ You have the Contributor role on our Discord server
                  </p>
                ) : stats.discordConnected ? (
                  <div>
                    <p style={{ marginBottom: '16px', color: 'var(--fg)', fontSize: '0.95rem' }}>
                      Discord connected. Claim your Contributor role:
                    </p>
                    <button
                      onClick={claimDiscordRole}
                      disabled={claimingDiscord}
                      className="button"
                      style={{ padding: '10px 24px', opacity: claimingDiscord ? 0.7 : 1 }}
                    >
                      {claimingDiscord ? 'Assigning…' : 'Claim Discord Role'}
                    </button>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>
                    Connect your Discord account in your{' '}
                    <a href="/dashboard" style={{ color: 'var(--accent-light)' }}>account settings</a>
                    {' '}to receive the Contributor role on our Discord server.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
