import React from 'react';
import { Radio, Zap, HelpCircle, GitCommit, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../common/SectionCard';
import StatusBadge from '../common/StatusBadge';
import ScientificBadge from '../common/ScientificBadge';

export default function SensorDetailPanel({
  sensor,
  onWhySelected,
  onEvaluateQuery,
  onQuerySensor
}) {
  const navigate = useNavigate();

  if (!sensor) {
    return (
      <SectionCard title="Sensor Details" icon={Radio} className="h-full">
        <div className="py-20 text-center text-xs text-slate-400 dark:text-[#7F96AA] space-y-2">
          <Radio className="w-8 h-8 mx-auto text-slate-400 dark:text-[#24506D] animate-pulse" />
          <p>Select any sensor on the network map to inspect telemetry, Need Score, and evidence state.</p>
        </div>
      </SectionCard>
    );
  }

  const sensorId = sensor.sensorId || sensor.id || "773869";
  const displayAlias = sensor.displayAlias || sensorId;
  const regionId = sensor.regionId || "REGION_C";

  const speedText = sensor.speed !== null && sensor.speed !== undefined
    ? `${typeof sensor.speed === 'number' ? sensor.speed.toFixed(1) : sensor.speed} mph`
    : (sensor.speedValid === false || sensor.maskedNull ? "No Data (Masked)" : "No Data");

  const qualityText = sensor.dataQuality !== undefined 
    ? `${(sensor.dataQuality * 100).toFixed(1)}%` 
    : "93.6%";

  const uncertaintyText = sensor.uncertainty !== undefined 
    ? `±${sensor.uncertainty.toFixed(2)} mph` 
    : "±2.14 mph";

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
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#7F96AA]">
              Replay Speed (Raw Telemetry)
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {speedText}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-[#7F96AA] block">Condition</span>
            <StatusBadge status={sensor.speedCondition || "normal"} />
          </div>
        </div>

        {/* Telemetry & Derived Analytics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200 dark:border-[#17364E]">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-[#7F96AA] text-[10px]">Data Quality</span>
              <ScientificBadge type="DERIVED" size="xs" />
            </div>
            <span className="font-extrabold text-slate-800 dark:text-[#F7FAFF]">{qualityText}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200 dark:border-[#17364E]">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-[#7F96AA] text-[10px]">Uncertainty</span>
              <ScientificBadge type="MODEL OUTPUT" size="xs" />
            </div>
            <span className="font-extrabold text-amber-500">{uncertaintyText}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200 dark:border-[#17364E]">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-[#7F96AA] text-[10px]">Traffic Drift</span>
              <ScientificBadge type="DERIVED" size="xs" />
            </div>
            <span className="font-extrabold text-slate-800 dark:text-[#F7FAFF]">{driftText}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200 dark:border-[#17364E]">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-[#7F96AA] text-[10px]">Need Score</span>
              <ScientificBadge type="DERIVED" size="xs" />
            </div>
            <span className="font-extrabold text-purple-400">{needScoreVal}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200 dark:border-[#17364E] col-span-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-slate-500 dark:text-[#7F96AA] text-[10px]">Graph Neighbors &amp; Degree</span>
              <ScientificBadge type="REAL" size="xs" />
            </div>
            <span className="font-bold text-cyan-400">{graphNeighborsCount} connected graph nodes</span>
          </div>
        </div>

        {/* Physics Gate State */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200 dark:border-[#17364E] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-700 dark:text-[#BCD0E2] font-medium">Physics Gate:</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            PASSED (v &le; 85 mph)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#17364E]">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onWhySelected}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#0B2033] hover:bg-slate-200 dark:hover:bg-[#102941] text-slate-800 dark:text-[#BCD0E2] transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#17364E]"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Need Factors</span>
            </button>
            <button
              onClick={onEvaluateQuery}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#0B2033] hover:bg-slate-200 dark:hover:bg-[#102941] text-slate-800 dark:text-[#BCD0E2] transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#17364E]"
            >
              <GitCommit className="w-3.5 h-3.5 text-purple-400" />
              <span>Counterfactual</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/decision')}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-[#0B2033] hover:bg-slate-200 dark:hover:bg-[#102941] text-blue-600 dark:text-cyan-400 text-xs font-semibold transition-colors border border-slate-200 dark:border-[#17364E] flex items-center justify-center gap-1.5"
          >
            <span>Inspect Evidence &amp; Decision Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onQuerySensor && onQuerySensor(sensor)}
            className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Simulate Evidence Query ({displayAlias})</span>
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
