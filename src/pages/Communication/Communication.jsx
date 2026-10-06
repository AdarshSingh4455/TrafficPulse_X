import React from 'react';
import { Layers, Construction } from 'lucide-react';

export default function Communication() {
  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-xs dark:shadow-lg transition-colors">
      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
        <Layers className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Communication Analytics Module</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Dual-level accounting (Level 1: Sensor &rarr; Edge, Level 2: Edge &rarr; Global Server), communication receipts, and bandwidth audit.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        <Construction className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        <span>Phase 7 Architecture Staged</span>
      </div>
    </div>
  );
}
