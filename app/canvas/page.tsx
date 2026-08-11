'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  ElementId,
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Plus, Save } from 'lucide-react';

type CanvasNodeData = {
  label: string;
  content?: string;
  type: 'text' | 'note' | 'image';
};

type CanvasNodeType = Node<CanvasNodeData>;

export default function CanvasPage() {
  const supabase = createClientComponentClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize or load canvas
    const initCanvas = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to load existing canvas or create new one
      const { data: existing } = await supabase
        .from('canvas_boards')
        .select('id, layout')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        setCanvasId(existing.id);
        if (existing.layout) {
          const layout = existing.layout as { nodes: CanvasNodeType[]; edges: Edge[] };
          setNodes(layout.nodes || []);
          setEdges(layout.edges || []);
        }
      } else {
        // Create new canvas
        const { data: newCanvas } = await supabase
          .from('canvas_boards')
          .insert({ user_id: user.id, name: 'My Canvas' })
          .select()
          .single();
        setCanvasId(newCanvas?.id || null);
      }
    };

    initCanvas();
  }, [supabase, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    const newNode: CanvasNodeType = {
      id: crypto.randomUUID(),
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: 'New Note', content: '', type: 'text' },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const saveCanvas = useCallback(async () => {
    if (!canvasId) return;
    setSaving(true);
    try {
      await supabase
        .from('canvas_boards')
        .update({
          layout: { nodes, edges },
          updated_at: new Date().toISOString(),
        })
        .eq('id', canvasId);
    } catch (error) {
      console.error('Failed to save canvas:', error);
    } finally {
      setSaving(false);
    }
  }, [canvasId, nodes, edges, supabase]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (nodes.length > 0 || edges.length > 0) {
        saveCanvas();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [nodes, edges, saveCanvas]);

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-white dark:bg-gray-900">
        <h1 className="font-semibold text-gray-900 dark:text-white">Infinite Canvas</h1>
        <div className="flex gap-2">
          <button
            onClick={addNode}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            <Plus size={16} /> Add Node
          </button>
          <button
            onClick={saveCanvas}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Background color="#888" gap={15} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
