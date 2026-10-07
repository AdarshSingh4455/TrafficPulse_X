import React from 'react';
import { GitCompare, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import SectionCard from '../common/SectionCard';

export default function SpatialSpeedConsistencyPanel({ data }) {
  if (!data) return null;

  const {
    fromSensor = "773869",
    toSensor = "767541",
    fromSpeedMph = 64.2,
    toSpeedMph = 62.1,
    speedDifferenceMph = 2.1,
    consistencyScore = 94.8,
    isDisagreement = false,
    severity = "normal",
    note = "Spatial speed variation within nominal range"
  } = data;

  return (
    <SectionCard
      title="Spatial Speed Consistency Engine"
      subtitle="Speed variation check across adjacent METR-LA sensors in real graph topology"
      icon={GitCompare}
      className="h-full"
    >
      <div className="space-y-4">
        {/* Spatial Speed Anomaly / Consistency Banner */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          isDisagreement
            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/40"
            : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/40"
        }`}>
          <div className="flex items-center gap-2.5">
            {isDisagreement ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <div>
              <span className={`font-bold text-xs font-mono tracking-wide block ${
                isDisagreement ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"
              }`}>
                {isDisagreement ? `SPATIAL SPEED DISAGREEMENT: ${severity.toUpperCase()}` : "SPATIAL SPEED CONSISTENCY: NOMINAL"}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                {note}
              </span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
            isDisagreement
              ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30"
              : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
          }`}>
            &Delta; {speedDifferenceMph !== None && speedDifferenceMph !== undefined ? `${speedDifferenceMph} mph` : "N/A"}
          </span>
        </div>

        {/* Visual road segment connection */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs">
              {fromSensor}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Speed: <b className="text-slate-900 dark:text-white font-mono">{fromSpeedMph !== None ? `${fromSpeedMph} mph` : "N/A"}</b>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 dark:bg-[#131d36] border border-slate-300 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
            <span>Adjacency Edge</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Speed: <b className="text-slate-900 dark:text-white font-mono">{toSpeedMph !== None ? `${toSpeedMph} mph` : "N/A"}</b>
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-400 dark:border-blue-500/40 text-blue-800 dark:text-blue-300 flex items-center justify-center font-mono font-bold text-xs">
              {toSensor}
            </span>
          </div>
        </div>

        {/* Spatial metrics breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Consistency Score</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{consistencyScore}%</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Local agreement</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Speed Difference</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{speedDifferenceMph !== None ? `${speedDifferenceMph} mph` : "N/A"}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Absolute delta</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Severity Level</span>
            <span className={`font-mono font-bold text-sm ${isDisagreement ? "text-rose-600 dark:text-rose-400" : "text-cyan-600 dark:text-cyan-300"}`}>{severity.toUpperCase()}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Anomaly score</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Telemetry</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-300 text-sm">REAL SPEED</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">METR-LA telemetry</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
