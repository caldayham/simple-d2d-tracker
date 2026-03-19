'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Session, Visit, ResultTag } from '@/lib/types';
import { getSessionColor } from '@/lib/colors';
import { RunsList } from './RunsList';
import { RunDetail } from './RunDetail';
import { SessionFilter } from './SessionFilter';
import { VisitList } from './VisitList';
import { VisitDetail } from './VisitDetail';
import { MobileVisitDetail } from './MobileVisitDetail';
import { EditVisitModal } from './EditVisitModal';
import { deleteVisit, updateVisit, createManualVisit } from '@/actions/visits';
import { resolveAndUpdateAddress } from '@/actions/visits';
import { createSession, endSession, deleteSession, updateSession, reorderSessions } from '@/actions/sessions';
import { Plus, Footprints, DoorOpen } from 'lucide-react';

const DashboardMap = dynamic(() => import('./DashboardMap'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-zinc-900 animate-pulse" />,
});

type SidebarTab = 'runs' | 'knocks';

interface DashboardShellProps {
  sessions: Session[];
  visits: Visit[];
  resultTags: ResultTag[];
}

export function DashboardShell({ sessions, visits, resultTags }: DashboardShellProps) {
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<SidebarTab>('knocks');

  // Knocks state
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'closed' | 'edit' | 'add'>('closed');
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Runs state
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Escape key: close modal → deselect item → deselect filter (priority order)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (modalMode !== 'closed') {
        setModalMode('closed');
        setEditingVisit(null);
      } else if (activeTab === 'knocks' && selectedVisitId) {
        setSelectedVisitId(null);
      } else if (activeTab === 'runs' && selectedRunId) {
        setSelectedRunId(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalMode, activeTab, selectedVisitId, selectedRunId]);

  const sessionColorMap = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((session, index) => {
      map.set(session.id, getSessionColor(index));
    });
    return map;
  }, [sessions]);

  const filteredVisits = useMemo(() => {
    if (!selectedSessionId) return visits;
    return visits.filter((v) => v.session_id === selectedSessionId);
  }, [visits, selectedSessionId]);

  const selectedVisit = useMemo(() => {
    if (!selectedVisitId) return null;
    return visits.find((v) => v.id === selectedVisitId) ?? null;
  }, [visits, selectedVisitId]);

  const selectedVisitColor = selectedVisit
    ? sessionColorMap.get(selectedVisit.session_id) ?? '#3B82F6'
    : '#3B82F6';

  const selectedRun = useMemo(() => {
    if (!selectedRunId) return null;
    return sessions.find((s) => s.id === selectedRunId) ?? null;
  }, [sessions, selectedRunId]);

  const selectedRunColor = selectedRun
    ? sessionColorMap.get(selectedRun.id) ?? '#3B82F6'
    : '#3B82F6';

  // Map visits: show run's visits when on Runs tab with a run selected, otherwise use knocks filter
  const mapVisits = useMemo(() => {
    if (activeTab === 'runs' && selectedRunId) {
      return visits.filter((v) => v.session_id === selectedRunId);
    }
    return filteredVisits;
  }, [activeTab, selectedRunId, filteredVisits, visits]);

  // --- Knock handlers ---
  const handleEditVisit = useCallback((visit: Visit) => {
    setEditingVisit(visit);
    setModalMode('edit');
  }, []);

  const handleDeleteVisit = useCallback(async (visitId: string) => {
    try {
      await deleteVisit(visitId);
      if (selectedVisitId === visitId) setSelectedVisitId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }, [selectedVisitId, router]);

  const handleAddVisit = useCallback(() => {
    setEditingVisit(null);
    setModalMode('add');
  }, []);

  const handleSaveVisit = useCallback(async (data: {
    id?: string;
    session_id: string;
    address: string;
    latitude: string;
    longitude: string;
    result: string;
    notes: string;
    contact_name: string;
    gender: string;
    age_range: string;
    occupancy: string;
  }) => {
    setIsSaving(true);
    try {
      if (data.id) {
        await updateVisit(data.id, {
          address: data.address || null,
          result: data.result || null,
          notes: data.notes || null,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          contact_name: data.contact_name || null,
          gender: data.gender || null,
          age_range: data.age_range || null,
          occupancy: data.occupancy || null,
        });
      } else {
        const visit = await createManualVisit({
          session_id: data.session_id,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          address: data.address || undefined,
          result: data.result || undefined,
          notes: data.notes || undefined,
          contact_name: data.contact_name || undefined,
          gender: data.gender || undefined,
          age_range: data.age_range || undefined,
          occupancy: data.occupancy || undefined,
        });
        if (!data.address && visit.id) {
          resolveAndUpdateAddress(
            visit.id,
            parseFloat(data.latitude),
            parseFloat(data.longitude)
          ).catch(() => {});
        }
      }
      setModalMode('closed');
      setEditingVisit(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [router]);

  // --- Run handlers ---
  const handleViewKnocks = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedVisitId(null);
    setActiveTab('knocks');
  }, []);

  const handleEditRun = useCallback(async (
    sessionId: string,
    data: { label: string; notes: string }
  ) => {
    try {
      await updateSession(sessionId, {
        label: data.label || undefined,
        notes: data.notes || null,
      });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  }, [router]);

  const handleDeleteRun = useCallback(async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      if (selectedRunId === sessionId) setSelectedRunId(null);
      if (selectedSessionId === sessionId) setSelectedSessionId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }, [selectedRunId, selectedSessionId, router]);

  const handleEndRun = useCallback(async (sessionId: string) => {
    try {
      await endSession(sessionId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to end run');
    }
  }, [router]);

  const handleReorderRun = useCallback(async (
    sessionId: string,
    direction: 'up' | 'down'
  ) => {
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sessions.length) return;

    const newOrder = sessions.map((s) => s.id);
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    try {
      await reorderSessions(newOrder);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reorder');
    }
  }, [sessions, router]);

  const handleAddRun = useCallback(async () => {
    try {
      const session = await createSession();
      setSelectedRunId(session.id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create run');
    }
  }, [router]);

  // --- Tab bar component ---
  function TabBar() {
    return (
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('runs')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'runs'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <Footprints size={15} />
          Runs
        </button>
        <button
          onClick={() => setActiveTab('knocks')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'knocks'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <DoorOpen size={15} />
          Knocks
        </button>
      </div>
    );
  }

  // --- Sidebar content based on active tab ---
  function SidebarContent() {
    if (activeTab === 'runs') {
      return (
        <>
          <RunsList
            sessions={sessions}
            visits={visits}
            sessionColorMap={sessionColorMap}
            selectedRunId={selectedRunId}
            onSelectRun={setSelectedRunId}
            onReorder={handleReorderRun}
          />
          {selectedRun && (
            <RunDetail
              session={selectedRun}
              visits={visits}
              sessionColor={selectedRunColor}
              onViewKnocks={handleViewKnocks}
              onEdit={handleEditRun}
              onDelete={handleDeleteRun}
              onEndRun={handleEndRun}
            />
          )}
        </>
      );
    }

    return (
      <>
        <SessionFilter
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
        />
        <VisitList
          visits={filteredVisits}
          sessionColorMap={sessionColorMap}
          selectedVisitId={selectedVisitId}
          onSelectVisit={setSelectedVisitId}
        />
        {selectedVisit && (
          <VisitDetail
            visit={selectedVisit}
            sessionColor={selectedVisitColor}
            onEdit={handleEditVisit}
            onDelete={handleDeleteVisit}
          />
        )}
      </>
    );
  }

  if (visits.length === 0 && sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
        <p>No visits recorded yet. Start a canvassing session from your phone.</p>
        <button
          onClick={handleAddVisit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} />
          Add Visit Manually
        </button>
        {modalMode !== 'closed' && (
          <EditVisitModal
            key={`${modalMode}-${editingVisit?.id ?? 'new'}-${selectedSessionId}`}
            visit={editingVisit}
            sessions={sessions}
            visits={visits}
            resultTags={resultTags}
            defaultSessionId={selectedSessionId}
            onSave={handleSaveVisit}
            onClose={() => { setModalMode('closed'); setEditingVisit(null); }}
            isSaving={isSaving}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden md:flex flex-1">
        <div className="flex-1 relative">
          <DashboardMap
            visits={mapVisits}
            sessionColorMap={sessionColorMap}
            selectedVisitId={activeTab === 'knocks' ? selectedVisitId : null}
            onSelectVisit={(id) => {
              if (activeTab === 'knocks') setSelectedVisitId(id);
            }}
          />
          <button
            onClick={activeTab === 'knocks' ? handleAddVisit : handleAddRun}
            className="absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg shadow-lg hover:bg-blue-500 transition-colors"
          >
            <Plus size={16} />
            {activeTab === 'knocks' ? 'Add Knock' : 'Add Run'}
          </button>
        </div>
        <div className="w-[400px] border-l border-zinc-800 flex flex-col overflow-hidden">
          <TabBar />
          <SidebarContent />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        <TabBar />
        {activeTab === 'knocks' ? (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex-1">
              <SessionFilter
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={setSelectedSessionId}
              />
            </div>
            <button
              onClick={handleAddVisit}
              className="shrink-0 p-2 bg-blue-600 text-white rounded-lg"
              title="Add knock"
            >
              <Plus size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end px-2 py-1">
            <button
              onClick={handleAddRun}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg"
            >
              <Plus size={16} />
              Add Run
            </button>
          </div>
        )}
        {activeTab === 'runs' ? (
          <>
            <RunsList
              sessions={sessions}
              visits={visits}
              sessionColorMap={sessionColorMap}
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
              onReorder={handleReorderRun}
            />
            {selectedRun && (
              <MobileRunDetail
                session={selectedRun}
                visits={visits}
                sessionColor={selectedRunColor}
                onViewKnocks={handleViewKnocks}
                onEdit={handleEditRun}
                onDelete={handleDeleteRun}
                onClose={() => setSelectedRunId(null)}
              />
            )}
          </>
        ) : (
          <>
            <VisitList
              visits={filteredVisits}
              sessionColorMap={sessionColorMap}
              selectedVisitId={selectedVisitId}
              onSelectVisit={setSelectedVisitId}
            />
            {selectedVisit && (
              <MobileVisitDetail
                visit={selectedVisit}
                sessionColor={selectedVisitColor}
                onClose={() => setSelectedVisitId(null)}
                onEdit={handleEditVisit}
                onDelete={handleDeleteVisit}
              />
            )}
          </>
        )}
      </div>

      {/* Edit/Add Modal */}
      {modalMode !== 'closed' && (
        <EditVisitModal
          visit={editingVisit}
          sessions={sessions}
          visits={visits}
          resultTags={resultTags}
          onSave={handleSaveVisit}
          onClose={() => { setModalMode('closed'); setEditingVisit(null); }}
          isSaving={isSaving}
        />
      )}
    </>
  );
}

// --- Mobile Run Detail (bottom sheet) ---
function MobileRunDetail({
  session,
  visits,
  sessionColor,
  onViewKnocks,
  onEdit,
  onDelete,
  onClose,
}: {
  session: Session;
  visits: Visit[];
  sessionColor: string;
  onViewKnocks: (id: string) => void;
  onEdit: (id: string, data: { label: string; notes: string }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-700 rounded-t-2xl max-h-[70vh] overflow-y-auto animate-slide-up pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 bg-zinc-900 pt-3 pb-2 px-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="w-1.5 h-5 rounded-full shrink-0"
              style={{ backgroundColor: sessionColor }}
            />
            <h3 className="text-white font-medium text-base truncate">
              {session.label || 'Untitled Run'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1"
          >
            <span className="sr-only">Close</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-4 pb-4">
          <RunDetail
            session={session}
            visits={visits}
            sessionColor={sessionColor}
            onViewKnocks={(id) => { onClose(); onViewKnocks(id); }}
            onEdit={onEdit}
            onDelete={(id) => { onClose(); onDelete(id); }}
          />
        </div>
      </div>
    </>
  );
}
