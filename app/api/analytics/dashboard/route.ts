import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data', 'analytics');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Read JSON file
async function readJsonFile(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return filename === 'events.json' ? [] : {};
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin password in headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read all data
    const users = await readJsonFile('users.json');
    const sessions = await readJsonFile('sessions.json');
    const events = await readJsonFile('events.json');

    // Calculate metrics
    const totalUsers = Object.keys(users).length;
    const totalSessions = Object.keys(sessions).length;
    const totalEvents = events.length;

    // Calculate total hours
    const totalDurationMs = Object.values(users).reduce(
      (sum: number, user: any) => sum + (user.totalDuration || 0),
      0
    );
    const totalHours = totalDurationMs / (1000 * 60 * 60);

    // Calculate hours per user
    const usersWithHours = Object.values(users).map((user: any) => ({
      id: user.id,
      name: user.name || 'Anonymous',
      email: user.email,
      hours: (user.totalDuration || 0) / (1000 * 60 * 60),
      sessionCount: user.sessionCount || 0,
      firstSeen: user.firstSeen,
      lastSeen: user.lastSeen,
    }));

    // Calculate event counts by type
    const eventCounts = events.reduce((acc: any, event: any) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    // Calculate flashcard stats
    const flashcardFlips = eventCounts['flashcard_flip'] || 0;
    const flashcardAnswers = eventCounts['flashcard_answer'] || 0;

    // Calculate active users (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeUsers = Object.values(users).filter(
      (user: any) => user.lastSeen > sevenDaysAgo
    ).length;

    // Calculate daily stats for the last 30 days
    const dailyStats: any = {};
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    events.forEach((event: any) => {
      if (event.timestamp > thirtyDaysAgo) {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            events: 0,
            sessions: 0,
            users: new Set(),
          };
        }
        dailyStats[date].events++;
        dailyStats[date].users.add(event.userId);
        if (event.eventType === 'session_start') {
          dailyStats[date].sessions++;
        }
      }
    });

    // Convert Set to count
    Object.keys(dailyStats).forEach((date) => {
      dailyStats[date].uniqueUsers = dailyStats[date].users.size;
      delete dailyStats[date].users;
    });

    // Sort by date
    const sortedDailyStats = Object.values(dailyStats).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      summary: {
        totalUsers,
        totalSessions,
        totalEvents,
        totalHours: Math.round(totalHours * 100) / 100,
        activeUsers,
        flashcardFlips,
        flashcardAnswers,
      },
      users: usersWithHours.sort((a: any, b: any) => b.hours - a.hours),
      eventCounts,
      dailyStats: sortedDailyStats,
      recentEvents: events.slice(-50).reverse(),
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
