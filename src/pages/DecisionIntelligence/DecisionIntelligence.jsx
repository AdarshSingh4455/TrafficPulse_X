import React, { useState, useEffect } from 'react';
import MetricCard from '../../components/common/MetricCard';
import NeedScoreBreakdown from '../../components/decision/NeedScoreBreakdown';
import CounterfactualQueryCard from '../../components/decision/CounterfactualQueryCard';
import EvidenceChain from '../../components/decision/EvidenceChain';
import FlowConsistencyPanel from '../../components/decision/FlowConsistencyPanel';
import NextBestQueryTable from '../../components/decision/NextBestQueryTable';
import RecentDecisionsTable from '../../components/decision/RecentDecisionsTable';
import CoverageCard from '../../components/common/CoverageCard';
import { 
  fetchNeedScore, 
  fetchCounterfactual, 
  fetchEvidenceChain, 
  fetchFlowConservation, 
  fetchQueryCandidates, 
  fetchBlindSpots, 
  executeQuery, 
  sendHeartbeat,
  resetDemoState
} from '../../services/api';

export default function DecisionIntelligence() {
  const [selectedSensorId, setSelectedSensorId] = useState("S05");
  const [needScoreData, setNeedScoreData] = useState(null);
  const [counterfactualData, setCounterfactualData] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [flowConservationData, setFlowConservationData] = useState(null);
  const [candidates, setCandidates] = useState(null);
  const [coverageData, setCoverageData] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load general candidates & coverage on mount
  useEffect(() => {
    let isMounted = true;
    async function loadGlobals() {
      try {
        const [cands, cov, flow] = await Promise.all([
          fetchQueryCandidates(),
          fetchBlindSpots(),
          fetchFlowConservation("S01", "S05")
        ]);
        if (isMounted) {
          if (cands) setCandidates(cands);
          if (cov) setCoverageData(cov);
          if (flow) setFlowConservationData(flow);
        }
      } catch {
        // fallback to defaults
      }
    }
    loadGlobals();
    return () => { isMounted = false; };
  }, []);

  // Reload sensor-specific intelligence whenever selectedSensorId changes
  useEffect(() => {
    let isMounted = true;
    async function loadSensorIntelligence() {
      try {
        const [score, cf, ev] = await Promise.all([
          fetchNeedScore(selectedSensorId),
          fetchCounterfactual(selectedSensorId),
          fetchEvidenceChain(selectedSensorId)
        ]);
        if (isMounted) {
          if (score) setNeedScoreData(score);
          if (cf) setCounterfactualData(cf);
          if (ev) setEvidenceData(ev);
        }
      } catch {
        // fallback
      }
    }
    loadSensorIntelligence();
    return () => { isMounted = false; };
  }, [selectedSensorId]);

  const handleQuery = async (queryItem) => {
    const id = queryItem.sensor || queryItem;
    const res = await executeQuery(id);
    alert(`Evidence Query executed for ${id}!\nTransferred: ${res.bytesTransferred || '4.2 KB'}\nBenefit: ${res.expectedBenefit || '20%'}`);
    
    // Refresh calculations
    const [score, cf, ev, cands] = await Promise.all([
      fetchNeedScore(id),
      fetchCounterfactual(id),
      fetchEvidenceChain(id),
      fetchQueryCandidates()
    ]);
    setNeedScoreData(score);
    setCounterfactualData(cf);
    setEvidenceData(ev);
    if (cands) setCandidates(cands);
  };

  const handleSelectFromTable = (row) => {
    setSelectedSensorId(row.sensor || "S05");
  };

  // Viva demo trigger: Simulate sudden traffic drift on S05
  const handleTriggerDriftSurge = async () => {
    setIsSimulating(true);
    await sendHeartbeat("S05", { flow: 950, speed: 18.0, occupancy: 0.35 });
    const [score, cf, cands] = await Promise.all([
      fetchNeedScore("S05"),
      fetchCounterfactual("S05"),
      fetchQueryCandidates()
    ]);
    setSelectedSensorId("S05");
    setNeedScoreData(score);
    setCounterfactualData(cf);
    if (cands) setCandidates(cands);
    setIsSimulating(false);
  };

  const handleResetDemo = async () => {
    await resetDemoState();
    const [score, cf, cands] = await Promise.all([
      fetchNeedScore(selectedSensorId),
      fetchCounterfactual(selectedSensorId),
      fetchQueryCandidates()
    ]);
    setNeedScoreData(score);
    setCounterfactualData(cf);
    if (cands) setCandidates(cands);
  };

  const summaryMetrics = [
    { id: "coverage", label: "Knowledge Coverage", value: `${coverageData?.coveragePercent || 75}%`, subtext: `${coverageData?.coveredRoads || 134} covered roads`, isTrendUp: true, variant: "cyan", iconType: "accuracy" },
    { id: "blindspots", label: "Current Blind Spots", value: `${coverageData?.blindSpots || 2}`, subtext: "Active chokepoint risks", isTrendUp: false, variant: "rose", iconType: "alert" },
    { id: "activequeries", label: "Query Candidates", value: `${candidates ? candidates.length : 6}`, subtext: "Ranked by information utility", isBullet: true, variant: "blue", iconType: "sensor" },
    { id: "commsaved", label: "Communication Saved", value: "68.4 MB", subtext: "78.2% bandwidth reduction", isTrendUp: true, variant: "purple", iconType: "layers" }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Decision Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evidence-on-Demand sensor selection, Need Score breakdown, and counterfactual query planner
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Viva demo quick triggers */}
          <button
            onClick={handleTriggerDriftSurge}
            disabled={isSimulating}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Simulate sudden traffic spike triggering wake-up"
          >
            {isSimulating ? "Simulating..." : "⚡ Trigger Drift on S05"}
          </button>

          <button
            onClick={handleResetDemo}
            className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Reset telemetry and decision states"
          >
            Reset
          </button>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Sensor:</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#131d36] p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              {["S05", "S08", "S11", "S12", "S07"].map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedSensorId(id)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                    selectedSensorId === id
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryMetrics.map((m) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <NeedScoreBreakdown data={needScoreData} />
        </div>
        <div className="lg:col-span-6">
          <CounterfactualQueryCard 
            data={counterfactualData} 
            onExecuteQuery={handleQuery}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <EvidenceChain data={evidenceData} />
        </div>
        <div className="lg:col-span-6">
          <FlowConsistencyPanel data={flowConservationData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <NextBestQueryTable 
            data={candidates}
            onQuery={handleQuery} 
            onSelectSensor={handleSelectFromTable} 
          />
        </div>
        <div className="lg:col-span-4">
          <CoverageCard data={coverageData} />
        </div>
      </div>

      <div>
        <RecentDecisionsTable />
      </div>
    </div>
  );
}
