---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/dashboard/AnalyticsPanel.tsx
  - src/components/dashboard/DashboardShell.tsx
autonomous: true
requirements: [ANALYTICS-VIEW]

must_haves:
  truths:
    - "Two toggle buttons (Show Map / Show Analytics) appear in bottom-right of map area, green like Start Canvassing"
    - "At least one toggle must be active at all times -- toggling off the last active one re-enables the other"
    - "When both active, map takes top half, analytics takes bottom half"
    - "Bar chart shows count of each result type for currently visible visits"
    - "Chart updates with smooth CSS transitions when run selection changes"
  artifacts:
    - path: "src/components/dashboard/AnalyticsPanel.tsx"
      provides: "Bar chart component for knock result analytics"
    - path: "src/components/dashboard/DashboardShell.tsx"
      provides: "Toggle state, split layout, analytics integration"
  key_links:
    - from: "DashboardShell.tsx"
      to: "AnalyticsPanel.tsx"
      via: "passes mapVisits and resultTags as props"
---

<objective>
Add an analytics view to the dashboard with toggle buttons to show/hide map and analytics panels. Analytics displays a bar chart of knock result counts computed in real time from selected runs.

Purpose: Give the user at-a-glance insight into canvassing performance across selected runs.
Output: AnalyticsPanel component + toggle integration in DashboardShell.
</objective>

<execution_context>
@/Users/caldayham/.claude/get-shit-done/workflows/execute-plan.md
@/Users/caldayham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/dashboard/DashboardShell.tsx
@src/lib/types.ts
</context>

<interfaces>
<!-- Key types the executor needs -->

From src/lib/types.ts:
```typescript
export type Visit = {
  id: string;
  session_id: string;
  result: string | null;
  // ... other fields
};

export type ResultTag = {
  name: string;
  color: string;
};

export const DEFAULT_RESULT_TAGS: ResultTag[] = [
  { name: 'Interested', color: '#16a34a' },
  { name: 'Not Interested', color: '#71717a' },
  { name: 'Not Home', color: '#ca8a04' },
  { name: 'Booked Consult', color: '#2563eb' },
  { name: 'Come Back Later', color: '#f97316' },
];
```

From DashboardShell.tsx (relevant existing state):
- `mapVisits: Visit[]` -- already computed, reflects currently visible visits based on tab + run selection
- `resultTags: ResultTag[]` -- passed as prop from page
- Desktop map area: `<div className="flex-1 relative">` (line 589)
- The "Add Knock" / "Add Run" button is `absolute top-4 right-4 z-[1000]` green button area
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Create AnalyticsPanel component</name>
  <files>src/components/dashboard/AnalyticsPanel.tsx</files>
  <action>
Create a new component `AnalyticsPanel` that renders a horizontal bar chart of knock result counts.

Props interface:
```typescript
interface AnalyticsPanelProps {
  visits: Visit[];
  resultTags: ResultTag[];
}
```

Implementation:
1. Use `useMemo` to compute result counts from `visits` array. Group by `visit.result`, count each. Include a "No Result" bucket for visits where `result` is null.
2. Find the max count for scaling bar widths (percentage of max).
3. Render each result as a horizontal bar:
   - Label on the left (result name), count on the right
   - Bar width = `(count / maxCount) * 100%`
   - Bar color from matching `resultTags` entry (match by name). Fall back to `#6b7280` for unknown/null results.
   - Use `transition-all duration-500 ease-out` on the bar width so changes animate smoothly
4. Show total knocks count at the top as a header: "Total Knocks: {N}"
5. Sort bars by count descending so highest result type is on top
6. Style: dark background (`bg-zinc-900`), white text, full height with padding. Scrollable if many result types.
7. If no visits, show centered "No knock data for selected runs" message in `text-zinc-500`.

Do NOT install any charting library -- use pure CSS bars with Tailwind classes. This keeps the bundle small and gives us full control over the dark theme styling.
  </action>
  <verify>
    <automated>cd /Users/caldayham/Desktop/cf.design/simple-conversation-location-tracker && npx tsc --noEmit src/components/dashboard/AnalyticsPanel.tsx 2>&1 | head -20</automated>
  </verify>
  <done>AnalyticsPanel renders horizontal bar chart from visit data with CSS transition animations, typed correctly, no external dependencies.</done>
</task>

<task type="auto">
  <name>Task 2: Add toggle buttons and split layout to DashboardShell</name>
  <files>src/components/dashboard/DashboardShell.tsx</files>
  <action>
Integrate AnalyticsPanel into DashboardShell with toggle buttons and split-view layout.

**State:**
Add two boolean states (persisted in localStorage like existing tab state):
```typescript
const [showMap, setShowMap] = useState(true);
const [showAnalytics, setShowAnalytics] = useState(false);
```
Hydrate from localStorage in useEffect (keys: `dashboard-show-map`, `dashboard-show-analytics`).

**Toggle logic:**
Create toggle handlers that enforce "at least one must be active":
- `toggleMap`: if showMap is true and showAnalytics is false, do nothing (cannot turn off last one). Otherwise toggle showMap.
- `toggleAnalytics`: same logic mirrored.

**Toggle buttons:**
Place two toggle buttons in the bottom-right of the map area (only on desktop layout, only when activeTab is NOT 'plan'). Position: `absolute bottom-4 right-4 z-[1000]`. Use a flex row with gap-2:
- "Map" button with MapIcon from lucide-react (already imported)
- "Analytics" button with BarChart3 icon from lucide-react (add import)
- Active state: `bg-green-600 text-white` (green like Start Canvassing)
- Inactive state: `bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700`
- Both buttons: `px-3 py-2 text-sm font-medium rounded-lg shadow-lg transition-colors flex items-center gap-1.5`

**Desktop split layout (lines ~589-637):**
Replace the current `<div className="flex-1 relative">` map container. When activeTab is NOT 'plan':
- If showMap && !showAnalytics: full map (current behavior, 100% height)
- If !showMap && showAnalytics: full analytics panel (100% height)
- If showMap && showAnalytics: flex-col, map top half (`flex-1`), analytics bottom half (`flex-1`), with a thin `border-t border-zinc-700` divider

The toggle buttons should render inside the map/analytics container so they float over whatever is visible. Keep the existing "Add Knock"/"Add Run" button in the top-right -- the new toggles go bottom-right so they don't conflict.

**Import AnalyticsPanel:**
```typescript
import { AnalyticsPanel } from './AnalyticsPanel';
```

**Pass props to AnalyticsPanel:**
```typescript
<AnalyticsPanel visits={mapVisits} resultTags={resultTags} />
```
This automatically makes analytics reactive to run selection since `mapVisits` already filters by selected run.

**Mobile layout:** For now, do NOT add analytics to mobile. The toggle buttons and split view are desktop-only. Mobile can be added later if needed.
  </action>
  <verify>
    <automated>cd /Users/caldayham/Desktop/cf.design/simple-conversation-location-tracker && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Toggle buttons appear bottom-right of map on desktop. Toggling analytics shows bar chart in split view. At least one panel always visible. Chart reacts to run selection changes with smooth bar width transitions.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` completes successfully
3. Visual check: toggle buttons appear bottom-right, green when active, both panels split correctly
</verification>

<success_criteria>
- Two green toggle buttons (Map / Analytics) in bottom-right of desktop map area
- Cannot deactivate both -- at least one always on
- Split view shows map top / analytics bottom when both active
- Bar chart shows result counts from currently visible visits
- Bars animate smoothly (500ms CSS transition) when switching runs
- No new npm dependencies added
</success_criteria>

<output>
After completion, create `.planning/quick/2-add-analytics-view-with-real-time-bar-ch/2-SUMMARY.md`
</output>
