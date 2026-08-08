'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target, Clock, Star, BookOpen, FileText, Zap } from 'lucide-react';

interface ModeStats {
  mode: string;
  sessions: number;
  totalCards: number;
  correctAnswers: number;
  averageAccuracy: number;
  averageTime: number;
  averageScore: number;
}

interface StudyModeComparisonProps {
  userId: string;
}

export function StudyModeComparison({ userId }: StudyModeComparisonProps) {
  const [modeStats, setModeStats] = useState<ModeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModeStats();
  }, [userId]);

  const fetchModeStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/analytics/mode-comparison', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModeStats(data.modeStats || []);
      }
    } catch (error) {
      console.error('Failed to fetch mode stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'learn':
        return <BookOpen className="w-5 h-5" />;
      case 'test':
        return <FileText className="w-5 h-5" />;
      case 'match':
        return <Target className="w-5 h-5" />;
      case 'gravity':
        return <Zap className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'learn':
        return 'bg-blue-500';
      case 'test':
        return 'bg-green-500';
      case 'match':
        return 'bg-purple-500';
      case 'gravity':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBestMode = () => {
    if (modeStats.length === 0) return null;
    return modeStats.reduce((best, current) =>
      current.averageAccuracy > best.averageAccuracy ? current : best
    );
  };

  const bestMode = getBestMode();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Studiemode Vergelijking</CardTitle>
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
        <h2 className="text-2xl font-bold">Studiemode Vergelijking</h2>
        <Badge variant="secondary">{modeStats.length} modes</Badge>
      </div>

      {bestMode && (
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Star className="w-8 h-8 text-yellow-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Beste Prestatie: {bestMode.mode}</h3>
                <p className="text-sm text-muted-foreground">
                  Je presteert het beste in {bestMode.mode} mode met een gemiddelde nauwkeurigheid
                  van {bestMode.averageAccuracy.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modeStats.map((stats) => (
          <Card key={stats.mode}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getModeColor(stats.mode)}/20`}>
                    {getModeIcon(stats.mode)}
                  </div>
                  {stats.mode.charAt(0).toUpperCase() + stats.mode.slice(1)}
                </CardTitle>
                <Badge variant="outline">{stats.sessions} sessies</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Nauwkeurigheid</span>
                  <span className="font-semibold">{stats.averageAccuracy.toFixed(1)}%</span>
                </div>
                <Progress value={stats.averageAccuracy} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Gemiddelde Score</span>
                  <span className="font-semibold">{stats.averageScore.toFixed(0)}</span>
                </div>
                <Progress value={(stats.averageScore / 100) * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Kaarten</div>
                    <div className="font-semibold">{stats.totalCards}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Tijd/kaart</div>
                    <div className="font-semibold">{stats.averageTime.toFixed(1)}s</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Correct</span>
                  <span className="font-medium text-green-500">
                    {stats.correctAnswers}/{stats.totalCards}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {modeStats.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Geen Data</h3>
            <p className="text-sm text-muted-foreground">
              Voltooi studie sessies om prestatievergelijking te zien
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <TrendingUp className="w-8 h-8 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Over Prestatievergelijking</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Vergelijk nauwkeurigheid tussen verschillende studiemodes</li>
                <li>• Identificeer welke mode het beste voor je werkt</li>
                <li>• Bekijk tijd per kaart om efficiëntie te meten</li>
                <li>• Gebruik deze inzichten om je studiestrategie aan te passen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
