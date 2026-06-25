import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getGoogleCalendarClient() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({ access_token: (session as any).accessToken });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getGoogleEvents() {
  const calendar = await getGoogleCalendarClient();
  if (!calendar) return [];

  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];
    return events.map((e: any) => ({
      id: e.id,
      title: e.summary || 'Untitled',
      date: e.start?.dateTime || e.start?.date,
      link: e.location || e.hangoutLink || ''
    }));
  } catch (error) {
    console.error("GCal fetch error", error);
    return [];
  }
}

export async function createGoogleEvent(title: string, date: string, link: string, timeZone: string = 'UTC') {
  const calendar = await getGoogleCalendarClient();
  if (!calendar) return null;

  try {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const event = {
      summary: title,
      location: link,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timeZone,
      },
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    return res.data;
  } catch (error) {
    console.error("GCal insert error", error);
    return null;
  }
}

export async function updateGoogleEvent(id: string, title: string, date: string, link: string, timeZone: string = 'UTC') {
  const calendar = await getGoogleCalendarClient();
  if (!calendar) return null;

  try {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const event = {
      summary: title,
      location: link,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timeZone,
      },
    };

    const res = await calendar.events.update({
      calendarId: 'primary',
      eventId: id,
      requestBody: event,
    });
    
    return res.data;
  } catch (error) {
    console.error("GCal update error", error);
    return null;
  }
}
