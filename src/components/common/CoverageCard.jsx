import React from 'react';
import { ShieldCheck, AlertCircle, ChevronRight } from 'lucide-react';
import SectionCard from './SectionCard';

const defaultCoverageStats = {
  coveragePercent: 85,
  coveredRoads: 176,
  uncoveredRoads: 31,
  blindSpots: 0
};

export default function CoverageCard({ data }) {
  const current = data || defaultCoverageStats;
  const { coveragePercent = 85, coveredRoads = 176, uncoveredRoads = 31, blindSpots = 0 } = current;

  return (
    <SectionCard
      title="Coverage & Blind Spots"
      icon={ShieldCheck}
      className="h-full justify-between"
    >
      <div className="flex flex-col justify-between h-full gap-4">
        <div className="flex items-center gap-5 my-auto">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-500 dark:text-cyan-400 transition-all duration-1000"
                strokeDasharray={`${coveragePercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight">
                {coveragePercent}%
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Coverage</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Covered Sensors
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">{coveredRoads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                Coverage Deficit
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{uncoveredRoads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Blind Spots
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{blindSpots}</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] leading-tight">
              <b>{blindSpots === 0 ? "Full 4-Region Coverage:" : `${blindSpots} Regional Gaps:`}</b> 207 real METR-LA sensors active.
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
        </div>
      </div>
    </SectionCard>
  );
}
