import React from 'react';
import { GitCommit, ArrowRight, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import SectionCard from '../common/SectionCard';

export default function EvidenceChain({ data, onClose }) {
  if (!data) return null;

  const { sequence, currentConfidence, evidenceSufficient, stoppingCondition } = data;

  const statusIcons = {
    complete: <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
    querying: <Loader2 className="w-4 h-4 text-cyan-500 dark:text-cyan-400 animate-spin" />,
    waiting: <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />,
    skipped: <XCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
  };

  const statusBadges = {
    complete: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    querying: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    waiting: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    skipped: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-700"
  };

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
      title="Progressive Evidence Chain"
      subtitle="Gathering minimal sufficient evidence sequence"
      icon={GitCommit}
      action={closeButton}
      className="h-full"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-[#14203a] border border-blue-200 dark:border-blue-500/20 gap-3">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Current Confidence</span>
              <span className="font-mono font-bold text-base text-cyan-600 dark:text-cyan-300">{currentConfidence}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Evidence Sufficient</span>
              <span className={`font-mono font-bold text-base ${
                evidenceSufficient === "Yes" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                {evidenceSufficient}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {stoppingCondition || "Stopping condition satisfied (Uncertainty ≤ 15%)"}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {sequence.map((step, idx) => (
            <React.Fragment key={step.sensorId}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{step.sensorId}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                  statusBadges[step.status] || statusBadges.waiting
                }`}>
                  {step.status}
                </span>
              </div>
              {idx < sequence.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          {sequence.map((step, idx) => (
            <div key={idx} className="flex items-start justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{statusIcons[step.status] || statusIcons.waiting}</div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white font-mono">{step.sensorId}</div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                    {step.result ? step.result : "Awaiting response in sequence"}
                  </div>
                </div>
              </div>
              <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">{step.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
