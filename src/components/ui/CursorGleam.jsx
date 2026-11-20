import { useEffect, useRef } from 'react';

/**
 * CursorGleam
 * High-performance global ambient cursor spotlight.
 * Follows the user's cursor across all pages, surfaces, and widgets at 60-144fps
 * with zero React re-renders on mouse movement.
 */
export default function CursorGleam({
  size = 650,
  className = '',
}) {
  const containerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only activate on devices with fine pointer control (mouse/trackpad)
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mediaQuery.matches) return;

    const container = containerRef.current;
    const circle = circleRef.current;
    if (!container || !circle) return;

    let rafId = null;
    let mouseX = -1000;
    let mouseY = -1000;
    const halfSize = size / 2;

    const render = () => {
      if (circle) {
        circle.style.transform = `translate3d(${mouseX - halfSize}px, ${mouseY - halfSize}px, 0)`;
      }
      rafId = null;
    };

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      container.style.opacity = '1';
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    };

    const onMouseLeave = () => {
      container.style.opacity = '0';
    };

    const onMouseEnter = () => {
      container.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-30 overflow-hidden transition-opacity duration-300 opacity-0 ${className}`}
    >
      <div
        ref={circleRef}
        className="pointer-events-none absolute will-change-transform rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          top: 0,
          left: 0,
          transform: 'translate3d(-1000px, -1000px, 0)',
          background:
            'radial-gradient(circle at center, rgba(231, 185, 86, 0.09) 0%, rgba(231, 185, 86, 0.04) 25%, rgba(231, 185, 86, 0.01) 45%, transparent 65%)',
        }}
      />
    </div>
  );
}
