export const AVATAR_PRESETS = [
  {
    id: 'gold-monolith',
    label: 'ARCA Gold',
    render: () => (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <rect width="64" height="64" fill="#131311" />
        <rect x="16" y="18" width="32" height="6" rx="2" fill="#E7B956" />
        <rect x="16" y="29" width="24" height="6" rx="2" fill="#E7B956" fillOpacity="0.72" />
        <rect x="16" y="40" width="16" height="6" rx="2" fill="#E7B956" fillOpacity="0.44" />
      </svg>
    ),
  },
  {
    id: 'gold-ring',
    label: 'Ledger Ring',
    render: () => (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <rect width="64" height="64" fill="#121210" />
        <circle cx="32" cy="32" r="20" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
        <path
          d="M 32 12 A 20 20 0 1 1 14.7 42"
          fill="none"
          stroke="#E7B956"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="32" r="5" fill="#E7B956" />
      </svg>
    ),
  },
  {
    id: 'emerald-prism',
    label: 'Emerald',
    render: () => (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <rect width="64" height="64" fill="#0F1412" />
        <polygon points="32,12 50,32 32,52 14,32" fill="none" stroke="#34D399" strokeWidth="2.5" />
        <polygon points="32,20 42,32 32,44 22,32" fill="#34D399" fillOpacity="0.28" />
        <circle cx="32" cy="32" r="3.5" fill="#34D399" />
      </svg>
    ),
  },
  {
    id: 'amber-horizon',
    label: 'Pace Arc',
    render: () => (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <rect width="64" height="64" fill="#141310" />
        <path
          d="M 14 42 A 18 18 0 0 1 50 42"
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 14 42 A 18 18 0 0 1 44 28"
          fill="none"
          stroke="#E7B956"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line x1="12" y1="48" x2="52" y2="48" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'slate-grid',
    label: 'Obsidian',
    render: () => (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <rect width="64" height="64" fill="#141416" />
        <polygon points="32,13 49,23 49,41 32,51 15,41 15,23" fill="none" stroke="#A1A1AA" strokeWidth="2" />
        <line x1="32" y1="13" x2="32" y2="51" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
        <line x1="15" y1="23" x2="49" y2="41" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="4" fill="#E7B956" />
      </svg>
    ),
  },
  {
    id: 'rose-facet',
    label: 'Crimson',
    render: () => (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <rect width="64" height="64" fill="#161113" />
        <rect x="17" y="17" width="30" height="30" rx="6" fill="none" stroke="#FB7185" strokeWidth="2.2" />
        <path d="M 17 36 L 28 27 L 36 33 L 47 22" fill="none" stroke="#FB7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="47" cy="22" r="3" fill="#ffffff" />
      </svg>
    ),
  },
];

const SIZE_CLASSES = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-6 w-6 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

/**
 * Center-crop & compress an uploaded image File into a crisp 192x192 JPEG data URL
 * small enough to persist cleanly in localStorage & Firestore user preferences.
 */
export function compressImageToAvatarDataUrl(file, size = 192, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Please select an image file (PNG, JPG, WebP, or GIF).'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Image is too large. Please choose a file under 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('The selected file could not be decoded as an image.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable.'));
            return;
          }

          // Center square crop
          const minSide = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
          const sx = ((img.naturalWidth || img.width) - minSide) / 2;
          const sy = ((img.naturalHeight || img.height) - minSide) / 2;

          ctx.fillStyle = '#090908';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function UserAvatar({
  photoURL,
  avatarPreset,
  displayName,
  email,
  size = 'xs',
  className = '',
}) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.xs;
  const preset = avatarPreset ? AVATAR_PRESETS.find((p) => p.id === avatarPreset) : null;
  const initial = (displayName || email || 'U').trim().charAt(0).toUpperCase() || 'U';

  if (preset) {
    return (
      <div
        className={`relative overflow-hidden rounded-full border border-white/[0.14] shrink-0 ${sizeClass} ${className}`}
        aria-label={displayName || 'Profile avatar'}
      >
        {preset.render()}
      </div>
    );
  }

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={displayName || 'Profile avatar'}
        className={`rounded-full object-cover border border-white/[0.12] shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.08] font-semibold text-zinc-200 ${sizeClass} ${className}`}
    >
      {initial}
    </div>
  );
}
