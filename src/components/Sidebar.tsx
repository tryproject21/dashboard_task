'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Folder, Calendar, FileEdit, LogIn, LogOut } from 'lucide-react';
import PomodoroTimer from './PomodoroTimer';
import { useTheme } from '@/components/ThemeProvider';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Files', path: '/files', icon: Folder },
    { name: 'Schedule', path: '/schedule', icon: Calendar },
    { name: 'Notes', path: '/notes', icon: FileEdit },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="text-gradient" style={{ fontSize: '1.75rem', margin: 0, letterSpacing: '-0.5px' }}>ProDash</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Professional Workspace</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
              <div className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <PomodoroTimer />
        <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ThemeToggle />
          {session ? (
            <div className="auth-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
              <img src={session.user?.image || ''} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{session.user?.name}</p>
                <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="btn-secondary" 
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
              onClick={() => signIn('google')}
            >
              <LogIn size={16} /> Sign in with Google
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button 
      className="btn-secondary" 
      style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}
