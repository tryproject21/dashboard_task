import { getNotes } from '@/lib/noteActions';
import NotesBoard from './NotesBoard';

export default async function NotesPage() {
  const notes = await getNotes();
  return <NotesBoard initialNotes={notes as any[]} />;
}
