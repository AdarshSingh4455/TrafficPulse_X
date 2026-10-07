import React, { useState, useEffect, useCallback } from 'react';
import RealTrafficMap from '../../components/traffic/RealTrafficMap';
import HistoricalReplayBar from '../../components/traffic/HistoricalReplayBar';
import SensorDetailPanel from '../../components/traffic/SensorDetailPanel';
import SensorTable from '../../components/traffic/SensorTable';
import CoverageCard from '../../components/common/CoverageCard';
import TrafficHeatmap from '../../components/charts/TrafficHeatmap';
import NeedScoreBreakdown from '../../components/decision/NeedScoreBreakdown';
import CounterfactualQueryCard from '../../components/decision/CounterfactualQueryCard';
import EvidenceChain from '../../components/decision/EvidenceChain';
import MetricCard from '../../components/common/MetricCard';
import { 
  fetchNeedScore, 
  fetchCounterfactual, 
  fetchEvidenceChain, 
  executeQuery, 
  fetchBlindSpots,
  fetchMetrSnapshot
} from '../../services/api';
import { Database, AlertTriangle } from 'lucide-react';

export default function TrafficNetwork() {
  const [activeRegion, setActiveRegion] = useState('ALL');
  const [timeIndex, setTimeIndex] = useState(0);
  const [showGraphEdges, setShowGraphEdges] = useState(false);

  const [realSnapshot, setRealSnapshot] = useState(null);
  const [realSensors, setRealSensors] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  const [selectedSensor, setSelectedSensor] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const [needScoreData, setNeedScoreData] = useState(null);
  const [counterfactualData, setCounterfactualData] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [coverageData, setCoverageData] = useState(null);

  const loadRealSnapshot = useCallback(async (tIndex, rId) => {
    try {
      const snap = await fetchMetrSnapshot(tIndex, rId, true);
      if (snap && snap.sensors) {
        setRealSnapshot(snap);
        setRealSensors(snap.sensors);
        setSelectedSensor(prev => {
          if (!prev) return snap.sensors[0];
          const matched = snap.sensors.find(s => s.sensorId === prev.sensorId || s.id === prev.sensorId);
          return matched || snap.sensors[0];
        });
        setFetchError(null);
      }
    } catch (err) {
      console.error("Real snapshot fetch error:", err);
      setFetchError(`Backend API connection failed: ${err.message}. Ensure FastAPI server is running at http://127.0.0.1:8000`);
    }
  }, []);

  useEffect(() => {
    loadRealSnapshot(timeIndex, activeRegion);
  }, [timeIndex, activeRegion, loadRealSnapshot]);

  useEffect(() => {
    let isMounted = true;
    async function loadCoverage() {
      try {
        const cov = await fetchBlindSpots();
        if (isMounted && cov) setCoverageData(cov);
      } catch (err) {
        console.error("Coverage fetch error:", err);
      }
    }
    loadCoverage();
    return () => { isMounted = false; };
  }, []);

  const handleSelectSensor = (sensor) => {
    setSelectedSensor(sensor);
  };

  const handleRegionChange = (regionId) => {
    setActiveRegion(regionId);
  };

  const handleWhySelected = async () => {
    setActiveModal('why-selected');
    if (selectedSensor) {
      const sid = selectedSensor.sensorId || selectedSensor.id || "773869";
      const data = await fetchNeedScore(sid);
      setNeedScoreData(data);
    }
  };

  const handleEvaluateQuery = async () => {
    setActiveModal('counterfactual');
    if (selectedSensor) {
      const sid = selectedSensor.sensorId || selectedSensor.id || "773869";
      const data = await fetchCounterfactual(sid);
      setCounterfactualData(data);
    }
  };

  const handleViewEvidence = async () => {
    setActiveModal('evidence');
    if (selectedSensor) {
      const sid = selectedSensor.sensorId || selectedSensor.id || "773869";
      const data = await fetchEvidenceChain(sid);
      setEvidenceData(data);
    }
  };

  const handleQuerySensor = async (sensor) => {
    const sid = sensor.sensorId || sensor.id;
    const res = await executeQuery(sid);
    alert(`Evidence Query dispatched for ${sensor.displayAlias || sid}!\nTransferred: ${res.bytesTransferred || '4.2 KB'}\nBenefit: ${res.expectedBenefit || '18%'}`);
    loadRealSnapshot(timeIndex, activeRegion);
  };

  const graphEdgeLines = React.useMemo(() => {
    if (!showGraphEdges || !realSensors || realSensors.length === 0) return [];
    const lines = [];
    const sensorPosMap = new Map(realSensors.map(s => [s.sensorId, [s.latitude, s.longitude]]));

    realSensors.forEach(s => {
      if (s.graphNeighbors) {
        s.graphNeighbors.forEach(nbrId => {
          if (sensorPosMap.has(nbrId)) {
            const [toLat, toLon] = sensorPosMap.get(nbrId);
            lines.push({
              fromLat: s.latitude,
              fromLon: s.longitude,
              toLat,
              toLon
            });
          }
        });
      }
    });
    return lines;
  }, [showGraphEdges, realSensors]);

  const networkSummaryMetrics = [
    { id: "total", label: "Total Sensors", value: "207", variant: "blue", iconType: "sensor" },
    { id: "active", label: "Active", value: `${realSnapshot?.activeSensors || 178}`, subtext: "Valid telemetry", isBullet: true, variant: "emerald", iconType: "signal" },
    { id: "inactive", label: "Masked Nulls", value: `${realSnapshot?.inactiveSensors || 29}`, subtext: "Zero values", isBullet: true, variant: "slate", iconType: "offline" },
    { id: "regions", label: "Spatial Regions", value: "4", subtext: "REGION_A..D", isTrendUp: true, variant: "purple", iconType: "layers" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Traffic Network
            </h1>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              <Database className="w-3 h-3" />
              REAL BENCHMARK • METR-LA • HISTORICAL REPLAY
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {networkSummaryMetrics.map((m) => (
            <MetricCard
              key={m.id}
              label={m.label}
              value={m.value}
              subtext={m.subtext}
              isTrendUp={m.isTrendUp}
              isBullet={m.isBullet}
              variant={m.variant}
              iconType={m.iconType}
            />
          ))}
        </div>
      </div>

      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <div className="text-sm font-medium">
            <span className="font-bold">Backend Connection Error:</span> {fetchError}
          </div>
        </div>
      )}

      {/* Historical Replay Clock Bar */}
      {realSnapshot && (
        <HistoricalReplayBar
          timeIndex={timeIndex}
          maxTimeSteps={realSnapshot.totalTimeSteps || 34272}
          timestampStr={realSnapshot.timestamp}
          timeSemantics={realSnapshot.timeSemantics || {}}
          onTimeIndexChange={setTimeIndex}
        />
      )}

      {/* Map & Detail Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <RealTrafficMap
            sensors={realSensors}
            selectedSensor={selectedSensor}
            onSelectSensor={handleSelectSensor}
            activeRegion={activeRegion}
            onRegionChange={handleRegionChange}
            showGraphEdges={showGraphEdges}
            onToggleGraphEdges={() => setShowGraphEdges(!showGraphEdges)}
            graphEdges={graphEdgeLines}
          />
        </div>

        <div className="lg:col-span-4">
          <SensorDetailPanel
            sensor={selectedSensor}
            onWhySelected={handleWhySelected}
            onEvaluateQuery={handleEvaluateQuery}
            onViewEvidence={handleViewEvidence}
            onQuerySensor={handleQuerySensor}
          />
        </div>
      </div>

      {/* Decision Intelligence Modals */}
      {activeModal && (
        <div className="p-4 rounded-xl bg-white dark:bg-[#091122] border border-blue-400/50 dark:border-blue-500/40 shadow-xl dark:shadow-2xl relative transition-colors">
          {activeModal === 'why-selected' && (
            <NeedScoreBreakdown 
              data={needScoreData} 
              onClose={() => setActiveModal(null)} 
            />
          )}
          {activeModal === 'counterfactual' && (
            <CounterfactualQueryCard 
              data={counterfactualData} 
              onClose={() => setActiveModal(null)}
              onExecuteQuery={async (id) => {
                await executeQuery(id);
                alert(`Counterfactual query executed for ${id}`);
                setActiveModal(null);
              }}
            />
          )}
          {activeModal === 'evidence' && (
            <EvidenceChain 
              data={evidenceData} 
              onClose={() => setActiveModal(null)} 
            />
          )}
        </div>
      )}

      {/* Bottom Sensor Table & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <SensorTable
            sensors={realSensors}
            selectedSensorId={selectedSensor?.sensorId || selectedSensor?.id}
            onSelectSensor={handleSelectSensor}
          />
        </div>
        <div className="lg:col-span-3">
          <TrafficHeatmap />
        </div>
        <div className="lg:col-span-3">
          <CoverageCard data={coverageData} />
        </div>
      </div>
    </div>
  );
}
