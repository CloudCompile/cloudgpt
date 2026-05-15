import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import Wordmark from '@/components/brand/Wordmark';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

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
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a href="/docs" className="nav-link">Docs</a>
          <a href="/providers" className="nav-link">Providers</a>
          <a href="/models" className="nav-link">Models</a>
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <UserButton />
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
      <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
        <head>
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        </head>
        <body>
          <Header />
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
        <head>
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        </head>
        <body>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
