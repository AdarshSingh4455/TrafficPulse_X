import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Calendar
} from 'lucide-react';
import { useReplay } from '../../context/ReplayContext';

export default function TopReplayBar() {
  const {
    timeIndex,
    maxTimeSteps,
    timestampStr,
    isPlaying,
    replaySpeed,
    setReplaySpeed,
    togglePlay,
    stepForward,
    stepBackward,
    jumpToStep
  } = useReplay();

  return (
    <div className="bg-slate-100/90 dark:bg-[#04101A]/90 border-b border-slate-200 dark:border-[#17364E]/80 px-4 lg:px-6 py-2 transition-colors select-none text-xs">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Left Section: Replay Status & Timestamp */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-700 dark:text-cyan-300 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            HISTORICAL REPLAY
          </span>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-[#F7FAFF] font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#081827] border border-slate-200 dark:border-[#17364E]">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>{timestampStr}</span>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-[#7F96AA]">
              Index <span className="font-bold text-slate-700 dark:text-[#BCD0E2]">{timeIndex}</span> / {maxTimeSteps - 1}
            </span>
          </div>
        </div>

        {/* Center Section: Playback Controls & Timeline Slider */}
        <div className="flex-1 max-w-2xl flex items-center gap-2 sm:gap-3">
          {/* Step Backward Button */}
          <button
            onClick={stepBackward}
            className="p-1 rounded-md text-slate-600 dark:text-[#BCD0E2] hover:bg-slate-200 dark:hover:bg-[#102941] transition-colors"
            title="Step Backward (5 min)"
            aria-label="Step backward 5 minutes"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            onClick={togglePlay}
            className={`p-1.5 rounded-lg font-semibold flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/30'
            }`}
            title={isPlaying ? 'Pause Historical Replay' : 'Play Historical Replay'}
            aria-label={isPlaying ? 'Pause replay' : 'Start replay'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          {/* Step Forward Button */}
          <button
            onClick={stepForward}
            className="p-1 rounded-md text-slate-600 dark:text-[#BCD0E2] hover:bg-slate-200 dark:hover:bg-[#102941] transition-colors"
            title="Step Forward (5 min)"
            aria-label="Step forward 5 minutes"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Timeline Slider */}
          <div className="flex-1 min-w-[120px] flex items-center">
            <input
              type="range"
              min="0"
              max={maxTimeSteps - 1}
              value={timeIndex}
              onChange={(e) => jumpToStep(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-[#0B2033] rounded-lg"
              aria-label="Replay timeline slider"
            />
          </div>
        </div>

        {/* Right Section: Replay Speed Multiplier Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-[#7F96AA]">Replay Speed:</span>
          <div className="flex items-center gap-0.5 rounded-lg bg-white dark:bg-[#081827] p-0.5 border border-slate-200 dark:border-[#17364E]">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setReplaySpeed(s)}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                  replaySpeed === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-[#7F96AA] hover:text-slate-900 dark:hover:text-[#F7FAFF]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
