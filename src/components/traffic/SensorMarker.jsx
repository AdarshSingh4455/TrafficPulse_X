import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SensorMarker({ sensor, onSelect, isSelected }) {
  const { id, status, hasAlert, x, y, flow, speed } = sensor;

  const statusStyles = {
    free: "bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500/60 hover:border-emerald-500",
    moderate: "bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500/60 hover:border-amber-500",
    high: "bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-500/80 hover:border-rose-500 animate-pulse",
    inactive: "bg-slate-200 text-slate-700 border-slate-400 dark:bg-slate-900/80 dark:text-slate-400 dark:border-slate-600/40 hover:border-slate-500"
  };

  const currentStyle = statusStyles[status] || statusStyles.inactive;

  return (
    <div
      onClick={() => onSelect && onSelect(sensor)}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 z-20 group"
    >
      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[11px] font-mono font-bold shadow-md backdrop-blur-xs ${currentStyle} ${
        isSelected ? "ring-2 ring-cyan-500 dark:ring-cyan-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 scale-110" : ""
      }`}>
        {hasAlert && <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400 shrink-0" />}
        <span>{id}</span>
      </div>

      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-900/95 border border-slate-700 rounded-md text-[10px] text-slate-200 whitespace-nowrap shadow-xl z-30 pointer-events-none">
        <div className="font-bold text-white mb-0.5">{id} • {sensor.road}</div>
        <div className="flex gap-2 text-slate-300">
          <span>Flow: <b className="text-cyan-400">{flow}</b> veh/hr</span>
          <span>Speed: <b className="text-emerald-400">{speed}</b> km/h</span>
        </div>
      </div>
    </div>
  );
}
