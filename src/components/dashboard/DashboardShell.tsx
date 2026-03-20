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
import { PlannedKnockList } from './PlannedKnockList';
import { deleteVisit, updateVisit, createManualVisit } from '@/actions/visits';
import { resolveAndUpdateAddress } from '@/actions/visits';
import { createSession, endSession, deleteSession, updateSession, reorderSessions, createPlannedRoute, addPlannedKnocks } from '@/actions/sessions';
import { findAddressesInArea } from '@/actions/geocoding';
import { sortKnocksWalkingOrder, sortKnocksByDirection } from '@/lib/route-sort';
import { Plus, Footprints, DoorOpen, Map as MapIcon, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import type { DrawingPoint } from '@/lib/drawing';
import type { PlannedKnock } from './DrawingMap';
import { AnalyticsPanel } from './AnalyticsPanel';

const DashboardMap = dynamic(() => import('./DashboardMap'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-zinc-900 animate-pulse" />,
});

const DrawingMap = dynamic(() => import('./DrawingMap'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-zinc-900 animate-pulse" />,
});

type SidebarTab = 'runs' | 'knocks' | 'plan';

interface DashboardShellProps {
  sessions: Session[];
  visits: Visit[];
  resultTags: ResultTag[];
}

export function DashboardShell({ sessions, visits, resultTags }: DashboardShellProps) {
  const router = useRouter();

  // Tab state (persisted — hydration-safe via useEffect)
  const [activeTab, setActiveTabRaw] = useState<SidebarTab>('knocks');
  const setActiveTab = useCallback((tab: SidebarTab) => {
    setActiveTabRaw(tab);
    localStorage.setItem('dashboard-tab', tab);
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-tab');
    if (saved === 'runs' || saved === 'knocks' || saved === 'plan') {
      setActiveTabRaw(saved);
    }
  }, []);

  // Knocks state
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'closed' | 'edit' | 'add'>('closed');
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Runs state
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Plan tab state
  const [plannedKnocks, setPlannedKnocks] = useState<PlannedKnock[]>([]);
  const [selectedKnockId, setSelectedKnockId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [isSavingRoute, setIsSavingRoute] = useState(false);
  const [showPlanned, setShowPlanned] = useState(true);
  const [showExecutedInPlan, setShowExecutedInPlanRaw] = useState(false);
  const setShowExecutedInPlan = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    setShowExecutedInPlanRaw((prev) => {
      const next = typeof v === 'function' ? v(prev) : v;
      localStorage.setItem('dashboard-show-executed', String(next));
      return next;
    });
  }, []);
  useEffect(() => {
    setShowExecutedInPlanRaw(localStorage.getItem('dashboard-show-executed') === 'true');
  }, []);

  // Map/Analytics toggle state
  const [showMap, setShowMap] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  useEffect(() => {
    const savedMap = localStorage.getItem('dashboard-show-map');
    const savedAnalytics = localStorage.getItem('dashboard-show-analytics');
    if (savedMap !== null) setShowMap(savedMap === 'true');
    if (savedAnalytics !== null) setShowAnalytics(savedAnalytics === 'true');
  }, []);
  const toggleMap = useCallback(() => {
    setShowMap((prev) => {
      if (prev && !showAnalytics) return prev; // cannot turn off last one
      const next = !prev;
      localStorage.setItem('dashboard-show-map', String(next));
      return next;
    });
  }, [showAnalytics]);
  const toggleAnalytics = useCallback(() => {
    setShowAnalytics((prev) => {
      if (prev && !showMap) return prev; // cannot turn off last one
      const next = !prev;
      localStorage.setItem('dashboard-show-analytics', String(next));
      return next;
    });
  }, [showMap]);

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
      map.set(session.id, session.color ?? getSessionColor(index));
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

  const handleChangeRunColor = useCallback(async (
    sessionId: string,
    color: string
  ) => {
    try {
      await updateSession(sessionId, { color });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update color');
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

  // --- Plan handlers ---
  const handlePolygonComplete = useCallback(async (points: DrawingPoint[]) => {
    setIsLoadingAddresses(true);
    try {
      const addresses = await findAddressesInArea(
        points.map((p) => ({ lat: p.lat, lng: p.lng }))
      );
      const sorted = sortKnocksWalkingOrder(addresses);
      setPlannedKnocks(
        sorted.map((a) => ({
          id: crypto.randomUUID(),
          latitude: a.latitude,
          longitude: a.longitude,
          address: a.address,
          notes: '',
        }))
      );
      setSelectedKnockId(null);
      if (addresses.length === 0) {
        toast.info('No houses found in the selected area. Try a larger area.');
      }
    } catch {
      toast.error('Failed to find addresses in area');
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  const handleSaveRoute = useCallback(async () => {
    if (!routeName.trim() || plannedKnocks.length === 0) return;
    setIsSavingRoute(true);
    try {
      const route = await createPlannedRoute(routeName.trim());
      await addPlannedKnocks(
        route.id,
        plannedKnocks.map((k) => ({
          latitude: k.latitude,
          longitude: k.longitude,
          address: k.address,
          notes: k.notes || undefined,
        }))
      );
      toast.success(`Route "${routeName.trim()}" saved with ${plannedKnocks.length} knocks`);
      setPlannedKnocks([]);
      setRouteName('');
      setSelectedRunId(route.id);
      setActiveTab('runs');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSavingRoute(false);
    }
  }, [routeName, plannedKnocks, router]);

  const handleCancelPlan = useCallback(() => {
    // User cancelled drawing — nothing to clean up
  }, []);

  const handleClearAllPlan = useCallback(() => {
    setPlannedKnocks([]);
    setSelectedKnockId(null);
  }, []);

  const handleDeleteKnock = useCallback((id: string) => {
    setPlannedKnocks((prev) => prev.filter((k) => k.id !== id));
    if (selectedKnockId === id) setSelectedKnockId(null);
  }, [selectedKnockId]);

  const handleUpdateKnockNotes = useCallback((id: string, notes: string) => {
    setPlannedKnocks((prev) =>
      prev.map((k) => (k.id === id ? { ...k, notes } : k))
    );
  }, []);

  const handleSelectKnock = useCallback((id: string | null) => {
    setSelectedKnockId(id);
  }, []);

  const handleDirectionSet = useCallback((dirPoints: Array<{ lat: number; lng: number }>) => {
    setPlannedKnocks((prev) => {
      if (prev.length === 0) return prev;
      return sortKnocksByDirection(prev, dirPoints);
    });
  }, []);

  // Planned knocks from existing planned routes (for map display)
  const plannedVisits = useMemo(() => {
    return visits.filter((v) => {
      const session = sessions.find((s) => s.id === v.session_id);
      return session && !session.started;
    });
  }, [visits, sessions]);

  // Executed visits (from started sessions) for plan view overlay
  const executedVisits = useMemo(() => {
    return visits.filter((v) => {
      const session = sessions.find((s) => s.id === v.session_id);
      return session && session.started;
    });
  }, [visits, sessions]);

  // --- Tab bar component ---
  const tabBar = (
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
      <button
        onClick={() => setActiveTab('plan')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
          activeTab === 'plan'
            ? 'text-white border-b-2 border-blue-500'
            : 'text-zinc-400 hover:text-zinc-300'
        }`}
      >
        <MapIcon size={15} />
        Plan
      </button>
    </div>
  );

  // --- Sidebar content based on active tab ---
  const sidebarContent = activeTab === 'runs' ? (
    <>
      <RunsList
        sessions={sessions}
        visits={visits}
        sessionColorMap={sessionColorMap}
        selectedRunId={selectedRunId}
        onSelectRun={setSelectedRunId}
        onReorder={handleReorderRun}
        onChangeColor={handleChangeRunColor}
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
          onChangeColor={handleChangeRunColor}
        />
      )}
    </>
  ) : activeTab === 'plan' ? (
    <>
      {/* Show Runs toggle */}
      {executedVisits.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
          <button
            onClick={() => setShowExecutedInPlan((v) => !v)}
            className={`flex items-center gap-2 text-xs transition-colors ${
              showExecutedInPlan ? 'text-zinc-300' : 'text-zinc-500'
            }`}
          >
            <div
              className="w-3 h-3 rounded-sm border border-zinc-500"
              style={{ backgroundColor: showExecutedInPlan ? '#ef4444' : 'transparent' }}
            />
            Show past runs ({executedVisits.length} knocks)
          </button>
        </div>
      )}
      {isLoadingAddresses ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
          Finding houses in area...
        </div>
      ) : plannedKnocks.length > 0 ? (
        <>
          <PlannedKnockList
                      knocks={plannedKnocks}
                      onClear={() => { setPlannedKnocks([]); setSelectedKnockId(null); }}
                      onReorder={setPlannedKnocks}
                      selectedKnockId={selectedKnockId}
                      onSelectKnock={(id) => setSelectedKnockId(id === selectedKnockId ? null : id)}
                      onDeleteKnock={handleDeleteKnock}
                      onUpdateNotes={handleUpdateKnockNotes}
                    />
          {/* Save route form */}
          <div className="border-t border-zinc-800 p-4 space-y-3">
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Route name..."
              className="w-full px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleSaveRoute}
              disabled={!routeName.trim() || isSavingRoute}
              className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingRoute ? 'Saving...' : 'Save Route'}
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm px-6 text-center">
          Draw an area on the map to find houses for your route
        </div>
      )}
    </>
  ) : (
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
        resultTags={resultTags}
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
        <div className="flex-1 relative flex flex-col">
          {activeTab === 'plan' ? (
            <DrawingMap
              onPolygonComplete={handlePolygonComplete}
              onCancel={handleCancelPlan}
              onClearAll={handleClearAllPlan}
              onDirectionSet={handleDirectionSet}
              plannedKnocks={plannedKnocks}
              selectedKnockId={selectedKnockId}
              onSelectKnock={handleSelectKnock}
              executedVisits={executedVisits}
              showExecuted={showExecutedInPlan}
            />
          ) : (
            <>
              {showMap && (
                <div className="flex-1 relative">
                  <DashboardMap
                    visits={mapVisits}
                    sessionColorMap={sessionColorMap}
                    selectedVisitId={activeTab === 'knocks' ? selectedVisitId : null}
                    onSelectVisit={(id) => {
                      if (activeTab === 'knocks') setSelectedVisitId(id);
                    }}
                    plannedKnocks={showPlanned && !(activeTab === 'runs' && selectedRunId) ? plannedVisits : []}
                    focusKey={activeTab === 'runs' ? selectedRunId : selectedSessionId}
                  />
                </div>
              )}
              {showMap && showAnalytics && (
                <div className="border-t border-zinc-700" />
              )}
              {showAnalytics && (
                <div className="flex-1">
                  <AnalyticsPanel visits={mapVisits} resultTags={resultTags} />
                </div>
              )}
              <button
                onClick={activeTab === 'knocks' ? handleAddVisit : handleAddRun}
                className="absolute top-4 right-4 z-[1000] flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg shadow-lg hover:bg-blue-500 transition-colors"
              >
                <Plus size={16} />
                {activeTab === 'knocks' ? 'Add Knock' : 'Add Run'}
              </button>
              {/* Planned route visibility toggle */}
              {plannedVisits.length > 0 && (
                <button
                  onClick={() => setShowPlanned((v) => !v)}
                  className={`absolute top-4 left-14 z-[1000] flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg shadow-lg transition-colors ${
                    showPlanned
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700'
                  }`}
                  title={showPlanned ? 'Hide planned routes' : 'Show planned routes'}
                >
                  <div className="w-2.5 h-2.5 rounded-sm border border-zinc-500" style={{ backgroundColor: showPlanned ? '#71717a' : 'transparent' }} />
                  Planned
                </button>
              )}
              {/* Map/Analytics toggle buttons */}
              <div className="absolute bottom-4 right-4 z-[1000] flex gap-2">
                <button
                  onClick={toggleMap}
                  className={`px-3 py-2 text-sm font-medium rounded-lg shadow-lg transition-colors flex items-center gap-1.5 ${
                    showMap
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <MapIcon size={16} />
                  Map
                </button>
                <button
                  onClick={toggleAnalytics}
                  className={`px-3 py-2 text-sm font-medium rounded-lg shadow-lg transition-colors flex items-center gap-1.5 ${
                    showAnalytics
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <BarChart3 size={16} />
                  Analytics
                </button>
              </div>
            </>
          )}
        </div>
        <div className="w-[400px] border-l border-zinc-800 flex flex-col overflow-hidden">
          {tabBar}
          {sidebarContent}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        {tabBar}
        {activeTab === 'plan' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative">
              <DrawingMap
                onPolygonComplete={handlePolygonComplete}
                onCancel={handleCancelPlan}
              onClearAll={handleClearAllPlan}
              onDirectionSet={handleDirectionSet}
                plannedKnocks={plannedKnocks}
                selectedKnockId={selectedKnockId}
                onSelectKnock={handleSelectKnock}
                executedVisits={executedVisits}
                showExecuted={showExecutedInPlan}
              />
            </div>
            {(isLoadingAddresses || plannedKnocks.length > 0) && (
              <div className="border-t border-zinc-700 bg-zinc-900 max-h-[40vh] overflow-y-auto">
                {isLoadingAddresses ? (
                  <div className="flex items-center justify-center py-6 text-zinc-400 text-sm">
                    Finding houses in area...
                  </div>
                ) : (
                  <>
                    <PlannedKnockList
                      knocks={plannedKnocks}
                      onClear={() => { setPlannedKnocks([]); setSelectedKnockId(null); }}
                      onReorder={setPlannedKnocks}
                      selectedKnockId={selectedKnockId}
                      onSelectKnock={(id) => setSelectedKnockId(id === selectedKnockId ? null : id)}
                      onDeleteKnock={handleDeleteKnock}
                      onUpdateNotes={handleUpdateKnockNotes}
                    />
                    <div className="border-t border-zinc-800 p-3 space-y-2">
                      <input
                        type="text"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder="Route name..."
                        className="w-full px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={handleSaveRoute}
                        disabled={!routeName.trim() || isSavingRoute}
                        className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSavingRoute ? 'Saving...' : 'Save Route'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'knocks' ? (
          <>
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
            <VisitList
              visits={filteredVisits}
              sessionColorMap={sessionColorMap}
              selectedVisitId={selectedVisitId}
              onSelectVisit={setSelectedVisitId}
              resultTags={resultTags}
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
        ) : (
          <>
            <div className="flex items-center justify-end px-2 py-1">
              <button
                onClick={handleAddRun}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg"
              >
                <Plus size={16} />
                Add Run
              </button>
            </div>
            <RunsList
              sessions={sessions}
              visits={visits}
              sessionColorMap={sessionColorMap}
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
              onReorder={handleReorderRun}
              onChangeColor={handleChangeRunColor}
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
                onChangeColor={handleChangeRunColor}
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
  onChangeColor,
}: {
  session: Session;
  visits: Visit[];
  sessionColor: string;
  onViewKnocks: (id: string) => void;
  onEdit: (id: string, data: { label: string; notes: string }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onChangeColor?: (id: string, color: string) => void;
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
            onChangeColor={onChangeColor}
          />
        </div>
      </div>
    </>
  );
}
