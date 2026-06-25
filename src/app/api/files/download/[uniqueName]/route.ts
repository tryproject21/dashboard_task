import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ uniqueName: string }> }) {
  try {
    const resolvedParams = await params;
    const dbPath = `/api/files/download/${resolvedParams.uniqueName}`;
    
    const { rows: fileRows } = await sql`
      SELECT id, type, name FROM files WHERE path = ${dbPath}
    `;

    if (fileRows.length === 0) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileRecord = fileRows[0];
    
    const { rows: chunks } = await sql`
      SELECT data FROM file_chunks 
      WHERE file_id = ${fileRecord.id} 
      ORDER BY chunk_index ASC
    `;

    if (chunks.length === 0) {
      return new NextResponse('File content is empty', { status: 404 });
    }

    const base64Data = chunks.map(c => c.data).join('');
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileRecord.type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${fileRecord.name}"`,
      },
    });
  } catch (error) {
    console.error('File download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
