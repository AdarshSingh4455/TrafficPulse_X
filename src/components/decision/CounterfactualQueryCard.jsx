import React from 'react';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import SectionCard from '../common/SectionCard';

export default function CounterfactualQueryCard({ data, onClose, onExecuteQuery }) {
  if (!data) return null;

  const { sensorId, withoutQuery = {}, withQuery = {}, expectedBenefit, decision, reason } = data;
  const isQuery = decision === "QUERY";

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
      title={`Counterfactual Evaluation — ${sensorId}`}
      subtitle="Evaluating expected state benefit against communication byte cost"
      icon={HelpCircle}
      action={closeButton}
      className="h-full"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 font-semibold">
              <span>WITHOUT QUERY</span>
              <span className="text-[10px] text-slate-500 font-mono">Current State</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Uncertainty Proxy:</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {withoutQuery.estimatedUncertainty || withoutQuery.expectedUncertainty || "45%"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Blind Spot Risk:</span>
              <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                {withoutQuery.blindSpotRisk || "Moderate"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Information Debt:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                {withoutQuery.informationDebt !== undefined ? withoutQuery.informationDebt : 0.2}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-blue-200 dark:border-blue-500/20 text-cyan-700 dark:text-cyan-300 font-semibold">
              <span>WITH QUERY</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">Simulated State</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Uncertainty Proxy:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {withQuery.estimatedUncertainty || withQuery.expectedUncertainty || "18%"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Expected Coverage Gain:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {withQuery.coverageGain || "+15%"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Byte Cost:</span>
              <span className="font-mono font-medium text-cyan-700 dark:text-cyan-300">
                {withQuery.expectedCost || "4.2 KB"}
              </span>
            </div>
          </div>
        </div>

        {reason && (
          <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
            "{reason}"
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#14203a] border border-slate-200 dark:border-blue-500/20 gap-3">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Estimated State Benefit</span>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{expectedBenefit} Benefit
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold font-mono tracking-wider bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              {isQuery ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300">DECISION: QUERY</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">DECISION: SKIP</span>
                </>
              )}
            </div>

            {isQuery && onExecuteQuery && (
              <button
                onClick={() => onExecuteQuery(sensorId)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Execute Query
              </button>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
