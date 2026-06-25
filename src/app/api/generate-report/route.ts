import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reportHtml: "<p><em>Error: GEMINI_API_KEY belum dikonfigurasi.</em></p>" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { title, date, attendees, agenda, roughNotes } = await request.json();

    const prompt = `
      Anda adalah asisten eksekutif profesional. Tugas Anda adalah menyusun Notulensi / Laporan Hasil Rapat yang sangat rapi dan formal dalam format HTML.
      
      Informasi Rapat:
      - Judul: ${title}
      - Tanggal: ${new Date(date).toLocaleString()}
      - Peserta: ${attendees || 'Tidak dicatat'}
      - Agenda: ${agenda || 'Tidak ada agenda spesifik'}
      - Catatan Kasar: ${roughNotes || 'Tidak ada catatan kasar'}

      Instruksi:
      1. Buat laporan yang komprehensif, ubah catatan kasar menjadi kalimat yang formal dan mudah dipahami.
      2. Format output Anda HANYA dalam bentuk HTML (Gunakan <h3>, <p>, <ul>, <li>, <strong>, dll). 
      3. JANGAN letakkan tag \`\`\`html di awal atau akhir, cukup output HTML murni.
      4. Struktur laporan:
         - Halaman Pembuka (Judul, Tanggal, Peserta tidak perlu diulang karena sudah ada di header form).
         - Pembahasan Agenda (Jelaskan detail dari agenda dan catatan kasar)
         - Kesimpulan & Keputusan (Highlight poin-poin yang diputuskan)
         - Tindak Lanjut / Action Items (Jika ada, buatkan list berupa checklist atau bullet points)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    let html = response.text || '';
    // Clean up markdown code blocks if AI still outputs them
    if (html.startsWith('\`\`\`html')) {
      html = html.replace(/\`\`\`html/g, '').replace(/\`\`\`/g, '');
    }

    return NextResponse.json({ reportHtml: html });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ reportHtml: "<p><em>Gagal menghubungi AI. Coba lagi nanti.</em></p>" }, { status: 500 });
  }
}
