import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollFade — smooth IntersectionObserver reveal as elements enter the viewport.
 */
export default function ScrollFade({
  children,
  delay = 0,
  y = 18,
  className = '',
  as: Tag = 'div',
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return true;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -24px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0, 0, 0)' : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 540ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 540ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: visible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}
