'use client';

import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section style={{
        paddingTop: '100px',
        paddingBottom: '100px',
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(79, 70, 229, 0.1) 50%, rgba(59, 130, 246, 0.05) 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container" style={{ maxWidth: '900px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '900',
            marginBottom: '16px',
            letterSpacing: '-1px',
            lineHeight: '1.1',
          }}>
            Free AI API Gateway
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            marginBottom: '48px',
            fontWeight: '500',
            maxWidth: '700px',
            margin: '0 auto 48px'
          }}>
            Access 200+ AI models from 8 providers with a single API key. Fast, reliable, and completely free.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <SignedOut>
              <SignUpButton>
                <button className="button" style={{
                  padding: '14px 40px',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}>
                  Get Started Free
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <a href="/dashboard" className="button" style={{
                padding: '14px 40px',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-block',
              }}>
                Go to Dashboard
              </a>
            </SignedIn>
            <a href="/docs" className="button secondary" style={{
              padding: '14px 40px',
              fontSize: '1rem',
              fontWeight: '600',
            }}>
              Read Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Providers Section */}
      <section style={{ paddingTop: '100px', paddingBottom: '100px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: '12px'
            }}>
              Powered By
            </p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '20px' }}>
              200+ Models from 8 Providers
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
              We aggregate the best AI models from industry-leading providers, giving you access to the latest technology with zero setup.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}>
            {[
              { name: 'AIHubMix', desc: '50+ models', color: '#6366f1' },
              { name: 'Pollinations', desc: '40+ models', color: '#a855f7' },
              { name: 'VoidAI', desc: '15+ models', color: '#06b6d4' },
              { name: 'Airforce', desc: '20+ models', color: '#f59e0b' },
              { name: 'Cerebras', desc: '3 models', color: '#8b5cf6' },
              { name: 'Groq', desc: '16+ models', color: '#00d084' },
              { name: 'AI Horde', desc: '186+ models', color: '#ec4899' },
            ].map((provider) => (
              <div
                key={provider.name}
                style={{
                  padding: '28px',
                  borderRadius: '16px',
                  border: `1px solid ${provider.color}30`,
                  background: 'var(--bg)',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = provider.color;
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.background = `${provider.color}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${provider.color}30`;
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.background = 'var(--bg)';
                }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '12px', opacity: 0.7 }}>🤖</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: provider.color }}>
                  {provider.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {provider.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '60px', textAlign: 'center' }}>
            <a href="/providers" style={{
              color: 'var(--accent)',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            >
              Explore All Providers →
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ paddingTop: '100px', paddingBottom: '100px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <p style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: '12px'
            }}>
              Features
            </p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '20px' }}>
              Built for Developers
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
              Everything you need to build powerful AI applications, all in one simple API.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
          }}>
            {[
              { icon: '⚡', title: 'Lightning Fast', desc: 'Ultra-low latency routing with intelligent provider selection' },
              { icon: '🔄', title: 'Auto Fallback', desc: 'Seamless provider switching on errors or rate limits' },
              { icon: '🔒', title: 'Secure & Private', desc: 'Enterprise-grade encryption for all API keys and data' },
              { icon: '🎨', title: 'All Model Types', desc: 'Text, images, video, audio, embeddings, and more' },
              { icon: '💸', title: 'Completely Free', desc: 'No credit card needed. Unlimited free tier for developers' },
              { icon: '🔌', title: 'Drop-in Ready', desc: 'OpenAI compatible API — switch providers with one line' },
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{
                  padding: '32px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(124, 58, 237, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '2.8rem', marginBottom: '20px', lineHeight: '1' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '12px', color: 'var(--fg)' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        paddingTop: '120px',
        paddingBottom: '120px',
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(79, 70, 229, 0.12) 50%, rgba(59, 130, 246, 0.08) 100%)',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
      }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: '900', marginBottom: '24px', lineHeight: '1.1' }}>
            Start Building with AI Today
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.15rem',
            marginBottom: '48px',
            lineHeight: '1.6',
            maxWidth: '700px',
            margin: '0 auto 48px',
          }}>
            Get instant access to 200+ AI models from 8 providers. No credit card, no setup fees, no limits.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <SignedIn>
              <a href="/dashboard" className="button" style={{
                padding: '14px 40px',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-block',
              }}>
                Go to Dashboard
              </a>
            </SignedIn>
            <SignedOut>
              <SignUpButton>
                <button className="button" style={{
                  padding: '14px 40px',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}>
                  Sign Up Free
                </button>
              </SignUpButton>
            </SignedOut>
            <a href="/docs" className="button secondary" style={{
              padding: '14px 40px',
              fontSize: '1rem',
              fontWeight: '600',
            }}>
              API Docs
            </a>
          </div>
        </div>
      </section>

      {/* Footer with Provider Badges */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '60px',
        paddingBottom: '60px',
        background: 'var(--bg-secondary)',
      }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          {/* Provider Badges Section */}
          <div style={{ marginBottom: '60px', paddingBottom: '60px', borderBottom: '1px solid var(--border)' }}>
            <p style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              marginBottom: '24px',
            }}>
              Powered by leading AI providers
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px',
              alignItems: 'center',
            }}>
              {/* Groq Badge */}
              <a href="https://groq.com" target="_blank" rel="noopener noreferrer">
                <img src="https://console.groq.com/powered-by-groq-dark.svg" alt="Powered by Groq for fast inference." />
              </a>

              {/* Pollinations Badge */}
              <a href="https://pollinations.ai" target="_blank" rel="noopener noreferrer">
                <img src="https://pollinations.ai/favicon.ico" alt="Powered by Pollinations AI" height="32" />
              </a>

              {/* Other Providers */}
              {['AIHubMix', 'Pollinations', 'VoidAI', 'Airforce', 'Cerebras', 'AI Horde'].map((provider) => (
                <div key={provider} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg)';
                }}
                >
                  <a href="/providers" style={{
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                  }}>
                    {provider}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '60px',
            marginBottom: '50px',
          }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: 'var(--fg)' }}>
                OpenRelay
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8' }}>
                Free AI API gateway for developers everywhere. Access 200+ cutting-edge models from 8 top providers with one API key.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '18px', color: 'var(--fg)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
                Product
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '14px' }}>
                  <a href="/models" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    📚 Explore Models
                  </a>
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <a href="/providers" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    🔌 Providers
                  </a>
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <a href="/docs" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    📖 Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '18px', color: 'var(--fg)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
                Community
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '14px' }}>
                  <a href="https://github.com/CloudCompile/cloudgpt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    ⭐ Star on GitHub
                  </a>
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <a href="https://github.com/CloudCompile/cloudgpt/issues" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    🐛 Report Issues
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div style={{
            paddingTop: '24px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
          }}>
            <p>© 2026 OpenRelay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
