import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock, Calendar } from 'lucide-react';

export default function HistoricalReplayBar({
  timeIndex = 0,
  maxTimeSteps = 34272,
  timestampStr = "2012-03-01T00:00:00",
  timeSemantics = {},
  onTimeIndexChange
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1); // 1x, 2x, 5x, 10x
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, 1000 / replaySpeed);
      timerRef.current = setInterval(() => {
        onTimeIndexChange(prev => {
          if (prev >= maxTimeSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, replaySpeed, maxTimeSteps, onTimeIndexChange]);

  const handleStepBack = () => {
    setIsPlaying(false);
    onTimeIndexChange(prev => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    onTimeIndexChange(prev => Math.min(maxTimeSteps - 1, prev + 1));
  };

  const formattedTime = timestampStr ? timestampStr.replace('T', ' ').substring(0, 19) : '2012-03-01 00:00:00';

  return (
    <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Historical Replay Mode Label & Timestamp Info */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
          <Clock className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              HISTORICAL REPLAY
            </span>
            <span className="text-xs text-slate-400">METR-LA (2012-03-01 &rarr; 2012-06-27)</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono font-bold text-emerald-400 text-sm">{formattedTime}</span>
            {timeSemantics.dayName && (
              <span className="text-xs text-slate-400 font-medium">
                ({timeSemantics.dayName}, {timeSemantics.timeOfDay})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Slider & Step Controls */}
      <div className="flex-1 w-full max-w-xl flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStepBack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Previous 5 min (-1 step)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-md text-xs"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={handleStepForward}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Next 5 min (+1 step)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="0"
            max={maxTimeSteps - 1}
            value={timeIndex}
            onChange={(e) => {
              setIsPlaying(false);
              onTimeIndexChange(Number(e.target.value));
            }}
            className="flex-1 accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <span className="font-mono text-xs text-slate-400 min-w-[70px] text-right">
            Step {timeIndex}/{maxTimeSteps - 1}
          </span>
        </div>
      </div>

      {/* Speed Multiplier Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Speed:</span>
        <div className="flex rounded-lg bg-slate-800 border border-slate-700 p-0.5">
          {[1, 2, 5, 10].map(s => (
            <button
              key={s}
              onClick={() => setReplaySpeed(s)}
              className={`px-2 py-0.5 text-xs font-mono font-bold rounded transition-colors ${
                replaySpeed === s
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
