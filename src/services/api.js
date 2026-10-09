// TrafficPulse-X API Service (Centralized Real-Data Backend Gateway)

const API_BASE = "http://127.0.0.1:8000/api";
const TIMEOUT_MS = 10000; // 10-second timeout to prevent premature abort errors

const factorNames = {
  spatialInfluence: "Spatial Influence",
  uncertaintyProxy: "Prediction Uncertainty",
  spatialSpeedDisagreement: "Spatial Speed Disagreement",
  trafficDrift: "Speed Drift",
  freshness: "Freshness Need",
  informationDebt: "Information Debt",
  coverageNeed: "Coverage Need",
  sensorHealth: "Data Quality",
  redundancyPenalty: "Redundancy Penalty"
};

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Backend Health Check Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchDashboard(timeIndex = 0) {
  const url = `${API_BASE}/dashboard?time_index=${timeIndex}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Dashboard Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSensors(timeIndex = 0) {
  const url = `${API_BASE}/sensors?time_index=${timeIndex}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Sensors Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSensorById(sensorId, timeIndex = 0) {
  const url = `${API_BASE}/sensors/${sensorId}?time_index=${timeIndex}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Sensor Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchNetworkTopology() {
  const url = `${API_BASE}/network`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Network Topology Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSpatialSpeedConsistency(fromId = "773869", toId = "767541") {
  const res = await fetch(`${API_BASE}/network/spatial-consistency?from_id=${fromId}&to_id=${toId}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Spatial Speed Consistency Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFlowConservation(fromId = "773869", toId = "767541") {
  // Alias for backward compatibility
  return fetchSpatialSpeedConsistency(fromId, toId);
}

export async function fetchEvents() {
  const res = await fetch(`${API_BASE}/events`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Events Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Decision Intelligence Endpoints
// -------------------------------------------------------------

export async function fetchNeedScore(sensorId = "773869") {
  const res = await fetch(`${API_BASE}/decision/sensors/${sensorId}/need-score`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Need Score Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  const data = await res.json();

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
    confidenceLevel: data.confidenceLevel || "MEDIUM",
    residualUncertaintyMph: data.residualUncertaintyMph,
    factors: factorsList
  };
}

export async function fetchQueryCandidates() {
  const res = await fetch(`${API_BASE}/decision/query-candidates`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Query Candidates Fetch Failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.candidates || []);
}

export async function fetchCounterfactual(sensorId = "773869") {
  const res = await fetch(`${API_BASE}/decision/counterfactual/${sensorId}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Counterfactual Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchBlindSpots() {
  const res = await fetch(`${API_BASE}/decision/blind-spots`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Blind Spots Fetch Failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return {
    coveragePercent: data.overallCoveragePercent || 85,
    coveredRoads: data.coveredRoads || 176,
    uncoveredRoads: data.uncoveredRoads || 31,
    blindSpots: data.blindSpots ? data.blindSpots.length : 0,
    sectorSummaries: data.sectorSummaries || []
  };
}

export async function fetchEvidenceChain(sensorId = "773869") {
  const res = await fetch(`${API_BASE}/decision/evidence/${sensorId}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Evidence Chain Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function executeQuery(sensorId) {
  const res = await fetch(`${API_BASE}/query/${sensorId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`Query Execution Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function sendHeartbeat(sensorId, telemetry = {}) {
  const res = await fetch(`${API_BASE}/sensors/${sensorId}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(telemetry),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`Heartbeat Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchCoverageCertificate(regionId = "REGION_A") {
  const res = await fetch(`${API_BASE}/decision/certificate/${regionId}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Coverage Certificate Fetch Failed for '${regionId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSensorJury(sensorId = "773869", timeIndex = 0) {
  const res = await fetch(`${API_BASE}/decision/jury/${sensorId}?time_index=${timeIndex}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Sensor Jury Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchPhysicsGate(sensorId = "773869", timeIndex = 0) {
  const res = await fetch(`${API_BASE}/decision/physics-gate/${sensorId}?time_index=${timeIndex}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Physics Gate Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMinimumEvidenceSet(regionId = "REGION_A", timeIndex = 0) {
  const res = await fetch(`${API_BASE}/decision/minimum-evidence/${regionId}?time_index=${timeIndex}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Minimum Evidence Set Fetch Failed for '${regionId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// METR-LA Benchmark Dataset Endpoints
// -------------------------------------------------------------

export async function fetchMetrStatus() {
  const res = await fetch(`${API_BASE}/datasets/status`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Dataset Status Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrRegions() {
  const res = await fetch(`${API_BASE}/datasets/metr-la/regions`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Regions Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrRepresentatives() {
  const res = await fetch(`${API_BASE}/datasets/metr-la/representatives`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Representatives Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrSnapshot(timeIndex = 0, regionId = "ALL", repsOnly = true) {
  const url = `${API_BASE}/datasets/metr-la/snapshot?time_index=${timeIndex}&region_id=${regionId}&representatives_only=${repsOnly}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Snapshot Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrSensor(sensorId, timeIndex = 0) {
  const res = await fetch(`${API_BASE}/datasets/metr-la/sensors/${sensorId}?time_index=${timeIndex}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`METR Sensor Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Prediction Intelligence API Methods (Stage 6.7)
// -------------------------------------------------------------

export async function fetchPredictionStatus() {
  const res = await fetch(`${API_BASE}/prediction/status`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Prediction Status Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchForecast(timeIndex = 12, sensorId = null, regionId = null) {
  let url = `${API_BASE}/prediction/forecast?time_index=${timeIndex}`;
  if (sensorId) url += `&sensor_id=${encodeURIComponent(sensorId)}`;
  if (regionId) url += `&region_id=${encodeURIComponent(regionId)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const detail = errData.detail || `Prediction Forecast Failed: ${res.status} ${res.statusText}`;
    throw new Error(detail);
  }
  return await res.json();
}

export async function fetchPredictionMetrics() {
  const res = await fetch(`${API_BASE}/prediction/metrics`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Prediction Metrics Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchPredictionModels() {
  const res = await fetch(`${API_BASE}/prediction/models`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Prediction Models Table Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Stage 8.3 Federated Learning API Gateway Functions
// -------------------------------------------------------------

export async function fetchFederatedStatus() {
  const res = await fetch(`${API_BASE}/federated/status`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Federated Status Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFederatedClients() {
  const res = await fetch(`${API_BASE}/federated/clients`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Federated Clients Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFederatedRounds() {
  const res = await fetch(`${API_BASE}/federated/rounds`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Federated Rounds Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFederatedMetrics() {
  const res = await fetch(`${API_BASE}/federated/metrics`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Federated Metrics Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFederatedCommunication() {
  const res = await fetch(`${API_BASE}/federated/communication`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Federated Communication Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// Aliases matching getFederated* naming requirement
export const getFederatedStatus = fetchFederatedStatus;
export const getFederatedClients = fetchFederatedClients;
export const getFederatedRounds = fetchFederatedRounds;
export const getFederatedMetrics = fetchFederatedMetrics;
export const getFederatedCommunication = fetchFederatedCommunication;
