import React from 'react';

/**
 * Boxer-engine mark: two opposed pistons flanking a crank circle.
 * Kept to three shape groups so it stays legible at 28-36px.
 */
export function BrandMark({ size = 34, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#131316" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="none" stroke="rgba(255,255,255,0.09)" />

      {/* opposed piston pair */}
      <rect x="3" y="12.8" width="7.2" height="6.4" rx="1.7" fill="#5b8db8" />
      <rect x="21.8" y="12.8" width="7.2" height="6.4" rx="1.7" fill="#5b8db8" />

      {/* connecting rods */}
      <path d="M10.4 16h2.2M19.4 16h2.2" stroke="#c2d6e6" strokeWidth="1.9" strokeLinecap="round" />

      {/* crank circle + journal */}
      <circle cx="16" cy="16" r="4.1" fill="none" stroke="#e8eaed" strokeWidth="1.9" />
      <circle cx="16" cy="12.9" r="1.25" fill="#d9a441" />
    </svg>
  );
}

export function BrandLockup() {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-none">
        <div className="font-cond font-bold text-[17px] tracking-[0.01em] text-zinc-50">
          AERO<span className="text-steel-400">TWIN</span>
        </div>
        <div className="font-mono text-2xs uppercase tracking-[0.16em] text-zinc-600 mt-[3px]">
          DRDO · ADE
        </div>
      </div>
    </div>
  );
}
