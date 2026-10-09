import React from 'react';
import { TrendingUp, Radio, GitFork, ShieldCheck, Cpu, Database } from 'lucide-react';
import ScientificBadge from '../../components/common/ScientificBadge';

const heroHighlights = [
  {
    id: "predict",
    title: "Multi-Horizon Forecasting",
    description: "Spatio-temporal graph forecasting (+5m to +60m) across METR-LA network.",
    Icon: TrendingUp,
    accent: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
  },
  {
    id: "query",
    title: "Counterfactual Need Gating",
    description: "Evaluates information gain so only vital telemetry is communicated.",
    Icon: Radio,
    accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
  },
  {
    id: "federated",
    title: "Zero-Fabrication Federated Learning",
    description: "4 spatial sub-regions train locally without raw data centralisation.",
    Icon: GitFork,
    accent: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30"
  }
];

export default function OverviewHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0c162c] to-[#0f1d3a] border border-slate-800 p-6 lg:p-7 shadow-xl shadow-black/20 text-white transition-all">
      {/* Decorative Digital Twin Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Heading & System Features */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SMART CITY DIGITAL TWIN
            </span>
            <ScientificBadge type="REAL" label="METR-LA LIVE REPLAY" size="xs" />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Urban Traffic Intelligence <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
              with Communication-Efficient Gating
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
            Sense only vital telemetry. Predict multi-horizon highway speeds across Los Angeles with physics-bounded graph intelligence.
          </p>

          {/* Feature Badge Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {heroHighlights.map((item) => {
              const Icon = item.Icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-colors"
                >
                  <div className={`p-1.5 rounded-lg border flex-shrink-0 ${item.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-400 leading-tight truncate">{item.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Digital Twin Status Card & Visual Graphic */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#070d19]/90 p-5 shadow-2xl space-y-3.5">
            {/* Header Status */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200">DIGITAL TWIN ENGINE</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ACTIVE REPLAY
              </span>
            </div>

            {/* Twin Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <div className="text-[10px] text-slate-400">NETWORK NODES</div>
                <div className="text-base font-bold text-cyan-400">207 Sensors</div>
                <div className="text-[10px] text-slate-500">4 Spatial Regions</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <div className="text-[10px] text-slate-400">BEST MODEL MAE</div>
                <div className="text-base font-bold text-emerald-400">3.4378 mph</div>
                <div className="text-[10px] text-slate-500">Graph+LSTM</div>
              </div>
            </div>

            {/* Vector Highway Connectivity Schema */}
            <div className="relative h-20 w-full rounded-lg bg-[#040812] border border-slate-800/60 overflow-hidden flex items-center justify-center p-2">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 360 80">
                <defs>
                  <linearGradient id="flow1" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <path d="M 10,40 Q 90,10 180,40 T 350,40" stroke="url(#flow1)" strokeWidth="3" fill="none" strokeDasharray="6 3" />
                <path d="M 10,60 Q 90,30 180,60 T 350,20" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.4" />
                <circle cx="30" cy="40" r="4" fill="#06b6d4" />
                <circle cx="120" cy="25" r="4" fill="#10b981" />
                <circle cx="210" cy="45" r="4" fill="#f59e0b" />
                <circle cx="300" cy="35" r="4" fill="#06b6d4" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-between px-4 text-[10px] font-mono text-slate-400 pointer-events-none">
                <span className="flex items-center gap-1"><Database className="w-3 h-3 text-cyan-400" /> METR-LA LA County</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Physics Validated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

