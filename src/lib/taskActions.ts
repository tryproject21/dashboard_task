'use server';

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
  const description = formData.get('description') as string;
  const deadline = formData.get('deadline') as string;
  const priority = formData.get('priority') as string || 'medium';

  try {
    await sql`
      INSERT INTO tasks (title, description, deadline, priority, status) 
      VALUES (${title}, ${description}, ${deadline}, ${priority}, 'todo')
    `;
    revalidatePath('/tasks');
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to add task:", error);
  }
}

export async function updateTaskStatus(id: string, status: string) {
  const completedAt = status === 'done' ? new Date().toISOString() : null;
  try {
    await sql`
      UPDATE tasks 
      SET status = ${status}, "completedAt" = ${completedAt} 
      WHERE id = ${id}
    `;
    revalidatePath('/tasks');
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to update task status:", error);
  }
}

export async function deleteTask(id: string) {
  try {
    await sql`DELETE FROM tasks WHERE id = ${id}`;
    revalidatePath('/tasks');
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
}
