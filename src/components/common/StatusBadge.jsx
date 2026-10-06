import React from 'react';

export default function StatusBadge({ status, text }) {
  const normalized = (status || '').toLowerCase();

  const styles = {
    high: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    moderate: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    free: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    inactive: "bg-slate-200 dark:bg-slate-700/30 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600/30",
    query: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    queried: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    watch: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    wake_up: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    normal: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  };

  const labels = {
    high: "High",
    moderate: "Moderate",
    free: "Free Flow",
    active: "Active",
    inactive: "Inactive",
    query: "Query",
    queried: "Queried",
    watch: "Watch",
    wake_up: "Wake-Up",
    normal: "Normal",
  };

  const badgeClass = styles[normalized] || styles.inactive;
  const label = text || labels[normalized] || status;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}`}>
      {label}
    </span>
  );
}
