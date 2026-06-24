import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const query = `%${q}%`;
  
  const tasksStmt = db.prepare('SELECT id, title, "task" as type FROM tasks WHERE title LIKE ? OR description LIKE ? LIMIT 5');
  const tasks = tasksStmt.all(query, query);

  const filesStmt = db.prepare('SELECT id, name as title, "file" as type FROM files WHERE name LIKE ? LIMIT 5');
  const files = filesStmt.all(query);

  const meetingsStmt = db.prepare('SELECT id, title, "meeting" as type FROM meetings WHERE title LIKE ? LIMIT 5');
  const meetings = meetingsStmt.all(query);

  const notesStmt = db.prepare('SELECT id, title, "note" as type FROM notes WHERE title LIKE ? OR content LIKE ? LIMIT 5');
  const notes = notesStmt.all(query, query);

  const results = [...tasks, ...files, ...meetings, ...notes];

  return NextResponse.json({ results });
}
