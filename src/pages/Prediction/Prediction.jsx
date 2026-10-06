import React from 'react';
import { TrendingUp, Construction } from 'lucide-react';

export default function Prediction() {
  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-xs dark:shadow-lg transition-colors">
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
        <TrendingUp className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prediction & Forecasts Module</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Multi-horizon (+5m, +15m, +30m, +60m) flow forecasting, uncertainty envelopes, and physics consistency check.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        <Construction className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        <span>Phase 5 Architecture Staged</span>
      </div>
    </div>
  );
}
