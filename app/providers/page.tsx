'use client';

export default function ProvidersPage() {
  const providers = [
    {
      name: 'AIHubMix',
      icon: '🎨',
      website: 'https://aihubmix.com',
      description: 'Gateway to 100+ AI models with smart routing',
      models: '50+ models',
      features: ['Chat', 'Image generation', 'Audio'],
    },
    {
      name: 'Pollinations',
      icon: '🌺',
      website: 'https://pollinations.ai',
      description: 'Decentralized AI network with diverse models',
      models: '40+ models',
      features: ['Chat', 'Image', 'Video', 'Audio', 'Transcription'],
    },
    {
      name: 'VoidAI',
      icon: '🌌',
      website: 'https://voidai.app',
      description: 'Free tier models with high availability',
      models: '15+ models',
      features: ['Chat', 'Transcription'],
    },
    {
      name: 'Airforce',
      icon: '✈️',
      website: 'https://api.airforce',
      description: 'Fast and reliable AI endpoints',
      models: '20+ models',
      features: ['Chat', 'Transcription', 'Music generation'],
    },
    {
      name: 'Cerebras',
      icon: '⚡',
      website: 'https://cerebras.ai',
      description: 'High-performance compute for large language models',
      models: '3 models',
      features: ['Chat (text only)'],
    },
    {
      name: 'Groq',
      icon: '🚀',
      website: 'https://groq.com',
      description: 'Ultra-fast LPU-powered inference with competitive rates',
      models: '16+ models',
      features: ['Chat', 'Transcription', 'Text-to-Speech'],
    },
    {
      name: 'AI Horde',
      icon: '🐴',
      website: 'https://aihorde.net',
      description: 'Decentralized volunteer worker network for distributed generation',
      models: '186+ models',
      features: ['Chat', 'Image (160+ models)', 'Interrogation'],
    },
  ];

  return (
    <main className="container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', textAlign: 'center' }}>
        Our Providers
      </h1>
      <p style={{
        color: 'var(--text-secondary)',
        marginBottom: '60px',
        fontSize: '1.1rem',
        textAlign: 'center',
        maxWidth: '700px',
        margin: '0 auto 60px'
      }}>
        OpenRelay aggregates models from 8 leading AI providers, giving you access to 200+ free models with automatic fallback and load balancing.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '28px',
        marginBottom: '60px'
      }}>
        {providers.map((provider) => (
          <a
            key={provider.name}
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '32px',
              borderRadius: '20px 12px 16px 24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
              {provider.icon}
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '8px' }}>
              {provider.name}
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              marginBottom: '16px',
              lineHeight: '1.6'
            }}>
              {provider.description}
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '16px'
            }}>
              {provider.features.map((feature) => (
                <span
                  key={feature}
                  style={{
                    fontSize: '0.8rem',
                    padding: '4px 10px',
                    borderRadius: '8px 6px 8px 6px',
                    background: 'rgba(124, 58, 237, 0.1)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-tertiary)',
              fontWeight: '500'
            }}>
              {provider.models}
            </p>
          </a>
        ))}
      </div>

      <div style={{
        padding: '40px',
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(79, 70, 229, 0.06) 100%)',
        borderRadius: '24px 16px 20px 22px',
        border: '1px solid rgba(124, 58, 237, 0.25)',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
          Smart Routing & Fallback
        </h2>
        <p style={{
          color: 'var(--text-secondary)',
          lineHeight: '1.8',
          marginBottom: '16px'
        }}>
          OpenRelay intelligently routes requests to the best available provider based on:
        </p>
        <ul style={{
          color: 'var(--text-secondary)',
          lineHeight: '1.8',
          marginLeft: '20px'
        }}>
          <li><strong>Model availability:</strong> Direct routing if you specify a provider (e.g., groq/llama-3.3-70b)</li>
          <li><strong>Provider health:</strong> Automatic fallback if a provider is down</li>
          <li><strong>Rate limits:</strong> Smart distribution based on key pool size and remaining quota</li>
          <li><strong>Latency:</strong> Prioritizes faster endpoints when possible</li>
        </ul>
      </div>

      <div style={{ marginTop: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>
          Want to learn how to use these providers? Check out our <a href="/docs" style={{ color: 'var(--accent)' }}>documentation</a>.
        </p>
      </div>
    </main>
  );
}
