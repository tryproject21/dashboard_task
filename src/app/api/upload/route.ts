import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Content = buffer.toString('base64');
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const dbPath = `/api/files/download/${uniqueName}`;
    const parentId = formData.get('parentId') as string | null;

    try {
      await sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS content TEXT`;
    } catch (e) {}

    await sql`
      INSERT INTO files (name, path, size, type, "taskId", "parentId", content)
      VALUES (${file.name}, ${dbPath}, ${file.size}, ${file.type}, ${taskId || null}, ${parentId || null}, ${base64Content})
    `;

    return NextResponse.json({ success: true, path: dbPath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
