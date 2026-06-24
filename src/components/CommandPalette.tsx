'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CheckSquare, Folder, Calendar, FileEdit } from 'lucide-react';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{id: string, title: string, type: string}[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (query.trim() === '') {
        setResults([]);
        return;
      }
      const fetchResults = async () => {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results);
      };
      const timer = setTimeout(fetchResults, 300);
      return () => clearTimeout(timer);
    }
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelect = (type: string) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'task') router.push('/tasks');
    else if (type === 'file') router.push('/files');
    else if (type === 'meeting') router.push('/schedule');
    else if (type === 'note') router.push('/notes');
  };

  const getIcon = (type: string) => {
    if (type === 'task') return <CheckSquare size={16} />;
    if (type === 'file') return <Folder size={16} />;
    if (type === 'meeting') return <Calendar size={16} />;
    if (type === 'note') return <FileEdit size={16} />;
    return null;
  };

  return (
    <div className="cmd-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}>
      <div className="cmd-modal glass-panel">
        <div className="cmd-header">
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, files, notes... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="cmd-input"
          />
          <div className="cmd-badge">ESC</div>
        </div>
        
        {results.length > 0 && (
          <div className="cmd-results">
            {results.map((result) => (
              <div key={`${result.type}-${result.id}`} className="cmd-result-item" onClick={() => handleSelect(result.type)}>
                <div className="flex-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  {getIcon(result.type)}
                </div>
                <span style={{ flex: 1 }}>{result.title}</span>
                <span className="text-xs" style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{result.type}</span>
              </div>
            ))}
          </div>
        )}
        
        {query.trim() !== '' && results.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No results found for "{query}"
          </div>
        )}
      </div>

      <style jsx>{`
        .cmd-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 10vh;
        }
        .cmd-modal {
          width: 100%;
          max-width: 600px;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          background: var(--bg-secondary);
        }
        .cmd-header {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          gap: 12px;
        }
        .cmd-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 1.1rem;
          outline: none;
          font-family: inherit;
        }
        .cmd-badge {
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(0,0,0,0.05);
          color: var(--text-muted);
          font-weight: 600;
        }
        [data-theme='dark'] .cmd-badge { background: rgba(255,255,255,0.1); }
        .cmd-results {
          max-height: 400px;
          overflow-y: auto;
          padding: 8px;
        }
        .cmd-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          border-radius: var(--border-radius-sm);
          transition: background 0.2s;
        }
        .cmd-result-item:hover {
          background: rgba(0,0,0,0.03);
        }
        [data-theme='dark'] .cmd-result-item:hover { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
