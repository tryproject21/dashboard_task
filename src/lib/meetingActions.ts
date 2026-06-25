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

  const session = await getServerSession(authOptions);
  if (session) {
    await createGoogleEvent(title, date, link);
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

  const session = await getServerSession(authOptions);
  if (session) {
    const { updateGoogleEvent } = await import('./googleCalendar');
    await updateGoogleEvent(id, title, date, link);
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
