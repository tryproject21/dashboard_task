'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading2, Quote } from 'lucide-react';
import { useEffect } from 'react';

export default function RichTextEditor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start typing your amazing notes here...' })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync if parent changes it
  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="input-field" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Editor...</div>;
  }

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
          <Italic size={16} />
        </button>
        <div className="divider"></div>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>
          <Heading2 size={16} />
        </button>
        <div className="divider"></div>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>
          <List size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>
          <ListOrdered size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''}>
          <Quote size={16} />
        </button>
      </div>
      <EditorContent editor={editor} className="tiptap-content" />
      <style jsx global>{`
        .tiptap-wrapper {
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          overflow: hidden;
          background: rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }
        [data-theme='dark'] .tiptap-wrapper { background: rgba(255,255,255,0.02); }
        .tiptap-toolbar {
          display: flex;
          gap: 4px;
          padding: 8px;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
        .tiptap-toolbar button {
          background: transparent;
          border: none;
          padding: 6px;
          border-radius: 4px;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tiptap-toolbar button:hover {
          background: rgba(0,0,0,0.05);
          color: var(--text-primary);
        }
        [data-theme='dark'] .tiptap-toolbar button:hover { background: rgba(255,255,255,0.05); }
        .tiptap-toolbar button.is-active {
          background: var(--accent-primary);
          color: white;
        }
        .tiptap-toolbar .divider {
          width: 1px;
          background: var(--border-color);
          margin: 0 4px;
        }
        .tiptap-content {
          padding: 16px;
          min-height: 250px;
          max-height: 500px;
          overflow-y: auto;
        }
        .tiptap-content .ProseMirror {
          outline: none;
          min-height: 200px;
        }
        .tiptap-content .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--text-muted);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap-content ul { padding-left: 20px; list-style-type: disc; margin-bottom: 1em; }
        .tiptap-content ol { padding-left: 20px; list-style-type: decimal; margin-bottom: 1em; }
        .tiptap-content blockquote { border-left: 3px solid var(--border-color); padding-left: 1rem; margin-left: 0; color: var(--text-secondary); font-style: italic; }
      `}</style>
    </div>
  );
}
