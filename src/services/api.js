// TrafficPulse-X API Service with graceful fallback to local data

import { mockSensors } from '../data/sensors';
import { 
  defaultNeedScoreBreakdown, 
  defaultCounterfactual, 
  defaultEvidenceChain, 
  defaultFlowConsistency, 
  nextBestDecisionQueries 
} from '../data/decision';
import { mockEvents } from '../data/events';
import { coverageStats } from '../data/dashboard';

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
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch {
    return { status: "local-fallback", system: "TrafficPulse-X" };
  }
}

export async function fetchDashboard() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error("Dashboard fetch failed");
    return await res.json();
  } catch {
    return {
      totalSensors: 32,
      activeSensors: 28,
      inactiveSensors: 4,
      highCongestionAreas: 3,
      communicationSavedMb: 68.4,
      predictionAccuracy: 92.6,
      networkCoveragePercent: 87
    };
  }
}

export async function fetchSensors() {
  try {
    const res = await fetch(`${API_BASE}/sensors`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error("Sensors fetch failed");
    return await res.json();
  } catch {
    return mockSensors;
  }
}

export async function fetchSensorById(sensorId) {
  try {
    const res = await fetch(`${API_BASE}/sensors/${sensorId}`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error("Sensor fetch failed");
    return await res.json();
  } catch {
    return mockSensors.find(s => s.id === sensorId) || mockSensors[0];
  }
}

export async function fetchNetworkTopology() {
  try {
    const res = await fetch(`${API_BASE}/network`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error("Network fetch failed");
    return await res.json();
  } catch {
    return {
      nodes: mockSensors,
      density: 0.09
    };
  }
}

export async function fetchFlowConservation(fromId = "S01", toId = "S05") {
  try {
    const res = await fetch(`${API_BASE}/network/conservation?from_id=${fromId}&to_id=${toId}`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error("Conservation fetch failed");
    return await res.json();
  } catch {
    return defaultFlowConsistency;
  }
}

export async function fetchEvents() {
  try {
    const res = await fetch(`${API_BASE}/events`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error("Events fetch failed");
    return await res.json();
  } catch {
    return mockEvents;
  }
}

// -------------------------------------------------------------
// Phase 4 Decision Intelligence Endpoints
// -------------------------------------------------------------

export async function fetchNeedScore(sensorId = "S05") {
  try {
    const res = await fetch(`${API_BASE}/decision/sensors/${sensorId}/need-score`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error("Need score fetch failed");
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
  } catch {
    return defaultNeedScoreBreakdown;
  }
}

export async function fetchQueryCandidates() {
  try {
    const res = await fetch(`${API_BASE}/decision/query-candidates`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error("Query candidates fetch failed");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.candidates || nextBestDecisionQueries);
  } catch {
    return nextBestDecisionQueries;
  }
}

export async function fetchCounterfactual(sensorId = "S05") {
  try {
    const res = await fetch(`${API_BASE}/decision/counterfactual/${sensorId}`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error("Counterfactual fetch failed");
    return await res.json();
  } catch {
    return defaultCounterfactual;
  }
}

export async function fetchBlindSpots() {
  try {
    const res = await fetch(`${API_BASE}/decision/blind-spots`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error("Blind spots fetch failed");
    const data = await res.json();
    return {
      coveragePercent: data.overallCoveragePercent || 75,
      coveredRoads: data.coveredRoads || 134,
      uncoveredRoads: data.uncoveredRoads || 45,
      blindSpots: data.blindSpots ? data.blindSpots.length : 2,
      sectorSummaries: data.sectorSummaries || []
    };
  } catch {
    return coverageStats;
  }
}

export async function fetchEvidenceChain(sensorId = "S05") {
  try {
    const res = await fetch(`${API_BASE}/decision/evidence/${sensorId}`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error("Evidence chain fetch failed");
    return await res.json();
  } catch {
    return defaultEvidenceChain;
  }
}

export async function executeQuery(sensorId) {
  try {
    const res = await fetch(`${API_BASE}/query/${sensorId}`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error("Query execution failed");
    return await res.json();
  } catch {
    return {
      sensorId,
      status: "QUERIED_LOCAL",
      bytesTransferred: "4.2 KB",
      expectedBenefit: "18%"
    };
  }
}

export async function sendHeartbeat(sensorId, telemetry = {}) {
  try {
    const res = await fetch(`${API_BASE}/sensors/${sensorId}/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telemetry),
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error("Heartbeat failed");
    return await res.json();
  } catch {
    return { sensorId, status: "OFFLINE", wakeUp: false };
  }
}

export async function resetDemoState() {
  try {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: "POST",
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error("Demo reset failed");
    return await res.json();
  } catch {
    return { status: "local_reset" };
  }
}
