import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { TabNav } from '@/components/shared/TabNav';

export default function RecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[100dvh] bg-zinc-50 dark:bg-zinc-950 flex flex-col pt-[env(safe-area-inset-top)] pb-16 md:pb-0 overflow-hidden">
      <TabNav />
      {children}
      <InstallPrompt />
    </div>
  );
}
