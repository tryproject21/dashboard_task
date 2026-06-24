'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';
import { saveNote, deleteNote } from '@/lib/noteActions';
import RichTextEditor from '@/components/RichTextEditor';

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

export default function NotesBoard({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [activeNote, setActiveNote] = useState<Note | null>(notes.length > 0 ? notes[0] : null);
  const [title, setTitle] = useState(activeNote?.title || '');
  const [content, setContent] = useState(activeNote?.content || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [activeNote]);

  const handleCreateNew = () => {
    setActiveNote(null);
    setTitle('');
    setContent('');
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setIsSaving(true);
    await saveNote(activeNote?.id || null, title || 'Untitled Note', content);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
      window.location.reload();
    }
  };

  return (
    <div className="notes-container">
      <div className="notes-sidebar glass-panel">
        <div className="flex-between mb-4">
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>My Notes</h2>
          <button className="btn-icon" onClick={handleCreateNew}><Plus size={18} /></button>
        </div>
        <div className="notes-list">
          {notes.map(note => (
            <div 
              key={note.id} 
              className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
              onClick={() => setActiveNote(note)}
            >
              <h4 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{note.title}</h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(note.updatedAt).toLocaleDateString()}</p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notes yet.</p>}
        </div>
      </div>

      <div className="notes-editor glass-panel">
        <div className="editor-header flex-between">
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Note Title" 
            className="editor-title-input"
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeNote && (
              <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(activeNote.id)}>
                <Trash2 size={18} />
              </button>
            )}
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <div className="editor-body" style={{ flexDirection: 'column' }}>
          <RichTextEditor content={content} onChange={setContent} />
        </div>
      </div>

      <style jsx>{`
        .notes-container {
          display: flex;
          gap: 24px;
          height: calc(100vh - 120px);
        }
        .notes-sidebar {
          width: 300px;
          display: flex;
          flex-direction: column;
          padding: 24px;
          overflow-y: auto;
        }
        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .note-item {
          padding: 12px;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }
        .note-item:hover {
          background: rgba(0,0,0,0.02);
        }
        .note-item.active {
          background: rgba(0,0,0,0.04);
          border-left-color: var(--accent-primary);
        }
        
        /* Dark mode overrides manually if needed, but CSS vars handle most */
        [data-theme='dark'] .note-item:hover { background: rgba(255,255,255,0.05); }
        [data-theme='dark'] .note-item.active { background: rgba(255,255,255,0.1); }

        .notes-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .editor-header {
          padding: 24px;
          border-bottom: 1px solid var(--border-color);
        }
        .editor-title-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 600;
          font-family: inherit;
          outline: none;
        }
        .editor-body {
          flex: 1;
          padding: 24px;
          display: flex;
        }
        .editor-textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 1.05rem;
          font-family: inherit;
          resize: none;
          outline: none;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
