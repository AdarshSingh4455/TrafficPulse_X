import React from 'react';

export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#131d36] p-1 rounded-lg border border-slate-200 dark:border-slate-800/80">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              isActive
                ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/40"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
