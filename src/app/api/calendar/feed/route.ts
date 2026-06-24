import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

function formatDateForIcal(dateStr: string) {
  // .ics requires YYYYMMDDTHHMMSSZ format
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function GET() {
  const { rows: meetings } = await sql`SELECT * FROM meetings`;

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ProDash//Calendar Sync//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:ProDash Schedule
`;

  meetings.forEach((m: any) => {
    const startDate = formatDateForIcal(m.date);
    // Assuming meeting is 1 hour long
    const d = new Date(m.date);
    d.setHours(d.getHours() + 1);
    const endDate = formatDateForIcal(d.toISOString());

    icsContent += `BEGIN:VEVENT
UID:${m.id}@prodash.local
DTSTAMP:${startDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${m.title}
DESCRIPTION:Scheduled via ProDash
END:VEVENT
`;
  });

  icsContent += `END:VCALENDAR`;

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="prodash-schedule.ics"',
    },
  });
}
