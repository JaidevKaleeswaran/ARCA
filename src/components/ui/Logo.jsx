import React from 'react';

/**
 * Official ARCA brand mark — 3 stacked yellow-gold bars + wordmark.
 */
export default function Logo({ size = 'md', className = '' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const markHeight = isSm ? 'h-5' : isLg ? 'h-8' : 'h-6';
  const titleText = isSm ? 'text-[15px]' : isLg ? 'text-2xl' : 'text-base';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        viewBox="0 0 36 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${markHeight} w-auto shrink-0`}
        aria-hidden="true"
      >
        <rect x="0" y="2" width="36" height="10" rx="3" fill="#8c6d37" />
        <rect x="0" y="17" width="36" height="10" rx="3" fill="#cfa143" />
        <rect x="0" y="32" width="36" height="10" rx="3" fill="#e7b956" />
      </svg>

      <span className={`font-semibold text-zinc-100 tracking-tight ${titleText}`}>
        ARCA
      </span>
    </div>
  );
}
