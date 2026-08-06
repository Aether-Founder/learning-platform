"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, TrendingUp, Award } from "lucide-react";

interface HomeworkStreak {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  streakHistory: Array<{
    date: string;
    completed: boolean;
    onTime: boolean;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
  }>;
}

interface HomeworkStreaksProps {
  userId: string;
}

export function HomeworkStreaks({ userId }: HomeworkStreaksProps) {
  const [streak, setStreak] = useState<HomeworkStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, [userId]);

  const fetchStreak = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/homework/streaks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStreak(data.streak);
      }
    } catch (error) {
      console.error("Failed to fetch homework streaks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Huiswerk Streaks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    );
  }

  if (!streak) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Huiswerk Streaks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Geen streaks beschikbaar</div>
        </CardContent>
      </Card>
    );
  }

  const getStreakColor = (days: number) => {
    if (days >= 30) return "text-purple-500";
    if (days >= 14) return "text-orange-500";
    if (days >= 7) return "text-yellow-500";
    return "text-blue-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Huiswerk Streaks</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Huidige Streak</CardTitle>
            <Flame className={`w-4 h-4 ${getStreakColor(streak.currentStreak)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getStreakColor(streak.currentStreak)}`}>
              {streak.currentStreak}
            </div>
            <p className="text-xs text-muted-foreground">dagen op rij</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Langste Streak</CardTitle>
            <Award className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {streak.longestStreak}
            </div>
            <p className="text-xs text-muted-foreground">dagen record</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totaal Dagen</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {streak.totalDays}
            </div>
            <p className="text-xs text-muted-foreground">met voltooid huiswerk</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Streak Geschiedenis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {streak.streakHistory.slice(-28).map((day, index) => {
              const isToday = index === streak.streakHistory.length - 1;
              return (
                <div
                  key={day.date}
                  className={`flex flex-col items-center p-2 rounded-lg border ${
                    day.completed && day.onTime
                      ? "bg-green-500/20 border-green-500"
                      : day.completed && !day.onTime
                      ? "bg-yellow-500/20 border-yellow-500"
                      : "bg-muted/30 border-muted"
                  } ${isToday ? "ring-2 ring-primary" : ""}`}
                  title={`${formatDate(day.date)}: ${day.completed ? (day.onTime ? 'Op tijd' : 'Te laat') : 'Niet voltooid'}`}
                >
                  <span className="text-xs font-medium">
                    {new Date(day.date).getDate()}
                  </span>
                  <div className="w-2 h-2 rounded-full mt-1">
                    {day.completed ? (
                      <div className={`w-2 h-2 rounded-full ${day.onTime ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Op tijd</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Te laat</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span>Niet voltooid</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {streak.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Behaalde Prestaties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {streak.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {formatDate(achievement.unlockedAt)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {streak.currentStreak > 0 && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Flame className={`w-8 h-8 ${getStreakColor(streak.currentStreak)}`} />
              <div>
                <div className="text-lg font-semibold">
                  Ga zo door! Je bent op een {streak.currentStreak}-dagen streak!
                </div>
                <p className="text-sm text-muted-foreground">
                  {streak.longestStreak - streak.currentStreak > 0
                    ? `Nog ${streak.longestStreak - streak.currentStreak} dagen om je record te breken`
                    : "Je hebt je record al gebroken!"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
