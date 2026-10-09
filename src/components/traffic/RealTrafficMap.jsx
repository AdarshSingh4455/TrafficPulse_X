import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity } from 'lucide-react';

// Custom Marker Colors based on Speed Condition
const CONDITION_COLORS = {
  NORMAL: '#10b981',   // Emerald 500
  REDUCED: '#f59e0b',  // Amber 500
  SLOW: '#ef4444',     // Rose 500
  NO_DATA: '#64748b',  // Slate 500
  SELECTED: '#06b6d4' // Cyan 500
};

// Create custom L.divIcon for Leaflet markers
function createCustomMarkerIcon(alias, condition, isSelected) {
  const color = isSelected ? CONDITION_COLORS.SELECTED : (CONDITION_COLORS[condition] || CONDITION_COLORS.NORMAL);
  const borderStyle = isSelected ? 'ring-4 ring-cyan-400 scale-110 z-50' : 'shadow-md hover:scale-105';
  
  const html = `
    <div class="relative flex items-center justify-center transition-all duration-200 ${borderStyle}">
      <div style="background-color: ${color}" class="w-7 h-7 rounded-full text-white font-mono font-bold text-[11px] flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
        ${alias}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

// Map Auto-Bounds Adjuster Component
function MapBoundsAdjuster({ markers, activeRegion }) {
  const map = useMap();

  useEffect(() => {
    if (!markers || markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [markers, activeRegion, map]);

  return null;
}

export default function RealTrafficMap({
  sensors = [],
  selectedSensor,
  onSelectSensor,
  activeRegion = "ALL",
  onRegionChange,
  showGraphEdges = false,
  onToggleGraphEdges,
  graphEdges = []
}) {
  const defaultCenter = [34.14, -118.33];
  const defaultZoom = 11;

  const regionTabs = [
    { id: 'ALL', label: 'All Regions (20 Reps)' },
    { id: 'REGION_A', label: 'Region A (North-East)' },
    { id: 'REGION_B', label: 'Region B (South-East)' },
    { id: 'REGION_C', label: 'Region C (Central-West)' },
    { id: 'REGION_D', label: 'Region D (North-West)' }
  ];

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-xl flex flex-col">
      {/* Top Map Controls Bar */}
      <div className="p-3 bg-slate-100/90 dark:bg-[#0c1527]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {regionTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onRegionChange && onRegionChange(tab.id)}
              className={`px-3 py-1.2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeRegion === tab.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleGraphEdges}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
              showGraphEdges
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/50'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Graph Edges {showGraphEdges ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative flex-1 w-full h-full z-0">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsAdjuster markers={sensors} activeRegion={activeRegion} />

          {/* Graph Connection Lines Overlay */}
          {showGraphEdges && graphEdges.map((edge, idx) => (
            <Polyline
              key={`edge-${idx}`}
              positions={[[edge.fromLat, edge.fromLon], [edge.toLat, edge.toLon]]}
              pathOptions={{ color: '#06b6d4', weight: 1.5, opacity: 0.5, dashArray: '4, 4' }}
            />
          ))}

          {/* Representative Sensor Markers */}
          {sensors.map((sensor) => {
            const isSelected = selectedSensor && (selectedSensor.sensorId === sensor.sensorId || selectedSensor.id === sensor.sensorId);
            const icon = createCustomMarkerIcon(sensor.displayAlias || sensor.sensorId, sensor.speedCondition || 'NORMAL', isSelected);

            return (
              <Marker
                key={sensor.sensorId}
                position={[sensor.latitude, sensor.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectSensor && onSelectSensor(sensor)
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {sensor.displayAlias} ({sensor.sensorId})
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold">
                        {sensor.regionId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Real Speed</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {sensor.speed !== null && sensor.speed !== undefined ? `${sensor.speed} mph` : 'No Data (Masked)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Condition</span>
                        <span className="font-mono font-bold text-cyan-600">
                          {sensor.speedCondition || 'NORMAL'}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-500 block text-[10px]">Data Quality</span>
                        <span className="font-mono font-semibold">
                          {sensor.dataQuality ? `${(sensor.dataQuality * 100).toFixed(1)}%` : '93.6%'}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-500 block text-[10px]">Graph Degree</span>
                        <span className="font-mono font-semibold">
                          {sensor.graphDegree || 0} nbrs
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectSensor && onSelectSensor(sensor)}
                      className="w-full mt-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
                    >
                      Select Sensor Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Normal (&ge;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Reduced (60-80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Slow (&lt;60%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">No Data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
