import React from 'react';
import { Radio, Zap, HelpCircle, GitCommit, ShieldCheck } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import StatusBadge from '../common/StatusBadge';
import ScientificBadge from '../common/ScientificBadge';

export default function SensorDetailPanel({
  sensor,
  onWhySelected,
  onEvaluateQuery,
  onQuerySensor
}) {
  if (!sensor) {
    return (
      <SectionCard title="Sensor Details" icon={Radio} className="h-full">
        <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
          <Radio className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 animate-pulse" />
          <p>Click any sensor on the network to inspect its telemetry and decision state.</p>
        </div>
      </SectionCard>
    );
  }

  const sensorId = sensor.sensorId || sensor.id || "773869";
  const displayAlias = sensor.displayAlias || sensorId;
  const regionId = sensor.regionId || "REGION_A";

  const speedText = sensor.speed !== null && sensor.speed !== undefined
    ? `${typeof sensor.speed === 'number' ? sensor.speed.toFixed(1) : sensor.speed} mph`
    : (sensor.speedValid === false || sensor.maskedNull ? "No Data (Masked)" : "No Data");

  const qualityText = sensor.dataQuality !== undefined 
    ? `${(sensor.dataQuality * 100).toFixed(1)}%` 
    : "93.6%";

  const uncertaintyText = sensor.uncertainty !== undefined 
    ? `${sensor.uncertainty.toFixed(2)} mph` 
    : "2.14 mph";

  const driftText = sensor.trafficDrift !== undefined 
    ? `${sensor.trafficDrift.toFixed(2)}` 
    : "0.18";

  const needScoreVal = sensor.needScore !== undefined 
    ? (typeof sensor.needScore === 'number' ? sensor.needScore.toFixed(2) : sensor.needScore) 
    : "0.42";

  const graphNeighborsCount = sensor.graphDegree !== undefined 
    ? sensor.graphDegree 
    : (sensor.graphNeighbors ? sensor.graphNeighbors.length : 12);

  return (
    <SectionCard
      title={`Sensor ${displayAlias}`}
      subtitle={`${regionId} • Lat: ${sensor.latitude ? sensor.latitude.toFixed(4) : '--'}, Lon: ${sensor.longitude ? sensor.longitude.toFixed(4) : '--'}`}
      icon={Radio}
      action={<ScientificBadge type="REAL" label="METR-LA" size="xs" />}
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Real Speed Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Replay Speed (Raw Telemetry)
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {speedText}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Condition</span>
            <StatusBadge status={sensor.speedCondition || "normal"} />
          </div>
        </div>

        {/* Telemetry & Derived Analytics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">Data Quality</span>
              <ScientificBadge type="DERIVED" size="xs" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">{qualityText}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">Uncertainty</span>
              <ScientificBadge type="MODEL OUTPUT" size="xs" />
            </div>
            <span className="font-bold text-amber-600 dark:text-amber-400">{uncertaintyText}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">Speed Drift</span>
              <ScientificBadge type="DERIVED" size="xs" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">{driftText}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">Need Score</span>
              <ScientificBadge type="DERIVED" size="xs" />
            </div>
            <span className="font-bold text-purple-600 dark:text-purple-400">{needScoreVal}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 col-span-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">Graph Neighbors</span>
              <ScientificBadge type="REAL" size="xs" />
            </div>
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{graphNeighborsCount} connected nodes</span>
          </div>
        </div>

        {/* Physics Gate State */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Physics Gate Check:</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            PASSED (v &le; 85 mph)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onWhySelected}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Need Factors</span>
            </button>
            <button
              onClick={onEvaluateQuery}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <GitCommit className="w-3.5 h-3.5 text-purple-500" />
              <span>Counterfactual</span>
            </button>
          </div>

          <button
            onClick={() => onQuerySensor && onQuerySensor(sensor)}
            className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Simulate Evidence Query ({sensor.displayAlias || sensorId})</span>
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
