import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Server, 
  Sliders, 
  ShieldAlert, 
  AlertTriangle, 
  Layers, 
  Cpu,
  Info
} from 'lucide-react';
import { fetchFederatedCommunication } from '../../services/api';
import ScientificBadge from '../../components/common/ScientificBadge';
import MetricCard from '../../components/common/MetricCard';
import SectionCard from '../../components/common/SectionCard';

const REGIONAL_CLIENTS = [
  { id: 'CLIENT_A', name: 'Region A (North-East)', sensors: 48, weight: '0.2291', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  { id: 'CLIENT_B', name: 'Region B (South-East)', sensors: 57, weight: '0.2771', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  { id: 'CLIENT_C', name: 'Region C (Central-West)', sensors: 58, weight: '0.2795', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  { id: 'CLIENT_D', name: 'Region D (North-West)', sensors: 44, weight: '0.2144', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', text: 'text-amber-400' },
];

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

  const commKPIs = [
    {
      id: "l1-compact",
      label: "L1 Compact Query",
      value: "187 B",
      subtext: "Single Sensor / Heartbeat",
      iconType: "comm",
      variant: "cyan"
    },
    {
      id: "l1-detailed",
      label: "L1 Detailed Batch",
      value: "~4.2 KB",
      subtext: "12-Step Window Proxy (4,301 B)",
      iconType: "sensor",
      variant: "blue"
    },
    {
      id: "l2-state",
      label: "L2 Serialized State",
      value: "110,271 B",
      subtext: "26,596 FP32 Model Parameters",
      iconType: "layers",
      variant: "purple"
    },
    {
      id: "full-baseline",
      label: "Full 13-Rnd Baseline",
      value: "11.468 MB",
      subtext: "104 Total Model Transfers",
      iconType: "comm",
      variant: "emerald"
    },
    {
      id: "phase9-savings",
      label: "Phase 9 Bandwidth Reduction",
      value: "Pending",
      subtext: "Theoretical Preview (Not Evaluated)",
      iconType: "alert",
      variant: "amber"
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Cinematic Header Strip */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#081827] via-[#0B2033] to-[#04101A] border border-slate-200 dark:border-[#17364E] p-5 lg:p-6 shadow-md transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Radio className="w-5 h-5" />
              </div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-[#F7FAFF] tracking-tight">
                Communication Analytics Console
              </h1>
              <ScientificBadge type="MEASURED PAYLOAD" label="APPLICATION LAYER" />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#BCD0E2] font-medium max-w-2xl">
              Measure application-level communication across Sensor&rarr;Decision and FL Client&harr;Server layers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              &ldquo;Share only what helps.&rdquo;
            </span>
            <ScientificBadge type="NOT EVALUATED" label="PHASE 9: IN PROGRESS" />
          </div>
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

      {/* Top 5 KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {commKPIs.map((kpi) => (
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

      {/* Pseudo-3D Architecture Topology Diagram */}
      <SectionCard
        title="Application-Level Communication Model"
        subtitle="Two-tier hierarchical architecture: Level 1 on-demand sensor evidence queries & Level 2 regional federated aggregation"
        icon={Layers}
        action={
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#7F96AA]">
              Physical Transport Excluded
            </span>
            <ScientificBadge type="FROZEN" label="HIERARCHICAL TOPOLOGY" size="xs" />
          </div>
        }
      >
        <div className="relative rounded-xl bg-[#06111D] border border-[#17364E]/80 p-5 lg:p-6 overflow-hidden">
          {/* Subtle Ambient Grid Background */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, #17364E 1px, transparent 1px), linear-gradient(to bottom, #17364E 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* LAYER 1: SENSORS */}
            <div className="space-y-3 p-4 rounded-xl bg-[#081827]/90 border border-[#17364E] shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-[#17364E]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tier 1: Telemetry Sensors</h4>
                    <p className="text-[10px] text-[#7F96AA]">207 METR-LA Highway Detectors</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-cyan-300 border border-blue-500/30">
                  207 NODES
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#0B2033] border border-[#17364E]/70 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Event A: Heartbeat / Query</span>
                    <span className="font-mono font-bold text-cyan-300">187 B / req</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Targeted sensor speed telemetry queried on-demand when uncertainty exceeds threshold.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B2033] border border-[#17364E]/70 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Event B: 12-Step Window</span>
                    <span className="font-mono font-bold text-cyan-300">~4,301 B / batch</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Full 1-hour temporal window + graph adjacency context proxy (~4.2 KB).
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#17364E] flex items-center justify-between text-[10px] text-slate-400">
                <span>Protocol: HTTP JSON</span>
                <span className="text-emerald-400 font-semibold">&bull; Evidence On Demand</span>
              </div>
            </div>

            {/* LAYER 2: REGIONAL CLIENTS */}
            <div className="space-y-3 p-4 rounded-xl bg-[#081827]/90 border border-[#17364E] shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-[#17364E]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tier 2: Regional FL Clients</h4>
                    <p className="text-[10px] text-[#7F96AA]">Edge Partition Coordinators</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  4 CLIENTS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {REGIONAL_CLIENTS.map((rc) => (
                  <div key={rc.id} className={`p-2 rounded-lg bg-gradient-to-br ${rc.color} border ${rc.border} space-y-0.5`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-white">{rc.id.replace('CLIENT_', 'Client ')}</span>
                      <span className={`font-mono text-[10px] font-bold ${rc.text}`}>{rc.sensors} det.</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Weight:</span>
                      <span className="font-mono text-slate-300">{rc.weight}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-lg bg-[#0B2033] border border-[#17364E]/70 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Regional Model State:</span>
                  <span className="font-mono font-bold text-purple-300">110,271 B / transfer</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Serialized PyTorch state dict (26,596 FP32 parameters) uploaded each round.
                </p>
              </div>

              <div className="pt-2 border-t border-[#17364E] flex items-center justify-between text-[10px] text-slate-400">
                <span>FedAvg Coordination</span>
                <span className="text-purple-400 font-semibold">&bull; 4 Synchronous Nodes</span>
              </div>
            </div>

            {/* LAYER 3: GLOBAL SERVER */}
            <div className="space-y-3 p-4 rounded-xl bg-[#081827]/90 border border-[#17364E] shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-[#17364E]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tier 3: Global FL Server</h4>
                    <p className="text-[10px] text-[#7F96AA]">Central Aggregator Node</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  1 SERVER
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#0B2033] border border-[#17364E]/70 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Model Architecture:</span>
                    <span className="font-mono font-bold text-emerald-300">Graph+LSTM</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Trainable Weights:</span>
                    <span className="font-mono font-bold text-white">26,596 FP32</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B2033] border border-[#17364E]/70 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">13-Round Transfers:</span>
                    <span className="font-mono font-bold text-emerald-300">104 Total</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>52 Uploads + 52 Downloads</span>
                    <span className="font-mono text-emerald-400 font-bold">11.468 MB Total</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#17364E] flex items-center justify-between text-[10px] text-slate-400">
                <span>Checkpoint: Round 8</span>
                <span className="text-emerald-400 font-semibold">&bull; Val MAE 3.1536 mph</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Baseline Communication Composition Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Level 1 Details */}
        <SectionCard
          title="Level 1: Sensor &rarr; Decision Engine Payload Accounting"
          subtitle="Discrete evidence-on-demand query and heartbeat payload specifications"
          icon={Radio}
          action={<ScientificBadge type="REAL" label="METR-LA TELEMETRY" size="xs" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Event A */}
              <div className="bg-[#06111D] border border-[#17364E] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F7FAFF]">Event A: Compact Query</span>
                  <ScientificBadge type="MEASURED PAYLOAD" size="xs" />
                </div>
                <p className="text-[11px] text-[#7F96AA]">
                  Single-sensor snapshot: <code className="text-cyan-300">&#123;&quot;sensorId&quot;, &quot;speedMph&quot;&#125;</code>
                </p>
                <div className="pt-2 border-t border-[#17364E]/80 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7F96AA]">Numeric Raw:</span>
                    <span className="text-[#F7FAFF] font-bold">32 B (4 &times; float64)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7F96AA]">Serialized Payload:</span>
                    <span className="text-cyan-400 font-bold">187 B</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7F96AA]">Empirical Verification:</span>
                    <span className="text-emerald-400 font-bold">100% Validated</span>
                  </div>
                </div>
              </div>

              {/* Event B */}
              <div className="bg-[#06111D] border border-[#17364E] rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F7FAFF]">Event B: Detailed Window</span>
                  <ScientificBadge type="APPLICATION PAYLOAD PROXY" size="xs" />
                </div>
                <p className="text-[11px] text-[#7F96AA]">
                  12 historical steps + spatial graph adjacency context
                </p>
                <div className="pt-2 border-t border-[#17364E]/80 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7F96AA]">Historical Batch:</span>
                    <span className="text-[#F7FAFF] font-bold">~4,301 B</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7F96AA]">Accounting Proxy:</span>
                    <span className="text-cyan-400 font-bold">~4.2 KB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7F96AA]">Invocation Rule:</span>
                    <span className="text-purple-400 font-bold">On-Demand Only</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0B2033] border border-[#17364E]/80 text-xs text-[#BCD0E2] flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Evidence-on-demand policy prevents continuous streaming of 207 sensors, polling only when residual uncertainty or drift exceeds dynamic threshold.
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Level 2 Baseline Accounting */}
        <SectionCard
          title="Level 2: Baseline Communication Accounting (Client ↔ Server Updates)"
          subtitle="Full-Participation FedAvg across 13 rounds (26,596 FP32 parameters per client)"
          icon={Server}
          action={<ScientificBadge type="MEASURED PAYLOAD" label="FULL BASELINE" size="xs" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 font-mono">
              <div className="p-3 rounded-xl bg-[#06111D] border border-[#17364E] space-y-1">
                <span className="text-[10px] text-[#7F96AA] block uppercase font-bold">Serialized Downloads</span>
                <div className="text-lg font-bold text-[#F7FAFF]">
                  {(commData?.serializedDownloadBytes || 5734092).toLocaleString()} <span className="text-xs text-slate-500">B</span>
                </div>
                <span className="text-[10px] text-slate-500 block">52 downloads (13 &times; 4)</span>
              </div>

              <div className="p-3 rounded-xl bg-[#06111D] border border-[#17364E] space-y-1">
                <span className="text-[10px] text-[#7F96AA] block uppercase font-bold">Serialized Uploads</span>
                <div className="text-lg font-bold text-[#F7FAFF]">
                  {(commData?.serializedUploadBytes || 5734092).toLocaleString()} <span className="text-xs text-slate-500">B</span>
                </div>
                <span className="text-[10px] text-slate-500 block">52 uploads (13 &times; 4)</span>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
                <span className="text-[10px] text-cyan-400 block uppercase font-bold">13-Round Total</span>
                <div className="text-lg font-bold text-cyan-300">
                  11,468,184 <span className="text-xs font-normal">B</span>
                </div>
                <span className="text-[10px] text-cyan-400/80 block">&asymp; 11.47 MB baseline</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#06111D] border border-[#17364E] text-xs font-mono space-y-1.5 text-[#BCD0E2]">
              <div className="flex items-center justify-between">
                <span className="text-[#7F96AA]">Model Architecture Parameters:</span>
                <strong className="text-white">26,596 FP32 weights</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7F96AA]">Raw Tensor State Dict:</span>
                <strong className="text-white">106,384 bytes / state</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7F96AA]">Serialized PyTorch State:</span>
                <strong className="text-white">110,271 bytes / state</strong>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Phase 9 Selective Communication Policy Preview */}
      <SectionCard
        title="Phase 9: Selective Client Communication Policy Preview"
        subtitle="Theoretical budget policies and client selection mechanisms currently in development"
        icon={Sliders}
        action={<ScientificBadge type="NOT EVALUATED" label="THEORETICAL PREVIEW" size="xs" />}
        className="border-amber-500/30"
      >
        <div className="space-y-4">
          {/* Budget Policy Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#06111D] border border-[#17364E]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#BCD0E2] font-semibold">Budget Policy Formulation:</span>
              <span className="text-xs text-amber-400 font-mono font-bold">{activeBudget} Selected Clients/Round</span>
            </div>

            <div className="flex items-center gap-1 bg-[#0B2033] p-1 rounded-lg border border-[#17364E]">
              {['4/4 (Full)', '3/4 (Selective)', '2/4 (Constrained)', '1/4 (Minimal)'].map((p) => {
                const key = p.split(' ')[0];
                return (
                  <button
                    key={key}
                    onClick={() => setActiveBudget(key)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                      activeBudget === key
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-[#BCD0E2] hover:text-white hover:bg-[#17364E]/50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theoretical Framework Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#06111D] border border-[#17364E] space-y-1.5">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
                1. Client Communication Value (CCV)
              </span>
              <p className="text-[#BCD0E2] text-xs leading-relaxed">
                Ranks clients by gradient norm divergence, regional traffic drift, and information debt to prioritize high-value updates.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#06111D] border border-[#17364E] space-y-1.5">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
                2. Selective Skipping Mechanism
              </span>
              <p className="text-[#BCD0E2] text-xs leading-relaxed">
                Skipped clients carry forward local drift and accumulate debt until communication is required, avoiding redundant weight transfers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#06111D] border border-[#17364E] space-y-1.5">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
                3. Accuracy Preservation Target
              </span>
              <p className="text-[#BCD0E2] text-xs leading-relaxed">
                Constrains accuracy gap relative to the 3.5322 mph full-participation baseline to guarantee scientific reliability.
              </p>
            </div>
          </div>

          {/* Scientific Boundary Lock Disclaimer */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-amber-300 font-bold block">Scientific Boundary Lock:</strong>
              <p className="text-amber-200/90 leading-relaxed">
                Phase 9 selective communication benchmarks are actively in development. No premature bandwidth savings claims are displayed until real empirical experiments are frozen and evaluated against the verified 11.468 MB baseline.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
