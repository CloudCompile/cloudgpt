'use client';

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function HeaderAuth() {
  return (
    <>
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
    </>
  );
}
