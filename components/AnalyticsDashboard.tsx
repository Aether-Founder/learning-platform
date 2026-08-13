'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, BookOpen, Trophy, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { fetchJson, getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface UserAnalytics {
  userId: string;
  totalStudyTime: number;
  totalCardsStudied: number;
  totalTestsCompleted: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  totalStudySets: number;
  totalHomeworkCompleted: number;
  totalHomeworkPending: number;
  totalStudyPlans: number;
  achievementsUnlocked: number;
  weeklyActivity: Array<{ date: string; activity: number }>;
  subjectBreakdown: Array<{ subject: string; cardsStudied: number; timeSpent: number }>;
}

interface AnalyticsDashboardProps {
  userId: string;
}

export function AnalyticsDashboard({ userId: _userId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');

  const loadAnalytics = useCallback(async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const data = await fetchJson<{ analytics: UserAnalytics }>(
        `/api/analytics?timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnalytics(data.analytics);
    } catch (err) {
      logger.error('Error loading analytics', err, { timeRange });
      setError(getErrorMessage(err, 'Analytics konden niet worden geladen'));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={loadAnalytics}>
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Geen analytics gegevens beschikbaar</div>
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}u ${mins}m`;
    }
    return `${mins}m`;
  };

  const maxActivity = Math.max(...analytics.weeklyActivity.map((a) => a.activity), 1);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
              size="sm"
            >
              {range === 'day'
                ? 'Dag'
                : range === 'week'
                  ? 'Week'
                  : range === 'month'
                    ? 'Maand'
                    : 'Jaar'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totale Studietijd</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(analytics.totalStudyTime)}</div>
            <p className="text-xs text-muted-foreground">
              Deze{' '}
              {timeRange === 'day'
                ? 'dag'
                : timeRange === 'week'
                  ? 'week'
                  : timeRange === 'month'
                    ? 'maand'
                    : 'jaar'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kaarten Gestudeerd</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCardsStudied}</div>
            <p className="text-xs text-muted-foreground">Totaal aantal kaarten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Huidige Streak</CardTitle>
            <Flame className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Langste: {analytics.longestStreak} dagen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prestaties</CardTitle>
            <Trophy className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.achievementsUnlocked}</div>
            <p className="text-xs text-muted-foreground">Ontgrendelde prestaties</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Wekelijkse Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.weeklyActivity.map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('nl-NL', { weekday: 'short' });
              const percentage = (day.activity / maxActivity) * 100;

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 text-sm text-muted-foreground">{dayName}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-muted rounded-md overflow-hidden relative">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {day.activity}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subject Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Studie Set Overzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.subjectBreakdown.map((subject, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{subject.subject}</span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{subject.cardsStudied} kaarten</span>
                    <span>{formatTime(subject.timeSpent)}</span>
                  </div>
                </div>
                <Progress
                  value={(subject.cardsStudied / analytics.totalCardsStudied) * 100 || 0}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Studie Sets</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudySets}</div>
            <p className="text-xs text-muted-foreground">Totaal aantal sets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Huiswerk</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalHomeworkCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalHomeworkPending} in behandeling
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Studie Plannen</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudyPlans}</div>
            <p className="text-xs text-muted-foreground">Actieve plannen</p>
          </CardContent>
        </Card>
      </div>

      {/* Tests Stats */}
      {analytics.totalTestsCompleted > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Test Statistieken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{analytics.totalTestsCompleted}</div>
                <p className="text-sm text-muted-foreground">Tests voltooid</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{analytics.averageScore}%</div>
                <p className="text-sm text-muted-foreground">Gemiddelde score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
