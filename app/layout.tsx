import type { Metadata } from 'next';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import './globals.css';

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
          <a href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', textDecoration: 'none', color: '#fff' }}>
            OpenRelay
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
        <a href="/" style={{ fontSize: '1.3rem', fontWeight: '800', textDecoration: 'none', color: '#fff', letterSpacing: '-0.5px' }}>
          OpenRelay
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
      <html lang="en">
        <body>
          <Header />
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
