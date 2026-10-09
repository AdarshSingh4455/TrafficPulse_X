import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import TopReplayBar from '../components/common/TopReplayBar';
import AppRoutes from './routes';
import { ReplayProvider } from '../context/ReplayContext';
import OpeningExperience from '../components/intro/OpeningExperience';
import { X } from 'lucide-react';

export default function App() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('replay_intro') === 'true') return true;
    try {
      return !sessionStorage.getItem('tp_intro_completed');
    } catch {
      return false;
    }
  });

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('tp_intro_completed', 'true');
    } catch {
      // Safe fallback for restricted browsing environments
    }
    setShowIntro(false);
  };

  return (
    <ReplayProvider>
      {showIntro && <OpeningExperience onComplete={handleIntroComplete} />}
      <div className="min-h-screen bg-slate-50 dark:bg-[#080d19] text-slate-900 dark:text-slate-100 flex font-sans selection:bg-blue-600 selection:text-white transition-colors duration-150">
        {/* Desktop Persistent Left Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 sticky top-0 h-screen overflow-y-auto z-30">
          <Sidebar />
        </div>

        {/* Mobile Slide-over Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-64 max-w-[80vw] bg-white dark:bg-[#0b1120] h-full shadow-2xl z-10 flex flex-col">
              <div className="flex items-center justify-end p-2 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Global Top Replay Bar */}
          <TopReplayBar onToggleMobile={() => setMobileSidebarOpen((prev) => !prev)} />

          {/* Page Routing Container */}
          <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 lg:px-6 py-5">
            <AppRoutes />
          </main>

          {/* Compact Scientific Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800/80 py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-[#0b1120]/50 backdrop-blur-xs">
            <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">TrafficPulse-X</span>
                <span>•</span>
                <span>Evidence-on-Demand Federated Traffic-Flow Prediction</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>METR-LA (207 Sensors)</span>
                <span>•</span>
                <span>Spatial Partitioning (4 Regions)</span>
                <span>•</span>
                <span className="text-cyan-500 font-semibold">Digital Twin Online</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ReplayProvider>
  );
}
