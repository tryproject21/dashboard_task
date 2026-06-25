'use client';

import { useState, useRef } from 'react';
import { Upload, File as FileIcon, Image as ImageIcon, Search, Download, Trash2, FileText, Code, Archive, Folder, FolderPlus, ChevronLeft } from 'lucide-react';
import { deleteFile, createFolder } from '@/lib/fileActions';

type FileRecord = {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  createdAt: string;
  taskId?: string;
  parentId?: string | null;
};

export default function FileExplorer({ initialFiles }: { initialFiles: FileRecord[] }) {
  const [files, setFiles] = useState(initialFiles);
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string, name: string) => {
    if (type === 'folder') return <Folder size={24} style={{ color: 'var(--accent-primary)' }} />;
    if (type.startsWith('image/')) return <ImageIcon size={24} style={{ color: 'var(--accent-primary)' }} />;
    if (type.includes('pdf') || type.includes('document')) return <FileText size={24} style={{ color: 'var(--danger)' }} />;
    if (name.endsWith('.zip') || name.endsWith('.tar.gz')) return <Archive size={24} style={{ color: 'var(--warning)' }} />;
    if (type.includes('json') || type.includes('javascript') || type.includes('html')) return <Code size={24} style={{ color: 'var(--success)' }} />;
    return <FileIcon size={24} style={{ color: 'var(--text-secondary)' }} />;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    if (currentFolderId) {
      formData.append('parentId', currentFolderId);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload(); 
      }
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, path: string) => {
    setFiles(files.filter(f => f.id !== id));
    await deleteFile(id, path);
  };

  const navigateToFolder = (id: string) => {
    setCurrentFolderId(id);
    setSearch('');
  };

  const navigateUp = () => {
    if (!currentFolderId) return;
    const currentFolder = files.find(f => f.id === currentFolderId);
    setCurrentFolderId(currentFolder?.parentId || null);
  };

  const currentFolder = files.find(f => f.id === currentFolderId);
  const currentLevelFiles = files.filter(f => search ? true : (f.parentId || null) === currentFolderId);
  const filteredFiles = currentLevelFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  // Sort: folders first
  filteredFiles.sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem' }}>File Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Securely store and manage your professional files.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box">
            <Search size={18} style={{ color: 'var(--text-muted)', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '38px', marginBottom: 0, width: '250px' }}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => setIsFolderModalOpen(true)}>
            <FolderPlus size={18} /> New Folder
          </button>
          <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Upload size={18} /> {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      <div className="file-grid" style={{ marginTop: '24px' }}>
        {currentFolderId && !search && (
          <div className="glass-panel file-card" style={{ cursor: 'pointer', gridColumn: '1 / -1' }} onClick={navigateUp}>
            <div className="file-icon-container">
              <ChevronLeft size={24} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="file-info" style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>Back to {currentFolder?.parentId ? 'Parent Folder' : 'Root Directory'}</h4>
            </div>
          </div>
        )}

        {filteredFiles.map(file => (
          <div 
            key={file.id} 
            className="glass-panel file-card" 
            onClick={() => file.type === 'folder' ? navigateToFolder(file.id) : setPreviewFile(file)} 
            style={{ cursor: 'pointer' }}
          >
            <div className="file-icon-container">
              {getFileIcon(file.type, file.name)}
            </div>
            <div className="file-info" style={{ flex: 1, overflow: 'hidden' }}>
              <h4 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={file.name}>
                {file.name}
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {file.type === 'folder' ? 'Folder' : formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="file-actions" style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
              {file.type !== 'folder' && (
                <a href={file.path} download={file.name} target="_blank" rel="noreferrer" className="btn-icon" title="Download">
                  <Download size={16} />
                </a>
              )}
              <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(file.id, file.path)} title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredFiles.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Folder size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>This folder is empty.</p>
          </div>
        )}
      </div>

      {isFolderModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsFolderModalOpen(false) }}>
          <div className="modal-content">
            <h2 className="mb-4">Create New Folder</h2>
            <form action={async (formData) => {
              const name = formData.get('name') as string;
              if (name) {
                await createFolder(name, currentFolderId);
                window.location.reload();
              }
            }}>
              <div className="input-group">
                <label className="input-label">Folder Name</label>
                <input name="name" required autoFocus className="input-field" placeholder="e.g. Project Assets" />
              </div>
              <div className="flex-between mt-4" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFolderModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Folder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPreviewFile(null) }} style={{ zIndex: 1000, padding: '40px' }}>
          <div className="modal-content preview-modal" style={{ maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div className="flex-center gap-2">
                {getFileIcon(previewFile.type, previewFile.name)}
                <h3 style={{ margin: 0, fontSize: '1.2rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{previewFile.name}</h3>
              </div>
              <div className="flex-center gap-2">
                <a href={previewFile.path} download={previewFile.name} target="_blank" rel="noreferrer" className="btn btn-secondary flex-center gap-2" style={{ textDecoration: 'none' }}>
                  <Download size={16} /> Download
                </a>
                <button className="btn-icon" onClick={() => setPreviewFile(null)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.02)', position: 'relative' }}>
              {previewFile.type.startsWith('image/') ? (
                <img src={previewFile.path} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : previewFile.type.includes('pdf') ? (
                <iframe src={previewFile.path} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <FileIcon size={64} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p>Preview is not available for this file type.</p>
                  <a href={previewFile.path} download={previewFile.name} target="_blank" rel="noreferrer" className="btn btn-primary mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <Download size={18} /> Download to View
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .search-box {
          position: relative;
        }
        .file-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .file-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
        }
        .file-card:hover {
          background: rgba(0,0,0,0.01);
        }
        .file-icon-container {
          width: 48px;
          height: 48px;
          border-radius: var(--border-radius-sm);
          background: rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
