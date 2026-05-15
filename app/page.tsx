'use client';

import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';
import Wordmark from '@/components/brand/Wordmark';
import {
  IconBolt, IconFallback, IconLock, IconPalette, IconSparkle, IconPlug,
  IconBadge,
  IconBook, IconProviders, IconDocs, IconStar, IconBug, IconGitHub,
  IconArrowRight,
} from '@/components/brand/icons';
import { PROVIDER_GLYPHS } from '@/components/brand/ProviderGlyphs';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const features = [
  { Icon: IconBolt,     accent: 'violet' as const, title: 'Lightning Fast',   desc: 'Ultra-low latency routing with intelligent provider selection' },
  { Icon: IconFallback, accent: 'indigo' as const, title: 'Auto Fallback',    desc: 'Seamless provider switching on errors or rate limits' },
  { Icon: IconLock,     accent: 'blue'   as const, title: 'Secure & Private', desc: 'Enterprise-grade encryption for all API keys and data' },
  { Icon: IconPalette,  accent: 'violet' as const, title: 'All Model Types',  desc: 'Text, images, video, audio, embeddings, and more' },
  { Icon: IconSparkle,  accent: 'indigo' as const, title: 'Completely Free',  desc: 'No credit card needed. Unlimited free tier for developers' },
  { Icon: IconPlug,     accent: 'blue'   as const, title: 'Drop-in Ready',    desc: 'OpenAI compatible API — switch providers with one line' },
];

const providers = [
  { name: 'AIHubMix',    desc: '50+ models',   color: '#6366f1' },
  { name: 'Pollinations', desc: '40+ models',  color: '#a855f7' },
  { name: 'VoidAI',      desc: '15+ models',   color: '#06b6d4' },
  { name: 'Airforce',    desc: '20+ models',   color: '#f59e0b' },
  { name: 'Cerebras',    desc: '3 models',     color: '#8b5cf6' },
  { name: 'Groq',        desc: '16+ models',   color: '#00d084' },
  { name: 'AI Horde',    desc: '186+ models',  color: '#ec4899' },
  { name: 'TokenReply',  desc: '14+ models',   color: '#7c3aed' },
  { name: 'NagaAI',     desc: '13 models',    color: '#10b981' },
];

const navLinkStyle = { color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center' };
function onHover(e: React.MouseEvent<HTMLAnchorElement>) { e.currentTarget.style.color = 'var(--accent)'; }
function onLeave(e: React.MouseEvent<HTMLAnchorElement>) { e.currentTarget.style.color = 'var(--text-secondary)'; }

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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <Wordmark variant="tagline" size="lg" />
          </div>
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            marginBottom: '48px',
            fontWeight: '500',
            maxWidth: '700px',
            margin: '0 auto 48px'
          }}>
            Access 200+ AI models from 9 providers with a single API key. Fast, reliable, and completely free.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isClerkConfigured ? (
              <>
                <SignedOut>
                  <SignUpButton>
                    <button className="button" style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      Get Started Free <IconArrowRight size={16} />
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <a href="/dashboard" className="button" style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    Go to Dashboard <IconArrowRight size={16} />
                  </a>
                </SignedIn>
              </>
            ) : (
              <a href="/dashboard" className="button" style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Get Started Free <IconArrowRight size={16} />
              </a>
            )}
            <a href="/docs" className="button secondary" style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <IconBook size={16} /> Read Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Providers Section */}
      <section style={{ paddingTop: '100px', paddingBottom: '100px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>
              Powered By
            </p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '20px' }}>
              200+ Models from 9 Providers
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
            {providers.map((provider) => {
              const entry = PROVIDER_GLYPHS[provider.name];
              return (
                <div
                  key={provider.name}
                  style={{
                    padding: '28px',
                    borderRadius: '16px 12px 14px 18px',
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
                  {entry ? (
                    <div style={{
                      width: 52, height: 52, margin: '0 auto 14px',
                      borderRadius: '14px 10px 12px 11px',
                      background: `${entry.color}18`,
                      border: `1px solid ${entry.color}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: entry.color,
                    }}>
                      <entry.Glyph size={28} />
                    </div>
                  ) : (
                    <div style={{
                      width: 52, height: 52, margin: '0 auto 14px',
                      borderRadius: '14px 10px 12px 11px',
                      background: `${provider.color}18`,
                      border: `1px solid ${provider.color}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: provider.color, fontSize: '1.5rem',
                    }}>
                      ⚡
                    </div>
                  )}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: provider.color }}>
                    {provider.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {provider.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '60px', textAlign: 'center' }}>
            <a href="/providers" style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: '600', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Explore All Providers <IconArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ paddingTop: '100px', paddingBottom: '100px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>
              Features
            </p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '20px' }}>
              Built for Developers
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
              Everything you need to build powerful AI applications, all in one simple API.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  padding: '32px',
                  borderRadius: '16px 12px 14px 18px',
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
                <div style={{ marginBottom: '20px' }}>
                  <IconBadge icon={feature.Icon} accent={feature.accent} size={56} />
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', marginBottom: '48px', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto 48px' }}>
            Get instant access to 200+ AI models from 9 providers. No credit card, no setup fees, no limits.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isClerkConfigured ? (
              <>
                <SignedIn>
                  <a href="/dashboard" className="button" style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    Go to Dashboard <IconArrowRight size={16} />
                  </a>
                </SignedIn>
                <SignedOut>
                  <SignUpButton>
                    <button className="button" style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      Sign Up Free <IconArrowRight size={16} />
                    </button>
                  </SignUpButton>
                </SignedOut>
              </>
            ) : (
              <a href="/dashboard" className="button" style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Sign Up Free <IconArrowRight size={16} />
              </a>
            )}
            <a href="/docs" className="button secondary" style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <IconBook size={16} /> API Docs
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', paddingTop: '60px', paddingBottom: '60px', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          {/* Provider Badges */}
          <div style={{ marginBottom: '60px', paddingBottom: '60px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
              Powered by leading AI providers
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', alignItems: 'center' }}>
              {providers.map((provider) => {
                const entry = PROVIDER_GLYPHS[provider.name];
                return (
                  <a key={provider.name} href="/providers" style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 16px', borderRadius: '12px 8px 10px 14px',
                    border: '1px solid var(--border)', backgroundColor: 'var(--bg)',
                    textDecoration: 'none', transition: 'all 0.2s ease', color: provider.color,
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = provider.color; e.currentTarget.style.background = `${provider.color}0a`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
                  >
                    {entry && <entry.Glyph size={18} />}
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>{provider.name}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '60px', marginBottom: '50px' }}>
            <div>
              <div style={{ marginBottom: '16px' }}>
                <Wordmark variant="full" size="sm" />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8' }}>
                Free AI API gateway for developers everywhere. Access 200+ cutting-edge models from 9 top providers with one API key.
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '18px', color: 'var(--fg)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
                Product
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '14px' }}>
                  <a href="/models" style={navLinkStyle} onMouseEnter={onHover} onMouseLeave={onLeave}>
                    <IconBook size={14} style={{ marginRight: 8, flexShrink: 0 }} /> Explore Models
                  </a>
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <a href="/providers" style={navLinkStyle} onMouseEnter={onHover} onMouseLeave={onLeave}>
                    <IconProviders size={14} style={{ marginRight: 8, flexShrink: 0 }} /> Providers
                  </a>
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <a href="/docs" style={navLinkStyle} onMouseEnter={onHover} onMouseLeave={onLeave}>
                    <IconDocs size={14} style={{ marginRight: 8, flexShrink: 0 }} /> Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '18px', color: 'var(--fg)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
                Community
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '14px' }}>
                  <a href="https://github.com/CloudCompile/cloudgpt" target="_blank" rel="noopener noreferrer" style={navLinkStyle} onMouseEnter={onHover} onMouseLeave={onLeave}>
                    <IconStar size={14} style={{ marginRight: 8, flexShrink: 0 }} /> Star on GitHub
                  </a>
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <a href="https://github.com/CloudCompile/cloudgpt/issues" target="_blank" rel="noopener noreferrer" style={navLinkStyle} onMouseEnter={onHover} onMouseLeave={onLeave}>
                    <IconBug size={14} style={{ marginRight: 8, flexShrink: 0 }} /> Report Issues
                  </a>
                </li>
                <li style={{ marginBottom: '14px' }}>
                  <a href="https://github.com/CloudCompile/cloudgpt" target="_blank" rel="noopener noreferrer" style={navLinkStyle} onMouseEnter={onHover} onMouseLeave={onLeave}>
                    <IconGitHub size={14} style={{ marginRight: 8, flexShrink: 0 }} /> GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            <p>© 2026 OpenRelay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
