import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { ArrowDown, TrendingUp, ChevronRight } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import Tabs from '../common/Tabs';
import { useTheme } from '../../context/ThemeContext';

const systemPerformanceData = [
  { horizon: "+5m", baselineMAE: 2.82, lstmMAE: 2.44 },
  { horizon: "+15m", baselineMAE: 3.50, lstmMAE: 3.09 },
  { horizon: "+30m", baselineMAE: 4.22, lstmMAE: 3.80 },
  { horizon: "+60m", baselineMAE: 5.40, lstmMAE: 4.92 }
];

export default function PerformanceChart() {
  const [activeTab, setActiveTab] = useState("accuracy");
  const { isDark } = useTheme();

  const tabs = [
    { id: "accuracy", label: "MAE (mph)" },
    { id: "comm", label: "Bandwidth Saved" },
    { id: "active", label: "Active Sensors" }
  ];

  const action = (
    <button className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer">
      <span>METR-LA Benchmark</span>
      <ChevronRight className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <SectionCard
      title="Temporal Model Performance (MAE in MPH)"
      icon={TrendingUp}
      action={action}
      className="h-full"
    >
      <div className="flex flex-col justify-between h-full gap-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="flex flex-col lg:flex-row items-center gap-4 flex-1">
          <div className="w-full lg:flex-1 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={systemPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? "#1e293b" : "#e2e8f0"} 
                  vertical={false} 
                />
                <XAxis 
                  dataKey="horizon" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#1e293b' : '#cbd5e1' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  domain={[0, 6]} 
                  ticks={[0, 2, 4, 6]}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#1e293b' : '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: isDark ? '#e2e8f0' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="baselineMAE"
                  name="Last Value Baseline"
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lstmMAE"
                  name="LSTM Temporal Backbone"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0284c7' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-44 bg-blue-50 dark:bg-[#14203a] border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex flex-col justify-center text-center">
            <div className="flex items-center justify-center gap-1 text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mb-1">
              <span>3.56</span>
              <span className="text-xs font-sans text-slate-500 font-normal">mph</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
              Overall Test Set MAE (LSTM Backbone)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 dark:border-slate-500" />
            <span>Last Value Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-sky-500 rounded-full" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">LSTM Backbone</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
