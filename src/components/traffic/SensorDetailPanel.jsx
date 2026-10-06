import React from 'react';
import { Radio, Zap, HelpCircle, GitCommit, Activity } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';

export default function SensorDetailPanel({
  sensor,
  onWhySelected,
  onEvaluateQuery,
  onViewEvidence,
  onQuerySensor
}) {
  if (!sensor) {
    return (
      <SectionCard title="Sensor Details" icon={Radio} className="h-full">
        <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
          Click any sensor on the network to inspect its telemetry and decision state.
        </div>
      </SectionCard>
    );
  }

  const {
    id,
    sector,
    road,
    status,
    flow,
    speed,
    occupancy,
    health,
    lastUpdated,
    needScore,
    uncertainty,
    expectedBenefit,
    expectedBytes
  } = sensor;

  return (
    <SectionCard
      title={`Sensor ${id}`}
      subtitle={`${sector} • ${road}`}
      icon={Radio}
      action={<StatusBadge status={status} />}
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Flow (veh/5 min)</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{flow}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Average Speed</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{speed} km/h</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Occupancy</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">{occupancy}%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Sensor Health</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300 text-sm">{(health * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Intelligence Decision Factors Box */}
        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-[#14203a] border border-blue-200 dark:border-blue-500/20 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-1.5 border-b border-blue-200 dark:border-blue-500/20">
            <span className="text-slate-600 dark:text-slate-400">Need Score:</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">{needScore}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Uncertainty:</span>
            <span className="font-mono font-semibold text-rose-600 dark:text-rose-300">{uncertainty}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Expected Benefit:</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{expectedBenefit}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Expected Bytes:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{expectedBytes}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
            <span>Last Updated:</span>
            <span>{lastUpdated}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <Button
            size="sm"
            variant="primary"
            className="w-full"
            icon={Zap}
            onClick={() => onQuerySensor && onQuerySensor(sensor)}
          >
            Query Sensor
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="xs"
              variant="secondary"
              icon={HelpCircle}
              onClick={() => onWhySelected && onWhySelected(sensor)}
            >
              Why Selected?
            </Button>
            <Button
              size="xs"
              variant="secondary"
              icon={Activity}
              onClick={() => onEvaluateQuery && onEvaluateQuery(sensor)}
            >
              Evaluate Query
            </Button>
          </div>

          <Button
            size="xs"
            variant="outline"
            className="w-full"
            icon={GitCommit}
            onClick={() => onViewEvidence && onViewEvidence(sensor)}
          >
            View Evidence Chain
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
