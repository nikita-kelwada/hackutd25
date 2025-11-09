import React from "react";

type Props = {
  current: number;   // current volume
  max: number;       // max_volume
};

export default function LevelBar({ current, max }: Props) {
  const pct = Math.max(0, Math.min(100, (current / Math.max(1, max)) * 100));

  // thresholds: <30% red, 30–60% yellow, >60% green
  const color =
    pct < 30 ? "#ef4444" : pct < 60 ? "#f59e0b" : "#10b981";

  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          height: 12,
          background: "#27272a",
          borderRadius: 999,
          overflow: "hidden",
          border: "1px solid #3f3f46",
        }}
        aria-label="fill level"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            transition: "width 300ms ease-in-out",
          }}
        />
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
        {pct.toFixed(0)}%
      </div>
    </div>
  );
}
