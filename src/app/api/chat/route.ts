import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  const { message } = await request.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ 
      reply: "⚠️ GEMINI_API_KEY belum dikonfigurasi. Silakan buat file `.env.local` di folder root proyek Anda dan tambahkan kunci akses Anda (contoh: `GEMINI_API_KEY=AIzaSy...`)." 
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Ambil konteks database agar AI pintar
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    
    const tasksRes = await sql`SELECT title, status, priority, deadline FROM tasks`;
    const meetingsRes = await sql`SELECT title, date FROM meetings`;
    const notesRes = await sql`SELECT title FROM notes LIMIT 10`;

    const tasks = tasksRes.rows;
    const meetings = meetingsRes.rows.filter((m: any) => new Date(m.date) >= todayStart);
    const notes = notesRes.rows;

    const systemPrompt = `
      Anda adalah Asisten Produktivitas Eksekutif ProDash.
      Anda memiliki alat (tools) untuk membuat tugas dan mengatur jadwal rapat.
      Jika pengguna meminta Anda untuk membuat tugas atau jadwal, gunakan alat yang sesuai! JANGAN hanya menjawab bahwa Anda akan melakukannya, tapi BENAR-BENAR gunakan alat tersebut.
      Setelah menggunakan alat, beri tahu pengguna bahwa data telah berhasil ditambahkan.

      KONTEKS SISTEM PENGGUNA SAAT INI:
      - Waktu Sekarang: ${new Date().toLocaleString()}
      - Daftar Tugas: ${JSON.stringify(tasks)}
      - Jadwal Meeting Mendatang: ${JSON.stringify(meetings)}
      - Daftar Catatan: ${JSON.stringify(notes)}
      
      Selalu format jawaban dengan markdown.
    `;

    const tools = [{
      functionDeclarations: [
        {
          name: 'createTask',
          description: 'Membantu pengguna membuat tugas (task) baru dan menyimpannya ke database.',
          parameters: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING', description: 'Judul tugas' },
              priority: { type: 'STRING', description: 'Prioritas tugas (high, medium, low)' },
              deadline: { type: 'STRING', description: 'Tanggal deadline YYYY-MM-DD (biarkan kosong jika tidak ada)' }
            },
            required: ['title']
          }
        },
        {
          name: 'createMeeting',
          description: 'Membantu pengguna menjadwalkan rapat (meeting) baru.',
          parameters: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING', description: 'Judul rapat' },
              date: { type: 'STRING', description: 'Tanggal dan waktu rapat dalam format ISO8601 (contoh: 2026-06-25T10:00:00.000Z)' },
              link: { type: 'STRING', description: 'Tautan rapat (opsional)' }
            },
            required: ['title', 'date']
          }
        }
      ]
    }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        tools: tools as any
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      const args = call.args as any;
      
      let actionResult = '';
      
      if (call.name === 'createTask') {
        try {
          await sql`INSERT INTO tasks (title, priority, deadline) VALUES (${args.title}, ${args.priority || 'medium'}, ${args.deadline || null})`;
          actionResult = `Tugas "${args.title}" berhasil ditambahkan ke database!`;
        } catch (e) {
          actionResult = "Gagal menyimpan tugas ke database.";
        }
      } else if (call.name === 'createMeeting') {
        try {
          await sql`INSERT INTO meetings (title, date, link) VALUES (${args.title}, ${args.date}, ${args.link || ''})`;
          actionResult = `Rapat "${args.title}" berhasil dijadwalkan pada ${args.date}!`;
        } catch (e) {
          actionResult = "Gagal menjadwalkan rapat ke database.";
        }
      }

      // Beri tahu AI hasil fungsinya agar dia merangkum
      const secondResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: message }] },
          { role: 'model', parts: [{ functionCall: call }] },
          { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result: actionResult } } }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          tools: tools as any
        }
      });
      
      return NextResponse.json({ reply: secondResponse.text });
    }

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ reply: "Maaf, terjadi kesalahan saat menyambung ke server AI. Coba lagi nanti." });
  }
}
