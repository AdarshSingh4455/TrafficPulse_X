import React, { useState, useEffect, useCallback } from 'react';
import RealTrafficMap from '../../components/traffic/RealTrafficMap';
import HistoricalReplayBar from '../../components/traffic/HistoricalReplayBar';
import TrafficNetworkMap from '../../components/traffic/TrafficNetworkMap';
import SensorDetailPanel from '../../components/traffic/SensorDetailPanel';
import SensorTable from '../../components/traffic/SensorTable';
import CoverageCard from '../../components/common/CoverageCard';
import TrafficHeatmap from '../../components/charts/TrafficHeatmap';
import NeedScoreBreakdown from '../../components/decision/NeedScoreBreakdown';
import CounterfactualQueryCard from '../../components/decision/CounterfactualQueryCard';
import EvidenceChain from '../../components/decision/EvidenceChain';
import MetricCard from '../../components/common/MetricCard';
import { mockSensors } from '../../data/sensors';
import { networkSummaryMetrics } from '../../data/network';
import { 
  fetchSensors, 
  fetchNeedScore, 
  fetchCounterfactual, 
  fetchEvidenceChain, 
  executeQuery, 
  fetchBlindSpots,
  fetchMetrSnapshot,
  fetchMetrSensor,
  fetchMetrRegions
} from '../../services/api';
import { Layers, Database, ShieldAlert, Activity } from 'lucide-react';

export default function TrafficNetwork() {
  const [dataMode, setDataMode] = useState('REAL'); // 'REAL' | 'DEMO'
  const [activeRegion, setActiveRegion] = useState('ALL'); // 'ALL' | 'REGION_A' | 'REGION_B' | 'REGION_C' | 'REGION_D'
  const [timeIndex, setTimeIndex] = useState(0);
  const [showGraphEdges, setShowGraphEdges] = useState(false);

  const [realSnapshot, setRealSnapshot] = useState(null);
  const [realSensors, setRealSensors] = useState([]);
  const [demoSensors, setDemoSensors] = useState(mockSensors);
  
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  
  const [needScoreData, setNeedScoreData] = useState(null);
  const [counterfactualData, setCounterfactualData] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [coverageData, setCoverageData] = useState(null);

  // Load Real METR-LA snapshot telemetry
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
      } else {
        // Fallback to DEMO mode if REAL backend fails
        setDataMode('DEMO');
      }
    } catch (err) {
      console.error("Real snapshot fetch error:", err);
      setDataMode('DEMO');
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (dataMode === 'REAL') {
        await loadRealSnapshot(timeIndex, activeRegion);
      } else {
        const [sens, cov] = await Promise.all([fetchSensors(), fetchBlindSpots()]);
        if (isMounted) {
          if (sens && sens.length > 0) {
            setDemoSensors(sens);
            setSelectedSensor(prev => sens.find(s => s.id === prev?.id) || sens[0]);
          }
          if (cov) setCoverageData(cov);
        }
      }
    }
    init();
    return () => { isMounted = false; };
  }, [dataMode, activeRegion, loadRealSnapshot]);

  // Handle replay time changes
  useEffect(() => {
    if (dataMode === 'REAL') {
      loadRealSnapshot(timeIndex, activeRegion);
    }
  }, [timeIndex, activeRegion, dataMode, loadRealSnapshot]);

  const handleSelectSensor = async (sensor) => {
    setSelectedSensor(sensor);
  };

  const handleModeSwitch = (mode) => {
    setDataMode(mode);
    if (mode === 'REAL') {
      loadRealSnapshot(timeIndex, activeRegion);
    } else {
      setSelectedSensor(demoSensors[0]);
    }
  };

  const handleRegionChange = (regionId) => {
    setActiveRegion(regionId);
  };

  const handleWhySelected = async () => {
    setActiveModal('why-selected');
    if (selectedSensor) {
      const sid = selectedSensor.sensorId || selectedSensor.id || "S05";
      const data = await fetchNeedScore(sid);
      setNeedScoreData(data);
    }
  };

  const handleEvaluateQuery = async () => {
    setActiveModal('counterfactual');
    if (selectedSensor) {
      const sid = selectedSensor.sensorId || selectedSensor.id || "S05";
      const data = await fetchCounterfactual(sid);
      setCounterfactualData(data);
    }
  };

  const handleViewEvidence = async () => {
    setActiveModal('evidence');
    if (selectedSensor) {
      const sid = selectedSensor.sensorId || selectedSensor.id || "S05";
      const data = await fetchEvidenceChain(sid);
      setEvidenceData(data);
    }
  };

  const handleQuerySensor = async (sensor) => {
    const sid = sensor.sensorId || sensor.id;
    const res = await executeQuery(sid);
    alert(`Evidence-on-Demand Query dispatched for ${sensor.displayAlias || sid}!\nTransferred: ${res.bytesTransferred || '4.2 KB'}\nBenefit: ${res.expectedBenefit || '18%'}`);
    if (dataMode === 'REAL') {
      loadRealSnapshot(timeIndex, activeRegion);
    } else {
      const updated = await fetchSensors();
      if (updated) {
        setDemoSensors(updated);
        setSelectedSensor(updated.find(s => s.id === sid) || sensor);
      }
    }
  };

  // Build graph connection polylines for representative map
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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Data Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Traffic Network
            </h1>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => handleModeSwitch('REAL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dataMode === 'REAL'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Real METR-LA
              </button>
              <button
                onClick={() => handleModeSwitch('DEMO')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  dataMode === 'DEMO'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Demo (32-Sensors)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
              dataMode === 'REAL'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
            }`}>
              <Database className="w-3 h-3" />
              {dataMode === 'REAL' ? 'REAL BENCHMARK • METR-LA • HISTORICAL REPLAY' : 'SIMULATED DEMO • 32-SENSOR NETWORK'}
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

      {/* Historical Replay Clock Bar (REAL mode only) */}
      {dataMode === 'REAL' && realSnapshot && (
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
          {dataMode === 'REAL' ? (
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
          ) : (
            <TrafficNetworkMap
              selectedSensor={selectedSensor}
              onSelectSensor={handleSelectSensor}
              sensors={demoSensors}
            />
          )}
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
            sensors={dataMode === 'REAL' ? realSensors : demoSensors}
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
