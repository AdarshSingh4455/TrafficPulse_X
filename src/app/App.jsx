import React, { useState } from 'react';
import TopNavigation from '../components/common/TopNavigation';
import TopReplayBar from '../components/common/TopReplayBar';
import AppRoutes from './routes';
import { ReplayProvider } from '../context/ReplayContext';
import OpeningExperience from '../components/intro/OpeningExperience';

export default function App() {
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
      <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#06111D] text-slate-900 dark:text-[#F7FAFF] flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-150">
        {/* Top Horizontal Navigation */}
        <TopNavigation />

        {/* Global Historical Replay Bar */}
        <TopReplayBar />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 lg:px-6 py-5">
          <AppRoutes />
        </main>

        {/* Compact Research Console Footer */}
        <footer className="border-t border-slate-200 dark:border-[#17364E]/80 py-4 px-6 text-xs text-slate-500 dark:text-[#7F96AA] bg-white/70 dark:bg-[#04101A]/70 backdrop-blur-xs">
          <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-[#F7FAFF]">TrafficPulse-X</span>
              <span>•</span>
              <span className="text-slate-600 dark:text-[#BCD0E2]">Evidence-on-Demand Federated Traffic Intelligence</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>METR-LA (207 Sensors)</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Phases 1–8 Frozen</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Phase 9 Complete</span>
            </div>
          </div>
        </footer>
      </div>
    </ReplayProvider>
  );
}
