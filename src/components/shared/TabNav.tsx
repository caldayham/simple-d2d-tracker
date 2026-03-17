'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, LayoutDashboard } from 'lucide-react';

const tabs = [
  { href: '/record', label: 'Record', icon: Mic },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
] as const;

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-b border-zinc-800 bg-zinc-950 shrink-0">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              active
                ? 'text-white border-b-2 border-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
