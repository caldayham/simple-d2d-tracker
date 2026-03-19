-- User settings table for per-user configuration (result tags, etc.)
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  result_tags JSONB DEFAULT '[
    {"name": "Interested", "color": "#16a34a"},
    {"name": "Not Interested", "color": "#71717a"},
    {"name": "Not Home", "color": "#ca8a04"},
    {"name": "Booked Consult", "color": "#2563eb"},
    {"name": "Come Back Later", "color": "#f97316"}
  ]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User owns settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);
