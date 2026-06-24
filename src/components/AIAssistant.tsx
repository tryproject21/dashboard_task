'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X } from 'lucide-react';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Halo! Saya Asisten AI ProDash Anda. Tanyakan tentang jadwal, tugas prioritas, atau tugas yang telat!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Oops, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button className="ai-fab" onClick={() => setIsOpen(!isOpen)} style={{ display: isOpen ? 'none' : 'flex' }}>
        <Bot size={24} />
      </button>

      {isOpen && (
        <div className="ai-chat-window glass-panel">
          <div className="ai-header flex-between">
            <div className="flex-center gap-2">
              <Bot size={20} style={{ color: 'var(--accent-primary)' }} />
              <h4 style={{ margin: 0 }}>ProDash AI</h4>
            </div>
            <button className="btn-icon" onClick={() => setIsOpen(false)} style={{ padding: '4px' }}>
              <X size={18} />
            </button>
          </div>
          
          <div className="ai-body">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-message-wrapper ${msg.role}`}>
                <div className="ai-message">
                  {msg.content.split('\n').map((line, j) => <p key={j} style={{ margin: 0 }}>{line}</p>)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message-wrapper ai">
                <div className="ai-message typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="ai-footer" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Tanyakan tentang tugas Anda..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="ai-input"
            />
            <button type="submit" className="ai-send-btn" disabled={isLoading || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .ai-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--accent-gradient);
          color: white;
          border: none;
          box-shadow: var(--shadow-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 100;
          transition: transform 0.2s;
        }
        .ai-fab:hover {
          transform: scale(1.05);
        }
        .ai-chat-window {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 350px;
          height: 500px;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow: hidden;
          background: var(--bg-secondary);
        }
        .ai-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          background: rgba(0,0,0,0.02);
        }
        [data-theme='dark'] .ai-header { background: rgba(255,255,255,0.02); }
        .ai-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ai-message-wrapper {
          display: flex;
          width: 100%;
        }
        .ai-message-wrapper.user {
          justify-content: flex-end;
        }
        .ai-message-wrapper.ai {
          justify-content: flex-start;
        }
        .ai-message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .user .ai-message {
          background: var(--accent-primary);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .ai .ai-message {
          background: rgba(0,0,0,0.05);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }
        [data-theme='dark'] .ai .ai-message { background: rgba(255,255,255,0.1); }
        .ai-footer {
          padding: 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 8px;
        }
        .ai-input {
          flex: 1;
          background: rgba(0,0,0,0.03);
          border: 1px solid transparent;
          border-radius: 20px;
          padding: 8px 16px;
          color: var(--text-primary);
          outline: none;
          font-family: inherit;
        }
        [data-theme='dark'] .ai-input { background: rgba(255,255,255,0.05); }
        .ai-input:focus {
          border-color: var(--accent-primary);
        }
        .ai-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent-primary);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .ai-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .typing-indicator span {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          margin: 0 2px;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
