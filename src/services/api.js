// TrafficPulse-X API Service (Centralized Backend Service)

const API_BASE = "http://127.0.0.1:8000/api";

const factorNames = {
  spatialInfluence: "Spatial Influence",
  uncertaintyProxy: "Prediction Uncertainty",
  flowMismatch: "Flow Mismatch",
  trafficDrift: "Traffic Drift",
  freshness: "Freshness Need",
  informationDebt: "Information Debt",
  coverageNeed: "Coverage Need",
  sensorHealth: "Sensor Health",
  redundancyPenalty: "Redundancy Penalty"
};

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`Health check failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchDashboard(sourceType = "SYNTHETIC_DEMO", timeIndex = 0) {
  const url = `${API_BASE}/dashboard?source_type=${encodeURIComponent(sourceType)}&time_index=${timeIndex}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSensors(sourceType = "SYNTHETIC_DEMO", timeIndex = 0) {
  const url = `${API_BASE}/sensors?source_type=${encodeURIComponent(sourceType)}&time_index=${timeIndex}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`Sensors fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSensorById(sensorId, timeIndex = 0, sourceType = null) {
  let url = `${API_BASE}/sensors/${sensorId}?time_index=${timeIndex}`;
  if (sourceType) {
    url += `&source_type=${encodeURIComponent(sourceType)}`;
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`Sensor fetch failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchNetworkTopology(sourceType = "SYNTHETIC_DEMO") {
  const url = `${API_BASE}/network?source_type=${encodeURIComponent(sourceType)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`Network topology fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFlowConservation(fromId = "S01", toId = "S05") {
  const res = await fetch(`${API_BASE}/network/conservation?from_id=${fromId}&to_id=${toId}`, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`Conservation fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchEvents() {
  const res = await fetch(`${API_BASE}/events`, { signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`Events fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Phase 4 Decision Intelligence Endpoints
// -------------------------------------------------------------

export async function fetchNeedScore(sensorId = "S05") {
  const res = await fetch(`${API_BASE}/decision/sensors/${sensorId}/need-score`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`Need score fetch failed for '${sensorId}': ${res.status} ${res.statusText}`);
  const data = await res.json();
  
  // Transform backend factor dictionary to array for NeedScoreBreakdown component
  let factorsList = [];
  if (data.factors && typeof data.factors === 'object' && !Array.isArray(data.factors)) {
    factorsList = Object.entries(data.factors).map(([k, val]) => {
      const isNeg = k === 'redundancyPenalty';
      return {
        name: factorNames[k] || k,
        value: isNeg ? -Math.abs(val) : val,
        weight: isNeg ? `-${Math.abs(val).toFixed(2)}` : `+${val.toFixed(2)}`
      };
    });
  } else if (Array.isArray(data.factors)) {
    factorsList = data.factors;
  }

  return {
    sensorId: data.sensorId || sensorId,
    finalNeedScore: data.needScore,
    reasons: data.reasons || [],
    driftState: data.driftState || "normal",
    factors: factorsList
  };
}

export async function fetchQueryCandidates() {
  const res = await fetch(`${API_BASE}/decision/query-candidates`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`Query candidates fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.candidates || []);
}

export async function fetchCounterfactual(sensorId = "S05") {
  const res = await fetch(`${API_BASE}/decision/counterfactual/${sensorId}`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`Counterfactual fetch failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchBlindSpots() {
  const res = await fetch(`${API_BASE}/decision/blind-spots`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`Blind spots fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return {
    coveragePercent: data.overallCoveragePercent || 75,
    coveredRoads: data.coveredRoads || 134,
    uncoveredRoads: data.uncoveredRoads || 45,
    blindSpots: data.blindSpots ? data.blindSpots.length : 2,
    sectorSummaries: data.sectorSummaries || []
  };
}

export async function fetchEvidenceChain(sensorId = "S05") {
  const res = await fetch(`${API_BASE}/decision/evidence/${sensorId}`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`Evidence chain fetch failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function executeQuery(sensorId) {
  const res = await fetch(`${API_BASE}/query/${sensorId}`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(3000)
  });
  if (!res.ok) throw new Error(`Query execution failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function sendHeartbeat(sensorId, telemetry = {}) {
  const res = await fetch(`${API_BASE}/sensors/${sensorId}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(telemetry),
    signal: AbortSignal.timeout(3000)
  });
  if (!res.ok) throw new Error(`Heartbeat failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function resetDemoState() {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: "POST",
    signal: AbortSignal.timeout(3000)
  });
  if (!res.ok) throw new Error(`Demo reset failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Phase 5 METR-LA Research Dataset Endpoints
// -------------------------------------------------------------

export async function fetchMetrStatus() {
  const res = await fetch(`${API_BASE}/datasets/status`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`Dataset status fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrRegions() {
  const res = await fetch(`${API_BASE}/datasets/metr-la/regions`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`Regions fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrRepresentatives() {
  const res = await fetch(`${API_BASE}/datasets/metr-la/representatives`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`Representatives fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrSnapshot(timeIndex = 0, regionId = "ALL", repsOnly = true) {
  const url = `${API_BASE}/datasets/metr-la/snapshot?time_index=${timeIndex}&region_id=${regionId}&representatives_only=${repsOnly}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`Snapshot fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrSensor(sensorId, timeIndex = 0) {
  const res = await fetch(`${API_BASE}/datasets/metr-la/sensors/${sensorId}?time_index=${timeIndex}`, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`METR sensor fetch failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

