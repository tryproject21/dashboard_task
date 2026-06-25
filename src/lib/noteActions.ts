'use server';

import { sql } from './db';
import { revalidatePath } from 'next/cache';

export async function getNotes() {
  try {
    const { rows } = await sql`SELECT * FROM notes ORDER BY "updatedAt" DESC`;
    return rows;
  } catch (error) {
    console.error("Failed to fetch notes from Postgres:", error);
    return [];
  }
}

export async function saveNote(id: string | null, title: string, content: string, meeting_id?: string | null) {
  try {
    if (id) {
      await sql`
        UPDATE notes 
        SET title = ${title}, content = ${content}, "updatedAt" = CURRENT_TIMESTAMP, meeting_id = ${meeting_id || null}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO notes (title, content, meeting_id) 
        VALUES (${title}, ${content}, ${meeting_id || null})
      `;
    }
    revalidatePath('/notes');
  } catch (error) {
    console.error("Failed to save note:", error);
  }
}

export async function deleteNote(id: string) {
  try {
    await sql`DELETE FROM notes WHERE id = ${id}`;
    revalidatePath('/notes');
  } catch (error) {
    console.error("Failed to delete note:", error);
  }
}
