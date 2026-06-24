import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let tasks: any[] = [];
  let meetings: any[] = [];

  try {
    const tasksRes = await sql`SELECT * FROM tasks WHERE status != 'done' AND deadline IS NOT NULL`;
    tasks = tasksRes.rows;

    const meetingsRes = await sql`SELECT * FROM meetings`;
    meetings = meetingsRes.rows;
  } catch (e) {
    console.error(e);
  }

  const notifications: any[] = [];

  tasks.forEach((t: any) => {
    const dDate = new Date(t.deadline);
    if (dDate < todayStart) {
      notifications.push({ id: `t-${t.id}`, message: `Task "${t.title}" is overdue!`, type: 'danger', link: '/tasks' });
    } else if (dDate.toDateString() === todayStart.toDateString()) {
      notifications.push({ id: `t-${t.id}`, message: `Task "${t.title}" is due today!`, type: 'warning', link: '/tasks' });
    }
  });

  meetings.forEach((m: any) => {
    const mDate = new Date(m.date);
    if (mDate.toDateString() === todayStart.toDateString() && mDate > new Date()) {
      notifications.push({ id: `m-${m.id}`, message: `Meeting "${m.title}" is happening today at ${mDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}!`, type: 'info', link: '/schedule' });
    }
  });

  return NextResponse.json({ notifications });
}
