import { getNotes } from '@/lib/noteActions';
import { getMeetings } from '@/lib/meetingActions';
import NotesBoard from './NotesBoard';

export default async function NotesPage() {
  const notes = await getNotes();
  const meetings = await getMeetings();
  return <NotesBoard initialNotes={notes as any[]} meetings={meetings as any[]} />;
}
