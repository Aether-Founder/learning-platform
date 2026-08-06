"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, TrendingUp, TrendingDown, Calendar, Clock, CheckCircle2, Circle } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  category: "study" | "streak" | "score" | "time";
  status: "active" | "completed" | "expired";
  createdAt: string;
}

interface GoalProgressTrackingProps {
  userId: string;
}

export function GoalProgressTracking({ userId }: GoalProgressTrackingProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "expired">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/goals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/goals/${goalId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error("Failed to complete goal:", error);
    }
  };

  const getProgress = (goal: Goal) => {
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffMs <= 0) return "Verlopen";
    if (diffDays > 0) return `${diffDays} dagen`;
    return `${diffHours} uur`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "study":
        return <Target className="w-4 h-4" />;
      case "streak":
        return <TrendingUp className="w-4 h-4" />;
      case "score":
        return <CheckCircle2 className="w-4 h-4" />;
      case "time":
        return <Clock className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "study":
        return "bg-blue-500";
      case "streak":
        return "bg-orange-500";
      case "score":
        return "bg-green-500";
      case "time":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredGoals = goals.filter((goal) => {
    const matchesFilter =
      filter === "all" || goal.status === filter;
    const matchesCategory =
      categoryFilter === "all" || goal.category === categoryFilter;
    return matchesFilter && matchesCategory;
  });

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const totalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + getProgress(g), 0) / activeGoals.length)
    : 0;

  const categories = Array.from(new Set(goals.map((g) => g.category)));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doel Voortgang</CardTitle>
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
        <h2 className="text-2xl font-bold">Doel Voortgang</h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value: "all" | "active" | "completed" | "expired") => setFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="active">Actief</SelectItem>
              <SelectItem value="completed">Voltooid</SelectItem>
              <SelectItem value="expired">Verlopen</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Categorieën</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actieve Doelen</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">in uitvoering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voltooid</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals.length}</div>
            <p className="text-xs text-muted-foreground">doelen behaald</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde Voortgang</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProgress}%</div>
            <p className="text-xs text-muted-foreground">van alle doelen</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredGoals.map((goal) => {
          const progress = getProgress(goal);
          const isCompleted = goal.status === "completed";
          const isExpired = goal.status === "expired";
          const timeRemaining = getTimeRemaining(goal.deadline);

          return (
            <Card
              key={goal.id}
              className={`${isCompleted ? "bg-green-500/10 border-green-500/30" : isExpired ? "bg-red-500/10 border-red-500/30" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full ${getCategoryColor(goal.category)} flex items-center justify-center text-white`}>
                        {getCategoryIcon(goal.category)}
                      </div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      <Badge variant={isCompleted ? "default" : isExpired ? "destructive" : "secondary"}>
                        {goal.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                  </div>
                  {!isCompleted && !isExpired && (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteGoal(goal.id)}
                      disabled={progress < 100}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Voltooi
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
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
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {new Date(goal.deadline).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className={isExpired ? "text-red-500 font-medium" : ""}>
                        {timeRemaining}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGoals.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Geen Doelen</h3>
            <p className="text-sm text-muted-foreground">
              {filter !== "all" || categoryFilter !== "all"
                ? "Probeer andere filters"
                : "Maak je eerste doel om te beginnen met het bijhouden van je voortgang!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
