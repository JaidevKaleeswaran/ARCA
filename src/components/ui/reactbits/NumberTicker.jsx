import { useEffect, useRef, useState } from 'react';

/**
 * NumberTicker
 * Smoothly animates numbers from previous to target value using requestAnimationFrame.
 */
export default function NumberTicker({
  value = 0,
  prefix = '',
  suffix = '',
  decimalPlaces = 2,
  duration = 750,
  className = '',
}) {
  const numValue = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(numValue);
  const currentDisplayRef = useRef(numValue);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = isNaN(Number(value)) ? 0 : Number(value);
    const start = currentDisplayRef.current;
    startTimeRef.current = null;

    // Check if user prefers reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      currentDisplayRef.current = target;
      rafRef.current = requestAnimationFrame(() => setDisplayValue(target));
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Smooth ease-out cubic curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * easeOut;

      currentDisplayRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        currentDisplayRef.current = target;
        setDisplayValue(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const isNegative = displayValue < 0;
  const absDisplayValue = Math.abs(displayValue);
  const formatted = absDisplayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return (
    <span className={`tabular-nums ${className}`}>
      {isNegative ? '-' : ''}{prefix}{formatted}{suffix}
    </span>
  );
}
