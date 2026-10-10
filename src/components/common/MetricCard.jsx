import React from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Layers, 
  TrendingUp, 
  Clock, 
  Database,
  ArrowUp,
  Circle
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
    sensor: { Icon: Radio, bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500 dark:text-cyan-400" },
    accuracy: { Icon: TrendingUp, bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500 dark:text-emerald-400" },
    layers: { Icon: Layers, bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-500 dark:text-purple-400" },
    replay: { Icon: Clock, bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500 dark:text-amber-400" },
    comm: { Icon: Database, bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-500 dark:text-cyan-400" },
    signal: { Icon: Wifi, bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500 dark:text-blue-400" },
    alert: { Icon: AlertTriangle, bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-500 dark:text-rose-400" },
    database: { Icon: Database, bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-500 dark:text-teal-400" },
    offline: { Icon: WifiOff, bg: "bg-slate-200 dark:bg-slate-800", border: "border-slate-300 dark:border-slate-700", text: "text-slate-500 dark:text-slate-400" }
  };

  const config = iconConfig[iconType] || iconConfig.sensor;
  const CardIcon = config.Icon;

  return (
    <div className="bg-white dark:bg-[#081827] border border-slate-200 dark:border-[#17364E] rounded-xl p-4 sm:p-4.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-[#24506D] hover:-translate-y-0.5 transition-all duration-200 shadow-xs dark:shadow-md dark:shadow-black/25">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-[#7F96AA] tracking-tight">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${config.bg} ${config.border} ${config.text} shadow-xs`}>
          <CardIcon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-2xl sm:text-[26px] font-extrabold font-mono tracking-tight text-slate-900 dark:text-[#F7FAFF] mb-1 tabular-nums">
          {value}
        </div>
        {subtext && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#BCD0E2] font-medium">
            {isTrendUp && (
              <span className={`inline-flex items-center font-bold ${
                variant === 'rose' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                <ArrowUp className="w-3 h-3 mr-0.5" />
                {subtext}
              </span>
            )}
            {isBullet && (
              <span className="inline-flex items-center gap-1.5">
                <Circle className={`w-2 h-2 fill-current ${
                  variant === 'emerald' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'
                }`} />
                {subtext}
              </span>
            )}
            {!isTrendUp && !isBullet && (
              <span>{subtext}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
