import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import { useTheme } from '../../context/ThemeContext';
import { trafficDistributionData } from '../../data/traffic';

export default function TrafficDistributionChart() {
  const { isDark } = useTheme();

  return (
    <SectionCard
      title="Traffic Flow Distribution"
      icon={PieIcon}
      className="h-full"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 h-full">
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={trafficDistributionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={60}
                paddingAngle={3}
                stroke={isDark ? "#0f172a" : "#ffffff"}
                strokeWidth={2}
              >
                {trafficDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight">32</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sensors</span>
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col gap-2">
          {trafficDistributionData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-slate-900 dark:text-white font-semibold">{item.value}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">({item.percentage})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
