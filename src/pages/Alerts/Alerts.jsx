import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  AlertTriangle, 
  Info, 
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ScientificBadge from '../../components/common/ScientificBadge';
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

  const severityBadge = (sev) => {
    if (sev === 'Critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3 h-3" />
          CRITICAL
        </span>
      );
    }
    if (sev === 'Warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          WARNING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
        <Info className="w-3 h-3" />
        INFO
      </span>
    );
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4.5 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              System Attention &amp; Replay Events
            </h1>
            <ScientificBadge type="DERIVED" label="ATTENTION FEED" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Objective derived conditions across METR-LA loop detectors at replay snapshot <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{timestampStr}</span> requiring decision intelligence intervention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            {filteredAlerts.length} Active Events
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs space-y-3">
        {/* Search & Severity Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter events (e.g. 773869, uncertainty, drift)..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Severity:</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeverity(s)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedSeverity === s
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors font-medium ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Feed */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-4 font-semibold">Time</th>
                <th className="py-2.5 px-3 font-semibold">Sensor / Region</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Severity</th>
                <th className="py-2.5 px-4 font-semibold">Summary &amp; Findings</th>
                <th className="py-2.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {alt.timestamp}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                      <span className="text-slate-900 dark:text-white">{alt.sensorId}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-normal">({alt.regionId})</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {alt.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {severityBadge(alt.severity)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-lg">
                      {alt.summary}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={alt.targetRoute}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
                      >
                        <span>{alt.routeLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No matching events found for the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
