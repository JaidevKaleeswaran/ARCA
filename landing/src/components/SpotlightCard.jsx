import { useRef, useState } from 'react';

/**
 * SpotlightCard
 * Interactive card component with 60fps radial cursor-following illumination glow.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(231, 185, 86, 0.12)',
  ...props
}) {
  const divRef = useRef(null);
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty('--spotlight-x', `${x}px`);
    divRef.current.style.setProperty('--spotlight-y', `${y}px`);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => setOpacity(1)}
      onBlur={() => setOpacity(0)}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative rounded-2xl border border-border bg-card overflow-hidden ${className}`}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at var(--spotlight-x) var(--spotlight-y), ${spotlightColor}, transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}
