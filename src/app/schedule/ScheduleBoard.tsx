'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { addMeeting, deleteMeeting, editMeeting, updateMeetingDate } from '@/lib/meetingActions';
import { useRouter } from 'next/navigation';

type Meeting = {
  id: string;
  title: string;
  date: string;
  link: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  priority: string;
};

export default function ScheduleBoard({ initialMeetings, initialTasks = [] }: { initialMeetings: Meeting[], initialTasks?: Task[] }) {
  const router = useRouter();
  const [meetings, setMeetings] = useState(initialMeetings);
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMeeting, setActionMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this meeting?")) {
      setMeetings(meetings.filter(m => m.id !== id));
      await deleteMeeting(id);
    }
  };

  const handleMeetingClick = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionMeeting(meeting);
  }

  const handleEdit = () => {
    setEditingMeeting(actionMeeting);
    setActionMeeting(null);
    setSelectedDate('');
    setIsModalOpen(true);
  }

  const handleDayClick = (dateStr: string) => {
    setEditingMeeting(null);
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  }

  const handleTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/tasks');
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('meeting_id', id);
  }

  const handleDrop = async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const meetingId = e.dataTransfer.getData('meeting_id');
    if (!meetingId) return;

    // Optimistic UI update
    setMeetings(prev => prev.map(m => {
      if (m.id === meetingId) {
        const oldDate = new Date(m.date);
        const [year, month, day] = dateStr.split('-');
        oldDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
        return { ...m, date: oldDate.toISOString() };
      }
      return m;
    }));

    await updateMeetingDate(meetingId, dateStr);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  }

  // Calendar logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayMeetings = meetings.filter(m => {
        const mDate = new Date(m.date);
        return mDate.getFullYear() === year && mDate.getMonth() === month && mDate.getDate() === d;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const dayTasks = tasks.filter(t => {
        if (!t.deadline) return false;
        const tDate = new Date(t.deadline);
        return tDate.getFullYear() === year && tDate.getMonth() === month && tDate.getDate() === d;
      });

              const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
      const isFirstDay = d === 1;
      const monthAbbr = new Date(year, month, d).toLocaleString('en-US', { month: 'short' });
      const displayDate = isFirstDay ? `${monthAbbr} ${d}` : d;

      cells.push(
        <div 
          key={d} 
          className={`calendar-cell ${isToday ? 'today' : ''}`} 
          onClick={() => handleDayClick(dateStr)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, dateStr)}
        >
          <div className="cell-header">
            <span className="day-number">{displayDate}</span>
          </div>
          <div className="cell-events">
            {dayMeetings.map(m => {
              const dateObj = new Date(m.date);
              const timeString = dateObj.toLocaleTimeString([], {hour: 'numeric', minute: dateObj.getMinutes() === 0 ? undefined : '2-digit'}).toLowerCase().replace(' ', '');
              return (
              <div 
                key={m.id} 
                className="event-badge meeting-badge" 
                onClick={(e) => handleMeetingClick(m, e)} 
                draggable
                onDragStart={(e) => handleDragStart(e, m.id)}
              >
                <div className="event-dot" style={{ backgroundColor: '#1a73e8' }}></div>
                <span className="event-time">{timeString}</span>
                <span className="event-title">&nbsp;{m.title}</span>
                <button type="button" className="delete-btn" onClick={(e) => handleDelete(m.id, e)}><Trash2 size={12}/></button>
              </div>
            )})}
            {dayTasks.map(t => {
              let baseColor = '#0f9d58'; // default green
              if (t.priority === 'high') baseColor = '#d93025'; // red
              else if (t.priority === 'medium') baseColor = '#f29900'; // yellow

              return (
                <div 
                  key={`task-${t.id}`} 
                  className="event-badge task-badge" 
                  onClick={handleTaskClick} 
                  style={{ 
                    backgroundColor: `${baseColor}20`,
                    borderLeft: `3px solid ${baseColor}`,
                    color: '#3c4043',
                    opacity: t.status === 'done' ? 0.6 : 1 
                  }}
                >
                  <CheckCircle2 size={12} color={baseColor} style={{ flexShrink: 0 }} />
                  <span className="event-title" style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                    {t.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#ffffff' }}>
      {/* Google Calendar Style Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px', borderBottom: '1px solid #dadce0', backgroundColor: '#ffffff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', color: '#3c4043', border: '1px solid #dadce0', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 500 }} onClick={() => setCurrentMonth(new Date())}>
            Today
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%' }} className="icon-btn-hover" onClick={prevMonth}>
              <ChevronLeft size={20} />
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%' }} className="icon-btn-hover" onClick={nextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>
          
          <h2 style={{ fontSize: '1.375rem', fontWeight: 400, color: '#3c4043', margin: 0 }}>
            {monthNames[month]} {year}
          </h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/api/calendar/feed" download style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.875rem', color: '#3c4043', border: '1px solid #dadce0', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 500 }}>
            <CalendarIcon size={16} /> Export
          </a>
          <button onClick={() => { setEditingMeeting(null); setSelectedDate(''); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 24px', fontSize: '0.875rem', color: '#fff', border: 'none', borderRadius: '24px', backgroundColor: '#1a73e8', cursor: 'pointer', fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' }}>
            <Plus size={20} /> Create
          </button>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-grid">
          {days.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {renderCells()}
        </div>
      </div>

      {actionMeeting && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActionMeeting(null) }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 className="mb-4">{actionMeeting.title}</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {new Date(actionMeeting.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => router.push(`/schedule/${actionMeeting.id}/report`)}>
                📄 Write / View Report
              </button>
              <button className="btn btn-secondary" onClick={handleEdit}>
                ✏️ Edit Meeting Details
              </button>
              {actionMeeting.link && actionMeeting.link.startsWith('http') && (
                <a href={actionMeeting.link} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                  🔗 Join Meeting
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setIsModalOpen(false); setEditingMeeting(null); } }}>
          <div className="modal-content">
            <h2 className="mb-4">{editingMeeting ? 'Edit Meeting' : 'Schedule a Meeting'}</h2>
            <form action={async (formData) => {
              const localDate = formData.get('date') as string;
              if (localDate && !localDate.includes('Z')) {
                formData.set('date', new Date(localDate).toISOString());
              }
              formData.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

              if (editingMeeting) {
                await editMeeting(editingMeeting.id, formData);
              } else {
                await addMeeting(formData);
              }
              setIsModalOpen(false);
              setEditingMeeting(null);
              window.location.reload(); 
            }}>
              <div className="input-group">
                <label className="input-label">Meeting Title</label>
                <input name="title" required className="input-field" placeholder="e.g. Weekly Sync with Team" defaultValue={editingMeeting?.title || ''} />
              </div>
              <div className="input-group">
                <label className="input-label">Date & Time</label>
                <input type="datetime-local" name="date" required className="input-field" defaultValue={editingMeeting ? new Date(new Date(editingMeeting.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : selectedDate ? `${selectedDate}T09:00` : ''} />
              </div>
              <div className="input-group">
                <label className="input-label">Meeting Link / Location</label>
                <input name="link" className="input-field" placeholder="e.g. https://meet.google.com/..." defaultValue={editingMeeting?.link || ''} />
              </div>
              
              <div className="flex-between mt-4" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setEditingMeeting(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingMeeting ? 'Save Changes' : 'Save Meeting'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-container {
          background: #ffffff;
          border: none;
          overflow: hidden;
          font-family: 'Google Sans', 'Roboto', 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .icon-btn-hover:hover {
          background-color: #f1f3f4 !important;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: auto repeat(auto-fill, minmax(80px, 1fr)); 
          flex: 1;
          background: #dadce0;
          gap: 1px; 
          border-top: 1px solid #dadce0;
        }

        .calendar-day-header {
          text-align: center;
          font-weight: 500;
          color: #70757a;
          padding: 8px 0 4px 0;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          background: #ffffff;
        }

        .calendar-cell {
          background: #ffffff;
          padding: 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          position: relative;
          min-width: 0; 
        }

        .calendar-cell:not(.empty):hover {
          background: #f1f3f4;
        }

        .calendar-cell.empty {
          background: #f8f9fa; 
          cursor: default;
        }

        .cell-header {
          text-align: center; 
          margin-bottom: 4px;
          margin-top: 2px;
        }

        .day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 400;
          color: #3c4043;
        }

        .calendar-cell.today .day-number {
          background: #1a73e8;
          color: white;
          font-weight: 500;
        }

        .calendar-cell:not(.today):not(.empty):hover .day-number {
          background: #f1f3f4;
        }

        .cell-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden; 
          scrollbar-width: none; 
          padding-right: 2px;
          min-width: 0;
          width: 100%;
        }
        
        .cell-events::-webkit-scrollbar {
          display: none;
        }

        .event-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 400;
          line-height: 1.2;
          border: none;
          max-width: 100%; 
          overflow: hidden; 
          position: relative;
          color: #3c4043;
        }

        .meeting-badge {
          background-color: transparent;
        }

        .meeting-badge:hover {
          background-color: rgba(26, 115, 232, 0.08);
          cursor: pointer;
        }

        .task-badge {
          font-weight: 500;
        }
        
        .task-badge:hover {
          filter: brightness(0.95);
          cursor: pointer;
        }

        .event-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .event-time {
          font-weight: 400;
          color: #3c4043;
          white-space: nowrap;
          font-size: 0.75rem;
          flex-shrink: 0; 
        }

        .event-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0; 
          font-weight: 500;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: #5f6368;
          opacity: 0;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
          position: absolute;
          right: 2px;
          background-color: #f1f3f4;
        }

        .delete-btn:hover {
          color: #d93025;
          background-color: #e8eaed;
        }
        
        .event-badge:hover .delete-btn {
          opacity: 1;
        }

        /* Dark mode overrides, if the app still supports it */
        :global([data-theme='dark']) .calendar-container {
          background: #202124;
          border-color: #5f6368;
        }
        :global([data-theme='dark']) .calendar-header {
          background: #202124;
          border-color: #5f6368;
          color: #e8eaed !important;
        }
        :global([data-theme='dark']) .calendar-header h2 {
          color: #e8eaed !important;
        }
        :global([data-theme='dark']) .calendar-grid {
          background: #5f6368;
        }
        :global([data-theme='dark']) .calendar-day-header {
          background: #202124;
          color: #9aa0a6;
        }
        :global([data-theme='dark']) .calendar-cell {
          background: #202124;
        }
        :global([data-theme='dark']) .calendar-cell:not(.empty):hover {
          background: #303134;
        }
        :global([data-theme='dark']) .calendar-cell.empty {
          background: #171717;
        }
        :global([data-theme='dark']) .day-number {
          color: #e8eaed;
        }
        :global([data-theme='dark']) .event-time,
        :global([data-theme='dark']) .event-title,
        :global([data-theme='dark']) .event-badge {
          color: #e8eaed !important;
        }
        :global([data-theme='dark']) .meeting-badge:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
