import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const id = crypto.randomUUID();
    const dbPath = `/uploads/${uniqueName}`;
    const parentId = formData.get('parentId') as string | null;

    const stmt = db.prepare(`
      INSERT INTO files (id, name, path, size, type, taskId, parentId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, file.name, dbPath, file.size, file.type, taskId || null, parentId || null);

    return NextResponse.json({ success: true, id, path: dbPath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
