import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
  Award
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import {
  fetchPredictionStatus,
  fetchForecast,
  fetchPredictionMetrics,
  fetchPredictionModels
} from '../../services/api';

const REPRESENTATIVE_SENSORS = [
  { id: '773869', name: '773869 (North-East / REGION_C)', region: 'REGION_C' },
  { id: '767541', name: '767541 (Central-West / REGION_B)', region: 'REGION_B' },
  { id: '717447', name: '717447 (Central-West / REGION_B)', region: 'REGION_B' },
  { id: '717816', name: '717816 (North-East / REGION_C)', region: 'REGION_C' },
  { id: '765171', name: '765171 (South-East / REGION_B)', region: 'REGION_B' }
];

export default function Prediction() {
  const [timeIndex, setTimeIndex] = useState(12);
  const [sensorId, setSensorId] = useState('773869');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [modelsData, setModelsData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, fc, mt, md] = await Promise.all([
        fetchPredictionStatus(),
        fetchForecast(timeIndex, sensorId),
        fetchPredictionMetrics(),
        fetchPredictionModels()
      ]);
      setStatus(st);
      setForecastData(fc);
      setMetricsData(mt);
      setModelsData(md);
    } catch (err) {
      console.error('Prediction data load error:', err);
      setError(err.message || 'Failed to connect to Prediction API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeIndex, sensorId]);

  // Format Chart Data for Recharts
  const chartData = forecastData?.sensor?.predictions?.map((p) => ({
    horizon: p.horizonLabel,
    predicted: p.predictedSpeedMph,
    actual: p.actualSpeedMph
  })) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Replay Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Prediction Intelligence
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                Graph+LSTM
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real METR-LA Spatio-Temporal Traffic Forecasting (+5, +15, +30, +60 min)
            </p>
          </div>
        </div>

        {/* Replay Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Replay Index:</span>
            <input
              type="number"
              min="11"
              max="6800"
              value={timeIndex}
              onChange={(e) => setTimeIndex(Math.max(11, parseInt(e.target.value) || 11))}
              className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-center font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <MapPin className="w-4 h-4 text-slate-500" />
            <select
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              {REPRESENTATIVE_SENSORS.map((s) => (
                <option key={s.id} value={s.id}>
                  Sensor {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl p-4 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold">Prediction Intelligence Unavailable</p>
            <p className="text-slate-600 dark:text-amber-200/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selected Model</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            SpatialGraphLSTM
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">26,596 parameters</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overall Benchmark MAE</span>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            3.4378 mph
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Best Centralized Model (METR-LA)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Replay Timestamp</span>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
            {forecastData?.inputEndTimestamp || '2012-03-01T00:55:00'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Time Index {timeIndex}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Target Sensor</span>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            Sensor {sensorId} ({forecastData?.sensor?.regionId || 'REGION_C'})
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Speed: {forecastData?.sensor?.currentSpeedMph ?? '--'} mph
          </span>
        </div>
      </div>

      {/* 4 Horizon Forecast Strip */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Multi-Horizon Real Forecast Strip
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {forecastData?.sensor?.predictions?.map((pred) => (
            <div
              key={pred.horizonLabel}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {pred.horizonLabel}
                </span>
                {pred.absoluteErrorMph !== null && (
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Error: {pred.absoluteErrorMph} mph
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Predicted</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {pred.predictedSpeedMph} <span className="text-xs font-medium text-slate-500">mph</span>
                  </span>
                </div>

                {pred.actualSpeedMph !== null && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Actual</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {pred.actualSpeedMph} <span className="text-xs font-normal text-slate-500">mph</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Forecast Chart & 7-Model Benchmark Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Traffic Trend Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Multi-Horizon Prediction Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparing Graph+LSTM predicted speed against ground truth
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="horizon" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Predicted Speed (Graph+LSTM)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Ground Truth"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Model Benchmark Matrix */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              7-Model Benchmark Matrix
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">
              Raw mph Space
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2 font-medium">Model</th>
                  <th className="py-2 font-medium text-right">Overall MAE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {modelsData?.modelsOverall &&
                  Object.entries(modelsData.modelsOverall).map(([mName, mObj]) => {
                    const isWinner = mName === 'Graph+LSTM';
                    const isHA = mName === 'Historical Average';
                    const maeVal = typeof mObj === 'object' ? mObj.mae : mObj;

                    return (
                      <tr
                        key={mName}
                        className={isWinner ? 'bg-blue-50/50 dark:bg-blue-950/30 font-semibold' : ''}
                      >
                        <td className="py-2.5 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {mName}
                          {isWinner && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500 text-white">
                              BEST OVERALL
                            </span>
                          )}
                          {isHA && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              +60 Winner
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {maeVal?.toFixed(4)} mph
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 italic">
            * Historical Average remains strongest at +60 min (4.1934 mph). Graph+LSTM wins overall (3.4378 mph).
          </p>
        </div>
      </div>

      {/* Region Summary Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-500" />
          Graph+LSTM Region Performance Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsData?.byRegion &&
            Object.entries(metricsData.byRegion).map(([rCode, rObj]) => {
              const labels = {
                REGION_A: 'North-East',
                REGION_B: 'South-East',
                REGION_C: 'Central-West',
                REGION_D: 'North-West'
              };

              return (
                <div
                  key={rCode}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{rCode}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {labels[rCode] || 'Region'}
                    </span>
                  </div>

                  <div className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
                    {rObj.mae} <span className="text-xs font-normal text-slate-500">mph MAE</span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{rObj.sensorCount} sensors</span>
                    <span>MAPE: {rObj.mape}%</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
