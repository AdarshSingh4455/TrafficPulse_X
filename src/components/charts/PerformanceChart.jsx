import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { Trophy, TrendingUp } from 'lucide-react';
import SectionCard from '../common/SectionCard';
import Tabs from '../common/Tabs';
import ScientificBadge from '../common/ScientificBadge';
import { useTheme } from '../../context/ThemeContext';
import { fetchPredictionModels } from '../../services/api';

const DEFAULT_MODELS_DATA = {
  Overall: [
    { name: 'Last Value', mae: 3.9839, isWinner: false },
    { name: 'Historical Avg', mae: 4.1930, isWinner: false },
    { name: 'Linear Reg', mae: 3.9763, isWinner: false },
    { name: 'GRU', mae: 3.5669, isWinner: false },
    { name: 'LSTM', mae: 3.5613, isWinner: false },
    { name: 'Spatial GCN', mae: 5.4604, isWinner: false },
    { name: 'Graph+LSTM', mae: 3.4378, isWinner: true }
  ],
  '+5': [
    { name: 'Last Value', mae: 2.8158, isWinner: false },
    { name: 'Historical Avg', mae: 4.1928, isWinner: false },
    { name: 'Linear Reg', mae: 2.6763, isWinner: false },
    { name: 'GRU', mae: 2.4349, isWinner: false },
    { name: 'LSTM', mae: 2.4372, isWinner: false },
    { name: 'Spatial GCN', mae: 4.7139, isWinner: false },
    { name: 'Graph+LSTM', mae: 2.3648, isWinner: true }
  ],
  '+15': [
    { name: 'Last Value', mae: 3.5045, isWinner: false },
    { name: 'Historical Avg', mae: 4.1928, isWinner: false },
    { name: 'Linear Reg', mae: 3.4026, isWinner: false },
    { name: 'GRU', mae: 3.0976, isWinner: false },
    { name: 'LSTM', mae: 3.0940, isWinner: false },
    { name: 'Spatial GCN', mae: 5.1138, isWinner: false },
    { name: 'Graph+LSTM', mae: 3.0007, isWinner: true }
  ],
  '+30': [
    { name: 'Last Value', mae: 4.2166, isWinner: false },
    { name: 'Historical Avg', mae: 4.1929, isWinner: false },
    { name: 'Linear Reg', mae: 4.2384, isWinner: false },
    { name: 'GRU', mae: 3.8068, isWinner: false },
    { name: 'LSTM', mae: 3.7984, isWinner: false },
    { name: 'Spatial GCN', mae: 5.5939, isWinner: false },
    { name: 'Graph+LSTM', mae: 3.6699, isWinner: true }
  ],
  '+60': [
    { name: 'Last Value', mae: 5.3987, isWinner: false },
    { name: 'Historical Avg', mae: 4.1934, isWinner: true },
    { name: 'Linear Reg', mae: 5.5879, isWinner: false },
    { name: 'GRU', mae: 4.9284, isWinner: false },
    { name: 'LSTM', mae: 4.9156, isWinner: false },
    { name: 'Spatial GCN', mae: 6.4201, isWinner: false },
    { name: 'Graph+LSTM', mae: 4.7158, isWinner: false }
  ]
};

export default function PerformanceChart() {
  const [activeTab, setActiveTab] = useState("Overall");
  const [benchmarkData, setBenchmarkData] = useState(DEFAULT_MODELS_DATA);
  const { isDark } = useTheme();

  useEffect(() => {
    let mounted = true;
    async function loadModels() {
      try {
        const res = await fetchPredictionModels();
        if (mounted && res && res.modelsOverall) {
          const transformed = {
            Overall: Object.entries(res.modelsOverall).map(([k, v]) => ({
              name: k === 'Historical Average' ? 'Historical Avg' : k === 'Linear Regression' ? 'Linear Reg' : k,
              mae: v.mae,
              isWinner: k === 'Graph+LSTM'
            })),
            '+5': Object.entries(res.horizonWinners['+5 min'].allModels).map(([k, mae]) => ({
              name: k === 'Historical Average' ? 'Historical Avg' : k === 'Linear Regression' ? 'Linear Reg' : k,
              mae,
              isWinner: k === res.horizonWinners['+5 min'].winner
            })),
            '+15': Object.entries(res.horizonWinners['+15 min'].allModels).map(([k, mae]) => ({
              name: k === 'Historical Average' ? 'Historical Avg' : k === 'Linear Regression' ? 'Linear Reg' : k,
              mae,
              isWinner: k === res.horizonWinners['+15 min'].winner
            })),
            '+30': Object.entries(res.horizonWinners['+30 min'].allModels).map(([k, mae]) => ({
              name: k === 'Historical Average' ? 'Historical Avg' : k === 'Linear Regression' ? 'Linear Reg' : k,
              mae,
              isWinner: k === res.horizonWinners['+30 min'].winner
            })),
            '+60': Object.entries(res.horizonWinners['+60 min'].allModels).map(([k, mae]) => ({
              name: k === 'Historical Average' ? 'Historical Avg' : k === 'Linear Regression' ? 'Linear Reg' : k,
              mae,
              isWinner: k === res.horizonWinners['+60 min'].winner
            }))
          };
          setBenchmarkData(transformed);
        }
      } catch {
        // Fallback to frozen default
      }
    }
    loadModels();
    return () => { mounted = false; };
  }, []);

  const tabs = [
    { id: "Overall", label: "Overall MAE" },
    { id: "+5", label: "+5 min" },
    { id: "+15", label: "+15 min" },
    { id: "+30", label: "+30 min" },
    { id: "+60", label: "+60 min" }
  ];

  const currentList = benchmarkData[activeTab] || benchmarkData.Overall;
  const currentWinner = currentList.find(m => m.isWinner) || currentList[0];

  return (
    <SectionCard
      title="Model Benchmark Comparison (Test MAE in MPH)"
      icon={TrendingUp}
      action={<ScientificBadge type="MODEL OUTPUT" label="TEST EVALUATION" />}
      className="h-full flex flex-col justify-between"
    >
      <div className="space-y-3">
        {/* Horizon Tabs */}
        <div className="flex items-center justify-between">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-mono">
            <Trophy className="w-3.5 h-3.5" />
            <span>Winner: <strong>{currentWinner.name}</strong> ({currentWinner.mae.toFixed(4)} mph)</span>
          </div>
        </div>

        {/* Bar Chart comparing 7 models */}
        <div className="h-[210px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currentList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? "#1e293b" : "#e2e8f0"} 
                vertical={false} 
              />
              <XAxis 
                dataKey="name" 
                stroke={isDark ? "#94a3b8" : "#64748b"} 
                fontSize={10} 
                tickLine={false}
                axisLine={{ stroke: isDark ? '#1e293b' : '#cbd5e1' }}
              />
              <YAxis 
                stroke={isDark ? "#94a3b8" : "#64748b"} 
                fontSize={10} 
                domain={[0, 7]} 
                ticks={[0, 2, 4, 6]}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#1e293b' : '#cbd5e1' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-900/95 dark:bg-[#0c162c] border border-slate-700 text-white text-xs font-mono shadow-xl backdrop-blur-md space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-slate-100">
                          {data.isWinner && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{data.name}</span>
                        </div>
                        <div className="text-emerald-400 mt-1">MAE: {data.mae.toFixed(4)} mph</div>
                        {data.isWinner && <div className="text-amber-400 text-[10px] mt-0.5">Top Performer</div>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="mae" radius={[4, 4, 0, 0]}>
                {currentList.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isWinner ? '#059669' : (isDark ? '#334155' : '#94a3b8')} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Winner Strip highlighting Overall & +60 split */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              Overall / +5 / +15 / +30: <strong className="text-slate-900 dark:text-white">Graph+LSTM</strong> (3.4378 mph)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              +60 min Horizon: <strong className="text-slate-900 dark:text-white">Historical Avg</strong> (4.1934 mph)
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
