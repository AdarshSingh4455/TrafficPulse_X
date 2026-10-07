import React from 'react';
import { TrendingUp, Radio, GitFork, Quote } from 'lucide-react';

const heroHighlights = [
  {
    id: "predict",
    title: "Predict Traffic Speed",
    description: "Multi-horizon spatio-temporal forecasting (+5m to +60m) across the METR-LA network."
  },
  {
    id: "query",
    title: "Query Only Vital Sensors",
    description: "Counterfactual Need Score gates communication so only vital telemetry is pulled."
  },
  {
    id: "federated",
    title: "Spatio-Temporal Intelligence",
    description: "Regional sub-networks process data locally and communicate with zero data fabrication."
  }
];

export default function OverviewHero() {
  const iconMap = {
    predict: { Icon: TrendingUp, bg: "bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400" },
    query: { Icon: Radio, bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" },
    federated: { Icon: GitFork, bg: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400" }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/60 dark:from-[#0c162c] dark:via-[#0f1d3a] dark:to-[#121c33] border border-slate-200 dark:border-slate-800/80 p-6 lg:p-8 shadow-xs dark:shadow-xl dark:shadow-black/30 transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Smarter Traffic Intelligence <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
              with Less Communication
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
            Sense only what matters. Ask the next best question. Share only what helps.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {heroHighlights.map((item) => {
              const iconStyle = iconMap[item.id] || iconMap.predict;
              const Icon = iconStyle.Icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#14203a] border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs"
                >
                  <div className={`p-1 rounded-md border ${iconStyle.bg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="relative rounded-xl overflow-hidden border border-slate-700/60 bg-[#091124] min-h-[160px] flex items-center p-6 shadow-2xl">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 160">
                <defs>
                  <linearGradient id="stream1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="stream2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path d="M 0,140 Q 150,110 400,20" stroke="url(#stream1)" strokeWidth="6" fill="none" opacity="0.6" />
                <path d="M 0,160 Q 200,120 400,40" stroke="url(#stream1)" strokeWidth="4" fill="none" opacity="0.8" />
                <path d="M 0,20 Q 220,70 400,150" stroke="url(#stream2)" strokeWidth="4" fill="none" opacity="0.7" />
                <rect x="60" y="50" width="25" height="110" fill="#1e293b" opacity="0.5" />
                <rect x="95" y="30" width="35" height="130" fill="#1e293b" opacity="0.6" />
                <rect x="140" y="60" width="30" height="100" fill="#1e293b" opacity="0.4" />
                <rect x="240" y="40" width="40" height="120" fill="#1e293b" opacity="0.5" />
                <rect x="290" y="70" width="30" height="90" fill="#1e293b" opacity="0.4" />
              </svg>
            </div>

            <div className="relative z-10 max-w-sm">
              <Quote className="w-6 h-6 text-blue-400/80 mb-2 rotate-180" />
              <p className="text-base lg:text-lg font-semibold text-slate-100 leading-snug">
                “From raw METR-LA sensor data to intelligent, city-scale traffic foresight.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
