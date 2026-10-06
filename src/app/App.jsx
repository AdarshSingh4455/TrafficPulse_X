import React from 'react';
import Navbar from '../components/common/Navbar';
import AppRoutes from './routes';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-150">
      {/* Sticky Top Navbar */}
      <Navbar />

      {/* Main Page Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-6 py-6">
        <AppRoutes />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TrafficPulse-X • Evidence-on-Demand Federated Traffic-Flow Prediction</span>
          <span className="font-mono text-slate-500 dark:text-slate-400">B.Tech Engineering Hackathon • Phase 4 Build</span>
        </div>
      </footer>
    </div>
  );
}
