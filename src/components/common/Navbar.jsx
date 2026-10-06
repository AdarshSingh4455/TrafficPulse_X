import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  LayoutDashboard, 
  Network, 
  TrendingUp, 
  Layers, 
  GitFork, 
  Bell,
  Cpu
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const navItems = [
    { name: "Overview", path: "/overview", icon: LayoutDashboard },
    { name: "Traffic Network", path: "/network", icon: Network },
    { name: "Decision Intelligence", path: "/decision", icon: Cpu },
    { name: "Prediction & Forecasts", path: "/predictions", icon: TrendingUp },
    { name: "Communication Analytics", path: "/communication", icon: Layers },
    { name: "Federated Learning", path: "/federated", icon: GitFork },
    { name: "Alerts & Events", path: "/alerts", icon: Bell },
  ];

  return (
    <header className="bg-white dark:bg-[#0e1629] border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-50 transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Activity className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">TrafficPulse-X</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Evidence-on-Demand Federated Traffic-Flow Prediction
            </p>
          </div>
        </div>

        <nav className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-[#131d36] p-1 rounded-lg border border-slate-200 dark:border-slate-800/70">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/60"
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-xs">
          <ThemeToggle />

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-700 dark:text-emerald-300 font-medium text-[11px]">System Online</span>
          </div>

          <div className="hidden sm:block text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            Sun, 04 Oct 2026 18:48
          </div>
        </div>
      </div>

      <div className="flex xl:hidden overflow-x-auto gap-1 px-4 py-1.5 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#11192e]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/60"
                }`
              }
            >
              <Icon className="w-3 h-3" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </header>
  );
}
