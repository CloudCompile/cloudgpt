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
      <section style={{ paddingTop: '80px', paddingBottom: '80px', borderBottom: '1px solid var(--border)' }}>
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
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '16px' }}>
              8 Leading AI Providers
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              We aggregate models from the best AI providers, ensuring reliability, speed, and comprehensive coverage.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {[
              { name: 'AIHubMix', desc: '50+ models' },
              { name: 'Pollinations', desc: '40+ models' },
              { name: 'VoidAI', desc: '15+ models' },
              { name: 'Airforce', desc: '20+ models' },
              { name: 'Cerebras', desc: '3 models' },
              { name: 'Groq', desc: '16+ models' },
              { name: 'AI Horde', desc: '186+ models' },
            ].map((provider) => (
              <div
                key={provider.name}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>
                  {provider.name}
                </h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
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
      <section style={{ paddingTop: '80px', paddingBottom: '80px', borderBottom: '1px solid var(--border)' }}>
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
              Why OpenRelay
            </p>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800' }}>
              Everything You Need
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
          }}>
            {[
              { icon: '🚀', title: 'Lightning Fast', desc: 'Ultra-low latency with multiple providers for optimal performance' },
              { icon: '🔄', title: 'Smart Routing', desc: 'Automatic fallback and load balancing across all providers' },
              { icon: '🔐', title: 'Secure', desc: 'Enterprise-grade security with encrypted API keys' },
              { icon: '📊', title: 'Comprehensive', desc: 'Chat, images, video, audio, embeddings, and more' },
              { icon: '💰', title: 'Free Forever', desc: 'No credit card required. Generous free tier for everyone' },
              { icon: '🔌', title: 'OpenAI Compatible', desc: 'Drop-in replacement for any OpenAI API client' },
            ].map((feature, idx) => (
              <div key={idx} style={{ paddingLeft: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        paddingTop: '100px',
        paddingBottom: '100px',
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(79, 70, 229, 0.06) 100%)',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px' }}>
            Ready to get started?
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            marginBottom: '40px',
          }}>
            Get access to 200+ AI models. No credit card required.
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '48px',
            marginBottom: '40px',
          }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--fg)' }}>
                OpenRelay
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8' }}>
                Free AI API gateway for everyone. Access 200+ models from 8 providers with a single API key.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--fg)' }}>
                Quick Links
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '12px' }}>
                  <a href="/docs" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Documentation</a>
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <a href="/models" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Models</a>
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <a href="/providers" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Providers</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--fg)' }}>
                Resources
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '12px' }}>
                  <a href="https://github.com/CloudCompile/cloudgpt" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    GitHub
                  </a>
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <a href="https://github.com/CloudCompile/cloudgpt/issues" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Report Issues
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
