import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Activity,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Radio,
  Server,
  Layers,
  ArrowUpRight,
  Database,
  BarChart2,
  Clock,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine
} from 'recharts';

import {
  fetchFederatedStatus,
  fetchFederatedClients,
  fetchFederatedRounds,
  fetchFederatedMetrics,
  fetchFederatedCommunication
} from '../../services/api';

export default function FederatedLearning() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState(null);
  const [clients, setClients] = useState([]);
  const [roundsData, setRoundsData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [commData, setCommData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stRes, clRes, rdRes, mtRes, cmRes] = await Promise.all([
        fetchFederatedStatus(),
        fetchFederatedClients(),
        fetchFederatedRounds(),
        fetchFederatedMetrics(),
        fetchFederatedCommunication()
      ]);
      setStatus(stRes);
      setClients(clRes);
      setRoundsData(rdRes);
      setMetricsData(mtRes);
      setCommData(cmRes);
    } catch (err) {
      console.error('Failed to load federated learning data:', err);
      setError(err.message || 'Failed to connect to backend federated service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading Stage 8.2 Federated Learning Benchmarks...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-2xl mx-auto my-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Federated Service Unavailable</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const chartRounds = roundsData?.roundsHistory || [];
  const bestRound = roundsData?.bestRound || 8;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <GitFork className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Federated Learning Simulation Dashboard
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Full-Participation 4-Client FedAvg Benchmark over Real METR-LA Regional Subgraphs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Validation Selected Global Model (Round {bestRound})</span>
          </div>
        </div>
      </div>

      {/* Top 5 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: FL Model */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>FL Model</span>
            <Cpu className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            Graph+LSTM
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Spatial GCN + Temporal LSTM
          </div>
        </div>

        {/* Card 2: Best Round */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Best Round</span>
            <Layers className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Round {bestRound}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Val MAE: {roundsData?.bestValidationMAE?.toFixed(4) || '3.1536'} mph
          </div>
        </div>

        {/* Card 3: FL Test MAE */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>FL Test MAE</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">
            {metricsData?.overall?.mae?.toFixed(4) || '3.5322'} <span className="text-sm font-normal text-slate-600 dark:text-slate-400">mph</span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            RMSE: {metricsData?.overall?.rmse?.toFixed(4) || '7.0956'} | MAPE: {metricsData?.overall?.mape?.toFixed(2) || '9.99'}%
          </div>
        </div>

        {/* Card 4: Centralized Reference */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Centralized Reference</span>
            <Server className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metricsData?.centralizedReferenceComparison?.centralizedGraphLSTMTestMAE?.toFixed(4) || '3.4378'} <span className="text-sm font-normal text-slate-600 dark:text-slate-400">mph</span>
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            Gap: {metricsData?.centralizedReferenceComparison?.relativeMAEDifferencePercent || '+2.75%'}
          </div>
        </div>

        {/* Card 5: Active Clients */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Active FL Clients</span>
            <Radio className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            4 / 4
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Full-Participation FedAvg
          </div>
        </div>
      </div>

      {/* Regional Clients Panel */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-500" />
            Regional Edge Client Partitions
          </h2>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            207 Disjoint METR-LA Sensors
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {clients.map((c) => (
            <div
              key={c.clientId}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  {c.clientId}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  {c.regionId}
                </span>
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {c.regionName}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {c.sensorCount} Monitored Sensors
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">FedAvg Weight:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(c.aggregationWeight * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Validation Curve & Centralized Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Validation MAE Curve */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-500" />
                Global Validation MAE Progression Across FL Rounds
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Model selection performed strictly on val.npz (Best: Round {bestRound})
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-3 h-3 bg-cyan-500 rounded-full"></span>
              <span className="text-slate-600 dark:text-slate-400">Val MAE (mph)</span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRounds} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="round" stroke="#94a3b8" fontSize={11} label={{ value: 'FL Round', position: 'insideBottomRight', offset: -5, fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={11} unit=" mph" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(val, name, item) => [
                    `${val} mph ${item.payload.round === 13 ? '(External Stall)' : ''}`,
                    'Global Val MAE'
                  ]}
                  labelFormatter={(r) => `Round ${r}`}
                />
                <ReferenceLine y={3.1536} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Best Val MAE: 3.1536 mph', fill: '#10b981', fontSize: 11, position: 'top' }} />
                <Line
                  type="monotone"
                  dataKey="validationMAE"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#06b6d4' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-900 dark:text-white">Note on Round 13 Runtime:</span> Round 13 wall-clock duration includes external system stall/delay (<span className="font-mono">5117.7s</span> vs median normal round <span className="font-mono">306.35s</span>). Validation MAE curve reflects true deterministic model state evaluation.
          </div>
        </div>

        {/* Centralized Comparison & Regional Test Metrics */}
        <div className="space-y-6">
          {/* Comparison Card */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-500" />
              Centralized Reference Comparison
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Centralized Reference Baseline:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">3.4378 mph</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-cyan-700 dark:text-cyan-300">Full-Participation FedAvg:</span>
                <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400">3.5322 mph</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <span className="text-purple-700 dark:text-purple-300">Absolute Difference:</span>
                <span className="font-bold font-mono text-purple-600 dark:text-purple-400">+0.0944 mph (+2.75%)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              The full-participation federated model remains within 2.75% MAE of the frozen centralized reference baseline.
            </div>
          </div>

          {/* Regional Performance Card */}
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Regional Test MAE Breakdown
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-600 dark:text-slate-400 text-[10px]">REGION_A (North-East)</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">2.4446 mph</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-600 dark:text-slate-400 text-[10px]">REGION_B (South-East)</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">4.0770 mph</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-600 dark:text-slate-400 text-[10px]">REGION_C (Central-West)</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">3.4840 mph</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-600 dark:text-slate-400 text-[10px]">REGION_D (North-West)</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">4.0979 mph</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Baseline Section */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-500" />
              Full-Participation Communication Baseline
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Stage 8.2 Application Payload Contracts (26,596 FP32 parameters per model)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
              Application payload only
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
              Protocol overhead excluded
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-1">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Serialized Download (13 Rounds)
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {(commData?.serializedDownloadBytes || 5734092).toLocaleString()} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">bytes</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              Raw Tensor: {(commData?.rawDownloadBytes || 5531968).toLocaleString()} bytes
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-1">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Serialized Upload (13 Rounds)
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {(commData?.serializedUploadBytes || 5734092).toLocaleString()} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">bytes</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              Raw Tensor: {(commData?.rawUploadBytes || 5531968).toLocaleString()} bytes
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 space-y-1">
            <div className="text-xs text-cyan-700 dark:text-cyan-300 font-medium">
              Serialized Total Payload
            </div>
            <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {(commData?.serializedTotalBytes || 11468184).toLocaleString()} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">bytes</span>
            </div>
            <div className="text-[11px] text-cyan-700 dark:text-cyan-300">
              Raw Total: {(commData?.rawTotalBytes || 11063936).toLocaleString()} bytes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
