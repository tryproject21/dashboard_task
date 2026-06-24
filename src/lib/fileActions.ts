'use server';

import { sql } from './db';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

export async function getFiles() {
  try {
    const { rows } = await sql`SELECT * FROM files ORDER BY "createdAt" DESC`;
    return rows;
  } catch (error) {
    console.error("Postgres error:", error);
    return [];
  }
}

export async function deleteFile(id: string, filePath: string) {
  try {
    // Delete from filesystem (Note: on Vercel this only works locally, storage solutions are needed for real deployments)
    const fullPath = path.join(process.cwd(), 'public', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    // Delete from DB
    await sql`DELETE FROM files WHERE id = ${id}`;
    revalidatePath('/files');
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
}

export async function createFolder(name: string, parentId: string | null) {
  try {
    await sql`
      INSERT INTO files (name, path, size, type, "parentId")
      VALUES (${name}, '', 0, 'folder', ${parentId})
    `;
    revalidatePath('/files');
  } catch (error) {
    console.error(error);
  }
}

export async function linkFileToTask(fileId: string, taskId: string | null) {
  try {
    await sql`UPDATE files SET "taskId" = ${taskId} WHERE id = ${fileId}`;
    revalidatePath('/tasks');
    revalidatePath('/files');
  } catch (error) {
    console.error(error);
  }
}
