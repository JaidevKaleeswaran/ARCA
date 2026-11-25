import React from 'react';

/**
 * ARCA architectural three-bar brand mark.
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
      <rect x="0" y="2" width="36" height="10" rx="3" fill="#18181B" />
      <rect x="0" y="17" width="36" height="10" rx="3" fill="#52525B" />
      <rect x="0" y="32" width="36" height="10" rx="3" fill="#B8892D" />
    </svg>
  );
}
