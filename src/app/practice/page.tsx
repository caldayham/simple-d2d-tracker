import { getPracticeData } from '@/actions/practice';
import { PracticeCanvasWrapper } from '@/components/practice/PracticeCanvasWrapper';

export default async function PracticePage() {
  const { nodes, connections } = await getPracticeData();

  return (
    <div className="flex-1 relative">
      <PracticeCanvasWrapper nodes={nodes} connections={connections} />
    </div>
  );
}
