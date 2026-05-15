'use client';

import { useState, useEffect } from 'react';

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
  AIHubMix: '#6366f1',
  Pollinations: '#a855f7',
  VoidAI: '#06b6d4',
  Airforce: '#f59e0b',
  Cerebras: '#8b5cf6',
  Groq: '#00d084',
  AIHorde: '#ec4899',
};

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setAnalytics(d);
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container" style={{ paddingTop: '50px', paddingBottom: '80px', maxWidth: '1100px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Admin Overview</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '0.95rem' }}>
        System health and analytics at a glance.
      </p>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : analytics ? (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '48px' }}>
            <StatCard label="Requests Today" value={analytics.requestsToday.toLocaleString()} color="var(--accent)" />
            <StatCard label="Tokens Today (Cerebras)" value={analytics.tokensToday > 0 ? `${(analytics.tokensToday / 1000).toFixed(1)}K` : '0'} color="#8b5cf6" />
            <StatCard label="Active Provider Keys" value={analytics.totalActiveKeys.toString()} color="#22c55e" />
            <StatCard label="Warnings" value={analytics.warnings.length.toString()} color={analytics.warnings.length > 0 ? '#ef4444' : '#22c55e'} />
          </div>

          {/* Warnings */}
          {analytics.warnings.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: '600' }}>Warnings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analytics.warnings.map((w, i) => (
                  <div key={i} style={{
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '14px 10px 12px 16px',
                    color: '#fca5a5',
                    fontSize: '0.9rem',
                  }}>
                    ⚠ {w}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two-column: top models + provider breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '48px' }}>
            {/* Top models */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px 16px 20px 22px', padding: '28px' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Top Models Today
              </h2>
              {analytics.topModels.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No data yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analytics.topModels.map(({ model, count }, i) => (
                    <div key={model} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--fg-secondary)', fontFamily: 'monospace' }}>
                        {i + 1}. {model.length > 30 ? `${model.slice(0, 28)}…` : model}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-light)' }}>
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Provider breakdown */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px 16px 20px 22px', padding: '28px' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Provider Breakdown Today
              </h2>
              {Object.keys(analytics.providerBreakdown).length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>No data yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(analytics.providerBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([provider, count]) => (
                      <div key={provider} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: PROVIDER_COLORS[provider] || 'var(--fg-secondary)' }}>
                          {provider}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-light)' }}>
                          {count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Provider key counts */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '24px 16px 20px 22px', padding: '28px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Provider Key Capacity
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              {Object.entries(analytics.keyCountsByProvider).map(([provider, count]) => (
                <div key={provider} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '16px 10px 14px 12px', border: `1px solid ${(PROVIDER_COLORS[provider] || '#444')}30` }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700', color: PROVIDER_COLORS[provider] || 'var(--fg)', marginBottom: '4px' }}>{count}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{provider}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{count * 60} req/min</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href="/admin/keys" className="button">Manage Provider Keys</a>
            <a href="/admin/virtual-models" className="button">Virtual Models</a>
            <a href="/admin/users" className="button secondary">Manage Users</a>
          </div>
        </>
      ) : null}
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${color}30`,
      borderRadius: '24px 16px 20px 22px',
      padding: '24px',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: '700', color, marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}
