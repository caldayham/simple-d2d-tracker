'use client';

import dynamic from 'next/dynamic';
import type { PracticeNode, PracticeConnection } from '@/lib/types';

const PracticeCanvas = dynamic(() => import('./PracticeCanvas'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-zinc-900 animate-pulse" />,
});

export function PracticeCanvasWrapper({
  nodes,
  connections,
}: {
  nodes: PracticeNode[];
  connections: PracticeConnection[];
}) {
  return <PracticeCanvas nodes={nodes} connections={connections} />;
}
