import { getMeetings } from '@/lib/meetingActions';
import ScheduleBoard from './ScheduleBoard';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

export default async function SchedulePage() {
  const meetings = await getMeetings();
  return <ScheduleBoard initialMeetings={meetings as any[]} />;
}
