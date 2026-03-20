'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { PracticeNode, PracticeConnection } from '@/lib/types';
import { upsertNode, deleteNode, createConnection, deleteConnection } from '@/actions/practice';

type Anchor = 'top' | 'right' | 'bottom' | 'left';

interface ConnectingState {
  nodeId: string;
  anchor: Anchor;
}

function getAnchorPos(node: PracticeNode, anchor: Anchor): { x: number; y: number } {
  switch (anchor) {
    case 'top':
      return { x: node.x + node.width / 2, y: node.y };
    case 'right':
      return { x: node.x + node.width, y: node.y + node.height / 2 };
    case 'bottom':
      return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: node.y + node.height / 2 };
  }
}

interface PracticeCanvasProps {
  nodes: PracticeNode[];
  connections: PracticeConnection[];
}

export default function PracticeCanvas({ nodes: initialNodes, connections: initialConnections }: PracticeCanvasProps) {
  const [nodes, setNodes] = useState<PracticeNode[]>(initialNodes);
  const [connections, setConnections] = useState<PracticeConnection[]>(initialConnections);
  const [addMode, setAddMode] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<ConnectingState | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    nodeId: string;
    startX: number;
    startY: number;
    nodeStartX: number;
    nodeStartY: number;
    moved: boolean;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    nodeId: string;
    startX: number;
    startY: number;
    nodeStartW: number;
    nodeStartH: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const newNodeRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingFocusId = useRef<string | null>(null);

  const CANVAS_SIZE = 4000;

  // Focus newly created node textarea
  useEffect(() => {
    if (pendingFocusId.current) {
      const id = pendingFocusId.current;
      pendingFocusId.current = null;
      // Small delay to let React render the new node
      requestAnimationFrame(() => {
        if (newNodeRef.current) {
          newNodeRef.current.focus();
          newNodeRef.current = null;
        }
      });
    }
  }, [nodes]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setAddMode(true);
        setConnectMode(false);
        setConnectingFrom(null);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setConnectMode((prev) => !prev);
        setAddMode(false);
        setConnectingFrom(null);
      } else if (e.key === 'Escape') {
        setConnectingFrom(null);
        setSelectedNodeId(null);
        setAddMode(false);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        handleDeleteNode(selectedNodeId);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent) => {
      // Only handle clicks directly on the canvas background
      if (e.target !== e.currentTarget) return;

      if (connectMode && connectingFrom) {
        // Cancel connecting
        setConnectingFrom(null);
        return;
      }

      if (addMode) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const scrollLeft = (e.currentTarget as HTMLElement).parentElement?.scrollLeft ?? 0;
        const scrollTop = (e.currentTarget as HTMLElement).parentElement?.scrollTop ?? 0;
        const x = e.clientX - rect.left + scrollLeft;
        const y = e.clientY - rect.top + scrollTop;

        try {
          const node = await upsertNode({
            content: '',
            x: x - 100,
            y: y - 60,
            width: 200,
            height: 120,
          });
          pendingFocusId.current = node.id;
          setNodes((prev) => [...prev, node]);
          setSelectedNodeId(node.id);
        } catch (err) {
          console.error('Failed to create node:', err);
        }
        setAddMode(false);
        return;
      }

      // Click on background deselects
      setSelectedNodeId(null);
    },
    [addMode, connectMode, connectingFrom]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (connectingFrom) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const scrollLeft = (e.currentTarget as HTMLElement).parentElement?.scrollLeft ?? 0;
        const scrollTop = (e.currentTarget as HTMLElement).parentElement?.scrollTop ?? 0;
        setMousePos({
          x: e.clientX - rect.left + scrollLeft,
          y: e.clientY - rect.top + scrollTop,
        });
      }
    },
    [connectingFrom]
  );

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA') return;
      if ((e.target as HTMLElement).dataset.resize) return;
      if ((e.target as HTMLElement).dataset.delete) return;
      if ((e.target as HTMLElement).dataset.anchor) return;

      e.preventDefault();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      setDragState({
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        nodeStartX: node.x,
        nodeStartY: node.y,
        moved: false,
      });
      setSelectedNodeId(nodeId);
    },
    [nodes]
  );

  // Global mouse move/up for drag
  useEffect(() => {
    if (!dragState) return;

    function onMouseMove(e: MouseEvent) {
      setDragState((prev) => {
        if (!prev) return null;
        const dx = e.clientX - prev.startX;
        const dy = e.clientY - prev.startY;
        const moved = prev.moved || Math.abs(dx) > 3 || Math.abs(dy) > 3;
        if (moved) {
          setNodes((prevNodes) =>
            prevNodes.map((n) =>
              n.id === prev.nodeId
                ? { ...n, x: prev.nodeStartX + dx, y: prev.nodeStartY + dy }
                : n
            )
          );
        }
        return { ...prev, moved };
      });
    }

    async function onMouseUp() {
      const ds = dragState;
      setDragState(null);
      if (ds?.moved) {
        const node = nodes.find((n) => n.id === ds.nodeId);
        if (node) {
          try {
            await upsertNode({
              id: node.id,
              content: node.content,
              x: node.x,
              y: node.y,
              width: node.width,
              height: node.height,
            });
          } catch (err) {
            console.error('Failed to save position:', err);
          }
        }
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragState, nodes]);

  // Global mouse move/up for resize
  useEffect(() => {
    if (!resizeState) return;

    function onMouseMove(e: MouseEvent) {
      setResizeState((prev) => {
        if (!prev) return null;
        const dx = e.clientX - prev.startX;
        const dy = e.clientY - prev.startY;
        const newW = Math.max(120, prev.nodeStartW + dx);
        const newH = Math.max(80, prev.nodeStartH + dy);
        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === prev.nodeId ? { ...n, width: newW, height: newH } : n
          )
        );
        return prev;
      });
    }

    async function onMouseUp() {
      const rs = resizeState;
      setResizeState(null);
      if (rs) {
        const node = nodes.find((n) => n.id === rs.nodeId);
        if (node) {
          try {
            await upsertNode({
              id: node.id,
              content: node.content,
              x: node.x,
              y: node.y,
              width: node.width,
              height: node.height,
            });
          } catch (err) {
            console.error('Failed to save size:', err);
          }
        }
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [resizeState, nodes]);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      setResizeState({
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        nodeStartW: node.width,
        nodeStartH: node.height,
      });
    },
    [nodes]
  );

  const handleTextBlur = useCallback(
    async (nodeId: string, content: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.content === content) return;
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, content } : n)));
      try {
        await upsertNode({
          id: node.id,
          content,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
        });
      } catch (err) {
        console.error('Failed to save content:', err);
      }
    },
    [nodes]
  );

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setConnections((prev) =>
        prev.filter((c) => c.from_node_id !== nodeId && c.to_node_id !== nodeId)
      );
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      try {
        await deleteNode(nodeId);
      } catch (err) {
        console.error('Failed to delete node:', err);
      }
    },
    [selectedNodeId]
  );

  const handleAnchorClick = useCallback(
    async (nodeId: string, anchor: Anchor) => {
      if (!connectMode) return;

      if (!connectingFrom) {
        setConnectingFrom({ nodeId, anchor });
        return;
      }

      // Same node -- cancel
      if (connectingFrom.nodeId === nodeId) {
        setConnectingFrom(null);
        return;
      }

      // Create connection
      try {
        const conn = await createConnection({
          from_node_id: connectingFrom.nodeId,
          to_node_id: nodeId,
          from_anchor: connectingFrom.anchor,
          to_anchor: anchor,
        });
        setConnections((prev) => [...prev, conn]);
      } catch (err) {
        console.error('Failed to create connection:', err);
      }
      setConnectingFrom(null);
    },
    [connectMode, connectingFrom]
  );

  const handleDeleteConnection = useCallback(async (connId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
    try {
      await deleteConnection(connId);
    } catch (err) {
      console.error('Failed to delete connection:', err);
    }
  }, []);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="absolute inset-0 bg-zinc-950 overflow-auto">
      {/* Tool buttons */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
        <button
          onClick={() => {
            setAddMode(true);
            setConnectMode(false);
            setConnectingFrom(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-lg transition-colors ${
            addMode
              ? 'bg-blue-800 text-white ring-2 ring-blue-400'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          Add Step
          <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 rounded">A</kbd>
        </button>
        <button
          onClick={() => {
            setConnectMode((prev) => !prev);
            setAddMode(false);
            setConnectingFrom(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-lg transition-colors ${
            connectMode
              ? 'bg-blue-800 text-white ring-2 ring-blue-400'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          Connect
          <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 rounded">C</kbd>
        </button>
      </div>

      {/* Add mode hint */}
      {addMode && (
        <div className="absolute top-4 left-4 z-[1000] px-3 py-2 bg-blue-600/80 text-white text-sm rounded-lg shadow-lg">
          Click anywhere on the canvas to place a step
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative"
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          cursor: addMode ? 'crosshair' : 'default',
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
      >
        {/* SVG connections overlay */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
        >
          {connections.map((conn) => {
            const fromNode = nodeMap.get(conn.from_node_id);
            const toNode = nodeMap.get(conn.to_node_id);
            if (!fromNode || !toNode) return null;

            const from = getAnchorPos(fromNode, conn.from_anchor);
            const to = getAnchorPos(toNode, conn.to_anchor);
            const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

            return (
              <g key={conn.id}>
                {/* Invisible wider hit area */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="transparent"
                  strokeWidth={16}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredConnectionId(conn.id)}
                  onMouseLeave={() => setHoveredConnectionId(null)}
                />
                {/* Visible line */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#71717a"
                  strokeWidth={2}
                  style={{ pointerEvents: 'none' }}
                />
                {/* Arrow marker at midpoint direction */}
                <circle
                  cx={mid.x}
                  cy={mid.y}
                  r={4}
                  fill="#71717a"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Delete button on hover */}
                {hoveredConnectionId === conn.id && (
                  <g
                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConnection(conn.id);
                    }}
                  >
                    <circle cx={mid.x} cy={mid.y} r={10} fill="#dc2626" />
                    <line
                      x1={mid.x - 4}
                      y1={mid.y - 4}
                      x2={mid.x + 4}
                      y2={mid.y + 4}
                      stroke="white"
                      strokeWidth={2}
                    />
                    <line
                      x1={mid.x + 4}
                      y1={mid.y - 4}
                      x2={mid.x - 4}
                      y2={mid.y + 4}
                      stroke="white"
                      strokeWidth={2}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Temp connecting line */}
          {connectingFrom && mousePos && (() => {
            const fromNode = nodeMap.get(connectingFrom.nodeId);
            if (!fromNode) return null;
            const from = getAnchorPos(fromNode, connectingFrom.anchor);
            return (
              <line
                x1={from.x}
                y1={from.y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="6 4"
                style={{ pointerEvents: 'none' }}
              />
            );
          })()}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute bg-zinc-800 border rounded-xl shadow-lg select-none ${
              selectedNodeId === node.id ? 'border-blue-500' : 'border-zinc-600'
            }`}
            style={{
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          >
            {/* Delete button */}
            {selectedNodeId === node.id && (
              <button
                data-delete="true"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNode(node.id);
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-500 z-10"
              >
                x
              </button>
            )}

            {/* Textarea */}
            <textarea
              ref={pendingFocusId.current === node.id ? (el) => { newNodeRef.current = el; } : undefined}
              defaultValue={node.content}
              onBlur={(e) => handleTextBlur(node.id, e.target.value)}
              onFocus={() => setSelectedNodeId(node.id)}
              className="w-full h-full bg-transparent text-white text-sm p-3 resize-none focus:outline-none"
              placeholder="Type your script step..."
            />

            {/* Resize handle */}
            <div
              data-resize="true"
              onMouseDown={(e) => handleResizeMouseDown(e, node.id)}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" className="absolute bottom-1 right-1">
                <line x1="10" y1="2" x2="2" y2="10" stroke="#71717a" strokeWidth="1.5" />
                <line x1="10" y1="6" x2="6" y2="10" stroke="#71717a" strokeWidth="1.5" />
                <line x1="10" y1="10" x2="10" y2="10" stroke="#71717a" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Connection anchors (visible in connect mode) */}
            {connectMode && (
              <>
                {(['top', 'right', 'bottom', 'left'] as Anchor[]).map((anchor) => {
                  const pos = {
                    top: { left: '50%', top: '-5px', transform: 'translateX(-50%)' },
                    right: { right: '-5px', top: '50%', transform: 'translateY(-50%)' },
                    bottom: { left: '50%', bottom: '-5px', transform: 'translateX(-50%)' },
                    left: { left: '-5px', top: '50%', transform: 'translateY(-50%)' },
                  }[anchor];

                  const isActive =
                    connectingFrom?.nodeId === node.id &&
                    connectingFrom?.anchor === anchor;

                  return (
                    <div
                      key={anchor}
                      data-anchor="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnchorClick(node.id, anchor);
                      }}
                      className={`absolute w-3 h-3 rounded-full border-2 cursor-pointer transition-transform hover:scale-150 z-10 ${
                        isActive
                          ? 'bg-blue-400 border-white scale-150'
                          : 'bg-blue-500 border-blue-300'
                      }`}
                      style={pos}
                    />
                  );
                })}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
