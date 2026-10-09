import { Sparkles, Zap } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import DataTable from '../common/DataTable';
import Button from '../common/Button';
import ScientificBadge from '../common/ScientificBadge';

const DEFAULT_CANDIDATES = [
  {
    rank: 1,
    sensorId: "773869",
    regionId: "REGION_A",
    needScore: 0.87,
    expectedBenefit: "+18.2%",
    reason: "Central highway chokepoint; high epistemic uncertainty",
    isPrimary: true
  },
  {
    rank: 2,
    sensorId: "767541",
    regionId: "REGION_B",
    needScore: 0.74,
    expectedBenefit: "+14.6%",
    reason: "Spatial speed disagreement with downstream neighbors",
    isPrimary: false
  },
  {
    rank: 3,
    sensorId: "717447",
    regionId: "REGION_C",
    needScore: 0.69,
    expectedBenefit: "+12.1%",
    reason: "High information debt; stale local reading window",
    isPrimary: false
  },
  {
    rank: 4,
    sensorId: "765171",
    regionId: "REGION_D",
    needScore: 0.63,
    expectedBenefit: "+10.4%",
    reason: "Valley transition boundary with moderate speed drift",
    isPrimary: false
  },
  {
    rank: 5,
    sensorId: "717816",
    regionId: "REGION_C",
    needScore: 0.58,
    expectedBenefit: "+8.9%",
    reason: "Topological bridge sensor between arterial clusters",
    isPrimary: false
  }
];

export default function NextBestQueryTable({ onQuery, onSelectSensor, data }) {
  // Normalize data list
  let candidates = DEFAULT_CANDIDATES;
  if (data && Array.isArray(data) && data.length > 0) {
    candidates = data.map((item, idx) => ({
      rank: idx + 1,
      sensorId: item.sensor || item.sensorId || `S${idx + 1}`,
      regionId: item.region || item.regionId || 'REGION_A',
      needScore: item.needScore !== undefined ? item.needScore : (0.85 - idx * 0.08),
      expectedBenefit: item.expectedBenefit || `+${Math.max(5, 18 - idx * 2.5).toFixed(1)}%`,
      reason: item.reason || 'High information utility',
      isPrimary: idx === 0
    }));
  }

  const columns = [
    {
      header: "#",
      key: "rank",
      className: "w-8 font-mono text-slate-500 font-bold text-xs"
    },
    {
      header: "Sensor ID",
      key: "sensorId",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
          <span className={row.isPrimary ? "text-blue-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"}>
            {row.sensorId}
          </span>
          {row.isPrimary && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-300 border border-blue-500/20 font-bold">
              PRIMARY
            </span>
          )}
        </div>
      )
    },
    {
      header: "Region",
      key: "regionId",
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.regionId}
        </span>
      )
    },
    {
      header: "Need Score",
      key: "needScore",
      render: (row) => {
        const val = typeof row.needScore === 'number' ? row.needScore.toFixed(2) : row.needScore;
        const num = parseFloat(val);
        return (
          <span className={`font-mono font-bold text-xs ${
            num >= 0.7 ? "text-rose-600 dark:text-rose-400" : num >= 0.4 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
          }`}>
            {val}
          </span>
        );
      }
    },
    {
      header: "Expected Benefit",
      key: "expectedBenefit",
      render: (row) => (
        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono">
          {row.expectedBenefit}
        </span>
      )
    },
    {
      header: "Rationale",
      key: "reason",
      className: "text-slate-700 dark:text-slate-300 text-xs"
    },
    {
      header: "Action",
      key: "action",
      render: (row) => (
        <Button
          size="xs"
          variant={row.isPrimary ? "primary" : "secondary"}
          onClick={(e) => {
            e.stopPropagation();
            if (onQuery) onQuery(row);
          }}
          className="flex items-center gap-1 text-[11px]"
        >
          <Zap className="w-3 h-3" />
          <span>Query</span>
        </Button>
      )
    }
  ];

  return (
    <SectionCard
      title="Next-Best Query Recommendations"
      subtitle="Ranked sensors maximizing informative telemetry gain while minimizing query payloads"
      icon={Sparkles}
      action={<ScientificBadge type="DERIVED" label="RANKED UTILITY" size="xs" />}
      className="h-full"
    >
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={candidates}
          onRowClick={onSelectSensor}
        />
      </div>
    </SectionCard>
  );
}
