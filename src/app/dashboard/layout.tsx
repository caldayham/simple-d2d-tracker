import Link from 'next/link';
import { Map } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0">
        <h1 className="font-semibold text-white">Canvassing Dashboard</h1>
        <Link
          href="/record"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <Map className="w-4 h-4" />
          Record
        </Link>
      </header>
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  );
}
