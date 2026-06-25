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
      await sql`
        CREATE TABLE IF NOT EXISTS file_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          file_id UUID,
          chunk_index INTEGER,
          data TEXT
        )
      `;
    } catch (e) {}

    // First insert the file record
    const { rows } = await sql`
      INSERT INTO files (name, path, size, type, "taskId", "parentId")
      VALUES (${file.name}, ${dbPath}, ${file.size}, ${file.type}, ${taskId || null}, ${parentId || null})
      RETURNING id
    `;
    
    const fileId = rows[0].id;

    // Split base64 into 500KB chunks to bypass Neon HTTP 1MB limit
    const chunkSize = 500000;
    for (let i = 0; i < base64Content.length; i += chunkSize) {
      const chunk = base64Content.slice(i, i + chunkSize);
      await sql`
        INSERT INTO file_chunks (file_id, chunk_index, data)
        VALUES (${fileId}, ${i / chunkSize}, ${chunk})
      `;
    }

    return NextResponse.json({ success: true, path: dbPath });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
