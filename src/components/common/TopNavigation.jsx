import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Map, 
  TrendingUp, 
  Cpu, 
  Radio, 
  Network, 
  Bell, 
  Menu, 
  X, 
  Database 
} from 'lucide-react';
import { useReplay } from '../../context/ReplayContext';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: Activity },
  { path: '/network', label: 'Traffic Network', icon: Map },
  { path: '/predictions', label: 'Predictions', icon: TrendingUp },
  { path: '/decision', label: 'Decision Intelligence', icon: Cpu },
  { path: '/communication', label: 'Communication', icon: Radio },
  { path: '/federated', label: 'Federated Learning', icon: Network },
  { path: '/alerts', label: 'Alerts', icon: Bell }
];

export default function TopNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { backendStatus } = useReplay();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-[#06111D]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#17364E] transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Left Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow flex items-center justify-center">
                <div className="w-full h-full bg-[#06111D] rounded-[7px] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-[#F7FAFF]">
                    TrafficPulse<span className="text-blue-500">-X</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 font-bold">
                    v1.0
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] text-slate-500 dark:text-[#7F96AA] tracking-tight -mt-0.5 font-medium">
                  Evidence-on-Demand Traffic Intelligence
                </span>
              </div>
            </NavLink>
          </div>

          {/* Center: Desktop Navigation Tabs */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-100/80 dark:bg-[#081827]/90 p-1 rounded-xl border border-slate-200/80 dark:border-[#17364E]/80">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/40'
                      : 'text-slate-600 dark:text-[#BCD0E2] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#102941]/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-[#7F96AA]'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Right Controls: Backend Status, Theme Toggle, Mobile Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Dataset Pill (hidden on small screens) */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-100 dark:bg-[#0B2033] border border-slate-200 dark:border-[#17364E] text-slate-700 dark:text-[#BCD0E2]">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>METR-LA • 207 Sensors</span>
            </div>

            {/* Backend Connectivity Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border ${
                backendStatus === 'CONNECTED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="hidden sm:inline">{backendStatus}</span>
            </div>

            <ThemeToggle />

            {/* Mobile / Tablet Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-600 dark:text-[#BCD0E2] hover:bg-slate-100 dark:hover:bg-[#0B2033] border border-transparent dark:border-[#17364E]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 dark:border-[#17364E] py-3 space-y-1 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pb-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-[#BCD0E2] hover:bg-slate-100 dark:hover:bg-[#0B2033]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
