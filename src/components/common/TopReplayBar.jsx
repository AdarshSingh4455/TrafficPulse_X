import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Clock, 
  Database,
  Menu
} from 'lucide-react';
import { useReplay } from '../../context/ReplayContext';
import ThemeToggle from './ThemeToggle';

export default function TopReplayBar({ onToggleMobile }) {
  const {
    timeIndex,
    maxTimeSteps,
    timestampStr,
    isPlaying,
    replaySpeed,
    setReplaySpeed,
    backendStatus,
    togglePlay,
    stepForward,
    stepBackward,
    jumpToStep
  } = useReplay();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0b1120] border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 transition-colors select-none">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Section: Mobile Toggle + Badges */}
        <div className="flex items-center justify-between lg:justify-start gap-3">
          {/* Mobile Menu Hamburger */}
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Historical Replay Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              HISTORICAL REPLAY
            </span>

            {/* Dataset Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Database className="w-3 h-3 text-cyan-500" />
              <span>METR-LA • 207 Sensors • 5-min</span>
            </div>
          </div>

          {/* Right Mobile Status Bar (hidden on desktop) */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                backendStatus === 'CONNECTED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}
            >
              {backendStatus}
            </span>
          </div>
        </div>

        {/* Center: Replay Controls & Timeline */}
        <div className="flex-1 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl">
          {/* Step Back / Play-Pause / Step Forward */}
          <div className="flex items-center gap-1">
            <button
              onClick={stepBackward}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Previous 5-min step (-1)"
              aria-label="Previous step"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={togglePlay}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
              title={isPlaying ? 'Pause replay' : 'Play replay'}
              aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">Play</span>
                </>
              )}
            </button>

            <button
              onClick={stepForward}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Next 5-min step (+1)"
              aria-label="Next step"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timeline Slider */}
          <div className="flex-1 min-w-[140px] max-w-sm flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={maxTimeSteps - 1}
              value={timeIndex}
              onChange={(e) => jumpToStep(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
              aria-label="Replay timeline slider"
            />
          </div>

          {/* Timestamp and Step readout */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-1 text-slate-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Clock className="w-3 h-3 text-slate-500 dark:text-emerald-500" />
              <span>{timestampStr}</span>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Step {timeIndex}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="hidden md:flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-slate-700/80">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setReplaySpeed(s)}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                  replaySpeed === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Right Section: Backend Status & Theme Toggle (desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Backend Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border ${
              backendStatus === 'CONNECTED'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'CONNECTED'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span>{backendStatus}</span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
