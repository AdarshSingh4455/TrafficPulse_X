import React from 'react';
import { Grid } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import { heatmapData, heatmapTimeLabels } from '../../data/traffic';

export default function TrafficHeatmap() {
  const getCellColor = (val) => {
    if (val > 2200) return 'bg-rose-500 text-white';
    if (val > 1800) return 'bg-rose-400 text-white';
    if (val > 1400) return 'bg-amber-400 text-slate-900';
    if (val > 1000) return 'bg-amber-300 text-slate-900';
    if (val > 700) return 'bg-emerald-400 text-slate-900';
    return 'bg-emerald-500/30 text-emerald-950 dark:text-emerald-200';
  };

  const action = (
    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Flow (veh/5 min)</span>
  );

  return (
    <SectionCard
      title="Traffic Flow Heatmap"
      icon={Grid}
      action={action}
      className="h-full"
    >
      <div className="flex flex-col justify-between h-full gap-2">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-center text-[11px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left font-semibold text-slate-500 dark:text-slate-400 pb-1 text-[10px] w-12">ID</th>
                {heatmapTimeLabels.map((time, idx) => (
                  <th key={idx} className="font-semibold text-slate-500 dark:text-slate-400 pb-1 text-[10px]">
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => (
                <tr key={row.sensor}>
                  <td className="text-left font-mono font-bold text-slate-700 dark:text-slate-300 py-1 text-[11px]">
                    {row.sensor}
                  </td>
                  {row.values.map((val, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-1.5 px-1 rounded font-mono text-[10px] font-semibold transition-all hover:scale-105 cursor-default ${getCellColor(val)}`}
                      title={`${row.sensor} @ ${heatmapTimeLabels[colIdx]}: ${val} veh/5 min`}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/40" />
            <span>Low (&lt; 800)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400" />
            <span>Moderate (800 - 1500)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" />
            <span>High (&gt; 1500)</span>
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
