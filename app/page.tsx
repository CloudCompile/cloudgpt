'use client';

import { SignedIn, SignedOut, SignUpButton } from '@clerk/nextjs';
import Wordmark from '@/components/brand/Wordmark';
import {
  IconBolt, IconFallback, IconLock, IconPalette, IconSparkle, IconPlug,
  IconBadge, IconBook, IconProviders, IconDocs, IconStar, IconBug, IconGitHub,
  IconArrowRight,
} from '@/components/brand/icons';
import { PROVIDER_GLYPHS } from '@/components/brand/ProviderGlyphs';

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const features = [
  { Icon: IconBolt,     title: 'Lightning Fast',   desc: 'Ultra-low latency routing with intelligent provider selection and automatic fallback.' },
  { Icon: IconFallback, title: 'Auto Fallback',    desc: 'Seamless provider switching on errors or rate limits — your app never sees a failure.' },
  { Icon: IconLock,     title: 'Secure & Private', desc: 'Enterprise-grade encryption for all API keys and request data.' },
  { Icon: IconPalette,  title: 'All Model Types',  desc: 'Text, images, video, audio, embeddings and more — one unified API.' },
  { Icon: IconSparkle,  title: 'Completely Free',  desc: 'No credit card, no pricing tiers, no limits. Community-powered and always free.' },
  { Icon: IconPlug,     title: 'Drop-in Ready',    desc: 'OpenAI-compatible API — switch providers by changing one line of code.' },
];

const providers = [
  { name: 'Pollinations', desc: '40+ models, tiered rates',  modelCount: 40 },
  { name: 'VoidAI',       desc: '15+ models',                modelCount: 15 },
  { name: 'Airforce',     desc: '53+ models',                modelCount: 53 },
  { name: 'Cerebras',     desc: '3 ultra-fast models',       modelCount: 3  },
  { name: 'Groq',         desc: '16+ models',                modelCount: 16 },
  { name: 'AI Horde',     desc: '186+ models',               modelCount: 186 },
  { name: 'TokenReply',   desc: '14+ models',                modelCount: 14 },
  { name: 'NagaAI',       desc: '13 models',                 modelCount: 13 },
  { name: 'Happupy',      desc: '5+ models',                 modelCount: 5  },
];

const totalModelCount = providers.reduce((sum, p) => sum + p.modelCount, 0);

const pill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 14px',
  borderRadius: '999px',
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  background: 'rgba(184,104,64,0.1)',
  color: 'var(--accent-dark)',
  border: '1px solid var(--accent-muted)',
  marginBottom: '18px',
};

const navLinkStyle = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'color 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  fontSize: '0.9rem',
};
function onHover(e: React.MouseEvent<HTMLAnchorElement>) { e.currentTarget.style.color = 'var(--accent)'; }
function onLeave(e: React.MouseEvent<HTMLAnchorElement>) { e.currentTarget.style.color = 'var(--text-secondary)'; }

export default function Home() {
  return (
    <main>
      {/* ── Hero ── */}
      <section style={{
        paddingTop: '96px',
        paddingBottom: '96px',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle warm radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,137,106,0.13) 0%, transparent 70%)',
        }} />
        <div className="container" style={{ maxWidth: '820px', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
            <Wordmark variant="tagline" size="lg" />
          </div>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            marginBottom: '44px',
            fontWeight: 450,
            maxWidth: '640px',
            margin: '0 auto 44px',
            lineHeight: 1.7,
          }}>
            Access <strong style={{ color: 'var(--fg)', fontWeight: 650 }}>{totalModelCount}+ AI models</strong> across{' '}
            <strong style={{ color: 'var(--fg)', fontWeight: 650 }}>{providers.length + 100}+ providers</strong> — all powered
            by community-donated API keys. One key. Always free.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isClerkConfigured ? (
              <>
                <SignedOut>
                  <SignUpButton>
                    <button className="button" style={{ padding: '13px 36px', fontSize: '1rem', fontWeight: '650', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      Get Started Free <IconArrowRight size={15} />
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <a href="/dashboard" className="button" style={{ padding: '13px 36px', fontSize: '1rem', fontWeight: '650', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    Go to Dashboard <IconArrowRight size={15} />
                  </a>
                </SignedIn>
              </>
            ) : (
              <a href="/dashboard" className="button" style={{ padding: '13px 36px', fontSize: '1rem', fontWeight: '650', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Get Started Free <IconArrowRight size={15} />
              </a>
            )}
            <a href="/docs" className="button secondary" style={{ padding: '13px 32px', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <IconBook size={15} /> Documentation
            </a>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '56px', flexWrap: 'wrap' }}>
            {[
              { val: `${totalModelCount}+`, label: 'AI Models' },
              { val: `${providers.length + 100}+`, label: 'Providers' },
              { val: 'Free', label: 'Forever' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--fg)', lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Providers ── */}
      <section style={{ padding: '88px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={pill}>Powered By</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '16px', color: 'var(--fg)' }}>
              {totalModelCount}+ Models, One Simple API
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
              Community-powered routing across the best free AI providers.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '40px',
          }}>
            {providers.map((provider) => {
              const entry = PROVIDER_GLYPHS[provider.name];
              return (
                <div
                  key={provider.name}
                  style={{
                    padding: '24px 20px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.25s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-muted)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  {entry ? (
                    <div style={{
                      width: 46, height: 46, margin: '0 auto 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)',
                    }}>
                      <entry.Glyph size={24} />
                    </div>
                  ) : (
                    <div style={{
                      width: 46, height: 46, margin: '0 auto 12px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem',
                    }}>⚡</div>
                  )}
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--fg)' }}>
                    {provider.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
                    {provider.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center' }}>
            <a href="/providers" style={{ color: 'var(--accent)', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', padding: '8px 16px', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184,104,64,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Explore all providers <IconArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Donate CTA ── */}
      <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '56px 48px',
            textAlign: 'center',
            boxShadow: 'var(--shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Warm accent corner */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '200px', height: '200px',
              background: 'radial-gradient(circle at top right, rgba(212,137,106,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={pill}>Contributor Program</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '16px', color: 'var(--fg)', lineHeight: 1.2 }}>
              OpenRelay is free because contributors donate API keys
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', maxWidth: '580px', margin: '0 auto 32px', lineHeight: 1.75 }}>
              100+ providers are waiting to be unlocked — each needs just 3 verified free API keys to activate.
              Donating takes 30 seconds and earns you a Discord Contributor badge.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '36px' }}>
              <a href="/donate" className="button" style={{ padding: '12px 32px', fontSize: '0.95rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                🔑 Donate a Key
              </a>
              <a href="/providers" className="button secondary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                Browse Providers
              </a>
            </div>
            <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Unlock providers', desc: '3 keys activates a new provider for all users' },
                { label: 'Monitor your keys', desc: 'See health and uptime in real time' },
                { label: 'Discord role', desc: 'Automatic Contributor badge on our server' },
              ].map((b, i) => (
                <div key={i} style={{ textAlign: 'left', maxWidth: '180px' }}>
                  <p style={{ fontWeight: 650, fontSize: '0.86rem', color: 'var(--accent-dark)', marginBottom: '4px' }}>✓ {b.label}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '88px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={pill}>Features</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '14px', color: 'var(--fg)' }}>
              Built for Developers
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', maxWidth: '580px', margin: '0 auto', lineHeight: 1.7 }}>
              Everything you need to build powerful AI applications, from one clean API.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  padding: '28px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-muted)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{
                  width: 44, height: 44,
                  borderRadius: 'var(--radius)',
                  background: 'rgba(184,104,64,0.1)',
                  border: '1px solid var(--accent-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                  color: 'var(--accent)',
                }}>
                  <feature.Icon size={22} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '10px', color: 'var(--fg)' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65, margin: 0 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{
        padding: '104px 0',
        background: 'var(--bg)',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(184,104,64,0.08) 0%, transparent 70%)',
        }} />
        <div className="container" style={{ maxWidth: '760px', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '20px', lineHeight: 1.15, color: 'var(--fg)' }}>
            Start building with AI today
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '44px', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 44px' }}>
            Instant access to {totalModelCount}+ AI models. No credit card, no setup fees, no surprises.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isClerkConfigured ? (
              <>
                <SignedIn>
                  <a href="/dashboard" className="button" style={{ padding: '13px 36px', fontSize: '1rem', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    Go to Dashboard <IconArrowRight size={15} />
                  </a>
                </SignedIn>
                <SignedOut>
                  <SignUpButton>
                    <button className="button" style={{ padding: '13px 36px', fontSize: '1rem', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      Sign Up Free <IconArrowRight size={15} />
                    </button>
                  </SignUpButton>
                </SignedOut>
              </>
            ) : (
              <a href="/dashboard" className="button" style={{ padding: '13px 36px', fontSize: '1rem', fontWeight: 650, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Sign Up Free <IconArrowRight size={15} />
              </a>
            )}
            <a href="/docs" className="button secondary" style={{ padding: '13px 32px', fontSize: '1rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <IconBook size={15} /> API Docs
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', paddingTop: '56px', paddingBottom: '56px', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          {/* Provider row */}
          <div style={{ marginBottom: '48px', paddingBottom: '48px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
              Powered by leading AI providers
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {providers.map((provider) => {
                const entry = PROVIDER_GLYPHS[provider.name];
                return (
                  <a key={provider.name} href="/providers" style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 16px', borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)', background: 'var(--bg-card)',
                    textDecoration: 'none', transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-muted)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                  >
                    {entry && <entry.Glyph size={16} />}
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.86rem' }}>{provider.name}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px', marginBottom: '40px' }}>
            <div>
              <div style={{ marginBottom: '14px' }}>
                <Wordmark variant="full" size="sm" />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75 }}>
                Free AI API gateway for developers. Access {totalModelCount}+ cutting-edge models from {providers.length} providers with one key.
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--fg)', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '1px' }}>
                Product
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  { href: '/models', icon: IconBook, label: 'Explore Models' },
                  { href: '/providers', icon: IconProviders, label: 'Providers' },
                  { href: '/docs', icon: IconDocs, label: 'Documentation' },
                ].map(({ href, icon: Icon, label }) => (
                  <li key={href} style={{ marginBottom: '12px' }}>
                    <a href={href} style={navLinkStyle} onMouseEnter={onHover} onMouseLeave={onLeave}>
                      <Icon size={13} /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--fg)', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '1px' }}>
                Community
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {[
                  { href: 'https://github.com/CloudCompile/cloudgpt', icon: IconStar, label: 'Star on GitHub', external: true },
                  { href: 'https://github.com/CloudCompile/cloudgpt/issues', icon: IconBug, label: 'Report Issues', external: true },
                  { href: 'https://github.com/CloudCompile/cloudgpt', icon: IconGitHub, label: 'GitHub', external: true },
                ].map(({ href, icon: Icon, label, external }) => (
                  <li key={href} style={{ marginBottom: '12px' }}>
                    <a href={href} style={navLinkStyle} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} onMouseEnter={onHover} onMouseLeave={onLeave}>
                      <Icon size={13} /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.86rem' }}>
            <p>© 2026 OpenRelay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
