import React from 'react';
import { GitCompare, ArrowRight, AlertTriangle } from 'lucide-react';
import SectionCard from '../common/SectionCard';

export default function FlowConsistencyPanel({ data }) {
  if (!data) return null;

  const {
    fromSensor,
    toSensor,
    incomingFlow,
    expectedFlow,
    observedFlow,
    expectedDiversion,
    estimatedStoredVehicles,
    unexplainedDifference
  } = data;

  return (
    <SectionCard
      title="Flow Consistency Engine"
      subtitle="Conservation check: Inflow ≈ Outflow + Diversion + Stored"
      icon={GitCompare}
      className="h-full"
    >
      <div className="space-y-4">
        {/* Anomaly banner */}
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-xs text-rose-700 dark:text-rose-300 font-mono tracking-wide block">
                FLOW MISMATCH: HIGH
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                Possible traffic anomaly detected • Additional evidence required
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
            Unexplained &Delta; {unexplainedDifference} veh
          </span>
        </div>

        {/* Visual road segment connection */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs">
              {fromSensor}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">Incoming: <b className="text-slate-900 dark:text-white font-mono">{incomingFlow}</b></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 dark:bg-[#131d36] border border-slate-300 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
            <span>Road Segment</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">Observed: <b className="text-rose-600 dark:text-rose-400 font-mono">{observedFlow}</b></span>
            <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-400 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 flex items-center justify-center font-mono font-bold text-xs">
              {toSensor}
            </span>
          </div>
        </div>

        {/* Flow balance accounting metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Expected Flow</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{expectedFlow}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Transition model</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Observed Flow</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">{observedFlow}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Sensor reading</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Diversion</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300 text-sm">{expectedDiversion}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Side road estimate</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block">Stored Vehicles</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-300 text-sm">{estimatedStoredVehicles}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Segment buffer</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
