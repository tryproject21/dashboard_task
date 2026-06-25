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

  const handleEdit = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMeeting(meeting);
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

      cells.push(
        <div 
          key={d} 
          className={`calendar-cell ${isToday ? 'today' : ''}`} 
          onClick={() => handleDayClick(dateStr)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, dateStr)}
        >
          <div className="cell-header">
            <span className="day-number">{d}</span>
          </div>
          <div className="cell-events">
            {dayMeetings.map(m => (
              <div 
                key={m.id} 
                className="event-badge" 
                onClick={(e) => handleEdit(m, e)} 
                draggable
                onDragStart={(e) => handleDragStart(e, m.id)}
                style={{ backgroundColor: '#1a73e8', color: 'white', border: 'none' }}
              >
                <span className="event-time">{new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span className="event-title">{m.title}</span>
                <button type="button" className="delete-btn" onClick={(e) => handleDelete(m.id, e)}><Trash2 size={12}/></button>
              </div>
            ))}
            {dayTasks.map(t => (
              <div key={`task-${t.id}`} className="event-badge task-badge" onClick={handleTaskClick} style={{ backgroundColor: '#0f9d58', opacity: t.status === 'done' ? 0.6 : 1 }}>
                <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                <span className="event-title" style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Schedule</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your meetings and appointments.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/api/calendar/feed" download className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarIcon size={18} /> Export to GCal (.ics)
          </a>
          <button className="btn btn-primary" onClick={() => { setEditingMeeting(null); setSelectedDate(''); setIsModalOpen(true); }}>
            <Plus size={18} /> Add Meeting
          </button>
        </div>
      </div>

      <div className="glass-panel calendar-container">
        <div className="calendar-header flex-between mb-4">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{monthNames[month]} {year}</h2>
          <div className="flex-center gap-2">
            <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={24} /></button>
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setCurrentMonth(new Date())}>Today</button>
            <button className="btn-icon" onClick={nextMonth}><ChevronRight size={24} /></button>
          </div>
        </div>
        
        <div className="calendar-grid">
          {days.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {renderCells()}
        </div>
      </div>

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
          background: var(--bg-secondary);
          border-radius: 8px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          font-family: 'Roboto', 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          /* Full height minus paddings */
          height: calc(100vh - 200px); 
          min-height: 700px;
        }

        .calendar-header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: auto repeat(5, 1fr); /* 1 row for header, 5 for days */
          flex: 1;
          background: var(--border-color);
          gap: 1px; /* The iconic Google Calendar thin grid lines */
        }

        .calendar-day-header {
          text-align: center;
          font-weight: 500;
          color: var(--text-secondary);
          padding: 12px 0 4px 0;
          font-size: 0.75rem;
          text-transform: uppercase;
          background: var(--bg-secondary);
        }

        .calendar-cell {
          background: var(--bg-secondary);
          padding: 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .calendar-cell:not(.empty):hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .calendar-cell.empty {
          background: var(--bg-primary); /* Slight grey for outside month */
          opacity: 0.6;
          cursor: default;
        }

        .cell-header {
          text-align: center; /* Google Calendar centers the number */
          margin-bottom: 4px;
        }

        .day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .calendar-cell.today .day-number {
          background: #1a73e8;
          color: white;
          font-weight: 600;
        }

        .calendar-cell:not(.today):not(.empty):hover .day-number {
          background: rgba(0,0,0,0.06);
        }

        .cell-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          overflow-y: auto;
          scrollbar-width: none; /* Hide scrollbar for clean look */
        }
        
        .cell-events::-webkit-scrollbar {
          display: none;
        }

        .event-badge {
          background-color: #1a73e8; /* Google Blue */
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
          line-height: 1.4;
          box-shadow: none;
          transition: filter 0.15s;
          border: none;
        }

        .event-badge:hover {
          filter: brightness(0.9);
          cursor: pointer;
        }

        .event-time {
          font-weight: 600;
          opacity: 0.9;
          white-space: nowrap;
          font-size: 0.7rem;
        }

        .event-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: white;
          opacity: 0;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          border-radius: 4px;
          transition: opacity 0.2s;
        }

        .delete-btn:hover {
          background: rgba(0, 0, 0, 0.2);
        }
        
        .event-badge:hover .delete-btn {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
