'use client';

import { useState, useEffect, useCallback } from 'react';

interface Analytics {
  requestsToday: number;
  tokensToday: number;
  totalActiveKeys: number;
  topModels: Array<{ model: string; count: number }>;
  providerBreakdown: Record<string, number>;
  keyCountsByProvider: Record<string, number>;
  warnings: string[];
}

const PROVIDER_COLORS: Record<string, string> = {
  AIHubMix:    '#6366f1',
  Pollinations: '#a855f7',
  VoidAI:      '#06b6d4',
  Airforce:    '#f59e0b',
  Cerebras:    '#8b5cf6',
  Groq:        '#00d084',
  AIHorde:     '#ec4899',
  TokenReply:  '#7c3aed',
  NagaAI:      '#10b981',
  Happupy:     '#f472b6',
};

const ALL_PROVIDERS = Object.keys(PROVIDER_COLORS);

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const d = await res.json();
      if (d.error) setError(d.error);
      else { setAnalytics(d); setLastUpdated(new Date()); setError(''); }
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const totalRequests = analytics ? Object.values(analytics.providerBreakdown).reduce((s, n) => s + n, 0) || 1 : 1;
  const maxModel = analytics?.topModels[0]?.count || 1;

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '80px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Admin Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'System health and analytics'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="button secondary"
            style={{ fontSize: '0.85rem', padding: '8px 16px', opacity: refreshing ? 0.6 : 1 }}
          >
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
          <a href="/admin/keys" className="button" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>Manage Keys</a>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: '100px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', opacity: 0.5 }} />
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <StatCard
              label="Requests Today"
              value={analytics.requestsToday.toLocaleString()}
              sub="across all providers"
              color="var(--accent)"
            />
            <StatCard
              label="Cerebras Tokens Today"
              value={analytics.tokensToday > 0 ? `${(analytics.tokensToday / 1000).toFixed(1)}K` : '0'}
              sub="of 1M/key daily limit"
              color="#8b5cf6"
            />
            <StatCard
              label="Active Provider Keys"
              value={analytics.totalActiveKeys.toString()}
              sub={`across ${ALL_PROVIDERS.length} providers`}
              color="#22c55e"
            />
            <StatCard
              label="Active Warnings"
              value={analytics.warnings.length.toString()}
              sub={analytics.warnings.length === 0 ? 'all systems healthy' : 'requires attention'}
              color={analytics.warnings.length > 0 ? '#ef4444' : '#22c55e'}
            />
          </div>

          {/* Warnings */}
          {analytics.warnings.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <SectionLabel>Warnings</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analytics.warnings.map((w, i) => (
                  <div key={i} style={{
                    padding: '12px 16px',
                    background: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.22)',
                    borderRadius: 'var(--radius)',
                    color: '#fca5a5',
                    fontSize: '0.88rem',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <span style={{ flexShrink: 0, opacity: 0.8 }}>⚠</span> {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider Key Capacity */}
          <div style={{ marginBottom: '32px' }}>
            <SectionLabel>Provider Key Capacity</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {ALL_PROVIDERS.map(provider => {
                const count = analytics.keyCountsByProvider[provider] ?? 0;
                const color = PROVIDER_COLORS[provider];
                const hasKeys = count > 0;
                return (
                  <a key={provider} href="/admin/keys" style={{
                    textDecoration: 'none',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${hasKeys ? color + '35' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = hasKeys ? color + '35' : 'var(--border)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: hasKeys ? color : 'var(--text-tertiary)' }}>
                        {provider}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '700',
                        padding: '2px 7px', borderRadius: '4px',
                        background: hasKeys ? `${color}18` : 'rgba(107,114,128,0.12)',
                        color: hasKeys ? color : 'var(--text-tertiary)',
                        border: `1px solid ${hasKeys ? color + '30' : 'transparent'}`,
                      }}>
                        {count} {count === 1 ? 'key' : 'keys'}
                      </span>
                    </div>
                    <div style={{ height: '3px', borderRadius: '2px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, count * 15)}%`,
                        background: hasKeys ? color : 'var(--border)',
                        borderRadius: '2px',
                        transition: 'width 0.4s ease',
                        minWidth: hasKeys ? '8px' : '0',
                      }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {hasKeys ? `~${count * 60} req/min capacity` : 'No keys — add some'}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Two-column: top models + provider requests */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Top Models */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <SectionLabel>Top Models Today</SectionLabel>
              {analytics.topModels.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No requests yet today</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analytics.topModels.slice(0, 8).map(({ model, count }, i) => (
                    <div key={model}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--fg-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                          <span style={{ color: 'var(--text-tertiary)', marginRight: '6px' }}>{i + 1}.</span>{model}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-light)', flexShrink: 0 }}>
                          {count.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ height: '3px', borderRadius: '2px', background: 'var(--bg-tertiary)' }}>
                        <div style={{ height: '100%', width: `${(count / maxModel) * 100}%`, background: 'var(--accent)', borderRadius: '2px', opacity: 0.6 + (count / maxModel) * 0.4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Provider Requests */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <SectionLabel>Provider Requests Today</SectionLabel>
              {Object.keys(analytics.providerBreakdown).length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No requests yet today</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(analytics.providerBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([provider, count]) => {
                      const color = PROVIDER_COLORS[provider] || 'var(--accent)';
                      const pct = Math.round((count / totalRequests) * 100);
                      return (
                        <div key={provider}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color }}>{provider}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {count.toLocaleString()} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>({pct}%)</span>
                            </span>
                          </div>
                          <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg-tertiary)' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', opacity: 0.75 }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Nav */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href="/admin/keys" className="button">Provider Keys</a>
            <a href="/admin/virtual-models" className="button">Virtual Models</a>
            <a href="/admin/users" className="button secondary">Users</a>
            <a href="/admin/analytics" className="button secondary">Full Analytics</a>
          </div>
        </>
      ) : null}
    </main>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${color}25`,
      borderRadius: 'var(--radius-lg)',
      padding: '22px 24px',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: '800', color, marginBottom: '4px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--fg-secondary)', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sub}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
      {children}
    </p>
  );
}
