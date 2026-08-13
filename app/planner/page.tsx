'use client';

import { useState, useEffect } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase as browserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/useTranslation';
import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const supabase = browserClient as any;

type TaskStatus = 'todo' | 'bezig' | 'review' | 'klaar';

type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  subject?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
};

const STATUS_KEYS: Record<TaskStatus, string> = {
  todo: 'planner_status_todo',
  bezig: 'planner_status_doing',
  review: 'planner_status_review',
  klaar: 'planner_status_done',
};

const STATUS_ORDER: TaskStatus[] = ['todo', 'bezig', 'review', 'klaar'];

function SortableTask({ task, onEdit, onDelete, onMove }: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <h3 className="font-medium text-sm">{task.title}</h3>
            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}
            {task.subject && (
              <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
                {task.subject}
              </span>
            )}
            {task.priority && (
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                task.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                'bg-green-500/10 text-green-600'
              }`}>
                {task.priority === 'high' ? 'Hoog' : task.priority === 'medium' ? 'Middel' : 'Laag'}
              </span>
            )}
            {task.due_date && (
              <p className="mt-2 text-xs text-muted-foreground">
                Due: {new Date(task.due_date).toLocaleDateString('nl-NL')}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-secondary"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => onMove(task.id, s)}
            disabled={s === task.status}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              s === task.status
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {s === 'todo' ? 'Te doen' : s === 'bezig' ? 'Bezig' : s === 'review' ? 'Review' : 'Klaar'}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    due_date: '',
    priority: 'medium',
  });
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleCreateTask = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        subject: formData.subject || null,
        due_date: formData.due_date || null,
        priority: formData.priority,
        status: 'todo',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create task:', error);
    } else if (data) {
      setTasks([data, ...tasks]);
      setShowDialog(false);
      resetForm();
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: formData.title,
        description: formData.description,
        subject: formData.subject || null,
        due_date: formData.due_date || null,
        priority: formData.priority,
      })
      .eq('id', editingTask.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update task:', error);
    } else if (data) {
      setTasks(tasks.map(t => t.id === editingTask.id ? data : t));
      setShowDialog(false);
      setEditingTask(null);
      resetForm();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Weet je zeker dat je deze taak wilt verwijderen?')) return;

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      console.error('Failed to delete task:', error);
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Failed to move task:', error);
    } else {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    if (taskId === overId) return;

    const task = tasks.find(t => t.id === taskId);
    const overTask = tasks.find(t => t.id === overId);

    if (task && overTask && task.status !== overTask.status) {
      await handleMoveTask(taskId, overTask.status);
    }
  };

  const openCreateDialog = () => {
    setEditingTask(null);
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      subject: task.subject || '',
      due_date: task.due_date || '',
      priority: task.priority || 'medium',
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', subject: '', due_date: '', priority: 'medium' });
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(t => t.status === status);
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          eyebrow={t('planner_eyebrow')}
          title={t('planner_title')}
          description={t('planner_description')}
        />
        <div className="mt-10 text-center text-sm text-muted-foreground">Laden...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('planner_eyebrow')}
        title={t('planner_title')}
        description={t('planner_description')}
        action={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t('planner_new_task')}
          </Button>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const statusTasks = getTasksByStatus(status);
            return (
              <div key={status} className="min-w-0">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">{t(STATUS_KEYS[status])}</h2>
                  <span className="text-xs text-muted-foreground">{statusTasks.length}</span>
                </div>
                <SortableContext items={statusTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {statusTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('planner_empty')}</p>
                    ) : (
                      statusTasks.map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          onEdit={openEditDialog}
                          onDelete={handleDeleteTask}
                          onMove={handleMoveTask}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
              <h3 className="font-medium text-sm">{activeTask.title}</h3>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Taak bewerken' : 'Nieuwe taak'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Titel</Label>
              <Input
                id="task-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Taak titel"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Beschrijving</Label>
              <Textarea
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Taak beschrijving"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="task-subject">Vak</Label>
              <Input
                id="task-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Bijv. Wiskunde"
              />
            </div>
            <div>
              <Label htmlFor="task-due-date">Deadline</Label>
              <Input
                id="task-due-date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="task-priority">Prioriteit</Label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="low">Laag</option>
                <option value="medium">Middel</option>
                <option value="high">Hoog</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuleren
            </Button>
            <Button onClick={editingTask ? handleUpdateTask : handleCreateTask}>
              {editingTask ? 'Bijwerken' : 'Aanmaken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}