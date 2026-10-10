import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  Bell,
  ShieldCheck,
  Clock,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ScientificBadge from '../../components/common/ScientificBadge';
import MetricCard from '../../components/common/MetricCard';
import SectionCard from '../../components/common/SectionCard';
import { useReplay } from '../../context/ReplayContext';

const REPLAY_ALERTS = [
  {
    id: 'ALT-101',
    timestamp: '2012-03-01 01:00',
    sensorId: '773869',
    regionId: 'REGION_A',
    category: 'Uncertainty',
    severity: 'Warning',
    summary: 'Residual prediction uncertainty elevated to ±3.82 mph on 60-min horizon.',
    targetRoute: '/predictions',
    routeLabel: 'Inspect Predictions'
  },
  {
    id: 'ALT-102',
    timestamp: '2012-03-01 00:55',
    sensorId: '767541',
    regionId: 'REGION_B',
    category: 'Drift',
    severity: 'Warning',
    summary: 'Temporal traffic speed drift (0.42) exceeds nominal baseline threshold.',
    targetRoute: '/decision',
    routeLabel: 'Open Decision Console'
  },
  {
    id: 'ALT-103',
    timestamp: '2012-03-01 00:50',
    sensorId: '717458',
    regionId: 'REGION_B',
    category: 'Data Quality',
    severity: 'Info',
    summary: '29 loop detector readings masked as zero in historical telemetry snapshot.',
    targetRoute: '/network',
    routeLabel: 'View Sensor Table'
  },
  {
    id: 'ALT-104',
    timestamp: '2012-03-01 00:45',
    sensorId: '765171',
    regionId: 'REGION_D',
    category: 'Physics',
    severity: 'Info',
    summary: 'Physics Gate verified kinematic continuity (step delta 1.8 mph < 25 mph limit).',
    targetRoute: '/decision',
    routeLabel: 'Inspect Physics Gate'
  },
  {
    id: 'ALT-105',
    timestamp: '2012-03-01 00:40',
    sensorId: '717447',
    regionId: 'REGION_C',
    category: 'Query',
    severity: 'Info',
    summary: 'Evidence-on-demand query simulation executed: transferred 187 B application payload.',
    targetRoute: '/communication',
    routeLabel: 'View Communication Accounting'
  },
  {
    id: 'ALT-106',
    timestamp: '2012-03-01 00:30',
    sensorId: 'GLOBAL',
    regionId: 'ALL',
    category: 'FL/System',
    severity: 'Info',
    summary: 'Federated learning validation checkpoint: Round 8 achieved optimal 3.1536 mph MAE.',
    targetRoute: '/federated',
    routeLabel: 'View FL Convergence'
  },
  {
    id: 'ALT-107',
    timestamp: '2012-03-01 00:25',
    sensorId: '717816',
    regionId: 'REGION_C',
    category: 'Blind Spot',
    severity: 'Warning',
    summary: 'Regional coverage deficit flagged: arterial corridor downstream information debt elevated.',
    targetRoute: '/decision',
    routeLabel: 'View Coverage Certificate'
  },
  {
    id: 'ALT-108',
    timestamp: '2012-03-01 00:15',
    sensorId: '773927',
    regionId: 'REGION_A',
    category: 'Uncertainty',
    severity: 'Warning',
    summary: 'Spatial speed inconsistency detected between adjacent sensor nodes (Δ 7.4 mph).',
    targetRoute: '/network',
    routeLabel: 'Inspect Network Map'
  }
];

const CATEGORIES = ['All', 'Uncertainty', 'Drift', 'Data Quality', 'Blind Spot', 'Query', 'Physics', 'FL/System'];
const SEVERITIES = ['All', 'Warning', 'Info', 'Critical'];

export default function Alerts() {
  const { timestampStr } = useReplay();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  const filteredAlerts = useMemo(() => {
    return REPLAY_ALERTS.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        item.sensorId.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term) ||
        item.regionId.toLowerCase().includes(term);

      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSev = selectedSeverity === 'All' || item.severity === selectedSeverity;

      return matchesSearch && matchesCat && matchesSev;
    });
  }, [searchTerm, selectedCategory, selectedSeverity]);

  const alertKPIs = [
    {
      id: "active-events",
      label: "Active Events",
      value: filteredAlerts.length.toString(),
      subtext: "Filtered Snapshot Count",
      iconType: "alert",
      variant: "blue"
    },
    {
      id: "uncertainty-flags",
      label: "High Uncertainty",
      value: "2",
      subtext: "Residual σ > 3.0 mph",
      iconType: "accuracy",
      variant: "amber"
    },
    {
      id: "drift-anomalies",
      label: "High Drift",
      value: "1",
      subtext: "Velocity Delta > 0.35",
      iconType: "sensor",
      variant: "amber"
    },
    {
      id: "blind-spots",
      label: "Blind Spots",
      value: "1",
      subtext: "Corridor Debt Elevated",
      iconType: "layers",
      variant: "purple"
    },
    {
      id: "ground-truth-incidents",
      label: "Verified Incidents",
      value: "Not Available",
      subtext: "METR-LA Telemetry Only",
      iconType: "offline",
      variant: "slate"
    }
  ];

  const severityBadge = (sev) => {
    if (sev === 'Critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          CRITICAL
        </span>
      );
    }
    if (sev === 'Warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          WARNING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
        <Info className="w-3 h-3 text-cyan-400" />
        INFO
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cinematic Header Strip */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#081827] via-[#0B2033] to-[#04101A] border border-slate-200 dark:border-[#17364E] p-5 lg:p-6 shadow-md transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-[#F7FAFF] tracking-tight">
                Alerts &amp; Evidence Timeline
              </h1>
              <ScientificBadge type="DERIVED" label="ATTENTION FEED" />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#BCD0E2] font-medium max-w-2xl">
              Replay-derived events, kinematic anomaly conditions, and evidence query actions across 207 METR-LA sensors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#06111D] border border-[#17364E] font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[#7F96AA]">Replay Time:</span>
              <span className="text-white font-bold">{timestampStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {alertKPIs.map((kpi) => (
          <MetricCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            subtext={kpi.subtext}
            iconType={kpi.iconType}
            variant={kpi.variant}
          />
        ))}
      </div>

      {/* Filter and Search Bar */}
      <SectionCard
        title="Event Filters & Query Criteria"
        subtitle="Filter by sensor ID, regional partition, event category, or severity status"
        icon={Filter}
        action={
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#06111D] border border-[#17364E] text-cyan-400 font-bold">
            {filteredAlerts.length} Matching Events
          </span>
        }
      >
        <div className="space-y-3.5">
          {/* Search & Severity Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#7F96AA] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sensor (e.g. 773869), region, or keyword..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#06111D] border border-[#17364E] rounded-lg text-xs text-[#F7FAFF] placeholder:text-[#7F96AA] focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7F96AA] font-medium">Severity:</span>
              <div className="flex items-center gap-1 bg-[#06111D] p-0.5 rounded-lg border border-[#17364E] text-xs">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeverity(s)}
                    className={`px-2.5 py-1 rounded transition-colors text-xs font-semibold ${
                      selectedSeverity === s
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#BCD0E2] hover:text-white hover:bg-[#17364E]/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-xs text-[#7F96AA] font-medium mr-1 flex items-center gap-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors font-medium text-xs ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-[#06111D] text-[#BCD0E2] hover:text-white hover:bg-[#0B2033] border border-[#17364E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Events Table / Timeline Feed */}
      <SectionCard
        title="Live Attention & Evidence Stream"
        subtitle="Chronological sequence of derived sensor conditions and triggered evidence actions"
        icon={Activity}
      >
        <div className="overflow-x-auto rounded-lg border border-[#17364E]/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#17364E] bg-[#06111D] text-[#7F96AA] font-mono text-[11px]">
                <th className="py-2.5 px-4 font-semibold">Time</th>
                <th className="py-2.5 px-3 font-semibold">Sensor / Partition</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Severity</th>
                <th className="py-2.5 px-4 font-semibold">Summary &amp; Findings</th>
                <th className="py-2.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17364E]/60 bg-[#081827]">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-[#0B2033]/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#7F96AA] whitespace-nowrap">
                      {alt.timestamp}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                      <span className="text-[#F7FAFF]">{alt.sensorId}</span>
                      <span className="text-[10px] text-cyan-400/80 ml-1.5 font-normal">({alt.regionId})</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#06111D] text-[#BCD0E2] border border-[#17364E] font-medium text-[11px]">
                        {alt.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {severityBadge(alt.severity)}
                    </td>
                    <td className="py-3 px-4 text-[#BCD0E2] max-w-lg leading-relaxed">
                      {alt.summary}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={alt.targetRoute}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        <span>{alt.routeLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#7F96AA] text-xs">
                    No matching events found for the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Scientific Boundary Clarification */}
      <div className="p-3.5 rounded-xl bg-[#06111D] border border-[#17364E] text-xs text-[#7F96AA] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white font-bold block">Scientific Telemetry Clarification:</strong>
          <p className="leading-relaxed">
            METR-LA records historical loop-detector speeds (mph) only. Attention events and alerts are derived strictly from empirical prediction residuals, kinematic continuity checks, and spatial graph divergence. No ground-truth traffic accident or emergency tags exist in the raw dataset.
          </p>
        </div>
      </div>
    </div>
  );
}
