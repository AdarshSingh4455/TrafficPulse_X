import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import ScientificBadge from '../common/ScientificBadge';

export default function PhysicsGateCard({ data, sensorId }) {
  const physics = data || {
    sensorId: sensorId || '773869',
    currentSpeedMph: 64.38,
    passed: true,
    anomalyType: 'NOMINAL',
    checksPassed: {
      validBoundsCheck: true,
      stepDeltaCheck: true,
      spatialNeighborCheck: true
    },
    note: 'Speed telemetry satisfies physical continuity boundaries.',
    classification: 'REAL_TELEMETRY_PHYSICS_GATE'
  };

  const checks = physics.checksPassed || {
    validBoundsCheck: true,
    stepDeltaCheck: true,
    spatialNeighborCheck: true
  };

  const allPassed = physics.passed;

  return (
    <SectionCard
      title={`Physics Gate Verification — ${physics.sensorId || sensorId}`}
      subtitle="Deterministic kinematic filters gating anomalous loop detector telemetry"
      icon={allPassed ? ShieldCheck : ShieldAlert}
      action={<ScientificBadge type="HEURISTIC" label="KINEMATIC GATE" size="xs" />}
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-3.5">
        {/* Gate Status Banner */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          allPassed 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold text-xs font-mono block">
                {allPassed ? 'ALL HEURISTIC CHECKS PASSED' : 'ANOMALY DETECTED BY GATE'}
              </span>
              <span className="text-[11px] opacity-80 block">{physics.note}</span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-500 block">Telemetry</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {physics.currentSpeedMph} mph
            </span>
          </div>
        </div>

        {/* 3 Physical Consistency Checks */}
        <div className="space-y-2 text-xs font-mono">
          {/* Check 1: Speed Bound */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                1. Highway Speed Boundary Check
              </span>
              <span className="text-[10px] text-slate-500 block">Criterion: 0 &le; v &le; 85 mph</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              checks.validBoundsCheck
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              {checks.validBoundsCheck ? 'PASSED' : 'VIOLATION'}
            </span>
          </div>

          {/* Check 2: Temporal Delta */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                2. Step Acceleration Continuity (&Delta;t = 5 min)
              </span>
              <span className="text-[10px] text-slate-500 block">Criterion: |&Delta;v| &le; 25 mph per 5-min step</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              checks.stepDeltaCheck
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              {checks.stepDeltaCheck ? 'PASSED' : 'VIOLATION'}
            </span>
          </div>

          {/* Check 3: Spatial Neighbor Difference */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                3. Spatial Neighbor Gradient Discrepancy
              </span>
              <span className="text-[10px] text-slate-500 block">Criterion: |v_i - &lt;v_nbr&gt;| &le; 30 mph</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              checks.spatialNeighborCheck
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              {checks.spatialNeighborCheck ? 'PASSED' : 'VIOLATION'}
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
