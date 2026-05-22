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

interface ProviderInfo {
  id: string;
  name: string;
  keyCount: number;
  status: string;
}

function providerColor(id: string): string {
  const COLORS = [
    '#a855f7', '#06b6d4', '#f59e0b', '#8b5cf6', '#00d084', '#ec4899',
    '#7c3aed', '#10b981', '#f472b6', '#3b82f6', '#ef4444', '#22c55e',
    '#f97316', '#6366f1', '#14b8a6', '#eab308', '#84cc16', '#0ea5e9',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [analyticsRes, providersRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/providers'),
      ]);
      const [analyticsData, providersData] = await Promise.all([
        analyticsRes.json(),
        providersRes.json(),
      ]);
      if (analyticsData.error) {
        setError(analyticsData.error);
      } else {
        setAnalytics(analyticsData);
        setLastUpdated(new Date());
        setError('');
      }
      if (providersData.providers) {
        setProviders(providersData.providers.map((p: any) => ({
          id: p.id,
          name: p.name,
          keyCount: p.keyCount || 0,
          status: p.status,
        })));
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRequests = analytics
    ? Object.values(analytics.providerBreakdown).reduce((s, n) => s + n, 0) || 1
    : 1;
  const maxModel = analytics?.topModels[0]?.count || 1;

  const activeProviders = providers.filter(p => p.status === 'active');
  const comingSoonCount = providers.filter(p => p.status !== 'active').length;

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
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="button secondary"
            style={{ fontSize: '0.85rem', padding: '8px 16px', opacity: refreshing ? 0.6 : 1 }}
          >
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
          <a href="/admin/keys" className="button" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            Manage Keys
          </a>
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
              label="Tokens Today"
              value={analytics.tokensToday > 0 ? `${(analytics.tokensToday / 1000).toFixed(1)}K` : '0'}
              sub="tracked tokens"
              color="#8b5cf6"
            />
            <StatCard
              label="Donated Keys"
              value={analytics.totalActiveKeys.toString()}
              sub="community-contributed keys"
              color="#22c55e"
            />
            <StatCard
              label="Active Providers"
              value={activeProviders.length.toString()}
              sub={`of ${providers.length} total providers`}
              color={activeProviders.length > 0 ? '#f59e0b' : '#6b7280'}
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
                    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)',
                    borderRadius: 'var(--radius)', color: '#fca5a5', fontSize: '0.88rem',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <SectionLabelInline>Active Provider Capacity</SectionLabelInline>
              <a href="/admin/keys" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>
                Manage all {providers.length} providers →
              </a>
            </div>

            {activeProviders.length === 0 ? (
              <div style={{ padding: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                  No providers are active yet — donate keys to activate them.
                </p>
                <a href="/donate" className="button" style={{ fontSize: '0.85rem', padding: '8px 18px' }}>
                  Donate Keys
                </a>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>
                {activeProviders.map(provider => {
                  const count = provider.keyCount;
                  const color = providerColor(provider.id);
                  return (
                    <a
                      key={provider.id}
                      href="/admin/keys"
                      style={{
                        textDecoration: 'none', padding: '16px',
                        background: 'var(--bg-secondary)', border: `1px solid ${color}35`,
                        borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '8px',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '35'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {provider.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', background: `${color}18`, color, border: `1px solid ${color}30`, flexShrink: 0 }}>
                          {count} {count === 1 ? 'key' : 'keys'}
                        </span>
                      </div>
                      <div style={{ height: '3px', borderRadius: '2px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${Math.min(100, count * 15)}%`,
                          background: color, borderRadius: '2px',
                          transition: 'width 0.4s ease', minWidth: '8px',
                        }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        {provider.id === 'pollinations'
                          ? `~${(count * 0.4).toFixed(2)} pollen/hr avg`
                          : `~${count * 60} req/min`}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {comingSoonCount > 0 && (
              <div style={{ marginTop: '12px', padding: '12px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--fg-secondary)' }}>{comingSoonCount}</strong> more providers waiting for donated keys to activate
                </span>
                <a href="/donate" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>
                  Donate keys →
                </a>
              </div>
            )}
          </div>

          {/* Two-column: top models + provider requests */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
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

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <SectionLabel>Provider Requests Today</SectionLabel>
              {Object.keys(analytics.providerBreakdown).length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>No requests yet today</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(analytics.providerBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([provider, count]) => {
                      const color = providerColor(provider.toLowerCase());
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
            <a href="/admin/endpoints" className="button secondary">Endpoints</a>
            <a href="/admin/users" className="button secondary">Users</a>
          </div>
        </>
      ) : null}
    </main>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: `1px solid ${color}25`,
      borderRadius: 'var(--radius-lg)', padding: '22px 24px',
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

function SectionLabelInline({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', margin: 0 }}>
      {children}
    </p>
  );
}
