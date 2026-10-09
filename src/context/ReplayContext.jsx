import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { fetchHealth } from '../services/api';

const ReplayContext = createContext(null);

const MAX_STEPS = 34272; // METR-LA length (2012-03-01 to 2012-06-27 at 5-min intervals)
const BASE_TIMESTAMP = new Date('2012-03-01T00:00:00Z').getTime();

export function ReplayProvider({ children }) {
  const [timeIndex, setTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1); // 1x, 2x, 5x, 10x
  const [backendStatus, setBackendStatus] = useState('CONNECTED'); // CONNECTED or UNAVAILABLE
  const [timeSemantics, setTimeSemantics] = useState({
    dayName: 'Thursday',
    timeOfDay: 'Midnight',
    hour: 0,
    minute: 0
  });

  const timerRef = useRef(null);

  // Derive timestamp from timeIndex
  const currentTimestampMs = BASE_TIMESTAMP + timeIndex * 5 * 60 * 1000;
  const currentDate = new Date(currentTimestampMs);
  const timestampStr = currentDate.toISOString().replace('T', ' ').substring(0, 19);

  // Compute time semantics
  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(currentTimestampMs);
    const hour = d.getUTCHours();
    const minute = d.getUTCMinutes();
    let tod = 'Night';
    if (hour >= 6 && hour < 12) tod = 'Morning';
    else if (hour >= 12 && hour < 17) tod = 'Afternoon';
    else if (hour >= 17 && hour < 21) tod = 'Evening';

    setTimeSemantics({
      dayName: days[d.getUTCDay()],
      timeOfDay: tod,
      hour,
      minute
    });
  }, [timeIndex, currentTimestampMs]);

  // Periodic health check
  const checkHealth = useCallback(async () => {
    try {
      await fetchHealth();
      setBackendStatus('CONNECTED');
    } catch {
      setBackendStatus('UNAVAILABLE');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Auto-play timer loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, 1000 / replaySpeed);
      timerRef.current = setInterval(() => {
        setTimeIndex((prev) => {
          if (prev >= MAX_STEPS - 1) {
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
  }, [isPlaying, replaySpeed]);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setTimeIndex((prev) => Math.min(MAX_STEPS - 1, prev + 1));
  }, []);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setTimeIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const jumpToStep = useCallback((step) => {
    setIsPlaying(false);
    setTimeIndex(Math.max(0, Math.min(MAX_STEPS - 1, step)));
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  return (
    <ReplayContext.Provider
      value={{
        timeIndex,
        setTimeIndex,
        maxTimeSteps: MAX_STEPS,
        timestampStr,
        timeSemantics,
        isPlaying,
        replaySpeed,
        setReplaySpeed,
        backendStatus,
        togglePlay,
        stepForward,
        stepBackward,
        jumpToStep
      }}
    >
      {children}
    </ReplayContext.Provider>
  );
}

export function useReplay() {
  const context = useContext(ReplayContext);
  if (!context) {
    throw new Error('useReplay must be used within a ReplayProvider');
  }
  return context;
}
