'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Video, MapPin, Link as LinkIcon } from 'lucide-react';
import { addMeeting, deleteMeeting } from '@/lib/meetingActions';

type Meeting = {
  id: string;
  title: string;
  date: string;
  link: string;
};

export default function ScheduleBoard({ initialMeetings }: { initialMeetings: Meeting[] }) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    setMeetings(meetings.filter(m => m.id !== id));
    await deleteMeeting(id);
  };

  // Group meetings by date
  const groupedMeetings = meetings.reduce((acc, meeting) => {
    const d = new Date(meeting.date).toLocaleDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(meeting);
    return acc;
  }, {} as Record<string, Meeting[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedMeetings).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

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
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Add Meeting
          </button>
        </div>
      </div>

      <div className="schedule-container" style={{ marginTop: '32px' }}>
        {sortedDates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <CalendarIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Your schedule is clear.</p>
          </div>
        ) : (
          <div className="timeline">
            {sortedDates.map(date => (
              <div key={date} className="timeline-group">
                <div className="timeline-date">
                  <div className="date-badge">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                      {new Date(date).getDate()}
                    </span>
                  </div>
                </div>
                <div className="timeline-events">
                  {groupedMeetings[date].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(meeting => (
                    <div key={meeting.id} className="glass-panel event-card">
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: '4px', fontSize: '1.1rem' }}>{meeting.title}</h4>
                        <div className="text-sm flex-center" style={{ color: 'var(--text-secondary)', justifyContent: 'flex-start', gap: '16px' }}>
                          <span className="flex-center gap-2">
                            <Clock size={14} /> {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {meeting.link && (
                            <span className="flex-center gap-2 text-gradient" style={{ cursor: 'pointer' }} onClick={() => window.open(meeting.link.startsWith('http') ? meeting.link : `https://${meeting.link}`, '_blank')}>
                              {meeting.link.includes('zoom') || meeting.link.includes('meet') ? <Video size={14} /> : <LinkIcon size={14} />} 
                              Join Link
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(meeting.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
          <div className="modal-content">
            <h2 className="mb-4">Schedule a Meeting</h2>
            <form action={async (formData) => {
              await addMeeting(formData);
              setIsModalOpen(false);
              window.location.reload(); 
            }}>
              <div className="input-group">
                <label className="input-label">Meeting Title</label>
                <input name="title" required className="input-field" placeholder="e.g. Weekly Sync with Team" />
              </div>
              <div className="input-group">
                <label className="input-label">Date & Time</label>
                <input type="datetime-local" name="date" required className="input-field" />
              </div>
              <div className="input-group">
                <label className="input-label">Meeting Link / Location</label>
                <input name="link" className="input-field" placeholder="e.g. https://meet.google.com/..." />
              </div>
              
              <div className="flex-between mt-4" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .timeline-group {
          display: flex;
          gap: 24px;
        }
        .timeline-date {
          width: 60px;
          flex-shrink: 0;
        }
        .date-badge {
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .timeline-events {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .event-card {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-left: 4px solid var(--accent-primary);
        }
      `}</style>
    </div>
  );
}
