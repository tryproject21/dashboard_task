import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const query = `%${q}%`;
  
  try {
    const tasksRes = await sql`SELECT id, title, 'task' as type FROM tasks WHERE title ILIKE ${query} LIMIT 5`;
    const filesRes = await sql`SELECT id, name as title, 'file' as type FROM files WHERE name ILIKE ${query} LIMIT 5`;
    const meetingsRes = await sql`SELECT id, title, 'meeting' as type FROM meetings WHERE title ILIKE ${query} LIMIT 5`;
    const notesRes = await sql`SELECT id, title, 'note' as type FROM notes WHERE title ILIKE ${query} OR content ILIKE ${query} LIMIT 5`;

    const results = [...tasksRes.rows, ...filesRes.rows, ...meetingsRes.rows, ...notesRes.rows];

    return NextResponse.json({ results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ results: [] });
  }
}
