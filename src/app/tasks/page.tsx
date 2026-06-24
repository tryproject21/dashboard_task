import { getTasks } from '@/lib/actions';
import { getFiles } from '@/lib/fileActions';
import TaskBoard from './TaskBoard';

export default async function TasksPage() {
  const tasks = await getTasks();
  const files = await getFiles();
  return <TaskBoard initialTasks={tasks as any[]} allFiles={files as any[]} />;
}
