---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/005_visit_demographics.sql
  - src/lib/types.ts
  - src/actions/visits.ts
  - src/components/recording/ResultPicker.tsx
  - src/components/dashboard/VisitDetail.tsx
  - src/components/dashboard/MobileVisitDetail.tsx
autonomous: true
requirements: [DEMO-01]
must_haves:
  truths:
    - "After recording a knock, user can enter the person's name, select gender (Male/Female/Unknown), and select age range (<30, 30-50, 50-70, >70)"
    - "Name, gender, and age range are saved to the database with the visit"
    - "Dashboard visit detail views display name, gender, and age range when present"
  artifacts:
    - path: "supabase/migrations/005_visit_demographics.sql"
      provides: "name, gender, age_range columns on visits table"
    - path: "src/lib/types.ts"
      provides: "Updated Visit type with name, gender, age_range fields"
    - path: "src/components/recording/ResultPicker.tsx"
      provides: "Demographics input fields in post-recording flow"
  key_links:
    - from: "src/components/recording/ResultPicker.tsx"
      to: "src/actions/visits.ts"
      via: "onSelect callback passes demographics data"
      pattern: "gender|age_range|name"
    - from: "src/actions/visits.ts"
      to: "visits table"
      via: "supabase update includes demographics"
      pattern: "gender|age_range|contact_name"
---

<objective>
Add name, gender, and age range fields to the visit (knock) data model and recording flow. These fields capture basic demographic info about the person at the door for later analytics.

Purpose: Enable demographic tracking per knock so Cal can analyze patterns (e.g., which demographics are most receptive).
Output: Database migration, updated types, demographics inputs in the post-recording flow, display in dashboard detail views.
</objective>

<execution_context>
@/Users/caldayham/.claude/get-shit-done/workflows/execute-plan.md
@/Users/caldayham/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- Key types and contracts the executor needs -->

From src/lib/types.ts:
```typescript
export type Visit = {
  id: string;
  session_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  audio_path: string | null;
  audio_mime_type: string | null;
  audio_duration_seconds: number | null;
  transcript: string | null;
  notes: string | null;
  result: string | null;
  manually_added: boolean;
  recorded_at: string;
  created_at: string;
};
```

From src/actions/visits.ts:
```typescript
export async function updateVisitResult(visitId: string, result: string, notes?: string): Promise<void>;
```

From src/components/recording/ResultPicker.tsx:
```typescript
interface ResultPickerProps {
  tags: ResultTag[];
  onSelect: (result: string, notes?: string) => void;
  isSubmitting: boolean;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add demographics columns and update types/actions</name>
  <files>supabase/migrations/005_visit_demographics.sql, src/lib/types.ts, src/actions/visits.ts</files>
  <action>
1. Create `supabase/migrations/005_visit_demographics.sql`:
   - `ALTER TABLE visits ADD COLUMN contact_name TEXT;`
   - `ALTER TABLE visits ADD COLUMN gender TEXT CHECK (gender IN ('Male', 'Female', 'Unknown'));`
   - `ALTER TABLE visits ADD COLUMN age_range TEXT CHECK (age_range IN ('<30', '30-50', '50-70', '>70'));`
   - `ALTER TABLE visits ADD COLUMN occupancy TEXT CHECK (occupancy IN ('Homeowner', 'Renter', 'Unknown'));`
   All four columns are nullable (optional fields).

2. Update `src/lib/types.ts` Visit type: add `contact_name: string | null`, `gender: string | null`, `age_range: string | null`, `occupancy: string | null` fields.

3. Update `src/actions/visits.ts`:
   - Modify `updateVisitResult` to accept an optional 4th parameter `demographics?: { contact_name?: string; gender?: string; age_range?: string; occupancy?: string }`. When provided, include these fields in the update object alongside result and notes.
   - Also update `createManualVisit` data parameter to accept optional `contact_name`, `gender`, `age_range`, `occupancy` and pass them through to the insert.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Migration file exists with 3 new columns. Visit type includes contact_name, gender, age_range. updateVisitResult accepts demographics. TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Add demographics inputs to ResultPicker and display in dashboard</name>
  <files>src/components/recording/ResultPicker.tsx, src/app/record/page.tsx, src/components/dashboard/VisitDetail.tsx, src/components/dashboard/MobileVisitDetail.tsx</files>
  <action>
1. Update `ResultPicker` component:
   - Change `onSelect` prop type to `(result: string, notes?: string, demographics?: { contact_name?: string; gender?: string; age_range?: string }) => void`.
   - Add state for `contactName` (string), `gender` (string | null), `ageRange` (string | null).
   - After the result tag buttons and before the notes textarea, add a demographics section:
     - A text input for name (placeholder "Name (optional)"), styled like the existing notes textarea but single-line.
     - A row of 3 pill buttons for gender: Male, Female, Unknown. Tapping toggles selection (highlight with a neutral blue/zinc color, not result tag colors). Tapping the already-selected one deselects it.
     - A row of 4 pill buttons for age range: <30, 30-50, 50-70, >70. Same toggle behavior.
   - Pass demographics to `onSelect` in `handleConfirm`.
   - Style: Use `bg-white/10 border border-white/20 text-white` for unselected pills, `bg-white text-black` for selected. Keep pills compact (py-1.5 px-3 text-xs rounded-full).

2. Update `src/app/record/page.tsx`:
   - Update `handleResultSelect` to accept the demographics parameter and pass it through to `updateVisitResult`.
   - Update the stashed `pendingResultRef` to also store demographics.

3. Update `src/components/dashboard/VisitDetail.tsx`:
   - After the result tag display and before the duration line, add a row showing demographics if any are present. Use `User` icon from lucide-react. Format: "{contact_name} - {gender}, {age_range}" (omit parts that are null). Only render the row if at least one demographic field is non-null.

4. Update `src/components/dashboard/MobileVisitDetail.tsx`:
   - Same demographics display row as VisitDetail, using same logic and lucide User icon.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>ResultPicker shows name input + gender/age pills after result selection. Demographics flow through to updateVisitResult. Dashboard detail views display demographics when present. TypeScript compiles clean.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- Migration file exists at `supabase/migrations/005_visit_demographics.sql`
- Visit type has contact_name, gender, age_range fields
- ResultPicker renders name input, gender pills (Male/Female/Unknown), age range pills (<30/30-50/50-70/>70)
- Dashboard detail views conditionally show demographics
</verification>

<success_criteria>
- Database migration adds contact_name, gender, age_range columns to visits table
- Post-recording flow allows optional entry of name, gender, and age range
- Demographics are saved via updateVisitResult
- Dashboard visit details display demographics when present
- All TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-gender-and-age-range-fields-to-knock/1-SUMMARY.md`
</output>
