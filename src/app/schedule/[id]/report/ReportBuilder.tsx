'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Download, Sparkles } from 'lucide-react';
import { saveNote } from '@/lib/noteActions';
import RichTextEditor from '@/components/RichTextEditor';

type Meeting = {
  id: string;
  title: string;
  date: string;
  link: string;
};

export default function ReportBuilder({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  
  const [attendees, setAttendees] = useState('');
  const [agenda, setAgenda] = useState('');
  const [roughNotes, setRoughNotes] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerateAI = async () => {
    if (!agenda && !roughNotes) {
      alert("Please provide at least an Agenda or Rough Notes for the AI to work with.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meeting.title,
          date: meeting.date,
          attendees,
          agenda,
          roughNotes
        })
      });
      const data = await res.json();
      if (data.reportHtml) {
        setContent(data.reportHtml);
      } else {
        alert("Failed to generate report.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToNotes = async () => {
    setIsSaving(true);
    const fullHtml = `
      <h1>Laporan Kegiatan: ${meeting.title}</h1>
      <p><strong>Tanggal:</strong> ${new Date(meeting.date).toLocaleString()}</p>
      <p><strong>Peserta:</strong> ${attendees || '-'}</p>
      <hr />
      ${content}
    `;
    await saveNote(null, `Report: ${meeting.title}`, fullHtml, meeting.id);
    alert("Saved to Notes!");
    setIsSaving(false);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="report-builder-container">
      <div className="report-header flex-between mb-4 no-print">
        <div className="flex-center gap-4">
          <button className="btn-icon" onClick={() => router.push('/schedule')}><ArrowLeft size={20}/></button>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Report Builder</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generate formal meeting reports instantly.</p>
          </div>
        </div>
        <div className="flex-center gap-2">
          <button className="btn btn-secondary" onClick={handleSaveToNotes} disabled={isSaving}>
            <Save size={16}/> {isSaving ? 'Saving...' : 'Save to Notes'}
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF}>
            <Download size={16}/> Export PDF
          </button>
        </div>
      </div>

      <div className="report-grid">
        {/* Left Column: Data Input */}
        <div className="glass-panel input-section no-print">
          <h3 className="mb-4">Meeting Details</h3>
          
          <div className="input-group">
            <label className="input-label">Meeting Title</label>
            <input type="text" className="input-field" value={meeting.title} disabled />
          </div>

          <div className="input-group">
            <label className="input-label">Date & Time</label>
            <input type="text" className="input-field" value={new Date(meeting.date).toLocaleString()} disabled />
          </div>

          <div className="input-group">
            <label className="input-label">Attendees</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. John Doe, Jane Smith" 
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Agenda / Topics</label>
            <textarea 
              className="input-field" 
              rows={2} 
              placeholder="What was the plan?" 
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Rough Notes / Discussion</label>
            <textarea 
              className="input-field" 
              rows={4} 
              placeholder="Jot down rough notes, decisions, action items..." 
              value={roughNotes}
              onChange={(e) => setRoughNotes(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-primary w-full flex-center gap-2 mt-4" 
            style={{ background: 'linear-gradient(45deg, var(--accent-primary), #a855f7)', border: 'none' }}
            onClick={handleGenerateAI}
            disabled={isGenerating}
          >
            <Sparkles size={18} />
            {isGenerating ? 'AI is Writing...' : 'AI Auto-Draft Report'}
          </button>
        </div>

        {/* Right Column: Preview/Editor */}
        <div className="glass-panel preview-section print-only-container">
          <div className="no-print mb-4">
            <h3>Final Report</h3>
            <p className="text-xs text-muted">You can manually edit the AI output below before saving or printing.</p>
          </div>

          <div className="print-header" style={{ display: 'none', marginBottom: '20px' }}>
            <h1>Laporan Kegiatan</h1>
            <h2>{meeting.title}</h2>
            <p><strong>Tanggal:</strong> {new Date(meeting.date).toLocaleString()}</p>
            <p><strong>Peserta:</strong> {attendees || '-'}</p>
            <hr />
          </div>

          <RichTextEditor content={content} onChange={setContent} />
        </div>
      </div>

      <style jsx global>{`
        .report-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 24px;
          height: calc(100vh - 150px);
        }
        .input-section {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .preview-section {
          padding: 24px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        /* Print Styles */
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only-container, .print-only-container * {
            visibility: visible;
          }
          .print-only-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-header {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          /* Hide TipTap Toolbar in Print */
          .tiptap-toolbar {
            display: none !important;
          }
          .tiptap-wrapper {
            border: none !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  );
}
