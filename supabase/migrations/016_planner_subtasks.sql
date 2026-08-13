-- Add subtask support to planner tasks
-- Enhances workspace_items table for hierarchical task management

ALTER TABLE public.workspace_items
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.workspace_items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Index for parent-child relationships
CREATE INDEX IF NOT EXISTS idx_workspace_items_parent_id ON public.workspace_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_workspace_items_is_completed ON public.workspace_items(is_completed);

-- Add comment
COMMENT ON COLUMN public.workspace_items.parent_id IS 'Parent task ID for subtasks (null for top-level tasks)';
COMMENT ON COLUMN public.workspace_items.is_completed IS 'Whether the task is completed';
COMMENT ON COLUMN public.workspace_items.completed_at IS 'When the task was completed';
