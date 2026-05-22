import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Wordmark from '@/components/brand/Wordmark';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '600', '700'], subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'OpenRelay - Free AI API',
  description: 'Free AI gateway for everyone. Simple, fast, open.',
};

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function Header() {
  if (!isClerkConfigured) {
    return (
      <header className="header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }} aria-label="OpenRelay home">
            <Wordmark variant="full" size="sm" />
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#999', fontSize: '0.875rem' }}>
              Configure Clerk to enable auth
            </span>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ textDecoration: 'none' }} aria-label="OpenRelay home">
          <Wordmark variant="full" size="sm" />
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <a href="/docs" className="nav-link">Docs</a>
          <a href="/providers" className="nav-link">Providers</a>
          <a href="/models" className="nav-link">Models</a>
          <SignedOut>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
              <SignInButton />
              <SignUpButton />
            </div>
          </SignedOut>
          <SignedIn>
            <a href="/donate" className="nav-link">Contribute</a>
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <div style={{ marginLeft: '4px' }}><UserButton /></div>
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isClerkConfigured) {
    return (
      <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
        <head>
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        </head>
        <body>
          <Header />
          {children}
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
        <head>
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        </head>
        <body>
          <Header />
          {children}
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
