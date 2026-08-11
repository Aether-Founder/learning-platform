-- Notion-Style Database Engine
-- Creates tables for custom databases, properties, entries, and views

-- 1. Databases (Containers)
CREATE TABLE IF NOT EXISTS notion_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_page_id UUID REFERENCES workspace_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Properties (Columns)
CREATE TABLE IF NOT EXISTS notion_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID REFERENCES notion_databases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'select', 'multi_select', 'date', 'checkbox', 'url', 'relation', 'rollup', 'formula')),
  config JSONB DEFAULT '{}', -- Stores options for select, formula strings, relation targets
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Entries (Rows)
CREATE TABLE IF NOT EXISTS notion_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID REFERENCES notion_databases(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Property Values (Cells)
CREATE TABLE IF NOT EXISTS notion_property_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES notion_entries(id) ON DELETE CASCADE,
  property_id UUID REFERENCES notion_properties(id) ON DELETE CASCADE,
  value JSONB, -- Flexible storage for any property type
  UNIQUE(entry_id, property_id)
);

-- 5. Views (Saved Configurations)
CREATE TABLE IF NOT EXISTS notion_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID REFERENCES notion_databases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('table', 'kanban', 'calendar', 'gallery', 'list', 'timeline')),
  filters JSONB DEFAULT '[]',
  sort_config JSONB DEFAULT '[]',
  visible_properties UUID[] DEFAULT '{}',
  group_by_property_id UUID REFERENCES notion_properties(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notion_databases_user ON notion_databases(user_id);
CREATE INDEX idx_notion_properties_db ON notion_properties(database_id);
CREATE INDEX idx_notion_entries_db ON notion_entries(database_id);
CREATE INDEX idx_notion_values_entry ON notion_property_values(entry_id);
CREATE INDEX idx_notion_views_db ON notion_views(database_id);

-- RLS Policies
ALTER TABLE notion_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_property_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own databases" ON notion_databases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own databases" ON notion_databases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own databases" ON notion_databases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own databases" ON notion_databases FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view properties of own databases" ON notion_properties FOR SELECT USING (
  EXISTS (SELECT 1 FROM notion_databases WHERE id = database_id AND user_id = auth.uid())
);
CREATE POLICY "Users can modify properties of own databases" ON notion_properties FOR ALL USING (
  EXISTS (SELECT 1 FROM notion_databases WHERE id = database_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view entries of own databases" ON notion_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM notion_databases WHERE id = database_id AND user_id = auth.uid())
);
CREATE POLICY "Users can modify entries of own databases" ON notion_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM notion_databases WHERE id = database_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view values of own entries" ON notion_property_values FOR SELECT USING (
  EXISTS (SELECT 1 FROM notion_entries e JOIN notion_databases d ON e.database_id = d.id WHERE e.id = entry_id AND d.user_id = auth.uid())
);
CREATE POLICY "Users can modify values of own entries" ON notion_property_values FOR ALL USING (
  EXISTS (SELECT 1 FROM notion_entries e JOIN notion_databases d ON e.database_id = d.id WHERE e.id = entry_id AND d.user_id = auth.uid())
);

CREATE POLICY "Users can view views of own databases" ON notion_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM notion_databases WHERE id = database_id AND user_id = auth.uid())
);
CREATE POLICY "Users can modify views of own databases" ON notion_views FOR ALL USING (
  EXISTS (SELECT 1 FROM notion_databases WHERE id = database_id AND user_id = auth.uid())
);
