'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Trash2, Calendar, MoreVertical, Paperclip, File as FileIcon, X, GripVertical } from 'lucide-react';
import { addTask, updateTaskStatus, deleteTask } from '@/lib/taskActions';
import { linkFileToTask } from '@/lib/fileActions';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  priority: string;
  createdAt: string;
};

type FileRecord = {
  id: string;
  name: string;
  type: string;
  taskId?: string;
};

export default function TaskBoard({ initialTasks, allFiles }: { initialTasks: Task[], allFiles: FileRecord[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkingTask, setLinkingTask] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  const handleStatusChange = async (id: string, newStatus: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await updateTaskStatus(id, newStatus);
    window.location.reload();
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    // Optimistic UI update
    const updatedTasks = tasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);
    
    await updateTaskStatus(draggableId, newStatus);
    // Don't reload so we keep the smooth DND experience, rely on state update
  };

  const handleDelete = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await deleteTask(id);
  };

  const handleLinkFile = async (fileId: string) => {
    if (!linkingTask) return;
    await linkFileToTask(fileId, linkingTask);
    setLinkingTask(null);
    window.location.reload();
  };

  const handleUnlinkFile = async (fileId: string) => {
    await linkFileToTask(fileId, null);
    window.location.reload();
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch(priority) {
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return '';
    }
  };

  if (!isMounted) return null;

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Task Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Organize your professional tasks effectively.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {columns.map(col => (
            <div key={col.id} className="kanban-column">
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.id === 'todo' ? 'var(--text-muted)' : col.id === 'in_progress' ? 'var(--accent-primary)' : 'var(--success)' }}></div>
                {col.title} <span className="badge" style={{ background: 'var(--bg-secondary)' }}>{tasks.filter(t => t.status === col.id).length}</span>
              </h3>
              
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div 
                    className={`kanban-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    style={{ minHeight: '150px' }}
                  >
                    {tasks.filter(t => t.status === col.id).map((task, index) => {
                      const linkedFiles = allFiles.filter(f => f.taskId === task.id && f.type !== 'folder');

                      return (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            className="glass-panel task-card"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{ 
                              ...provided.draggableProps.style,
                              boxShadow: snapshot.isDragging ? 'var(--shadow-glow)' : 'none',
                              transform: snapshot.isDragging ? provided.draggableProps.style?.transform + ' scale(1.02)' : provided.draggableProps.style?.transform
                            }}
                          >
                            <div className="flex-between mb-2">
                              <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>{task.priority}</span>
                              <div className="flex-center gap-2">
                                <div {...provided.dragHandleProps} style={{ cursor: 'grab', color: 'var(--text-muted)' }}>
                                  <GripVertical size={16} />
                                </div>
                                <div className="dropdown">
                                  <button className="btn-icon"><MoreVertical size={16}/></button>
                                  <div className="dropdown-content glass-panel">
                                    {columns.filter(c => c.id !== task.status).map(c => (
                                      <button key={c.id} onClick={() => handleStatusChange(task.id, c.id)}>
                                        Move to {c.title}
                                      </button>
                                    ))}
                                    <button style={{ color: 'var(--danger)' }} onClick={() => handleDelete(task.id)}>Delete</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <h4 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>{task.title}</h4>
                            {task.description && <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>}
                            
                            {linkedFiles.length > 0 && (
                              <div className="linked-files mb-4">
                                {linkedFiles.map(f => (
                                  <div key={f.id} className="linked-file-badge">
                                    <FileIcon size={12} />
                                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                                    <X size={12} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => handleUnlinkFile(f.id)} />
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="task-footer flex-between text-xs" style={{ color: 'var(--text-muted)' }}>
                              {task.deadline && (
                                <span className="flex-center gap-2" style={{ color: new Date(task.deadline) < new Date() && task.status !== 'done' ? 'var(--danger)' : 'inherit' }}>
                                  <Clock size={14} /> {task.deadline}
                                </span>
                              )}
                              <button className="btn-icon" style={{ padding: '4px' }} title="Attach files" onClick={() => setLinkingTask(task.id)}>
                                <Paperclip size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    )})}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modals follow ... */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
          <div className="modal-content">
            <h2 className="mb-4">Create New Task</h2>
            <form action={async (formData) => {
              await addTask(formData);
              setIsModalOpen(false);
              window.location.reload(); 
            }}>
              <div className="input-group">
                <label className="input-label">Task Title</label>
                <input name="title" required className="input-field" placeholder="e.g. Prepare Q3 Report" />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea name="description" className="input-field" rows={3} placeholder="Add details..."></textarea>
              </div>
              <div className="flex-between gap-4">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Deadline</label>
                  <input type="date" name="deadline" className="input-field" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Priority</label>
                  <select name="priority" className="input-field">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex-between mt-4" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {linkingTask && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setLinkingTask(null) }}>
          <div className="modal-content">
            <h2 className="mb-4">Attach File to Task</h2>
            <div className="file-list-attach">
              {allFiles.filter(f => !f.taskId && f.type !== 'folder').length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No available files to attach. Upload files in the Files menu first.</p>
              ) : (
                allFiles.filter(f => !f.taskId && f.type !== 'folder').map(f => (
                  <div key={f.id} className="file-attach-item glass-panel flex-between" onClick={() => handleLinkFile(f.id)}>
                    <div className="flex-center gap-2">
                      <FileIcon size={16} /> {f.name}
                    </div>
                    <Plus size={16} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                ))
              )}
            </div>
            <div className="flex-between mt-4" style={{ marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setLinkingTask(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .kanban-board {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        .kanban-column {
          background: rgba(0, 0, 0, 0.03);
          border-radius: var(--border-radius);
          padding: 20px;
          border: 1px solid var(--border-color);
        }
        .kanban-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: background 0.2s;
          border-radius: 8px;
        }
        .kanban-cards.dragging-over {
          background: rgba(59, 130, 246, 0.05);
        }
        .task-card {
          padding: 16px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .dropdown {
          position: relative;
          display: inline-block;
        }
        .dropdown-content {
          display: none;
          position: absolute;
          right: 0;
          min-width: 160px;
          z-index: 10;
          padding: 8px;
        }
        .dropdown:hover .dropdown-content, .dropdown:focus-within .dropdown-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dropdown-content button {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          text-align: left;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
        }
        .dropdown-content button:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-primary);
        }
        .linked-files {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .linked-file-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,0,0,0.05);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .file-list-attach {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }
        .file-attach-item {
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .file-attach-item:hover {
          background: rgba(0,0,0,0.03);
          border-color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
}
