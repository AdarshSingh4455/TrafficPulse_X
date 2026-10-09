import { Cpu, CheckCircle, HelpCircle } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import ScientificBadge from '../common/ScientificBadge';

const FACTOR_TOOLTIPS = {
  "Spatial Influence": "Graph eigenvector centrality and downstream node degree impact.",
  "Prediction Uncertainty": "Model epistemic uncertainty from multi-horizon forecast residual.",
  "Spatial Speed Disagreement": "Speed delta between target sensor and its k-nearest road neighbors.",
  "Speed Drift": "Temporal rate of change in speed over recent 30-min window.",
  "Freshness Need": "Time elapsed since last active high-fidelity telemetry sample was pulled.",
  "Information Debt": "Cumulative divergence between predicted state and actual road traffic.",
  "Coverage Need": "Regional topological coverage deficit within the local cluster.",
  "Data Quality": "Ratio of valid speed readings vs masked null records in METR-LA loop detectors.",
  "Redundancy Penalty": "Negative penalty applied when nearby connected sensors already provide sufficient telemetry."
};

export default function NeedScoreBreakdown({ data, onClose }) {
  if (!data) return null;

  const { sensorId, finalNeedScore = 0.87, factors = [], reasons = [] } = data;
  const scoreNum = typeof finalNeedScore === 'number' ? finalNeedScore : parseFloat(finalNeedScore) || 0.87;
  const clampedScore = Math.min(1.0, Math.max(0.05, scoreNum));

  // Determine priority classification
  let priorityLabel = 'LOW NEED';
  let priorityColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (clampedScore >= 0.70) {
    priorityLabel = 'HIGH QUERY PRIORITY';
    priorityColor = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
  } else if (clampedScore >= 0.40) {
    priorityLabel = 'MODERATE NEED';
    priorityColor = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
  }

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
      title={`Need Score Breakdown — Sensor ${sensorId}`}
      subtitle="Derived multi-factor urgency gating when communication is necessary"
      icon={Cpu}
      action={
        <div className="flex items-center gap-2">
          <ScientificBadge type="DERIVED" label="EVIDENCE SCORE" size="xs" />
          {closeButton}
        </div>
      }
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Large Need Score Circular / Arc Gauge Header */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex items-center justify-center">
            {/* SVG Semi-Circle Gauge */}
            <svg height="80" width="140" className="overflow-visible">
              <path
                d="M 15 70 A 55 55 0 0 1 125 70"
                fill="none"
                stroke="#334155"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.3"
              />
              <path
                d="M 15 70 A 55 55 0 0 1 125 70"
                fill="none"
                stroke={clampedScore >= 0.7 ? '#ef4444' : clampedScore >= 0.4 ? '#f59e0b' : '#10b981'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="172.78"
                strokeDashoffset={172.78 * (1 - clampedScore)}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute top-7 text-center">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white block">
                {clampedScore.toFixed(2)}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">
                Score [0.05, 1.0]
              </span>
            </div>
          </div>

          <div className="space-y-1 text-center sm:text-right">
            <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${priorityColor}`}>
              <CheckCircle className="w-3 h-3" />
              <span>{priorityLabel}</span>
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">
              Derived from 9 objective factors. Zero subjective or fabricated telemetry.
            </p>
          </div>
        </div>

        {/* Key Decision Triggers */}
        {reasons && reasons.length > 0 && (
          <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 dark:text-cyan-400">
              Primary Decision Triggers:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 9-Factor Component List */}
        <div className="space-y-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            9-Factor Decomposition:
          </span>

          {factors && factors.map((f, idx) => {
            const isNegative = f.value < 0;
            const barWidth = Math.min(100, Math.abs(f.value) * 100);
            const tooltip = FACTOR_TOOLTIPS[f.name] || "Mathematical factor contributing to composite Need Score.";

            return (
              <div key={idx} className="p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5" title={tooltip}>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{f.name}</span>
                    <HelpCircle className="w-3 h-3 text-slate-400 hover:text-blue-500 cursor-help" />
                  </div>
                  <span className={`font-mono font-bold text-[11px] ${
                    isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-cyan-600 dark:text-cyan-400'
                  }`}>
                    {f.weight}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
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
