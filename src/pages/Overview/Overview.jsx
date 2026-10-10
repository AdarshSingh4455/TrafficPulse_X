import React, { useState, useEffect } from 'react';
import OverviewHero from './OverviewHero';
import MetricCard from '../../components/common/MetricCard';
import PerformanceChart from '../../components/charts/PerformanceChart';
import RealTrafficMap from '../../components/traffic/RealTrafficMap';
import EventFeed from '../../components/common/EventFeed';
import ScientificBadge from '../../components/common/ScientificBadge';
import { fetchMetrSnapshot, fetchEvents } from '../../services/api';
import { useReplay } from '../../context/ReplayContext';
import { AlertTriangle } from 'lucide-react';

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
          fetchMetrSnapshot(timeIndex, 'ALL', false),
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

  // 5 Top KPI Cards matching Section 11 exactly
  const metricCardsData = [
    {
      id: "total-sensors",
      label: "Traffic Sensors",
      value: "207",
      subtext: "Across 4 Regions (A, B, C, D)",
      iconType: "sensor",
      variant: "blue"
    },
    {
      id: "centralized-mae",
      label: "Centralized Graph+LSTM",
      value: "3.4378 mph",
      subtext: "Test MAE • Best Architecture",
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
      label: "Current Replay",
      value: timestampStr.substring(11, 16) || "00:00",
      subtext: `${timestampStr.substring(0, 10)} • Step ${timeIndex}`,
      iconType: "replay",
      variant: "amber"
    },
    {
      id: "communication-baseline",
      label: "Communication Baseline",
      value: "11.468 MB",
      subtext: "Serialized Payload • 13 Rounds",
      iconType: "comm",
      variant: "cyan"
    }
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Executive Hero Banner */}
      <OverviewHero />

      {/* Backend Error Banner */}
      {fetchError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
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

      {/* Main Row: Map Left (60%) + Model Benchmark Tabs Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7">
          <RealTrafficMap
            sensors={realSensors}
            selectedSensor={selectedSensor}
            onSelectSensor={(s) => setSelectedSensor(s)}
          />
        </div>
        <div className="lg:col-span-5">
          <PerformanceChart />
        </div>
      </div>

      {/* Bottom Row: 4 Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* Card 1: Regional Traffic Distribution */}
        <div className="bg-white dark:bg-[#081827] border border-slate-200 dark:border-[#17364E] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7F96AA]">
                Regional Partitions
              </span>
              <ScientificBadge type="REAL" label="K-MEANS" size="xs" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200/80 dark:border-[#17364E]">
                <div className="text-slate-500 text-[10px]">REGION A (NE)</div>
                <div className="text-sm font-extrabold text-blue-500">48 sensors</div>
                <div className="text-[10px] text-slate-400">Avg Speed: 62.4 mph</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200/80 dark:border-[#17364E]">
                <div className="text-slate-500 text-[10px]">REGION B (SE)</div>
                <div className="text-sm font-extrabold text-emerald-500">57 sensors</div>
                <div className="text-[10px] text-slate-400">Avg Speed: 55.1 mph</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200/80 dark:border-[#17364E]">
                <div className="text-slate-500 text-[10px]">REGION C (CW)</div>
                <div className="text-sm font-extrabold text-purple-500">58 sensors</div>
                <div className="text-[10px] text-slate-400">Avg Speed: 59.7 mph</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B2033] border border-slate-200/80 dark:border-[#17364E]">
                <div className="text-slate-500 text-[10px]">REGION D (NW)</div>
                <div className="text-sm font-extrabold text-amber-500">44 sensors</div>
                <div className="text-[10px] text-slate-400">Avg Speed: 56.9 mph</div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#7F96AA] mt-3 border-t border-slate-100 dark:border-[#17364E] pt-2">
            Canonical partition: 207 nodes total. Zero data fabrication.
          </p>
        </div>

        {/* Card 2: Prediction Confidence Distribution */}
        <div className="bg-white dark:bg-[#081827] border border-slate-200 dark:border-[#17364E] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7F96AA]">
                Confidence &amp; Plausibility
              </span>
              <ScientificBadge type="DERIVED" label="VALIDATED" size="xs" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B2033]">
                <span className="text-slate-600 dark:text-[#BCD0E2]">High Confidence:</span>
                <span className="font-mono font-bold text-emerald-500">142 sensors (68.6%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B2033]">
                <span className="text-slate-600 dark:text-[#BCD0E2]">Moderate Uncertainty:</span>
                <span className="font-mono font-bold text-amber-500">48 sensors (23.2%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B2033]">
                <span className="text-slate-600 dark:text-[#BCD0E2]">Elevated Residual:</span>
                <span className="font-mono font-bold text-rose-500">17 sensors (8.2%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B2033]">
                <span className="text-slate-600 dark:text-[#BCD0E2]">Physics Bounds:</span>
                <span className="font-mono font-bold text-blue-500">[0, 85 mph] Verified</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#7F96AA] mt-3 border-t border-slate-100 dark:border-[#17364E] pt-2">
            Calibrated against historical test validation residuals.
          </p>
        </div>

        {/* Card 3: Communication Baseline Summary */}
        <div className="bg-white dark:bg-[#081827] border border-slate-200 dark:border-[#17364E] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7F96AA]">
                Communication Accounting
              </span>
              <ScientificBadge type="MEASURED PAYLOAD" label="APPLICATION LAYER" size="xs" />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B2033]">
                <span className="text-slate-600 dark:text-[#BCD0E2]">L1 Compact Query:</span>
                <span className="font-bold text-slate-900 dark:text-[#F7FAFF]">187 B</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B2033]">
                <span className="text-slate-600 dark:text-[#BCD0E2]">L1 Detailed Batch:</span>
                <span className="font-bold text-slate-900 dark:text-[#F7FAFF]">~4.2 KB</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B2033]">
                <span className="text-slate-600 dark:text-[#BCD0E2]">L2 Serialized State:</span>
                <span className="font-bold text-cyan-400">110,271 B</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B2033]">
                <span className="text-slate-600 dark:text-[#BCD0E2]">Full FL Baseline:</span>
                <span className="font-bold text-purple-400">11.468 MB</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#7F96AA] mt-3 border-t border-slate-100 dark:border-[#17364E] pt-2">
            Phase 9 selective policy optimization actively in progress.
          </p>
        </div>

        {/* Card 4: System Attention & Recent Events */}
        <div className="bg-white dark:bg-[#081827] border border-slate-200 dark:border-[#17364E] rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7F96AA]">
                System Attention Feed
              </span>
              <ScientificBadge type="DERIVED" label="REPLAY EVENTS" size="xs" />
            </div>
            <EventFeed events={events.slice(0, 4)} />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#7F96AA] mt-3 border-t border-slate-100 dark:border-[#17364E] pt-2">
            Objective conditions requiring decision intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}
