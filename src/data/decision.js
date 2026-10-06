export const defaultNeedScoreBreakdown = {
  sensorId: "S05",
  finalNeedScore: 0.87,
  reasons: ["Significant downstream flow mismatch", "High local uncertainty proxy"],
  factors: [
    { name: "Spatial Influence", value: 0.82, weight: "+0.82" },
    { name: "Uncertainty Proxy", value: 0.91, weight: "+0.91" },
    { name: "Flow Mismatch", value: 0.74, weight: "+0.74" },
    { name: "Traffic Drift", value: 0.68, weight: "+0.68" },
    { name: "Freshness Need", value: 0.31, weight: "+0.31" },
    { name: "Information Debt", value: 0.22, weight: "+0.22" },
    { name: "Coverage Need", value: 0.45, weight: "+0.45" },
    { name: "Redundancy Penalty", value: -0.18, weight: "-0.18" },
    { name: "Sensor Health", value: 0.96, weight: "+0.96" }
  ]
};

export const sensorNeedScoreMap = {
  S05: defaultNeedScoreBreakdown,
  S08: {
    sensorId: "S08",
    finalNeedScore: 0.72,
    reasons: ["Core arterial chokepoint influence"],
    factors: [
      { name: "Spatial Influence", value: 0.78, weight: "+0.78" },
      { name: "Uncertainty Proxy", value: 0.79, weight: "+0.79" },
      { name: "Flow Mismatch", value: 0.65, weight: "+0.65" },
      { name: "Traffic Drift", value: 0.55, weight: "+0.55" },
      { name: "Freshness Need", value: 0.42, weight: "+0.42" },
      { name: "Information Debt", value: 0.18, weight: "+0.18" },
      { name: "Coverage Need", value: 0.38, weight: "+0.38" },
      { name: "Redundancy Penalty", value: -0.25, weight: "-0.25" },
      { name: "Sensor Health", value: 0.94, weight: "+0.94" }
    ]
  }
};

export const defaultCounterfactual = {
  sensorId: "S05",
  withoutQuery: {
    estimatedUncertainty: "65%",
    blindSpotRisk: "Moderate",
    informationDebt: 0.22,
    coverageGap: "35%"
  },
  withQuery: {
    estimatedUncertainty: "26%",
    blindSpotRisk: "Low",
    informationDebt: 0.0,
    expectedCost: "4.2 KB",
    coverageGain: "+18%"
  },
  expectedBenefit: "48%",
  uncertaintyReduction: "-39%",
  decision: "QUERY",
  reason: "High uncertainty reduction and state coverage gain justify communication cost."
};

export const counterfactualMap = {
  S05: defaultCounterfactual,
  S08: {
    sensorId: "S08",
    withoutQuery: {
      estimatedUncertainty: "54%",
      blindSpotRisk: "Low",
      informationDebt: 0.18,
      coverageGap: "25%"
    },
    withQuery: {
      estimatedUncertainty: "21%",
      blindSpotRisk: "Very Low",
      informationDebt: 0.0,
      expectedCost: "3.1 KB",
      coverageGain: "+12%"
    },
    expectedBenefit: "42%",
    uncertaintyReduction: "-33%",
    decision: "QUERY",
    reason: "Corridor arterial status and uncertainty reduction justify query cost."
  },
  S12: {
    sensorId: "S12",
    withoutQuery: {
      estimatedUncertainty: "22%",
      blindSpotRisk: "Very Low",
      informationDebt: 0.05,
      coverageGap: "10%"
    },
    withQuery: {
      estimatedUncertainty: "18%",
      blindSpotRisk: "Very Low",
      informationDebt: 0.0,
      expectedCost: "7.0 KB",
      coverageGain: "+5%"
    },
    expectedBenefit: "8%",
    uncertaintyReduction: "-4%",
    decision: "SKIP",
    reason: "Marginal informational benefit; preserving network bandwidth budget."
  }
};

export const defaultEvidenceChain = {
  targetSensor: "S05",
  evidenceConfidence: "86%",
  currentConfidence: "86%",
  evidenceSufficient: "Yes",
  stoppingCondition: "Evidence Confidence threshold met (≥ 85%)",
  sequence: [
    {
      sensorId: "S05",
      status: "complete",
      result: "Flow anomaly evaluated: Significant downstream flow mismatch",
      timestamp: "18:42"
    },
    {
      sensorId: "S08",
      status: "complete",
      result: "Diversion flows within nominal parameters",
      timestamp: "18:44"
    },
    {
      sensorId: "S03",
      status: "waiting",
      result: null,
      timestamp: "--:--"
    }
  ]
};

export const defaultFlowConsistency = {
  fromSensor: "S01",
  toSensor: "S05",
  incomingFlow: 100,
  expectedFlow: 68,
  observedFlow: 29,
  expectedDiversion: 21,
  estimatedStoredVehicles: 11,
  unexplainedDifference: 28,
  severity: "high"
};

export const nextBestDecisionQueries = [
  {
    sensor: "S05",
    road: "Grand Ave Main Rd",
    needScore: 0.87,
    expectedBenefit: "48%",
    expectedBytes: "4.2 KB",
    reason: "High local uncertainty proxy",
    action: "Query"
  },
  {
    sensor: "S08",
    road: "Figueroa Junction",
    needScore: 0.72,
    expectedBenefit: "42%",
    expectedBytes: "3.1 KB",
    reason: "Core arterial chokepoint influence",
    action: "Query"
  },
  {
    sensor: "S11",
    road: "Central Chokepoint",
    needScore: 0.82,
    expectedBenefit: "44%",
    expectedBytes: "3.8 KB",
    reason: "Chokepoint surge",
    action: "Query"
  },
  {
    sensor: "S02",
    road: "North Bypass Connector",
    needScore: 0.58,
    expectedBenefit: "25%",
    expectedBytes: "2.4 KB",
    reason: "Moderate traffic drift",
    action: "Query"
  },
  {
    sensor: "S12",
    road: "Downtown Tunnel West",
    needScore: 0.31,
    expectedBenefit: "8%",
    expectedBytes: "7.0 KB",
    reason: "Low state value",
    action: "Skip"
  }
];

export const recentSensorDecisions = [
  { id: "DEC-01", time: "18:46", sensor: "S08", score: 0.72, decision: "QUERY", benefit: "42%", reason: "Uncertainty reduction on Figueroa segment" },
  { id: "DEC-02", time: "18:41", sensor: "S05", score: 0.87, decision: "QUERY", benefit: "48%", reason: "Drift wake-up alert corroborated" },
  { id: "DEC-03", time: "18:35", sensor: "S07", score: 0.21, decision: "SKIP", benefit: "5%", reason: "Below benefit threshold (Saved 1.8 KB)" },
  { id: "DEC-04", time: "18:28", sensor: "S11", score: 0.82, decision: "QUERY", benefit: "44%", reason: "Chokepoint verification" },
  { id: "DEC-05", time: "18:20", sensor: "S12", score: 0.31, decision: "SKIP", benefit: "8%", reason: "Information redundant from S08 corridor" }
];
