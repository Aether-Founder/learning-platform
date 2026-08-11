-- ============================================================================
-- TABLE: workspace_items (Obsidian-style file tree for Notes)
-- ============================================================================
CREATE TABLE public.workspace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('map', 'page')),
  parent_id UUID REFERENCES public.workspace_items(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast tree queries
CREATE INDEX idx_workspace_items_user_id ON public.workspace_items(user_id);
CREATE INDEX idx_workspace_items_parent_id ON public.workspace_items(parent_id);
CREATE INDEX idx_workspace_items_order ON public.workspace_items(user_id, parent_id, order_index);

-- Enable RLS
ALTER TABLE public.workspace_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workspace items"
  ON public.workspace_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workspace items"
  ON public.workspace_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspace items"
  ON public.workspace_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspace items"
  ON public.workspace_items FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_workspace_items_updated_at BEFORE UPDATE ON public.workspace_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
