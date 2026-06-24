import { sql } from './db';
import { revalidatePath } from 'next/cache';

export async function getTasks() {
  try {
    const { rows } = await sql`SELECT * FROM tasks ORDER BY "createdAt" DESC`;
    return rows;
  } catch (error) {
    console.error("Failed to fetch tasks from Postgres:", error);
    return [];
  }
}

export async function addTask(formData: FormData) {
  const title = formData.get('title') as string;
  const deadline = formData.get('deadline') as string;
  const priority = formData.get('priority') as string;

  try {
    await sql`
      INSERT INTO tasks (title, deadline, priority) 
      VALUES (${title}, ${deadline}, ${priority})
    `;
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to add task:", error);
  }
}

export async function toggleTaskStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === 'done' ? 'todo' : 'done';
  try {
    await sql`
      UPDATE tasks 
      SET status = ${newStatus} 
      WHERE id = ${id}
    `;
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to update task status:", error);
  }
}

export async function deleteTask(id: string) {
  try {
    await sql`DELETE FROM tasks WHERE id = ${id}`;
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
}
