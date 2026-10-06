import React from 'react';
import { Cpu, CheckCircle } from 'lucide-react';
import SectionCard from '../common/SectionCard';

export default function NeedScoreBreakdown({ data, onClose }) {
  if (!data) return null;

  const { sensorId, finalNeedScore, factors, reasons = [] } = data;

  const closeButton = onClose && (
    <button 
      onClick={onClose}
      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 transition-colors cursor-pointer"
    >
      Close
    </button>
  );

  return (
    <SectionCard
      title={`Need Score Breakdown — ${sensorId}`}
      subtitle="Multi-factor information value evaluation"
      icon={Cpu}
      action={closeButton}
      className="h-full"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-[#14203a] border border-blue-200 dark:border-blue-500/20">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Composite Need Score</span>
            <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {finalNeedScore}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>High Priority</span>
          </div>
        </div>

        {reasons && reasons.length > 0 && (
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Key Decision Triggers:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2.5">
          {factors && factors.map((f, idx) => {
            const isNegative = f.value < 0;
            const barWidth = Math.min(100, Math.abs(f.value) * 100);

            return (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-700 dark:text-slate-300">{f.name}</span>
                  <span className={`font-mono font-semibold ${isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {f.weight}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isNegative ? 'bg-rose-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
