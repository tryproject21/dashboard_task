'use server';

import db from './db';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

export async function getFiles() {
  const stmt = db.prepare('SELECT * FROM files ORDER BY createdAt DESC');
  return stmt.all();
}

export async function deleteFile(id: string, filePath: string) {
  try {
    // Delete from filesystem
    const fullPath = path.join(process.cwd(), 'public', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    // Delete from DB
    const stmt = db.prepare('DELETE FROM files WHERE id = ?');
    stmt.run(id);
    revalidatePath('/files');
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
}

export async function createFolder(name: string, parentId: string | null) {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO files (id, name, path, size, type, parentId)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, name, '', 0, 'folder', parentId);
  revalidatePath('/files');
}

export async function linkFileToTask(fileId: string, taskId: string | null) {
  const stmt = db.prepare('UPDATE files SET taskId = ? WHERE id = ?');
  stmt.run(taskId, fileId);
  revalidatePath('/tasks');
  revalidatePath('/files');
}
