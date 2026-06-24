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
      Anda adalah Asisten Produktivitas ProDash, seorang asisten cerdas yang membantu pengguna.
      Gunakan bahasa Indonesia yang profesional dan ramah.
      Jawablah pertanyaan pengguna sejelas mungkin.

      KONTEKS SISTEM PENGGUNA SAAT INI:
      - Waktu Sekarang: ${new Date().toLocaleString()}
      - Daftar Tugas: ${JSON.stringify(tasks)}
      - Jadwal Meeting Mendatang: ${JSON.stringify(meetings)}
      - Daftar Catatan (Notes): ${JSON.stringify(notes)}

      Instruksi Ekstra: 
      - Jika pengguna bertanya tentang tugas prioritas, cek tugas yang berstatus selain 'done' dan berprioritas 'high'.
      - Jika pengguna bertanya tentang jadwal, bacakan dari data meetings.
      - Jika pengguna meminta memecah tugas, berikan poin-poin yang bisa dilakukan.
      - Selalu format jawaban Anda menggunakan markdown (*bold*, dll) tanpa HTML raw, dan buat list berurutan dengan baris baru agar mudah dibaca di UI. Jangan berikan jawaban terlalu panjang, maksimal 3 paragraf.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ reply: "Maaf, terjadi kesalahan saat menyambung ke server AI. Coba lagi nanti." });
  }
}
