export const networkSummaryMetrics = [
  { id: "total", label: "Total Sensors", value: "32", variant: "blue", iconType: "sensor" },
  { id: "active", label: "Active", value: "28", subtext: "87.5%", isBullet: true, variant: "emerald", iconType: "signal" },
  { id: "inactive", label: "Inactive", value: "4", subtext: "12.5%", isBullet: true, variant: "slate", iconType: "offline" },
  { id: "congestion", label: "High Congestion", value: "3", subtext: "Alert", isTrendUp: true, variant: "rose", iconType: "alert" }
];

export const sectorsData = [
  { id: "SecA", name: "Sector A", label: "North Gateway", sensorCount: 8, activeCount: 7, status: "Normal" },
  { id: "SecB", name: "Sector B", label: "Central Chokepoint", sensorCount: 10, activeCount: 9, status: "Congested" },
  { id: "SecC", name: "Sector C", label: "River & Logistics", sensorCount: 8, activeCount: 7, status: "Normal" },
  { id: "SecD", name: "Sector D", label: "South Perimeter", sensorCount: 6, activeCount: 5, status: "Normal" }
];
