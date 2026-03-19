-- Add sort_order to visits for manual reordering of planned knocks
ALTER TABLE visits ADD COLUMN sort_order INTEGER;
