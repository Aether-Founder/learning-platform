"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Search, Trophy, Star, Flame, Target, BookOpen, Calendar, Clock } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt: string;
  progress?: number;
  maxProgress?: number;
}

interface AchievementShowcaseProps {
  userId: string;
}

export function AchievementShowcase({ userId }: AchievementShowcaseProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/achievements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements || []);
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white";
      case "epic":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "rare":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-500/50";
      case "epic":
        return "border-purple-500/50";
      case "rare":
        return "border-blue-500/50";
      default:
        return "border-gray-500/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "streak":
        return <Flame className="w-5 h-5" />;
      case "study":
        return <BookOpen className="w-5 h-5" />;
      case "time":
        return <Clock className="w-5 h-5" />;
      case "score":
        return <Target className="w-5 h-5" />;
      case "social":
        return <Calendar className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const filteredAchievements = achievements.filter((achievement) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unlocked" && achievement.unlockedAt) ||
      (filter === "locked" && !achievement.unlockedAt);

    const matchesCategory =
      categoryFilter === "all" || achievement.category === categoryFilter;

    const matchesSearch =
      searchQuery === "" ||
      achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(achievements.map((a) => a.category)));

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;
  const totalCount = achievements.length;
  const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prestaties</CardTitle>
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
        <h2 className="text-2xl font-bold">Prestaties</h2>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Trophy className="w-4 h-4 mr-2" />
          {unlockedCount}/{totalCount}
        </Badge>
      </div>

      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Award className="w-12 h-12 text-yellow-500" />
              <div>
                <div className="text-lg font-semibold">Prestatie Voortgang</div>
                <div className="text-sm text-muted-foreground">
                  Je hebt {completionRate}% van alle prestaties ontgrendeld
                </div>
              </div>
            </div>
            <div className="text-4xl font-bold text-yellow-500">{completionRate}%</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek prestaties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={(value: "all" | "unlocked" | "locked") => setFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="unlocked">Ontgrendeld</SelectItem>
            <SelectItem value="locked">Vergrendeld</SelectItem>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAchievements.map((achievement) => {
          const isUnlocked = !!achievement.unlockedAt;
          const progress = achievement.progress && achievement.maxProgress
            ? Math.round((achievement.progress / achievement.maxProgress) * 100)
            : 0;

          return (
            <Card
              key={achievement.id}
              className={`${getRarityBorder(achievement.rarity)} ${
                isUnlocked ? "opacity-100" : "opacity-60 grayscale"
              } hover:scale-105 transition-transform cursor-pointer`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-full ${getRarityColor(achievement.rarity)} flex items-center justify-center`}>
                    {getCategoryIcon(achievement.category)}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {achievement.rarity}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-1">{achievement.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                
                {!isUnlocked && progress > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Voortgang</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {isUnlocked && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Ontgrendeld op {new Date(achievement.unlockedAt).toLocaleDateString('nl-NL')}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Geen Prestaties</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || categoryFilter !== "all" || filter !== "all"
                ? "Probeer andere filters"
                : "Begin met studeren om prestaties te ontgrendelen!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
