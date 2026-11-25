/**
 * Flat hairline surface wrapper (replaces radial cursor spotlight glow).
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor: _spotlightColor,
  ...props
}) {
  return (
    <div
      className={`relative rounded-lg border border-white/[0.08] bg-[#111110] overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
