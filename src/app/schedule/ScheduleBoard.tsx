'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Circle } from 'lucide-react';
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
    setMeetings(prev => prev.map(m => {
      if (m.id === meetingId) {
        const oldDate = new Date(m.date);
        const [y, mo, da] = dateStr.split('-');
        oldDate.setFullYear(parseInt(y), parseInt(mo) - 1, parseInt(da));
        return { ...m, date: oldDate.toISOString() };
      }
      return m;
    }));
    await updateMeetingDate(meetingId, dateStr);
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); }

  // Calendar logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const goPrev = () => setCurrentMonth(new Date(year, month - 1, 1));
  const goNext = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayHeaders = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Build full 6-row grid (42 cells) like Google Calendar
  const buildCalendarCells = () => {
    const cells: { day: number; month: number; year: number; isCurrentMonth: boolean; }[] = [];

    // Previous month fill
    for (let i = 0; i < firstDayOfMonth; i++) {
      const d = prevMonthDays - firstDayOfMonth + 1 + i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month, year, isCurrentMonth: true });
    }
    // Next month fill (ensure we have at least 5 rows = 35 cells, or 6 rows = 42)
    const totalRows = cells.length > 35 ? 6 : Math.max(5, Math.ceil(cells.length / 7));
    const totalCells = totalRows * 7;
    let nextDay = 1;
    while (cells.length < totalCells) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      cells.push({ day: nextDay++, month: m, year: y, isCurrentMonth: false });
    }
    return cells;
  };

  const calendarCells = buildCalendarCells();
  const today = new Date();

  const formatDateLabel = (cell: { day: number; month: number; year: number; isCurrentMonth: boolean }) => {
    // Show "Jun 1", "Jul 1" etc for the 1st of any month
    if (cell.day === 1) {
      return `${monthShort[cell.month]} ${cell.day}`;
    }
    return `${cell.day}`;
  };

  const getDateStr = (cell: { day: number; month: number; year: number }) => {
    return `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
  };

  const isToday = (cell: { day: number; month: number; year: number }) => {
    return today.getFullYear() === cell.year && today.getMonth() === cell.month && today.getDate() === cell.day;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    if (m === 0) return `${hour}${ampm}`;
    return `${hour}:${String(m).padStart(2, '0')}${ampm}`;
  };

  const getTaskColor = (priority: string) => {
    if (priority === 'high') return '#d93025';
    if (priority === 'medium') return '#f4511e';
    return '#039be5'; // like Google Calendar Tasks teal
  };

  return (
    <div className="gcal-root">
      {/* === TOP BAR === */}
      <div className="gcal-topbar">
        <div className="gcal-topbar-left">
          <button className="gcal-today-btn" onClick={() => setCurrentMonth(new Date())}>
            Today
          </button>
          <button className="gcal-nav-btn" onClick={goPrev}><ChevronLeft size={20} /></button>
          <button className="gcal-nav-btn" onClick={goNext}><ChevronRight size={20} /></button>
          <span className="gcal-month-title">{monthNames[month]} {year}</span>
        </div>
        <div className="gcal-topbar-right">
          <a href="/api/calendar/feed" download className="gcal-today-btn" style={{ textDecoration: 'none' }}>
            Export .ics
          </a>
          <button className="gcal-create-btn" onClick={() => { setEditingMeeting(null); setSelectedDate(''); setIsModalOpen(true); }}>
            <Plus size={20} strokeWidth={2.5} />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* === CALENDAR GRID === */}
      <div className="gcal-grid-wrapper">
        <div className="gcal-grid">
          {/* Day headers */}
          {dayHeaders.map(dh => (
            <div key={dh} className="gcal-day-header">{dh}</div>
          ))}

          {/* Calendar cells */}
          {calendarCells.map((cell, idx) => {
            const dateStr = getDateStr(cell);
            const cellIsToday = isToday(cell);

            const dayMeetings = meetings.filter(m => {
              const mDate = new Date(m.date);
              return mDate.getFullYear() === cell.year && mDate.getMonth() === cell.month && mDate.getDate() === cell.day;
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const dayTasks = tasks.filter(t => {
              if (!t.deadline) return false;
              const tDate = new Date(t.deadline);
              return tDate.getFullYear() === cell.year && tDate.getMonth() === cell.month && tDate.getDate() === cell.day;
            });

            return (
              <div
                key={idx}
                className={`gcal-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cellIsToday ? 'today' : ''}`}
                onClick={() => handleDayClick(dateStr)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dateStr)}
              >
                <div className="gcal-cell-date">
                  <span className={`gcal-date-num ${cellIsToday ? 'today-circle' : ''}`}>
                    {formatDateLabel(cell)}
                  </span>
                </div>
                <div className="gcal-cell-events">
                  {dayMeetings.map(m => (
                    <div
                      key={m.id}
                      className="gcal-event-timed"
                      onClick={(e) => handleMeetingClick(m, e)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, m.id)}
                    >
                      <span className="gcal-event-dot"></span>
                      <span className="gcal-event-time">{formatTime(m.date)}</span>
                      <span className="gcal-event-label">{m.title}</span>
                      <button type="button" className="gcal-del-btn" onClick={(e) => handleDelete(m.id, e)}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                  {dayTasks.map(t => (
                    <div
                      key={`task-${t.id}`}
                      className="gcal-event-chip"
                      onClick={handleTaskClick}
                      style={{
                        backgroundColor: getTaskColor(t.priority),
                        opacity: t.status === 'done' ? 0.55 : 1,
                      }}
                    >
                      <Circle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                      <span className="gcal-chip-label" style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === ACTION MODAL === */}
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

      {/* === CREATE/EDIT MODAL === */}
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
        /* ============= ROOT ============= */
        .gcal-root {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 64px);
          background: #fff;
          font-family: 'Google Sans', 'Roboto', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          margin: -32px;
        }

        /* ============= TOP BAR ============= */
        .gcal-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          border-bottom: 1px solid #dadce0;
          background: #fff;
          flex-shrink: 0;
          height: 48px;
        }
        .gcal-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .gcal-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .gcal-today-btn {
          padding: 6px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #3c4043;
          background: #fff;
          border: 1px solid #dadce0;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          line-height: 1.25rem;
        }
        .gcal-today-btn:hover {
          background: #f1f3f4;
        }
        .gcal-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          border-radius: 50%;
          cursor: pointer;
          color: #5f6368;
        }
        .gcal-nav-btn:hover {
          background: #f1f3f4;
        }
        .gcal-month-title {
          font-size: 1.375rem;
          font-weight: 400;
          color: #3c4043;
          letter-spacing: 0;
        }
        .gcal-create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 24px;
          height: 36px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #3c4043;
          background: #fff;
          border: 1px solid #dadce0;
          border-radius: 24px;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
          transition: box-shadow 0.15s;
        }
        .gcal-create-btn:hover {
          box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
          background: #fafafa;
        }

        /* ============= GRID ============= */
        .gcal-grid-wrapper {
          flex: 1;
          overflow: hidden;
        }
        .gcal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: auto repeat(6, 1fr);
          height: 100%;
          border-left: 1px solid #dadce0;
        }

        /* ============= DAY HEADER ============= */
        .gcal-day-header {
          text-align: center;
          font-size: 0.6875rem;
          font-weight: 500;
          color: #70757a;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 4px 0 2px;
          border-right: 1px solid #dadce0;
          border-bottom: 1px solid #dadce0;
          background: #fff;
        }

        /* ============= CELL ============= */
        .gcal-cell {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #dadce0;
          border-bottom: 1px solid #dadce0;
          background: #fff;
          cursor: pointer;
          min-width: 0;
          overflow: hidden;
          padding: 2px 4px 4px;
        }
        .gcal-cell:hover {
          background: #f8f9fa;
        }
        .gcal-cell.other-month {
          background: #fff;
        }
        .gcal-cell.other-month .gcal-date-num {
          color: #70757a;
        }

        /* ============= DATE NUMBER ============= */
        .gcal-cell-date {
          text-align: center;
          padding: 2px 0;
          line-height: 1;
        }
        .gcal-date-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 500;
          color: #3c4043;
          padding: 0 4px;
        }
        .gcal-date-num.today-circle {
          background: #1a73e8;
          color: #fff;
          font-weight: 500;
          border-radius: 50%;
        }

        /* ============= EVENTS AREA ============= */
        .gcal-cell-events {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
          overflow: hidden;
          min-width: 0;
        }

        /* ============= TIMED EVENT (dot) ============= */
        .gcal-event-timed {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 1px 4px;
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          min-width: 0;
        }
        .gcal-event-timed:hover {
          background: #f1f3f4;
        }
        .gcal-event-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #039be5;
          flex-shrink: 0;
        }
        .gcal-event-time {
          font-size: 0.75rem;
          font-weight: 400;
          color: #3c4043;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .gcal-event-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #3c4043;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }

        /* ============= CHIP EVENT (task/full block) ============= */
        .gcal-event-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 1px 6px;
          border-radius: 4px;
          cursor: pointer;
          color: #fff;
          min-width: 0;
          font-size: 0.75rem;
        }
        .gcal-event-chip:hover {
          filter: brightness(0.9);
        }
        .gcal-chip-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
          font-weight: 500;
          font-size: 0.75rem;
        }

        /* ============= DELETE BUTTON ============= */
        .gcal-del-btn {
          position: absolute;
          right: 2px;
          background: #f1f3f4;
          border: none;
          color: #5f6368;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .gcal-event-timed:hover .gcal-del-btn {
          opacity: 1;
        }
        .gcal-del-btn:hover {
          color: #d93025;
          background: #e8eaed;
        }

        /* ============= DARK MODE ============= */
        :global([data-theme='dark']) .gcal-root {
          background: #202124;
        }
        :global([data-theme='dark']) .gcal-topbar {
          background: #202124;
          border-color: #5f6368;
        }
        :global([data-theme='dark']) .gcal-today-btn {
          background: #202124;
          color: #e8eaed;
          border-color: #5f6368;
        }
        :global([data-theme='dark']) .gcal-today-btn:hover {
          background: #303134;
        }
        :global([data-theme='dark']) .gcal-nav-btn {
          color: #e8eaed;
        }
        :global([data-theme='dark']) .gcal-nav-btn:hover {
          background: #303134;
        }
        :global([data-theme='dark']) .gcal-month-title {
          color: #e8eaed;
        }
        :global([data-theme='dark']) .gcal-create-btn {
          background: #202124;
          color: #e8eaed;
          border-color: #5f6368;
        }
        :global([data-theme='dark']) .gcal-create-btn:hover {
          background: #303134;
        }
        :global([data-theme='dark']) .gcal-grid {
          border-color: #5f6368;
        }
        :global([data-theme='dark']) .gcal-day-header {
          background: #202124;
          color: #9aa0a6;
          border-color: #5f6368;
        }
        :global([data-theme='dark']) .gcal-cell {
          background: #202124;
          border-color: #5f6368;
        }
        :global([data-theme='dark']) .gcal-cell:hover {
          background: #303134;
        }
        :global([data-theme='dark']) .gcal-date-num {
          color: #e8eaed;
        }
        :global([data-theme='dark']) .gcal-cell.other-month .gcal-date-num {
          color: #9aa0a6;
        }
        :global([data-theme='dark']) .gcal-event-time,
        :global([data-theme='dark']) .gcal-event-label {
          color: #e8eaed;
        }
        :global([data-theme='dark']) .gcal-event-timed:hover {
          background: #303134;
        }
        :global([data-theme='dark']) .gcal-del-btn {
          background: #303134;
          color: #e8eaed;
        }
      `}</style>
    </div>
  );
}
