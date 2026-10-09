import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  LayoutDashboard, 
  Network, 
  TrendingUp, 
  Cpu, 
  GitFork, 
  Layers, 
  Bell,
  CheckCircle2,
  Clock,
  CircleDot
} from 'lucide-react';

export default function Sidebar({ onCloseMobile }) {
  const navItems = [
    { name: "Overview", path: "/overview", icon: LayoutDashboard },
    { name: "Traffic Network", path: "/network", icon: Network },
    { name: "Predictions", path: "/predictions", icon: TrendingUp },
    { name: "Decision Intelligence", path: "/decision", icon: Cpu },
    { name: "Federated Learning", path: "/federated", icon: GitFork },
    { name: "Communication", path: "/communication", icon: Layers },
    { name: "Alerts", path: "/alerts", icon: Bell },
  ];

  return (
    <aside className="w-64 h-full flex flex-col justify-between bg-white dark:bg-[#0b1120] border-r border-slate-200 dark:border-slate-800/80 p-4 select-none">
      {/* Top Section: Logo & Branding */}
      <div>
        <div className="flex items-center gap-3 px-2 py-1.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">TrafficPulse-X</span>
            <p className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold tracking-wide uppercase">
              Sense • Predict • Decide
            </p>
          </div>
        </div>

        {/* Tagline / Subtitle */}
        <div className="mx-2 mb-5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
          <p className="italic">
            &ldquo;Sense only what matters. Ask the next best question. Share only what helps.&rdquo;
          </p>
        </div>

        {/* Navigation Items (7 exact items) */}
        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                <span className="text-[10px] opacity-60 font-mono">0{idx + 1}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Compact Project Status */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              System Lifecycle
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              v1.0-RC
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            {/* Phase 1-8 */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Phase 1–8:</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                COMPLETE / FROZEN
              </span>
            </div>

            {/* Phase 9 */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Phase 9:</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                IN PROGRESS
              </span>
            </div>

            {/* Phase 10 */}
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <CircleDot className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Phase 10:</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700 font-medium">
                PENDING
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
