import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkAdmin } from '@/lib/admin';

const NAV_LINKS = [
  { href: '/admin',               label: 'Overview' },
  { href: '/admin/keys',          label: 'Provider Keys' },
  { href: '/admin/endpoints',     label: 'Endpoints' },
  { href: '/admin/virtual-models',label: 'Virtual Models' },
  { href: '/admin/users',         label: 'Users' },
  { href: '/admin/playground',    label: 'Playground' },
];

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
        borderBottom: '1px solid var(--border)',
        padding: '0',
        position: 'sticky',
        top: '0',
        zIndex: 40,
      }}>
        <div className="container" style={{ display: 'flex', gap: '0', alignItems: 'center', overflowX: 'auto' }}>
          <a
            href="/"
            style={{
              padding: '12px 16px 12px 0',
              fontSize: '0.78rem',
              fontWeight: '700',
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              borderRight: '1px solid var(--border)',
              marginRight: '8px',
              flexShrink: 0,
            }}
          >
            ← Site
          </a>
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                padding: '14px 18px',
                fontSize: '0.85rem',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                borderBottom: '2px solid transparent',
                display: 'inline-block',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={undefined}
            >
              {label}
            </a>
          ))}
          <span style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(124, 58, 237, 0.12)',
            color: 'var(--accent-light)',
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            flexShrink: 0,
          }}>
            Admin
          </span>
        </div>
      </nav>
      {children}
    </div>
  );
}
