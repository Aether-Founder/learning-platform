"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, TrendingDown, BookOpen, Clock, Target, Award } from "lucide-react";

interface ClassAnalytics {
  classId: string;
  className: string;
  totalStudents: number;
  activeStudents: number;
  averageScore: number;
  averageStudyTime: number;
  completionRate: number;
  subjectBreakdown: Array<{
    subject: string;
    averageScore: number;
    totalCards: number;
    studiedCards: number;
  }>;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    score: number;
    studyTime: number;
  }>;
  weeklyProgress: Array<{
    week: string;
    averageScore: number;
    studyTime: number;
    activeStudents: number;
  }>;
  assignmentStats: {
    totalAssignments: number;
    completedAssignments: number;
    averageCompletionTime: number;
  };
}

interface ClassAnalyticsProps {
  classId: string;
}

export function ClassAnalytics({ classId }: ClassAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    fetchAnalytics();
  }, [classId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/classes/${classId}/analytics?timeRange=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch class analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Klas Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Klas Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Geen analyse beschikbaar</div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}u ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{analytics.className} - Analyse</h2>
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
            <CardTitle className="text-sm font-medium">Studenten</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeStudents}</div>
            <p className="text-xs text-muted-foreground">van {analytics.totalStudents} actief</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde Score</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.averageScore)}%</div>
            <p className="text-xs text-muted-foreground">klas gemiddelde</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Studietijd</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(analytics.averageStudyTime)}</div>
            <p className="text-xs text-muted-foreground">per student</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voltooiing</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.completionRate)}%</div>
            <p className="text-xs text-muted-foreground">gemiddeld</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vak Overzicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.subjectBreakdown.map((subject) => (
              <div key={subject.subject}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{subject.subject}</span>
                  <span className="text-sm font-bold">{Math.round(subject.averageScore)}%</span>
                </div>
                <Progress value={subject.averageScore} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {subject.studiedCards}/{subject.totalCards} kaarten bestudeerd
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opdracht Statistieken</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Totale Opdrachten</span>
              <Badge variant="secondary">{analytics.assignmentStats.totalAssignments}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Voltooid</span>
              <Badge variant="default">{analytics.assignmentStats.completedAssignments}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Gemiddelde Voltooiingstijd</span>
              <Badge variant="outline">{formatTime(analytics.assignmentStats.averageCompletionTime)}</Badge>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Voltooiingspercentage</span>
                <span className="text-sm font-bold">
                  {Math.round((analytics.assignmentStats.completedAssignments / analytics.assignmentStats.totalAssignments) * 100)}%
                </span>
              </div>
              <Progress 
                value={(analytics.assignmentStats.completedAssignments / analytics.assignmentStats.totalAssignments) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topPerformers.map((student, index) => (
              <div
                key={student.studentId}
                className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{student.studentName}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(student.studyTime)} studietijd
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-500">
                  {Math.round(student.score)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wekelijkse Voortgang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.weeklyProgress.map((week, index) => {
              const prevWeek = analytics.weeklyProgress[index - 1];
              const scoreTrend = prevWeek ? getTrendIcon(week.averageScore, prevWeek.averageScore) : null;
              const activityTrend = prevWeek ? getTrendIcon(week.activeStudents, prevWeek.activeStudents) : null;
              
              return (
                <div key={week.week} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-20">{week.week}</span>
                    <div className="flex items-center gap-2">
                      {scoreTrend}
                      <span className="text-sm">{Math.round(week.averageScore)}% score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activityTrend}
                      <span className="text-sm">{week.activeStudents} actief</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(week.studyTime)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
