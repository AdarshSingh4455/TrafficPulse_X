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

  const isReal = sensor.availability || sensor.displayAlias || sensor.sourceType === "REAL_BENCHMARK" || sensor.sensorId;
  const displayId = sensor.displayAlias ? `${sensor.displayAlias} (${sensor.sensorId || sensor.id})` : (sensor.id || sensor.sensorId);
  const displayTitle = `Sensor ${displayId}`;
  const displaySubtitle = isReal 
    ? `${sensor.regionId || 'METR-LA'} • Lat: ${sensor.latitude ? sensor.latitude.toFixed(4) : '--'}, Lon: ${sensor.longitude ? sensor.longitude.toFixed(4) : '--'}`
    : `${sector} • ${road}`;

  const speedText = sensor.speed !== null && sensor.speed !== undefined
    ? `${typeof sensor.speed === 'number' ? sensor.speed.toFixed(1) : sensor.speed} mph`
    : (sensor.speedValid === false || sensor.maskedNull ? "No Data (Masked)" : "No Data");

  const flowText = sensor.flow !== null && sensor.flow !== undefined ? sensor.flow : "Not available in METR-LA";
  const occupancyText = sensor.occupancy !== null && sensor.occupancy !== undefined ? `${sensor.occupancy}%` : "Not available in METR-LA";
  
  const qualityOrHealthLabel = isReal ? "Data Quality" : "Sensor Health";
  const qualityOrHealthText = isReal
    ? (sensor.dataQuality !== undefined ? `${(sensor.dataQuality * 100).toFixed(1)}%` : "Not available in METR-LA")
    : (health !== undefined ? `${(health * 100).toFixed(0)}%` : "Not available in METR-LA");

  return (
    <SectionCard
      title={displayTitle}
      subtitle={displaySubtitle}
      icon={Radio}
      action={<StatusBadge status={sensor.speedCondition || status || "normal"} />}
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Flow (veh/5 min)</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate block" title={flowText}>{flowText}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Average Speed</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm block">{speedText}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Occupancy</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs truncate block" title={occupancyText}>{occupancyText}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">{qualityOrHealthLabel}</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300 text-sm block">{qualityOrHealthText}</span>
          </div>
        </div>

        {/* Intelligence Decision Factors Box */}
        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-[#14203a] border border-blue-200 dark:border-blue-500/20 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-1.5 border-b border-blue-200 dark:border-blue-500/20">
            <span className="text-slate-600 dark:text-slate-400">{isReal ? "Speed Condition:" : "Need Score:"}</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">{isReal ? (sensor.speedCondition || "NORMAL") : (needScore || 0.45)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">{isReal ? "Graph Degree:" : "Uncertainty:"}</span>
            <span className="font-mono font-semibold text-rose-600 dark:text-rose-300">{isReal ? `${sensor.graphDegree || 0} connections` : (uncertainty || "30%")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Data Source:</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{isReal ? "METR-LA Benchmark" : "Simulated Demo"}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
            <span>Timestamp:</span>
            <span className="font-mono">{sensor.timestamp || lastUpdated || "Just now"}</span>
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
