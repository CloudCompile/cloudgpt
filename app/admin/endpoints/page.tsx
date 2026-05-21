'use client';

import { useEffect, useState } from 'react';

interface Endpoint {
  id: string;
  name: string;
  path: string;
  description: string;
  category: 'text' | 'image' | 'audio' | 'video';
  enabled: boolean;
}

interface Stats {
  total: number;
  enabled: number;
  disabled: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  text: '#6366f1',
  image: '#a855f7',
  audio: '#22c55e',
  video: '#f43f5e',
};

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/endpoints')
      .then(r => r.json())
      .then(d => {
        setEndpoints(d.endpoints ?? []);
        setStats(d.stats);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load endpoints:', e);
        setLoading(false);
      });
  }, []);

  async function toggleEndpoint(endpointId: string, currentEnabled: boolean) {
    setUpdating(endpointId);
    try {
      const res = await fetch('/api/admin/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId, enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (res.ok) {
        setEndpoints(data.endpoints);
        setStats(data.stats);
      } else {
        console.error('Failed to update endpoint:', data.error);
      }
    } catch (e) {
      console.error('Error updating endpoint:', e);
    } finally {
      setUpdating(null);
    }
  }

  const grouped = endpoints.reduce((acc, ep) => {
    if (!acc[ep.category]) acc[ep.category] = [];
    acc[ep.category].push(ep);
    return acc;
  }, {} as Record<string, Endpoint[]>);

  return (
    <div className="container" style={{ maxWidth: '900px', paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '8px' }}>Generation Endpoints</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Enable or disable specific API endpoints. All endpoints are enabled by default.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}>
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--fg)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Total Endpoints
            </div>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(34,197,94,0.3)',
            background: 'rgba(34,197,94,0.08)',
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#86efac' }}>
              {stats.enabled}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#86efac', fontWeight: '600' }}>
              Enabled
            </div>
          </div>
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)',
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fca5a5' }}>
              {stats.disabled}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: '600' }}>
              Disabled
            </div>
          </div>
        </div>
      )}

      {/* Endpoints by category */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          Loading endpoints...
        </div>
      ) : (
        Object.entries(grouped).map(([category, categoryEndpoints]) => (
          <div key={category} style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              marginBottom: '16px',
              color: CATEGORY_COLORS[category] || 'var(--fg)',
              textTransform: 'capitalize',
            }}>
              {category.replace('-', ' ')} Endpoints
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categoryEndpoints.map(ep => (
                <div
                  key={ep.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${ep.enabled ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    background: ep.enabled ? 'rgba(34,197,94,0.06)' : 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>
                      {ep.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {ep.path}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {ep.description}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleEndpoint(ep.id, ep.enabled)}
                    disabled={updating === ep.id}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius)',
                      border: 'none',
                      background: ep.enabled ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                      color: ep.enabled ? '#86efac' : '#fca5a5',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: updating === ep.id ? 'not-allowed' : 'pointer',
                      opacity: updating === ep.id ? 0.7 : 1,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {updating === ep.id ? 'Updating...' : (ep.enabled ? '✓ Enabled' : 'Disabled')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
