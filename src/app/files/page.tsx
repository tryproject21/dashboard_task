import { getFiles } from '@/lib/fileActions';
import FileExplorer from './FileExplorer';

export default async function FilesPage() {
  const files = await getFiles();
  return <FileExplorer initialFiles={files as any[]} />;
}
