import { getTasks } from '@/lib/taskActions';
import { getMeetings } from '@/lib/meetingActions';
import { getFiles } from '@/lib/fileActions';
import { getNotes } from '@/lib/noteActions';
import Link from 'next/link';
import { ArrowRight, CheckSquare, Clock, Folder, Calendar, FileEdit, BarChart2 } from 'lucide-react';
import AnalyticsChart from '@/components/AnalyticsChart';

export default async function Dashboard() {
  const tasks = await getTasks() as any[];
  const meetings = await getMeetings() as any[];
  const files = await getFiles() as any[];
  const notes = await getNotes() as any[];

  const upcomingMeetings = meetings
    .filter(m => new Date(m.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const urgentTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a,b) => new Date(a.deadline || '2099-01-01').getTime() - new Date(b.deadline || '2099-01-01').getTime())
    .slice(0, 3);

  const recentNotes = notes.slice(0, 2);

  // Generate last 7 days analytics data
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    const tasksCompleted = tasks.filter(t => t.status === 'done' && t.completedAt && new Date(t.completedAt).toDateString() === d.toDateString()).length;
    chartData.push({ name: dateStr, tasks: tasksCompleted });
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Welcome back, Professional.</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Here is your overview for today.</p>
      </div>

      <div className="dashboard-grid mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        
        {/* Card 1: Pending Tasks */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckSquare size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.5px' }}>PENDING TASKS</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{urgentTasks.length}</h2>
          </div>
        </div>

        {/* Card 2: Meetings Today */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, rgba(26, 115, 232, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(26, 115, 232, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.5px' }}>MEETINGS TODAY</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{upcomingMeetings.length}</h2>
          </div>
        </div>

        {/* Card 3: Completion Rate */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={28} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.5px' }}>COMPLETION (7D)</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
            </h2>
          </div>
        </div>

      </div>

      <div className="dashboard-grid">
        {/* Analytics Widget */}
        <div className="glass-panel widget-card" style={{ gridColumn: '1 / -1' }}>
          <div className="flex-between">
            <h3 className="flex-center gap-2"><BarChart2 size={20} style={{ color: 'var(--accent-primary)' }}/> Weekly Productivity</h3>
          </div>
          <AnalyticsChart data={chartData} />
        </div>

        {/* Urgent Tasks */}
        <div className="glass-panel widget-card">
          <div className="flex-between mb-4">
            <h3 className="flex-center gap-2"><CheckSquare size={20} style={{ color: 'var(--accent-primary)' }}/> Priority Tasks</h3>
            <Link href="/tasks" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="flex-center gap-2 text-sm hover-text">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {urgentTasks.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You have no pending tasks. Great job!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {urgentTasks.map(t => (
                <div key={t.id} className="task-item">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, marginBottom: '2px' }}>{t.title}</p>
                    <p className="text-xs flex-center" style={{ color: 'var(--danger)', justifyContent: 'flex-start', gap: '4px' }}>
                      <Clock size={12} /> {t.deadline || 'No deadline'}
                    </p>
                  </div>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="glass-panel widget-card">
          <div className="flex-between mb-4">
            <h3 className="flex-center gap-2"><Calendar size={20} style={{ color: 'var(--success)' }}/> Upcoming Schedule</h3>
            <Link href="/schedule" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="flex-center gap-2 text-sm hover-text">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming meetings. Enjoy your free time!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingMeetings.map(m => (
                <div key={m.id} className="meeting-item">
                  <div className="date-block">
                    <span className="text-xs text-gradient">{new Date(m.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span style={{ fontWeight: 600 }}>{new Date(m.date).getDate()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, marginBottom: '2px' }}>{m.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notes Widget */}
        <div className="glass-panel widget-card" style={{ gridColumn: '1 / -1' }}>
          <div className="flex-between mb-4">
            <h3 className="flex-center gap-2"><FileEdit size={20} style={{ color: 'var(--warning)' }}/> Recent Scratchpad</h3>
            <Link href="/notes" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="flex-center gap-2 text-sm hover-text">
              Open Notes <ArrowRight size={14} />
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notes written yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {recentNotes.map(n => (
                <div key={n.id} className="file-item" style={{ alignItems: 'flex-start', padding: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '8px' }}>{n.title}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {n.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
