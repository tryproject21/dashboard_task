'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { addMeeting, deleteMeeting, editMeeting } from '@/lib/meetingActions';

type Meeting = {
  id: string;
  title: string;
  date: string;
  link: string;
};

export default function ScheduleBoard({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [meetings, setMeetings] = useState(initialMeetings);
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

      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      cells.push(
        <div key={d} className={`calendar-cell ${isToday ? 'today' : ''}`} onClick={() => handleDayClick(dateStr)}>
          <div className="cell-header">
            <span className="day-number">{d}</span>
          </div>
          <div className="cell-events">
            {dayMeetings.map(m => (
              <div key={m.id} className="event-badge" onClick={(e) => handleEdit(m, e)}>
                <span className="event-time">{new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span className="event-title">{m.title}</span>
                <button type="button" className="delete-btn" onClick={(e) => handleDelete(m.id, e)}><Trash2 size={12}/></button>
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
          padding: 0;
          background: var(--bg-secondary);
          border-radius: 12px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .calendar-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: var(--border-color);
          gap: 1px; /* This creates the thin grid lines like Google Calendar */
          border-bottom: 1px solid var(--border-color);
        }

        .calendar-day-header {
          text-align: center;
          font-weight: 500;
          color: var(--text-secondary);
          padding: 12px 0;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: var(--bg-primary);
        }

        .calendar-cell {
          background: var(--bg-primary);
          min-height: 140px;
          padding: 8px;
          cursor: pointer;
          transition: background 0.1s;
          display: flex;
          flex-direction: column;
        }

        .calendar-cell:not(.empty):hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .calendar-cell.empty {
          background: var(--bg-secondary);
          opacity: 0.5;
          cursor: default;
        }

        .cell-header {
          text-align: center;
          margin-bottom: 8px;
        }

        .day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .calendar-cell:not(.empty):hover .day-number {
          background: rgba(0,0,0,0.05);
          color: var(--text-primary);
        }

        .calendar-cell.today .day-number {
          background: #1a73e8;
          color: white;
          font-weight: 600;
        }

        .calendar-cell.today .day-number:hover {
          background: #1557b0;
        }

        .cell-events {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          overflow-y: auto;
          scrollbar-width: thin;
        }
        
        .cell-events::-webkit-scrollbar {
          width: 4px;
        }
        .cell-events::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }

        .event-badge {
          background: var(--bg-secondary);
          color: var(--accent-primary);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          transition: filter 0.15s;
          border: 1px solid var(--accent-primary);
        }

        .event-badge:hover {
          filter: brightness(0.95);
          cursor: pointer;
        }

        .event-badge:before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          background: var(--accent-primary);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .event-time {
          opacity: 0.8;
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
          color: inherit;
          opacity: 0.5;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          border-radius: 4px;
        }

        .delete-btn:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--danger);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
