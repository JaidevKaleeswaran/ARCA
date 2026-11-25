import React from 'react';

/**
 * ARCA three-bar architectural mark (obsidian & yellow-gold).
 */
export default function BrandMark({ className = 'h-5 w-auto shrink-0' }) {
  return (
    <svg
      viewBox="0 0 36 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect x="0" y="2" width="36" height="10" rx="3" fill="#8c6d37" />
      <rect x="0" y="17" width="36" height="10" rx="3" fill="#cfa143" />
      <rect x="0" y="32" width="36" height="10" rx="3" fill="#e7b956" />
    </svg>
  );
}
