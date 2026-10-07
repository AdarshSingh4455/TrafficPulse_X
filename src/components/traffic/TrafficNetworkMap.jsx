import React, { useState } from 'react';
import { Plus, Minus, Crosshair, ChevronDown, Network } from 'lucide-react';
import SensorMarker from './SensorMarker';
import TrafficLegend from './TrafficLegend';
import { useTheme } from '../../context/ThemeContext';
import { roadConnections } from '../../data/sensors';

export default function TrafficNetworkMap({ selectedSensor, onSelectSensor, sensors }) {
  const [viewMode] = useState("Traffic Flow");
  const [zoomLevel, setZoomLevel] = useState(1);
  const { isDark } = useTheme();

  const sensorList = sensors || [];
  const sensorMap = {};
  sensorList.forEach(s => {
    sensorMap[s.id] = s;
  });

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs dark:shadow-lg dark:shadow-black/20 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Network className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white tracking-wide">
            Live Traffic Network Overview
          </h3>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            <span>Live</span>
          </div>

          <div className="relative">
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#16213b] border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <span>{viewMode}</span>
              <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-[#16213b] border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden text-slate-700 dark:text-slate-300">
            <button 
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.4))}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.8))}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border-l border-slate-300 dark:border-slate-700 transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border-l border-slate-300 dark:border-slate-700 transition-colors"
              title="Reset View"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-[380px] bg-slate-100/70 dark:bg-[#0a1122] rounded-lg border border-slate-200 dark:border-slate-800/80 overflow-hidden select-none">
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: isDark
              ? "radial-gradient(ellipse at 80% 20%, rgba(14, 116, 144, 0.25) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(6, 78, 59, 0.2) 0%, transparent 50%)"
              : "radial-gradient(ellipse at 80% 20%, rgba(14, 116, 144, 0.1) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(6, 78, 59, 0.08) 0%, transparent 50%)"
          }}
        />

        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <path
            d="M 50,0 Q 65,40 75,70 T 95,100"
            fill="none"
            stroke={isDark ? "#0e7490" : "#38bdf8"}
            strokeWidth="28"
            strokeOpacity={isDark ? "0.25" : "0.35"}
            strokeLinecap="round"
          />
          <text x="68%" y="36%" fill={isDark ? "#38bdf8" : "#0284c7"} fillOpacity="0.5" fontSize="12" fontWeight="bold" letterSpacing="3">
            RIVER
          </text>
          <text x="18%" y="22%" fill={isDark ? "#64748b" : "#94a3b8"} fillOpacity="0.6" fontSize="11" fontWeight="bold">
            Sector A
          </text>
          <text x="22%" y="52%" fill={isDark ? "#64748b" : "#94a3b8"} fillOpacity="0.6" fontSize="11" fontWeight="bold">
            Sector B
          </text>
          <text x="74%" y="52%" fill={isDark ? "#64748b" : "#94a3b8"} fillOpacity="0.6" fontSize="11" fontWeight="bold">
            Sector C
          </text>
          <text x="68%" y="88%" fill={isDark ? "#64748b" : "#94a3b8"} fillOpacity="0.6" fontSize="11" fontWeight="bold">
            Sector D
          </text>
        </svg>

        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
        >
          {roadConnections.map((conn, index) => {
            const fromSensor = sensorMap[conn.from];
            const toSensor = sensorMap[conn.to];
            if (!fromSensor || !toSensor) return null;

            return (
              <g key={index}>
                {conn.isCongested && (
                  <line
                    x1={`${fromSensor.x}%`}
                    y1={`${fromSensor.y}%`}
                    x2={`${toSensor.x}%`}
                    y2={`${toSensor.y}%`}
                    stroke="#f43f5e"
                    strokeWidth="5"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                  />
                )}
                <line
                  x1={`${fromSensor.x}%`}
                  y1={`${fromSensor.y}%`}
                  x2={`${toSensor.x}%`}
                  y2={`${toSensor.y}%`}
                  stroke={conn.isCongested ? "#ef4444" : "#10b981"}
                  strokeWidth={conn.isCongested ? "2.5" : "1.5"}
                  strokeDasharray={conn.isCongested ? "none" : "3,3"}
                  strokeOpacity={conn.isCongested ? 0.9 : 0.4}
                />
              </g>
            );
          })}
        </svg>

        <div 
          className="absolute inset-0 transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
        >
          {sensorList.slice(0, 16).map((sensor) => (
            <SensorMarker
              key={sensor.id}
              sensor={sensor}
              isSelected={selectedSensor?.id === sensor.id}
              onSelect={onSelectSensor}
            />
          ))}
        </div>
      </div>

      <div className="mt-3">
        <TrafficLegend />
      </div>
    </div>
  );
}
