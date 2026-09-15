import React, { useId } from 'react';

/**
 * Compact time-series trace. Domain is derived from the series unless
 * min/max are supplied, so flat channels still render mid-band rather
 * than collapsing onto the baseline.
 */
export default function Sparkline({
  data = [],
  width = 120,
  height = 30,
  color = '#7aa2c4',
  fill = true,
  strokeWidth = 1.4,
  min,
  max,
}) {
  if (data.length < 2) {
    return <div style={{ width, height }} className="flex items-center">
      <div className="w-full border-t border-dashed border-white/[0.09]" />
    </div>;
  }

  const lo = min !== undefined ? min : Math.min(...data);
  const hi = max !== undefined ? max : Math.max(...data);
  const span = hi - lo || 1;
  const pad = 2;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - pad - ((v - lo) / span) * (height - pad * 2);
    return [x, y];
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = useId();

  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="1.9" fill={color} />
    </svg>
  );
}
