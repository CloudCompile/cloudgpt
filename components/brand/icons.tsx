// OpenRelay icon set.
// Monoline, 24x24 viewBox, currentColor, stroke 1.75, round caps + joins.
// Drop-in replacements for the emoji used in app/page.tsx etc.
//
// Usage:
//   import { IconBolt, IconBadge } from '@/components/icons';
//   <IconBolt size={20} />
//   <IconBadge icon={IconBolt} accent="violet" />

import type { SVGProps, ComponentType } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({
  size = 24,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

// ---------- FEATURE ICONS (replace the emoji on the marketing site) ----------

export const IconBolt = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M13.5 2.5 L4.5 13 H10 L9.5 21.5 L20 11 H14 Z" />
  </IconBase>
);

export const IconFallback = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3.5 12 a8.5 8.5 0 0 1 14.5 -6" />
    <path d="M14 3.5 L18 6 L17 10.5" />
    <path d="M20.5 12 a8.5 8.5 0 0 1 -14.5 6" />
    <path d="M10 20.5 L6 18 L7 13.5" />
  </IconBase>
);

export const IconLock = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
    <path d="M7.5 10.5 V7 a4.5 4.5 0 0 1 9 0 V10.5" />
    <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    <path d="M12 16.6 V18" />
  </IconBase>
);

export const IconPalette = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 3 C7 3 3 7 3 12 c0 5 4 9 9 9 c1.4 0 2 -1.1 1.4 -2.4 c-0.6 -1.4 0.1 -2.6 1.6 -2.6 H17 a4 4 0 0 0 4 -4 C21 7.5 17 3 12 3 Z" />
    <circle cx="7.5" cy="11.5" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="11" cy="7.5" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="8" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="12.5" r="1.05" fill="currentColor" stroke="none" />
  </IconBase>
);

export const IconSparkle = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5 L13.2 10.8 L16.5 12 L13.2 13.2 L12 16.5 L10.8 13.2 L7.5 12 L10.8 10.8 Z" />
  </IconBase>
);

export const IconPlug = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M9 2.5 V6" />
    <path d="M15 2.5 V6" />
    <path d="M6.5 6 H17.5 V10.5 a5.5 5.5 0 0 1 -11 0 Z" />
    <path d="M12 16 V21.5" />
  </IconBase>
);

// ---------- NAV ICONS ----------

export const IconModels = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 3 L20.5 7.5 L12 12 L3.5 7.5 Z" />
    <path d="M3.5 12 L12 16.5 L20.5 12" />
    <path d="M3.5 16.5 L12 21 L20.5 16.5" />
  </IconBase>
);

export const IconProviders = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="2.5" />
    <circle cx="4" cy="5.5" r="1.8" />
    <circle cx="20" cy="5.5" r="1.8" />
    <circle cx="4" cy="18.5" r="1.8" />
    <circle cx="20" cy="18.5" r="1.8" />
    <path d="M5.5 6.5 L10 10.5" />
    <path d="M18.5 6.5 L14 10.5" />
    <path d="M5.5 17.5 L10 13.5" />
    <path d="M18.5 17.5 L14 13.5" />
  </IconBase>
);

export const IconDocs = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M5 3.5 H14.5 L19 8 V20.5 H5 Z" />
    <path d="M14 3.5 V8 H19" />
    <path d="M8 12 H15" />
    <path d="M8 15.5 H15" />
    <path d="M8 18.5 H12" />
  </IconBase>
);

export const IconDashboard = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
  </IconBase>
);

export const IconKey = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="8" cy="12" r="4.5" />
    <path d="M12.5 12 H21" />
    <path d="M18 12 V15" />
    <path d="M15 12 V14" />
    <circle cx="8" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </IconBase>
);

export const IconPlayground = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M3.5 5 a2 2 0 0 1 2 -2 H18.5 a2 2 0 0 1 2 2 V15 a2 2 0 0 1 -2 2 H12 L7.5 20.5 V17 H5.5 a2 2 0 0 1 -2 -2 Z" />
    <path d="M10 8 L14 10.5 L10 13 Z" fill="currentColor" />
  </IconBase>
);

export const IconTerminal = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M7 9.5 L10 12 L7 14.5" />
    <path d="M12 15 H16.5" />
  </IconBase>
);

// ---------- STATUS / UTILITY ICONS ----------

export const IconStar = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 3 L14.6 9 L21 9.7 L16.2 14 L17.7 20.5 L12 17.2 L6.3 20.5 L7.8 14 L3 9.7 L9.4 9 Z" />
  </IconBase>
);

export const IconBug = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="7" y="7" width="10" height="12" rx="5" />
    <path d="M8.5 8 L6.5 5.5" />
    <path d="M15.5 8 L17.5 5.5" />
    <path d="M3.5 11 H7" />
    <path d="M17 11 H20.5" />
    <path d="M3.5 15 H6.5" />
    <path d="M17.5 15 H20.5" />
    <path d="M3.5 19 H6.5" />
    <path d="M17.5 19 H20.5" />
  </IconBase>
);

export const IconCheck = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M7.5 12.5 L10.5 15.5 L16.5 9" />
  </IconBase>
);

export const IconError = (p: IconProps) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 8.5 L15.5 15.5" />
    <path d="M15.5 8.5 L8.5 15.5" />
  </IconBase>
);

export const IconWarn = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 3.5 L21 19.5 H3 Z" />
    <path d="M12 10 V14" />
    <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
  </IconBase>
);

export const IconGitHub = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M12 3 a9 9 0 0 0 -2.8 17.55 c0.45 0.08 0.6 -0.2 0.6 -0.43 v-1.5 c-2.5 0.54 -3 -1.2 -3 -1.2 c -0.4 -1 -1 -1.3 -1 -1.3 c -0.8 -0.55 0.06 -0.54 0.06 -0.54 c 0.9 0.06 1.4 0.92 1.4 0.92 c 0.8 1.37 2.1 0.97 2.6 0.74 c 0.08 -0.58 0.3 -0.97 0.6 -1.2 c -2 -0.23 -4.1 -1 -4.1 -4.45 c 0 -1 0.35 -1.8 0.92 -2.45 c -0.1 -0.23 -0.4 -1.13 0.08 -2.35 c 0 0 0.75 -0.24 2.45 0.93 a 8.4 8.4 0 0 1 4.5 0 c 1.7 -1.17 2.45 -0.93 2.45 -0.93 c 0.5 1.22 0.18 2.12 0.08 2.35 c 0.58 0.65 0.92 1.45 0.92 2.45 c 0 3.46 -2.1 4.22 -4.1 4.45 c 0.32 0.28 0.6 0.83 0.6 1.7 v 2.5 c 0 0.24 0.15 0.52 0.6 0.43 A 9 9 0 0 0 12 3 Z" />
  </IconBase>
);

export const IconArrowRight = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 12 H20" />
    <path d="M14 6 L20 12 L14 18" />
  </IconBase>
);

export const IconCopy = (p: IconProps) => (
  <IconBase {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8 V5 a1.5 1.5 0 0 0 -1.5 -1.5 H5.5 A1.5 1.5 0 0 0 4 5 V14.5 A1.5 1.5 0 0 0 5.5 16 H8" />
  </IconBase>
);

export const IconBook = (p: IconProps) => (
  <IconBase {...p}>
    <path d="M4 4.5 H10 a2 2 0 0 1 2 2 V20 a2 2 0 0 0 -2 -2 H4 Z" />
    <path d="M20 4.5 H14 a2 2 0 0 0 -2 2 V20 a2 2 0 0 1 2 -2 H20 Z" />
  </IconBase>
);

// ---------- ICON BADGE — gradient tile wrapper for feature cards ----------

type Accent = 'violet' | 'indigo' | 'blue';

const PALETTES: Record<Accent, { bg: string; border: string; fg: string; glow: string }> = {
  violet: { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.35)', fg: '#a78bfa', glow: 'rgba(124,58,237,0.25)' },
  indigo: { bg: 'rgba(79,70,229,0.12)', border: 'rgba(79,70,229,0.35)', fg: '#818cf8', glow: 'rgba(79,70,229,0.25)' },
  blue:   { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', fg: '#60a5fa', glow: 'rgba(59,130,246,0.25)' },
};

export function IconBadge({
  icon: Icon,
  size = 56,
  accent = 'violet',
}: {
  icon: ComponentType<IconProps>;
  size?: number;
  accent?: Accent;
}) {
  const p = PALETTES[accent];
  return (
    <div
      style={{
        width: size,
        height: size,
        background: p.bg,
        border: `1px solid ${p.border}`,
        // OpenRelay's signature asymmetric radius — keep this consistent.
        borderRadius: '18px 12px 16px 14px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: p.fg,
        boxShadow: `0 4px 18px ${p.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <Icon size={Math.round(size * 0.5)} />
    </div>
  );
}
