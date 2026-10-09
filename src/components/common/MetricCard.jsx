import React from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Layers, 
  TrendingUp, 
  ArrowUp,
  Circle,
  Database
} from 'lucide-react';

export default function MetricCard({ 
  label, 
  value, 
  subtext, 
  isTrendUp, 
  isBullet, 
  variant = 'blue', 
  iconType 
}) {
  const iconConfig = {
    sensor: { Icon: Radio, bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500 dark:text-blue-400" },
    signal: { Icon: Wifi, bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500 dark:text-emerald-400" },
    offline: { Icon: WifiOff, bg: "bg-slate-200 dark:bg-slate-700/20", border: "border-slate-300 dark:border-slate-700/60", text: "text-slate-500 dark:text-slate-400" },
    alert: { Icon: AlertTriangle, bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-500 dark:text-rose-400" },
    layers: { Icon: Layers, bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-500 dark:text-purple-400" },
    accuracy: { Icon: TrendingUp, bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-600 dark:text-cyan-400" },
    database: { Icon: Database, bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-600 dark:text-teal-400" }
  };

  const config = iconConfig[iconType] || iconConfig.sensor;
  const CardIcon = config.Icon;

  return (
    <div className="h-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 hover:-translate-y-0.5 shadow-xs dark:shadow-md dark:shadow-black/30 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${config.bg} ${config.border} ${config.text}`}>
          <CardIcon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white mb-1">
          {value}
        </div>
        {subtext && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {isTrendUp && (
              <span className={`inline-flex items-center font-medium ${
                variant === 'rose' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                <ArrowUp className="w-3 h-3 mr-0.5" />
                {subtext}
              </span>
            )}
            {isBullet && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Circle className={`w-2 h-2 fill-current ${
                  variant === 'emerald' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'
                }`} />
                <span>{subtext}</span>
              </span>
            )}
            {!isTrendUp && !isBullet && (
              <span className="truncate">{subtext}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

