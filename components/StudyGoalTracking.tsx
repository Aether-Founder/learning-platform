'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Target, Plus, CheckCircle2, Calendar, Clock } from 'lucide-react';

interface StudyGoal {
  id: string;
  title: string;
  description: string;
  goalType: 'daily' | 'weekly' | 'monthly' | 'custom';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  createdAt: string;
  completed: boolean;
}

interface StudyGoalTrackingProps {
  userId: string;
}

export function StudyGoalTracking({ userId }: StudyGoalTrackingProps) {
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    goalType: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    targetValue: 0,
    unit: 'minuten',
    deadline: '',
  });

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/study-goals', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Failed to fetch study goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/study-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newGoal),
      });

      if (response.ok) {
        setShowAddDialog(false);
        setNewGoal({
          title: '',
          description: '',
          goalType: 'daily',
          targetValue: 0,
          unit: 'minuten',
          deadline: '',
        });
        fetchGoals();
      }
    } catch (error) {
      console.error('Failed to add study goal:', error);
    }
  };

  const handleUpdateProgress = async (goalId: string, value: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/study-goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentValue: value }),
      });

      if (response.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error('Failed to update goal progress:', error);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/study-goals/${goalId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error('Failed to complete goal:', error);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Dagelijks';
      case 'weekly':
        return 'Wekelijks';
      case 'monthly':
        return 'Maandelijks';
      case 'custom':
        return 'Aangepast';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Studie Doelen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Studie Doelen</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nieuw Doel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuw Studie Doel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Bijv. 30 minuten per dag studeren"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschrijving</Label>
                <Input
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Beschrijf je doel..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goalType">Type</Label>
                  <Select
                    value={newGoal.goalType}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'custom') =>
                      setNewGoal({ ...newGoal, goalType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Dagelijks</SelectItem>
                      <SelectItem value="weekly">Wekelijks</SelectItem>
                      <SelectItem value="monthly">Maandelijks</SelectItem>
                      <SelectItem value="custom">Aangepast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unit">Eenheid</Label>
                  <Select
                    value={newGoal.unit}
                    onValueChange={(value) => setNewGoal({ ...newGoal, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minuten">Minuten</SelectItem>
                      <SelectItem value="uren">Uren</SelectItem>
                      <SelectItem value="kaarten">Kaarten</SelectItem>
                      <SelectItem value="sets">Sets</SelectItem>
                      <SelectItem value="testen">Testen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue">Doelwaarde *</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={newGoal.targetValue}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) || 0 })
                    }
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddGoal} className="w-full">
                Doel Toevoegen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nog geen studie doelen</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Maak je eerste studie doel om je voortgang bij te houden
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Maak Doel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal.currentValue, goal.targetValue);
            const isOverdue =
              goal.deadline && new Date(goal.deadline) < new Date() && !goal.completed;

            return (
              <Card key={goal.id} className={goal.completed ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        {goal.completed && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Voltooid
                          </Badge>
                        )}
                        <Badge variant="secondary">{getGoalTypeLabel(goal.goalType)}</Badge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                    </div>
                    {!goal.completed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteGoal(goal.id)}
                      >
                        Voltooien
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Voortgang</span>
                      <span className="text-sm font-bold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      {goal.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className={isOverdue ? 'text-red-500' : ''}>
                            {formatDate(goal.deadline)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(goal.createdAt)}</span>
                      </div>
                    </div>
                    {!goal.completed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateProgress(goal.id, goal.currentValue + 1)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        +1
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
