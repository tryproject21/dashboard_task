'use server';

import { sql } from './db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createGoogleEvent } from './googleCalendar';

export async function getMeetings() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    // If authenticated, we read from Google Calendar
    const { getGoogleEvents } = await import('./googleCalendar');
    return await getGoogleEvents();
  }

  // Fallback to Vercel Postgres if not logged in
  try {
    const { rows } = await sql`SELECT * FROM meetings ORDER BY date ASC`;
    return rows;
  } catch (e) {
    return [];
  }
}

export async function addMeeting(formData: FormData) {
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const link = formData.get('link') as string;
  const timeZone = formData.get('timeZone') as string;

  const session = await getServerSession(authOptions);
  if (session) {
    const { createGoogleEvent } = await import('./googleCalendar');
    await createGoogleEvent(title, date, link, timeZone);
  } else {
    try {
      await sql`INSERT INTO meetings (title, date, link) VALUES (${title}, ${date}, ${link})`;
    } catch (e) {
      console.error(e);
    }
  }
  
  revalidatePath('/schedule');
  revalidatePath('/');
}

export async function editMeeting(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const link = formData.get('link') as string;
  const timeZone = formData.get('timeZone') as string;

  const session = await getServerSession(authOptions);
  if (session) {
    const { updateGoogleEvent } = await import('./googleCalendar');
    await updateGoogleEvent(id, title, date, link, timeZone);
  } else {
    try {
      await sql`UPDATE meetings SET title = ${title}, date = ${date}, link = ${link} WHERE id = ${id}`;
    } catch (e) {
      console.error(e);
    }
  }
  
  revalidatePath('/schedule');
  revalidatePath('/');
}

export async function deleteMeeting(id: string) {
  const session = await getServerSession(authOptions);
  if (session) {
    const { getGoogleCalendarClient } = await import('./googleCalendar');
    const calendar = await getGoogleCalendarClient();
    if (calendar) {
      try {
        await calendar.events.delete({ calendarId: 'primary', eventId: id });
      } catch (e) {
        console.error("GCal delete error", e);
      }
    }
  } else {
    try {
      await sql`DELETE FROM meetings WHERE id = ${id}`;
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath('/schedule');
  revalidatePath('/');
}

export async function updateMeetingDate(id: string, newDateStr: string) {
  const session = await getServerSession(authOptions);
  
  if (session) {
    const { getGoogleCalendarClient } = await import('./googleCalendar');
    const calendar = await getGoogleCalendarClient();
    if (calendar) {
      try {
        const eventRes = await calendar.events.get({ calendarId: 'primary', eventId: id });
        const event = eventRes.data;
        
        // We only change the date portion, keep the time.
        // newDateStr is YYYY-MM-DD
        const oldDate = event.start?.dateTime ? new Date(event.start.dateTime) : new Date();
        const [year, month, day] = newDateStr.split('-');
        oldDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: id,
          requestBody: {
            start: { dateTime: oldDate.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            end: { dateTime: new Date(oldDate.getTime() + 60*60*1000).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
          }
        });
      } catch (e) {
        console.error("GCal patch error", e);
      }
    }
  } else {
    try {
      // Postgres: we just get old date, change date part, and update
      const res = await sql`SELECT date FROM meetings WHERE id = ${id}`;
      if (res.rows.length > 0) {
        const oldDate = new Date(res.rows[0].date);
        const [year, month, day] = newDateStr.split('-');
        oldDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
        await sql`UPDATE meetings SET date = ${oldDate.toISOString()} WHERE id = ${id}`;
      }
    } catch (e) {
      console.error(e);
    }
  }
  revalidatePath('/schedule');
  revalidatePath('/');
}
