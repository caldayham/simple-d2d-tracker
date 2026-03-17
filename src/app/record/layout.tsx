import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { TabNav } from '@/components/shared/TabNav';

export default function RecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col pb-16 md:pb-0">
      <TabNav />
      {children}
      <InstallPrompt />
    </div>
  );
}
