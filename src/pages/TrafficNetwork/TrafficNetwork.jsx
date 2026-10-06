import React, { useState, useEffect } from 'react';
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
  fetchBlindSpots 
} from '../../services/api';

export default function TrafficNetwork() {
  const [sensors, setSensors] = useState(mockSensors);
  const [selectedSensor, setSelectedSensor] = useState(mockSensors.find(s => s.id === "S05") || mockSensors[0]);
  const [activeModal, setActiveModal] = useState(null); // 'why-selected' | 'counterfactual' | 'evidence' | null
  
  const [needScoreData, setNeedScoreData] = useState(null);
  const [counterfactualData, setCounterfactualData] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [coverageData, setCoverageData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [sens, cov] = await Promise.all([fetchSensors(), fetchBlindSpots()]);
        if (isMounted) {
          if (sens && sens.length > 0) {
            setSensors(sens);
            setSelectedSensor(prev => sens.find(s => s.id === prev?.id) || sens[0]);
          }
          if (cov) setCoverageData(cov);
        }
      } catch {
        // fallback
      }
    }
    init();
    return () => { isMounted = false; };
  }, []);

  const handleSelectSensor = (sensor) => {
    setSelectedSensor(sensor);
  };

  const handleWhySelected = async () => {
    setActiveModal('why-selected');
    if (selectedSensor) {
      const data = await fetchNeedScore(selectedSensor.id);
      setNeedScoreData(data);
    }
  };

  const handleEvaluateQuery = async () => {
    setActiveModal('counterfactual');
    if (selectedSensor) {
      const data = await fetchCounterfactual(selectedSensor.id);
      setCounterfactualData(data);
    }
  };

  const handleViewEvidence = async () => {
    setActiveModal('evidence');
    if (selectedSensor) {
      const data = await fetchEvidenceChain(selectedSensor.id);
      setEvidenceData(data);
    }
  };

  const handleQuerySensor = async (sensor) => {
    const res = await executeQuery(sensor.id);
    alert(`Evidence-on-Demand Query dispatched for ${sensor.id} (${sensor.road})!\nTransferred: ${res.bytesTransferred || '4.2 KB'}\nBenefit: ${res.expectedBenefit || '18%'}`);
    // Refresh telemetry
    const updated = await fetchSensors();
    if (updated) {
      setSensors(updated);
      setSelectedSensor(updated.find(s => s.id === sensor.id) || sensor);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Traffic Network
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live network view, sensor status, and intelligent sensor selection
          </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <TrafficNetworkMap
            selectedSensor={selectedSensor}
            onSelectSensor={handleSelectSensor}
            sensors={sensors}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <SensorTable
            sensors={sensors}
            selectedSensorId={selectedSensor?.id}
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
