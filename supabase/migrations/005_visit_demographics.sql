-- Add demographic fields to visits table
ALTER TABLE visits ADD COLUMN contact_name TEXT;
ALTER TABLE visits ADD COLUMN gender TEXT CHECK (gender IN ('Male', 'Female', 'Unknown'));
ALTER TABLE visits ADD COLUMN age_range TEXT CHECK (age_range IN ('<30', '30-50', '50-70', '>70'));
ALTER TABLE visits ADD COLUMN occupancy TEXT CHECK (occupancy IN ('Homeowner', 'Renter', 'Unknown'));
