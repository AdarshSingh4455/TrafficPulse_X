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

/**
 * Centralized fetch wrapper with robust timeout error handling.
 */
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || AbortSignal.timeout(TIMEOUT_MS)
    });
    return res;
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError' || err.message?.includes('timed out')) {
      throw new Error(`Connection timed out (${TIMEOUT_MS / 1000}s)`);
    }
    throw err;
  }
}

export async function fetchHealth() {
  const res = await apiFetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Backend Health Check Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchDashboard(timeIndex = 0) {
  const url = `${API_BASE}/dashboard?time_index=${timeIndex}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`Dashboard Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSensors(timeIndex = 0) {
  const url = `${API_BASE}/sensors?time_index=${timeIndex}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`Sensors Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSensorById(sensorId, timeIndex = 0) {
  const url = `${API_BASE}/sensors/${sensorId}?time_index=${timeIndex}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`Sensor Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchNetworkTopology() {
  const url = `${API_BASE}/network`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`Network Topology Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSpatialSpeedConsistency(fromId = "773869", toId = "767541") {
  const res = await apiFetch(`${API_BASE}/network/spatial-consistency?from_id=${fromId}&to_id=${toId}`);
  if (!res.ok) throw new Error(`Spatial Speed Consistency Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFlowConservation(fromId = "773869", toId = "767541") {
  // Alias for backward compatibility
  return fetchSpatialSpeedConsistency(fromId, toId);
}

export async function fetchEvents() {
  const res = await apiFetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error(`Events Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Decision Intelligence Endpoints
// -------------------------------------------------------------

export async function fetchNeedScore(sensorId = "773869") {
  const res = await apiFetch(`${API_BASE}/decision/sensors/${sensorId}/need-score`);
  if (!res.ok) throw new Error(`Need Score Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  const data = await res.json();

  let factorsList = [];
  if (data.factors && typeof data.factors === 'object' && !Array.isArray(data.factors)) {
    factorsList = Object.entries(data.factors).map(([k, val]) => {
      const isNeg = k === 'redundancyPenalty';
      const numVal = typeof val === 'number' ? val : (parseFloat(val) || 0);
      return {
        name: factorNames[k] || k,
        value: isNeg ? -Math.abs(numVal) : numVal,
        weight: isNeg ? `-${Math.abs(numVal).toFixed(2)}` : `+${numVal.toFixed(2)}`
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
  const res = await apiFetch(`${API_BASE}/decision/query-candidates`);
  if (!res.ok) throw new Error(`Query Candidates Fetch Failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.candidates || []);
}

export async function fetchCounterfactual(sensorId = "773869") {
  const res = await apiFetch(`${API_BASE}/decision/counterfactual/${sensorId}`);
  if (!res.ok) throw new Error(`Counterfactual Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchBlindSpots() {
  const res = await apiFetch(`${API_BASE}/decision/blind-spots`);
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
  const res = await apiFetch(`${API_BASE}/decision/evidence/${sensorId}`);
  if (!res.ok) throw new Error(`Evidence Chain Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function executeQuery(sensorId) {
  const res = await apiFetch(`${API_BASE}/query/${sensorId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Query Execution Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function sendHeartbeat(sensorId, telemetry = {}) {
  const res = await apiFetch(`${API_BASE}/sensors/${sensorId}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(telemetry),
  });
  if (!res.ok) throw new Error(`Heartbeat Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchCoverageCertificate(regionId = "REGION_A") {
  const res = await apiFetch(`${API_BASE}/decision/certificate/${regionId}`);
  if (!res.ok) throw new Error(`Coverage Certificate Fetch Failed for '${regionId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchSensorJury(sensorId = "773869", timeIndex = 0) {
  const res = await apiFetch(`${API_BASE}/decision/jury/${sensorId}?time_index=${timeIndex}`);
  if (!res.ok) throw new Error(`Sensor Jury Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchPhysicsGate(sensorId = "773869", timeIndex = 0) {
  const res = await apiFetch(`${API_BASE}/decision/physics-gate/${sensorId}?time_index=${timeIndex}`);
  if (!res.ok) throw new Error(`Physics Gate Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMinimumEvidenceSet(regionId = "REGION_A", timeIndex = 0) {
  const res = await apiFetch(`${API_BASE}/decision/minimum-evidence/${regionId}?time_index=${timeIndex}`);
  if (!res.ok) throw new Error(`Minimum Evidence Set Fetch Failed for '${regionId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// METR-LA Benchmark Dataset Endpoints
// -------------------------------------------------------------

export async function fetchMetrStatus() {
  const res = await apiFetch(`${API_BASE}/datasets/status`);
  if (!res.ok) throw new Error(`Dataset Status Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrRegions() {
  const res = await apiFetch(`${API_BASE}/datasets/metr-la/regions`);
  if (!res.ok) throw new Error(`Regions Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrRepresentatives() {
  const res = await apiFetch(`${API_BASE}/datasets/metr-la/representatives`);
  if (!res.ok) throw new Error(`Representatives Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrSnapshot(timeIndex = 0, regionId = "ALL", repsOnly = true) {
  const url = `${API_BASE}/datasets/metr-la/snapshot?time_index=${timeIndex}&region_id=${regionId}&representatives_only=${repsOnly}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`Snapshot Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchMetrSensor(sensorId, timeIndex = 0) {
  const res = await apiFetch(`${API_BASE}/datasets/metr-la/sensors/${sensorId}?time_index=${timeIndex}`);
  if (!res.ok) throw new Error(`METR Sensor Fetch Failed for '${sensorId}': ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Prediction Intelligence API Methods (Stage 6.7)
// -------------------------------------------------------------

export async function fetchPredictionStatus() {
  const res = await apiFetch(`${API_BASE}/prediction/status`);
  if (!res.ok) throw new Error(`Prediction Status Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchForecast(timeIndex = 12, sensorId = null, regionId = null) {
  let url = `${API_BASE}/prediction/forecast?time_index=${timeIndex}`;
  if (sensorId) url += `&sensor_id=${encodeURIComponent(sensorId)}`;
  if (regionId) url += `&region_id=${encodeURIComponent(regionId)}`;

  const res = await apiFetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const detail = errData.detail || `Prediction Forecast Failed: ${res.status} ${res.statusText}`;
    throw new Error(detail);
  }
  return await res.json();
}

export async function fetchPredictionMetrics() {
  const res = await apiFetch(`${API_BASE}/prediction/metrics`);
  if (!res.ok) throw new Error(`Prediction Metrics Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchPredictionModels() {
  const res = await apiFetch(`${API_BASE}/prediction/models`);
  if (!res.ok) throw new Error(`Prediction Models Table Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Stage 8.3 Federated Learning API Gateway Functions
// -------------------------------------------------------------

export async function fetchFederatedStatus() {
  const res = await apiFetch(`${API_BASE}/federated/status`);
  if (!res.ok) throw new Error(`Federated Status Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFederatedClients() {
  const res = await apiFetch(`${API_BASE}/federated/clients`);
  if (!res.ok) throw new Error(`Federated Clients Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFederatedRounds() {
  const res = await apiFetch(`${API_BASE}/federated/rounds`);
  if (!res.ok) throw new Error(`Federated Rounds Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFederatedMetrics() {
  const res = await apiFetch(`${API_BASE}/federated/metrics`);
  if (!res.ok) throw new Error(`Federated Metrics Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchFederatedCommunication() {
  const res = await apiFetch(`${API_BASE}/federated/communication`);
  if (!res.ok) throw new Error(`Federated Communication Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Phase 9.1 Communication Intelligence Foundation Endpoints
// -------------------------------------------------------------

export async function fetchPhase9Status() {
  const res = await apiFetch(`${API_BASE}/communication/phase9/status`);
  if (!res.ok) throw new Error(`Phase 9 Status Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchPhase9Selection(budget = "3/4") {
  const res = await apiFetch(`${API_BASE}/communication/phase9/select?budget=${encodeURIComponent(budget)}`);
  if (!res.ok) throw new Error(`Phase 9 Selection Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchPhase9ClientValues() {
  const res = await apiFetch(`${API_BASE}/communication/phase9/client-values`);
  if (!res.ok) throw new Error(`Phase 9 Client Values Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// -------------------------------------------------------------
// Phase 9.2 Controlled Selective FL Experiment Endpoints
// -------------------------------------------------------------

export async function fetchPhase9Experiments() {
  const res = await apiFetch(`${API_BASE}/communication/phase9/experiments`);
  if (!res.ok) throw new Error(`Phase 9 Experiments Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchPhase9Policy(policy) {
  const res = await apiFetch(`${API_BASE}/communication/phase9/experiments/${encodeURIComponent(policy)}`);
  if (!res.ok) throw new Error(`Phase 9 Policy Details Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchPhase9Tradeoff() {
  const res = await apiFetch(`${API_BASE}/communication/phase9/tradeoff`);
  if (!res.ok) throw new Error(`Phase 9 Tradeoff Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

export async function fetchPhase9Rounds(policy) {
  const res = await apiFetch(`${API_BASE}/communication/phase9/rounds/${encodeURIComponent(policy)}`);
  if (!res.ok) throw new Error(`Phase 9 Rounds History Fetch Failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

// Aliases matching getFederated* naming requirement
export const getFederatedStatus = fetchFederatedStatus;
export const getFederatedClients = fetchFederatedClients;
export const getFederatedRounds = fetchFederatedRounds;
export const getFederatedMetrics = fetchFederatedMetrics;
export const getFederatedCommunication = fetchFederatedCommunication;


