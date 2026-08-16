import React, { useState, useEffect } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  animate?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 160,
  animate = true,
}) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setActive(true), 50);
      return () => clearTimeout(t);
    }
  }, [animate]);

  const r = size * 0.36;
  const cx = size / 2;
  const cy = size / 2;
  const strokeW = r * 0.62;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;

  let cumulativeAngle = -90;
  const paths = segments.map((seg, i) => {
    const frac = seg.value / total;
    const sweep = frac * 360;
    const large = sweep > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos((cumulativeAngle * Math.PI) / 180);
    const y1 = cy + r * Math.sin((cumulativeAngle * Math.PI) / 180);
    const endAngle = cumulativeAngle + sweep;
    const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
    const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
    cumulativeAngle = endAngle;

    return (
      <path
        key={i}
        d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeW}
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          opacity: active ? 1 : 0,
          transform: active ? 'rotate(0deg) scale(1)' : 'rotate(-25deg) scale(0.88)',
          transition: `opacity 0.6s ease-out ${i * 0.08}s, transform 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${i * 0.08}s`,
        }}
      />
    );
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}>
      {paths}
    </svg>
  );
};
