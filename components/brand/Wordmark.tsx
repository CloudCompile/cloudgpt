// OpenRelay wordmark + lockups.
// "Open" in fg, "Relay" in the brand gradient. Geist 700, tight tracking.

import RelayLogo from './RelayLogo';

type WordmarkProps = {
  /** Layout variant. */
  variant?: 'full' | 'wordmark' | 'stacked' | 'tagline';
  /** Size token — sm for headers, md default, lg for hero. */
  size?: 'sm' | 'md' | 'lg';
  /** Monochrome lockup (single color, inherits via currentColor). */
  mono?: boolean;
  /** Override the "Open" text color. */
  color?: string;
};

const SCALES: Record<'sm' | 'md' | 'lg', number> = { sm: 0.7, md: 1, lg: 1.5 };

export default function Wordmark({
  variant = 'full',
  size = 'md',
  mono = false,
  color,
}: WordmarkProps) {
  const scale = SCALES[size];
  const fontSize = 28 * scale;
  const logoSize = 36 * scale;
  const tagSize = 11 * scale;

  const textStyle: React.CSSProperties = {
    fontFamily:
      'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    fontWeight: 700,
    fontSize: `${fontSize}px`,
    letterSpacing: '-0.025em',
    color: color || (mono ? 'currentColor' : 'var(--fg, #f0eeff)'),
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'baseline',
  };

  const accentStyle: React.CSSProperties = mono
    ? { color: 'currentColor' }
    : {
        // Falls back to a hard-coded gradient if the CSS var isn't loaded.
        background:
          'var(--accent-gradient, linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      };

  const Text = () => (
    <span style={textStyle}>
      <span style={{ opacity: 0.95 }}>Open</span>
      <span style={accentStyle}>Relay</span>
    </span>
  );

  if (variant === 'wordmark') return <Text />;

  if (variant === 'stacked') {
    return (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10 * scale,
        }}
      >
        <RelayLogo size={logoSize * 1.4} mono={mono} />
        <Text />
      </div>
    );
  }

  if (variant === 'tagline') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 * scale }}>
        <RelayLogo size={logoSize * 1.2} mono={mono} />
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 * scale }}>
          <Text />
          <span
            style={{
              fontSize: `${tagSize}px`,
              color: 'var(--text-tertiary, #5a4f80)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 500,
              fontFamily: '"Geist Mono", Monaco, Menlo, "Courier New", monospace',
            }}
          >
            Free AI API Gateway
          </span>
        </div>
      </div>
    );
  }

  // full — horizontal mark + wordmark
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 * scale }}>
      <RelayLogo size={logoSize} mono={mono} />
      <Text />
    </div>
  );
}
