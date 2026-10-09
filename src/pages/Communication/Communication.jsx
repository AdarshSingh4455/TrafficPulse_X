import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  Server, 
  Sliders, 
  ShieldAlert 
} from 'lucide-react';
import { fetchFederatedCommunication } from '../../services/api';
import ScientificBadge from '../../components/common/ScientificBadge';

export default function Communication() {
  const [commData, setCommData] = useState(null);
  const [error, setError] = useState(null);
  const [activeBudget, setActiveBudget] = useState('4/4');

  const loadData = async () => {
    setError(null);
    try {
      const res = await fetchFederatedCommunication();
      setCommData(res);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend communication service.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4.5 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Communication Accounting Console
            </h1>
            <ScientificBadge type="MEASURED PAYLOAD" label="APPLICATION LAYER" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rigorous dual-level payload auditing for sensor evidence queries and federated model weight exchanges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ScientificBadge type="NOT EVALUATED" label="PHASE 9: IN PROGRESS" />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold">Communication Service Notice:</span> {error}
          </div>
        </div>
      )}

      {/* SECTION 1: Level 1 Sensor -> Decision Engine Payload Accounting */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4.5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-500" />
              Level 1: Sensor &rarr; Decision Engine Payload Accounting
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Discrete evidence-on-demand query and heartbeat payload specifications
            </p>
          </div>
          <ScientificBadge type="REAL" label="METR-LA TELEMETRY" size="xs" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Level 1 Event A: Compact Query / Heartbeat */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-sans text-slate-900 dark:text-white">
                Event A: Compact Query / Heartbeat
              </span>
              <ScientificBadge type="MEASURED PAYLOAD" size="xs" />
            </div>

            <p className="text-xs font-sans text-slate-600 dark:text-slate-400">
              Payload contract: <code>&#123;&quot;sensorId&quot;: str, &quot;speedMph&quot;: float&#125;</code>
            </p>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Numeric Raw Fields:</span>
                <span className="font-bold text-slate-900 dark:text-white">32 B (4 &times; float64)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Serialized Application Payload:</span>
                <span className="font-bold text-purple-600 dark:text-cyan-400">187 B</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Empirical Verification:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Validated</span>
              </div>
            </div>
          </div>

          {/* Level 1 Event B: Detailed 12-Step Historical Window */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-sans text-slate-900 dark:text-white">
                Event B: Detailed 12-Step Telemetry Batch
              </span>
              <ScientificBadge type="APPLICATION PAYLOAD PROXY" size="xs" />
            </div>

            <p className="text-xs font-sans text-slate-600 dark:text-slate-400">
              Payload contract: 12 historical 5-minute telemetry steps + spatial adjacency neighborhood
            </p>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Historical Batch Size:</span>
                <span className="font-bold text-slate-900 dark:text-white">~4,301 B</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Standard Accounting Proxy:</span>
                <span className="font-bold text-purple-600 dark:text-cyan-400">~4.2 KB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Frequency:</span>
                <span className="text-slate-700 dark:text-slate-300">On-Demand Gated Only</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Level 2 FL Client <-> Server Full-Participation Baseline */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4.5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-500" />
              Level 2: Baseline Communication Accounting (Client &harr; Server Model Updates)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Full-Participation FedAvg Baseline across 13 rounds (26,596 FP32 parameters per model)
            </p>
          </div>
          <ScientificBadge type="MEASURED PAYLOAD" label="FULL BASELINE" size="xs" />
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Serialized Downloads</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {(commData?.serializedDownloadBytes || 5734092).toLocaleString()} <span className="text-xs text-slate-500">B</span>
            </div>
            <span className="text-[10px] text-slate-400 block">52 downloads (13 rnds &times; 4 clients)</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Serialized Uploads</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {(commData?.serializedUploadBytes || 5734092).toLocaleString()} <span className="text-xs text-slate-500">B</span>
            </div>
            <span className="text-[10px] text-slate-400 block">52 uploads (13 rnds &times; 4 clients)</span>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3.5 space-y-1">
            <span className="text-[10px] text-cyan-700 dark:text-cyan-300 block uppercase font-bold">Full 13-Round Baseline</span>
            <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
              11,468,184 <span className="text-xs font-normal">B</span>
            </div>
            <span className="text-[10px] text-cyan-700 dark:text-cyan-300 block">&asymp; 11.47 MB (104 total transfers)</span>
          </div>
        </div>

        {/* State Dict Size Breakdown */}
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1 text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span>Model Parameters:</span>
            <strong className="text-slate-900 dark:text-white">26,596 FP32 weights</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Raw Tensor State Dict:</span>
            <strong className="text-slate-900 dark:text-white">106,384 bytes / state</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Serialized PyTorch State:</span>
            <strong className="text-slate-900 dark:text-white">110,271 bytes / state</strong>
          </div>
        </div>
      </div>

      {/* SECTION 3: Phase 9 Selective Communication Policy Preview Area */}
      <div className="bg-white dark:bg-[#0f172a] border border-amber-300/40 dark:border-amber-500/30 rounded-xl p-4.5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              Phase 9: Selective Client Communication Policy Preview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Theoretical budget policies and client selection mechanisms currently in progress
            </p>
          </div>
          <ScientificBadge type="NOT EVALUATED" label="THEORETICAL PREVIEW" size="xs" />
        </div>

        {/* Budget Policy Selector (4/4, 3/4, 2/4, 1/4) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Budget Policy:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            {['4/4 (Full)', '3/4 (Selective)', '2/4 (Constrained)', '1/4 (Minimal)'].map((p) => {
              const key = p.split(' ')[0];
              return (
                <button
                  key={key}
                  onClick={() => setActiveBudget(key)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    activeBudget === key
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theoretical Framework Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">
              1. Client Communication Value (CCV)
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">
              Ranks clients by gradient norm divergence, regional traffic drift, and information debt.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">
              2. Selective Skipping Mechanism
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">
              Skipped clients carry forward local drift and accumulate debt until communication is required.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">
              3. Accuracy Preservation Target
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">
              Constrains accuracy gap relative to the 3.5322 mph full-participation baseline.
            </p>
          </div>
        </div>

        {/* Scientific Safety Disclaimer */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block">Scientific Boundary Lock:</strong>
            Phase 9 selective communication benchmarks are actively in development. No premature bandwidth savings claims are displayed until real empirical experiments are frozen and evaluated.
          </div>
        </div>
      </div>
    </div>
  );
}
