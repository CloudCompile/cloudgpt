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
  title: 'CloudGPT - Unified AI API',
  description: 'A unified API gateway for AI chat, image, and video generation',
};

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function Header() {
  if (!isClerkConfigured) {
    return (
      <header style={{ 
        padding: '16px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #eee'
      }}>
        <a href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>
          ☁️ CloudGPT
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#666', fontSize: '0.875rem' }}>
            Configure Clerk to enable auth
          </span>
        </nav>
      </header>
    );
  }

  return (
    <header style={{ 
      padding: '16px 24px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderBottom: '1px solid #eee'
    }}>
      <a href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none', color: 'inherit' }}>
        ☁️ CloudGPT
      </a>
      <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <SignedOut>
          <SignInButton />
          <SignUpButton />
        </SignedOut>
        <SignedIn>
          <a href="/dashboard">Dashboard</a>
          <UserButton />
        </SignedIn>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If Clerk is not configured, render without ClerkProvider
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
