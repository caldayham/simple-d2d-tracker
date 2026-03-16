import { InstallPrompt } from '@/components/shared/InstallPrompt';

export default function RecordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {children}
      <InstallPrompt />
    </div>
  );
}
