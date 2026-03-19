# Phase 3: Route Data & Area Selection - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

User can draw lines and polygons on the dashboard map to define a canvassing area, and the app populates house addresses within/near the drawn geometry as planned knocks. Backed by a data model that unifies planned and executed routes via the existing sessions/visits tables. Auto-sorting, reordering, and route execution are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Drawing interaction
- "Make selection" button activates a pen tool on the map
- User clicks to place points; each click adds a visible dot
- A live preview line is drawn between the last placed point and the cursor so the user can visualize the next segment before clicking
- Points are connected by straight lines automatically as they're placed
- Pressing Escape drops the pen tool (exits drawing mode)
- User can click existing points to delete them
- User can re-activate the pen tool and click on an existing point to resume drawing from that point
- Points can be joined to close a polygon

### Address population
- After drawing, user hits "Create Run Route" to trigger address population
- App selects every house within a configurable distance from any point on the drawn line, OR within that distance from any point inside a closed polygon area
- Distance threshold is tweakable (will determine a sensible default and allow adjustment later)
- Need to research a method for determining houses in an area or near a line — should be simple and elegant, not hacky
- This is a key research task: find an API or data source that can return house addresses within a geographic boundary

### Planned knock markers
- Planned knocks display as gray boxes on the map (not colorful like executed visits)
- Dashboard map has toggles to show/hide planned routes and executed routes independently

### Mode & navigation
- Route planning lives as a tab in the dashboard (alongside existing views)
- No separate page or modal — integrated into the dashboard experience

### Claude's Discretion
- Exact drawing library choice (leaflet-draw, leaflet-geoman, or custom)
- Default distance threshold for address selection
- Toggle UI design for planned vs executed route visibility
- Tab placement and naming within dashboard

</decisions>

<specifics>
## Specific Ideas

- The pen tool interaction should feel like a simple drawing tool: click to place points, lines connect automatically, live preview shows where the next line will go
- "Create Run Route" is the action that commits the selection and triggers address population
- The distance-from-line/polygon approach means even a single line (not just closed polygons) can select nearby houses — useful for "just this street" scenarios

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DashboardMap.tsx`: Leaflet + react-leaflet map with marker rendering, FitBounds, and ResizeObserver setup — new drawing tools layer on top of this
- `geocoding.ts`: Nominatim forward search and reverse geocoding — reverse geocode can populate addresses for discovered house locations
- `types.ts`: Session and Visit types — Visit already has nullable audio/time fields suitable for planned knocks
- `sessions.ts`: Session CRUD actions — need "started" flag addition
- `TabNav.tsx`: Shared tab navigation component — planning tab integrates here

### Established Patterns
- Server actions in `src/actions/` for all database operations
- Supabase client via `createClient()` with auth checks
- Square DivIcon markers with color/opacity/border variants
- Session-based color coding via `sessionColorMap`

### Integration Points
- Dashboard shell manages tab state and renders map — drawing mode integrates into the map component
- Session filter already controls which visits display — extend to support planned/executed toggle
- Visit type needs no structural changes for planned knocks (nullable fields already exist)
- Sessions table needs `started` boolean column (DATA-03)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-route-data-area-selection*
*Context gathered: 2026-03-18*
