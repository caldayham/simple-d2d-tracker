---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/009_practice_nodes.sql
  - src/lib/types.ts
  - src/actions/practice.ts
  - src/components/dashboard/PracticeCanvas.tsx
  - src/components/dashboard/DashboardShell.tsx
autonomous: true
requirements: [PRACTICE-01]
must_haves:
  truths:
    - "User can switch to a Practice tab in the dashboard"
    - "User can click background to create a text box and immediately type content"
    - "User can drag boxes to reposition them on the canvas"
    - "User can resize boxes via corner drag handles"
    - "User can enter Connect mode and link two boxes via edge connection points"
    - "Boxes and connections persist across page refresh via Supabase"
  artifacts:
    - path: "supabase/migrations/009_practice_nodes.sql"
      provides: "practice_nodes and practice_connections tables"
      contains: "CREATE TABLE practice_nodes"
    - path: "src/actions/practice.ts"
      provides: "CRUD server actions for nodes and connections"
      exports: ["getPracticeData", "upsertNode", "deleteNode", "createConnection", "deleteConnection"]
    - path: "src/components/dashboard/PracticeCanvas.tsx"
      provides: "Interactive canvas with draggable/resizable text boxes and connections"
      min_lines: 200
    - path: "src/components/dashboard/DashboardShell.tsx"
      provides: "Updated with Practice tab"
      contains: "practice"
  key_links:
    - from: "src/components/dashboard/PracticeCanvas.tsx"
      to: "src/actions/practice.ts"
      via: "server action calls on drag-end, resize-end, text-change, connect"
      pattern: "upsertNode|createConnection|deleteNode"
    - from: "src/components/dashboard/DashboardShell.tsx"
      to: "src/components/dashboard/PracticeCanvas.tsx"
      via: "tab rendering"
      pattern: "PracticeCanvas"
---

<objective>
Add a "Practice" tab to the dashboard with an interactive mind-map / script-builder canvas. Users create draggable, resizable text boxes on a free-form canvas and connect them with lines to build conversation flow graphs. All data persists in Supabase.

Purpose: Give the user a visual tool to plan and practice door-to-door conversation scripts as connected flowcharts.
Output: New Practice tab with full CRUD canvas, Supabase migration, server actions.
</objective>

<execution_context>
@/Users/caldayham/.claude/get-shit-done/workflows/execute-plan.md
@/Users/caldayham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/dashboard/DashboardShell.tsx
@src/components/dashboard/DrawingMap.tsx (tool button style reference)
@src/lib/types.ts
@src/actions/sessions.ts (server action pattern reference)
@src/app/dashboard/page.tsx

<interfaces>
<!-- Existing tab structure in DashboardShell -->
From src/components/dashboard/DashboardShell.tsx:
```typescript
type SidebarTab = 'runs' | 'knocks' | 'plan';
// Will become: type SidebarTab = 'runs' | 'knocks' | 'plan' | 'practice';
```

<!-- Tool button style from DrawingMap (top-right stacked) -->
From src/components/dashboard/DrawingMap.tsx:
```typescript
// Tool button pattern:
<div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
  <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
    Tool Name
    <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-blue-700 rounded">A</kbd>
  </button>
</div>
```

<!-- Server action pattern -->
From src/actions/sessions.ts:
```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
// Pattern: createClient() -> auth.getUser() -> query -> throw on error
```

<!-- Dashboard page data fetching -->
From src/app/dashboard/page.tsx:
```typescript
const [{ sessions, visits }, resultTags] = await Promise.all([
  getDashboardData(),
  getResultTags(),
]);
// Practice data will be fetched here too and passed as prop
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Supabase migration, types, and server actions for practice nodes/connections</name>
  <files>supabase/migrations/009_practice_nodes.sql, src/lib/types.ts, src/actions/practice.ts, src/app/dashboard/page.tsx</files>
  <action>
1. Create migration `supabase/migrations/009_practice_nodes.sql`:
   - `practice_nodes` table: `id uuid PK default gen_random_uuid()`, `user_id uuid NOT NULL references auth.users`, `content text NOT NULL default ''`, `x double precision NOT NULL default 100`, `y double precision NOT NULL default 100`, `width double precision NOT NULL default 200`, `height double precision NOT NULL default 120`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`. Add RLS policies: select/insert/update/delete where `auth.uid() = user_id`. Enable RLS.
   - `practice_connections` table: `id uuid PK default gen_random_uuid()`, `user_id uuid NOT NULL references auth.users`, `from_node_id uuid NOT NULL references practice_nodes(id) on delete cascade`, `to_node_id uuid NOT NULL references practice_nodes(id) on delete cascade`, `from_anchor text NOT NULL` (one of 'top','right','bottom','left'), `to_anchor text NOT NULL`, `created_at timestamptz default now()`. Add RLS policies same pattern. Enable RLS. Add CHECK constraint: `from_node_id != to_node_id`.

2. Add types to `src/lib/types.ts`:
   ```typescript
   export type PracticeNode = {
     id: string;
     user_id: string;
     content: string;
     x: number;
     y: number;
     width: number;
     height: number;
     created_at: string;
     updated_at: string;
   };

   export type PracticeConnection = {
     id: string;
     user_id: string;
     from_node_id: string;
     to_node_id: string;
     from_anchor: 'top' | 'right' | 'bottom' | 'left';
     to_anchor: 'top' | 'right' | 'bottom' | 'left';
     created_at: string;
   };
   ```

3. Create `src/actions/practice.ts` following the same pattern as `sessions.ts`:
   - `getPracticeData()`: returns `{ nodes: PracticeNode[], connections: PracticeConnection[] }`. Fetches both tables for current user.
   - `upsertNode(node: { id?: string; content: string; x: number; y: number; width: number; height: number })`: If `id` provided, update existing node (set updated_at to now). If no `id`, insert new node. Returns the node.
   - `deleteNode(id: string)`: Deletes node (connections cascade). Returns void.
   - `createConnection(data: { from_node_id: string; to_node_id: string; from_anchor: string; to_anchor: string })`: Insert connection. Returns the connection.
   - `deleteConnection(id: string)`: Deletes connection. Returns void.

4. Update `src/app/dashboard/page.tsx`: Import `getPracticeData`, fetch in parallel with existing data, pass `practiceNodes` and `practiceConnections` as props to DashboardShell.
  </action>
  <verify>
    <automated>cd /Users/caldayham/Desktop/cf.design/simple-conversation-location-tracker && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Migration file exists with both tables + RLS. Types added. Server actions compile. Dashboard page passes practice data to shell.</done>
</task>

<task type="auto">
  <name>Task 2: PracticeCanvas component with draggable/resizable text boxes and connections</name>
  <files>src/components/dashboard/PracticeCanvas.tsx</files>
  <action>
Create `src/components/dashboard/PracticeCanvas.tsx` as a 'use client' component.

**Props:** `{ nodes: PracticeNode[]; connections: PracticeConnection[] }`

**State:** Local state mirrors props on mount, mutations call server actions then update local state optimistically.

**Canvas layout:** Full-size div with `relative overflow-auto bg-zinc-950` filling the parent. The canvas itself is a large inner div (e.g. 4000x4000) that scrolls.

**Tool buttons (top-right, stacked, matching DrawingMap style):**
- "Add Step" button: `bg-blue-600 text-white hover:bg-blue-500 rounded-lg shadow-lg px-3 py-2 text-sm` with kbd showing `A`. Active state not needed (it's a one-shot action).
- "Connect" button: Same style, kbd `C`. When active, add `ring-2 ring-blue-400 bg-blue-800` (same as DrawingMap active tool pattern).
- Tool container: `absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end`

**Add Step mode (A key or button click):**
- Sets a flag. Next click on the canvas background (not on a node) creates a new node at click position.
- Calls `upsertNode` server action with no id (creates new), then adds to local state with returned node.
- The new node's textarea immediately gets focus via ref.
- After placing, mode resets (one-shot, not toggle).

**Node rendering:** Each node is an absolutely positioned div at `(node.x, node.y)` with `width: node.width, height: node.height`. Style: `bg-zinc-800 border border-zinc-600 rounded-xl shadow-lg` with a textarea inside that auto-saves on blur. Text is white, bg transparent, no border on textarea.

**Dragging nodes:** On mousedown on the node (but NOT on textarea or resize handle), track mouse movement and update node x/y. On mouseup, call `upsertNode` with updated position. Use `e.preventDefault()` to prevent text selection during drag. Detect drag vs click by checking if mouse moved > 3px.

**Resizing nodes:** Each node has a small drag handle in the bottom-right corner (a 12x12 area with a subtle diagonal lines icon or just a `cursor-se-resize` area). On mousedown on the handle, track mouse and update width/height (min 120x80). On mouseup, call `upsertNode` with updated size.

**Deleting nodes:** When a node is focused/selected, show a small X button in the top-right corner of the node. Clicking it calls `deleteNode` server action and removes from local state. Connections are cascade-deleted in DB; also remove them from local connections state.

**Connect mode (C key or button click):**
- Toggle mode. When active, show 4 connection anchor dots on every node: centered on each edge (top, right, bottom, left). Dots: 10px diameter circles, `bg-blue-500 border-2 border-blue-300`, with hover scale effect.
- First click on an anchor sets `connectingFrom = { nodeId, anchor }`.
- Second click on a different node's anchor creates the connection: call `createConnection` server action, add to local state. Reset connecting state.
- If user clicks same node's anchor, reset (cannot self-connect).
- Show a temporary line from the first anchor to mouse cursor while connecting (use a state-tracked SVG line).
- Clicking canvas background or pressing Escape cancels in-progress connection.

**Rendering connections:** Use an SVG overlay (absolute positioned, same size as canvas, pointer-events: none). For each connection, draw a line (or simple bezier curve) from the anchor point of from_node to the anchor point of to_node. Anchor positions calculated from node x/y/width/height:
  - top: (x + width/2, y)
  - right: (x + width, y + height/2)
  - bottom: (x + width/2, y + height)
  - left: (x, y + height/2)
Line style: `stroke="#71717a" strokeWidth="2"`. On hover over a connection line (use a wider invisible stroke for hit area), show a delete button (small X) at the midpoint.

**Keyboard shortcuts:** Listen for keydown (only when not in textarea):
- `A`: trigger Add Step (same as button)
- `C`: toggle Connect mode (same as button)
- `Escape`: cancel connect-in-progress, deselect node
- `Delete`/`Backspace`: delete selected node (when not in textarea)

**Dark mode:** Use zinc-800/900/950 backgrounds, zinc-600 borders, white text — matching the existing app theme exactly.

**Important implementation notes:**
- Do NOT use any external drag/canvas library — use native mouse events (consistent with existing DrawingMap and PlannedKnockList patterns in this codebase).
- Debounce server action calls for position/size updates: only call on mouseup (end of drag/resize), not during movement.
- Text content saves on blur (not on every keystroke).
- Use `useCallback` for all handlers passed to child elements to prevent unnecessary re-renders.
  </action>
  <verify>
    <automated>cd /Users/caldayham/Desktop/cf.design/simple-conversation-location-tracker && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>PracticeCanvas renders nodes as draggable/resizable text boxes with connection lines. Add Step and Connect tools work with keyboard shortcuts. All mutations call server actions.</done>
</task>

<task type="auto">
  <name>Task 3: Wire Practice tab into DashboardShell with tab button and layout</name>
  <files>src/components/dashboard/DashboardShell.tsx</files>
  <action>
Update DashboardShell to add the Practice tab:

1. **Update SidebarTab type:** `type SidebarTab = 'runs' | 'knocks' | 'plan' | 'practice';`

2. **Update props interface:** Add `practiceNodes: PracticeNode[]` and `practiceConnections: PracticeConnection[]` to DashboardShellProps. Import types from `@/lib/types`.

3. **Update localStorage hydration:** Add `'practice'` to the valid tab check on line 56: `if (saved === 'runs' || saved === 'knocks' || saved === 'plan' || saved === 'practice')`.

4. **Add tab button** in the tabBar JSX (after the Plan button, before the closing `</div>`):
   ```tsx
   <button
     onClick={() => setActiveTab('practice')}
     className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
       activeTab === 'practice'
         ? 'text-white border-b-2 border-blue-500'
         : 'text-zinc-400 hover:text-zinc-300'
     }`}
   >
     <Brain size={15} />
     Practice
   </button>
   ```
   Import `Brain` from `lucide-react` (add to existing import).

5. **Desktop layout:** When `activeTab === 'practice'`, render the PracticeCanvas full-width in the main content area (same pattern as `plan` tab rendering DrawingMap — it takes the full left area). The sidebar should show nothing meaningful for practice (or hide the sidebar). Best approach: when practice is active, render PracticeCanvas as the FULL width of the desktop layout (no sidebar split) since the canvas needs maximum space. Wrap it:
   ```tsx
   {activeTab === 'practice' ? (
     <div className="flex-1 relative">
       <PracticeCanvas nodes={practiceNodes} connections={practiceConnections} />
     </div>
   ) : (
     // existing desktop layout with sidebar
   )}
   ```
   But keep the tab bar visible. For desktop, restructure so tab bar is always at top of sidebar, and when practice is active, hide the sidebar content but keep tabs. Actually, simplest: for practice tab, use full width (hide sidebar entirely, put tab bar across the top). OR: keep sidebar with tabs but show empty/minimal content.

   **Decision: Keep sidebar with tab bar visible (for navigation), but show a minimal message in sidebar ("Use the canvas to build your script") and give the main area to PracticeCanvas.** This is consistent with how Plan tab works (DrawingMap gets main area, sidebar has plan-specific content).

6. **Mobile layout:** When `activeTab === 'practice'`, render PracticeCanvas filling the remaining space below the tab bar. Same as plan tab pattern.

7. **Import PracticeCanvas:** Use `dynamic` import with `ssr: false` (canvas uses mouse events and refs that need the browser):
   ```tsx
   const PracticeCanvas = dynamic(() => import('./PracticeCanvas'), {
     ssr: false,
     loading: () => <div className="flex-1 bg-zinc-900 animate-pulse" />,
   });
   ```
   Make sure PracticeCanvas has a default export (add `export default PracticeCanvas` at bottom of that file in Task 2).
  </action>
  <verify>
    <automated>cd /Users/caldayham/Desktop/cf.design/simple-conversation-location-tracker && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Practice tab appears in tab bar with Brain icon. Clicking it shows the PracticeCanvas. Tab persists in localStorage. Desktop and mobile layouts work.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Run the migration against Supabase: `npx supabase db push` (or apply manually)
3. Navigate to dashboard, see 4 tabs: Runs, Knocks, Plan, Practice
4. Click Practice tab, click Add Step (or press A), click canvas -> text box appears
5. Type in the box, click away -> content saves
6. Drag box -> position updates, resize corner -> size updates
7. Press C, click anchor on box 1, click anchor on box 2 -> line appears
8. Refresh page -> all boxes and connections still there
</verification>

<success_criteria>
- Practice tab visible and functional in dashboard
- Text boxes are draggable, resizable, and editable
- Connections drawn between boxes via anchor points
- All data persists in Supabase across page refreshes
- Dark theme matches rest of application
- Keyboard shortcuts A (add), C (connect), Escape (cancel), Delete (remove) work
</success_criteria>

<output>
After completion, create `.planning/quick/3-add-practice-tab-with-mind-map-script-bu/3-SUMMARY.md`
</output>
