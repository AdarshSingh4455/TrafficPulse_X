import React from 'react';
import { Sparkles } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import DataTable from '../common/DataTable';
import Button from '../common/Button';

const defaultNextBestDecisionQueries = [
  {
    sensor: "773869",
    road: "REGION_A (North-East Arterial)",
    needScore: 0.87,
    expectedBenefit: "18%",
    expectedBytes: "4.2 KB",
    reason: "Core arterial chokepoint influence",
    action: "Query"
  },
  {
    sensor: "767541",
    road: "REGION_C (Central-West Corridor)",
    needScore: 0.72,
    expectedBenefit: "14%",
    expectedBytes: "3.1 KB",
    reason: "Spatial speed disagreement detected",
    action: "Query"
  }
];

export default function NextBestQueryTable({ onQuery, onSelectSensor, data }) {
  const candidates = data || defaultNextBestDecisionQueries;

  const columns = [
    {
      header: "Sensor",
      key: "sensor",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{row.sensor || row.sensorId}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{row.road || row.sector}</span>
        </div>
      )
    },
    {
      header: "Need Score",
      key: "needScore",
      render: (row) => (
        <span className={`font-mono font-bold text-xs ${
          row.needScore > 0.7 ? "text-rose-600 dark:text-rose-400" : row.needScore > 0.4 ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
        }`}>
          {row.needScore}
        </span>
      )
    },
    {
      header: "Expected Benefit",
      key: "expectedBenefit",
      render: (row) => (
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs font-mono">
          {row.expectedBenefit}
        </span>
      )
    },
    {
      header: "Expected Bytes",
      key: "expectedBytes",
      render: (row) => (
        <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">
          {row.expectedBytes}
        </span>
      )
    },
    {
      header: "Reason",
      key: "reason",
      className: "text-slate-700 dark:text-slate-300 text-xs"
    },
    {
      header: "Action",
      key: "action",
      render: (row) => {
        const isQuery = (row.action || row.decision) === "Query" || (row.action || row.decision) === "QUERY";
        return (
          <Button
            size="xs"
            variant={isQuery ? "primary" : "secondary"}
            onClick={(e) => {
              e.stopPropagation();
              onQuery && onQuery(row);
            }}
          >
            {row.action || "Query"}
          </Button>
        );
      }
    }
  ];

  return (
    <SectionCard
      title="Next Best Sensor Queries"
      subtitle="Ranked candidates based on expected informational gain vs byte cost"
      icon={Sparkles}
      className="h-full"
    >
      <DataTable
        columns={columns}
        data={candidates}
        onRowClick={onSelectSensor}
      />
    </SectionCard>
  );
}
