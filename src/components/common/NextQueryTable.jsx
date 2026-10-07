import React from 'react';
import { Sparkles } from 'lucide-react';
import SectionCard from './SectionCard';
import DataTable from './DataTable';
import Button from './Button';

const defaultNextBestQueries = [
  {
    id: "Q1",
    sensor: "773869",
    road: "REGION_A (North-East Arterial)",
    needScore: 0.87,
    expectedBenefit: "18%",
    expectedBytes: "4.2 KB",
    action: "Query"
  },
  {
    id: "Q2",
    sensor: "767541",
    road: "REGION_C (Central-West Corridor)",
    needScore: 0.72,
    expectedBenefit: "14%",
    expectedBytes: "3.1 KB",
    action: "Query"
  }
];

export default function NextQueryTable({ onQuery, data }) {
  const list = data || defaultNextBestQueries;

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
        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-xs">
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
      header: "Action",
      key: "action",
      render: (row) => (
        <Button
          size="xs"
          variant="primary"
          onClick={() => onQuery && onQuery(row)}
        >
          {row.action || "Query"}
        </Button>
      )
    }
  ];

  const action = (
    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Counterfactual Evaluation</span>
  );

  return (
    <SectionCard
      title="Next Best Sensor Query"
      icon={Sparkles}
      action={action}
      className="h-full"
    >
      <DataTable columns={columns} data={list} />
    </SectionCard>
  );
}
