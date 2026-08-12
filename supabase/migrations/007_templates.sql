-- Templates System
-- Allows users to save and instantiate workspace templates

CREATE TABLE IF NOT EXISTS user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL, -- Full workspace structure: pages, databases, blocks, etc.
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick template lookup
CREATE INDEX idx_user_templates_user ON user_templates(user_id);

-- RLS Policies
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON user_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON user_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON user_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON user_templates FOR DELETE USING (auth.uid() = user_id);

-- Allow viewing public templates
CREATE POLICY "Anyone can view public templates" ON user_templates FOR SELECT USING (is_public = true);
