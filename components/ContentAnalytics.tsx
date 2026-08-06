"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Eye, Download, Share2, Clock, FileText, Users } from "lucide-react";

interface ContentAnalytics {
  totalContent: number;
  totalViews: number;
  totalDownloads: number;
  totalShares: number;
  averageRating: number;
  topContent: Array<{
    id: string;
    title: string;
    type: string;
    views: number;
    downloads: number;
    rating: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    views: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    views: number;
    downloads: number;
  }>;
}

interface ContentAnalyticsProps {
  userId: string;
}

export function ContentAnalytics({ userId }: ContentAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("all");

  useEffect(() => {
    fetchAnalytics();
  }, [userId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/content/analytics?timeRange=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch content analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Analyse</CardTitle>
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
          <CardTitle>Content Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Geen analyse beschikbaar</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Analyse</h2>
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
            <CardTitle className="text-sm font-medium">Totaal Content</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalContent}</div>
            <p className="text-xs text-muted-foreground">items geüpload</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totale Weergaven</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews}</div>
            <p className="text-xs text-muted-foreground">totaal bekeken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">totaal gedownload</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde Rating</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.averageRating * 10) / 10}</div>
            <p className="text-xs text-muted-foreground">van 5 sterren</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Categorie Overzicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.categoryBreakdown.map((category) => (
              <div key={category.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{category.category}</span>
                  <span className="text-sm font-bold">{category.views} weergaven</span>
                </div>
                <Progress value={(category.views / analytics.totalViews) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {category.count} items
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Statistieken</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Totaal Shares</span>
              <Badge variant="secondary">{analytics.totalShares}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Views per Item</span>
              <Badge variant="default">
                {Math.round(analytics.totalViews / analytics.totalContent)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Downloads per Item</span>
              <Badge variant="outline">
                {Math.round(analytics.totalDownloads / analytics.totalContent)}
              </Badge>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Engagement Rate</span>
                <span className="text-sm font-bold">
                  {Math.round(((analytics.totalDownloads + analytics.totalShares) / analytics.totalViews) * 100)}%
                </span>
              </div>
              <Progress 
                value={((analytics.totalDownloads + analytics.totalShares) / analytics.totalViews) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topContent.map((content, index) => (
              <div
                key={content.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{content.title}</span>
                    <Badge variant="secondary">{content.type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{content.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      <span>{content.downloads}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {Math.round(content.rating * 10) / 10} ★
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wekelijkse Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.weeklyTrends.map((week, index) => {
              const prevWeek = analytics.weeklyTrends[index - 1];
              const viewsTrend = prevWeek ? getTrendIcon(week.views, prevWeek.views) : null;
              const downloadsTrend = prevWeek ? getTrendIcon(week.downloads, prevWeek.downloads) : null;
              
              return (
                <div key={week.week} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-20">{week.week}</span>
                    <div className="flex items-center gap-2">
                      {viewsTrend}
                      <span className="text-sm">{week.views} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {downloadsTrend}
                      <span className="text-sm">{week.downloads} downloads</span>
                    </div>
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
