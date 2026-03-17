import { TabNav } from '@/components/shared/TabNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col pt-[env(safe-area-inset-top)] pb-16 md:pb-0">
      <TabNav />
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  );
}
