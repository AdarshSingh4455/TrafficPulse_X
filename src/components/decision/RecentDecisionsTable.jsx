import React from 'react';
import { History } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';

const defaultRecentSensorDecisions = [
  {
    time: "18:42:00",
    sensor: "773869",
    score: 0.87,
    decision: "QUERY",
    benefit: "18.0%",
    reason: "Core arterial chokepoint influence"
  },
  {
    time: "18:40:00",
    sensor: "767541",
    score: 0.72,
    decision: "QUERY",
    benefit: "14.0%",
    reason: "Spatial speed disagreement detected"
  },
  {
    time: "18:35:00",
    sensor: "717445",
    score: 0.28,
    decision: "SKIP",
    benefit: "0.0%",
    reason: "Nominal conditions; low query priority"
  }
];

export default function RecentDecisionsTable({ data }) {
  const list = data || defaultRecentSensorDecisions;

  const columns = [
    {
      header: "Time",
      key: "time",
      className: "w-16 font-mono text-slate-500 dark:text-slate-400 text-xs"
    },
    {
      header: "Sensor",
      key: "sensor",
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{row.sensor || row.sensorId}</span>
      )
    },
    {
      header: "Score",
      key: "score",
      render: (row) => (
        <span className="font-mono text-cyan-600 dark:text-cyan-400 text-xs">{row.score || row.needScore || "0.45"}</span>
      )
    },
    {
      header: "Decision",
      key: "decision",
      render: (row) => <StatusBadge status={row.decision ? row.decision.toLowerCase() : 'active'} text={row.decision || 'QUERY'} />
    },
    {
      header: "Benefit",
      key: "benefit",
      render: (row) => (
        <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs">{row.benefit}</span>
      )
    },
    {
      header: "Reason",
      key: "reason",
      className: "text-slate-600 dark:text-slate-400 text-xs"
    }
  ];

  return (
    <SectionCard
      title="Recent Sensor Decisions"
      subtitle="Auditable log of automated query and skip determinations"
      icon={History}
      className="h-full"
    >
      <DataTable columns={columns} data={list} />
    </SectionCard>
  );
}
