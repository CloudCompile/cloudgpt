// OpenRelay provider tile glyphs.
// One stylized mark per provider, all monoline, 32x32 viewBox.
//
// NOTE: These are NOT the providers' official logos — using those requires
// permission. These are abstract hints that hold together as a coherent set
// in the OpenRelay UI. If you later get permission to use a provider's
// official wordmark, swap that single glyph and the rest of the set still
// works.

import type { SVGProps, ComponentType } from 'react';

type GlyphProps = SVGProps<SVGSVGElement> & { size?: number };

function GlyphBase({
  size = 32,
  children,
  ...rest
}: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

// AIHubMix — concentric arcs converging on a hub
export const GlyphAIHubMix = (p: GlyphProps) => (
  <GlyphBase {...p}>
    <circle cx="16" cy="16" r="2.5" fill="currentColor" stroke="none" />
    <path d="M7 16 a9 9 0 0 1 18 0" />
    <path d="M10.5 16 a5.5 5.5 0 0 1 11 0" />
    <circle cx="7" cy="16" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="25" cy="16" r="1.4" fill="currentColor" stroke="none" />
  </GlyphBase>
);

// Pollinations — petal / spore burst
export const GlyphPollinations = (p: GlyphProps) => (
  <GlyphBase {...p}>
    <circle cx="16" cy="16" r="2.3" fill="currentColor" stroke="none" />
    {[0, 60, 120, 180, 240, 300].map((a, i) => (
      <ellipse
        key={i}
        cx="16"
        cy="9"
        rx="2.2"
        ry="4"
        transform={`rotate(${a} 16 16)`}
      />
    ))}
  </GlyphBase>
);

// VoidAI — empty circle with crosshair
export const GlyphVoidAI = (p: GlyphProps) => (
  <GlyphBase {...p}>
    <circle cx="16" cy="16" r="9" />
    <path d="M16 6.5 V11" />
    <path d="M16 21 V25.5" />
    <path d="M6.5 16 H11" />
    <path d="M21 16 H25.5" />
    <circle cx="16" cy="16" r="1.4" fill="currentColor" stroke="none" />
  </GlyphBase>
);

// Airforce — winged chevron / aviation roundel
export const GlyphAirforce = (p: GlyphProps) => (
  <GlyphBase {...p}>
    <circle cx="16" cy="16" r="9" />
    <path d="M9 18 L16 11 L23 18" />
    <path d="M12 21 L16 17 L20 21" />
  </GlyphBase>
);

// Cerebras — silicon grid
export const GlyphCerebras = (p: GlyphProps) => (
  <GlyphBase {...p}>
    <rect x="7" y="7" width="18" height="18" rx="5" />
    <path d="M11.5 7 V25" />
    <path d="M16 7 V25" />
    <path d="M20.5 7 V25" />
    <path d="M7 11.5 H25" />
    <path d="M7 20.5 H25" />
  </GlyphBase>
);

// Groq — lightning / speed
export const GlyphGroq = (p: GlyphProps) => (
  <GlyphBase {...p}>
    <circle cx="16" cy="16" r="9" />
    <path
      d="M17 9 L11.5 17 H15.5 L15 23 L20.5 15 H16.5 Z"
      fill="currentColor"
      stroke="currentColor"
    />
  </GlyphBase>
);

// AI Horde — three figures, community / swarm
export const GlyphAIHorde = (p: GlyphProps) => (
  <GlyphBase {...p}>
    <circle cx="16" cy="9" r="2.5" />
    <path d="M11 17 a5 5 0 0 1 10 0" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="23" cy="12" r="2" />
    <path d="M5 19 a4 4 0 0 1 5 -1" />
    <path d="M27 19 a4 4 0 0 0 -5 -1" />
    <path d="M9 22 H23" />
  </GlyphBase>
);

// Lookup keyed by the provider name as used in app/page.tsx + app/providers/page.tsx
export const PROVIDER_GLYPHS: Record<
  string,
  { Glyph: ComponentType<GlyphProps>; color: string }
> = {
  AIHubMix:       { Glyph: GlyphAIHubMix,     color: '#6366f1' },
  Pollinations:   { Glyph: GlyphPollinations, color: '#a855f7' },
  VoidAI:         { Glyph: GlyphVoidAI,       color: '#06b6d4' },
  Airforce:       { Glyph: GlyphAirforce,     color: '#f59e0b' },
  Cerebras:       { Glyph: GlyphCerebras,     color: '#8b5cf6' },
  Groq:           { Glyph: GlyphGroq,         color: '#00d084' },
  'AI Horde':     { Glyph: GlyphAIHorde,      color: '#ec4899' },
};
