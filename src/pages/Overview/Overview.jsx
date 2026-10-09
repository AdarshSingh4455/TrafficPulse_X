import React, { useState, useEffect } from 'react';
import OverviewHero from './OverviewHero';
import MetricCard from '../../components/common/MetricCard';
import PerformanceChart from '../../components/charts/PerformanceChart';
import RealTrafficMap from '../../components/traffic/RealTrafficMap';
import SensorDetailPanel from '../../components/traffic/SensorDetailPanel';
import EventFeed from '../../components/common/EventFeed';
import ScientificBadge from '../../components/common/ScientificBadge';
import { fetchMetrSnapshot, fetchEvents } from '../../services/api';
import { useReplay } from '../../context/ReplayContext';
import { AlertTriangle, X } from 'lucide-react';

export default function Overview() {
  const { timeIndex, timestampStr } = useReplay();
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [realSensors, setRealSensors] = useState([]);
  const [events, setEvents] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [snapRes, evRes] = await Promise.all([
          fetchMetrSnapshot(timeIndex, 'ALL', true),
          fetchEvents()
        ]);
        if (isMounted) {
          if (snapRes && snapRes.sensors) setRealSensors(snapRes.sensors);
          if (evRes) setEvents(evRes);
          setFetchError(null);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(`Backend connection failed: ${err.message}. Ensure FastAPI server is running on http://127.0.0.1:8000`);
        }
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [timeIndex]);

  const metricCardsData = [
    {
      id: "total-sensors",
      label: "Traffic Sensors",
      value: "207",
      subtext: "Across 4 Regions",
      iconType: "sensor",
      variant: "blue"
    },
    {
      id: "centralized-mae",
      label: "Centralized Graph+LSTM",
      value: "3.4378 mph",
      subtext: "Test MAE • Best Overall",
      iconType: "accuracy",
      variant: "emerald"
    },
    {
      id: "federated-mae",
      label: "Federated Global",
      value: "3.5322 mph",
      subtext: "Test MAE • Round 8 Selected",
      iconType: "layers",
      variant: "purple"
    },
    {
      id: "replay-time",
      label: "Current Replay Time",
      value: timestampStr.substring(11, 16) || "00:00",
      subtext: `${timestampStr.substring(0, 10)} • Step ${timeIndex}`,
      iconType: "signal",
      variant: "cyan"
    },
    {
      id: "dataset-info",
      label: "Dataset Benchmark",
      value: "METR-LA",
      subtext: "2012-03-01 → 06-27 (5-min)",
      iconType: "database",
      variant: "teal"
    }
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Executive Hero */}
      <OverviewHero />

      {/* Backend Error Banner */}
      {fetchError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div className="text-xs font-medium">
            <span className="font-bold">Backend Connection Warning:</span> {fetchError}
          </div>
        </div>
      )}

      {/* Top 5 KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {metricCardsData.map((card) => (
          <MetricCard
            key={card.id}
            label={card.label}
            value={card.value}
            subtext={card.subtext}
            iconType={card.iconType}
            variant={card.variant}
          />
        ))}
      </div>

      {/* Main Row: Map Left (7 cols) + Model Benchmark Tabs Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <RealTrafficMap
            sensors={realSensors}
            selectedSensor={selectedSensor}
            onSelectSensor={(s) => setSelectedSensor(s)}
          />

          {/* Interactive Sensor Telemetry Panel when Selected */}
          {selectedSensor && (
            <div className="relative">
              <button
                onClick={() => setSelectedSensor(null)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                title="Deselect Sensor"
              >
                <X className="w-4 h-4" />
              </button>
              <SensorDetailPanel sensor={selectedSensor} />
            </div>
          )}
        </div>
        <div className="lg:col-span-5">
          <PerformanceChart />
        </div>
      </div>

      {/* Lower Row: Regional Partition Summary + Quality Summary + Attention Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        {/* Regional Partition Cards */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Spatial Partitions (4 Regions)
              </span>
              <ScientificBadge type="REAL" label="K-MEANS CLUSTERS" size="xs" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div className="text-slate-500 text-[10px]">REGION A (North-East)</div>
                <div className="text-base font-bold text-blue-600 dark:text-blue-400">48 sensors</div>
                <div className="text-[10px] text-slate-400">Weight: 0.2291</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div className="text-slate-500 text-[10px]">REGION B (South-East)</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">57 sensors</div>
                <div className="text-[10px] text-slate-400">Weight: 0.2771</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div className="text-slate-500 text-[10px]">REGION C (Central-West)</div>
                <div className="text-base font-bold text-purple-600 dark:text-purple-400">58 sensors</div>
                <div className="text-[10px] text-slate-400">Weight: 0.2795</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <div className="text-slate-500 text-[10px]">REGION D (North-West)</div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400">44 sensors</div>
                <div className="text-[10px] text-slate-400">Weight: 0.2144</div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
            Canonical partition: 207 total nodes. Zero synthetic data injected.
          </p>
        </div>

        {/* Data Quality & Uncertainty Summary */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Data Quality & Assurance
              </span>
              <ScientificBadge type="DERIVED" label="METR-LA QA" size="xs" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-400">Valid Speed Telemetry:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">178 / 207 (86.0%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-400">Masked Null Readings (0 mph):</span>
                <span className="font-mono font-bold text-slate-500">29 / 207 (14.0%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-400">Physics Bound Checks:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">PASSED [0, 85 mph]</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-400">Temporal Resolution:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">5-min Discrete Windows</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
            Sensor telemetry in raw mph. Target tensor raw speed.
          </p>
        </div>

        {/* Attention Events Summary */}
        <div className="lg:col-span-4">
          <EventFeed events={events.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}
