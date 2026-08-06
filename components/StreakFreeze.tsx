"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Snowflake, Flame, Clock, Shield } from "lucide-react";

interface StreakFreezeProps {
  currentStreak: number;
  hasFreeze: boolean;
  freezeCount: number;
  onActivateFreeze: () => void;
}

export function StreakFreeze({ 
  currentStreak, 
  hasFreeze, 
  freezeCount, 
  onActivateFreeze 
}: StreakFreezeProps) {
  const [timeUntilFreeze, setTimeUntilFreeze] = useState<number | null>(null);
  const [freezeActive, setFreezeActive] = useState(false);

  useEffect(() => {
    // Check if freeze is currently active
    const checkFreezeStatus = () => {
      const freezeExpiry = localStorage.getItem("streakFreezeExpiry");
      if (freezeExpiry) {
        const expiryTime = new Date(freezeExpiry).getTime();
        const now = new Date().getTime();
        const remaining = expiryTime - now;
        
        if (remaining > 0) {
          setTimeUntilFreeze(remaining);
          setFreezeActive(true);
        } else {
          setTimeUntilFreeze(null);
          setFreezeActive(false);
          localStorage.removeItem("streakFreezeExpiry");
        }
      }
    };

    checkFreezeStatus();
    const interval = setInterval(checkFreezeStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleActivateFreeze = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/streak/freeze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const expiryTime = new Date(data.expiry).getTime();
        localStorage.setItem("streakFreezeExpiry", data.expiry);
        setTimeUntilFreeze(expiryTime - new Date().getTime());
        setFreezeActive(true);
        onActivateFreeze();
      }
    } catch (error) {
      console.error("Failed to activate freeze:", error);
    }
  };

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}u ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getStreakColor = (days: number) => {
    if (days >= 30) return "text-purple-500";
    if (days >= 14) return "text-orange-500";
    if (days >= 7) return "text-yellow-500";
    return "text-blue-500";
  };

  return (
    <Card className={freezeActive ? "bg-blue-500/10 border-blue-500/30" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-blue-500" />
          Streak Bevriezing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className={`w-6 h-6 ${getStreakColor(currentStreak)}`} />
            <span className="text-2xl font-bold">{currentStreak}</span>
            <span className="text-sm text-muted-foreground">dagen streak</span>
          </div>
          {hasFreeze && !freezeActive && (
            <Badge variant="secondary" className="bg-blue-500 text-white">
              <Shield className="w-3 h-3 mr-1" />
              {freezeCount} beschikbaar
            </Badge>
          )}
        </div>

        {freezeActive && timeUntilFreeze !== null ? (
          <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-blue-500">Bevriezing Actief</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Je streak is beschermd voor:
            </p>
            <div className="text-2xl font-bold text-blue-500">
              {formatTime(timeUntilFreeze)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Je streak wordt niet gereset als je vandaag niet studeert.
            </p>
          </div>
        ) : hasFreeze ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Activeer een streak bevriezing om je streak te beschermen voor 24 uur.
              Dit is handig als je weet dat je niet kunt studeren.
            </p>
            <Button 
              onClick={handleActivateFreeze} 
              className="w-full"
              disabled={freezeActive}
            >
              <Snowflake className="w-4 h-4 mr-2" />
              Activeer Bevriezing
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Geen Bevriezingen</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Je hebt geen streak bevriezingen beschikbaar. Verdien meer door je streak te verlengen!
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Bevriezingen beschermen je streak voor 24 uur</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
