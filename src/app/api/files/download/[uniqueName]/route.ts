import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ uniqueName: string }> }) {
  try {
    const resolvedParams = await params;
    const dbPath = `/api/files/download/${resolvedParams.uniqueName}`;
    
    const { rows } = await sql`
      SELECT content, type, name FROM files WHERE path = ${dbPath}
    `;

    if (rows.length === 0) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileRecord = rows[0];
    
    if (!fileRecord.content) {
      return new NextResponse('File content is empty', { status: 404 });
    }

    const buffer = Buffer.from(fileRecord.content, 'base64');

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
