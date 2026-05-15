// OpenRelay primary logo mark — "Relay Nodes"
// Three nodes connected by an arc: a signal hopping through relays.
// Drop into components/ and import where needed.

type RelayLogoProps = {
  size?: number;
  /** When true, renders monochrome (currentColor) instead of the brand gradient. */
  mono?: boolean;
  /** SVG id used internally for the gradient — must be unique per page if you render multiple. */
  id?: string;
  className?: string;
  /** Color used to "punch" the inner hole on the center node. Match your surface color. */
  centerPunch?: string;
};

export default function RelayLogo({
  size = 40,
  mono = false,
  id = 'or-logo',
  className,
  centerPunch = '#08070f',
}: RelayLogoProps) {
  const fill = mono ? 'currentColor' : `url(#${id}-grad)`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      role="img"
      aria-label="OpenRelay logo"
    >
      {!mono && (
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="55%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      )}
      {/* arc connecting the three nodes */}
      <path
        d="M 18 64 Q 18 30 48 30 Q 78 30 78 64"
        stroke={fill}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* outer relay nodes */}
      <circle cx="18" cy="64" r="9" fill={fill} />
      <circle cx="78" cy="64" r="9" fill={fill} />
      {/* center relay node (larger, offset up) */}
      <circle cx="48" cy="30" r="13" fill={fill} />
      {/* punch in center node — match the surface behind the logo */}
      <circle cx="48" cy="30" r="5" fill={mono ? 'transparent' : centerPunch} />
    </svg>
  );
}
