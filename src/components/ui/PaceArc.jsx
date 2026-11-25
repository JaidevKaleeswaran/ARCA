import React from 'react';

/**
 * PaceArc — minimal precision semicircular instrument gauge showing spent % vs cycle pace tick.
 * Breaks up rectangular box monotony with a restrained hardware-inspired curve.
 */
export default function PaceArc({
  spentPct = 0,
  pacePct = 50,
  isOver = false,
  size = 64,
}) {
  const clampedSpent = Math.min(100, Math.max(0, spentPct));
  const clampedPace = Math.min(100, Math.max(0, pacePct));

  const strokeWidth = 3;
  const r = 26;
  const cx = 32;
  const cy = 32;
  const arcLen = Math.PI * r; // Semicircle circumference
  const dashOffset = arcLen * (1 - clampedSpent / 100);

  // Pace tick angle on top semicircle: 180deg (left) -> 0deg (right)
  const angleRad = Math.PI * (1 - clampedPace / 100);
  const innerR = r - 4.5;
  const outerR = r + 4.5;
  const x1 = cx + innerR * Math.cos(angleRad);
  const y1 = cy - innerR * Math.sin(angleRad);
  const x2 = cx + outerR * Math.cos(angleRad);
  const y2 = cy - outerR * Math.sin(angleRad);

  const strokeColor = isOver
    ? '#f43f5e'
    : clampedSpent >= 85
    ? '#e7b956'
    : '#e4e4e7';

  return (
    <svg
      width={size}
      height={Math.round(size * 0.6)}
      viewBox="0 0 64 38"
      fill="none"
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      {/* Background semicircular track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Active spent arc */}
      {clampedSpent > 0 && (
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 320ms ease-out, stroke 200ms ease' }}
        />
      )}
      {/* 1px Cycle Pace Notch */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#e7b956"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Center percentage readout */}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        className="fill-zinc-400 text-[9px] font-medium tabular-nums"
      >
        {Math.round(spentPct)}%
      </text>
    </svg>
  );
}
