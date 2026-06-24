import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tasksStmt = db.prepare("SELECT * FROM tasks WHERE status != 'done' AND deadline IS NOT NULL");
  const tasks = tasksStmt.all();

  const meetingsStmt = db.prepare('SELECT * FROM meetings');
  const meetings = meetingsStmt.all();

  const notifications = [];

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
