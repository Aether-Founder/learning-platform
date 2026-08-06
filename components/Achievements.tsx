"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, Flame, BookOpen, Users, Target } from "lucide-react";

interface Achievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date | null;
  progress: number;
  maxProgress: number;
  createdAt: Date;
}

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxProgress: number;
  category: "streak" | "study" | "social" | "mastery";
}

interface AchievementsProps {
  userId: string;
}

export function Achievements({ userId }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [definitions, setDefinitions] = useState<AchievementDefinition[]>([]);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/achievements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setAchievements(data.achievements || []);
      setDefinitions(data.definitions || []);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === "unlocked" && !achievement.unlockedAt) return false;
    if (filter === "locked" && achievement.unlockedAt) return false;
    
    if (categoryFilter !== "all") {
      const definition = definitions.find(d => d.id === achievement.achievementId);
      if (definition?.category !== categoryFilter) return false;
    }
    
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "streak":
        return <Flame className="w-4 h-4" />;
      case "study":
        return <BookOpen className="w-4 h-4" />;
      case "social":
        return <Users className="w-4 h-4" />;
      case "mastery":
        return <Target className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "streak":
        return "bg-orange-500";
      case "study":
        return "bg-blue-500";
      case "social":
        return "bg-green-500";
      case "mastery":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Prestaties
        </h1>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {unlockedCount}/{totalCount}
        </Badge>
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Voortgang</span>
          <span className="text-sm text-muted-foreground">{completionPercentage}% voltooid</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          Alle
        </Button>
        <Button
          variant={filter === "unlocked" ? "default" : "outline"}
          onClick={() => setFilter("unlocked")}
          size="sm"
        >
          Ontgrendeld
        </Button>
        <Button
          variant={filter === "locked" ? "default" : "outline"}
          onClick={() => setFilter("locked")}
          size="sm"
        >
          Vergrendeld
        </Button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={categoryFilter === "all" ? "default" : "outline"}
          onClick={() => setCategoryFilter("all")}
          size="sm"
        >
          Alle categorieën
        </Button>
        <Button
          variant={categoryFilter === "streak" ? "default" : "outline"}
          onClick={() => setCategoryFilter("streak")}
          size="sm"
        >
          <Flame className="w-4 h-4 mr-1" />
          Streak
        </Button>
        <Button
          variant={categoryFilter === "study" ? "default" : "outline"}
          onClick={() => setCategoryFilter("study")}
          size="sm"
        >
          <BookOpen className="w-4 h-4 mr-1" />
          Studie
        </Button>
        <Button
          variant={categoryFilter === "social" ? "default" : "outline"}
          onClick={() => setCategoryFilter("social")}
          size="sm"
        >
          <Users className="w-4 h-4 mr-1" />
          Sociaal
        </Button>
        <Button
          variant={categoryFilter === "mastery" ? "default" : "outline"}
          onClick={() => setCategoryFilter("mastery")}
          size="sm"
        >
          <Target className="w-4 h-4 mr-1" />
          Meesterschap
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map(achievement => {
          const definition = definitions.find(d => d.id === achievement.achievementId);
          if (!definition) return null;

          const isUnlocked = achievement.unlockedAt !== null;
          const progressPercentage = Math.round((achievement.progress / achievement.maxProgress) * 100);

          return (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border ${
                isUnlocked
                  ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800"
                  : "bg-card border-border opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{definition.icon}</div>
                {isUnlocked ? (
                  <Badge className="bg-yellow-500 text-white">
                    <Trophy className="w-3 h-3 mr-1" />
                    Ontgrendeld
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Lock className="w-3 h-3 mr-1" />
                    Vergrendeld
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold mb-1">{definition.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{definition.description}</p>

              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1 rounded ${getCategoryColor(definition.category)} text-white`}>
                  {getCategoryIcon(definition.category)}
                </div>
                <span className="text-xs text-muted-foreground capitalize">{definition.category}</span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Voortgang</span>
                  <span className="font-medium">
                    {achievement.progress}/{achievement.maxProgress}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-1" />
              </div>

              {isUnlocked && achievement.unlockedAt && (
                <div className="mt-3 text-xs text-muted-foreground">
                  Ontgrendeld op: {new Date(achievement.unlockedAt).toLocaleDateString("nl-NL")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Geen prestaties gevonden</p>
        </div>
      )}
    </div>
  );
}
