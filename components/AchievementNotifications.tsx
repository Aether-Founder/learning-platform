"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, X, Sparkles } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  onShare?: () => void;
}

function AchievementNotification({ achievement, onDismiss, onShare }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Card
      className={`fixed top-4 right-4 z-50 w-80 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">Prestatie Ontgrendeld!</h4>
            </div>
            <p className="font-medium text-sm">{achievement.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {onShare && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3"
            onClick={onShare}
          >
            Deel Prestatie
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface AchievementNotificationsProps {
  userId: string;
}

export function AchievementNotifications({ userId }: AchievementNotificationsProps) {
  const [notifications, setNotifications] = useState<Achievement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check for new achievements periodically
    const checkAchievements = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/achievements/new", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const newAchievements = data.achievements.filter(
            (a: Achievement) => !dismissedIds.has(a.id)
          );
          
          if (newAchievements.length > 0) {
            setNotifications((prev) => [...prev, ...newAchievements]);
          }
        }
      } catch (error) {
        console.error("Failed to check achievements:", error);
      }
    };

    checkAchievements();
    const interval = setInterval(checkAchievements, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [userId, dismissedIds]);

  const handleDismiss = (achievementId: string) => {
    setDismissedIds((prev) => new Set([...prev, achievementId]));
    setNotifications((prev) => prev.filter((a) => a.id !== achievementId));
  };

  const handleShare = (achievement: Achievement) => {
    if (navigator.share) {
      navigator.share({
        title: `Ik heb een prestatie behaald: ${achievement.name}!`,
        text: achievement.description,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="space-y-2">
      {notifications.map((achievement) => (
        <AchievementNotification
          key={achievement.id}
          achievement={achievement}
          onDismiss={() => handleDismiss(achievement.id)}
          onShare={() => handleShare(achievement)}
        />
      ))}
    </div>
  );
}
