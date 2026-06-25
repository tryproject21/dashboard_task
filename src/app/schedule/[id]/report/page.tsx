import { getMeeting } from '@/lib/meetingActions';
import ReportBuilder from './ReportBuilder';

export default async function ReportPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const meeting = await getMeeting(params.id);
  
  if (!meeting) {
    return <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>Meeting not found.</div>;
  }

  return <ReportBuilder meeting={meeting as any} />;
}
