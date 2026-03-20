'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, LayoutDashboard, Brain, Settings } from 'lucide-react';

const tabs = [
  { href: '/record', label: 'Record', icon: Mic },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/practice', label: 'Practice', icon: Brain },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)] md:static md:border-t-0 md:border-b md:pb-0">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors md:flex-initial md:flex-row md:gap-2 md:px-6 md:py-3 md:text-sm ${
              active
                ? 'text-white md:border-b-2 md:border-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className="w-5 h-5 md:w-4 md:h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
