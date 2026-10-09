import React from 'react';

const BADGE_STYLES = {
  REAL: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    tooltip: 'Direct telemetry from historical METR-LA loop detector sensor archive'
  },
  'MODEL OUTPUT': {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    tooltip: 'Inference produced by trained spatial-temporal model (SpatialGraphLSTM / FedAvg)'
  },
  DERIVED: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    tooltip: 'Mathematically derived score combining multi-factor telemetry and graph dynamics'
  },
  'DERIVED STATE': {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    tooltip: 'State computed deterministically from sensor speeds and spatial neighborhoods'
  },
  'CALIBRATED PROXY': {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    border: 'border-cyan-500/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
    tooltip: 'Calibrated heuristic proxy calibrated against frozen validation distribution'
  },
  HEURISTIC: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    tooltip: 'Rule-based heuristic check (e.g. physics consistency gates)'
  },
  'MEASURED PAYLOAD': {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    border: 'border-indigo-500/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    tooltip: 'Exact byte count measured from runtime serialization payload'
  },
  'APPLICATION PAYLOAD PROXY': {
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    border: 'border-sky-500/30',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    tooltip: 'Synthesized payload model representing full 12-step historical telemetry exchange'
  },
  'NOT AVAILABLE': {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    border: 'border-slate-500/30',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    tooltip: 'Not present in METR-LA dataset (METR-LA speed only; vehicle flow and occupancy unavailable)'
  },
  'NOT EVALUATED': {
    bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
    border: 'border-zinc-500/30',
    text: 'text-zinc-600 dark:text-zinc-400',
    dot: 'bg-zinc-400',
    tooltip: 'Phase under active development; metrics and policy values not yet frozen'
  }
};

export default function ScientificBadge({ type = 'REAL', label, showDot = true, size = 'sm', className = '' }) {
  const normalizedKey = (type || 'REAL').toUpperCase().trim();
  const config = BADGE_STYLES[normalizedKey] || BADGE_STYLES.REAL;
  const displayText = label || type;

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-1.5 py-0.5 tracking-tight' 
    : 'text-[11px] px-2 py-0.5 font-mono';

  return (
    <span
      title={config.tooltip}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase ${config.bg} ${config.border} ${config.text} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      <span>{displayText}</span>
    </span>
  );
}
