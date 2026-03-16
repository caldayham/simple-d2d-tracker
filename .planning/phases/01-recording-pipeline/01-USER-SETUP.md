# Phase 1: User Setup Required

**Generated:** 2026-03-16
**Phase:** 01-recording-pipeline
**Status:** Incomplete

Complete these items for the recording pipeline to function. Claude automated everything possible; these items require human access to external dashboards/accounts.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard -> Project Settings -> API -> Project URL | `.env.local` |
| [ ] | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard -> Project Settings -> API -> anon/public key | `.env.local` |

## Account Setup

- [ ] **Create a Supabase project**
  - URL: https://supabase.com/dashboard -> New project
  - Skip if: Already have a Supabase project for this app

## Dashboard Configuration

- [ ] **Create a user account for login**
  - Location: Supabase Dashboard -> Authentication -> Users -> Add user
  - Create with: Email and password (this is the account you'll log in with)

- [ ] **Create private 'audio' storage bucket**
  - Location: Supabase Dashboard -> Storage -> New bucket
  - Name: `audio`
  - Public: OFF
  - File size limit: 50MB
  - Allowed MIME types: `audio/*`

- [ ] **Run the database migration**
  - Location: Supabase Dashboard -> SQL Editor
  - Paste contents of `supabase/migrations/001_schema.sql` and run
  - Or use: `supabase db push` if you have the Supabase CLI linked

## Verification

After completing setup:

```bash
# Create .env.local from example
cp .env.local.example .env.local
# Then edit .env.local with your actual Supabase URL and anon key

# Verify build passes
npm run build

# Start dev server and test login
npm run dev
# Visit http://localhost:3000 -- should redirect to /login
# Log in with credentials you created above
```

Expected results:
- Build passes with no errors
- Login redirects to /record page after successful auth
- Supabase Dashboard shows the session in the sessions table after starting a canvassing session

---

**Once all items complete:** Mark status as "Complete" at top of file.
