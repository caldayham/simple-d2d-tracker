import { getDashboardData } from '@/actions/dashboard';
import { getResultTags } from '@/actions/settings';
import { getPracticeData } from '@/actions/practice';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardPage() {
  const [{ sessions, visits }, resultTags, practiceData] = await Promise.all([
    getDashboardData(),
    getResultTags(),
    getPracticeData(),
  ]);

  return (
    <DashboardShell
      sessions={sessions}
      visits={visits}
      resultTags={resultTags}
      practiceNodes={practiceData.nodes}
      practiceConnections={practiceData.connections}
    />
  );
}
