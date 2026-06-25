'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Notification = {
  id: string;
  message: string;
  type: string;
  link: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      if (data.notifications && data.notifications.length > 0) {
        setHasUnread(true);
      }
    };
    
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000); // Poll every 1 minute

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  const handleNavigate = (link: string) => {
    setIsOpen(false);
    router.push(link);
  };

  return (
    <div className="notif-container" ref={menuRef}>
      <button className="notif-btn glass-panel" onClick={handleOpen}>
        <Bell size={20} style={{ color: 'var(--text-primary)' }} />
        {hasUnread && <span className="notif-dot"></span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown glass-panel">
          <div className="notif-header">
            <h4>Notifications</h4>
            <span className="badge">{notifications.length}</span>
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <p className="text-sm" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>You're all caught up!</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="notif-item" onClick={() => handleNavigate(n.link)}>
                  <div className={`notif-indicator notif-${n.type}`}></div>
                  <p className="text-sm">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .notif-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 100;
        }
        .notif-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
        }
        .notif-dot {
          position: absolute;
          top: 10px;
          right: 12px;
          width: 8px;
          height: 8px;
          background: var(--danger);
          border-radius: 50%;
          box-shadow: 0 0 0 2px var(--bg-secondary);
        }
        .notif-dropdown {
          position: absolute;
          top: 56px;
          right: 0;
          width: 320px;
          border-radius: var(--border-radius-sm);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          background: var(--bg-secondary);
        }
        .notif-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .notif-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .notif-item {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s;
        }
        .notif-item:hover {
          background: rgba(0,0,0,0.03);
        }
        [data-theme='dark'] .notif-item:hover { background: rgba(255,255,255,0.05); }
        .notif-item:last-child {
          border-bottom: none;
        }
        .notif-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .notif-danger { background: var(--danger); }
        .notif-warning { background: var(--warning); }
        .notif-info { background: var(--accent-primary); }
      `}</style>
    </div>
  );
}
