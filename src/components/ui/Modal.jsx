import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col rounded-lg border border-white/[0.1] bg-[#111110] animate-step-enter">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
