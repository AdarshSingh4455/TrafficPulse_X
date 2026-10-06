export const heroHighlights = [
  {
    id: "predict",
    title: "Predict Traffic Flow",
    description: "Multi-horizon spatial-temporal forecasting (+5m to +60m) across the network."
  },
  {
    id: "query",
    title: "Query Only Important Sensors",
    description: "Counterfactual need score gates communication so only vital data is pulled."
  },
  {
    id: "federated",
    title: "Federated Learning with Optimized Communication",
    description: "Edge regions train locally and share only high-novelty, validated model weights."
  }
];

export const metricCardsData = [
  {
    id: "total-sensors",
    label: "Total Sensors",
    value: "32",
    subtext: "+2 new today",
    isTrendUp: true,
    variant: "blue",
    iconType: "sensor"
  },
  {
    id: "active-sensors",
    label: "Active Sensors",
    value: "28",
    subtext: "87.5% online",
    isBullet: true,
    variant: "emerald",
    iconType: "signal"
  },
  {
    id: "inactive-sensors",
    label: "Inactive Sensors",
    value: "4",
    subtext: "12.5% offline",
    isBullet: true,
    variant: "slate",
    iconType: "offline"
  },
  {
    id: "high-congestion",
    label: "High Congestion Areas",
    value: "3",
    subtext: "+1 since last hour",
    isTrendUp: true,
    variant: "rose",
    iconType: "alert"
  },
  {
    id: "comm-saved",
    label: "Communication Saved",
    value: "68.4 MB",
    subtext: "62% reduction",
    isTrendUp: true,
    variant: "purple",
    iconType: "layers"
  }
];

export const coverageStats = {
  coveragePercent: 87,
  coveredRoads: 156,
  uncoveredRoads: 23,
  blindSpots: 2
};

export const nextBestQueries = [
  {
    id: "Q1",
    sensor: "S05",
    road: "Sector A - Main Rd",
    needScore: 0.87,
    expectedBenefit: "18%",
    expectedBytes: "4.2 KB",
    action: "Query"
  },
  {
    id: "Q2",
    sensor: "S08",
    road: "Sector B - Expressway",
    needScore: 0.72,
    expectedBenefit: "14%",
    expectedBytes: "3.1 KB",
    action: "Query"
  }
];

export const topCongestionAreas = [
  {
    rank: 1,
    location: "Sector A - Main Rd",
    currentFlow: "2,340",
    status: "high"
  },
  {
    rank: 2,
    location: "City Center",
    currentFlow: "1,980",
    status: "high"
  },
  {
    rank: 3,
    location: "River Bridge",
    currentFlow: "1,760",
    status: "moderate"
  }
];
