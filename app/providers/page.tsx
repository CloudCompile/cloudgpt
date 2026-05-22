'use client';

import { useEffect, useState, useMemo } from 'react';
import { PROVIDER_GLYPHS } from '@/components/brand/ProviderGlyphs';
import { IconArrowRight } from '@/components/brand/icons';

interface Provider {
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

const CAP_COLORS: Record<string, string> = {
  Chat: '#6366f1',
  Images: '#a855f7',
  Video: '#f43f5e',
  Audio: 'var(--success)',
  Transcription: '#f59e0b',
  Speech: '#06b6d4',
  Music: '#ec4899',
};

function ProviderCard({ provider }: { provider: Provider }) {
  const entry = PROVIDER_GLYPHS[provider.name];
  const color = entry?.color ?? 'var(--accent)';
  const isActive = provider.status === 'active';

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        {entry ? (
          <div style={{
            width: 46, height: 46, flexShrink: 0,
            borderRadius: 'var(--radius)',
            background: `${color}15`,
            border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            <entry.Glyph size={24} />
          </div>
        ) : (
          <div style={{
            width: 46, height: 46, flexShrink: 0,
            borderRadius: 'var(--radius)',
            background: `${color}15`,
            border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color, fontWeight: 700, fontSize: '0.9rem',
          }}>
            {provider.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '2px', color }}>{provider.name}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: '500', marginBottom: '4px' }}>
            {provider.freeLimit}
          </p>
        </div>
        <div style={{
          flexShrink: 0,
          fontSize: '0.7rem', fontWeight: '700',
          padding: '4px 9px', borderRadius: 'var(--radius-sm)',
          background: isActive ? 'rgba(90,158,111,0.1)' : 'rgba(184,104,64,0.1)',
          color: isActive ? '#3a7a52' : 'var(--accent-light)',
          border: `1px solid ${isActive ? 'rgba(90,158,111,0.25)' : 'rgba(184,104,64,0.25)'}`,
          whiteSpace: 'nowrap',
        }}>
          {isActive ? '✓ LIVE' : `${provider.keyCount}/${provider.keysRequired}`}
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px', flex: 1 }}>
        {provider.description}
      </p>

      {provider.signupUrl && (
        <a
          href={provider.signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.84rem',
            fontWeight: '600',
            color: 'var(--accent-light)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(184,104,64,0.22)',
            background: 'rgba(184,104,64,0.06)',
            transition: 'all 0.2s',
            width: 'fit-content',
          }}
        >
          Get Free Key <IconArrowRight size={13} />
        </a>
      )}
    </div>
  );
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'coming_soon'>('all');

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
    let result = providers;

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.freeLimit.toLowerCase().includes(q)
      );
    }

    return result;
  }, [providers, search, statusFilter]);

  const activeCount = providers.filter(p => p.status === 'active').length;
  const comingSoonCount = providers.filter(p => p.status === 'coming_soon').length;

  return (
    <main>
      {/* Hero */}
      <section style={{
        paddingTop: '100px',
        paddingBottom: '80px',
        background: 'linear-gradient(135deg, rgba(184,104,64,0.09) 0%, rgba(184,104,64,0.05) 50%, rgba(184,104,64,0.03) 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container" style={{ maxWidth: '900px', textAlign: 'center' }}>
          <p className="eyebrow">AI Providers</p>
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: '900',
            marginBottom: '20px',
            letterSpacing: '-0.02em',
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {providers.length}+ Free AI Providers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.7' }}>
            Access cutting-edge AI models from {activeCount} active providers. {comingSoonCount} more unlocking as the community donates free API keys.
          </p>

          <div style={{
            display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '600px', margin: '0 auto',
          }}>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                border: statusFilter === 'all' ? 'none' : '1px solid var(--border)',
                background: statusFilter === 'all' ? 'var(--accent-gradient)' : 'transparent',
                color: statusFilter === 'all' ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              All ({providers.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                border: statusFilter === 'active' ? 'none' : '1px solid var(--border)',
                background: statusFilter === 'active' ? 'rgba(90,158,111,0.15)' : 'transparent',
                color: statusFilter === 'active' ? '#3a7a52' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              Live ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('coming_soon')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                border: statusFilter === 'coming_soon' ? 'none' : '1px solid var(--border)',
                background: statusFilter === 'coming_soon' ? 'rgba(184,104,64,0.1)' : 'transparent',
                color: statusFilter === 'coming_soon' ? 'var(--accent-light)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
              }}
            >
              Coming Soon ({comingSoonCount})
            </button>
          </div>
        </div>
      </section>

      {/* Providers */}
      <section style={{ paddingTop: '80px', paddingBottom: '100px' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          {/* Search */}
          <div style={{ marginBottom: '40px' }}>
            <input
              type="text"
              placeholder="Search providers by name, description, or limit…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                fontSize: '0.95rem',
              }}
            />
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              Loading providers...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
              No providers match your search
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}>
              {filtered.map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        background: 'linear-gradient(135deg, rgba(184,104,64,0.07) 0%, rgba(184,104,64,0.04) 100%)',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '16px' }}>
            Help Unlock More Providers
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1rem', lineHeight: '1.7' }}>
            Each provider needs just 3 verified free API keys to activate. Donate yours and unlock instant access for everyone.
          </p>
          <a href="/donate" className="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Donate a Key <IconArrowRight size={15} />
          </a>
        </div>
      </section>
    </main>
  );
}
