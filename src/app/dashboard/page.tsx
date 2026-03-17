import { getDashboardData } from '@/actions/dashboard';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardPage() {
  const { sessions, visits } = await getDashboardData();

  return <DashboardShell sessions={sessions} visits={visits} />;
}
