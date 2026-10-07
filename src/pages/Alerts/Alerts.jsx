import React from 'react';
import { Bell, Construction } from 'lucide-react';

export default function Alerts() {
  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-xs dark:shadow-lg transition-colors">
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
        <Bell className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Alerts & System Events</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Historical Replay feed for Wake-Up alarms, spatial speed consistency violations, sensor jury disagreements, and stale sensor alerts.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        <Construction className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        <span>Historical Replay Decision Feeds Connected</span>
      </div>
    </div>
  );
}
