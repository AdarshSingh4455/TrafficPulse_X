import React, { useState, useEffect } from 'react';
import OverviewHero from './OverviewHero';
import MetricCard from '../../components/common/MetricCard';
import TrafficNetworkMap from '../../components/traffic/TrafficNetworkMap';
import PerformanceChart from '../../components/charts/PerformanceChart';
import TrafficDistributionChart from '../../components/charts/TrafficDistributionChart';
import CongestionTable from '../../components/common/CongestionTable';
import EventFeed from '../../components/common/EventFeed';
import CoverageCard from '../../components/common/CoverageCard';
import TrafficHeatmap from '../../components/charts/TrafficHeatmap';
import NextQueryTable from '../../components/common/NextQueryTable';
import { metricCardsData } from '../../data/dashboard';
import { mockEvents } from '../../data/events';
import { fetchQueryCandidates, fetchBlindSpots, executeQuery, fetchSensors } from '../../services/api';

import { AlertTriangle } from 'lucide-react';

export default function Overview() {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [candidates, setCandidates] = useState(null);
  const [coverageData, setCoverageData] = useState(null);
  const [sensors, setSensors] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [candRes, covRes, sensRes] = await Promise.all([
          fetchQueryCandidates(),
          fetchBlindSpots(),
          fetchSensors()
        ]);
        if (isMounted) {
          if (candRes) setCandidates(candRes.slice(0, 5));
          if (covRes) setCoverageData(covRes);
          if (sensRes) setSensors(sensRes);
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
    const res = await executeQuery(queryItem.sensor);
    alert(`Evidence-on-Demand Query executed for ${queryItem.sensor}!\nStatus: ${res.status || 'Success'}\nBytes Transferred: ${res.bytesTransferred || queryItem.expectedBytes}\nEstimated Benefit: ${res.expectedBenefit || queryItem.expectedBenefit}`);
  };

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
          <TrafficNetworkMap
            selectedSensor={selectedSensor}
            onSelectSensor={handleSelectSensor}
            sensors={sensors}
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
          <EventFeed events={mockEvents} />
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
