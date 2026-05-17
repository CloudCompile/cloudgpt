'use client';

import { PROVIDER_GLYPHS } from '@/components/brand/ProviderGlyphs';
import { IconArrowRight } from '@/components/brand/icons';

const PROVIDERS = [
  {
    name: 'AIHubMix',
    tagline: 'Premium gateway',
    desc: 'Routes to GPT-4o, Claude 3.5 Sonnet, Gemini 2.0, DeepSeek R1, and 50+ other top-tier models via a single managed key.',
    models: '50+ models',
    caps: ['Chat', 'Images', 'Audio'],
    prefix: 'aihubmix',
    note: null,
    routeOrder: 1,
  },
  {
    name: 'Pollinations',
    tagline: 'Creative generation',
    desc: 'Decentralized AI network focused on generative media — text, images, video, and audio through a unified endpoint.',
    models: '40+ models',
    caps: ['Chat', 'Images', 'Video', 'Audio', 'Transcription'],
    prefix: 'pollinations',
    note: null,
    routeOrder: 2,
  },
  {
    name: 'VoidAI',
    tagline: 'High availability',
    desc: 'Stable free-tier endpoints for major model families with consistent uptime and broad model coverage.',
    models: '15+ models',
    caps: ['Chat', 'Transcription'],
    prefix: 'voidai',
    note: null,
    routeOrder: 3,
  },
  {
    name: 'Airforce',
    tagline: 'Broad coverage',
    desc: 'Fast endpoints across 53 models from OpenAI, Anthropic, Meta, Mistral, and xAI. Good selection of frontier models.',
    models: '53 models',
    caps: ['Chat', 'Transcription', 'Music'],
    prefix: 'airforce',
    note: null,
    routeOrder: 4,
  },
  {
    name: 'Cerebras',
    tagline: 'Ultra-fast inference',
    desc: 'LPU hardware delivers industry-leading token throughput for Llama 3.3, Llama 4 Scout, and DeepSeek R1.',
    models: '3 models',
    caps: ['Chat'],
    prefix: 'cerebras',
    note: '1M tokens / day per key',
    routeOrder: 5,
  },
  {
    name: 'Groq',
    tagline: 'Speed leader',
    desc: 'LPU-powered inference with the fastest tokens-per-second in the industry. Includes TTS and transcription.',
    models: '16+ models',
    caps: ['Chat', 'Transcription', 'Speech'],
    prefix: 'groq',
    note: null,
    routeOrder: 6,
  },
  {
    name: 'AI Horde',
    tagline: 'Volunteer network',
    desc: 'Crowdsourced generation powered by volunteer GPU workers. Huge image model library with 160+ Stable Diffusion variants.',
    models: '186+ models',
    caps: ['Chat', 'Images', 'Interrogation'],
    prefix: 'aihorde',
    note: 'Queue-based — slower at peak',
    routeOrder: 7,
  },
  {
    name: 'TokenReply',
    tagline: 'Multi-provider mix',
    desc: 'Aggregator with access to GPT-4, Claude, Gemini, and other frontier models. Good coverage for text generation.',
    models: '14+ models',
    caps: ['Chat'],
    prefix: 'tokenreply',
    note: null,
    routeOrder: 8,
  },
  {
    name: 'NagaAI',
    tagline: 'OpenAI-compatible',
    desc: 'OpenAI-drop-in endpoint with a curated selection of chat models. Simple, reliable, and easy to integrate.',
    models: '13 models',
    caps: ['Chat'],
    prefix: 'nagaai',
    note: null,
    routeOrder: 9,
  },
  {
    name: 'Happupy',
    tagline: 'Community contributed',
    desc: 'Powered entirely by donated free-account keys from contributors. Every free Happupy account gets 100k tokens/day.',
    models: 'Varies',
    caps: ['Chat'],
    prefix: 'happupy',
    note: '100k tokens / day (donated keys)',
    routeOrder: 10,
  },
] as const;

const FALLBACK_CHAIN = PROVIDERS.map(p => p.name).join(' → ');

const CAP_COLORS: Record<string, string> = {
  Chat: '#6366f1',
  Images: '#a855f7',
  Video: '#f43f5e',
  Audio: '#22c55e',
  Transcription: '#f59e0b',
  Speech: '#06b6d4',
  Music: '#ec4899',
  Interrogation: '#8b5cf6',
};

function ProviderCard({ provider }: { provider: typeof PROVIDERS[number] }) {
  const entry = PROVIDER_GLYPHS[provider.name];
  const color = entry?.color ?? '#7c3aed';

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
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '2px', color }}>{provider.name}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>{provider.tagline}</p>
        </div>
        <span style={{
          marginLeft: 'auto', flexShrink: 0,
          fontSize: '0.75rem', fontWeight: '600',
          color: 'var(--text-tertiary)',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          padding: '3px 8px', borderRadius: 'var(--radius-sm)',
        }}>
          #{provider.routeOrder}
        </span>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px', flex: 1 }}>
        {provider.desc}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
        {provider.caps.map((cap) => (
          <span
            key={cap}
            style={{
              padding: '3px 9px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.74rem',
              fontWeight: '600',
              background: `${CAP_COLORS[cap] ?? '#7c3aed'}15`,
              color: CAP_COLORS[cap] ?? 'var(--accent-light)',
              border: `1px solid ${CAP_COLORS[cap] ?? '#7c3aed'}30`,
            }}
          >
            {cap}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
        <code style={{ fontSize: '0.78rem', background: 'transparent', border: 'none', padding: 0, color: 'var(--text-tertiary)' }}>
          {provider.prefix}/<span style={{ color: 'var(--text-secondary)' }}>model-id</span>
        </code>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {provider.models}
        </span>
      </div>

      {provider.note && (
        <div style={{
          marginTop: '10px',
          padding: '7px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          fontSize: '0.78rem',
          color: '#fcd34d',
          fontWeight: '500',
        }}>
          ⚠ {provider.note}
        </div>
      )}
    </div>
  );
}

export default function ProvidersPage() {
  const totalModels = '357+';

  return (
    <main>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(79, 70, 229, 0.07) 50%, rgba(59, 130, 246, 0.04) 100%)',
        borderBottom: '1px solid var(--border)',
        paddingTop: '80px',
        paddingBottom: '80px',
      }}>
        <div className="container" style={{ maxWidth: '900px', textAlign: 'center' }}>
          <p className="eyebrow">{PROVIDERS.length} Providers</p>
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: '900',
            marginBottom: '20px',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
          }}>
            Every AI model.<br />One API.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto 40px', lineHeight: '1.7' }}>
            OpenRelay aggregates {totalModels} models across {PROVIDERS.length} providers — text, images, video, audio, and more. All OpenAI-compatible. Always free.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/dashboard" className="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Get an API Key <IconArrowRight size={15} />
            </a>
            <a href="/models" className="button secondary">Browse All Models</a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '24px 0' }}>
            {[
              { label: 'Providers', value: PROVIDERS.length.toString() },
              { label: 'Total Models', value: totalModels },
              { label: 'Model Types', value: '6' },
              { label: 'API Standard', value: 'OpenAI' },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-light)', marginBottom: '4px' }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider grid */}
      <section style={{ paddingTop: '72px', paddingBottom: '80px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ marginBottom: '40px' }}>
            <p className="eyebrow">All Providers</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px' }}>
              Who powers your requests
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.7' }}>
              The number badge shows each provider's position in the automatic fallback chain. When you don't specify a provider, OpenRelay tries them in order until one succeeds.
            </p>
          </div>

          <div className="grid-providers">
            {PROVIDERS.map((provider) => (
              <ProviderCard key={provider.name} provider={provider} />
            ))}
          </div>
        </div>
      </section>

      {/* Routing explainer */}
      <section style={{ paddingTop: '72px', paddingBottom: '80px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <p className="eyebrow">Routing</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '32px' }}>
            How requests are routed
          </h2>

          <div className="grid-2" style={{ marginBottom: '40px' }}>
            <div className="card">
              <h3 style={{ fontWeight: '700', marginBottom: '10px', fontSize: '1rem' }}>Default routing</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '16px' }}>
                Send any request without a provider prefix and OpenRelay automatically tries each provider in order until one responds successfully.
              </p>
              <div className="curl-example" style={{ fontSize: '0.8rem', padding: '14px 16px', margin: 0 }}>{`"model": "gpt-4o-free"`}</div>
            </div>

            <div className="card">
              <h3 style={{ fontWeight: '700', marginBottom: '10px', fontSize: '1rem' }}>Provider-specific routing</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '16px' }}>
                Prefix the model name with a provider slug to route directly to that provider. Skips the fallback chain entirely.
              </p>
              <div className="curl-example" style={{ fontSize: '0.8rem', padding: '14px 16px', margin: 0 }}>{`"model": "groq/llama-3.3-70b-versatile"`}</div>
            </div>
          </div>

          <div style={{
            padding: '20px 24px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(124, 58, 237, 0.06)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Fallback Chain
            </p>
            <p style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.8',
              wordBreak: 'break-word',
            }}>
              {FALLBACK_CHAIN}
            </p>
          </div>
        </div>
      </section>

      {/* Donate CTA */}
      <section style={{ paddingTop: '72px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '700px', textAlign: 'center' }}>
          <p className="eyebrow">Contributor Program</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px' }}>
            Help keep OpenRelay free
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.8', marginBottom: '32px', maxWidth: '540px', margin: '0 auto 32px' }}>
            Several providers offer completely free API keys. If you have one — Groq, Cerebras, Happupy, or AI Horde — donating it takes 30 seconds and expands the network's capacity for everyone.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/donate" className="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Donate a Key <IconArrowRight size={15} />
            </a>
            <a href="/contributor" className="button secondary">View Contributor Perks</a>
          </div>
        </div>
      </section>
    </main>
  );
}
