'use client';

import { useState, useEffect } from 'react';
import { Play, Square, RefreshCcw, Coffee } from 'lucide-react';

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Play a sound or notification here
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="pomodoro-widget glass-panel">
      <div className="flex-between mb-2">
        <span className="text-xs" style={{ fontWeight: 600, color: mode === 'work' ? 'var(--accent-primary)' : 'var(--success)' }}>
          {mode === 'work' ? 'FOCUS TIME' : 'BREAK TIME'}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`mode-btn ${mode === 'work' ? 'active' : ''}`} onClick={() => switchMode('work')}>Work</button>
          <button className={`mode-btn ${mode === 'break' ? 'active' : ''}`} onClick={() => switchMode('break')}>Break</button>
        </div>
      </div>
      
      <div className="timer-display">
        {mins}:{secs}
      </div>
      
      <div className="flex-center gap-4 mt-2">
        <button className="btn-icon" onClick={toggleTimer} style={{ background: isRunning ? 'var(--warning)' : 'var(--accent-primary)', color: 'white' }}>
          {isRunning ? <Square size={16} /> : <Play size={16} />}
        </button>
        <button className="btn-icon" onClick={resetTimer}>
          <RefreshCcw size={16} />
        </button>
      </div>

      <style jsx>{`
        .pomodoro-widget {
          padding: 16px;
          margin-top: auto;
          margin-bottom: 24px;
        }
        .timer-display {
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          font-variant-numeric: tabular-nums;
          line-height: 1;
          margin: 12px 0;
          color: var(--text-primary);
        }
        .mode-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .mode-btn.active {
          background: rgba(0,0,0,0.05);
          color: var(--text-primary);
        }
        [data-theme='dark'] .mode-btn.active { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
