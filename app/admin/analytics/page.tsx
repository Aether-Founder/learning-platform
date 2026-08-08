'use client';

import { useState } from 'react';
import { Clock, Users, BookOpen, Activity, Lock } from 'lucide-react';

interface DashboardData {
  summary: {
    totalUsers: number;
    totalSessions: number;
    totalEvents: number;
    totalHours: number;
    activeUsers: number;
    flashcardFlips: number;
    flashcardAnswers: number;
  };
  users: Array<{
    id: string;
    name: string;
    email?: string;
    hours: number;
    sessionCount: number;
    firstSeen: number;
    lastSeen: number;
  }>;
  eventCounts: Record<string, number>;
  dailyStats: Array<{
    date: string;
    events: number;
    sessions: number;
    uniqueUsers: number;
  }>;
  recentEvents: Array<{
    userId: string;
    sessionId: string;
    eventType: string;
    timestamp: number;
    data?: any;
  }>;
}

export default function AnalyticsDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analytics/dashboard', {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
        setIsAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(2);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="Enter admin password"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">User activity and engagement metrics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{data.summary.totalUsers}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {data.summary.activeUsers} active (7d)
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground">Total Hours</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {formatHours(data.summary.totalHours)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {data.summary.totalSessions} sessions
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground">Flashcard Flips</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{data.summary.flashcardFlips}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {data.summary.flashcardAnswers} answers
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground">Total Events</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{data.summary.totalEvents}</div>
            <div className="text-sm text-muted-foreground mt-1">All interactions</div>
          </div>
        </div>

        {/* Event Counts */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Event Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.eventCounts).map(([eventType, count]) => (
              <div key={eventType} className="bg-secondary/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">{eventType}</div>
                <div className="text-2xl font-bold text-foreground">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Top Users by Time Spent</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Hours
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Sessions
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    First Seen
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Last Seen
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.users.slice(0, 20).map((user) => (
                  <tr key={user.id} className="border-b border-border/50">
                    <td className="py-3 px-4 text-sm text-foreground">{user.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {user.email || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">{formatHours(user.hours)}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{user.sessionCount}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDate(user.firstSeen)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDate(user.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Stats */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Daily Activity (Last 30 Days)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Events
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Sessions
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Unique Users
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.dailyStats.map((stat) => (
                  <tr key={stat.date} className="border-b border-border/50">
                    <td className="py-3 px-4 text-sm text-foreground">{stat.date}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{stat.events}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{stat.sessions}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{stat.uniqueUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Events (Last 50)</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.recentEvents.map((event, index) => (
              <div key={index} className="bg-secondary/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{event.eventType}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  User: {event.userId.slice(0, 8)}... | Session: {event.sessionId.slice(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
