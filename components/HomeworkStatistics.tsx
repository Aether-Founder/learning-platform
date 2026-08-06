"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, TrendingUp, TrendingDown, Calendar, BookOpen } from "lucide-react";

interface HomeworkStats {
  totalHomework: number;
  completedHomework: number;
  pendingHomework: number;
  overdueHomework: number;
  completionRate: number;
  averageCompletionTime: number;
  subjectBreakdown: Array<{
    subject: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    completed: number;
    total: number;
  }>;
}

interface HomeworkStatisticsProps {
  userId: string;
  testWeekId?: string;
}

export function HomeworkStatistics({ userId, testWeekId }: HomeworkStatisticsProps) {
  const [stats, setStats] = useState<HomeworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    fetchStats();
  }, [userId, testWeekId, timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = testWeekId 
        ? `/api/homework/stats?testWeekId=${testWeekId}&timeRange=${timeRange}`
        : `/api/homework/stats?timeRange=${timeRange}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch homework stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Huiswerk Statistieken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Huiswerk Statistieken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Geen statistieken beschikbaar</div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Huiswerk Statistieken</h2>
        <Select value={timeRange} onValueChange={(value: "week" | "month" | "all") => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Deze Week</SelectItem>
            <SelectItem value="month">Deze Maand</SelectItem>
            <SelectItem value="all">Alles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totaal</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHomework}</div>
            <p className="text-xs text-muted-foreground">huiswerkopdrachten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voltooid</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedHomework}</div>
            <p className="text-xs text-muted-foreground">{stats.completionRate}% voltooiingspercentage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Openstaand</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingHomework}</div>
            <p className="text-xs text-muted-foreground">nog te doen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overtijd</CardTitle>
            <Calendar className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueHomework}</div>
            <p className="text-xs text-muted-foreground">deadline gemist</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Voltooiingspercentage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Algemeen</span>
                <span className="text-sm font-bold">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
            </div>
            
            {stats.subjectBreakdown.map((subject) => (
              <div key={subject.subject}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{subject.subject}</span>
                  <span className="text-sm font-bold">{subject.completionRate}%</span>
                </div>
                <Progress value={subject.completionRate} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {subject.completed}/{subject.total} voltooid
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wekelijkse Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.weeklyTrend.map((week, index) => {
                const prevWeek = stats.weeklyTrend[index - 1];
                const trendIcon = prevWeek ? getTrendIcon(week.completed, prevWeek.completed) : null;
                const weekRate = week.total > 0 ? Math.round((week.completed / week.total) * 100) : 0;
                
                return (
                  <div key={week.week} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{week.week}</span>
                      {trendIcon}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={weekRate >= 80 ? "default" : weekRate >= 50 ? "secondary" : "destructive"}>
                        {weekRate}%
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {week.completed}/{week.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gemiddelde Voltooiingstijd</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {stats.averageCompletionTime > 0 
              ? `${Math.round(stats.averageCompletionTime / 60)} min`
              : "N/A"
            }
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Gemiddelde tijd om een huiswerkopdracht te voltooien
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
