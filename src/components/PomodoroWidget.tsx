'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Square, Timer, CheckCircle } from 'lucide-react';
import { getTasks, updateTaskStatus } from '@/lib/taskActions';

export default function PomodoroWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  useEffect(() => {
    async function loadTasks() {
      const data = await getTasks();
      setTasks(data.filter((t: any) => t.status !== 'done'));
    }
    loadTasks();
  }, [isOpen]); // Reload tasks when widget is opened

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Timer finished!
      setIsRunning(false);
      playAlarm();
      if (selectedTaskId) {
        updateTaskStatus(selectedTaskId, 'done').then(() => {
          setSelectedTaskId('');
        });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, selectedTaskId]);

  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      osc.start();
      setTimeout(() => osc.stop(), 500);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="pomodoro-widget">
      {isOpen ? (
        <div className="pomodoro-panel glass-panel">
          <div className="pomodoro-header flex-between">
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Timer size={16} /> Focus Mode</h4>
            <button className="btn-icon" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="pomodoro-body">
            <div className="time-display">{minutes}:{seconds}</div>
            
            <div className="controls flex-center gap-2 mb-3">
              <button className="btn-icon" onClick={toggleTimer} style={{ background: isRunning ? 'var(--warning)' : 'var(--success)', color: 'white' }}>
                {isRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button className="btn-icon" onClick={resetTimer} style={{ background: 'var(--danger)', color: 'white' }}>
                <Square size={20} />
              </button>
            </div>

            <select 
              className="input-field" 
              value={selectedTaskId} 
              onChange={(e) => setSelectedTaskId(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '6px' }}
            >
              <option value="">Select task to focus on...</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            {selectedTaskId && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} /> Auto-completes when time is up
              </p>
            )}
          </div>
        </div>
      ) : (
        <button className="pomodoro-fab" onClick={() => setIsOpen(true)}>
          <Timer size={24} />
          {isRunning && <span className="running-badge"></span>}
        </button>
      )}

      <style jsx>{`
        .pomodoro-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
        }
        .pomodoro-fab {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background: var(--accent-primary);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
          position: relative;
        }
        .pomodoro-fab:hover {
          transform: scale(1.05);
        }
        .running-badge {
          position: absolute;
          top: 0;
          right: 0;
          width: 12px;
          height: 12px;
          background: var(--danger);
          border-radius: 50%;
          border: 2px solid white;
        }
        .pomodoro-panel {
          width: 280px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          background: var(--bg-primary);
        }
        .pomodoro-header {
          padding: 12px 16px;
          background: rgba(0,0,0,0.05);
          border-bottom: 1px solid var(--border-color);
        }
        .pomodoro-body {
          padding: 16px;
          text-align: center;
        }
        .time-display {
          font-size: 3.5rem;
          font-weight: 700;
          font-family: monospace;
          margin-bottom: 16px;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
