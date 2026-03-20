-- Practice nodes: draggable text boxes on the mind-map canvas
CREATE TABLE practice_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users,
  content text NOT NULL DEFAULT '',
  x double precision NOT NULL DEFAULT 100,
  y double precision NOT NULL DEFAULT 100,
  width double precision NOT NULL DEFAULT 200,
  height double precision NOT NULL DEFAULT 120,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE practice_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own practice nodes"
  ON practice_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own practice nodes"
  ON practice_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own practice nodes"
  ON practice_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own practice nodes"
  ON practice_nodes FOR DELETE USING (auth.uid() = user_id);

-- Practice connections: lines between nodes
CREATE TABLE practice_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users,
  from_node_id uuid NOT NULL REFERENCES practice_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES practice_nodes(id) ON DELETE CASCADE,
  from_anchor text NOT NULL,
  to_anchor text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_connect CHECK (from_node_id != to_node_id)
);

ALTER TABLE practice_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own practice connections"
  ON practice_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own practice connections"
  ON practice_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own practice connections"
  ON practice_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own practice connections"
  ON practice_connections FOR DELETE USING (auth.uid() = user_id);
