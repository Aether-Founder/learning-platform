"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, AlertCircle, CheckCircle2, MoreHorizontal, ArrowUpDown } from "lucide-react";

interface Homework {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  testWeekId?: string;
}

interface HomeworkWidgetProps {
  userId: string;
  testWeekId?: string;
}

export function HomeworkWidget({ userId, testWeekId }: HomeworkWidgetProps) {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "subject">("priority");

  useEffect(() => {
    fetchHomework();
  }, [userId, testWeekId]);

  const fetchHomework = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = testWeekId 
        ? `/api/homework?testWeekId=${testWeekId}`
        : `/api/homework?status=pending`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHomework(data.homework || []);
      }
    } catch (error) {
      console.error("Failed to fetch homework:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (homeworkId: string, completed: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/homework/${homeworkId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        setHomework(homework.map((hw) => 
          hw.id === homeworkId ? { ...hw, completed } : hw
        ));
      }
    } catch (error) {
      console.error("Failed to update homework:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Hoog";
      case "medium":
        return "Middel";
      case "low":
        return "Laag";
      default:
        return priority;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const pendingHomework = homework.filter((hw) => !hw.completed);
  const completedHomework = homework.filter((hw) => hw.completed);

  const sortHomework = (items: Homework[]) => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === "dueDate") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === "subject") {
        return a.subject.localeCompare(b.subject);
      }
      return 0;
    });
    return sorted;
  };

  const sortedPending = sortHomework(pendingHomework);
  const sortedCompleted = sortHomework(completedHomework);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Huiswerk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Huiswerk</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {pendingHomework.length} openstaand
            </Badge>
            <Select value={sortBy} onValueChange={(value: "priority" | "dueDate" | "subject") => setSortBy(value)}>
              <SelectTrigger className="w-32 h-8">
                <ArrowUpDown className="w-3 h-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Prioriteit</SelectItem>
                <SelectItem value="dueDate">Datum</SelectItem>
                <SelectItem value="subject">Vak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {homework.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Geen huiswerk gevonden
          </div>
        ) : (
          <div className="space-y-3">
            {pendingHomework.map((hw) => (
              <div
                key={hw.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={hw.completed}
                  onCheckedChange={(checked: boolean) => toggleComplete(hw.id, checked)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{hw.title}</span>
                    <Badge className={getPriorityColor(hw.priority)}>
                      {getPriorityLabel(hw.priority)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(hw.dueDate)}</span>
                    </div>
                    {isOverdue(hw.dueDate) && (
                      <div className="flex items-center gap-1 text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>Overtijd</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {hw.subject}
                  </div>
                </div>
              </div>
            ))}
            
            {completedHomework.length > 0 && (
              <>
                <div className="border-t my-3" />
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Voltooid ({completedHomework.length})
                </div>
                {sortedCompleted.map((hw) => (
                  <div
                    key={hw.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 opacity-60"
                  >
                    <Checkbox checked={true} disabled className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate line-through">{hw.title}</span>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(hw.dueDate)} • {hw.subject}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
