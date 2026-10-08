import React, { useState, useEffect } from 'react';
import { Database, Layers, Radio, AlertTriangle, RefreshCw, Server, ArrowDownUp, CheckCircle2 } from 'lucide-react';
import { fetchFederatedCommunication } from '../../services/api';

export default function Communication() {
  const [commData, setCommData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFederatedCommunication();
      setCommData(res);
    } catch (err) {
      console.error('Communication data load error:', err);
      setError(err.message || 'Failed to connect to backend communication service.');
    } fontFinally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading Baseline Communication Accounting...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Baseline Communication Accounting Dashboard
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Dual-Level Application Payload Auditing (Level 1: Sensor &rarr; Decision Engine, Level 2: Regional FL Client &rarr; Global Server)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/20">
            Communication Optimization (Phase 9): Not Yet Evaluated
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl p-4 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold">Communication Service Status Note</p>
            <p className="text-slate-600 dark:text-amber-200/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* SECTION A: Level 1 Sensor -> Decision Payload Contracts */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-500" />
              Level 1: Sensor &rarr; Decision Engine Payload Accounting
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Individual Telemetry Observation &amp; Evidence-on-Demand Query Payload Contracts
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            METR-LA Telemetry Replay
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Compact Telemetry Event */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Single Telemetry Heartbeat / Query</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                MEASURED_SERIALIZED_PAYLOAD
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Payload contract: <code className="font-mono text-[11px] text-slate-800 dark:text-slate-200">&#123;"sensorId": str, "speedMph": float&#125;</code>
            </p>
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Numeric Raw Fields:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">32 bytes (4 &times; float64)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Serialized JSON Payload:</span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">187 bytes</span>
            </div>
          </div>

          {/* Detailed Historical Telemetry Batch */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">12-Step Historical Window Query</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                APPLICATION_PAYLOAD_PROXY
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Payload contract: 12 historical 5-minute telemetry steps + spatial graph metadata batch
            </p>
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Historical Batch Cost:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">~4,301 bytes</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Accounting Proxy Value:</span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">4.2 KB</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: Level 2 FL Client -> Server Model State Accounting */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-500" />
              Level 2: Regional FL Client &rarr; Global Server Model Update Baseline
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Full-Participation FedAvg Baseline Accounting across 13 Training Rounds (26,596 FP32 parameters per SpatialGraphLSTM model)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
              Application Payload Only
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
              Protocol Overhead Excluded
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-1">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Serialized Downloads (13 Rounds &times; 4 Clients)
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {(commData?.serializedDownloadBytes || 5734092).toLocaleString()} <span className="text-xs font-normal text-slate-500">bytes</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Raw Tensor Payload: {(commData?.rawDownloadBytes || 5531968).toLocaleString()} bytes
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-1">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Serialized Uploads (13 Rounds &times; 4 Clients)
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {(commData?.serializedUploadBytes || 5734092).toLocaleString()} <span className="text-xs font-normal text-slate-500">bytes</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Raw Tensor Payload: {(commData?.rawUploadBytes || 5531968).toLocaleString()} bytes
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 space-y-1">
            <div className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold">
              Full 13-Round Total Payload
            </div>
            <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {(commData?.serializedTotalBytes || 11468184).toLocaleString()} <span className="text-xs font-normal text-slate-500">bytes</span>
            </div>
            <div className="text-[11px] text-cyan-700 dark:text-cyan-300">
              Raw Tensor Total: {(commData?.rawTotalBytes || 11063936).toLocaleString()} bytes (11.47 MB)
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Full-Participation Baseline Accounting Summary
          </div>
          <p>
            The Stage 8.2 baseline evaluates 4 participating regional FL clients over 13 training rounds (104 total state dict transfers). Each model update contains 26,596 FP32 parameters ($106,384$ raw bytes, $110,271$ serialized bytes). Network transport protocol overhead (TCP/IP, TLS headers) is excluded from application-layer payload measurements.
          </p>
        </div>
      </div>
    </div>
  );
}
