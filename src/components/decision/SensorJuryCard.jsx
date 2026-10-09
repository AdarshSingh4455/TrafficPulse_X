import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import ScientificBadge from '../common/ScientificBadge';

const JURY_STYLES = {
  CONFIRM_NOMINAL: {
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
    label: 'CONFIRM NOMINAL'
  },
  QUERY_REQUIRED: {
    bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    icon: HelpCircle,
    label: 'QUERY REQUIRED'
  },
  FLAG_CONGESTION: {
    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    icon: AlertTriangle,
    label: 'FLAG CONGESTION'
  },
  FLAG_ANOMALY: {
    bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
    icon: AlertCircle,
    label: 'FLAG ANOMALY'
  }
};

export default function SensorJuryCard({ data, sensorId }) {
  const jury = data || {
    sensorId: sensorId || '773869',
    juryDecision: 'CONFIRM_NOMINAL',
    juryConfidence: '75%',
    reason: 'Consensus agreement across prediction, graph, and telemetry signals.',
    supportingSignals: [
      'High prediction confidence (uncertainty = 2.16 mph)',
      'Stable historical speed trend (drift = 0.29)',
      'Reliable telemetry data quality (95%)'
    ],
    conflictingSignals: ['Spatial speed disagreement across neighbors (0.57)']
  };

  const decisionKey = jury.juryDecision || 'CONFIRM_NOMINAL';
  const style = JURY_STYLES[decisionKey] || JURY_STYLES.CONFIRM_NOMINAL;
  const DecisionIcon = style.icon;

  return (
    <SectionCard
      title={`Sensor Jury Consensus — ${jury.sensorId || sensorId}`}
      subtitle="Multi-agent deliberation combining model uncertainty, drift, and spatial neighbors"
      icon={Scale}
      action={<ScientificBadge type="DERIVED STATE" label="JURY CONSENSUS" size="xs" />}
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-3.5">
        {/* Consensus Decision Badge Banner */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
              Consensus Finding
            </span>
            <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${style.bg}`}>
              <DecisionIcon className="w-3.5 h-3.5" />
              <span>{style.label}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Confidence</span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {jury.juryConfidence || '75%'}
            </span>
          </div>
        </div>

        {/* Reason summary */}
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
          {jury.reason}
        </p>

        {/* Supporting Signals */}
        {jury.supportingSignals && jury.supportingSignals.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Supporting Signals:
            </span>
            <ul className="space-y-1">
              {jury.supportingSignals.map((s, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Conflicting Signals */}
        {jury.conflictingSignals && jury.conflictingSignals.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Conflicting Evidence:
            </span>
            <ul className="space-y-1">
              {jury.conflictingSignals.map((c, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
