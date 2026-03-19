import { TabNav } from '@/components/shared/TabNav';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pt-[env(safe-area-inset-top)] pb-16 md:pb-0">
      <TabNav />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
