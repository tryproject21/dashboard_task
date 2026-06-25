import { getMeetings } from '@/lib/meetingActions';
import { getTasks } from '@/lib/taskActions';
import ScheduleBoard from './ScheduleBoard';

export default async function SchedulePage() {
  const meetings = await getMeetings();
  const tasks = await getTasks();
  return <ScheduleBoard initialMeetings={meetings as any[]} initialTasks={tasks as any[]} />;
}
