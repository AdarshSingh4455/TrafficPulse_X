import React, { useState } from 'react';
import { Search, ListFilter } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import DataTable from '../common/DataTable';
import StatusBadge from '../common/StatusBadge';

export default function SensorTable({ sensors, selectedSensorId, onSelectSensor }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredSensors = sensors.filter((sensor) => {
    const matchesSearch = 
      sensor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.road.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.sector.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'All' || 
      sensor.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: "ID",
      key: "id",
      render: (row) => (
        <span className={`font-mono font-bold text-xs ${
          selectedSensorId === row.id ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"
        }`}>
          {row.id}
        </span>
      )
    },
    {
      header: "Location",
      key: "road",
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800 dark:text-slate-200 block text-xs">{row.road}</span>
          <span className="text-[10px] text-slate-500">{row.sector}</span>
        </div>
      )
    },
    {
      header: "Status",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Flow",
      key: "flow",
      className: "font-mono text-slate-700 dark:text-slate-300 text-xs"
    },
    {
      header: "Speed",
      key: "speed",
      render: (row) => (
        <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
          {row.speed > 0 ? `${row.speed} km/h` : '0'}
        </span>
      )
    },
    {
      header: "Occupancy",
      key: "occupancy",
      render: (row) => (
        <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
          {row.occupancy}%
        </span>
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
    }
  ];

  const searchAction = (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search sensor (e.g., S05)..."
          className="pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-md text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
      >
        <option value="All">All Status</option>
        <option value="high">High Congestion</option>
        <option value="moderate">Moderate</option>
        <option value="free">Free Flow</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );

  return (
    <SectionCard
      title="Sensor List"
      icon={ListFilter}
      action={searchAction}
      className="h-full"
    >
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredSensors}
          onRowClick={onSelectSensor}
        />
      </div>
    </SectionCard>
  );
}
