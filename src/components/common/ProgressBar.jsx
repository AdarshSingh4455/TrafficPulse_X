import React from 'react';

export default function ProgressBar({ value, max = 100, color = 'cyan', height = 'h-2' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    cyan: "bg-cyan-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    purple: "bg-purple-500"
  };

  return (
    <div className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ${height}`}>
      <div
        className={`${colors[color] || colors.cyan} h-full rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
