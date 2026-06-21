import React from 'react';

export default function HabitAreaChart({ data, color }) {
  const W = 580, H = 130;
  const PAD = { t: 16, r: 16, b: 28, l: 40 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const n  = data.length;

  if (n === 0) return null;

  const maxVal = Math.max(...data.map(d => d.val), 1);
  const pts = data.map((d, i) => ({
    x: PAD.l + (n > 1 ? (i / (n - 1)) * iw : iw / 2),
    y: PAD.t + ih - (d.val / maxVal) * ih,
    val: d.val,
    label: d.label,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${PAD.t + ih} L${pts[0].x.toFixed(1)},${PAD.t + ih} Z`;
  const gridVals  = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];
  const showEvery = n > 20 ? Math.ceil(n / 14) : 1;

  return (
    <div style={{ overflowX: 'auto', marginTop: 8 }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', minWidth: 280 }}>
        <defs>
          <linearGradient id="habGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {gridVals.map((g, i) => {
          const y = g === 0 ? PAD.t + ih : PAD.t + ih - (g / maxVal) * ih;
          return (
            <g key={i}>
              <line x1={PAD.l} y1={y} x2={PAD.l + iw} y2={y}
                stroke="rgba(180,180,180,0.18)" strokeWidth="1" />
              <text x={PAD.l - 5} y={y + 4} textAnchor="end"
                fontSize="9" fill="rgba(123,163,196,0.75)">{g}</text>
            </g>
          );
        })}

        <path d={areaD} fill="url(#habGrad)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y}
              r={p.val > 0 ? 4 : 3}
              fill={p.val > 0 ? color : 'rgba(180,180,180,0.5)'}
              stroke="white" strokeWidth="1.5" />
            {i % showEvery === 0 && (
              <text x={p.x} y={H - 4} textAnchor="middle"
                fontSize="9" fill="rgba(123,163,196,0.85)">{p.label}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
