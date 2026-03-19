-- Planned Routes: Unify planned and executed routes in sessions/visits tables
-- Sessions with started=false are planned routes; started=true are executed runs.
-- Planned knocks are visit records with null audio/recorded_at fields.

-- Add started flag to sessions (default true so existing sessions are unaffected)
ALTER TABLE sessions ADD COLUMN started BOOLEAN NOT NULL DEFAULT true;

-- Make recorded_at nullable so planned knocks don't need a recording timestamp
ALTER TABLE visits ALTER COLUMN recorded_at DROP NOT NULL;
