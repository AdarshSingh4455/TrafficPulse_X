import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import './OpeningExperience.css';

/**
 * Premium Opening Experience for TrafficPulse-X.
 * Features:
 * - Urban smart city skyline and horizon.
 * - Exactly two distinct cars and two distinct motorcycles in dedicated lanes.
 * - Moving lane markings for velocity parallax.
 * - Restrained sensor telemetry indicators.
 * - Professional product title and tagline reveal.
 * - Accessible Skip Intro and prefers-reduced-motion support.
 */
export default function OpeningExperience({ onComplete }) {
  const [exiting, setExiting] = useState(false);
  const exitTimerRef = useRef(null);
  const completeTimerRef = useRef(null);

  const handleFinish = useCallback(() => {
    setExiting((prev) => {
      if (prev) return prev;
      // Graceful fade transition before unmounting
      exitTimerRef.current = setTimeout(() => {
        onComplete?.();
      }, 420);
      return true;
    });
  }, [onComplete]);

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Immediate handover for reduced motion preference
      const instantTimer = setTimeout(() => {
        handleFinish();
      }, 350);
      return () => clearTimeout(instantTimer);
    }

    // Auto-advance after 2.6 seconds (total sequence ~2.8s)
    completeTimerRef.current = setTimeout(() => {
      handleFinish();
    }, 2600);

    // Keyboard support: Escape key skips intro
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(completeTimerRef.current);
      clearTimeout(exitTimerRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleFinish]);

  return (
    <div
      className={`tp-intro-overlay ${exiting ? 'tp-intro-exit' : ''}`}
      role="region"
      aria-label="TrafficPulse-X Opening Presentation"
    >
      {/* Background Cybernetic Telemetry Grid */}
      <div className="tp-bg-grid" aria-hidden="true" />
      <div className="tp-skyline-glow" aria-hidden="true" />

      {/* Top Bar: Brand Status & Skip Action */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>TRAFFICPULSE-X // SENSING ACTIVE</span>
        </div>

        <button
          onClick={handleFinish}
          className="tp-skip-btn"
          aria-label="Skip opening animation and enter dashboard"
          autoFocus
        >
          <span>Skip Intro</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Center Main Stage: Skyline, Branding, and Roadway */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 w-full max-w-6xl mx-auto">
        
        {/* Subtle City Skyline Silhouette */}
        <div className="w-full h-24 mb-1 overflow-hidden relative flex items-end justify-center opacity-60">
          <svg
            className="w-full max-w-5xl h-24 text-slate-800"
            viewBox="0 0 1000 120"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Background Layer Skyscrapers */}
            <path
              d="M0 120 L0 80 L35 80 L35 60 L75 60 L75 120 L110 120 L110 40 L135 25 L160 40 L160 120 L220 120 L220 70 L260 70 L260 120 L310 120 L310 30 L345 30 L345 120 L420 120 L420 55 L460 55 L460 120 L510 120 L510 15 L530 5 L550 15 L550 120 L610 120 L610 65 L650 65 L650 120 L720 120 L720 35 L760 35 L760 120 L830 120 L830 50 L870 50 L870 120 L920 120 L920 75 L960 75 L960 120 L1000 120 Z"
              fill="#091122"
            />
            {/* Midground Layer Buildings */}
            <path
              d="M20 120 L20 90 L50 90 L50 120 L140 120 L140 60 L180 60 L180 120 L280 120 L280 45 L320 45 L320 120 L380 120 L380 75 L430 75 L430 120 L480 120 L480 30 L520 30 L520 120 L640 120 L640 50 L680 50 L680 120 L790 120 L790 60 L830 60 L830 120 L890 120 L890 85 L940 85 L940 120 L1000 120 Z"
              fill="#0f1a33"
              opacity="0.8"
            />
            {/* Communication & Sensor Spire beacons */}
            <line x1="135" y1="25" x2="135" y2="10" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="135" cy="8" r="2" fill="#38bdf8" />
            <line x1="530" y1="5" x2="530" y2="-5" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="530" cy="-6" r="2" fill="#38bdf8" />
            <line x1="740" y1="35" x2="740" y2="20" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="740" cy="18" r="2" fill="#f59e0b" />
          </svg>
        </div>

        {/* Polished Product Branding Reveal */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase mb-3 shadow-inner">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Digital Twin Mobility Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-2">
            Traffic<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200">Pulse</span><span className="text-amber-400">-X</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-normal">
            Intelligent Traffic Forecasting &amp; Urban Mobility Insights
          </p>
        </div>

        {/* Multi-Lane Smart Arterial Road with 4 Designated Lanes */}
        <div className="tp-roadway rounded-xl w-full">
          {/* Moving Dash Lane Dividers */}
          <div className="tp-lane-divider divider-1" />
          <div className="tp-lane-divider divider-2" />
          <div className="tp-lane-divider divider-3" />

          {/* Road Edge Boundaries */}
          <div className="tp-road-edge-top" />
          <div className="tp-road-edge-bottom" />

          {/* Spatial Sensor Telemetry Beams */}
          <div className="tp-sensor-gate gate-1" />
          <div className="tp-sensor-gate gate-2" />

          {/* ==============================================================
              LANE 1: CAR 1 — Executive Smart Sedan (Aerodynamic Coupe)
              ============================================================== */}
          <div className="tp-vehicle-lane lane-1">
            <div className="tp-vehicle tp-car-1">
              <svg width="120" height="42" viewBox="0 0 120 42" fill="none" aria-label="Smart Sedan">
                {/* Headlight Beam Projection */}
                <polygon points="105,22 170,12 170,36 105,28" fill="url(#car1Beam)" opacity="0.45" />
                {/* Chassis Shadow */}
                <ellipse cx="60" cy="38" rx="50" ry="3" fill="#000000" opacity="0.6" />
                {/* Lower Body */}
                <path d="M12 28 C15 22 25 20 40 20 L80 20 C95 20 108 22 112 28 L110 34 L10 34 Z" fill="#0284c7" />
                {/* Cabin / Windows */}
                <path d="M32 20 L44 9 L74 9 L88 20 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                <path d="M46 11 L72 11 L84 20 L36 20 Z" fill="#38bdf8" opacity="0.25" />
                {/* Sleek Roofline Accent */}
                <path d="M28 20 C38 9 78 9 92 20" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
                {/* Front LED Headlights (Cyan) */}
                <circle cx="111" cy="25" r="2.5" fill="#38bdf8" />
                {/* Rear LED Taillight (Red) */}
                <rect x="8" y="24" width="4" height="3" rx="1.5" fill="#ef4444" />
                {/* Alloy Wheels */}
                <circle cx="32" cy="34" r="7" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                <circle cx="32" cy="34" r="3" fill="#94a3b8" />
                <circle cx="88" cy="34" r="7" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                <circle cx="88" cy="34" r="3" fill="#94a3b8" />
                {/* Gradient Defs */}
                <defs>
                  <linearGradient id="car1Beam" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* ==============================================================
              LANE 2: MOTORCYCLE 1 — Agile High-Performance Sportbike
              ============================================================== */}
          <div className="tp-vehicle-lane lane-2">
            <div className="tp-vehicle tp-moto-1">
              <svg width="80" height="42" viewBox="0 0 80 42" fill="none" aria-label="Sport Motorcycle">
                {/* Headlight Beam */}
                <polygon points="68,20 120,12 120,32 68,24" fill="url(#moto1Beam)" opacity="0.4" />
                {/* Shadow */}
                <ellipse cx="40" cy="38" rx="30" ry="2.5" fill="#000000" opacity="0.5" />
                {/* Rider Silhouette (Aerodynamic Lean) */}
                <circle cx="36" cy="11" r="5" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1" /> {/* Helmet */}
                <path d="M34 16 L48 20 L42 28 L28 26 Z" fill="#0f172a" /> {/* Torso & Arms */}
                {/* Motorcycle Body Fairing */}
                <path d="M22 28 L38 22 L55 20 L68 22 L62 30 L32 30 Z" fill="#0284c7" />
                {/* Fuel Tank & Frame Accent */}
                <path d="M36 21 L48 21 L56 25" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                {/* Wheels */}
                <circle cx="20" cy="32" r="7.5" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1.5" />
                <circle cx="20" cy="32" r="2.5" fill="#e2e8f0" />
                <circle cx="62" cy="32" r="7.5" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1.5" />
                <circle cx="62" cy="32" r="2.5" fill="#e2e8f0" />
                {/* Headlight & Taillight */}
                <circle cx="68" cy="22" r="2" fill="#e0f2fe" />
                <rect x="14" y="24" width="3" height="2" fill="#ef4444" />
                <defs>
                  <linearGradient id="moto1Beam" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* ==============================================================
              LANE 3: CAR 2 — Modern Electric Urban SUV / Crossover
              ============================================================== */}
          <div className="tp-vehicle-lane lane-3">
            <div className="tp-vehicle tp-car-2">
              <svg width="128" height="46" viewBox="0 0 128 46" fill="none" aria-label="Urban Electric SUV">
                {/* Headlight Beam (Amber/Cyan Dual Horizon) */}
                <polygon points="112,24 175,14 175,40 112,30" fill="url(#car2Beam)" opacity="0.45" />
                {/* Shadow */}
                <ellipse cx="64" cy="42" rx="55" ry="3" fill="#000000" opacity="0.6" />
                {/* SUV Tall Robust Body */}
                <path d="M12 28 C15 20 28 18 42 18 L86 18 C100 18 114 21 118 28 L116 38 L10 38 Z" fill="#0f2b48" />
                {/* Roof & High Cabin */}
                <path d="M28 18 L38 7 L86 7 L98 18 Z" fill="#0a101d" stroke="#f59e0b" strokeWidth="1" />
                <path d="M40 9 L84 9 L94 18 L32 18 Z" fill="#38bdf8" opacity="0.2" />
                {/* Dual-Tone Amber Edge Trim */}
                <path d="M26 18 L98 18" stroke="#f59e0b" strokeWidth="1.5" />
                {/* Daytime Running Light Lightbar */}
                <line x1="114" y1="26" x2="118" y2="28" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
                {/* Rear Modern Lightbar */}
                <rect x="8" y="24" width="3.5" height="5" rx="1.5" fill="#ef4444" />
                {/* Heavy-Duty Wheels */}
                <circle cx="34" cy="37" r="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="34" cy="37" r="3.5" fill="#94a3b8" />
                <circle cx="94" cy="37" r="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="94" cy="37" r="3.5" fill="#94a3b8" />
                <defs>
                  <linearGradient id="car2Beam" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* ==============================================================
              LANE 4: MOTORCYCLE 2 — Urban Roadster (Upright Commuter)
              ============================================================== */}
          <div className="tp-vehicle-lane lane-4">
            <div className="tp-vehicle tp-moto-2">
              <svg width="84" height="42" viewBox="0 0 84 42" fill="none" aria-label="Urban Roadster Motorcycle">
                {/* Headlight Beam */}
                <polygon points="70,18 120,10 120,30 70,24" fill="url(#moto2Beam)" opacity="0.4" />
                {/* Shadow */}
                <ellipse cx="42" cy="38" rx="32" ry="2.5" fill="#000000" opacity="0.5" />
                {/* Upright Rider Stance */}
                <circle cx="35" cy="8" r="5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" /> {/* Helmet */}
                <path d="M34 13 L42 22 L46 29 L32 29 Z" fill="#0f172a" /> {/* Upright Torso */}
                {/* Trellis Frame / Roadster Tank */}
                <path d="M26 28 L38 21 L54 21 L64 24 L58 30 L28 30 Z" fill="#b45309" />
                <path d="M40 23 L52 23" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                {/* Wheels */}
                <circle cx="22" cy="32" r="7.5" fill="#111827" stroke="#fbbf24" strokeWidth="1.5" />
                <circle cx="22" cy="32" r="2.5" fill="#94a3b8" />
                <circle cx="64" cy="32" r="7.5" fill="#111827" stroke="#fbbf24" strokeWidth="1.5" />
                <circle cx="64" cy="32" r="2.5" fill="#94a3b8" />
                {/* Classic Round Headlight & Tail */}
                <circle cx="70" cy="20" r="2.5" fill="#fef08a" />
                <rect x="16" y="25" width="2.5" height="2.5" fill="#ef4444" />
                <defs>
                  <linearGradient id="moto2Beam" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fde047" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Telemetry Status Strip Under Road */}
        <div className="w-full mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400 px-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Zap className="w-3.5 h-3.5" />
              <span>SPATIAL CONVOLUTION + LSTM</span>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">207 HIGHWAY SPEED SENSORS</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>METR-LA HISTORICAL REPLAY</span>
          </div>
        </div>
      </main>

      {/* Footer Strip with Dynamic Progress Bar */}
      <footer className="relative z-20 w-full">
        <div className="tp-progress-bar" />
        <div className="flex items-center justify-between px-6 py-2.5 text-[10px] font-mono text-slate-400 bg-slate-950/70 border-t border-slate-800/60">
          <span>INITIALIZING DIGITAL TWIN ENVIRONMENT</span>
          <span className="text-cyan-400">READY</span>
        </div>
      </footer>
    </div>
  );
}
