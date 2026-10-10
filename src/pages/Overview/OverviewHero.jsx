import React from 'react';
import { TrendingUp, Radio, Network, Database, Quote } from 'lucide-react';

const FEATURE_PILLS = [
  { id: 'forecast', label: 'Traffic Speed Forecasting', icon: TrendingUp, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { id: 'query', label: 'Query Important Sensors', icon: Radio, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'federated', label: 'Regional Federated Learning', icon: Network, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'accounting', label: 'Communication Accounting', icon: Database, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
];

export default function OverviewHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#081827] via-[#0B2033] to-[#04101A] border border-slate-200 dark:border-[#17364E] p-6 lg:p-7 shadow-lg shadow-black/20 transition-colors">
      {/* Decorative ambient highway line art overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
          <defs>
            <linearGradient id="heroStream1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2F8CFF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#21D4FD" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#9D5CFF" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="heroStream2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2FD994" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#2F8CFF" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M 0,180 Q 300,120 800,40" stroke="url(#heroStream1)" strokeWidth="4" fill="none" />
          <path d="M 0,200 Q 400,140 800,70" stroke="url(#heroStream1)" strokeWidth="2.5" fill="none" opacity="0.6" />
          <path d="M 0,30 Q 350,90 800,170" stroke="url(#heroStream2)" strokeWidth="2.5" fill="none" opacity="0.5" />
        </svg>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Heading, Tagline, Feature Pills */}
        <div className="lg:col-span-8 space-y-3.5">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-slate-900 dark:text-[#F7FAFF] tracking-tight leading-tight">
              Smarter Traffic Intelligence <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-400">
                with Evidence-on-Demand Communication
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#BCD0E2] font-medium leading-relaxed">
              Sense only what matters. Ask the next best question. Share only what helps.
            </p>
          </div>

          {/* 4 Feature Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {FEATURE_PILLS.map((pill) => {
              const Icon = pill.icon;
              return (
                <div
                  key={pill.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-[#081827]/90 border border-slate-200 dark:border-[#17364E] text-xs font-semibold text-slate-700 dark:text-[#F7FAFF] shadow-xs"
                >
                  <span className={`p-1 rounded-md border ${pill.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span>{pill.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Research Statement Card */}
        <div className="lg:col-span-4">
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[#17364E] bg-white/60 dark:bg-[#081827]/80 backdrop-blur-md shadow-md space-y-2">
            <Quote className="w-5 h-5 text-cyan-400 mb-1 rotate-180" />
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-[#F7FAFF] leading-snug">
              "From traffic observations to intelligent evidence selection and collaborative forecasting."
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-[#17364E]/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#7F96AA]">
              <span>Research Console</span>
              <span>METR-LA Replay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
