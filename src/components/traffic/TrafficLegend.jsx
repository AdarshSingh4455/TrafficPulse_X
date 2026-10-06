import React from 'react';

export default function TrafficLegend() {
  const items = [
    { label: "Free Flow", color: "bg-emerald-500", type: "dot" },
    { label: "Moderate", color: "bg-amber-500", type: "dot" },
    { label: "High Congestion", color: "bg-rose-500", type: "dot" },
    { label: "Active Sensor", color: "border-emerald-500 dark:border-emerald-400 bg-transparent", type: "ring" },
    { label: "Inactive Sensor", color: "border-slate-400 dark:border-slate-500 bg-transparent", type: "ring" }
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/60">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          {item.type === "dot" ? (
            <span className={`w-2 h-2 rounded-full ${item.color}`} />
          ) : (
            <span className={`w-2.5 h-2.5 rounded-full border-2 ${item.color}`} />
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
