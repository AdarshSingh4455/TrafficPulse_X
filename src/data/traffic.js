export const systemPerformanceData = [
  { time: "00:00", baselineMAE: 85, selectiveMAE: 52 },
  { time: "04:00", baselineMAE: 110, selectiveMAE: 72 },
  { time: "08:00", baselineMAE: 125, selectiveMAE: 80 },
  { time: "12:00", baselineMAE: 118, selectiveMAE: 70 },
  { time: "16:00", baselineMAE: 132, selectiveMAE: 85 },
  { time: "20:00", baselineMAE: 120, selectiveMAE: 78 },
  { time: "24:00", baselineMAE: 95, selectiveMAE: 62 }
];

export const trafficDistributionData = [
  { name: "Free Flow", value: 18, percentage: "56%", color: "#10b981" },
  { name: "Moderate", value: 8, percentage: "25%", color: "#f59e0b" },
  { name: "High Congestion", value: 3, percentage: "9%", color: "#ef4444" },
  { name: "Inactive", value: 4, percentage: "12%", color: "#64748b" }
];

export const heatmapData = [
  { sensor: "S01", values: [420, 680, 850, 720, 640, 590] },
  { sensor: "S02", values: [890, 1420, 1680, 1350, 1120, 950] },
  { sensor: "S03", values: [510, 720, 890, 780, 680, 560] },
  { sensor: "S04", values: [650, 980, 1150, 1020, 890, 740] },
  { sensor: "S05", values: [1200, 2340, 2680, 2450, 1980, 1650] },
  { sensor: "S06", values: [780, 1160, 1390, 1250, 1040, 880] },
  { sensor: "S07", values: [430, 640, 790, 710, 620, 530] },
  { sensor: "S08", values: [1150, 2110, 2450, 2280, 1820, 1490] }
];

export const heatmapTimeLabels = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];
