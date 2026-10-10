import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import SectionCard from './SectionCard';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';

const defaultCongestionAreas = [
  {
    rank: 1,
    location: "REGION_B (South-East Corridor)",
    currentSpeed: "18.2 mph",
    status: "high"
  },
  {
    rank: 2,
    location: "REGION_D (North-West Chokepoint)",
    currentSpeed: "21.4 mph",
    status: "high"
  },
  {
    rank: 3,
    location: "REGION_C (Central-West Arterial)",
    currentSpeed: "28.5 mph",
    status: "moderate"
  }
];

export default function CongestionTable({ onViewOnMap, data }) {
  const list = data || defaultCongestionAreas;

  const columns = [
    {
      header: "#",
      key: "rank",
      className: "w-8 font-mono text-slate-500 dark:text-slate-400 font-bold"
    },
    {
      header: "Corridor / Region",
      key: "location",
      className: "font-medium text-slate-800 dark:text-slate-200"
    },
    {
      header: "Speed (mph)",
      key: "currentSpeed",
      render: (row) => (row.currentSpeed !== undefined && row.currentSpeed !== null) ? `${row.currentSpeed} mph` : "N/A",
      className: "font-mono font-semibold text-slate-700 dark:text-slate-300 text-right pr-6"
    },
    {
      header: "Status",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  const action = onViewOnMap && (
    <button 
      onClick={onViewOnMap}
      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer"
    >
      <span>View on Map</span>
      <ChevronRight className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <SectionCard
      title="Top Congested Corridors"
      icon={AlertTriangle}
      action={action}
      className="h-full"
    >
      <DataTable columns={columns} data={list} />
    </SectionCard>
  );
}
