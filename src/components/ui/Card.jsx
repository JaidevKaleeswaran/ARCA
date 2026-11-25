import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-lg border border-white/[0.08] bg-[#111110] p-4 sm:p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
