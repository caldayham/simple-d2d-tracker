-- Add result field to visits (outcome of the door knock)
ALTER TABLE visits ADD COLUMN result TEXT;

-- Add label field to sessions (human-readable identifier)
ALTER TABLE sessions ADD COLUMN label TEXT;
