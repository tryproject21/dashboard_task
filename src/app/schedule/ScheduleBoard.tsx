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

type ViewMode = 'day' | 'month' | 'year';

export default function ScheduleBoard({ initialMeetings, initialTasks = [] }: { initialMeetings: Meeting[], initialTasks?: Task[] }) {
  const router = useRouter();
  const [meetings, setMeetings] = useState(initialMeetings);
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMeeting, setActionMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this meeting?")) {
      setMeetings(meetings.filter(m => m.id !== id));
      await deleteMeeting(id);
    }
  };

  const handleMeetingClick = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionMeeting(meeting);
  };

  const handleEdit = () => {
    setEditingMeeting(actionMeeting);
    setActionMeeting(null);
    setSelectedDate('');
    setIsModalOpen(true);
  };

  const handleDayClick = (dateStr: string) => {
    setEditingMeeting(null);
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  const handleTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/tasks');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('meeting_id', id);
  };

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
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  // ============= DATE HELPERS =============
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayHeaders = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const today = new Date();

  // Navigation
  const goToday = () => {
    setCurrentDate(new Date());
  };

  const goPrev = () => {
    if (viewMode === 'day') setCurrentDate(new Date(year, month, day - 1));
    else if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1));
    else setCurrentDate(new Date(year - 1, month, 1));
  };

  const goNext = () => {
    if (viewMode === 'day') setCurrentDate(new Date(year, month, day + 1));
    else if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1));
    else setCurrentDate(new Date(year + 1, month, 1));
  };

  // Title for topbar
  const getTitle = () => {
    if (viewMode === 'day') {
      return `${monthNames[month]} ${day}, ${year}`;
    }
    if (viewMode === 'year') return `${year}`;
    return `${monthNames[month]} ${year}`;
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
    return '#039be5';
  };

  const getDateStr = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const isSameDay = (y: number, m: number, d: number) =>
    today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  // ============= MONTH VIEW =============
  const buildMonthCells = () => {
    const cells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      const d = prevMonthDays - firstDayOfMonth + 1 + i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month, year, isCurrentMonth: true });
    }
    const totalRows = cells.length > 35 ? 6 : 5;
    const totalCells = totalRows * 7;
    let nextDay = 1;
    while (cells.length < totalCells) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      cells.push({ day: nextDay++, month: m, year: y, isCurrentMonth: false });
    }
    return cells;
  };

  const renderMonthView = () => {
    const cells = buildMonthCells();
    return (
      <div className="gcal-grid-wrapper">
        <div className="gcal-grid gcal-grid-month">
          {dayHeaders.map(dh => (
            <div key={dh} className="gcal-day-header">{dh}</div>
          ))}
          {cells.map((cell, idx) => {
            const dateStr = getDateStr(cell.year, cell.month, cell.day);
            const cellIsToday = isSameDay(cell.year, cell.month, cell.day);
            const dayMeetings = meetings.filter(m => {
              const mDate = new Date(m.date);
              return mDate.getFullYear() === cell.year && mDate.getMonth() === cell.month && mDate.getDate() === cell.day;
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const dayTasks = tasks.filter(t => {
              if (!t.deadline) return false;
              const tDate = new Date(t.deadline);
              return tDate.getFullYear() === cell.year && tDate.getMonth() === cell.month && tDate.getDate() === cell.day;
            });

            const label = cell.day === 1 ? `${monthShort[cell.month]} ${cell.day}` : `${cell.day}`;

            return (
              <div key={idx}
                className={`gcal-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cellIsToday ? 'today' : ''}`}
                onClick={() => handleDayClick(dateStr)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dateStr)}
              >
                <div className="gcal-cell-date">
                  <span
                    className={`gcal-date-num ${cellIsToday ? 'today-circle' : ''}`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setCurrentDate(new Date(cell.year, cell.month, cell.day));
                      setViewMode('day');
                    }}
                  >{label}</span>
                </div>
                <div className="gcal-cell-events">
                  {dayMeetings.map(m => (
                    <div key={m.id} className="gcal-event-timed" onClick={(e) => handleMeetingClick(m, e)} draggable onDragStart={(e) => handleDragStart(e, m.id)}>
                      <span className="gcal-event-dot"></span>
                      <span className="gcal-event-time">{formatTime(m.date)}</span>
                      <span className="gcal-event-label">{m.title}</span>
                      <button type="button" className="gcal-del-btn" onClick={(e) => handleDelete(m.id, e)}><Trash2 size={11} /></button>
                    </div>
                  ))}
                  {dayTasks.map(t => (
                    <div key={`task-${t.id}`} className="gcal-event-chip" onClick={handleTaskClick}
                      style={{ backgroundColor: getTaskColor(t.priority), opacity: t.status === 'done' ? 0.55 : 1 }}>
                      <Circle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                      <span className="gcal-chip-label" style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============= DAY VIEW =============
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dateStr = getDateStr(year, month, day);
    const dayMeetings = meetings.filter(m => {
      const mDate = new Date(m.date);
      return mDate.getFullYear() === year && mDate.getMonth() === month && mDate.getDate() === day;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dayTasks = tasks.filter(t => {
      if (!t.deadline) return false;
      const tDate = new Date(t.deadline);
      return tDate.getFullYear() === year && tDate.getMonth() === month && tDate.getDate() === day;
    });

    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const isCurrentDay = isSameDay(year, month, day);

    return (
      <div className="gcal-day-wrapper">
        {/* Day column header */}
        <div className="gcal-day-col-header">
          <span className="gcal-day-col-name" style={{ color: isCurrentDay ? '#1a73e8' : '#70757a' }}>{dayName}</span>
          <span className={`gcal-day-col-num ${isCurrentDay ? 'today-circle-lg' : ''}`}>{day}</span>
        </div>
        {/* All-day section */}
        {(dayTasks.length > 0) && (
          <div className="gcal-allday-section">
            {dayTasks.map(t => (
              <div key={`task-${t.id}`} className="gcal-event-chip" onClick={handleTaskClick}
                style={{ backgroundColor: getTaskColor(t.priority), opacity: t.status === 'done' ? 0.55 : 1 }}>
                <Circle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span className="gcal-chip-label" style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
              </div>
            ))}
          </div>
        )}
        {/* Hourly grid */}
        <div className="gcal-hours-scroll">
          <div className="gcal-hours-grid">
            {hours.map(h => {
              const label = h === 0 ? '' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
              const hourMeetings = dayMeetings.filter(m => new Date(m.date).getHours() === h);
              return (
                <div key={h} className="gcal-hour-row">
                  <div className="gcal-hour-label">{label}</div>
                  <div className="gcal-hour-cell" onClick={() => handleDayClick(dateStr)}>
                    {hourMeetings.map(m => (
                      <div key={m.id} className="gcal-hour-event" onClick={(e) => handleMeetingClick(m, e)}>
                        <span className="gcal-hour-event-title">{m.title}</span>
                        <span className="gcal-hour-event-time">{formatTime(m.date)}</span>
                      </div>
                    ))}
                    {/* Current time indicator */}
                    {isCurrentDay && today.getHours() === h && (
                      <div className="gcal-now-line" style={{ top: `${(today.getMinutes() / 60) * 100}%` }}>
                        <div className="gcal-now-dot"></div>
                        <div className="gcal-now-rule"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ============= YEAR VIEW =============
  const renderYearView = () => {
    return (
      <div className="gcal-year-wrapper">
        {Array.from({ length: 12 }, (_, mi) => {
          const firstDay = new Date(year, mi, 1).getDay();
          const totalDays = new Date(year, mi + 1, 0).getDate();
          return (
            <div key={mi} className="gcal-year-month"
              onClick={() => { setCurrentDate(new Date(year, mi, 1)); setViewMode('month'); }}>
              <div className="gcal-year-month-title">{monthShort[mi]}</div>
              <div className="gcal-year-mini-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={`hdr-${i}`} className="gcal-mini-hdr">{d}</div>
                ))}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`emp-${i}`} className="gcal-mini-cell"></div>
                ))}
                {Array.from({ length: totalDays }, (_, i) => {
                  const d = i + 1;
                  const isT = isSameDay(year, mi, d);
                  const hasMeeting = meetings.some(m => {
                    const mDate = new Date(m.date);
                    return mDate.getFullYear() === year && mDate.getMonth() === mi && mDate.getDate() === d;
                  });
                  const hasTask = tasks.some(t => {
                    if (!t.deadline) return false;
                    const tDate = new Date(t.deadline);
                    return tDate.getFullYear() === year && tDate.getMonth() === mi && tDate.getDate() === d;
                  });
                  return (
                    <div key={d}
                      className={`gcal-mini-cell ${isT ? 'mini-today' : ''} ${hasMeeting || hasTask ? 'has-event' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentDate(new Date(year, mi, d));
                        setViewMode('day');
                      }}
                    >{d}</div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============= RENDER =============
  return (
    <div className="gcal-root">
      {/* ===== TOP BAR ===== */}
      <div className="gcal-topbar">
        <div className="gcal-topbar-left">
          <button className="gcal-today-btn" onClick={goToday}>Today</button>
          <button className="gcal-nav-btn" onClick={goPrev}><ChevronLeft size={20} /></button>
          <button className="gcal-nav-btn" onClick={goNext}><ChevronRight size={20} /></button>
          <span className="gcal-month-title">{getTitle()}</span>
        </div>
        <div className="gcal-topbar-right">
          <select
            className="gcal-view-select"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
          >
            <option value="day">Day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <button className="gcal-create-btn" onClick={() => { setEditingMeeting(null); setSelectedDate(''); setIsModalOpen(true); }}>
            <Plus size={20} strokeWidth={2.5} />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* ===== VIEWS ===== */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'year' && renderYearView()}

      {/* ===== ACTION MODAL ===== */}
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

      {/* ===== CREATE/EDIT MODAL ===== */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setIsModalOpen(false); setEditingMeeting(null); } }}>
          <div className="modal-content">
            <h2 className="mb-4">{editingMeeting ? 'Edit Meeting' : 'Schedule a Meeting'}</h2>
            <form action={async (formData) => {
              const localDate = formData.get('date') as string;
              if (localDate && !localDate.includes('Z')) formData.set('date', new Date(localDate).toISOString());
              formData.set('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
              if (editingMeeting) await editMeeting(editingMeeting.id, formData);
              else await addMeeting(formData);
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
                <input type="datetime-local" name="date" required className="input-field" defaultValue={editingMeeting ? new Date(new Date(editingMeeting.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : selectedDate ? `${selectedDate}T09:00` : ''} />
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

      {/* ===== STYLES ===== */}
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
        }
        .gcal-today-btn:hover { background: #f1f3f4; }
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
        .gcal-nav-btn:hover { background: #f1f3f4; }
        .gcal-month-title {
          font-size: 1.375rem;
          font-weight: 400;
          color: #3c4043;
        }

        /* View Select Dropdown */
        .gcal-view-select {
          padding: 6px 32px 6px 12px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #3c4043;
          background: #fff;
          border: 1px solid #dadce0;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235f6368' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          outline: none;
        }
        .gcal-view-select:hover { background-color: #f1f3f4; }

        /* Create Button */
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

        /* ============= MONTH VIEW GRID ============= */
        .gcal-grid-wrapper {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .gcal-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          border-left: 1px solid #dadce0;
          flex: 1;
        }
        .gcal-grid-month {
          grid-template-rows: 28px repeat(6, minmax(0, 1fr));
        }
        .gcal-day-header {
          text-align: center;
          font-size: 0.6875rem;
          font-weight: 500;
          color: #70757a;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 6px 0;
          border-right: 1px solid #dadce0;
          border-bottom: 1px solid #dadce0;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gcal-cell {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #dadce0;
          border-bottom: 1px solid #dadce0;
          background: #fff;
          cursor: pointer;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          padding: 2px 4px 4px;
        }
        .gcal-cell:hover { background: #f8f9fa; }
        .gcal-cell.other-month .gcal-date-num { color: #70757a; }
        .gcal-cell-date {
          text-align: center;
          padding: 2px 0;
          line-height: 1;
          flex-shrink: 0;
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
          cursor: pointer;
        }
        .gcal-date-num.today-circle {
          background: #1a73e8;
          color: #fff;
        }
        .gcal-cell-events {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-width: 0;
          scrollbar-width: none;
        }
        .gcal-cell-events::-webkit-scrollbar { display: none; }

        /* Timed event (dot) */
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
        .gcal-event-timed:hover { background: #f1f3f4; }
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

        /* Chip event (task) */
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
        .gcal-event-chip:hover { filter: brightness(0.9); }
        .gcal-chip-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
          font-weight: 500;
          font-size: 0.75rem;
        }

        /* Delete button */
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
        .gcal-event-timed:hover .gcal-del-btn { opacity: 1; }
        .gcal-del-btn:hover { color: #d93025; background: #e8eaed; }

        /* ============= DAY VIEW ============= */
        .gcal-day-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .gcal-day-col-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #dadce0;
          flex-shrink: 0;
        }
        .gcal-day-col-name {
          font-size: 0.6875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .gcal-day-col-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          font-size: 1.625rem;
          font-weight: 400;
          color: #3c4043;
          margin-top: 2px;
          cursor: pointer;
        }
        .gcal-day-col-num.today-circle-lg {
          background: #1a73e8;
          color: #fff;
        }
        .gcal-allday-section {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 8px 60px 8px 60px;
          border-bottom: 1px solid #dadce0;
          flex-shrink: 0;
        }
        .gcal-hours-scroll {
          flex: 1;
          overflow-y: auto;
        }
        .gcal-hours-grid {
          display: flex;
          flex-direction: column;
        }
        .gcal-hour-row {
          display: flex;
          min-height: 48px;
          border-bottom: 1px solid #e0e0e0;
        }
        .gcal-hour-label {
          width: 56px;
          font-size: 0.625rem;
          color: #70757a;
          text-align: right;
          padding: 0 8px 0 0;
          flex-shrink: 0;
          position: relative;
          top: -6px;
        }
        .gcal-hour-cell {
          flex: 1;
          border-left: 1px solid #dadce0;
          position: relative;
          cursor: pointer;
          padding: 2px 4px;
        }
        .gcal-hour-cell:hover { background: #f8f9fa; }
        .gcal-hour-event {
          background: #039be5;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          margin-bottom: 2px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .gcal-hour-event:hover { filter: brightness(0.9); }
        .gcal-hour-event-title {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gcal-hour-event-time {
          font-size: 0.6875rem;
          opacity: 0.85;
        }

        /* Now line */
        .gcal-now-line {
          position: absolute;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          z-index: 2;
          pointer-events: none;
        }
        .gcal-now-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ea4335;
          flex-shrink: 0;
          margin-left: -6px;
        }
        .gcal-now-rule {
          flex: 1;
          height: 2px;
          background: #ea4335;
        }

        /* ============= YEAR VIEW ============= */
        .gcal-year-wrapper {
          flex: 1;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          padding: 24px 32px;
        }
        .gcal-year-month {
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .gcal-year-month:hover { background: #f1f3f4; }
        .gcal-year-month-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #3c4043;
          text-align: center;
          margin-bottom: 8px;
        }
        .gcal-year-mini-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          text-align: center;
        }
        .gcal-mini-hdr {
          font-size: 0.5625rem;
          color: #70757a;
          font-weight: 500;
          padding: 2px 0;
        }
        .gcal-mini-cell {
          font-size: 0.6875rem;
          color: #3c4043;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 50%;
          cursor: pointer;
          position: relative;
        }
        .gcal-mini-cell:hover { background: #f1f3f4; }
        .gcal-mini-cell.mini-today {
          background: #1a73e8;
          color: #fff;
        }
        .gcal-mini-cell.has-event::after {
          content: '';
          position: absolute;
          bottom: 1px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #039be5;
        }
        .gcal-mini-cell.mini-today.has-event::after {
          background: #fff;
        }

        /* ============= DARK MODE ============= */
        :global([data-theme='dark']) .gcal-root { background: #202124; }
        :global([data-theme='dark']) .gcal-topbar { background: #202124; border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-today-btn { background: #202124; color: #e8eaed; border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-today-btn:hover { background: #303134; }
        :global([data-theme='dark']) .gcal-nav-btn { color: #e8eaed; }
        :global([data-theme='dark']) .gcal-nav-btn:hover { background: #303134; }
        :global([data-theme='dark']) .gcal-month-title { color: #e8eaed; }
        :global([data-theme='dark']) .gcal-view-select { background: #202124; color: #e8eaed; border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-view-select:hover { background: #303134; }
        :global([data-theme='dark']) .gcal-create-btn { background: #202124; color: #e8eaed; border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-create-btn:hover { background: #303134; }
        :global([data-theme='dark']) .gcal-grid { border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-day-header { background: #202124; color: #9aa0a6; border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-cell { background: #202124; border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-cell:hover { background: #303134; }
        :global([data-theme='dark']) .gcal-date-num { color: #e8eaed; }
        :global([data-theme='dark']) .gcal-cell.other-month .gcal-date-num { color: #9aa0a6; }
        :global([data-theme='dark']) .gcal-event-time,
        :global([data-theme='dark']) .gcal-event-label { color: #e8eaed; }
        :global([data-theme='dark']) .gcal-event-timed:hover { background: #303134; }
        :global([data-theme='dark']) .gcal-del-btn { background: #303134; color: #e8eaed; }
        :global([data-theme='dark']) .gcal-day-col-header { border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-day-col-num { color: #e8eaed; }
        :global([data-theme='dark']) .gcal-allday-section { border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-hour-row { border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-hour-label { color: #9aa0a6; }
        :global([data-theme='dark']) .gcal-hour-cell { border-color: #5f6368; }
        :global([data-theme='dark']) .gcal-hour-cell:hover { background: #303134; }
        :global([data-theme='dark']) .gcal-year-month:hover { background: #303134; }
        :global([data-theme='dark']) .gcal-year-month-title { color: #e8eaed; }
        :global([data-theme='dark']) .gcal-mini-cell { color: #e8eaed; }
        :global([data-theme='dark']) .gcal-mini-cell:hover { background: #303134; }
      `}</style>
    </div>
  );
}
