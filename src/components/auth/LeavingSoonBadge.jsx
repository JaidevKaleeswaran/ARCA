import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

/**
 * Antigravity-style "Leaving Soon (i)" pill badge with hover/focus/tap tooltip
 * informing users that Guest sign-in will be retired after the beta period.
 */
export default function LeavingSoonBadge({
  message = 'Guest sign-in is only available during the beta period. Once beta ends, signing in as a guest will no longer be an option — create an account to keep your data.',
  placement = 'top',
}) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);

  const open = hovered || pinned || focused;

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPinned(false);
        setHovered(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label="Guest mode leaving soon notice"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setPinned((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            e.preventDefault();
            setPinned((prev) => !prev);
          } else if (e.key === 'Escape') {
            setPinned(false);
            setHovered(false);
            setFocused(false);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="inline-flex items-center gap-1 rounded-full bg-white/[0.09] px-2 py-0.5 text-[10px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.15] hover:text-zinc-100 cursor-help"
      >
        <span>Leaving Soon</span>
        <Info className="h-3 w-3 text-zinc-400 shrink-0" strokeWidth={1.75} />
      </span>

      {open && (
        <span
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 z-50 w-64 rounded-xl border border-white/[0.16] bg-[#181816] px-3.5 py-2.5 text-left text-xs font-normal leading-relaxed text-zinc-100 shadow-[0_12px_32px_rgba(0,0,0,0.85)] pointer-events-auto ${
            placement === 'bottom' ? 'top-full mt-2.5' : 'bottom-full mb-2.5'
          }`}
        >
          {message}
        </span>
      )}
    </span>
  );
}
