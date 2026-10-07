import React from 'react';
import { Grid } from 'lucide-react';
import SectionCard from '../common/SectionCard';

const heatmapTimeLabels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

const heatmapData = [
  { sensor: "773869", values: [64.5, 65.2, 58.4, 62.1, 48.5, 61.2] },
  { sensor: "767541", values: [66.8, 67.4, 42.1, 64.5, 38.2, 60.5] },
  { sensor: "767542", values: [65.4, 66.1, 45.8, 63.2, 41.0, 59.8] },
  { sensor: "717445", values: [58.7, 61.5, 32.4, 55.8, 28.2, 52.4] },
  { sensor: "717816", values: [61.2, 63.8, 38.9, 58.1, 35.4, 56.1] },
  { sensor: "765171", values: [54.1, 58.2, 28.5, 51.4, 24.8, 48.9] }
];

export default function TrafficHeatmap() {
  const getCellColor = (val) => {
    if (val < 30.0) return 'bg-rose-500 text-white';
    if (val < 45.0) return 'bg-amber-400 text-slate-900';
    if (val < 55.0) return 'bg-cyan-500/80 text-white';
    return 'bg-emerald-500/40 text-emerald-950 dark:text-emerald-200';
  };

  const action = (
    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Speed (mph)</span>
  );

  return (
    <SectionCard
      title="Sensor Speed Heatmap"
      icon={Grid}
      action={action}
      className="h-full"
    >
      <div className="flex flex-col justify-between h-full gap-2">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-center text-[11px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left font-semibold text-slate-500 dark:text-slate-400 pb-1 text-[10px] w-14">ID</th>
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
                      title={`Sensor ${row.sensor} @ ${heatmapTimeLabels[colIdx]}: ${val} mph`}
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
            <span>Normal (&gt; 55 mph)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400" />
            <span>Reduced (30-55 mph)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" />
            <span>Slow (&lt; 30 mph)</span>
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
