import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkAdmin } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect('/');
  }

  const { userId } = await auth();
  if (!userId) redirect('/');

  const isAdmin = await checkAdmin(userId);
  if (!isAdmin) redirect('/');

  return (
    <div>
      <nav style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0',
      }}>
        <div className="container" style={{ display: 'flex', gap: '0', alignItems: 'center' }}>
          {[
            { href: '/admin', label: 'Overview' },
            { href: '/admin/playground', label: 'Playground' },
            { href: '/admin/keys', label: 'Provider Keys' },
            { href: '/admin/users', label: 'Users' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                padding: '12px 20px',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                borderBottom: '2px solid transparent',
                display: 'inline-block',
                transition: 'color 0.2s ease',
              }}
            >
              {label}
            </a>
          ))}
          <span style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(124, 58, 237, 0.15)',
            color: 'var(--accent-light)',
            fontSize: '0.75rem',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            border: '1px solid rgba(124, 58, 237, 0.3)',
          }}>
            Admin
          </span>
        </div>
      </nav>
      {children}
    </div>
  );
}
