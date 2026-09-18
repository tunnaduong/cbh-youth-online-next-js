"use client";

import { useMemo, useRef, useState } from "react";

const W = 600;
const H = 180;
const PAD = { top: 12, right: 12, bottom: 24, left: 32 };

const fmtDay = (d) => {
  const [, m, day] = d.split("-");
  return `${Number(day)}/${Number(m)}`;
};

/**
 * Single-series area chart with a crosshair + tooltip.
 * data: [{ date: "YYYY-MM-DD", value: number }]
 */
export default function TrendChart({ data, color = "#319527", label }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const { points, ticks, max } = useMemo(() => {
    const maxVal = Math.max(1, ...data.map((d) => d.value));
    // Round the axis max up to a "nice" number.
    const mag = 10 ** Math.floor(Math.log10(maxVal));
    const niceMax = Math.ceil(maxVal / mag) * mag;
    const iw = W - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const step = data.length > 1 ? iw / (data.length - 1) : 0;
    return {
      max: niceMax,
      points: data.map((d, i) => ({
        ...d,
        x: PAD.left + i * step,
        y: PAD.top + ih - (d.value / niceMax) * ih,
      })),
      ticks: [0, niceMax / 2, niceMax].map((v) => ({ v, y: PAD.top + ih - (v / niceMax) * ih })),
    };
  }, [data]);

  if (!points.length) return null;

  const line = points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const baseY = H - PAD.bottom;
  const area = `${line} L${points[points.length - 1].x},${baseY} L${points[0].x},${baseY} Z`;
  const gradId = `grad-${label}`.replace(/\s/g, "");

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = points[0];
    for (const p of points) if (Math.abs(p.x - x) < Math.abs(nearest.x - x)) nearest = p;
    setHover(nearest);
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={`${label}: ${data.map((d) => `${fmtDay(d.date)} ${d.value}`).join(", ")}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t.v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="#eef0ee" />
            <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
              {Number.isInteger(t.v) ? t.v : t.v.toFixed(1)}
            </text>
          </g>
        ))}

        {points.map((p, i) =>
          i % 2 === 0 || i === points.length - 1 ? (
            <text key={p.date} x={p.x} y={H - 6} textAnchor="middle" fontSize="11" fill="#9ca3af">
              {fmtDay(p.date)}
            </text>
          ) : null
        )}

        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={PAD.top} y2={baseY} stroke="#d1d5db" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={hover.y} r="5" fill={color} stroke="#fff" strokeWidth="2" />
          </g>
        )}
        {/* full-height hit area */}
        <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={baseY - PAD.top} fill="transparent" />
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg whitespace-nowrap"
          style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%`, marginTop: -10 }}
        >
          <div className="text-gray-300">{fmtDay(hover.date)}</div>
          <div className="font-semibold">
            {hover.value} {label}
          </div>
        </div>
      )}
      <span className="sr-only">Giá trị lớn nhất trục: {max}</span>
    </div>
  );
}
