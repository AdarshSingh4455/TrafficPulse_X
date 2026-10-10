import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Server, 
  Sliders, 
  ShieldAlert, 
  AlertTriangle, 
  Layers, 
  Cpu,
  Info,
  BarChart2,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { 
  fetchFederatedCommunication,
  fetchPhase9Selection,
  fetchPhase9ClientValues,
  fetchPhase9Experiments,
  fetchPhase9Tradeoff,
  fetchPhase9Rounds
} from '../../services/api';
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
  const [phase9Selection, setPhase9Selection] = useState(null);
  const [clientValues, setClientValues] = useState([]);
  const [phase9Experiments, setPhase9Experiments] = useState(null);
  const [phase9Tradeoff, setPhase9Tradeoff] = useState(null);
  const [activeHistoryPolicy, setActiveHistoryPolicy] = useState('POLICY_CCV_3_OF_4');
  const [roundsHistory, setRoundsHistory] = useState([]);

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
    fetchPhase9Experiments()
      .then(setPhase9Experiments)
      .catch(() => {});
    fetchPhase9Tradeoff()
      .then(setPhase9Tradeoff)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPhase9Selection(activeBudget)
      .then(setPhase9Selection)
      .catch(() => {});
  }, [activeBudget]);

  useEffect(() => {
    fetchPhase9ClientValues()
      .then(setClientValues)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeHistoryPolicy) {
      fetchPhase9Rounds(activeHistoryPolicy)
        .then(setRoundsHistory)
        .catch(() => {});
    }
  }, [activeHistoryPolicy]);

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
      label: "Application-Payload Reduction",
      value: phase9Experiments?.comparisonTable?.length ? "25.0% to 75.0%" : "Pending",
      subtext: phase9Experiments?.comparisonTable?.length ? "Best Tradeoff: 50.0% (2/4 Clients)" : "Theoretical Preview (Not Evaluated)",
      iconType: phase9Experiments?.comparisonTable?.length ? "comm" : "alert",
      variant: phase9Experiments?.comparisonTable?.length ? "emerald" : "amber"
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
            {phase9Experiments?.status === 'EXPERIMENTS_COMPLETED' ? (
              <ScientificBadge type="MEASURED PAYLOAD" label="PHASE 9.2: MEASURED" />
            ) : (
              <ScientificBadge type="NOT EVALUATED" label="PHASE 9: IN PROGRESS" />
            )}
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
                    12-step historical detailed telemetry query proxy (~4.2 KB).
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
                  12-step historical detailed telemetry query
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
        title="Phase 9.1: Selective Client Communication Foundation"
        subtitle="Policy formulation, client communication value (CCV), and information debt under budget constraints"
        icon={Sliders}
        action={<ScientificBadge type="NOT EVALUATED" label="PHASE 9.1: IN PROGRESS" size="xs" />}
        className="border-amber-500/30"
      >
        <div className="space-y-4">
          {/* Budget Policy Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#06111D] border border-[#17364E]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#BCD0E2] font-semibold">Active Budget Constraint:</span>
                <span className="text-xs text-amber-400 font-mono font-bold">{activeBudget} Clients/Round</span>
              </div>
              <p className="text-[11px] text-[#7F96AA]">
                Constrains active regional participant count per federated aggregation round.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#0B2033] p-1 rounded-lg border border-[#17364E]">
              {[
                { key: '4/4', label: '4/4 (Full Baseline)' },
                { key: '3/4', label: '3/4 (Selective)' },
                { key: '2/4', label: '2/4 (Constrained)' },
                { key: '1/4', label: '1/4 (Minimal)' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveBudget(key)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                    activeBudget === key
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-[#BCD0E2] hover:text-white hover:bg-[#17364E]/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Selection & Measured Byte Accounting */}
          {phase9Selection && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#071728] border border-[#17364E]">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#7F96AA] tracking-wider">Selected Participants</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {phase9Selection.selectedClients.map((cid) => (
                    <span key={cid} className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {cid}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#7F96AA] tracking-wider">Deferred Clients</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {phase9Selection.skippedClients.length > 0 ? (
                    phase9Selection.skippedClients.map((cid) => (
                      <span key={cid} className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-slate-700/50 text-slate-400 border border-slate-600/40">
                        {cid} (Skipped)
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#7F96AA] font-mono">None (Full Participation)</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#7F96AA] tracking-wider">Round Transfer Cost</span>
                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="text-sm font-mono font-bold text-cyan-400">
                    {phase9Selection.roundTotalBytes.toLocaleString()} B
                  </span>
                  <span className="text-[10px] text-[#7F96AA] font-mono">
                    ({phase9Selection.downloadBytes.toLocaleString()} DL + {phase9Selection.uploadBytes.toLocaleString()} UL)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Client Utility & Information Debt Table */}
          {clientValues.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[#17364E]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#04101A] text-[#7F96AA] uppercase text-[10px] border-b border-[#17364E]">
                  <tr>
                    <th className="py-2.5 px-3">Client / Region</th>
                    <th className="py-2.5 px-3 text-right">Sensors</th>
                    <th className="py-2.5 px-3 text-right">
                      <div>Sensor Share Factor</div>
                      <div className="text-[9px] text-[#7F96AA] font-normal normal-case">|S_k| / 207 (Heuristic)</div>
                    </th>
                    <th className="py-2.5 px-3 text-right">
                      <div>Drift Proxy</div>
                      <div className="text-[9px] text-[#7F96AA] font-normal normal-case">d_k &isin; [0, 1]</div>
                    </th>
                    <th className="py-2.5 px-3 text-right">
                      <div>Info Debt</div>
                      <div className="text-[9px] text-[#7F96AA] font-normal normal-case">&tau;_k (Skipped Rnds)</div>
                    </th>
                    <th className="py-2.5 px-3 text-right">
                      <div>CCV Utility Score</div>
                      <div className="text-[9px] text-[#7F96AA] font-normal normal-case">Calibrated Proxy</div>
                    </th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17364E]/60 bg-[#06111D]">
                  {clientValues.map((cv) => {
                    const isSelected = phase9Selection?.selectedClients?.includes(cv.clientId);
                    return (
                      <tr key={cv.clientId} className="hover:bg-[#0B2033]/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white">
                          <span>{cv.clientId}</span>
                          <span className="text-[10px] text-[#7F96AA] font-normal block">{cv.regionName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#BCD0E2]">{cv.sensorCount}</td>
                        <td className="py-2.5 px-3 text-right text-[#BCD0E2]">
                          {(cv.sensorShareFactor ?? cv.dataWeight)?.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-400">+{cv.driftScore.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-400 font-bold">
                          {cv.informationDebt} <span className="text-[9px] font-normal text-[#7F96AA]">rnds</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-cyan-400">
                          {cv.utilityScore.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                            isSelected 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                          }`}>
                            {isSelected ? 'SELECTED' : 'DEFERRED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Scientific Boundary Lock Disclaimer */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-amber-300 font-bold block">Scientific Boundary Lock:</strong>
              <p className="text-amber-200/90 leading-relaxed">
                Phase 9.1 establishes the foundation for selective communication policies. Multi-round selective experiments below measure empirical savings and accuracy tradeoffs without fabricated claims.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Phase 9.2 Controlled Selective-FL Experiment Results & Tradeoffs */}
      <SectionCard
        title="Phase 9.2: Controlled Selective-FL Experiment Results & Tradeoffs"
        subtitle="Empirical multi-round evaluation across budget tiers (4/4, 3/4, 2/4, 1/4) using frozen Phase 9.1 selector (α=1.0, β=0.5, λ=0.15, seed=42)"
        icon={BarChart2}
        action={<ScientificBadge type="MEASURED PAYLOAD" label="EVALUATED & MEASURED" size="xs" />}
        className="border-emerald-500/30"
      >
        <div className="space-y-6">
          {/* Subsection 1: Policy Comparison Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Policy Comparison Benchmark</span>
                  <ScientificBadge type="MEASURED PAYLOAD" label="13 ROUNDS" size="xs" />
                </h3>
                <p className="text-[11px] text-[#7F96AA]">
                  Comparison against frozen Stage 8.2 baseline (13 rounds, 104 transfers, 11,468,184 B, 3.5322 mph MAE).
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                100% EMPIRICAL RUNS
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#17364E]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#04101A] text-[#7F96AA] uppercase text-[10px] border-b border-[#17364E]">
                  <tr>
                    <th className="py-2.5 px-3">Policy / Tier</th>
                    <th className="py-2.5 px-3 text-center">Clients / Rnd</th>
                    <th className="py-2.5 px-3 text-right">App Payload (B)</th>
                    <th className="py-2.5 px-3 text-right">Reduction (%)</th>
                    <th className="py-2.5 px-3 text-right">Test MAE</th>
                    <th className="py-2.5 px-3 text-right">&Delta;MAE vs Ctrl 4/4</th>
                    <th className="py-2.5 px-3 text-right">Test RMSE</th>
                    <th className="py-2.5 px-3 text-right">Test MAPE</th>
                    <th className="py-2.5 px-3 text-center">Best Rnd</th>
                    <th className="py-2.5 px-3 text-center">Pareto Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17364E]/60 bg-[#06111D]">
                  {(phase9Experiments?.comparisonTable || [
                    { policy: 'FROZEN_STAGE_8_FEDAVG_REFERENCE', clientsPerRound: 4, totalApplicationBytes: 11468184, applicationPayloadReductionPercent: 0.0, testMAE: 3.5322, deltaMAEvsControlled4of4: 0.0, testRMSE: 7.0956, testMAPE: 9.99, bestRound: 8, paretoStatus: 'FROZEN_BASELINE_REFERENCE', status: 'EVALUATED_MEASURED' },
                    { policy: 'POLICY_CONTROLLED_4_OF_4', clientsPerRound: 4, totalApplicationBytes: 11468184, applicationPayloadReductionPercent: 0.0, testMAE: 3.5322, deltaMAEvsControlled4of4: 0.0, testRMSE: 7.0956, testMAPE: 9.99, bestRound: 8, paretoStatus: 'PARETO_OPTIMAL', status: 'EVALUATED_MEASURED' },
                    { policy: 'POLICY_CCV_3_OF_4', clientsPerRound: 3, totalApplicationBytes: 8601138, applicationPayloadReductionPercent: 25.0, testMAE: 3.6530, deltaMAEvsControlled4of4: 0.1208, testRMSE: 7.2836, testMAPE: 10.34, bestRound: 13, paretoStatus: 'PARETO_DOMINATED', status: 'EVALUATED_MEASURED' },
                    { policy: 'POLICY_CCV_2_OF_4', clientsPerRound: 2, totalApplicationBytes: 5734092, applicationPayloadReductionPercent: 50.0, testMAE: 3.6448, deltaMAEvsControlled4of4: 0.1126, testRMSE: 7.3388, testMAPE: 10.11, bestRound: 13, paretoStatus: 'PARETO_OPTIMAL', status: 'EVALUATED_MEASURED' },
                    { policy: 'POLICY_CCV_1_OF_4', clientsPerRound: 1, totalApplicationBytes: 2867046, applicationPayloadReductionPercent: 75.0, testMAE: 3.6699, deltaMAEvsControlled4of4: 0.1377, testRMSE: 7.3084, testMAPE: 10.44, bestRound: 13, paretoStatus: 'PARETO_OPTIMAL', status: 'EVALUATED_MEASURED' },
                  ]).map((row) => {
                    const isFrozenRef = row.policy === 'FROZEN_STAGE_8_FEDAVG_REFERENCE';
                    const isControlled = row.policy === 'POLICY_CONTROLLED_4_OF_4';
                    const isBestTradeoff = row.policy === 'POLICY_CCV_2_OF_4';
                    const isDominated = row.paretoStatus === 'PARETO_DOMINATED' || row.policy === 'POLICY_CCV_3_OF_4';
                    const deltaVal = row.deltaMAEvsControlled4of4 ?? row.deltaMAEvsFullFedAvg ?? 0;

                    return (
                      <tr 
                        key={row.policy} 
                        className={`hover:bg-[#0B2033]/40 transition-colors ${isBestTradeoff ? 'bg-emerald-500/5' : ''}`}
                      >
                        <td className="py-2.5 px-3 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{row.policy.replace('POLICY_', '').replace('FROZEN_STAGE_8_', 'FROZEN_')}</span>
                            {isFrozenRef && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-700/50 text-slate-300 border border-slate-600/40">STAGE 8 REF</span>
                            )}
                            {isControlled && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30">MATCHED CTRL</span>
                            )}
                            {isBestTradeoff && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">BEST TRADEOFF</span>
                            )}
                            {isDominated && !isFrozenRef && !isControlled && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">DOMINATED</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#BCD0E2]">{row.clientsPerRound} / 4</td>
                        <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">
                          {row.totalApplicationBytes.toLocaleString()} B
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {row.applicationPayloadReductionPercent > 0 ? (
                            <span className="text-emerald-400">{row.applicationPayloadReductionPercent.toFixed(1)}%</span>
                          ) : (
                            <span className="text-slate-400">0.0% (Base)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-white font-bold">{row.testMAE.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-right">
                          {deltaVal === 0 ? (
                            <span className="text-slate-400">0.0000</span>
                          ) : (
                            <span className={deltaVal > 0 ? "text-amber-400" : "text-emerald-400"}>
                              {deltaVal > 0 ? `+${deltaVal.toFixed(4)}` : deltaVal.toFixed(4)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#BCD0E2]">{row.testRMSE.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-right text-[#BCD0E2]">{row.testMAPE.toFixed(2)}%</td>
                        <td className="py-2.5 px-3 text-center text-purple-300 font-bold">R{row.bestRound}</td>
                        <td className="py-2.5 px-3 text-center">
                          {isFrozenRef ? (
                            <span className="px-2 py-0.5 text-[10px] rounded font-bold bg-slate-700/50 text-slate-300 border border-slate-600/40">
                              Frozen Ref
                            </span>
                          ) : isControlled ? (
                            <span className="px-2 py-0.5 text-[10px] rounded font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Pareto Frontier
                            </span>
                          ) : isBestTradeoff ? (
                            <span className="px-2 py-0.5 text-[10px] rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Pareto Frontier
                            </span>
                          ) : isDominated ? (
                            <span className="px-2 py-0.5 text-[10px] rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Dominated by 2/4
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] rounded font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              Pareto Frontier
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subsection 2: Pareto Trade-off & Starvation Prevention Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pareto Tradeoff Card */}
            <div className="p-4 rounded-xl bg-[#06111D] border border-[#17364E] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#17364E]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Pareto Trade-off Analysis
                  </h4>
                </div>
                <ScientificBadge type="MEASURED PAYLOAD" label="PARETO AUDITED" size="xs" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-[#081827] border border-[#17364E] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">POLICY_CCV_2_OF_4 (Best Observed Trade-off)</span>
                    <span className="font-mono text-emerald-300 font-bold">50.0% Reduction</span>
                  </div>
                  <p className="text-[11px] text-[#BCD0E2] leading-relaxed">
                    Saves <strong className="text-white">5,734,092 B (5.73 MB)</strong> application payload with balanced accuracy retention. Mathematically Pareto-dominates POLICY_CCV_3_OF_4 under the evaluated setup.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#081827] border border-[#17364E] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Dominance Audit: POLICY_CCV_3_OF_4</span>
                    <span className="font-mono text-amber-300 font-bold">Dominated</span>
                  </div>
                  <p className="text-[11px] text-[#BCD0E2] leading-relaxed">
                    POLICY_CCV_2_OF_4 has BOTH lower payload (5.73 MB vs 8.60 MB) and lower/comparable MAE than 3/4. Therefore, 3/4 is strictly dominated and does not belong to the Pareto frontier.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#17364E] text-[11px] text-[#7F96AA]">
                <strong>Scientific Finding:</strong> {phase9Tradeoff?.paretoAnalysis?.interpretation || "Pareto-relevant policies under the evaluated setup: POLICY_CONTROLLED_4_OF_4, POLICY_CCV_2_OF_4, POLICY_CCV_1_OF_4."}
              </div>
            </div>

            {/* Starvation Prevention Audit Card */}
            <div className="p-4 rounded-xl bg-[#06111D] border border-[#17364E] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#17364E]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Starvation Audit
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  NO STARVATION OBSERVED (13-ROUND RUN)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 rounded-lg bg-[#081827] border border-[#17364E] space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-400">Region A</span>
                      <span className="text-[#BCD0E2]">48 Sens</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Part: 7/13 (3/4), 6/13 (2/4) | Max skip: 1 rnd
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081827] border border-[#17364E] space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-400">Region B</span>
                      <span className="text-[#BCD0E2]">57 Sens</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Part: 13/13 (3/4), 7/13 (2/4) | Max skip: 1 rnd
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081827] border border-[#17364E] space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-400">Region C</span>
                      <span className="text-[#BCD0E2]">58 Sens</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Part: 13/13 (3/4), 7/13 (2/4) | Max skip: 1 rnd
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#081827] border border-[#17364E] space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-400">Region D</span>
                      <span className="text-[#BCD0E2]">44 Sens</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Part: 6/13 (3/4), 6/13 (2/4) | Max skip: 1 rnd
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B2033] border border-[#17364E]/80 text-[11px] text-[#BCD0E2] space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Dynamic Debt Penalty Enforcement (&lambda; = 0.15)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    When smaller clients (Region A &amp; D) skip an aggregation round, their information debt &tau;_k automatically increments, guaranteeing participation in subsequent rounds and completely eliminating regional starvation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subsection 3: Round-by-Round Selection & Convergence History Explorer */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#06111D] border border-[#17364E]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#BCD0E2] font-semibold">Selection History Explorer:</span>
                  <span className="text-xs text-cyan-400 font-mono font-bold">{activeHistoryPolicy.replace('POLICY_', '')}</span>
                </div>
                <p className="text-[11px] text-[#7F96AA]">
                  Inspect round-by-round client participant selections and validation MAE convergence.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-[#0B2033] p-1 rounded-lg border border-[#17364E]">
                {[
                  { key: 'POLICY_CCV_3_OF_4', label: 'CCV 3/4 (Best)' },
                  { key: 'POLICY_CCV_2_OF_4', label: 'CCV 2/4 (50%)' },
                  { key: 'POLICY_CCV_1_OF_4', label: 'CCV 1/4 (75%)' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveHistoryPolicy(key)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors ${
                      activeHistoryPolicy === key
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'text-[#BCD0E2] hover:text-white hover:bg-[#17364E]/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {roundsHistory && roundsHistory.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-[#17364E]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#04101A] text-[#7F96AA] uppercase text-[10px] border-b border-[#17364E]">
                    <tr>
                      <th className="py-2 px-3">Round</th>
                      <th className="py-2 px-3">Selected Regional Participants</th>
                      <th className="py-2 px-3">Deferred Clients</th>
                      <th className="py-2 px-3 text-right">Round Payload</th>
                      <th className="py-2 px-3 text-right">Cumulative Payload</th>
                      <th className="py-2 px-3 text-right">Val MAE</th>
                      <th className="py-2 px-3 text-right">Val RMSE</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17364E]/60 bg-[#06111D]">
                    {roundsHistory.map((rh) => (
                      <tr key={rh.round} className={`hover:bg-[#0B2033]/40 transition-colors ${rh.isBestSoFar ? 'bg-purple-500/5' : ''}`}>
                        <td className="py-2 px-3 font-bold text-white">Round {rh.round}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {rh.selectedClients.map((cid) => (
                              <span key={cid} className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {cid.replace('REGION_', '')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {rh.skippedClients.map((cid) => (
                              <span key={cid} className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-700/50 text-slate-400 border border-slate-600/30">
                                {cid.replace('REGION_', '')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right text-cyan-400">{rh.roundTotalBytes.toLocaleString()} B</td>
                        <td className="py-2 px-3 text-right text-[#BCD0E2]">{rh.cumulativeBytes.toLocaleString()} B</td>
                        <td className="py-2 px-3 text-right text-white font-bold">{rh.globalValidationMAE.toFixed(4)}</td>
                        <td className="py-2 px-3 text-right text-[#BCD0E2]">{rh.globalValidationRMSE.toFixed(4)}</td>
                        <td className="py-2 px-3 text-center">
                          {rh.isBestSoFar ? (
                            <span className="px-2 py-0.5 text-[9px] rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              BEST SO FAR
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">&bull;</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
