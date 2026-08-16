import React, { useState, useEffect } from 'react';

export interface ColumnChartProps {
  labels: string[];
  values: (number | null)[];
  lineValues?: (number | null)[];
  barColor?: string;
  lineColor?: string;
  valueFmt?: (v: number) => string;
  height?: number;
  animate?: boolean;
}

export const ColumnChart: React.FC<ColumnChartProps> = ({
  labels,
  values,
  lineValues,
  barColor = '#2B73E0',
  lineColor = '#F59E0B',
  valueFmt,
  height = 220,
  animate = true,
}) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setActive(true), 50);
      return () => clearTimeout(t);
    }
  }, [animate]);

  const w = 760;
  const h = height;
  const padL = 44;
  const padB = 26;
  const padT = 10;
  const padR = 10;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const allVals = [...values, ...(lineValues || [])].filter((v): v is number => v != null);
  const maxV = Math.max(...allVals, 1) * 1.15;
  const n = labels.length;
  const colW = plotW / n;
  const barW = colW * 0.55;
  const fmt = valueFmt || ((v: number) => Math.round(v).toString());

  const gridFractions = [0, 0.25, 0.5, 0.75, 1];

  let linePoints: [number, number][] = [];
  if (lineValues) {
    linePoints = lineValues
      .map((v, i): [number, number] | null => {
        if (v == null) return null;
        const x = padL + i * colW + colW / 2;
        const y = padT + (plotH - (v / maxV) * plotH);
        return [x, y];
      })
      .filter((p): p is [number, number] => p !== null);
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: `${h}px`, display: 'block' }}>
      {gridFractions.map((f, idx) => {
        const y = padT + plotH * (1 - f);
        return (
          <g key={idx}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
            <text
              x={padL - 8}
              y={y + 3}
              textAnchor="end"
              fontSize="9.5"
              fill="#64748B"
              fontFamily="monospace, sans-serif"
            >
              {fmt(maxV * f)}
            </text>
          </g>
        );
      })}

      <g
        style={{
          opacity: active ? 1 : 0,
          transform: active ? 'translateY(0px)' : 'translateY(12px)',
          transition: 'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {values.map((v, i) => {
          if (v == null) return null;
          const x = padL + i * colW + (colW - barW) / 2;
          const bh = (v / maxV) * plotH;
          const y = padT + (plotH - bh);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={bh}
              rx="2"
              fill={barColor}
            />
          );
        })}

        {linePoints.length > 1 && (
          <>
            <polyline
              points={linePoints.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeDasharray="5,4"
            />
            {linePoints.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill={lineColor} />
            ))}
          </>
        )}
      </g>

      {labels.map((l, i) => {
        const x = padL + i * colW + colW / 2;
        return (
          <text
            key={i}
            x={x}
            y={h - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#64748B"
            fontFamily="sans-serif"
          >
            {l}
          </text>
        );
      })}
    </svg>
  );
};
