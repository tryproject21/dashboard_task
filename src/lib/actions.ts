'use server';

import db from './db';
import { revalidatePath } from 'next/cache';

export async function getTasks() {
  const stmt = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC');
  return stmt.all();
}

export async function addTask(formData: FormData) {
  const id = crypto.randomUUID();
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const deadline = formData.get('deadline') as string;
  const priority = formData.get('priority') as string || 'medium';

  const stmt = db.prepare(`
    INSERT INTO tasks (id, title, description, deadline, priority, status)
    VALUES (?, ?, ?, ?, ?, 'todo')
  `);
  
  stmt.run(id, title, description, deadline, priority);
  revalidatePath('/tasks');
  revalidatePath('/');
}

export async function updateTaskStatus(id: string, status: string) {
  const completedAt = status === 'done' ? new Date().toISOString() : null;
  const stmt = db.prepare('UPDATE tasks SET status = ?, completedAt = ? WHERE id = ?');
  stmt.run(status, completedAt, id);
  revalidatePath('/tasks');
  revalidatePath('/');
}

export async function deleteTask(id: string) {
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(id);
  revalidatePath('/tasks');
  revalidatePath('/');
}
