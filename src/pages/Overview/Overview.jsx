import React, { useState, useEffect } from 'react';
import OverviewHero from './OverviewHero';
import MetricCard from '../../components/common/MetricCard';
import PerformanceChart from '../../components/charts/PerformanceChart';
import TrafficDistributionChart from '../../components/charts/TrafficDistributionChart';
import CongestionTable from '../../components/common/CongestionTable';
import EventFeed from '../../components/common/EventFeed';
import CoverageCard from '../../components/common/CoverageCard';
import TrafficHeatmap from '../../components/charts/TrafficHeatmap';
import NextQueryTable from '../../components/common/NextQueryTable';
import RealTrafficMap from '../../components/traffic/RealTrafficMap';
import { fetchQueryCandidates, fetchBlindSpots, executeQuery, fetchMetrSnapshot, fetchEvents } from '../../services/api';
import { AlertTriangle } from 'lucide-react';

export default function Overview() {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [candidates, setCandidates] = useState(null);
  const [coverageData, setCoverageData] = useState(null);
  const [realSensors, setRealSensors] = useState([]);
  const [events, setEvents] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [candRes, covRes, snapRes, evRes] = await Promise.all([
          fetchQueryCandidates(),
          fetchBlindSpots(),
          fetchMetrSnapshot(0, 'ALL', true),
          fetchEvents()
        ]);
        if (isMounted) {
          if (candRes) setCandidates(candRes.slice(0, 5));
          if (covRes) setCoverageData(covRes);
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
  }, []);

  const handleSelectSensor = (sensor) => {
    setSelectedSensor(sensor);
  };

  const handleQuery = async (queryItem) => {
    const sid = queryItem.sensor || queryItem.sensorId;
    const res = await executeQuery(sid);
    alert(`Evidence-on-Demand Query executed for ${sid}!\nStatus: ${res.status || 'Success'}\nBytes Transferred: ${res.bytesTransferred || queryItem.expectedBytes}\nEstimated Benefit: ${res.expectedBenefit || queryItem.expectedBenefit}`);
  };

  const metricCardsData = [
    {
      id: "total-sensors",
      label: "Total Real Sensors",
      value: "207",
      subtext: "METR-LA benchmark",
      isTrendUp: true,
      variant: "blue",
      iconType: "sensor"
    },
    {
      id: "active-sensors",
      label: "Active Sensors",
      value: "178",
      subtext: "86.0% valid telemetry",
      isBullet: true,
      variant: "emerald",
      iconType: "signal"
    },
    {
      id: "inactive-sensors",
      label: "Masked Nulls",
      value: "29",
      subtext: "14.0% zero values",
      isBullet: true,
      variant: "slate",
      iconType: "offline"
    },
    {
      id: "spatial-regions",
      label: "Spatial Regions",
      value: "4",
      subtext: "KMeans clusters",
      isTrendUp: true,
      variant: "rose",
      iconType: "alert"
    },
    {
      id: "comm-saved",
      label: "Bandwidth Saved",
      value: "78.2%",
      subtext: "Selective communication",
      isTrendUp: true,
      variant: "purple",
      iconType: "layers"
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <OverviewHero />

      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div className="text-sm font-medium">
            <span className="font-bold">Backend Connection Error:</span> {fetchError}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {metricCardsData.map((card) => (
          <MetricCard
            key={card.id}
            label={card.label}
            value={card.value}
            subtext={card.subtext}
            isTrendUp={card.isTrendUp}
            isBullet={card.isBullet}
            variant={card.variant}
            iconType={card.iconType}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <RealTrafficMap
            sensors={realSensors}
            selectedSensor={selectedSensor}
            onSelectSensor={handleSelectSensor}
          />
        </div>
        <div className="lg:col-span-6">
          <PerformanceChart />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4">
          <TrafficDistributionChart />
        </div>
        <div className="lg:col-span-4">
          <CongestionTable />
        </div>
        <div className="lg:col-span-4">
          <EventFeed events={events} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch pt-2">
        <div className="lg:col-span-4">
          <CoverageCard data={coverageData} />
        </div>
        <div className="lg:col-span-4">
          <TrafficHeatmap />
        </div>
        <div className="lg:col-span-4">
          <NextQueryTable onQuery={handleQuery} data={candidates} />
        </div>
      </div>
    </div>
  );
}
