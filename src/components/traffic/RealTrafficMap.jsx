import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, Layers } from 'lucide-react';

// Color Palette for Overlays
const REGION_COLORS = {
  REGION_A: '#3b82f6', // Blue
  REGION_B: '#10b981', // Emerald
  REGION_C: '#a855f7', // Purple
  REGION_D: '#f59e0b'  // Amber
};

function getMarkerColor(sensor, overlayMode, isSelected) {
  if (isSelected) return '#06b6d4'; // Cyan 500

  if (overlayMode === 'regions') {
    const r = sensor.regionId || '';
    if (r.includes('REGION_A')) return REGION_COLORS.REGION_A;
    if (r.includes('REGION_B')) return REGION_COLORS.REGION_B;
    if (r.includes('REGION_C')) return REGION_COLORS.REGION_C;
    if (r.includes('REGION_D')) return REGION_COLORS.REGION_D;
    return '#3b82f6';
  }

  if (overlayMode === 'uncertainty') {
    const u = sensor.uncertainty !== undefined ? sensor.uncertainty : 2.14;
    if (u > 4.0) return '#ef4444'; // Rose (High)
    if (u > 2.8) return '#f59e0b'; // Amber (Moderate)
    return '#10b981'; // Emerald (Low)
  }

  if (overlayMode === 'drift') {
    const d = sensor.trafficDrift !== undefined ? Math.abs(sensor.trafficDrift) : 0.18;
    if (d > 0.35) return '#ef4444'; // Rose (High Drift)
    if (d > 0.20) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald (Stable)
  }

  if (overlayMode === 'quality') {
    const q = sensor.dataQuality !== undefined ? sensor.dataQuality : 0.95;
    if (q >= 0.90) return '#10b981'; // Emerald (High)
    if (q >= 0.75) return '#f59e0b'; // Amber (Moderate)
    return '#ef4444'; // Rose (Low)
  }

  if (overlayMode === 'blind_spots') {
    const deg = sensor.graphDegree !== undefined ? sensor.graphDegree : 5;
    if (deg <= 2) return '#ef4444'; // Rose (Blind Spot Node)
    return '#06b6d4'; // Cyan (Normal Connected)
  }

  // Default: 'speed'
  if (sensor.speed === 0 || sensor.isMaskedNull) return '#64748b'; // Slate (No Data)
  const spd = sensor.speed !== null && sensor.speed !== undefined ? sensor.speed : 60;
  if (spd >= 50) return '#10b981'; // Emerald (Normal)
  if (spd >= 35) return '#f59e0b'; // Amber (Reduced)
  return '#ef4444'; // Rose (Slow)
}

// Create custom L.divIcon for Leaflet markers
function createCustomMarkerIcon(alias, color, isSelected, isCompact) {
  const borderStyle = isSelected ? 'ring-4 ring-cyan-400 scale-125 z-50' : 'shadow-md hover:scale-110';
  const sizeClass = isCompact ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-[11px]';
  const pixelSize = isCompact ? 20 : 28;

  const html = `
    <div class="relative flex items-center justify-center transition-all duration-150 ${borderStyle}">
      <div style="background-color: ${color}" class="${sizeClass} rounded-full text-white font-mono font-bold flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
        ${isCompact ? '' : alias}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [pixelSize, pixelSize],
    iconAnchor: [pixelSize / 2, pixelSize / 2],
    popupAnchor: [0, -pixelSize / 2]
  });
}

// Map Auto-Bounds Adjuster & Resize Handler Component
function MapController({ markers, activeRegion }) {
  const map = useMap();

  useEffect(() => {
    // Force Leaflet to recalculate container bounds on layout change
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    return () => clearTimeout(timer);
  }, [markers, activeRegion, map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

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
  const [overlayMode, setOverlayMode] = useState('speed');

  const regionTabs = [
    { id: 'ALL', label: 'All Regions (207 Sensors)' },
    { id: 'REGION_A', label: 'Region A (48)' },
    { id: 'REGION_B', label: 'Region B (57)' },
    { id: 'REGION_C', label: 'Region C (58)' },
    { id: 'REGION_D', label: 'Region D (44)' }
  ];

  const overlayOptions = [
    { id: 'speed', label: 'Speed' },
    { id: 'regions', label: 'Regions' },
    { id: 'uncertainty', label: 'Uncertainty' },
    { id: 'drift', label: 'Drift' },
    { id: 'quality', label: 'Data Quality' },
    { id: 'blind_spots', label: 'Blind Spots' }
  ];

  const isCompact = sensors.length > 30;

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-xl flex flex-col">
      {/* Top Map Controls Bar */}
      <div className="p-3 bg-slate-100/95 dark:bg-[#0c1527]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 flex flex-wrap items-center justify-between gap-2.5">
        {/* Region Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {regionTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onRegionChange && onRegionChange(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeRegion === tab.id
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overlay Mode Selector & Graph Edges Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Overlay Toggle Pills */}
          <div className="flex items-center gap-1 bg-white/90 dark:bg-[#081827] p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold px-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Overlay:
            </span>
            {overlayOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setOverlayMode(opt.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  overlayMode === opt.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Graph Edges Toggle */}
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

          <MapController markers={sensors} activeRegion={activeRegion} />

          {/* Graph Connection Lines Overlay */}
          {showGraphEdges && graphEdges.map((edge, idx) => (
            <Polyline
              key={`edge-${idx}`}
              positions={[[edge.fromLat, edge.fromLon], [edge.toLat, edge.toLon]]}
              pathOptions={{ color: '#06b6d4', weight: 1.5, opacity: 0.5, dashArray: '4, 4' }}
            />
          ))}

          {/* 207 Sensor Markers */}
          {sensors.map((sensor) => {
            const sid = sensor.sensorId || sensor.id;
            const isSelected = selectedSensor && (selectedSensor.sensorId === sid || selectedSensor.id === sid);
            const color = getMarkerColor(sensor, overlayMode, isSelected);
            const icon = createCustomMarkerIcon(sensor.displayAlias || sid, color, isSelected, isCompact);

            return (
              <Marker
                key={sid}
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
                        {sensor.displayAlias ? `${sensor.displayAlias} (${sid})` : sid}
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
                          {sensor.speedCondition || (sensor.speed >= 50 ? 'NORMAL' : sensor.speed >= 35 ? 'REDUCED' : 'SLOW')}
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

        {/* Dynamic Legend Overlay based on overlayMode */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] shadow-lg flex items-center gap-3">
          {overlayMode === 'speed' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Normal (&ge;50 mph)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Reduced (35-50 mph)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Slow (&lt;35 mph)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">No Data / Masked</span>
              </div>
            </>
          )}

          {overlayMode === 'regions' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Region A (48)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Region B (57)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Region C (58)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Region D (44)</span>
              </div>
            </>
          )}

          {overlayMode === 'uncertainty' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Low (&le;2.8 mph)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Medium (2.8-4.0)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">High (&gt;4.0 mph)</span>
              </div>
            </>
          )}

          {overlayMode === 'drift' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Stable (&le;0.20)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Moderate (0.20-0.35)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Elevated (&gt;0.35)</span>
              </div>
            </>
          )}

          {overlayMode === 'quality' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">High (&ge;90%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Moderate (75-90%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Low (&lt;75%)</span>
              </div>
            </>
          )}

          {overlayMode === 'blind_spots' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Connected Node</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Blind Spot / Low Degree (&le;2)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
