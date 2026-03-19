import { getDashboardData } from '@/actions/dashboard';
import { getResultTags } from '@/actions/settings';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardPage() {
  const [{ sessions, visits }, resultTags] = await Promise.all([
    getDashboardData(),
    getResultTags(),
  ]);

  return (
    <DashboardShell
      sessions={sessions}
      visits={visits}
      resultTags={resultTags}
    />
  );
}
