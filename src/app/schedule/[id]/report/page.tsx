import { getMeeting } from '@/lib/meetingActions';
import ReportBuilder from './ReportBuilder';

export default async function ReportPage({ params }: { params: { id: string } }) {
  const meeting = await getMeeting(params.id);
  
  if (!meeting) {
    return <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>Meeting not found.</div>;
  }

  return <ReportBuilder meeting={meeting as any} />;
}
